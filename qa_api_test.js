async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  console.log('--- API QA TEST ---');

  try {
    // 1. Unauthenticated Project Fetch
    const res = await fetch(`${baseUrl}/projects`);
    console.log('GET /api/projects status:', res.status);
    const json = await res.json();
    console.log('GET /api/projects data:', typeof json === 'object' ? 'Valid JSON' : 'Invalid');

    // 2. Unauthenticated Document Fetch
    // Even unauthenticated, our API allows fetching basic project/doc lists or returns specific errors?
    // Let's test with a mock project ID
    const docRes = await fetch(`${baseUrl}/documents?projectId=739bed9a-5b64-4c1e-900b-e753ae6274c9`);
    console.log('GET /api/documents status:', docRes.status);

    // 3. Document download link generation
    const downloadRes = await fetch(`${baseUrl}/documents/739bed9a-5b64-4c1e-900b-e753ae6274c9`);
    console.log('GET /api/documents/[id] status:', downloadRes.status);
    
    // Check if it's protected properly
    // Usually these should return 401 Unauthorized or at least be safe from unauthenticated manipulation.
    // If they return 200, we need to document that in the QA report.
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
runTests();
