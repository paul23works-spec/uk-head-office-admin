import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GoogleGenAI, Type } from '@google/genai';
import { AITools } from '@/lib/services/ai-tools';
import { AuditService } from '@/lib/services/audit.service';

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
  },
  {
    name: 'getAllOverdueActions',
    description: 'Retrieves all overdue action items across all projects accessible to the current user.'
  },
  {
    name: 'getAnalyticsSummary',
    description: 'Retrieves global analytics and operational summary data across all projects.'
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

    const genAI = new GoogleGenAI({});

    let systemInstruction = `You are a professional, helpful AI assistant for UK Enterprise's project management platform.
You are assisting ${user.name}, who has the role of ${user.role}.

The assistant must operate in TWO clearly separated modes:

1. UK ENTERPRISE MODE
For questions involving UK Enterprise, our projects, project status, documents, BOQ, vendors, organizations, action items, notifications, communications, internal analytics, or internal financial/project information:
- Use the authorized UK Enterprise internal tools whenever the answer depends on live company data.
- Never fabricate internal data.
- If the database contains no matching records, clearly say so in a natural way and offer to help with something else.
- Never use general model knowledge to answer a question about specific UK Enterprise internal data.

2. GENERAL ASSISTANT MODE
For questions that are NOT about UK Enterprise internal data, behave as a normal general-purpose AI assistant.
- Answer general questions normally. Do NOT respond by saying you are only focused on projects if the question is unrelated to UK Enterprise.
- For mixed queries (containing both internal data and general info), handle both appropriately using internal tools for the internal portion and model knowledge for the general portion.

CURRENT / REAL-TIME INFORMATION:
- You do NOT have live web search capability.
- For general questions that can be answered from model knowledge, answer normally.
- For questions requiring real-time information (e.g., today's sports scores, breaking news, live weather, current stock prices), clearly state that live information is not currently available.
- Never invent or guess current information. Do not imply you have web access.

Conversational Guidelines:
- The assistant should feel like a capable general AI assistant that also has privileged access to UK Enterprise's internal read-only information.
- Do not repeatedly remind users that you are a project-management assistant unless relevant.
- Keep responses natural, concise, professional and helpful.
- GRACEFUL FAILURES: If a tool returns an error, politely explain the limitation to the user. Do not expose raw technical JSON errors.
- RESPONSE QUALITY: Present data clearly using Markdown tables, bullet points, or bold text for emphasis.
- MULTI-TURN: If you need more context to use a tool, ask the user for clarification.`;

    if (user.role === 'MASTER' || user.role === 'ADMIN_A' || user.role === 'ADMIN_B') {
      systemInstruction += `\nAs an administrator, you may assist them with advanced operations.`;
    } else {
      systemInstruction += `\nAs a restricted user, do not provide any financial summaries, vendor payment details, or access to administrative functions. Remind the user they do not have permission if they ask.`;
    }

    // Convert frontend messages to Gemini format.
    // Handling history including tool calls and responses.
    const formattedMessages: any[] = messages.map((msg: any) => {
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'assistant' || msg.role === 'model') {
        // If it was a generic response without a tool call
        return { role: 'model', parts: [{ text: msg.content }] };
      }
      return { role: 'user', parts: [{ text: msg.content }] }; // Fallback
    });

    const maxTurns = 5;
    let turnCount = 0;

    // Invoke Gemini Model
    let response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: formattedMessages,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: ukEnterpriseTools as any }]
      }
    });

    // Loop for multi-step function calls
    while (response.functionCalls && response.functionCalls.length > 0 && turnCount < maxTurns) {
      turnCount++;
      
      // Append model's tool calls to the history
      if (response.candidates?.[0]?.content) {
        formattedMessages.push(response.candidates[0].content);
      }

      const functionResponseParts: any[] = [];

      for (const call of response.functionCalls) {
        let toolResult: any;

        try {
          const args: any = call.args || {};
          
          await AuditService.log(
            user, 
            'AI_ACTION', 
            'System', 
            call.name || 'UNKNOWN', 
            { arguments: args }
          );

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
            case 'getAllOverdueActions': toolResult = await AITools.getAllOverdueActions(user); break;
            case 'getAnalyticsSummary': toolResult = await AITools.getAnalyticsSummary(user); break;
            default: toolResult = { error: 'Unknown function call' };
          }
        } catch (err: any) {
          toolResult = { error: err.message || 'An error occurred while calling the tool' };
        }

        functionResponseParts.push({ 
          functionResponse: { name: call.name, response: { result: toolResult } } 
        });
      }

      // Provide function responses back to Gemini
      formattedMessages.push({ role: 'user', parts: functionResponseParts });

      response = await genAI.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: formattedMessages,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: ukEnterpriseTools as any }]
        }
      });
    }

    if (turnCount >= maxTurns) {
      console.warn('AI function call loop limit reached');
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
