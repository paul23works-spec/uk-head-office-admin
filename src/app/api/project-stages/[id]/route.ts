import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { canEditStageServer } from '@/lib/permissions-server';
import prisma from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stageId } = await params;
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // The frontend sends the logical stage name (e.g. "01", "02") which is stored
    // on the ProjectStage record. Let's find the stage.
    const stage = await prisma.projectStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: 'Stage not found' }, { status: 404 });
    }

    // Check server-side authorization
    const isAuthorized = await canEditStageServer(user, stage.name);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updatedStage = await prisma.projectStage.update({
      where: { id: stageId },
      data: {
        status: body.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.employeeId,
        action: 'UPDATE_STAGE',
        entityType: 'ProjectStage',
        entityId: stage.id,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedStage,
    });
  } catch (error: any) {
    console.error('Error updating project stage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
