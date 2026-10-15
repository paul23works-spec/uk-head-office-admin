import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth-server';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

const LEGACY_DEFAULT_PASSWORD = 'password';
const BCRYPT_COST_FACTOR = 12;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || body.employeeId || '').trim();
    const password = body.password;

    if (!identifier || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing credentials' },
        { status: 400 }
      );
    }

    // Server-side lookup by Employee ID or Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { employee: { employeeId: { equals: identifier, mode: 'insensitive' } } },
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
        ],
      },
      include: {
        employee: {
          include: {
            role: true,
            department: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      try {
        await prisma.auditLog.create({
          data: {
            actorId: identifier,
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: identifier,
            metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown', reason: 'unknown_or_inactive_user' },
          },
        });
      } catch (auditErr) {
        // Fail silently without blocking auth response
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let isPasswordValid = false;
    let isLegacyUpgrade = false;

    // Check if passwordHash is a temporary admin recovery bcrypt hash or existing bcrypt hash
    const TEMP_BCRYPT_PREFIX = 'TEMP_BCRYPT:';
    const isTemporaryBcrypt = user.passwordHash.startsWith(TEMP_BCRYPT_PREFIX);
    const cleanHash = isTemporaryBcrypt ? user.passwordHash.slice(TEMP_BCRYPT_PREFIX.length) : user.passwordHash;
    const isBcryptHash = cleanHash.startsWith('$2a$') || cleanHash.startsWith('$2b$');

    if (isBcryptHash) {
      try {
        isPasswordValid = await bcrypt.compare(password, cleanHash);
      } catch (compareErr) {
        isPasswordValid = false;
      }
    } else if (user.passwordHash === LEGACY_DEFAULT_PASSWORD) {
      // Explicitly identified legacy seed credential: timing-safe comparison
      const expectedBuf = Buffer.from(LEGACY_DEFAULT_PASSWORD, 'utf8');
      const actualBuf = Buffer.from(password, 'utf8');

      if (expectedBuf.length === actualBuf.length) {
        isPasswordValid = timingSafeEqual(expectedBuf, actualBuf);
      }

      if (isPasswordValid) {
        isLegacyUpgrade = true;
        try {
          // Immediately hash with bcrypt cost factor 12
          const newHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
          // Atomic update using optimistic check to prevent concurrent race conditions
          const updateResult = await prisma.user.updateMany({
            where: {
              id: user.id,
              passwordHash: LEGACY_DEFAULT_PASSWORD,
            },
            data: {
              passwordHash: newHash,
            },
          });

          if (updateResult.count === 0) {
            // Concurrent race: re-read the fresh user from DB and re-verify before issuing any session
            const freshUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                employee: {
                  include: {
                    role: true,
                    department: true,
                  },
                },
              },
            });

            if (!freshUser || freshUser.status !== 'ACTIVE') {
              return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
              );
            }

            let freshValid = false;
            if (freshUser.passwordHash.startsWith('$2a$') || freshUser.passwordHash.startsWith('$2b$')) {
              freshValid = await bcrypt.compare(password, freshUser.passwordHash);
            }
            if (!freshValid) {
              return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
              );
            }
            user = freshUser;
          }
        } catch (upgradeErr) {
          console.error('[Auth] Failed to persist upgraded password hash');
        }
      }
    } else {
      // Unrecognized non-bcrypt hash: reject to prevent arbitrary plaintext acceptance
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      try {
        await prisma.auditLog.create({
          data: {
            actorId: user.employee.employeeId,
            action: 'LOGIN_FAILED',
            entityType: 'User',
            entityId: user.id,
            metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown', reason: 'invalid_password' },
          },
        });
      } catch (auditErr) {
        // Fail silently without blocking auth response
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Require password change if authenticated via legacy shared password or temporary admin recovery hash
    const requiresPasswordChange = isTemporaryBcrypt || isLegacyUpgrade || user.passwordHash === LEGACY_DEFAULT_PASSWORD;

    // Issue signed JWT session cookie with restricted state if password change is required
    const token = await createSession(user.employeeId, {
      needsPasswordChange: requiresPasswordChange,
    });

    const safeUser = {
      id: user.id,
      employeeId: user.employee.employeeId,
      name: user.employee.name,
      role: user.employee.role.name,
      department: user.employee.department?.name || null,
      needsPasswordChange: requiresPasswordChange,
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      needsPasswordChange: requiresPasswordChange,
    });

    response.cookies.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.employee.employeeId,
          action: 'LOGIN_SUCCESS',
          entityType: 'User',
          entityId: user.id,
        },
      });
    } catch (auditErr) {
      // Safe fallback
    }

    return response;
  } catch (error: any) {
    console.error('[Auth] Internal error during authentication');
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request?: Request) {
  try {
    const { getServerUser } = await import('@/lib/auth-server');
    let tokenFromHeader: string | undefined;
    if (request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/auth_session=([^;]+)/);
        if (match) tokenFromHeader = match[1];
      }
    }
    const user = await getServerUser({
      allowPasswordChangeSession: true,
      token: tokenFromHeader,
    });
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
