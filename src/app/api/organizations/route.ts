import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!['MASTER', 'ADMIN_A'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, type, contactInfo, address } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields: code, name, type' }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        code,
        name,
        type,
        contactInfo,
        address
      }
    });

    return NextResponse.json({
      success: true,
      data: organization,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Organization code must be unique' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
