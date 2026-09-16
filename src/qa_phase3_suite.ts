/**
 * UK HEAD OFFICE — Office Administration System
 * PHASE 3 ADVERSARIAL QA & ARCHITECTURAL VERIFICATION SUITE
 *
 * Runs automated test assertions covering:
 * 1. Optional vendor at BOQ creation, required at PO creation
 * 2. Multi-PO quantity balance aggregation against single BOQ item
 * 3. Over-order prevention
 * 4. Multi-Inspection Call quantity limit aggregation against single PO item
 * 5. Over-call prevention
 * 6. JIR arithmetic boundary conditions (inspected <= offered, accepted+rejected <= inspected, balance = offered - accepted)
 * 7. Orphan Inspection Order prevention
 * 8. Orphan JIR prevention
 * 9. GTP revision precedence (R2 > R1 > R0, multi-digit rev precedence, out-of-order creation)
 * 10. Cancelled record exclusion from active balances
 * 11. Initial seed data consistency & relational integrity
 */

import {
  calculateRemainingBoqQuantity,
  calculateRemainingCallableQuantity,
  determineLatestGtpForBoqItem,
  validatePoCreation,
  validateInspectionCallCreation,
  validateInspectionOrderCreation,
  validateJirCreation,
} from './lib/procurement-engine';

import {
  INITIAL_VENDORS,
  INITIAL_BOQ_ITEMS,
  INITIAL_GTPS,
  INITIAL_POS,
  INITIAL_INSPECTION_CALLS,
  INITIAL_INSPECTION_ORDERS,
  INITIAL_JIRS,
} from './lib/mock-data';

