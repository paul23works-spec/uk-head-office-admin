import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the actual Employee database record.
    // GmailConnection.employeeId references Employee.id (UUID),
    // not Employee.employeeId (e.g. EMP-004).
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

    // Pass the Employee.id UUID through OAuth state.
    const authUrl = GmailService.getAuthUrl(employee.id);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}