import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400 });
    }

    const stages = await prisma.projectStage.findMany({
      where: { projectId },
    });

    return NextResponse.json({
      success: true,
      data: stages,
    });
  } catch (error: any) {
    console.error('Error fetching project stages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
