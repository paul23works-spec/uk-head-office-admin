/**
 * UK HEAD OFFICE — Office Administration System
 * PHASE 4 MASTER ACCEPTANCE QA SUITE
 *
 * C-ADMIN MODULES: DI → MICC → PROGRESSIVE BILL → FINAL BILL
 * (STAGES 10, 11, 12, 13)
 *
 * Master automated test suite covering:
 * - Domain 1: DI Multi-Aggregation, Caps & Restoration
 * - Domain 2: MICC Multi-Aggregation, DI Caps & Rejection Handling
 * - Domain 3: Progressive Bill Verification, MICC Caps, Line Items & Contract Limits
 * - Domain 4: Final Bill Contract Reconciliation & Single-Active Rule
 * - Domain 5: Stage C Progress & Workflow 13-Stage Completeness
 * - Domain 6: LocalStorage Persistence & Schema Integrity
 * - Domain 7: Adversarial QA (Decimals, Large Values, Zero Quantities, Double Submissions)
 */

import {
  parseContractValue,
  calculateDispatchBalance,
  validateDiCreation,
  calculateMiccBalance,
  validateMiccCreation,
  calculateBillableQuantity,
  calculateProjectBillingSummary,
  validateProgressiveBillCreation,
  calculateFinalBill,
  validateFinalBillCreation,
} from './lib/c-admin-engine';

import {
  INITIAL_PROJECTS,
  INITIAL_JIRS,
  INITIAL_DIS,
  INITIAL_MICCS,
  INITIAL_PROGRESSIVE_BILLS,
  INITIAL_FINAL_BILLS,
} from './lib/mock-data';

import {
  WORKFLOW_STAGES,
  SIDEBAR_NAV_ITEMS,
} from './lib/constants';

import {
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  FinalBillRecord,
  JirRecord,
  Project,
} from './types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testId: string, description: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testId}: ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testId}: ${description}`);
  }
}

