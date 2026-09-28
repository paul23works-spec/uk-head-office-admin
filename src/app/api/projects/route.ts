import { NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await ProjectService.getAllProjects();

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
