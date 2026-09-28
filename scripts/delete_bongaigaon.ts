import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Starting Bongaigaon data deletion...');

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { code: 'BGN' },
        { name: { contains: 'Bongaigaon' } }
      ]
    },
    include: {
      documents: true
    }
  });

  if (projects.length === 0) {
    console.log('No Bongaigaon projects found.');
    return;
  }

  for (const project of projects) {
    console.log(`Found project: ${project.name} (${project.id})`);
    
    // 1. Delete documents from Supabase Storage
    const storageKeys = project.documents.map(d => d.storageKey);
    if (storageKeys.length > 0) {
      console.log(`Deleting ${storageKeys.length} documents from Supabase Storage...`);
      const { data, error } = await supabase.storage.from('uk enterprise document').remove(storageKeys);
      if (error) {
        console.error('Error deleting from storage:', error);
      } else {
        console.log('Successfully deleted documents from storage.');
      }
    } else {
      console.log('No documents found in storage for this project.');
    }

    // 2. Delete project from DB (Cascade will handle related records)
    console.log(`Deleting project ${project.id} from database...`);
    await prisma.project.delete({
      where: { id: project.id }
    });
    console.log(`Successfully deleted project ${project.name} and all cascade dependencies.`);
  }

  console.log('Bongaigaon data deletion complete.');
}

main()
  .catch(e => {
    console.error('Deletion script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
