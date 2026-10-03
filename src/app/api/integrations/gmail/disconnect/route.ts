import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';

export async function POST() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: {
        employeeId: user.employeeId,
      },
      select: {
        id: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    const disconnected = await GmailService.disconnect(employee.id, user.employeeId);

    if (!disconnected) {
      return NextResponse.json(
        { error: 'No Gmail connection found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
