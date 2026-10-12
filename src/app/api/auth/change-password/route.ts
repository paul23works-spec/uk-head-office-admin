import { NextResponse } from 'next/server';
import { getServerUser, createSession } from '@/lib/auth-server';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

const LEGACY_DEFAULT_PASSWORD = 'password';
const BCRYPT_COST_FACTOR = 12;

export function validatePasswordStrength(password: string, currentPassword?: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 10) {
    return { isValid: false, error: 'Password must be at least 10 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one digit' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  if (password.toLowerCase() === LEGACY_DEFAULT_PASSWORD) {
    return { isValid: false, error: 'Password cannot be the default temporary password' };
  }

  if (currentPassword && password === currentPassword) {
    return { isValid: false, error: 'New password must be different from current password' };
  }

  return { isValid: true };
}

export async function POST(request: Request) {
  try {
    // Only allow authenticated users (including those in restricted needsPasswordChange state)
    const sessionUser = await getServerUser({ allowPasswordChangeSession: true });

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Both current password and new password are required' },
        { status: 400 }
      );
    }

    // Server-side password policy validation
    const policyResult = validatePasswordStrength(newPassword, currentPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { success: false, error: policyResult.error },
        { status: 400 }
      );
    }

    // Re-verify current credentials against the database record
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        employee: {
          include: {
            role: true,
            department: true,
          },
        },
      },
    });

    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let isCurrentValid = false;
    const isBcryptHash = dbUser.passwordHash.startsWith('$2a$') || dbUser.passwordHash.startsWith('$2b$');

    if (isBcryptHash) {
      try {
        isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      } catch (err) {
        isCurrentValid = false;
      }
    } else if (dbUser.passwordHash === LEGACY_DEFAULT_PASSWORD) {
      const expectedBuf = Buffer.from(LEGACY_DEFAULT_PASSWORD, 'utf8');
      const actualBuf = Buffer.from(currentPassword, 'utf8');
      if (expectedBuf.length === actualBuf.length) {
        isCurrentValid = timingSafeEqual(expectedBuf, actualBuf);
      }
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the new password with bcrypt cost factor 12
    const newHash = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR);

    // Atomically and conditionally update user record matching both id and verified passwordHash
    const updateResult = await prisma.user.updateMany({
      where: {
        id: dbUser.id,
        passwordHash: dbUser.passwordHash,
      },
      data: {
        passwordHash: newHash,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Password change conflict. Please try again with current credentials.' },
        { status: 409 }
      );
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorId: dbUser.employee.employeeId,
          action: 'PASSWORD_CHANGE_SUCCESS',
          entityType: 'User',
          entityId: dbUser.id,
          metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
        },
      });
    } catch (auditErr) {
      // Safe fallback
    }

    // Issue updated session with full access (needsPasswordChange: false)
    const token = await createSession(dbUser.employee.employeeId, {
      needsPasswordChange: false,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated',
      user: {
        id: dbUser.id,
        employeeId: dbUser.employee.employeeId,
        name: dbUser.employee.name,
        role: dbUser.employee.role.name,
        department: dbUser.employee.department?.name || null,
        needsPasswordChange: false,
      },
    });

    response.cookies.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Error changing password');
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
