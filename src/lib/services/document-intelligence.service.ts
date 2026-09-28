import { getSupabaseAdmin } from '@/lib/storage-server';
import prisma from '@/lib/db';
import { GoogleGenAI, Type } from '@google/genai';
import { ActionEngine } from './action-engine';

export class DocumentIntelligenceService {
  static async processDocument(documentId: string) {
    try {
      // 1. Mark as processing
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'PROCESSING' }
      });

      // 2. Fetch document
      const doc = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!doc) throw new Error('Document not found');

      // 3. Download from Supabase
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.storage
        .from('uk enterprise document')
        .download(doc.storageKey);

      if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);

      // 4. Extract text from PDF
      const buffer = Buffer.from(await data.arrayBuffer());
      let textContent = '';

      if (doc.filename.toLowerCase().endsWith('.pdf') || doc.documentType.toLowerCase().includes('pdf')) {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } else {
        textContent = "Image or non-PDF document processing is not yet supported for text extraction.";
      }

      // Check if GEMINI_API_KEY is available
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables');
      }

      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });

      // 5. Use Gemini to extract metadata (Chunked Processing)
      const CHUNK_SIZE = 30000;
      let finalMetadata: any = { documentType: null, referenceNo: null, date: null };
      
      for (let i = 0; i < textContent.length; i += CHUNK_SIZE) {
        const chunk = textContent.substring(i, i + CHUNK_SIZE);
        
        const prompt = `
          Analyze the following document text chunk and extract the following metadata.
          If a field is not found in this chunk, return null for that field.
          1. Document Type (e.g., LOI, PO, Invoice, GTP, Inspection Report, etc.)
          2. Reference Number (any official ID, letter No, PO No, etc.)
          3. Date (the official date of the document, in YYYY-MM-DD format if possible)

          Text Chunk (${i} to ${i + CHUNK_SIZE}):
          ${chunk}
        `;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                documentType: { type: Type.STRING, nullable: true },
                referenceNo: { type: Type.STRING, nullable: true },
                date: { type: Type.STRING, nullable: true }
              }
            }
          }
        });

        const extractedText = response.text;
        try {
          const chunkMetadata = JSON.parse(extractedText || '{}');
          if (!finalMetadata.documentType && chunkMetadata.documentType) finalMetadata.documentType = chunkMetadata.documentType;
          if (!finalMetadata.referenceNo && chunkMetadata.referenceNo) finalMetadata.referenceNo = chunkMetadata.referenceNo;
          if (!finalMetadata.date && chunkMetadata.date) finalMetadata.date = chunkMetadata.date;
          
          // If we found all key metadata, we can stop chunking
          if (finalMetadata.documentType && finalMetadata.referenceNo && finalMetadata.date) {
            break;
          }
        } catch (e) {
          console.error('Failed to parse Gemini JSON output for chunk', e);
        }
      }

      // If documentType is still null, default to UNKNOWN so Prisma doesn't fail if required
      const metadata = {
        documentType: finalMetadata.documentType || 'UNKNOWN',
        referenceNo: finalMetadata.referenceNo || null,
        date: finalMetadata.date || null
      };

      let parsedDate = null;
      if (metadata.date) {
        const d = new Date(metadata.date);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      // 6. Update document
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'COMPLETED',
          documentType: metadata.documentType || doc.documentType,
          referenceNo: metadata.referenceNo || null,
          date: parsedDate,
          extractedData: metadata
        }
      });

      console.log(`Successfully processed document ${documentId}`);
      
      // 7. Trigger Event-Driven Action Engine
      await ActionEngine.evaluateDocument(documentId);
      
    } catch (err: any) {
      console.error('Document intelligence error:', err);
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: { 
            processingStatus: 'FAILED',
            processingError: err.message || 'Unknown error during extraction'
          }
        });
      } catch (dbErr) {
        console.error('Failed to update document status to FAILED', dbErr);
      }
    }
  }
}
