/**
 * UK HEAD OFFICE — Office Administration System
 * Phase 4: C-Admin Engine (Stages 10–13)
 *
 * Authoritative business rules, deterministic calculators, and validation safeguards:
 * 1. Multi-DI dispatch balance calculation & JIR accepted quantity capping
 * 2. Multi-MICC verification balance calculation & DI quantity capping
 * 3. Structured Progressive Bill line-item validation & billable quantity control
 * 4. Claimed vs. Approved billing separation & contract balance protection
 * 5. Deterministic Final Bill reconciliation (Contract + Adjustments - Approved Progressive Bills)
 * 6. Protection against duplicate billing, double-counting, and orphan records
 * 7. Exclusion of Cancelled DIs and Rejected MICCs/Bills from active balances
 */

import {
  Project,
  JirRecord,
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  FinalBillRecord,
} from '@/types';

/**
 * Parses diverse contract value representations (e.g. "₹ 28.40 Cr", "₹ 1,00,00,000", "₹ 50 Lakh", 10000000)
 * into an authoritative numeric rupee amount.
 */
export function parseContractValue(contractValue: string | number | undefined): number {
  if (contractValue === undefined || contractValue === null) return 0;
  if (typeof contractValue === 'number') return isNaN(contractValue) ? 0 : contractValue;

  const str = String(contractValue).trim();
  if (!str) return 0;

  // Check for 'Cr' / 'Crore'
  const crMatch = str.match(/([\d,.]+)\s*(?:Cr|Crore)/i);
  if (crMatch) {
    const num = parseFloat(crMatch[1].replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000000);
  }

  // Check for 'Lakh' / 'Lac' / 'L'
  const lakhMatch = str.match(/([\d,.]+)\s*(?:Lakh|Lac|L)\b/i);
  if (lakhMatch) {
    const num = parseFloat(lakhMatch[1].replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }

  // Standard numeric string (remove currency symbol, spaces, commas)
  const cleanStr = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// =========================================================================
// STAGE 10: DI / DISPATCH CLEARANCE
// =========================================================================

/**
 * Calculates remaining dispatchable quantity for a JIR record across all active DIs.
 *
 * Remaining dispatch quantity = JIR accepted quantity - SUM(relevant active DI quantities)
 * Cancelled DIs do NOT consume dispatch balance.
 */
export function calculateDispatchBalance(
  jir: JirRecord | undefined,
  dis: DiRecord[],
  excludeDiId?: string
): number {
  if (!jir) return 0;

  const acceptedQty = Number(jir.acceptedQuantity) || 0;
  const relevantDis = dis.filter(
    (d) =>
      d.jirId === jir.id &&
      d.status !== 'Cancelled' &&
      (!excludeDiId || d.id !== excludeDiId)
  );

  const totalDispatched = relevantDis.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  return Math.max(0, acceptedQty - totalDispatched);
}

/**
 * Validates DI creation / update to prevent orphan records and over-dispatch.
 */
export function validateDiCreation(
  data: Partial<DiRecord>,
  jir: JirRecord | undefined,
  dis: DiRecord[],
  excludeDiId?: string
): void {
  // Orphan prevention
  if (!data.jirId) {
    throw new Error('Dispatch Instruction cannot be created without a valid linked JIR.');
  }
  if (!jir) {
    throw new Error(`Referenced JIR (${data.jirId}) does not exist.`);
  }

  // Cross-project integrity
  if (data.projectId && jir.projectId && data.projectId !== jir.projectId) {
    throw new Error('Project mismatch: DI project does not match referenced JIR project.');
  }

  // Quantity boundaries
  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Dispatch quantity must be greater than 0.');
  }

  const remaining = calculateDispatchBalance(jir, dis, excludeDiId);
  if (qty > remaining) {
    throw new Error(
      `Over-dispatch error: Dispatched quantity (${qty}) exceeds remaining dispatch balance (${remaining}) for JIR ${jir.jirNumber}.`
    );
  }
}

// =========================================================================
// STAGE 11: MICC (MATERIAL INSPECTION AND CLEARANCE CERTIFICATE)
// =========================================================================

/**
 * Calculates remaining unverified quantity for a DI record across active MICCs.
 *
 * Remaining MICC quantity = DI quantity - SUM(relevant active MICC quantities)
 * Rejected MICCs do NOT consume verified/active quantity.
 */
export function calculateMiccBalance(
  di: DiRecord | undefined,
  miccs: MiccRecord[],
  excludeMiccId?: string
): number {
  if (!di) return 0;

  const diQty = Number(di.quantity) || 0;
  const relevantMiccs = miccs.filter(
    (m) =>
      m.diId === di.id &&
      m.status !== 'Rejected' &&
      (!excludeMiccId || m.id !== excludeMiccId)
  );

  const totalMicced = relevantMiccs.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  return Math.max(0, diQty - totalMicced);
}

/**
 * Validates MICC creation / update to prevent orphan records and over-verification.
 */
export function validateMiccCreation(
  data: Partial<MiccRecord>,
  di: DiRecord | undefined,
  miccs: MiccRecord[],
  excludeMiccId?: string
): void {
  // Orphan prevention
  if (!data.diId) {
    throw new Error('MICC cannot be created without a valid linked Dispatch Instruction (DI).');
  }
  if (!di) {
    throw new Error(`Referenced DI (${data.diId}) does not exist.`);
  }

  // Cross-project integrity
  if (data.projectId && di.projectId && data.projectId !== di.projectId) {
    throw new Error('Project mismatch: MICC project does not match referenced DI project.');
  }

  // Quantity boundaries
  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('MICC quantity must be greater than 0.');
  }

  const remaining = calculateMiccBalance(di, miccs, excludeMiccId);
  if (qty > remaining) {
    throw new Error(
      `Over-verification error: MICC quantity (${qty}) exceeds remaining DI quantity (${remaining}) for DI ${di.diNumber}.`
    );
  }
}

