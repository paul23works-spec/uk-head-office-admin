import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vendors = await prisma.vendor.findMany({
      orderBy: { companyName: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
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
    const { vendorId, companyName, contactInfo, address, category } = body;

    if (!vendorId || !companyName) {
      return NextResponse.json({ success: false, error: 'Missing required fields: vendorId, companyName' }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        vendorId,
        companyName,
        contactInfo,
        address,
        category
      }
    });

    return NextResponse.json({
      success: true,
      data: vendor,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Vendor ID must be unique' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
