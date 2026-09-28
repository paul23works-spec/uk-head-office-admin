import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing credentials' },
        { status: 400 }
      );
    }

    // Server-side auth check
    const user = await prisma.user.findFirst({
      where: { 
        employee: { employeeId } 
      },
    });

    // In a real system, use bcrypt.compare(password, user.passwordHash)
    // For this migration phase, we simulate success if user exists and password is 'password'
    if (!user || password !== 'password' || user.status !== 'ACTIVE') {
      // Create an audit log for failed login attempt (fire and forget)
      prisma.auditLog.create({
        data: {
          actorId: employeeId,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: employeeId,
          metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
        }
      }).catch(console.error);

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createSession(user.employeeId);
    
    // Set HTTP-only, secure cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Audit log for successful login
    await prisma.auditLog.create({
      data: {
        actorId: employeeId,
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
