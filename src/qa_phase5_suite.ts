/**
 * UK HEAD OFFICE — Office Administration System
 * PHASE 5 MASTER ACCEPTANCE QA SUITE
 *
 * COMPLETE PROJECT CONTROL (STAGES 01-13)
 *
 * Master automated test suite covering all 14 QA domains specified in
 * the Phase 5 Master Implementation Prompt:
 * - Domain 1: Strictly 13 Authoritative Stages, No Stage 14
 * - Domain 2: Deterministic Current Stage Calculation (Tests 3, 4, 5, 6, 7)
 * - Domain 3: Stage Status & Linear Progress Calculation
 * - Domain 4: Procurement Aggregations & Cancellation Filtering (Tests 8, 9)
 * - Domain 5: Inspection Aggregations & Multi-Call Reconciliation (Tests 10, 11)
 * - Domain 6: Dispatch Aggregations & Cancellation Exclusions (Tests 12, 13)
 * - Domain 7: MICC Aggregations & Verification Rates (Test 14)
 * - Domain 8: Billing Aggregations, Balance Bounds & Financial Closure (Tests 15, 16, 17)
 * - Domain 9: Actionable Pending Tasks Generation (Tests 18, 19, 20, 21)
 * - Domain 10: Exception & Risk Detection Rules
 * - Domain 11: Activity Timeline Assembly, Chronology & Filtering (Tests 22, 23, 24)
 * - Domain 12: Cross-Module Project Record Search (Tests 25, 26, 27)
 * - Domain 13: Strict Cross-Project Isolation (Test 28)
 * - Domain 14: Dynamic Live Mutation Consistency & Zero Duplicate Stores
 */

import {
  calculateProcurementSummary,
  calculateInspectionSummary,
  calculateDispatchSummary,
  calculateMiccSummary,
  calculateBillingSummary,
  calculateStageStatuses,
  calculateCurrentStage,
  calculateProjectProgress,
  getProjectHealth,
  calculatePendingActions,
  calculateProjectExceptions,
  buildProjectActivityTimeline,
  searchProjectRecords,
  getProjectControlSummary,
  ProjectWorkflowRecords,
} from './lib/project-control-engine';

import {
  WORKFLOW_STAGES,
  STAGE_NAV_MAP,
} from './lib/constants';

import {
  INITIAL_PROJECTS,
  INITIAL_TENDERS,
  INITIAL_LOI_LOAS,
  INITIAL_ACCEPTANCES,
  INITIAL_CPGS,
  INITIAL_AGREEMENTS,
  INITIAL_GTPS,
  INITIAL_POS,
  INITIAL_INSPECTION_CALLS,
  INITIAL_INSPECTION_ORDERS,
  INITIAL_JIRS,
  INITIAL_DIS,
  INITIAL_MICCS,
  INITIAL_PROGRESSIVE_BILLS,
  INITIAL_FINAL_BILLS,
} from './lib/mock-data';

