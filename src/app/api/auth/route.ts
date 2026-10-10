import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  let diagnosticStage = 'request_parsing';
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    diagnosticStage = 'credential_validation';
    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing credentials' },
        { status: 400 }
      );
    }

    diagnosticStage = 'database_user_lookup';
    // Server-side auth check
    const user = await prisma.user.findFirst({
      where: { 
        employee: { employeeId } 
      },
    });

    diagnosticStage = 'credential_check';
    // In a real system, use bcrypt.compare(password, user.passwordHash)
    // For this migration phase, we simulate success if user exists and password is 'password'
    if (!user || password !== 'password' || user.status !== 'ACTIVE') {
      diagnosticStage = 'audit_log_failed_login';
      try {
        // Create an audit log for failed login attempt safely
        await prisma.auditLog.create({
          data: {
            actorId: employeeId,
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: employeeId,
            metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
          }
        });
      } catch (auditError) {
        // Fail safely without masking the primary authentication result
        console.error('[Auth Diagnostics] Failed to write audit log');
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    diagnosticStage = 'session_creation';
    const token = await createSession(user.employeeId);
    
    diagnosticStage = 'cookie_response_creation';
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    diagnosticStage = 'audit_log_successful_login';
    // Audit log for successful login
    try {
      await prisma.auditLog.create({
        data: {
          actorId: employeeId,
          action: 'LOGIN_SUCCESS',
          entityType: 'User',
          entityId: user.id,
        }
      });
    } catch (auditError: any) {
      // Fallback audit log to console to preserve mandatory audit policy without failing auth
      console.error('[Auth Diagnostics] CRITICAL: Audit log write failed for successful login', {
        actorId: employeeId,
        errorName: auditError?.name,
        errorCode: auditError?.code,
      });
    }

    return response;
  } catch (error: any) {
    console.error(`[Auth Diagnostics] Failed at stage: ${diagnosticStage}`, {
      errorName: error?.name,
      errorCode: error?.code, // Captured if it's a PrismaClientKnownRequestError
    });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { getServerUser } = await import('@/lib/auth-server');
    const user = await getServerUser();
    if (user) {
      return NextResponse.json({ success: true, user });
    }
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_session');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
