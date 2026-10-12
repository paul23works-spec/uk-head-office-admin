import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/db';

function getSecretKey(): Uint8Array {
  if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET environment variable is missing in production.');
  }
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || 'super_secret_key_change_me_in_production'
  );
}

export interface SessionUser {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string | null;
  needsPasswordChange?: boolean;
}

export async function getServerUser(options?: {
  allowPasswordChangeSession?: boolean;
}): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;

  if (!token) {
    return null;
  }

  const secretKey = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const employeeId = payload.employeeId as string;
    const tokenNeedsPasswordChange = !!payload.needsPasswordChange;

    if (!employeeId) return null;

    const user = await prisma.user.findUnique({
      where: { employeeId },
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
      return null;
    }

    const needsPasswordChange = tokenNeedsPasswordChange || user.passwordHash === 'password';

    // Restrict access: sessions flagged for password change cannot access normal APIs or pages
    if (needsPasswordChange && !options?.allowPasswordChangeSession) {
      return null;
    }

    return {
      id: user.id,
      employeeId: user.employee.employeeId,
      name: user.employee.name,
      role: user.employee.role.name,
      department: user.employee.department?.name || null,
      needsPasswordChange,
    };
  } catch (error) {
    return null;
  }
}

export async function createSession(
  employeeId: string,
  options?: { needsPasswordChange?: boolean }
): Promise<string> {
  const secretKey = getSecretKey();
  const token = await new SignJWT({
    employeeId,
    needsPasswordChange: !!options?.needsPasswordChange,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);

  return token;
}
