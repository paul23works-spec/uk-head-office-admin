const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const user = await prisma.user.findFirst({ 
    where: { employee: { employeeId: 'EMP-001' } }, 
    include: { employee: true } 
  }); 
  console.log(user); 
} 

main().finally(() => prisma.$disconnect());