import {
  Project,
  TenderRecord,
  LoiLoaRecord,
  AcceptanceRecord,
  CpgRecord,
  AgreementRecord,
  GtpRecord,
  PoRecord,
  InspectionCallRecord,
  InspectionOrderRecord,
  JirRecord,
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  FinalBillRecord,
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

console.log('================================================================');
console.log('PHASE 5: MASTER ACCEPTANCE QA SUITE — COMPLETE PROJECT CONTROL');
console.log('================================================================\n');

// Standard test builders
function createTestProject(id: string = 'PRJ-TEST-001', name: string = 'Test Project', contractVal: string = '₹ 1,00,00,000'): Project {
  return {
    ...INITIAL_PROJECTS[0],
    id,
    code: id,
    name,
    contractValue: contractVal,
  };
}

function createEmptyWorkflowRecords(project: Project): ProjectWorkflowRecords {
  return {
    project,
    boqItems: [],
    gtps: [],
    pos: [],
    inspectionCalls: [],
    inspectionOrders: [],
    jirs: [],
    dis: [],
    miccs: [],
    progressiveBills: [],
    finalBills: [],
  };
}

const makeTender = (p: Project, overrides: Partial<TenderRecord> = {}): TenderRecord => ({
  ...INITIAL_TENDERS[0],
  id: `TND-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeLoi = (p: Project, overrides: Partial<LoiLoaRecord> = {}): LoiLoaRecord => ({
  ...INITIAL_LOI_LOAS[0],
  id: `LOI-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeAcceptance = (p: Project, overrides: Partial<AcceptanceRecord> = {}): AcceptanceRecord => ({
  ...INITIAL_ACCEPTANCES[0],
  id: `ACC-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeCpg = (p: Project, overrides: Partial<CpgRecord> = {}): CpgRecord => ({
  ...INITIAL_CPGS[0],
  id: `CPG-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeAgreement = (p: Project, overrides: Partial<AgreementRecord> = {}): AgreementRecord => ({
  ...INITIAL_AGREEMENTS[0],
  id: `AGR-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeGtp = (p: Project, overrides: Partial<GtpRecord> = {}): GtpRecord => ({
  ...INITIAL_GTPS[0],
  id: `GTP-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makePo = (p: Project, overrides: Partial<PoRecord> = {}): PoRecord => ({
  ...INITIAL_POS[0],
  id: `PO-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeCall = (p: Project, overrides: Partial<InspectionCallRecord> = {}): InspectionCallRecord => ({
  ...INITIAL_INSPECTION_CALLS[0],
  id: `CALL-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeOrder = (p: Project, overrides: Partial<InspectionOrderRecord> = {}): InspectionOrderRecord => ({
  ...INITIAL_INSPECTION_ORDERS[0],
  id: `ORD-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeJir = (p: Project, overrides: Partial<JirRecord> = {}): JirRecord => ({
  ...INITIAL_JIRS[0],
  id: `JIR-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeDi = (p: Project, overrides: Partial<DiRecord> = {}): DiRecord => ({
  ...INITIAL_DIS[0],
  id: `DI-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeMicc = (p: Project, overrides: Partial<MiccRecord> = {}): MiccRecord => ({
  ...INITIAL_MICCS[0],
  id: `MICC-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeProgressiveBill = (p: Project, overrides: Partial<ProgressiveBillRecord> = {}): ProgressiveBillRecord => ({
  ...INITIAL_PROGRESSIVE_BILLS[0],
  id: `PB-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

const makeFinalBill = (p: Project, overrides: Partial<FinalBillRecord> = {}): FinalBillRecord => ({
  ...INITIAL_FINAL_BILLS[0],
  id: `FB-${p.id}`,
  projectId: p.id,
  projectCode: p.code,
  projectName: p.name,
  ...overrides,
});

// -----------------------------------------------------------------------------
// DOMAIN 1: STRICTLY 13 AUTHORITATIVE STAGES, NO STAGE 14
// -----------------------------------------------------------------------------
console.log('--- Domain 1: Authoritative 13 Stages Verification ---');

assert(
  WORKFLOW_STAGES.length === 13,
  'P5-D01-01',
  `WORKFLOW_STAGES contains exactly 13 stages (actual: ${WORKFLOW_STAGES.length})`
);

const stageNumbers = WORKFLOW_STAGES.map((s) => s.id);
const expectedNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'];
assert(
  JSON.stringify(stageNumbers) === JSON.stringify(expectedNumbers),
  'P5-D01-02',
  `Stages strictly follow sequence 01 through 13 without gaps`
);

assert(
  !WORKFLOW_STAGES.some((s) => parseInt(s.id, 10) > 13),
  'P5-D01-03',
  'No Stage 14, 15 or beyond exists in workflow configuration'
);

assert(
  Object.keys(STAGE_NAV_MAP).length === 13,
  'P5-D01-04',
  `STAGE_NAV_MAP maps exactly 13 stages to active route paths`
);

assert(
  !Object.values(STAGE_NAV_MAP).some(path => path.includes('/boq')),
  'P5-D01-05',
  'STAGE_NAV_MAP does not incorrectly map any numbered stage to BOQ module'
);

assert(
  !WORKFLOW_STAGES.some(stage => stage.name.toUpperCase().includes('BOQ')),
  'P5-D01-06',
  'WORKFLOW_STAGES does not incorrectly include BOQ as a numbered stage'
);

// -----------------------------------------------------------------------------
// DOMAIN 2: DETERMINISTIC CURRENT STAGE CALCULATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 2: Current Stage Calculation ---');

// Test 3: Project with only Stage 01 Tender in progress -> Current stage is 01 Tender
const projectT1 = createTestProject('P-T1');
const recordsT1: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectT1),
  tender: makeTender(projectT1, { status: 'Submitted' }),
};
const currStageT1 = calculateCurrentStage(projectT1, recordsT1);
assert(
  currStageT1.stageNumber === '01' && currStageT1.stageName === 'Tender',
  'P5-D02-01',
  `Test 3: Project with only Stage 01 Tender in progress yields Current Stage 01 Tender (got: S${currStageT1.stageNumber} ${currStageT1.stageName})`
);

// Test 4: Project through Stage 06 PO completed, Stage 07 Call pending -> Current stage is 07 Call
const projectT4 = createTestProject('P-T2');
const recordsT4: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectT4),
  tender: makeTender(projectT4, { status: 'Awarded' }),
  loiLoa: makeLoi(projectT4, { status: 'Accepted' }),
  acceptance: makeAcceptance(projectT4, { status: 'Accepted' }),
  cpg: makeCpg(projectT4, { status: 'Valid' }),
  agreement: makeAgreement(projectT4, { status: 'Executed' }),
  gtps: [makeGtp(projectT4, { status: 'Approved' })],
  pos: [makePo(projectT4, { status: 'Issued', totalAmount: 80, items: [] })],
};
const currStageT4 = calculateCurrentStage(projectT4, recordsT4);
assert(
  currStageT4.stageNumber === '07' && currStageT4.stageName === 'Inspection Call',
  'P5-D02-02',
  `Test 4: Project through Stage 06 PO with Stage 07 Call pending yields Current Stage 07 Inspection Call (got: S${currStageT4.stageNumber})`
);

// Test 5: Project through Stage 09 JIR accepted, Stage 10 DI pending -> Current stage is 10 DI
const recordsT5: ProjectWorkflowRecords = {
  ...recordsT4,
  inspectionCalls: [makeCall(projectT4, { status: 'Completed', quantity: 1 })],
  inspectionOrders: [makeOrder(projectT4, { status: 'Completed' })],
  jirs: [makeJir(projectT4, { status: 'Accepted', offeredQuantity: 1, inspectedQuantity: 1, acceptedQuantity: 1, rejectedQuantity: 0, balanceQuantity: 0 })],
};
const currStageT5 = calculateCurrentStage(projectT4, recordsT5);
assert(
  currStageT5.stageNumber === '10' && (currStageT5.stageName.includes('DI') || currStageT5.stageName.includes('Dispatch')),
  'P5-D02-03',
  `Test 5: Project with Stage 09 JIR accepted and Stage 10 DI pending yields Current Stage 10 DI (got: S${currStageT5.stageNumber} ${currStageT5.stageName})`
);

// Test 6: Project through Stage 12 Progressive Bill, Stage 13 Final Bill approved -> Current stage is 13, completed
const recordsT6: ProjectWorkflowRecords = {
  ...recordsT5,
  dis: [makeDi(projectT4, { status: 'Dispatched', quantity: 1 })],
  miccs: [makeMicc(projectT4, { status: 'Verified', quantity: 1 })],
  progressiveBills: [makeProgressiveBill(projectT4, { status: 'Approved', currentApprovedAmount: 100 })],
  finalBills: [makeFinalBill(projectT4, { status: 'Approved', contractValue: 100, finalBillAmount: 0 })],
};
const currStageT6 = calculateCurrentStage(projectT4, recordsT6);
assert(
  currStageT6.stageNumber === '13' && currStageT6.stageStatus === 'Completed',
  'P5-D02-04',
  `Test 6: Project through Stage 13 Final Bill approved yields Current Stage 13 with stageStatus 'Completed' (got: S${currStageT6.stageNumber} ${currStageT6.stageStatus})`
);

// Test 7: Empty or initial project -> Stage 01
const projectEmpty = createTestProject('P-EMPTY');
const recordsEmpty = createEmptyWorkflowRecords(projectEmpty);
const currStageEmpty = calculateCurrentStage(projectEmpty, recordsEmpty);
assert(
  currStageEmpty.stageNumber === '01',
  'P5-D02-05',
  `Test 7: Empty initial project correctly defaults to Stage 01 (got: S${currStageEmpty.stageNumber})`
);

// -----------------------------------------------------------------------------
// DOMAIN 3: STAGE STATUSES & PROGRESS CALCULATIONS
// -----------------------------------------------------------------------------
console.log('\n--- Domain 3: Stage Statuses & Progress Calculations ---');

const stageStatuses = calculateStageStatuses(projectT4, recordsT5);
assert(
  stageStatuses.length === 13,
  'P5-D03-01',
  `calculateStageStatuses returns exactly 13 stages for any project (got: ${stageStatuses.length})`
);

const stage01 = stageStatuses.find((s) => s.stageNumber === '01');
const stage06 = stageStatuses.find((s) => s.stageNumber === '06');
const stage09 = stageStatuses.find((s) => s.stageNumber === '09');
const stage10 = stageStatuses.find((s) => s.stageNumber === '10');

assert(stage01?.status === 'Completed', 'P5-D03-02', 'Stage 01 Tender is Completed');
assert(stage06?.status === 'Completed', 'P5-D03-03', 'Stage 06 PO is Completed');
assert(stage09?.status === 'Completed', 'P5-D03-04', 'Stage 09 JIR is Completed');
assert(stage10?.status === 'Attention Required', 'P5-D03-05', 'Stage 10 DI is Attention Required (material accepted awaiting DI)');

const progressVal = calculateProjectProgress(projectT4, stageStatuses);
// 9 completed out of 13: 9 / 13 * 100 = 69%
assert(
  progressVal.overallProgress === Math.round((9 / 13) * 100),
  'P5-D03-06',
  `calculateProjectProgress calculates rounded linear percentage (expected: 69%, got: ${progressVal.overallProgress}%)`
);

const healthSummary = getProjectHealth(projectT4, recordsT5);
assert(
  healthSummary.totalStagesCount === 13 && healthSummary.completedStagesCount === 9,
  'P5-D03-07',
  `getProjectHealth accurately reflects 9 completed stages of 13 (health status: ${healthSummary.healthStatus})`
);

// -----------------------------------------------------------------------------
// DOMAIN 4: PROCUREMENT AGGREGATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 4: Procurement Aggregation ---');

const projectProc = createTestProject('P-MULTI');
const multiPoRecords: PoRecord[] = [
  makePo(projectProc, { id: 'P-1', poNumber: 'PO-101', totalAmount: 5000000, status: 'Issued', items: [{ id: 'L-1', poId: 'P-1', boqItemId: 'B-1', boqItemNumber: '1', boqQuantity: 5, description: 'Item 1', quantity: 5, unit: 'NOS', balanceQuantity: 0, rate: 1000000, amount: 5000000 }] }),
  makePo(projectProc, { id: 'P-2', poNumber: 'PO-102', totalAmount: 3000000, status: 'Issued', items: [{ id: 'L-2', poId: 'P-2', boqItemId: 'B-2', boqItemNumber: '2', boqQuantity: 3, description: 'Item 2', quantity: 3, unit: 'NOS', balanceQuantity: 0, rate: 1000000, amount: 3000000 }] }),
  makePo(projectProc, { id: 'P-3', poNumber: 'PO-103', totalAmount: 2000000, status: 'Cancelled', items: [{ id: 'L-3', poId: 'P-3', boqItemId: 'B-3', boqItemNumber: '3', boqQuantity: 2, description: 'Item 3', quantity: 2, unit: 'NOS', balanceQuantity: 0, rate: 1000000, amount: 2000000 }] }),
];
const procSummary = calculateProcurementSummary(projectProc, [], [], multiPoRecords);

// Test 8: Multiple POs aggregate correctly
assert(
  procSummary.activePoCount === 2,
  'P5-D04-01',
  `Test 8: Active PO count excludes Cancelled POs (expected: 2, got: ${procSummary.activePoCount})`
);

// Test 9: Cancelled POs excluded from procurement value
assert(
  procSummary.totalPoAmount === 8000000,
  'P5-D04-02',
  `Test 9: Committed procurement value excludes Cancelled PO (expected: 8,000,000, got: ${procSummary.totalPoAmount})`
);

// -----------------------------------------------------------------------------
// DOMAIN 5: INSPECTION AGGREGATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 5: Inspection Aggregation ---');

const projectInsp = createTestProject('P-INSP');
const mockCalls: InspectionCallRecord[] = [
  makeCall(projectInsp, { id: 'C-1', inspectionCallNumber: 'CALL-1', quantity: 10, status: 'Submitted' }),
  makeCall(projectInsp, { id: 'C-2', inspectionCallNumber: 'CALL-2', quantity: 5, status: 'Completed' }),
];
const mockOrders: InspectionOrderRecord[] = [
  makeOrder(projectInsp, { id: 'O-1', inspectionOrderNumber: 'ORD-1', status: 'Issued' }),
];
const mockJirs: JirRecord[] = [
  makeJir(projectInsp, { id: 'J-1', jirNumber: 'JIR-1', offeredQuantity: 10, inspectedQuantity: 10, acceptedQuantity: 8, rejectedQuantity: 2, balanceQuantity: 0, status: 'Accepted' }),
];

const inspSummary = calculateInspectionSummary(projectInsp, mockCalls, mockOrders, mockJirs);

// Test 10: Call, order, JIR acceptance metrics
assert(
  inspSummary.callCount === 2 && inspSummary.orderCount === 1 && inspSummary.jirCount === 1,
  'P5-D05-01',
  `Test 10: Inspection call (2), order (1), and JIR (1) counts match registered entities`
);

assert(
  inspSummary.acceptedQuantity === 8 && inspSummary.rejectedQuantity === 2,
  'P5-D05-02',
  `Accepted (8) and rejected (2) quantities accurately aggregated across JIRs`
);

// Test 11: Multi-call inspection balance reconciled
assert(
  inspSummary.inspectionStatus === 'Completed',
  'P5-D05-03',
  `Test 11: Inspection balance reconciled with 0 remaining balance yielding Completed status`
);

// -----------------------------------------------------------------------------
// DOMAIN 6: DISPATCH AGGREGATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 6: Dispatch Aggregation ---');

const projectDisp = createTestProject('P-DISP');
const mockDispJirs: JirRecord[] = [
  makeJir(projectDisp, { id: 'J-1', jirNumber: 'JIR-1', offeredQuantity: 10, inspectedQuantity: 10, acceptedQuantity: 10, rejectedQuantity: 0, balanceQuantity: 0, status: 'Accepted' }),
];
const mockDis: DiRecord[] = [
  makeDi(projectDisp, { id: 'D-1', diNumber: 'DI-01', quantity: 5, status: 'Dispatched' }),
  makeDi(projectDisp, { id: 'D-2', diNumber: 'DI-02', quantity: 3, status: 'Dispatched' }),
  makeDi(projectDisp, { id: 'D-3', diNumber: 'DI-03', quantity: 10, status: 'Cancelled' }),
];
const dispSummary = calculateDispatchSummary(projectDisp, mockDispJirs, mockDis);

// Test 12: Multiple DIs aggregate correctly
assert(
  dispSummary.activeDiCount === 2,
  'P5-D06-01',
  `Test 12: Active DI count accurately excludes cancelled items (expected: 2, got: ${dispSummary.activeDiCount})`
);

// Test 13: Cancelled DIs excluded from dispatch totals
assert(
  dispSummary.dispatchedQuantity === 8,
  'P5-D06-02',
  `Test 13: Total dispatched quantity sums only active DIs (expected: 8, got: ${dispSummary.dispatchedQuantity})`
);

assert(
  dispSummary.remainingDispatchQuantity === 2,
  'P5-D06-03',
  `Remaining dispatch quantity correctly balances accepted (10) - dispatched (8) = 2`
);

// -----------------------------------------------------------------------------
// DOMAIN 7: MICC AGGREGATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 7: MICC Aggregation ---');

const projectMicc = createTestProject('P-MICC');
const mockMiccDis: DiRecord[] = [
  makeDi(projectMicc, { id: 'D-1', diNumber: 'DI-01', quantity: 8, status: 'Dispatched' }),
];
const mockMiccs: MiccRecord[] = [
  makeMicc(projectMicc, { id: 'M-1', miccNumber: 'MICC-01', quantity: 5, status: 'Verified' }),
  makeMicc(projectMicc, { id: 'M-2', miccNumber: 'MICC-02', quantity: 3, status: 'Verified' }),
];
const miccSummary = calculateMiccSummary(projectMicc, mockMiccDis, mockMiccs);

// Test 14: Total verified receipts vs pending reconciliation
assert(
  miccSummary.verifiedQuantity === 8,
  'P5-D07-01',
  `Test 14: Verified MICC quantity matches confirmed receipts (expected: 8, got: ${miccSummary.verifiedQuantity})`
);

assert(
  miccSummary.pendingVerificationQuantity === 0,
  'P5-D07-02',
  `Pending verification quantity correctly balanced to 0 (dispatched 8 vs verified 8)`
);

// -----------------------------------------------------------------------------
// DOMAIN 8: BILLING AGGREGATION & SETTLEMENT
// -----------------------------------------------------------------------------
console.log('\n--- Domain 8: Billing Aggregation & Financial Settlement ---');

const projectBill = createTestProject('P-BILL', 'Billing Project', '₹ 1,00,00,000');
const mockBills: ProgressiveBillRecord[] = [
  makeProgressiveBill(projectBill, { id: 'B-1', billNumber: 'PB-01', currentClaimedAmount: 2000000, currentApprovedAmount: 2000000, previousApprovedAmount: 0, status: 'Approved' }),
  makeProgressiveBill(projectBill, { id: 'B-2', billNumber: 'PB-02', currentClaimedAmount: 3000000, currentApprovedAmount: 3000000, previousApprovedAmount: 2000000, status: 'Approved' }),
  makeProgressiveBill(projectBill, { id: 'B-3', billNumber: 'PB-03', currentClaimedAmount: 1500000, currentApprovedAmount: 0, previousApprovedAmount: 5000000, status: 'Submitted' }),
];

// Test 15: Cumulative approved billing sums only Approved progressive bills
const billSummary = calculateBillingSummary(projectBill, mockBills, []);
assert(
  billSummary.cumulativeApprovedBilling === 5000000,
  'P5-D08-01',
  `Test 15: Cumulative approved billing strictly sums Approved bills (expected: 5,000,000, got: ${billSummary.cumulativeApprovedBilling})`
);

assert(
  billSummary.pendingClaimedBilling === 1500000,
  'P5-D08-02',
  `Pending claimed billing accurately isolates Submitted bills (expected: 1,500,000, got: ${billSummary.pendingClaimedBilling})`
);

// Test 16: Remaining contract balance calculation (bounded >= 0)
assert(
  billSummary.remainingContractBalance === 5000000,
  'P5-D08-03',
  `Test 16: Remaining contract balance = contractVal - cumulativeApproved (expected: 5,000,000, got: ${billSummary.remainingContractBalance})`
);

// Test 17: Final Bill approval sets isFinanciallyClosed = true
const mockFinalBills: FinalBillRecord[] = [
  makeFinalBill(projectBill, {
    id: 'FB-01',
    finalBillNumber: 'FB-01',
    contractValue: 10000000,
    finalBillAmount: 5000000,
    status: 'Approved',
  }),
];
const billSummaryWithFinal = calculateBillingSummary(projectBill, mockBills, mockFinalBills);
assert(
  billSummaryWithFinal.isFinanciallyClosed === true && billSummaryWithFinal.billingStatus === 'Completed',
  'P5-D08-04',
  `Test 17: Approved Final Bill sets isFinanciallyClosed = true and billingStatus = Completed`
);

// -----------------------------------------------------------------------------
// DOMAIN 9: PENDING ACTIONS GENERATOR
// -----------------------------------------------------------------------------
console.log('\n--- Domain 9: Actionable Pending Tasks Generation ---');

const projectAct = createTestProject('P-ACT');

// Test 18: Unaccepted LOI triggers Stage 03 action
const records18: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectAct),
  loiLoa: makeLoi(projectAct, { status: 'Received' }),
};
const actions18 = calculatePendingActions(projectAct, records18);
assert(
  actions18.some((a) => a.stageNumber === '03' && a.actionText.includes('Acceptance')),
  'P5-D09-01',
  `Test 18: Unaccepted LOI triggers Stage 03 pending action`
);

// Test 19: Unapproved GTP triggers Stage 05 action
const records19: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectAct),
  gtps: [makeGtp(projectAct, { status: 'Submitted' })],
};
const actions19 = calculatePendingActions(projectAct, records19);
assert(
  actions19.some((a) => a.stageNumber === '05' && a.title.includes('GTP Drawing')),
  'P5-D09-02',
  `Test 19: Submitted GTP triggers Stage 05 pending action`
);

// Test 20: JIR accepted without DI triggers Stage 10 action
const records20: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectAct),
  jirs: [makeJir(projectAct, { status: 'Accepted', acceptedQuantity: 1 })],
};
const actions20 = calculatePendingActions(projectAct, records20);
assert(
  actions20.some((a) => a.stageNumber === '10' && a.actionUrl === '/di'),
  'P5-D09-03',
  `Test 20: JIR accepted with no DI triggers Stage 10 DI clearance action`
);

// Test 21: Progressive bills pending approval trigger Stage 12 action
const records21: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectAct),
  progressiveBills: [makeProgressiveBill(projectAct, { status: 'Submitted', currentClaimedAmount: 100 })],
};
const actions21 = calculatePendingActions(projectAct, records21);
assert(
  actions21.some((a) => a.stageNumber === '12' && a.title.includes('Bill') && a.title.includes('Approve')),
  'P5-D09-04',
  `Test 21: Submitted Progressive Bill triggers Stage 12 action`
);

// -----------------------------------------------------------------------------
// DOMAIN 10: PROJECT EXCEPTION DETECTION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 10: Exception Detection Rules ---');

const projectEx = createTestProject('P-EX');
const recordsEx: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectEx),
  gtps: [makeGtp(projectEx, { status: 'Rejected' })],
  jirs: [makeJir(projectEx, { status: 'Accepted', acceptedQuantity: 7, rejectedQuantity: 3 })],
};
const exceptions = calculateProjectExceptions(projectEx, recordsEx);

assert(
  exceptions.some((e) => e.severity === 'Attention' && e.title.includes('GTP Drawing Rejected')),
  'P5-D10-01',
  `Exception detected for Rejected GTP drawing with 'Attention' severity`
);

assert(
  exceptions.some((e) => e.severity === 'Attention' && e.title.includes('Inspection Rejection')),
  'P5-D10-02',
  `Exception detected for JIR with rejected quantity (3 units)`
);

// -----------------------------------------------------------------------------
// DOMAIN 11: ACTIVITY TIMELINE ASSEMBLY, CHRONOLOGY & FILTERING
// -----------------------------------------------------------------------------
console.log('\n--- Domain 11: Activity Timeline Assembly ---');

const projectTime = createTestProject('P-TIME');
const recordsTime: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectTime),
  tender: makeTender(projectTime, { tenderDate: '2024-01-01', status: 'Submitted' }),
  loiLoa: makeLoi(projectTime, { date: '2024-01-10', status: 'Accepted' }),
  acceptance: makeAcceptance(projectTime, { acceptanceDate: '2024-01-15', status: 'Accepted' }),
  cpg: makeCpg(projectTime, { cpgDate: '2024-01-20', status: 'Valid' }),
  pos: [makePo(projectTime, { poNumber: 'PO-1', poDate: '2024-02-01', totalAmount: 500, status: 'Issued', vendorName: 'Vendor 1' })],
  dis: [makeDi(projectTime, { diNumber: 'DI-1', diDate: '2024-03-01', status: 'Dispatched' })],
};

const timeline = buildProjectActivityTimeline(projectTime, recordsTime);

// Test 22: Events across all stages assembled into single chronological stream
assert(
  timeline.length === 6,
  'P5-D11-01',
  `Test 22: Activity timeline aggregates 6 events across all populated stages (got: ${timeline.length})`
);

// Test 23: Default sorting descending by date
const isDescending = timeline.every((ev, idx) => {
  if (idx === 0) return true;
  return new Date(ev.date).getTime() <= new Date(timeline[idx - 1].date).getTime();
});
assert(
  isDescending,
  'P5-D11-02',
  `Test 23: Activity timeline items are sorted descending by date (latest event first: ${timeline[0]?.reference} on ${timeline[0]?.date})`
);

// Test 24: Stage filtering
const stage10Events = timeline.filter((e) => e.stageNumber === '10');
assert(
  stage10Events.length === 1 && stage10Events[0].reference === 'DI-1',
  'P5-D11-03',
  `Test 24: Stage 10 filtering isolates DI clearance event (reference: ${stage10Events[0]?.reference})`
);

// -----------------------------------------------------------------------------
// DOMAIN 12: CROSS-MODULE PROJECT RECORD SEARCH
// -----------------------------------------------------------------------------
console.log('\n--- Domain 12: Cross-Module Project Record Search ---');

// Test 25: Search by PO number finds Stage 06 PO
const poResults = searchProjectRecords(projectTime, recordsTime, 'PO-1');
assert(
  poResults.some((r) => r.reference === 'PO-1' && r.stageNumber === '06'),
  'P5-D12-01',
  `Test 25: Search by PO number finds Stage 06 PO (reference: PO-1)`
);

// Test 26: Search by DI number finds Stage 10 DI
const diResults = searchProjectRecords(projectTime, recordsTime, 'DI-1');
assert(
  diResults.some((r) => r.reference === 'DI-1' && r.stageNumber === '10'),
  'P5-D12-02',
  `Test 26: Search by DI number finds Stage 10 DI (reference: DI-1)`
);

// Test 27: Search by vendor name / description keyword
const vendorResults = searchProjectRecords(projectTime, recordsTime, 'Vendor 1');
assert(
  vendorResults.some((r) => r.reference === 'PO-1'),
  'P5-D12-03',
  `Test 27: Search by vendor name matches associated PO record`
);

// -----------------------------------------------------------------------------
// DOMAIN 13: STRICT CROSS-PROJECT ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- Domain 13: Strict Cross-Project Isolation ---');

// Test 28: Searching Project A never returns Project B records
const projectA = createTestProject('PROJ-A', 'Project Alpha');
const recordsA: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectA),
  pos: [makePo(projectA, { poNumber: 'PO-A100', totalAmount: 100, status: 'Issued', vendorName: 'Vendor A' })],
};

const projectB = createTestProject('PROJ-B', 'Project Beta');
const recordsB: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectB),
  pos: [makePo(projectB, { poNumber: 'PO-B200', totalAmount: 200, status: 'Issued', vendorName: 'Vendor B' })],
};

const searchInAForB = searchProjectRecords(projectA, recordsA, 'PO-B200');
assert(
  searchInAForB.length === 0,
  'P5-D13-01',
  `Test 28: Searching Project A for Project B reference returns 0 results`
);

const searchInBForB = searchProjectRecords(projectB, recordsB, 'PO-B200');
assert(
  searchInBForB.length === 1 && searchInBForB[0].reference === 'PO-B200',
  'P5-D13-02',
  `Searching Project B for Project B reference returns exactly its isolated record`
);

// -----------------------------------------------------------------------------
// DOMAIN 14: DYNAMIC LIVE MUTATION & SUMMARY CONSISTENCY
// -----------------------------------------------------------------------------
console.log('\n--- Domain 14: Dynamic Live Mutation Consistency ---');

const projectMutable = createTestProject('PRJ-MUTABLE', 'Live Mutation Project', '₹ 5,00,00,000');

// Initial summary with initial records
const initialRecords: ProjectWorkflowRecords = {
  ...createEmptyWorkflowRecords(projectMutable),
  tender: makeTender(projectMutable, { status: 'Awarded' }),
  loiLoa: makeLoi(projectMutable, { status: 'Accepted' }),
  acceptance: makeAcceptance(projectMutable, { status: 'Accepted' }),
  cpg: makeCpg(projectMutable, { status: 'Valid' }),
  agreement: makeAgreement(projectMutable, { status: 'Executed' }),
  gtps: [makeGtp(projectMutable, { status: 'Approved' })],
  pos: [makePo(projectMutable, { status: 'Issued', totalAmount: 10000000 })],
};

const summaryBeforeMutation = getProjectControlSummary(projectMutable, initialRecords);
assert(
  summaryBeforeMutation.billingSummary.cumulativeApprovedBilling === 0,
  'P5-D14-01',
  `Before bill addition: cumulative approved billing is 0`
);
assert(
  summaryBeforeMutation.currentStageNumber === '07',
  'P5-D14-02',
  `Before bill addition: current stage is 07 Inspection Call (PO completed, Call pending)`
);

// Simulate mutation: Adding an approved Progressive Bill without changing project model
const mutatedRecords: ProjectWorkflowRecords = {
  ...initialRecords,
  progressiveBills: [
    makeProgressiveBill(projectMutable, {
      id: 'PB-MUT-1',
      billNumber: 'PB-MUT-1',
      currentClaimedAmount: 10000000,
      currentApprovedAmount: 10000000,
      previousApprovedAmount: 0,
      status: 'Approved',
    }),
  ],
};

const summaryAfterMutation = getProjectControlSummary(projectMutable, mutatedRecords);
assert(
  summaryAfterMutation.billingSummary.cumulativeApprovedBilling === 10000000,
  'P5-D14-03',
  `Test 29: Mutating underlying store dynamically updates cumulative approved billing to 10,000,000 without state duplication`
);

assert(
  summaryAfterMutation.billingSummary.remainingContractBalance === 40000000,
  'P5-D14-04',
  `Remaining contract balance dynamically recalculates to 40,000,000`
);

// -----------------------------------------------------------------------------
// SUMMARY OF TEST RESULTS
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`PHASE 5 QA SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
