/**
 * UK HEAD OFFICE — Office Administration System
 * PHASE 4 HTTP ROUTE INTEGRATION AUDIT
 */

import http from 'http';

const routes = [
  { path: '/', expectedStatus: 200, expectedBadge: 'Phase 4' },
  { path: '/projects', expectedStatus: 200, expectedBadge: 'Phase' },
  { path: '/projects/PRJ-2024-001', expectedStatus: 200, expectedBadge: 'Phase 4' },
  { path: '/tenders', expectedStatus: 200, expectedBadge: 'PHASE 2' },
  { path: '/loi-loa', expectedStatus: 200, expectedBadge: 'PHASE 2' },
  { path: '/acceptance', expectedStatus: 200, expectedBadge: 'PHASE 2' },
  { path: '/cpg-agreement', expectedStatus: 200, expectedBadge: 'PHASE 2' },
  { path: '/boq', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/gtp', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/po', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/inspection-call', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/inspection-order', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/jir', expectedStatus: 200, expectedBadge: 'PHASE 3' },
  { path: '/di', expectedStatus: 200, expectedBadge: 'PHASE 4' },
  { path: '/micc', expectedStatus: 200, expectedBadge: 'PHASE 4' },
  { path: '/progressive-bill', expectedStatus: 200, expectedBadge: 'PHASE 4' },
  { path: '/final-bill', expectedStatus: 200, expectedBadge: 'PHASE 4' },
  { path: '/non-existent-acceptance-route-404', expectedStatus: 404, expectedBadge: '' },
];

async function checkRoute(route: { path: string; expectedStatus: number; expectedBadge: string }) {
  return new Promise<{ path: string; status: number; bytes: number; hasExpectedBadge: boolean; statusMatch: boolean }>((resolve, reject) => {
    http.get(`http://localhost:3000${route.path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const statusMatch = res.statusCode === route.expectedStatus;
        const hasExpectedBadge = route.expectedBadge === '' ? true : data.includes(route.expectedBadge);
        resolve({
          path: route.path,
          status: res.statusCode || 0,
          bytes: data.length,
          hasExpectedBadge,
          statusMatch,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log(' UK HEAD OFFICE — PHASE 4 HTTP ROUTE AUDIT (ALL 17 ROUTES)');
  console.log('================================================================\n');

  let allPassed = true;
  for (const r of routes) {
    try {
      const res = await checkRoute(r);
      const ok = res.statusMatch && res.hasExpectedBadge;
      if (!ok) allPassed = false;
      console.log(
        `  [${ok ? 'PASS' : 'FAIL'}] ${r.path.padEnd(36)} Status: ${res.status} (exp ${r.expectedStatus}) | Badge '${r.expectedBadge || 'N/A'}': ${res.hasExpectedBadge}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${r.path}: ${message}`);
      allPassed = false;
    }
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log(' ALL 17 ROUTES AUDITED SUCCESSFULLY WITH HTTP 200 (1 404 expected)');
  } else {
    console.error(' ROUTE AUDIT ENCOUNTERED DEFECTS');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runAudit();
