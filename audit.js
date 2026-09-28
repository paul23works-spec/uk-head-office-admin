require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
  console.log("==================================================");
  console.log("PHASE 2 — DATABASE AUDIT");
  console.log("==================================================");
  
  const prisma = new PrismaClient();
  
  try {
    const totalProjects = await prisma.project.count();
    console.log(`Total Project records: ${totalProjects}`);
    
    const projects = await prisma.project.findMany();
    for (const p of projects) {
      console.log(`Project ID: ${p.id} | Name: ${p.name} | Code: ${p.code}`);
    }
    
    const totalDocuments = await prisma.document.count();
    console.log(`Total Document records: ${totalDocuments}`);
    
    const docCounts = await prisma.document.groupBy({
      by: ['projectId'],
      _count: {
        _all: true,
      },
    });
    
    console.log("Document counts grouped by projectId:");
    console.dir(docCounts, {depth: null});
    
    const bongaigaonDocs = await prisma.document.findMany({
      where: { projectId: 'PRJ-2024-001' }
    });
    console.log(`All documents belonging to PRJ-2024-001: ${bongaigaonDocs.length}`);
    
    const projectIds = projects.map(p => p.id);
    const orphanedDocs = await prisma.document.findMany({
      where: {
        NOT: {
          projectId: { in: projectIds }
        }
      }
    });
    console.log(`Orphaned documents (pointing to nonexistent projects): ${orphanedDocs.length}`);
    
  } catch (e) {
    console.error("Database Audit Error:", e);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log("PHASE 3 — SUPABASE STORAGE AUDIT");
  console.log("==================================================");
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Missing Supabase credentials in env.");
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: files, error } = await supabase.storage.from('uk-enterprise-documents').list('PRJ-2024-001', {
      limit: 1000,
    });
    
    if (error) {
      console.error("Storage Error:", error);
    } else {
      console.log(`Files in uk-enterprise-documents/PRJ-2024-001: ${files.length}`);
    }
  } catch (e) {
    console.error("Storage Exception:", e);
  }
}

main();
