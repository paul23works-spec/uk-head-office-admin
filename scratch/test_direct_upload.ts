import fs from 'fs';
import path from 'path';

async function testDirectUpload() {
  console.log('--- STARTING DIRECT UPLOAD VERIFICATION ---');
  
  // 1. Authenticate
  console.log('Authenticating as MASTER...');
  const loginRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-001', password: 'password' })
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error('Login failed: ' + err);
  }
  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) throw new Error('No cookies returned');
  const authCookie = cookies.split(';')[0];
  console.log('✅ Authenticated successfully.');

  // 2. Prepare large file
  const filePath = path.join(process.cwd(), 'src/bongaigaon_migration_files', 'APPROVAL OF GTP AND DRAWINGS 4_0001.pdf');
  if (!fs.existsSync(filePath)) {
    throw new Error('Test file not found: ' + filePath);
  }
  const fileStats = fs.statSync(filePath);
  const fileSize = fileStats.size;
  const fileName = path.basename(filePath);
  const contentType = 'application/pdf';
  console.log(`Found test file: ${fileName} (${(fileSize/1024/1024).toFixed(2)} MB)`);

  // 3. Request Upload URL
  console.log('\nRequesting upload URL from server...');
  const urlRes = await fetch('http://localhost:3000/api/documents/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie
    },
    body: JSON.stringify({
      filename: fileName,
      contentType,
      size: fileSize,
      projectId: 'PRJ-2024-001',
      documentType: 'GTP_DRAWING_APPROVAL'
    })
  });

  if (!urlRes.ok) {
    const err = await urlRes.text();
    throw new Error('Failed to get upload URL: ' + err);
  }

  const { data: uploadData } = await urlRes.json();
  const { signedUrl, token, storageKey, sanitizedFilename } = uploadData;
  console.log('✅ Upload URL received.');
  console.log('Storage Key:', storageKey);

  // 4. Upload directly to Supabase
  console.log('\nUploading file directly to Supabase...');
  const fileBuffer = fs.readFileSync(filePath);
  
  // Actually, Supabase signed upload URL is just a PUT request
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Authorization': `Bearer ${token}`
    },
    body: fileBuffer
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error('Failed to upload to Supabase: ' + err);
  }
  console.log('✅ File uploaded successfully to Supabase.');

  // 5. Confirm upload with server
  console.log('\nConfirming upload with server...');
  const confirmRes = await fetch('http://localhost:3000/api/documents/confirm-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie
    },
    body: JSON.stringify({
      storageKey,
      filename: sanitizedFilename,
      documentType: 'GTP_DRAWING_APPROVAL',
      projectId: 'PRJ-2024-001'
    })
  });

  if (!confirmRes.ok) {
    const err = await confirmRes.text();
    throw new Error('Failed to confirm upload: ' + err);
  }

  const { data: document } = await confirmRes.json();
  console.log('✅ Upload confirmed and database record created.');
  console.log('Document ID:', document.id);

  // 6. Verify Download
  console.log('\nVerifying signed download URL...');
  const getRes = await fetch(`http://localhost:3000/api/documents/${document.id}`, {
    headers: { 'Cookie': authCookie }
  });

  if (!getRes.ok) {
    const err = await getRes.text();
    throw new Error('Failed to get document URL: ' + err);
  }
  
  const { data: { url } } = await getRes.json();
  console.log('✅ Download URL generated.');
  
  const downloadRes = await fetch(url);
  if (!downloadRes.ok) throw new Error('Signed URL is invalid/inaccessible');
  console.log('✅ Download URL is valid and accessible.');

  // 7. Verify audit logging
  console.log('\nVerifying audit logs...');
  const logsRes = await fetch(`http://localhost:3000/api/projects/PRJ-2024-001/audit-logs`, {
    headers: { 'Cookie': authCookie }
  });
  
  const { data: logs } = await logsRes.json();
  const docLog = logs.find((l: any) => l.action === 'DOCUMENT_UPLOADED' && l.details.includes(sanitizedFilename));
  if (!docLog) {
    throw new Error('Audit log for document upload not found!');
  }
  console.log('✅ Audit log verified.');

  // 8. Clean up
  console.log('\nCleaning up test document...');
  const delRes = await fetch(`http://localhost:3000/api/documents/${document.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': authCookie }
  });

  if (!delRes.ok) throw new Error('Failed to delete document');
  console.log('✅ Test document deleted from database and storage.');
  
  console.log('\n--- VERIFICATION SUCCESSFUL ---');
}

testDirectUpload().catch(console.error);
