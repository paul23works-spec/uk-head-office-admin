import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';
import { GmailService } from '@/lib/services/gmail.service';
import crypto from 'crypto';

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

    // Generate secure state: bind to employee ID and use a cryptographically random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const stateString = `${employee.id}:${nonce}`;

    const authUrl = GmailService.getAuthUrl(stateString);
    const response = NextResponse.redirect(authUrl);

    // Set short-lived secure cookie for CSRF protection
    response.cookies.set('oauth_state', stateString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}