import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const proj = await prisma.$queryRaw`SELECT id, code FROM "Project" LIMIT 1`;
  console.log('Project after rename:', proj);
  const docs = await prisma.$queryRaw`SELECT count(*) as count FROM "Document" WHERE "projectId" = ${(proj as any)[0].id}`;
  console.log('Documents pointing to project:', (docs as any)[0].count);
  await prisma.$disconnect();
}
main().catch(console.error);