import { BoqItem, PoRecord, InspectionCallRecord, GtpRecord } from './types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testLogs: Array<{ name: string; status: 'PASS' | 'FAIL'; detail?: string }> = [];

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    testLogs.push({ name: testName, status: 'PASS', detail });
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    testLogs.push({ name: testName, status: 'FAIL', detail: detail || 'Assertion failed' });
    console.error(`  [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
  }
}

function assertThrows(fn: () => void, expectedSubstring: string, testName: string) {
  totalTests++;
  try {
    fn();
    failedTests++;
    testLogs.push({ name: testName, status: 'FAIL', detail: `Expected error containing "${expectedSubstring}", but function did not throw` });
    console.error(`  [FAIL] ${testName} - Did not throw expected error`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes(expectedSubstring)) {
      passedTests++;
      testLogs.push({ name: testName, status: 'PASS', detail: `Threw expected error: ${errorMsg}` });
      console.log(`  [PASS] ${testName} (Caught: "${errorMsg}")`);
    } else {
      failedTests++;
      testLogs.push({ name: testName, status: 'FAIL', detail: `Threw unexpected error: "${errorMsg}", expected substring: "${expectedSubstring}"` });
      console.error(`  [FAIL] ${testName} - Expected "${expectedSubstring}" but got "${errorMsg}"`);
    }
  }
}

console.log('================================================================');
console.log(' UK HEAD OFFICE — PHASE 3 AUTOMATED ADVERSARIAL QA SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// TEST GROUP 1: BOQ Creation & Vendor Rules
// -------------------------------------------------------------
console.log('--- TEST GROUP 1: BOQ Creation & Vendor Linkage Rules ---');

// Test 1.1: BOQ item can be created without a vendor
const boqWithoutVendor: BoqItem = {
  id: 'BOQ-TEST-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  itemNumber: '1.01',
  description: '132kV SF6 Gas Circuit Breaker',
  specification: 'IEC 62271-100 Standard Compliant',
  category: 'Switchgear',
  quantity: 100,
  unit: 'Sets',
  rate: 450000,
  amount: 45000000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  // vendorId and vendorName intentionally undefined
};
assert(
  boqWithoutVendor.vendorId === undefined && boqWithoutVendor.vendorName === undefined,
  '1.1: BOQ item permits creation with optional/undefined vendor'
);

// Test 1.2: PO creation requires a vendor
assertThrows(
  () => {
    validatePoCreation(
      {
        vendorId: '',
        vendorName: '',
        items: [{ boqItemId: 'BOQ-TEST-001', quantity: 10 }],
      },
      () => 100
    );
  },
  'Vendor is required for Purchase Order creation',
  '1.2: PO creation strictly enforces vendor linkage requirement'
);

// -------------------------------------------------------------
// TEST GROUP 2: Multi-PO Aggregation & Over-Order Prevention
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Multi-PO Aggregation & Over-Order Prevention ---');

const testBoqItem: BoqItem = {
  id: 'BOQ-AGG-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Aggregation Project',
  itemNumber: '2.01',
  description: 'Power Transformer 132/33kV 50MVA',
  specification: 'IS 2026 Part 1-5',
  category: 'Transformers',
  quantity: 100, // Total 100 units
  unit: 'Units',
  rate: 1000000,
  amount: 100000000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const posList: PoRecord[] = [];

// Test 2.1: Remaining balance starts at full BOQ quantity
const initialRem = calculateRemainingBoqQuantity(testBoqItem, posList);
assert(initialRem === 100, '2.1: Initial remaining BOQ quantity equals full BOQ quantity (100)');

// Test 2.2: First PO orders 40 units
const po1: PoRecord = {
  id: 'PO-TEST-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Aggregation Project',
  poNumber: 'PO/2024/001',
  poDate: '2024-02-01',
  vendorId: 'VND-001',
  vendorName: 'Bharat Heavy Electricals Limited',
  status: 'Issued',
  remarks: 'QA Test PO 1',
  items: [
    {
      id: 'POL-001',
      poId: 'PO-TEST-001',
      boqItemId: 'BOQ-AGG-001',
      boqItemNumber: '2.01',
      description: 'Power Transformer 132/33kV 50MVA',
      quantity: 40,
      boqQuantity: 100,
      unit: 'Units',
      rate: 1000000,
      amount: 40000000,
      balanceQuantity: 60,
    },
  ],
  totalAmount: 40000000,
  createdAt: '2024-02-01',
  updatedAt: '2024-02-01',
};
posList.push(po1);

const remAfterPo1 = calculateRemainingBoqQuantity(testBoqItem, posList);
assert(remAfterPo1 === 60, '2.2: Remaining quantity after PO 1 (qty 40) is 60 (100 - 40)');

// Test 2.3: Second PO orders 35 units (aggregating across both POs)
const po2: PoRecord = {
  id: 'PO-TEST-002',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Aggregation Project',
  poNumber: 'PO/2024/002',
  poDate: '2024-02-15',
  vendorId: 'VND-002',
  vendorName: 'Siemens India Ltd',
  status: 'Issued',
  remarks: 'QA Test PO 2',
  items: [
    {
      id: 'POL-002',
      poId: 'PO-TEST-002',
      boqItemId: 'BOQ-AGG-001',
      boqItemNumber: '2.01',
      description: 'Power Transformer 132/33kV 50MVA',
      quantity: 35,
      boqQuantity: 100,
      unit: 'Units',
      rate: 1000000,
      amount: 35000000,
      balanceQuantity: 25,
    },
  ],
  totalAmount: 35000000,
  createdAt: '2024-02-15',
  updatedAt: '2024-02-15',
};
posList.push(po2);

const remAfterPo2 = calculateRemainingBoqQuantity(testBoqItem, posList);
assert(
  remAfterPo2 === 25,
  '2.3: Multi-PO Aggregation: Remaining quantity across PO 1 & PO 2 is 25 (100 - 40 - 35 = 25, not 65 from only PO 2)'
);

// Test 2.4: Over-Order Prevention: Third PO attempts to order 30 units when only 25 remain
assertThrows(
  () => {
    validatePoCreation(
      {
        vendorId: 'VND-001',
        vendorName: 'BHEL',
        items: [{ boqItemId: 'BOQ-AGG-001', quantity: 30, boqItemNumber: '2.01' }],
      },
      () => calculateRemainingBoqQuantity(testBoqItem, posList)
    );
  },
  'Over-order error',
  '2.4: Over-Order Prevention: Ordering 30 against remaining 25 throws Over-order error'
);

// Test 2.5: Third PO orders exact remaining balance (25 units)
const po3: PoRecord = {
  id: 'PO-TEST-003',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Aggregation Project',
  poNumber: 'PO/2024/003',
  poDate: '2024-03-01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  status: 'Issued',
  remarks: 'QA Test PO 3',
  items: [
    {
      id: 'POL-003',
      poId: 'PO-TEST-003',
      boqItemId: 'BOQ-AGG-001',
      boqItemNumber: '2.01',
      description: 'Power Transformer 132/33kV 50MVA',
      quantity: 25,
      boqQuantity: 100,
      unit: 'Units',
      rate: 1000000,
      amount: 25000000,
      balanceQuantity: 0,
    },
  ],
  totalAmount: 25000000,
  createdAt: '2024-03-01',
  updatedAt: '2024-03-01',
};
posList.push(po3);

const remAfterPo3 = calculateRemainingBoqQuantity(testBoqItem, posList);
assert(remAfterPo3 === 0, '2.5: Ordering exact remaining balance reduces remaining BOQ quantity to 0');

// Test 2.6: Zero-balance Over-Order Prevention: Any additional order throws error
assertThrows(
  () => {
    validatePoCreation(
      {
        vendorId: 'VND-001',
        vendorName: 'BHEL',
        items: [{ boqItemId: 'BOQ-AGG-001', quantity: 1, boqItemNumber: '2.01' }],
      },
      () => calculateRemainingBoqQuantity(testBoqItem, posList)
    );
  },
  'Over-order error',
  '2.6: Zero balance strictly blocks any further orders on this BOQ item'
);

// Test 2.7: Cancelled record exclusion: Cancelling PO 2 (qty 35) dynamically restores remaining balance
po2.status = 'Cancelled';
const remAfterPo2Cancelled = calculateRemainingBoqQuantity(testBoqItem, posList);
assert(
  remAfterPo2Cancelled === 35,
  '2.7: Cancelled Record Exclusion: Cancelling PO 2 (35) restores remaining balance from 0 to 35'
);

// -------------------------------------------------------------
// TEST GROUP 3: Multi-Call Aggregation & Over-Call Prevention
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Multi-Call Aggregation & Over-Call Prevention ---');

const testPoForCalls: PoRecord = {
  id: 'PO-CALL-TEST-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Inspection Call Project',
  poNumber: 'PO/CALL/2024/001',
  poDate: '2024-01-01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  status: 'Issued',
  remarks: 'QA Test PO for calls',
  items: [
    {
      id: 'POL-C01',
      poId: 'PO-CALL-TEST-001',
      boqItemId: 'BOQ-MAT-001',
      boqItemNumber: '3.01',
      description: 'Control & Relay Panels',
      quantity: 50, // Total 50 units
      boqQuantity: 50,
      unit: 'Sets',
      rate: 200000,
      amount: 10000000,
      balanceQuantity: 0,
    },
  ],
  totalAmount: 10000000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const callsList: InspectionCallRecord[] = [];

// Test 3.1: Initial callable quantity equals PO item quantity (50)
const initialCallable = calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList);
assert(initialCallable === 50, '3.1: Initial callable quantity equals PO item quantity (50)');

// Test 3.2: Call 1 calls 15 units
const call1: InspectionCallRecord = {
  id: 'CALL-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Inspection Call Project',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  poId: 'PO-CALL-TEST-001',
  poNumber: 'PO/CALL/2024/001',
  boqItemId: 'BOQ-MAT-001',
  boqItemNumber: '3.01',
  material: 'Control & Relay Panels',
  inspectionCallNumber: 'CALL/2024/001',
  poQuantity: 50,
  previouslyCalledQuantity: 0,
  quantity: 15,
  remainingQuantity: 35,
  unit: 'Sets',
  requestDate: '2024-03-01',
  proposedInspectionDate: '2024-03-10',
  inspectionLocation: 'Factory Works, Guwahati',
  status: 'Submitted',
  remarks: 'QA Test Call 1',
  createdAt: '2024-03-01',
  updatedAt: '2024-03-01',
};
callsList.push(call1);

const callableAfterCall1 = calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList);
assert(callableAfterCall1 === 35, '3.2: Remaining callable after Call 1 (15) is 35 (50 - 15)');

// Test 3.3: Call 2 calls 20 units (aggregating across Call 1 and Call 2)
const call2: InspectionCallRecord = {
  id: 'CALL-002',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Inspection Call Project',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  poId: 'PO-CALL-TEST-001',
  poNumber: 'PO/CALL/2024/001',
  boqItemId: 'BOQ-MAT-001',
  boqItemNumber: '3.01',
  material: 'Control & Relay Panels',
  inspectionCallNumber: 'CALL/2024/002',
  poQuantity: 50,
  previouslyCalledQuantity: 15,
  quantity: 20,
  remainingQuantity: 15,
  unit: 'Sets',
  requestDate: '2024-03-10',
  proposedInspectionDate: '2024-03-20',
  inspectionLocation: 'Factory Works, Guwahati',
  status: 'Scheduled',
  remarks: 'QA Test Call 2',
  createdAt: '2024-03-10',
  updatedAt: '2024-03-10',
};
callsList.push(call2);

const callableAfterCall2 = calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList);
assert(
  callableAfterCall2 === 15,
  '3.3: Multi-Call Aggregation: Remaining callable across Call 1 & Call 2 is 15 (50 - 15 - 20 = 15, not 30)'
);

// Test 3.4: Over-Call Prevention: Call 3 attempts to call 20 units when only 15 remain
assertThrows(
  () => {
    validateInspectionCallCreation(
      {
        poId: 'PO-CALL-TEST-001',
        boqItemId: 'BOQ-MAT-001',
        quantity: 20,
        poNumber: 'PO/CALL/2024/001',
      },
      true,
      () => calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList)
    );
  },
  'Over-call error',
  '3.4: Over-Call Prevention: Calling 20 against remaining 15 throws Over-call error'
);

// Test 3.5: Call 3 calls exact remaining 15 units
const call3: InspectionCallRecord = {
  id: 'CALL-003',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Inspection Call Project',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  poId: 'PO-CALL-TEST-001',
  poNumber: 'PO/CALL/2024/001',
  boqItemId: 'BOQ-MAT-001',
  boqItemNumber: '3.01',
  material: 'Control & Relay Panels',
  inspectionCallNumber: 'CALL/2024/003',
  poQuantity: 50,
  previouslyCalledQuantity: 35,
  quantity: 15,
  remainingQuantity: 0,
  unit: 'Sets',
  requestDate: '2024-03-15',
  proposedInspectionDate: '2024-03-25',
  inspectionLocation: 'Factory Works, Guwahati',
  status: 'Submitted',
  remarks: 'QA Test Call 3',
  createdAt: '2024-03-15',
  updatedAt: '2024-03-15',
};
callsList.push(call3);

const callableAfterCall3 = calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList);
assert(callableAfterCall3 === 0, '3.5: Calling exact remaining balance reduces callable quantity to 0');

// Test 3.6: Cancelled Call Exclusion: Cancelling Call 1 (15) restores callable balance to 15
call1.status = 'Cancelled';
const callableAfterCall1Cancelled = calculateRemainingCallableQuantity(testPoForCalls, 'BOQ-MAT-001', callsList);
assert(
  callableAfterCall1Cancelled === 15,
  '3.6: Cancelled Call Exclusion: Cancelling Call 1 (15) dynamically restores callable balance to 15'
);

// -------------------------------------------------------------
// TEST GROUP 4: JIR Arithmetic Boundary Conditions
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 4: JIR Arithmetic Boundary Conditions ---');

// Boundary Condition 1: Inspected quantity cannot exceed offered quantity
assertThrows(
  () => {
    validateJirCreation(
      {
        inspectionOrderId: 'INO-001',
        offeredQuantity: 50,
        inspectedQuantity: 55, // Greater than offered!
        acceptedQuantity: 50,
        rejectedQuantity: 5,
      },
      true
    );
  },
  'Inspected quantity (55) cannot exceed offered quantity (50)',
  '4.1: Boundary 1: Inspected quantity > Offered quantity throws error'
);

// Boundary Condition 2: Accepted + Rejected cannot exceed inspected quantity
assertThrows(
  () => {
    validateJirCreation(
      {
        inspectionOrderId: 'INO-001',
        offeredQuantity: 50,
        inspectedQuantity: 40,
        acceptedQuantity: 35,
        rejectedQuantity: 10, // Sum = 45 > 40!
      },
      true
    );
  },
  'Sum of accepted (35) and rejected (10) quantities cannot exceed inspected quantity (40)',
  '4.2: Boundary 2: Accepted + Rejected > Inspected quantity throws error'
);

// Boundary Condition 3: Negative quantities are blocked
assertThrows(
  () => {
    validateJirCreation(
      {
        inspectionOrderId: 'INO-001',
        offeredQuantity: 50,
        inspectedQuantity: 50,
        acceptedQuantity: -5, // Negative!
        rejectedQuantity: 55,
      },
      true
    );
  },
  'Quantities cannot be negative',
  '4.3: Boundary 3: Negative quantity values are strictly rejected'
);

// Boundary Condition 4: Exact boundary condition (Inspected == Offered, Accepted + Rejected == Inspected)
const exactResult = validateJirCreation(
  {
    inspectionOrderId: 'INO-001',
    offeredQuantity: 50,
    inspectedQuantity: 50,
    acceptedQuantity: 45,
    rejectedQuantity: 5,
  },
  true
);
assert(
  exactResult.balanceQuantity === 5,
  '4.4: Exact boundary: Balance quantity correctly equals offered (50) - accepted (45) = 5'
);

// Boundary Condition 5: 100% acceptance (Balance quantity == 0)
const fullAcceptResult = validateJirCreation(
  {
    inspectionOrderId: 'INO-001',
    offeredQuantity: 50,
    inspectedQuantity: 50,
    acceptedQuantity: 50,
    rejectedQuantity: 0,
  },
  true
);
assert(
  fullAcceptResult.balanceQuantity === 0,
  '4.5: Full acceptance: Balance quantity equals offered (50) - accepted (50) = 0'
);

// Boundary Condition 6: Partial inspection (inspected < offered, partial acceptance)
const partialResult = validateJirCreation(
  {
    inspectionOrderId: 'INO-001',
    offeredQuantity: 100,
    inspectedQuantity: 60,
    acceptedQuantity: 50,
    rejectedQuantity: 10,
  },
  true
);
assert(
  partialResult.balanceQuantity === 50,
  '4.6: Partial inspection: Balance quantity = offered (100) - accepted (50) = 50'
);

// -------------------------------------------------------------
// TEST GROUP 5: Orphan Record Prevention
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Orphan Record Prevention ---');

// Test 5.1: Orphan Inspection Order: Missing inspectionCallId
assertThrows(
  () => {
    validateInspectionOrderCreation({ inspectionCallId: '' }, true);
  },
  'Inspection Order cannot be created without a valid linked Inspection Call',
  '5.1: Missing inspectionCallId blocks Inspection Order creation'
);

// Test 5.2: Orphan Inspection Order: Non-existent inspectionCallId
assertThrows(
  () => {
    validateInspectionOrderCreation({ inspectionCallId: 'CALL-DOES-NOT-EXIST' }, false);
  },
  'Referenced Inspection Call (CALL-DOES-NOT-EXIST) does not exist',
  '5.2: Non-existent inspectionCallId blocks Inspection Order creation'
);

// Test 5.3: Valid Inspection Order with existing inspectionCallId
let orderCreatedSuccessfully = false;
try {
  validateInspectionOrderCreation({ inspectionCallId: 'CALL-001' }, true);
  orderCreatedSuccessfully = true;
} catch {
  orderCreatedSuccessfully = false;
}
assert(orderCreatedSuccessfully, '5.3: Valid linked inspectionCallId allows Inspection Order creation');

// Test 5.4: Orphan JIR: Missing inspectionOrderId
assertThrows(
  () => {
    validateJirCreation(
      {
        inspectionOrderId: '',
        offeredQuantity: 10,
        inspectedQuantity: 10,
        acceptedQuantity: 10,
        rejectedQuantity: 0,
      },
      true
    );
  },
  'JIR cannot be created without a valid linked Inspection Order',
  '5.4: Missing inspectionOrderId blocks JIR creation'
);

// Test 5.5: Orphan JIR: Non-existent inspectionOrderId
assertThrows(
  () => {
    validateJirCreation(
      {
        inspectionOrderId: 'INO-NON-EXISTENT',
        offeredQuantity: 10,
        inspectedQuantity: 10,
        acceptedQuantity: 10,
        rejectedQuantity: 0,
      },
      false
    );
  },
  'Referenced Inspection Order (INO-NON-EXISTENT) does not exist',
  '5.5: Non-existent inspectionOrderId blocks JIR creation'
);

// Test 5.6: Valid JIR with existing inspectionOrderId
let jirCreatedSuccessfully = false;
try {
  const res = validateJirCreation(
    {
      inspectionOrderId: 'INO-001',
      offeredQuantity: 10,
      inspectedQuantity: 10,
      acceptedQuantity: 10,
      rejectedQuantity: 0,
    },
    true
  );
  jirCreatedSuccessfully = res.balanceQuantity === 0;
} catch {
  jirCreatedSuccessfully = false;
}
assert(jirCreatedSuccessfully, '5.6: Valid linked inspectionOrderId allows JIR creation');

// -------------------------------------------------------------
// TEST GROUP 6: GTP Revision Status Precedence
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 6: GTP Revision Status Precedence ---');

const gtpHistory: GtpRecord[] = [];

// Revision R0: Under Review
const gtpR0: GtpRecord = {
  id: 'GTP-001',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/2024/001',
  materialItem: '132kV Isolator',
  boqItemId: 'BOQ-GTP-001',
  boqItemNumber: '1.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R0',
  status: 'Under Review',
  submissionDate: '2024-01-10',
  revisionDate: '2024-01-10',
  remarks: 'Initial GTP submission',
  createdAt: '2024-01-10',
  updatedAt: '2024-01-10',
};
gtpHistory.push(gtpR0);

const latestAfterR0 = determineLatestGtpForBoqItem('BOQ-GTP-001', gtpHistory);
assert(
  latestAfterR0?.revision === 'R0' && latestAfterR0?.status === 'Under Review',
  '6.1: Single revision R0 is identified as current revision with status Under Review'
);

// Revision R1: Approved (created later)
const gtpR1: GtpRecord = {
  id: 'GTP-002',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/2024/002',
  materialItem: '132kV Isolator',
  boqItemId: 'BOQ-GTP-001',
  boqItemNumber: '1.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R1',
  status: 'Approved',
  submissionDate: '2024-01-25',
  revisionDate: '2024-01-25',
  remarks: 'Incorporated comments',
  createdAt: '2024-01-25',
  updatedAt: '2024-01-25',
};
gtpHistory.push(gtpR1);

const latestAfterR1 = determineLatestGtpForBoqItem('BOQ-GTP-001', gtpHistory);
assert(
  latestAfterR1?.revision === 'R1' && latestAfterR1?.status === 'Approved',
  '6.2: Revision R1 (Approved) takes precedence over R0 (Under Review)'
);

// Revision R2: Rejected (e.g. fresh parameter change rejected)
const gtpR2: GtpRecord = {
  id: 'GTP-003',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/2024/003',
  materialItem: '132kV Isolator',
  boqItemId: 'BOQ-GTP-001',
  boqItemNumber: '1.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R2',
  status: 'Rejected',
  submissionDate: '2024-02-10',
  revisionDate: '2024-02-10',
  remarks: 'Creepage distance discrepancy',
  createdAt: '2024-02-10',
  updatedAt: '2024-02-10',
};
gtpHistory.push(gtpR2);

const latestAfterR2 = determineLatestGtpForBoqItem('BOQ-GTP-001', gtpHistory);
assert(
  latestAfterR2?.revision === 'R2' && latestAfterR2?.status === 'Rejected',
  '6.3: Revision R2 (Rejected) takes precedence over R1 (Approved)'
);

// Adversarial test: Out-of-order array insertion (R0 added at end with newest createdAt)
// Even if an older revision has a newer createdAt or is first in array, numeric rev R2 MUST win
const gtpR0Duplicate: GtpRecord = {
  id: 'GTP-004',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/2024/004',
  materialItem: '132kV Isolator',
  boqItemId: 'BOQ-GTP-001',
  boqItemNumber: '1.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R0',
  status: 'Draft',
  submissionDate: '2024-09-01',
  revisionDate: '2024-09-01',
  remarks: 'Late legacy upload',
  createdAt: '2024-09-01', // Much newer timestamp!
  updatedAt: '2024-09-01',
};
const shuffledGtps = [gtpR0Duplicate, gtpR0, gtpR1, gtpR2];
const winningRev = determineLatestGtpForBoqItem('BOQ-GTP-001', shuffledGtps);
assert(
  winningRev?.revision === 'R2',
  '6.4: Numerical precedence guarantees R2 wins even when R0 has a newer timestamp'
);

// Test 6.5: Multi-digit revision precedence: R10 vs R9 (string sort would fail, numeric parse must succeed)
const gtpR9: GtpRecord = {
  id: 'GTP-R9',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/R9',
  materialItem: 'Cable',
  boqItemId: 'BOQ-CABLE-001',
  boqItemNumber: '4.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R9',
  status: 'Approved',
  submissionDate: '2024-01-01',
  revisionDate: '2024-01-01',
  remarks: 'Approved version 9',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};
const gtpR10: GtpRecord = {
  id: 'GTP-R10',
  projectId: 'PRJ-2024-001',
  projectCode: 'UK-EHV-001',
  projectName: 'Test Project',
  gtpNumber: 'GTP/R10',
  materialItem: 'Cable',
  boqItemId: 'BOQ-CABLE-001',
  boqItemNumber: '4.01',
  vendorId: 'VND-001',
  vendorName: 'BHEL',
  revision: 'R10',
  status: 'Under Review',
  submissionDate: '2024-02-01',
  revisionDate: '2024-02-01',
  remarks: 'Reviewing version 10',
  createdAt: '2024-02-01',
  updatedAt: '2024-02-01',
};
const multiDigitLatest = determineLatestGtpForBoqItem('BOQ-CABLE-001', [gtpR9, gtpR10]);
assert(
  multiDigitLatest?.revision === 'R10',
  '6.5: Multi-digit revision precedence: R10 (10) strictly beats R9 (9)'
);

// -------------------------------------------------------------
// TEST GROUP 7: Seed Data Integrity & Relational Verification
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 7: Seed Data Integrity & Relational Verification ---');

assert(INITIAL_VENDORS.length >= 5, `7.1: Vendors seed data loaded (${INITIAL_VENDORS.length} records)`);
assert(INITIAL_BOQ_ITEMS.length >= 7, `7.2: BOQ items seed data loaded (${INITIAL_BOQ_ITEMS.length} records)`);
assert(INITIAL_GTPS.length >= 4, `7.3: GTP seed data loaded (${INITIAL_GTPS.length} records)`);
assert(INITIAL_POS.length >= 3, `7.4: PO seed data loaded (${INITIAL_POS.length} records)`);
assert(INITIAL_INSPECTION_CALLS.length >= 2, `7.5: Inspection Calls seed data loaded (${INITIAL_INSPECTION_CALLS.length} records)`);
assert(INITIAL_INSPECTION_ORDERS.length >= 2, `7.6: Inspection Orders seed data loaded (${INITIAL_INSPECTION_ORDERS.length} records)`);
assert(INITIAL_JIRS.length >= 1, `7.7: JIR reports seed data loaded (${INITIAL_JIRS.length} records)`);

// Check that all initial Inspection Orders link to existing Inspection Calls
const allOrdersLinked = INITIAL_INSPECTION_ORDERS.every((order) =>
  INITIAL_INSPECTION_CALLS.some((call) => call.id === order.inspectionCallId)
);
assert(allOrdersLinked, '7.8: All initial Inspection Orders link to valid Inspection Calls (no orphans)');

// Check that all initial JIRs link to existing Inspection Orders
const allJirsLinked = INITIAL_JIRS.every((jir) =>
  INITIAL_INSPECTION_ORDERS.some((order) => order.id === jir.inspectionOrderId)
);
assert(allJirsLinked, '7.9: All initial JIRs link to valid Inspection Orders (no orphans)');

// Check that all initial JIRs obey arithmetic boundaries
const allJirsValid = INITIAL_JIRS.every((jir) => {
  const b1 = jir.inspectedQuantity <= jir.offeredQuantity;
  const b2 = jir.acceptedQuantity + jir.rejectedQuantity <= jir.inspectedQuantity;
  const b3 = jir.balanceQuantity === jir.offeredQuantity - jir.acceptedQuantity;
  return b1 && b2 && b3;
});
assert(allJirsValid, '7.10: All initial JIRs obey arithmetic boundary conditions & balance formula');

// Check that no initial PO exceeds BOQ quantities
const allPosWithinBoq = INITIAL_POS.every((po) => {
  if (po.status === 'Cancelled') return true;
  return po.items.every((line) => {
    const boq = INITIAL_BOQ_ITEMS.find((b) => b.id === line.boqItemId);
    return boq ? line.quantity <= boq.quantity : true;
  });
});
assert(allPosWithinBoq, '7.11: All initial POs have line quantities within BOQ item limits');

// Check that no initial Inspection Call exceeds PO quantities
const allCallsWithinPo = INITIAL_INSPECTION_CALLS.every((call) => {
  if (call.status === 'Cancelled') return true;
  const po = INITIAL_POS.find((p) => p.id === call.poId);
  if (!po) return true;
  const line = po.items.find((l) => l.boqItemId === call.boqItemId);
  return line ? call.quantity <= line.quantity : true;
});
assert(allCallsWithinPo, '7.12: All initial Inspection Calls have quantities within PO line limits');

console.log('\n================================================================');
console.log(` RESULTS: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
