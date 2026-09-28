import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'MASTER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        employee: {
          include: {
            role: true,
            department: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        employeeId: u.employeeId,
        email: u.email,
        status: u.status,
        name: u.employee.name,
        role: u.employee.role.name,
        department: u.employee.department?.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
