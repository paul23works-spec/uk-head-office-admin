import { NextResponse } from 'next/server';
import { DelegationService } from '@/lib/services/delegation.service';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.grantorId || !body.granteeId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Server-side RBAC: Only MASTER can create delegations for others. Users can create for themselves.
    if (user.role !== 'MASTER' && user.employeeId !== body.grantorId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const delegation = await DelegationService.createDelegation({
      grantorId: body.grantorId,
      granteeId: body.granteeId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      reason: body.reason || '',
      createdBy: user.employeeId,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.employeeId,
        action: 'CREATE_DELEGATION',
        entityType: 'Delegation',
        entityId: delegation.id,
      }
    });

    return NextResponse.json({
      success: true,
      data: delegation,
    });
  } catch (error: any) {
    console.error('Error creating delegation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
