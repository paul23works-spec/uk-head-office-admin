import prisma from '@/lib/db';

export class EmployeeService {
  static async getEmployeeById(employeeId: string) {
    return prisma.employee.findUnique({
      where: { employeeId },
      include: {
        role: true,
        department: true,
      },
    });
  }

  static async getAllEmployees() {
    return prisma.employee.findMany({
      include: {
        role: true,
        department: true,
      },
    });
  }
}
