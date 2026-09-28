import prisma from '@/lib/db';

export class LeaveService {
  static async getActiveLeaveForEmployee(employeeId: string) {
    const now = new Date();
    return prisma.leave.findFirst({
      where: {
        employee: { employeeId },
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
  }

  static async createLeave(data: {
    employeeId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    const employee = await prisma.employee.findUnique({ where: { employeeId: data.employeeId } });
    
    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.leave.create({
      data: {
        employeeId: employee.id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'ACTIVE',
      },
    });
  }
}
