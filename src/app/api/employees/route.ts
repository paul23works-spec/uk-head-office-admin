import { NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee.service';
import { getServerUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await EmployeeService.getAllEmployees();

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
