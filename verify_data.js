const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- PROJECTS ---');
  const projects = await prisma.project.findMany();
  console.log(projects);

  console.log('\n--- DOCUMENTS ---');
  const docs = await prisma.document.findMany();
  console.log('Total Documents:', docs.length);

  const bongaigaon = projects.find(p => p.name === 'Bongaigaon Medical College');
  if (bongaigaon) {
    const docsForB = docs.filter(d => d.projectId === bongaigaon.id);
    console.log('Docs matching Bongaigaon UUID:', docsForB.length);
    const otherDocs = docs.filter(d => d.projectId !== bongaigaon.id);
    if (otherDocs.length > 0) {
      console.log('Docs not matching Bongaigaon UUID:', otherDocs);
    }
  } else {
    console.log('Bongaigaon Medical College not found!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
