const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { employee: true } });
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
