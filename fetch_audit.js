const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLogs() {
  const logs = await prisma.auditLog.findMany({
    where: { action: 'AI_ACTION' },
    orderBy: { timestamp: 'desc' },
    take: 12,
    select: { actorId: true, entityId: true, metadata: true, timestamp: true }
  });
  console.log(JSON.stringify(logs, null, 2));
}

getLogs().catch(console.error).finally(() => prisma.$disconnect());
