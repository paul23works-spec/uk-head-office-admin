import { NextResponse } from 'next/server';
import { getAnalyticsMetrics } from '@/lib/analytics-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const status = searchParams.get('status') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const stageCode = searchParams.get('stageCode') || undefined;

    const filters = {
      projectId,
      status,
      vendorId,
      stageCode
    };

    const metrics = await getAnalyticsMetrics(filters);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