// =========================================================================
// STAGE 12: PROGRESSIVE BILL
// =========================================================================

/**
 * Calculates remaining billable quantity for a verified MICC item across non-rejected Progressive Bills.
 *
 * Remaining billable quantity = MICC quantity - SUM(previously claimed/billed quantities)
 * Rejected bills do NOT consume billable quantity.
 */
export function calculateBillableQuantity(
  micc: MiccRecord | undefined,
  bills: ProgressiveBillRecord[],
  excludeBillId?: string
): number {
  if (!micc) return 0;

  const miccQty = Number(micc.quantity) || 0;
  const relevantBills = bills.filter(
    (b) => b.status !== 'Rejected' && (!excludeBillId || b.id !== excludeBillId)
  );

  const totalBilled = relevantBills.reduce((sum, b) => {
    const matchingLines = (b.lineItems || []).filter((l) => l.miccId === micc.id);
    const lineSum = matchingLines.reduce((lSum, l) => lSum + (Number(l.claimedQuantity) || 0), 0);
    return sum + lineSum;
  }, 0);

  return Math.max(0, miccQty - totalBilled);
}

/**
 * Aggregates contract and billing figures for a project.
 *
 * Cumulative Approved = SUM(currentApprovedAmount for Approved & Partially Approved bills)
 * Claimed amounts NEVER count as approved billing.
 * Draft, Submitted, Under Review, and Rejected bills do NOT count as approved billing.
 * Remaining Contract Balance = Contract Value - Cumulative Approved.
 */
export function calculateProjectBillingSummary(
  project: Project | undefined,
  bills: ProgressiveBillRecord[],
  excludeBillId?: string
): {
  contractValue: number;
  cumulativeApprovedAmount: number;
  pendingClaimedAmount: number;
  remainingContractBalance: number;
  approvedBillsCount: number;
} {
  const contractValue = parseContractValue(project?.contractValue);
  if (!project) {
    return {
      contractValue: 0,
      cumulativeApprovedAmount: 0,
      pendingClaimedAmount: 0,
      remainingContractBalance: 0,
      approvedBillsCount: 0,
    };
  }

  const projectBills = bills.filter(
    (b) => b.projectId === project.id && (!excludeBillId || b.id !== excludeBillId)
  );

  // Only Approved and Partially Approved contribute to approved billing
  const approvedBills = projectBills.filter(
    (b) => b.status === 'Approved' || b.status === 'Partially Approved'
  );
  const cumulativeApprovedAmount = approvedBills.reduce(
    (sum, b) => sum + (Number(b.currentApprovedAmount) || 0),
    0
  );

  // Submitted & Under Review represent pending claims
  const pendingBills = projectBills.filter(
    (b) => b.status === 'Submitted' || b.status === 'Under Review'
  );
  const pendingClaimedAmount = pendingBills.reduce(
    (sum, b) => sum + (Number(b.currentClaimedAmount) || 0),
    0
  );

  const remainingContractBalance = Math.max(0, contractValue - cumulativeApprovedAmount);

  return {
    contractValue,
    cumulativeApprovedAmount,
    pendingClaimedAmount,
    remainingContractBalance,
    approvedBillsCount: approvedBills.length,
  };
}

/**
 * Validates Progressive Bill creation and line items.
 */
