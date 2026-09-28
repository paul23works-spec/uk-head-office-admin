import { NextResponse } from 'next/server';
import { getAnalyticsMetrics } from '@/lib/analytics-engine';

// Mock simple API key validation for BI tools. In production, use environment variables.
const POWERBI_API_KEY = process.env.POWERBI_API_KEY || 'pbi-synthetic-key-123';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== POWERBI_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await getAnalyticsMetrics();
    
    // Flatten or adapt metrics into a structure suitable for Power BI datasets
    // Power BI typically expects flat JSON arrays or a well-structured JSON schema.
    const pbiPayload = {
      dataset_timestamp: new Date().toISOString(),
      projects: metrics.projects,
      stages: metrics.stages,
      action_items: metrics.actionItems,
      documents: metrics.documents,
      organizations: metrics.organizations,
      boq: metrics.boq,
      communications: metrics.communications
    };

    return NextResponse.json(pbiPayload);
  } catch (error) {
    console.error('PowerBI Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
