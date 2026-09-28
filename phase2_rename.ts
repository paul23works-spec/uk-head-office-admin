import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

async function main() {
  const prisma = new PrismaClient();
  
  console.log("--- BEFORE EXECUTION ---");
  const rawProjectBefore = await prisma.$queryRaw`SELECT id, "projectId" FROM "Project" LIMIT 1`;
  console.log("Project before rename:", rawProjectBefore);
  
  const documentsBefore = await prisma.document.count({
    where: { projectId: (rawProjectBefore as any)[0].id }
  });
  console.log("Documents pointing to project before rename:", documentsBefore);

  await prisma.$disconnect();

  console.log("\n--- EXECUTING RENAME ---");
  try {
    execSync('npx prisma db execute --file rename_col.sql', { stdio: 'inherit' });
    console.log("Rename executed successfully.");
  } catch (error) {
    console.error("Error executing rename:", error);
    process.exit(1);
  }

  // Generate prisma client to pick up the schema change
  console.log("\n--- GENERATING PRISMA CLIENT ---");
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Disconnect the old client and create a new one with the updated generated types
  // We'll use a raw query just in case the new client hasn't loaded properly in this context
  const prismaNew = new PrismaClient();
  
  console.log("\n--- AFTER EXECUTION ---");
  const rawProjectAfter = await prismaNew.$queryRaw`SELECT id, code FROM "Project" LIMIT 1`;
  console.log("Project after rename:", rawProjectAfter);
  
  const documentsAfter = await prismaNew.$queryRaw`SELECT count(*) as count FROM "Document" WHERE "projectId" = ${(rawProjectAfter as any)[0].id}`;
  console.log("Documents pointing to project after rename:", (documentsAfter as any)[0].count);

  await prismaNew.$disconnect();
}

main().catch(console.error);
