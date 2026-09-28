import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Departments
  const deptMgmt = await prisma.department.upsert({
    where: { name: 'Management' },
    update: {},
    create: { name: 'Management' }
  })
  const deptTC = await prisma.department.upsert({
    where: { name: 'Tender & Contracts' },
    update: {},
    create: { name: 'Tender & Contracts' }
  })
  const deptPI = await prisma.department.upsert({
    where: { name: 'Procurement & Inspection' },
    update: {},
    create: { name: 'Procurement & Inspection' }
  })
  const deptDB = await prisma.department.upsert({
    where: { name: 'Dispatch & Billing' },
    update: {},
    create: { name: 'Dispatch & Billing' }
  })

  // Roles
  const roleMaster = await prisma.role.upsert({
    where: { name: 'MASTER' },
    update: {},
    create: { name: 'MASTER' }
  })
  const roleAdminA = await prisma.role.upsert({
    where: { name: 'ADMIN_A' },
    update: {},
    create: { name: 'ADMIN_A' }
  })
  const roleAdminB = await prisma.role.upsert({
    where: { name: 'ADMIN_B' },
    update: {},
    create: { name: 'ADMIN_B' }
  })
  const roleAdminC = await prisma.role.upsert({
    where: { name: 'ADMIN_C' },
    update: {},
    create: { name: 'ADMIN_C' }
  })

  // Employees & Users
  // Rajiv Sharma (MASTER)
  const empRS = await prisma.employee.upsert({
    where: { employeeId: 'EMP-001' },
    update: {},
    create: {
      employeeId: 'EMP-001',
      name: 'Rajiv Sharma',
      departmentId: deptMgmt.id,
      roleId: roleMaster.id,
      user: {
        create: {
          email: 'rajiv@ukenterprise.in',
          passwordHash: 'password' // In real app: bcrypt hash
        }
      }
    }
  })

  // Arjun Sharma (ADMIN_A)
  const empAS = await prisma.employee.upsert({
    where: { employeeId: 'EMP-002' },
    update: {},
    create: {
      employeeId: 'EMP-002',
      name: 'Arjun Sharma',
      departmentId: deptTC.id,
      roleId: roleAdminA.id,
      user: {
        create: {
          email: 'arjun@ukenterprise.in',
          passwordHash: 'password'
        }
      }
    }
  })

  // Rohan Das (ADMIN_B)
  const empRD = await prisma.employee.upsert({
    where: { employeeId: 'EMP-003' },
    update: {},
    create: {
      employeeId: 'EMP-003',
      name: 'Rohan Das',
      departmentId: deptPI.id,
      roleId: roleAdminB.id,
      user: {
        create: {
          email: 'rohan@ukenterprise.in',
          passwordHash: 'password'
        }
      }
    }
  })

  // Priya Saikia (ADMIN_C)
  const empPS = await prisma.employee.upsert({
    where: { employeeId: 'EMP-004' },
    update: {},
    create: {
      employeeId: 'EMP-004',
      name: 'Priya Saikia',
      departmentId: deptDB.id,
      roleId: roleAdminC.id,
      user: {
        create: {
          email: 'priya@ukenterprise.in',
          passwordHash: 'password'
        }
      }
    }
  })

  // Sample Project
  const project = await prisma.project.upsert({
    where: { code: 'PRJ-2024-001' },
    update: {},
    create: {
      code: 'PRJ-2024-001',
      name: 'Bongaigaon Medical College',
      client: 'Assam PWD',
      status: 'ACTIVE',
      employees: {
        connect: [{ id: empAS.id }, { id: empRD.id }, { id: empPS.id }]
      },
      stages: {
        create: [
          { stageId: '01', name: 'LOI/LOA Received', status: 'COMPLETED', createdAt: new Date() },
          { stageId: '02', name: 'CPG Agreement', status: 'PENDING' },
          { stageId: '05', name: 'Inspection Call', status: 'PENDING' },
          { stageId: '10', name: 'DI Received', status: 'PENDING' }
        ]
      }
    }
  })

  // Leave & Delegation (EMP-002 delegating to EMP-003)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.leave.create({
    data: {
      employeeId: empAS.id,
      leaveType: 'CASUAL',
      startDate: today,
      endDate: tomorrow,
      reason: 'Family event',
    }
  })

  await prisma.delegation.create({
    data: {
      grantorId: empAS.id,
      granteeId: empRD.id,
      startDate: today,
      endDate: tomorrow,
      reason: 'Covering TC stages while Arjun is away',
      createdBy: empAS.employeeId,
      status: 'ACTIVE'
    }
  })

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
