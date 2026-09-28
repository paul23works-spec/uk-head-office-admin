import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- RUNNING DB RUNTIME VERIFICATION ---');
  try {
    // 1. Verify Users / Employees
    const employees = await prisma.employee.findMany({
      include: { role: true, department: true }
    });
    console.log(`✅ Fetched ${employees.length} employees from DB.`);

    // 2. Verify Projects
    const projects = await prisma.project.findMany({
      include: { stages: true }
    });
    console.log(`✅ Fetched ${projects.length} projects from DB.`);

    // 3. Verify Leaves & Delegations
    const leaves = await prisma.leave.findMany();
    console.log(`✅ Fetched ${leaves.length} leaves from DB.`);

    const delegations = await prisma.delegation.findMany();
    console.log(`✅ Fetched ${delegations.length} delegations from DB.`);

    if (employees.length === 0 || projects.length === 0) {
       throw new Error('Database is empty despite seeding!');
    }
    
    console.log('--- ALL RUNTIME CHECKS PASSED ---');
  } catch (err) {
    console.error('❌ RUNTIME TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
