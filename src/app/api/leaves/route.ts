import { NextResponse } from 'next/server';
import { LeaveService } from '@/lib/services/leave.service';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.employeeId || !body.startDate || !body.endDate || !body.leaveType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Server-side RBAC: Only MASTER can create leave for others. Users can create for themselves.
    if (user.role !== 'MASTER' && user.employeeId !== body.employeeId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const leave = await LeaveService.createLeave({
      employeeId: body.employeeId,
      leaveType: body.leaveType,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      reason: body.reason || '',
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.employeeId,
        action: 'CREATE_LEAVE',
        entityType: 'Leave',
        entityId: leave.id,
      }
    });

    return NextResponse.json({
      success: true,
      data: leave,
    });
  } catch (error: any) {
    console.error('Error creating leave:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
