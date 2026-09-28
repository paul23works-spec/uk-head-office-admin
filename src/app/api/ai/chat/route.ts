import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GoogleGenAI, Type } from '@google/genai';
import { AITools } from '@/lib/services/ai-tools';

// Define the tool declarations for Gemini
const ukEnterpriseTools = [
  {
    name: 'getProjects',
    description: 'Retrieves a list of all active projects in the system.'
  },
  {
    name: 'getProjectSummary',
    description: 'Retrieves summary and stages for a specific project.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  },
  {
    name: 'getProjectStages',
    description: 'Retrieves detailed workflow stages for a specific project.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  },
  {
    name: 'getDocuments',
    description: 'Retrieves a list of documents for a project, optionally filtered by type.',
    parameters: {
      type: Type.OBJECT,
      properties: { 
        projectId: { type: Type.STRING, description: 'The project ID UUID' },
        documentType: { type: Type.STRING, description: 'Optional document type filter (e.g., INVOICE, BOQ, DRAWING)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'getDocument',
    description: 'Retrieves details and extracted metadata for a specific document.',
    parameters: {
      type: Type.OBJECT,
      properties: { documentId: { type: Type.STRING, description: 'The document ID UUID' } },
      required: ['documentId']
    }
  },
  {
    name: 'searchDocuments',
    description: 'Searches for documents in a project by filename or reference number.',
    parameters: {
      type: Type.OBJECT,
      properties: { 
        projectId: { type: Type.STRING, description: 'The project ID UUID' },
        query: { type: Type.STRING, description: 'The search query' }
      },
      required: ['projectId', 'query']
    }
  },
  {
    name: 'getOrganizations',
    description: 'Retrieves a list of all internal and external organizations/vendors.'
  },
  {
    name: 'getOrganization',
    description: 'Retrieves details for a specific organization.',
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.STRING, description: 'The organization ID UUID' } },
      required: ['id']
    }
  },
  {
    name: 'getActionItems',
    description: 'Retrieves all action items for a specific project.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  },
  {
    name: 'getOverdueActions',
    description: 'Retrieves all overdue action items for a specific project.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  },
  {
    name: 'getBOQSummary',
    description: 'Retrieves the financial Bill of Quantities (BOQ) summary for a project. Will return an error if the user is not authorized.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  },
  {
    name: 'getNotifications',
    description: 'Retrieves recent system notifications for the current user.'
  },
  {
    name: 'getCommunicationHistory',
    description: 'Retrieves the external communication log (Email, WhatsApp) for a specific project.',
    parameters: {
      type: Type.OBJECT,
      properties: { projectId: { type: Type.STRING, description: 'The project ID UUID' } },
      required: ['projectId']
    }
  }
];

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI is not configured' }, { status: 503 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'Invalid messages format' }, { status: 400 });
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    let systemInstruction = `You are a helpful AI assistant for UK Enterprise's project management platform.
You are assisting ${user.name}, who has the role of ${user.role}.
Help them navigate projects, documents, and action items using the provided tools.`;

    if (user.role === 'MASTER' || user.role === 'ADMIN_A' || user.role === 'ADMIN_B') {
      systemInstruction += `\nAs an administrator, you may assist them with advanced operations.`;
    } else {
      systemInstruction += `\nAs a restricted user, do not provide any financial summaries, vendor payment details, or access to administrative functions. Remind the user they do not have permission if they ask.`;
    }

    // Convert frontend messages to Gemini format.
    // Handling history including tool calls and responses.
    const formattedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'assistant' || msg.role === 'model') {
        // If it was a generic response without a tool call
        return { role: 'model', parts: [{ text: msg.content }] };
      }
      return { role: 'user', parts: [{ text: msg.content }] }; // Fallback
    });

    // Invoke Gemini Model
    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedMessages,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: ukEnterpriseTools as any }]
      }
    });

    // Check if Gemini invoked a tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0]; // Process first call
      let toolResult: any;

      try {
        const args: any = call.args || {};
        switch (call.name) {
          case 'getProjects': toolResult = await AITools.getProjects(user); break;
          case 'getProjectSummary': toolResult = await AITools.getProjectSummary(user, args.projectId); break;
          case 'getProjectStages': toolResult = await AITools.getProjectStages(user, args.projectId); break;
          case 'getDocuments': toolResult = await AITools.getDocuments(user, args.projectId, args.documentType); break;
          case 'getDocument': toolResult = await AITools.getDocument(user, args.documentId); break;
          case 'searchDocuments': toolResult = await AITools.searchDocuments(user, args.projectId, args.query); break;
          case 'getOrganizations': toolResult = await AITools.getOrganizations(user); break;
          case 'getOrganization': toolResult = await AITools.getOrganization(user, args.id); break;
          case 'getActionItems': toolResult = await AITools.getActionItems(user, args.projectId); break;
          case 'getOverdueActions': toolResult = await AITools.getOverdueActions(user, args.projectId); break;
          case 'getBOQSummary': toolResult = await AITools.getBOQSummary(user, args.projectId); break;
          case 'getNotifications': toolResult = await AITools.getNotifications(user); break;
          case 'getCommunicationHistory': toolResult = await AITools.getCommunicationHistory(user, args.projectId); break;
          default: toolResult = { error: 'Unknown function call' };
        }
      } catch (err: any) {
        toolResult = { error: err.message || 'An error occurred while calling the tool' };
      }

      // Provide function response back to Gemini to get the final natural language answer
      const followupResponse = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...formattedMessages,
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: toolResult } }] }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: ukEnterpriseTools as any }]
        }
      });

      return NextResponse.json({
        success: true,
        message: followupResponse.text,
      });
    }

    // Standard text response
    return NextResponse.json({
      success: true,
      message: response.text,
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
