import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/db';

const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'super_secret_key_change_me_in_production'
);

export interface SessionUser {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string | null;
}

export async function getServerUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;

  if (!token) {
    console.log('[getServerUser] No token found in cookies');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const employeeId = payload.employeeId as string;
    
    console.log('[getServerUser] Verified token for employeeId:', employeeId);

    if (!employeeId) return null;

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: {
        employee: {
          include: {
            role: true,
            department: true,
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      console.log('[getServerUser] User not found or inactive for employeeId:', employeeId);
      return null;
    }

    return {
      id: user.id,
      employeeId: user.employee.employeeId,
      name: user.employee.name,
      role: user.employee.role.name,
      department: user.employee.department?.name || null,
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function createSession(employeeId: string): Promise<string> {
  const token = await new SignJWT({ employeeId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
  
  return token;
}