function expectNoError(fn: () => void, testId: string, desc: string) {
  try {
    fn();
    assert(true, testId, desc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    assert(false, testId, `${desc} -> Unexpected error: ${message}`);
  }
}

function expectError(fn: () => void, expectedSubstr: string, testId: string, desc: string) {
  try {
    fn();
    assert(false, testId, `${desc} -> Expected error containing "${expectedSubstr}" but none thrown`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const matches = message.toLowerCase().includes(expectedSubstr.toLowerCase());
    assert(matches, testId, `${desc} -> Caught expected error: ${message}`);
  }
}

console.log('================================================================');
console.log('PHASE 4: MASTER ACCEPTANCE QA SUITE (STAGES 10-13)');
console.log('================================================================\n');

const mockProject: Project = {
  ...INITIAL_PROJECTS[0],
  contractValue: '₹ 50,00,00,000',
};

const mockJir: JirRecord = {
  ...INITIAL_JIRS[0],
  id: 'JIR-TEST-001',
  acceptedQuantity: 40,
  rejectedQuantity: 10,
  status: 'Accepted',
};

// -------------------------------------------------------------
// DOMAIN 1: DI (Stage 10) Multi-Aggregation, Caps & Restoration
// -------------------------------------------------------------
console.log('--- DOMAIN 1: DI (STAGE 10) DISPATCH CLEARANCE QA ---');

// 1.1 Initial balance equals JIR accepted quantity
const initialDiBal = calculateDispatchBalance(mockJir, []);
assert(initialDiBal === 40, 'DI-01', 'Initial dispatchable balance matches JIR accepted quantity (40)');

// 1.2 Valid partial DI creation
const di1: DiRecord = {
  id: 'DI-001',
  diNumber: 'DI/TEST/001',
  diDate: '2024-09-05',
  projectId: mockProject.id,
  projectCode: mockProject.code,
  projectName: mockProject.name,
  jirId: mockJir.id,
  jirNumber: mockJir.jirNumber,
  poId: mockJir.poId,
  poNumber: mockJir.poNumber,
  boqItemId: mockJir.boqItemId,
  vendorId: mockJir.vendorId,
  vendorName: mockJir.vendorName,
  materialDescription: 'Power Transformer',
  quantity: 25,
  unit: 'Sets',
  destination: 'Bongaigaon Substation',
  status: 'Dispatched',
  remarks: 'First consignment',
  createdAt: '2024-09-05',
  updatedAt: '2024-09-05',
};

expectNoError(
  () => validateDiCreation(di1, mockJir, []),
  'DI-02',
  'Valid partial DI creation (25 of 40) validates without error'
);

// 1.3 Multi-DI aggregation and balance reduction
const diBalAfterDi1 = calculateDispatchBalance(mockJir, [di1]);
assert(
  diBalAfterDi1 === 15,
  'DI-03',
  'Multi-DI aggregation: Remaining balance accurately reduced to 15 (40 - 25)'
);

// 1.4 Exceeding balance rejection
const diExceed: DiRecord = {
  ...di1,
  id: 'DI-EXCEED',
  quantity: 20, // 25 + 20 = 45 > 40
};
expectError(
  () => validateDiCreation(diExceed, mockJir, [di1]),
  'exceeds remaining',
  'DI-04',
  'Rejection when requested DI quantity (20) exceeds remaining balance (15)'
);

// 1.5 Second valid partial DI fills balance exactly
const di2: DiRecord = {
  ...di1,
  id: 'DI-002',
  diNumber: 'DI/TEST/002',
  quantity: 15,
  status: 'Ready for Dispatch',
};
expectNoError(
  () => validateDiCreation(di2, mockJir, [di1]),
  'DI-05',
  'Second DI taking remaining balance to 0 validates successfully'
);

// 1.6 Cancellation restores balance
const di2Cancelled: DiRecord = { ...di2, status: 'Cancelled' };
const diBalWithCancelled = calculateDispatchBalance(mockJir, [di1, di2Cancelled]);
assert(
  diBalWithCancelled === 15,
  'DI-06',
  'Cancelled DI does not consume balance; 15 units restored to dispatchable pool'
);

// 1.7 Orphan DI rejected
expectError(
  () => validateDiCreation({ quantity: 10, projectId: 'PRJ-2024-001' }, undefined, []),
  'linked jir',
  'DI-07',
  'Orphan DI without linked JIR is rejected'
);

// 1.8 Cross-project DI rejected
expectError(
  () => validateDiCreation({ ...di1, projectId: 'PRJ-999' }, mockJir, []),
  'project mismatch',
  'DI-08',
  'DI rejected when DI project does not match referenced JIR project'
);

// -------------------------------------------------------------
// DOMAIN 2: MICC (Stage 11) Material Inward & Verification QA
// -------------------------------------------------------------
console.log('\n--- DOMAIN 2: MICC (STAGE 11) MATERIAL INWARD QA ---');

// 2.1 Initial balance equals DI quantity
const initialMiccBal = calculateMiccBalance(di1, []);
assert(initialMiccBal === 25, 'MICC-01', 'Initial MICC inward balance equals DI quantity (25)');

// 2.2 Valid partial MICC creation
const micc1: MiccRecord = {
  id: 'MICC-001',
  miccNumber: 'MICC/TEST/001',
  miccDate: '2024-09-10',
  projectId: 'PRJ-2024-001',
  projectCode: 'APDCL-2024-01',
  projectName: 'Bongaigaon 132kV',
  diId: di1.id,
  diNumber: di1.diNumber,
  poId: di1.poId,
  poNumber: di1.poNumber,
  jirId: di1.jirId,
  jirNumber: di1.jirNumber,
  boqItemId: di1.boqItemId,
  vendorId: di1.vendorId,
  vendorName: di1.vendorName,
  materialDescription: di1.materialDescription,
  quantity: 15,
  unit: di1.unit,
  fieldOffice: 'Bongaigaon Circle Office',
  status: 'Verified',
  remarks: 'Received in good condition',
  createdAt: '2024-09-10',
  updatedAt: '2024-09-10',
};

expectNoError(
  () => validateMiccCreation(micc1, di1, []),
  'MICC-02',
  'Valid partial MICC creation (15 of 25) validates without error'
);

// 2.3 Multi-MICC aggregation
const miccBalAfter1 = calculateMiccBalance(di1, [micc1]);
assert(miccBalAfter1 === 10, 'MICC-03', 'Multi-MICC aggregation: Remaining inward balance is 10 (25 - 15)');

// 2.4 Exceeding DI quantity rejection
const miccExceed: MiccRecord = {
  ...micc1,
  id: 'MICC-EXCEED',
  quantity: 12, // 15 + 12 = 27 > 25
};
expectError(
  () => validateMiccCreation(miccExceed, di1, [micc1]),
  'exceeds remaining',
  'MICC-04',
  'Rejection when MICC quantity (12) exceeds remaining DI quantity (10)'
);

// 2.5 Rejected MICC does not consume DI balance
const miccRejected: MiccRecord = {
  ...micc1,
  id: 'MICC-REJ-001',
  quantity: 10,
  status: 'Rejected',
};
const miccBalWithRej = calculateMiccBalance(di1, [micc1, miccRejected]);
assert(miccBalWithRej === 10, 'MICC-05', 'Rejected MICC does not consume DI balance; 10 remains available');

// 2.6 Orphan MICC rejected
expectError(
  () => validateMiccCreation({ quantity: 5, projectId: 'PRJ-2024-001' }, undefined, []),
  'linked dispatch instruction',
  'MICC-06',
  'Orphan MICC without DI reference is rejected'
);

// 2.7 Cross-project MICC rejected
expectError(
  () => validateMiccCreation({ ...micc1, projectId: 'PRJ-OTHER' }, di1, []),
  'project mismatch',
  'MICC-07',
  'MICC rejected when project does not match referenced DI project'
);

// -------------------------------------------------------------
// DOMAIN 3: Progressive Bill (Stage 12) Calculations & Limits
// -------------------------------------------------------------
console.log('\n--- DOMAIN 3: PROGRESSIVE BILL (STAGE 12) QA ---');

// 3.1 Billable quantity from Verified MICC
const initialBillable = calculateBillableQuantity(micc1, []);
assert(initialBillable === 15, 'PB-01', 'Initial billable quantity for Verified MICC matches MICC quantity (15)');

// 3.2 Create valid progressive bill line items
const pbRate = 100000; // ₹1,00,000 per unit

const lineItem1 = {
  id: 'PBL-001',
  billId: 'PB-001',
  miccId: micc1.id,
  miccNumber: micc1.miccNumber,
  diId: micc1.diId,
  diNumber: micc1.diNumber,
  poId: micc1.poId,
  poNumber: micc1.poNumber,
  boqItemId: micc1.boqItemId,
  description: 'Power Transformer',
  unit: 'Sets',
  claimedQuantity: 10,
  rate: pbRate,
  claimedAmount: 10 * pbRate,
  approvedQuantity: 10,
  approvedAmount: 10 * pbRate,
};

const pbDraft: Partial<ProgressiveBillRecord> = {
  projectId: mockProject.id,
  lineItems: [lineItem1],
  currentClaimedAmount: 1000000,
  status: 'Submitted',
};

expectNoError(
  () => validateProgressiveBillCreation(pbDraft, mockProject, [micc1], []),
  'PB-02',
  'Valid progressive bill with verified MICC line item validates successfully'
);

// 3.3 Approved bill consumes MICC billable quantity
const pb1: ProgressiveBillRecord = {
  id: 'PB-001',
  billNumber: 'RA-01/TEST/2024',
  billDate: '2024-09-15',
  projectId: mockProject.id,
  projectCode: mockProject.code,
  projectName: mockProject.name,
  status: 'Approved',
  lineItems: [lineItem1],
  previousApprovedAmount: 0,
  currentClaimedAmount: 1000000,
  currentApprovedAmount: 1000000,
  cumulativeApprovedAmount: 1000000,
  contractValue: 500000000,
  remainingContractBalance: 500000000 - 1000000,
  remarks: 'RA-01 Approved',
  createdAt: '2024-09-15',
  updatedAt: '2024-09-15',
};

const billableAfterPb1 = calculateBillableQuantity(micc1, [pb1]);
assert(billableAfterPb1 === 5, 'PB-03', 'Multi-bill tracking: Remaining billable quantity on MICC is 5 (15 - 10)');

// 3.4 Duplicate / Over-billing prevention on MICC
const pbOverbill: Partial<ProgressiveBillRecord> = {
  projectId: mockProject.id,
  lineItems: [{ ...lineItem1, id: 'PBL-002', claimedQuantity: 8 }],
  status: 'Submitted',
};
expectError(
  () => validateProgressiveBillCreation(pbOverbill, mockProject, [micc1], [pb1]),
  'exceeds remaining billable',
  'PB-04',
  'Rejection when bill claimed quantity (8) exceeds remaining MICC quantity (5)'
);

// 3.5 Project billing summary correctly aggregates approved amounts
const summary1 = calculateProjectBillingSummary(mockProject, [pb1]);
assert(
  summary1.cumulativeApprovedAmount === 1000000 &&
  summary1.contractValue === 500000000 &&
  summary1.remainingContractBalance === 499000000 &&
  summary1.approvedBillsCount === 1,
  'PB-05',
  'Project billing summary accurately reflects ₹10L approved and remaining balance'
);

// 3.6 Capping at Contract Value
const smallContractProject: Project = { ...mockProject, contractValue: '₹ 15,00,000' };
const pbExceedContract: Partial<ProgressiveBillRecord> = {
  projectId: smallContractProject.id,
  lineItems: [{ ...lineItem1, id: 'PBL-EXCEED', claimedQuantity: 5, rate: 200000 }],
  currentApprovedAmount: 1000000, // 10L + 10L already approved = 20L > 15L contract
  status: 'Approved',
};
expectError(
  () => validateProgressiveBillCreation(pbExceedContract, smallContractProject, [micc1], [pb1]),
  'contract limit exceeded',
  'PB-06',
  'Rejection when cumulative approved billing exceeds total contract value'
);

// 3.7 Rejected bill does not consume contract balance
const pbRejected: ProgressiveBillRecord = {
  ...pb1,
  id: 'PB-REJ',
  status: 'Rejected',
  currentApprovedAmount: 0,
};
const summaryWithRej = calculateProjectBillingSummary(mockProject, [pb1, pbRejected]);
assert(
  summaryWithRej.cumulativeApprovedAmount === 1000000,
  'PB-07',
  'Rejected progressive bill does not reduce remaining contract balance'
);

// -------------------------------------------------------------
// DOMAIN 4: Final Bill (Stage 13) Reconciliation QA
// -------------------------------------------------------------
console.log('\n--- DOMAIN 4: FINAL BILL (STAGE 13) RECONCILIATION QA ---');

// Formula: Final Payable = Contract Value + Adjustments - Total Approved Progressive Bills
const contractTotal = 10000000; // ₹1 Cr
const progressivePaid = 8500000; // ₹85 Lakhs approved

// 4.1 Zero adjustment reconciliation
const calcZeroAdj = calculateFinalBill(contractTotal, progressivePaid, 0);
assert(calcZeroAdj === 1500000, 'FB-01', 'Final Bill arithmetic: 1.00 Cr - 0.85 Cr + 0 = ₹15,00,000 net payable');

// 4.2 Positive adjustment (Variation / Extra Scope)
const calcPosAdj = calculateFinalBill(contractTotal, progressivePaid, 250000);
assert(calcPosAdj === 1750000, 'FB-02', 'Positive adjustment increases final payable to ₹17,50,000');

// 4.3 Negative adjustment (Liquidated Damages / LD / Penalty)
const calcNegAdj = calculateFinalBill(contractTotal, progressivePaid, -300000);
assert(calcNegAdj === 1200000, 'FB-03', 'Negative adjustment (deduction/LD) reduces final payable to ₹12,00,000');

// 4.4 Validation of valid final bill
const validFbProject: Project = { ...mockProject, contractValue: '₹ 1,00,00,000' };
expectNoError(
  () =>
    validateFinalBillCreation(
      { projectId: validFbProject.id, adjustments: 0 },
      validFbProject,
      [],
      [
        {
          ...pb1,
          projectId: validFbProject.id,
          status: 'Approved',
          currentApprovedAmount: progressivePaid,
        },
      ]
    ),
  'FB-04',
  'Valid final bill creation validation succeeds'
);

// 4.5 Negative net payable rejection
expectError(
  () =>
    validateFinalBillCreation(
      { projectId: validFbProject.id, adjustments: -2000000 }, // -20L on 15L remaining
      validFbProject,
      [],
      [
        {
          ...pb1,
          projectId: validFbProject.id,
          status: 'Approved',
          currentApprovedAmount: progressivePaid,
        },
      ]
    ),
  'negative',
  'FB-05',
  'Rejection when adjustments cause net final payable to be negative'
);

// 4.6 Single active final bill per project rule
const existingFb: FinalBillRecord = {
  id: 'FB-001',
  finalBillNumber: 'FB/UK/TEST/2024/001',
  projectId: validFbProject.id,
  projectCode: validFbProject.code,
  projectName: validFbProject.name,
  billDate: '2024-09-20',
  contractValue: contractTotal,
  totalApprovedProgressiveBills: progressivePaid,
  adjustments: 0,
  finalBillAmount: 1500000,
  status: 'Submitted',
  remarks: 'Final settlement',
  createdAt: '2024-09-20',
  updatedAt: '2024-09-20',
};

expectError(
  () =>
    validateFinalBillCreation(
      { projectId: validFbProject.id, adjustments: 0 },
      validFbProject,
      [existingFb],
      []
    ),
  'already has an active final bill',
  'FB-06',
  'Enforce single active final bill: Rejection when active final bill already exists for project'
);

// 4.7 Re-submitting allowed if previous final bill was Rejected
const rejectedFb: FinalBillRecord = { ...existingFb, id: 'FB-REJ', status: 'Rejected' };
expectNoError(
  () =>
    validateFinalBillCreation(
      { projectId: validFbProject.id, adjustments: 0 },
      validFbProject,
      [rejectedFb],
      []
    ),
  'FB-07',
  'New final bill allowed if prior final bill was formally Rejected'
);

// -------------------------------------------------------------
// DOMAIN 5: Workflow Pipeline & Constants Completeness
// -------------------------------------------------------------
console.log('\n--- DOMAIN 5: WORKFLOW PIPELINE & CONSTANTS QA ---');

// 5.1 All 13 stages defined
assert(WORKFLOW_STAGES.length === 13, 'WF-01', 'WORKFLOW_STAGES contains exactly 13 stages');

// 5.2 Stages 10-13 have correct IDs and names
const s10 = WORKFLOW_STAGES.find((s) => s.id === '10');
const s11 = WORKFLOW_STAGES.find((s) => s.id === '11');
const s12 = WORKFLOW_STAGES.find((s) => s.id === '12');
const s13 = WORKFLOW_STAGES.find((s) => s.id === '13');

assert(
  s10?.name === '10 DI / Dispatch Clearance' &&
  s11?.name === '11 MICC' &&
  s12?.name === '12 Progressive Bill' &&
  s13?.name === '13 Final Bill',
  'WF-02',
  'Stages 10, 11, 12, 13 metadata and names match Phase 4 specifications'
);

// 5.3 Sidebar navigation items active for Stages 10-13
const workflowNavGroup = SIDEBAR_NAV_ITEMS.find((g) => g.title === 'Project Workflow');
const navItems = (workflowNavGroup?.items || []) as Array<{ name: string; href: string; stageId?: string; isFuture?: boolean }>;
const nav10 = navItems.find((n) => n.stageId === '10');
const nav11 = navItems.find((n) => n.stageId === '11');
const nav12 = navItems.find((n) => n.stageId === '12');
const nav13 = navItems.find((n) => n.stageId === '13');

assert(
  nav10?.href === '/di' && !nav10?.isFuture &&
  nav11?.href === '/micc' && !nav11?.isFuture &&
  nav12?.href === '/progressive-bill' && !nav12?.isFuture &&
  nav13?.href === '/final-bill' && !nav13?.isFuture,
  'WF-03',
  'Sidebar items 10-13 are activated with clean routes (/di, /micc, /progressive-bill, /final-bill)'
);

// -------------------------------------------------------------
// DOMAIN 6: Initial Mock Data & Persistence Integrity
// -------------------------------------------------------------
console.log('\n--- DOMAIN 6: MOCK DATA & PERSISTENCE INTEGRITY QA ---');

assert(INITIAL_DIS.length > 0, 'DATA-01', `INITIAL_DIS contains ${INITIAL_DIS.length} seed records`);
assert(INITIAL_MICCS.length > 0, 'DATA-02', `INITIAL_MICCS contains ${INITIAL_MICCS.length} seed records`);
assert(INITIAL_PROGRESSIVE_BILLS.length > 0, 'DATA-03', `INITIAL_PROGRESSIVE_BILLS contains ${INITIAL_PROGRESSIVE_BILLS.length} seed records`);
assert(INITIAL_FINAL_BILLS.length > 0, 'DATA-04', `INITIAL_FINAL_BILLS contains ${INITIAL_FINAL_BILLS.length} seed records`);

// Check relationship linkages in initial data
const firstDi = INITIAL_DIS[0];
const matchingJir = INITIAL_JIRS.find((j) => j.id === firstDi.jirId);
assert(matchingJir !== undefined, 'DATA-05', `Initial DI ${firstDi.diNumber} references valid JIR ${firstDi.jirId}`);

const firstMicc = INITIAL_MICCS[0];
const matchingDi = INITIAL_DIS.find((d) => d.id === firstMicc.diId);
assert(matchingDi !== undefined, 'DATA-06', `Initial MICC ${firstMicc.miccNumber} references valid DI ${firstMicc.diId}`);

const firstPb = INITIAL_PROGRESSIVE_BILLS[0];
const firstPbItem = firstPb.lineItems[0];
const matchingMicc = INITIAL_MICCS.find((m) => m.id === firstPbItem.miccId);
assert(matchingMicc !== undefined, 'DATA-07', `Initial Progressive Bill line item references valid MICC ${firstPbItem.miccId}`);

// JSON round-trip safety (serialization without circular refs or lost keys)
const serializedDis = JSON.stringify(INITIAL_DIS);
const deserializedDis = JSON.parse(serializedDis);
assert(deserializedDis.length === INITIAL_DIS.length, 'DATA-08', 'JSON serialization round-trip preservation verified');

// -------------------------------------------------------------
// DOMAIN 7: Adversarial & Edge Case QA
// -------------------------------------------------------------
console.log('\n--- DOMAIN 7: ADVERSARIAL & EDGE CASE QA ---');

// 7.1 Decimal quantities (e.g. 12.5 km transmission conductor)
const decimalJir: JirRecord = {
  ...mockJir,
  id: 'JIR-DEC-001',
  acceptedQuantity: 12.5,
};
const decimalDiBal = calculateDispatchBalance(decimalJir, []);
assert(decimalDiBal === 12.5, 'ADV-01', 'Decimal quantity support: 12.5 km conductor handled precisely');

const decimalDi1: DiRecord = {
  ...di1,
  id: 'DI-DEC-001',
  jirId: decimalJir.id,
  quantity: 7.25,
  status: 'Dispatched',
};
const decimalDiBalAfter = calculateDispatchBalance(decimalJir, [decimalDi1]);
assert(
  Math.abs(decimalDiBalAfter - 5.25) < 0.0001,
  'ADV-02',
  'Decimal multi-DI subtraction: 12.5 - 7.25 = 5.25 without floating point error'
);

// 7.2 Zero quantity rejection
expectError(
  () => validateDiCreation({ ...di1, quantity: 0 }, mockJir, []),
  'greater than 0',
  'ADV-03',
  'Zero quantity DI request is rejected'
);

expectError(
  () => validateMiccCreation({ ...micc1, quantity: 0 }, di1, []),
  'greater than 0',
  'ADV-04',
  'Zero quantity MICC request is rejected'
);

// 7.3 Negative quantity rejection
expectError(
  () => validateDiCreation({ ...di1, quantity: -5 }, mockJir, []),
  'greater than 0',
  'ADV-05',
  'Negative quantity DI request is rejected'
);

// 7.4 Parse contract value from Indian currency formats
assert(parseContractValue('₹ 4,85,00,000') === 48500000, 'ADV-06', 'parseContractValue parses "₹ 4,85,00,000" to 48,500,000');
assert(parseContractValue('INR 12,50,000.50') === 1250001, 'ADV-07', 'parseContractValue parses "INR 12,50,000.50" to rounded integer 1,250,001');
assert(parseContractValue(5000000) === 5000000, 'ADV-08', 'parseContractValue accepts numeric input directly');

// 7.5 Final Bill with high precision amounts
const highPrecFinal = calculateFinalBill(48500000, 41225000, 12500);
assert(
  highPrecFinal === 7287500,
  'ADV-09',
  'Final Bill arithmetic with integer amounts: 48,500,000 - 41,225,000 + 12,500 = 7,287,500'
);

// -------------------------------------------------------------
// SUMMARY & REPORT
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`PHASE 4 QA RESULTS: ${passed} PASSED | ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PHASE 4 MASTER ACCEPTANCE TESTS PASSED SUCCESSFULLY.\n');
  process.exit(0);
}
