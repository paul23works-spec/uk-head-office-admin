import fs from 'fs';
import path from 'path';

const DIR_PATH = path.join(process.cwd(), 'src', 'bongaigaon_migration_files');

function detectDocumentType(filename: string): string {
  const upperName = filename.toUpperCase();
  if (upperName.includes('LOI')) return 'LETTER_OF_INTENT';
  if (upperName.includes('LOA')) return 'LETTER_OF_AWARD';
  if (upperName.includes('WORK ORDER')) return 'WORK_ORDER';
  if (upperName.includes('GTP') || upperName.includes('DRAWING') || upperName.includes('GTA')) return 'GTP_DRAWING_APPROVAL';
  if (upperName.includes('DISPATCH CLEARENCE') || upperName.includes('DISPATCH CLEARANCE')) return 'DISPATCH_CLEARANCE';
  if (upperName.includes('JIR')) return 'JOINT_INSPECTION_REPORT';
  if (upperName.includes('BST')) return 'BILL_OF_SUPPLY';
  if (upperName.includes('INSPECTION REPORT') || upperName.includes('FACTORY INSPECTION')) return 'FACTORY_INSPECTION_REPORT';
  if (upperName.includes('BANK') && (upperName.includes('GURANTEE') || upperName.includes('GUARANTEE'))) return 'BANK_GUARANTEE';
  if (upperName.includes('OFFICE ORDER')) return 'OFFICE_ORDER';
  if (upperName.includes('E STAMP')) return 'AGREEMENT_STAMP';
  if (upperName.includes('LETTER')) return 'OFFICIAL_LETTER';
  if (upperName.includes('HAVELLS') || upperName.includes('ITEMS')) return 'MATERIAL_LIST';
  return 'MISC_DOCUMENT';
}

function scanFiles() {
  const files = fs.readdirSync(DIR_PATH);
  
  const manifest = files.map(file => {
    const ext = path.extname(file).toLowerCase();
    const size = fs.statSync(path.join(DIR_PATH, file)).size;
    const docType = detectDocumentType(file);
    
    return {
      filename: file,
      extension: ext,
      sizeBytes: size,
      documentType: docType,
      project: 'PRJ-2024-001 (Bongaigaon Medical College)',
      status: ext === '.pdf' ? 'VALID' : 'INVALID_EXTENSION'
    };
  });

  return manifest;
}

const manifest = scanFiles();
console.log(JSON.stringify(manifest, null, 2));

const issues = manifest.filter(m => m.documentType === 'MISC_DOCUMENT' || m.status !== 'VALID');
if (issues.length > 0) {
  console.log('\n--- ISSUES / AMBIGUITIES ---');
  console.log(JSON.stringify(issues, null, 2));
}

