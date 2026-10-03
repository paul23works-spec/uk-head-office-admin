import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import { GmailService } from '@/lib/services/gmail.service';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: 'No code provided' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: 'Invalid state' },
        { status: 400 }
      );
    }

    // Resolve the logged-in user's business employee ID
    // to the actual Employee database ID (UUID).
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

    // OAuth state must match the Employee.id UUID
    // that was placed into the authorization request.
    if (state !== employee.id) {
      return NextResponse.json(
        { error: 'Invalid state' },
        { status: 400 }
      );
    }

    await GmailService.handleCallback(code, employee.id);

    return NextResponse.redirect(
      new URL('/management/communications', req.url)
    );
  } catch (error) {
    console.error('Error handling Gmail callback:', error);

    return NextResponse.redirect(
      new URL(
        '/management/communications?error=gmail_auth_failed',
        req.url
      )
    );
  }
}