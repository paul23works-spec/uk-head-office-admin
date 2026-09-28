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

    const boqs = await prisma.bOQ.findMany({
      where: { projectId },
      include: {
        items: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: boqs,
    });
  } catch (error) {
    console.error('Error fetching BOQs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