export function validateProgressiveBillCreation(
  data: Partial<ProgressiveBillRecord>,
  project: Project | undefined,
  allMiccs: MiccRecord[],
  existingBills: ProgressiveBillRecord[],
  excludeBillId?: string
): void {
  if (!data.projectId) {
    throw new Error('Progressive Bill cannot be created without a valid linked Project.');
  }
  if (!project) {
    throw new Error(`Referenced Project (${data.projectId}) does not exist.`);
  }

  const lineItems = data.lineItems || [];
  if (lineItems.length === 0) {
    throw new Error('Progressive Bill must contain at least one bill line item.');
  }

  // Validate each line item
  for (let i = 0; i < lineItems.length; i++) {
    const line = lineItems[i];
    if (!line.miccId) {
      throw new Error(`Line item #${i + 1} must reference a valid verified MICC.`);
    }

    const micc = allMiccs.find((m) => m.id === line.miccId);
    if (!micc) {
      throw new Error(`Line item #${i + 1} references non-existent MICC (${line.miccId}).`);
    }

    // Cross-project check
    if (micc.projectId !== project.id) {
      throw new Error(
        `Line item #${i + 1} references MICC from another project (${micc.projectCode} vs ${project.code}).`
      );
    }

    const claimedQty = Number(line.claimedQuantity);
    if (isNaN(claimedQty) || claimedQty <= 0) {
      throw new Error(`Line item #${i + 1} claimed quantity must be greater than 0.`);
    }

    const remainingQty = calculateBillableQuantity(micc, existingBills, excludeBillId);
    if (claimedQty > remainingQty) {
      throw new Error(
        `Over-billing error: Claimed quantity (${claimedQty}) for item ${line.description || line.miccNumber} exceeds remaining billable quantity (${remainingQty}).`
      );
    }
  }

  // Check approved billing against contract balance if this bill is being approved
  const summary = calculateProjectBillingSummary(project, existingBills, excludeBillId);
  const currentApproved = Number(data.currentApprovedAmount) || 0;

  if (
    (data.status === 'Approved' || data.status === 'Partially Approved') &&
    currentApproved > 0
  ) {
    if (summary.cumulativeApprovedAmount + currentApproved > summary.contractValue) {
      throw new Error(
        `Contract limit exceeded: Cumulative approved billing (₹${(
          summary.cumulativeApprovedAmount + currentApproved
        ).toLocaleString('en-IN')}) cannot exceed total contract value (₹${summary.contractValue.toLocaleString(
          'en-IN'
        )}).`
      );
    }
  }
}

// =========================================================================
// STAGE 13: FINAL BILL
// =========================================================================

/**
 * Calculates the final reconciliation bill amount:
 *
 * Final Bill Amount = Contract Value + Net Adjustments - Total Approved Progressive Bills
 *
 * Positive adjustment = increases final payable amount (e.g. approved extra works)
 * Negative adjustment = decreases final payable amount (e.g. liquidated damages, penalties)
 */
export function calculateFinalBill(
  contractValue: number,
  totalApprovedProgressiveBills: number,
  adjustments: number = 0
): number {
  return contractValue + adjustments - totalApprovedProgressiveBills;
}

/**
 * Validates Final Bill creation / update.
 * Enforces one active Final Bill per project and double-counting protection.
 */
export function validateFinalBillCreation(
  data: Partial<FinalBillRecord>,
  project: Project | undefined,
  existingFinalBills: FinalBillRecord[],
  approvedBills: ProgressiveBillRecord[],
  excludeFinalBillId?: string
): {
  contractValue: number;
  totalApprovedProgressiveBills: number;
  finalBillAmount: number;
} {
  if (!data.projectId) {
    throw new Error('Final Bill cannot be created without a valid linked Project.');
  }
  if (!project) {
    throw new Error(`Referenced Project (${data.projectId}) does not exist.`);
  }

  const contractValue = parseContractValue(project.contractValue);
  if (contractValue <= 0) {
    throw new Error('Project must have a positive agreed contract value for final bill reconciliation.');
  }

  // Single active Final Bill per project check
  const duplicate = existingFinalBills.find(
    (fb) =>
      fb.projectId === project.id &&
      fb.status !== 'Rejected' &&
      (!excludeFinalBillId || fb.id !== excludeFinalBillId)
  );
  if (duplicate) {
    throw new Error(
      `Duplicate Final Bill error: Project ${project.code} already has an active Final Bill (${duplicate.finalBillNumber}). Only one active Final Bill is permitted per project.`
    );
  }

  // Ensure all approved bills belong to this project
  const projectApprovedBills = approvedBills.filter(
    (b) =>
      b.projectId === project.id &&
      (b.status === 'Approved' || b.status === 'Partially Approved')
  );

  const totalApprovedProgressiveBills = projectApprovedBills.reduce(
    (sum, b) => sum + (Number(b.currentApprovedAmount) || 0),
    0
  );

  const adjustments = Number(data.adjustments) || 0;
  const finalBillAmount = calculateFinalBill(contractValue, totalApprovedProgressiveBills, adjustments);

  if (finalBillAmount < 0) {
    throw new Error(
      `Reconciliation error: Calculated final bill amount (₹${finalBillAmount.toLocaleString(
        'en-IN'
      )}) is negative. Adjustments or previous payments exceed contract value.`
    );
  }

  return {
    contractValue,
    totalApprovedProgressiveBills,
    finalBillAmount,
  };
}
