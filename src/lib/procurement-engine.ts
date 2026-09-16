/**
 * UK HEAD OFFICE — Office Administration System
 * Phase 3: Procurement & Inspection Foundation Engine (Stages 05–09)
 *
 * Core business rules, aggregation calculators, and validation safeguards:
 * 1. Multi-PO BOQ quantity aggregation & over-order protection
 * 2. Multi-Inspection Call PO line aggregation & over-call protection
 * 3. Latest GTP revision resolution
 * 4. JIR arithmetic boundaries & balance calculation
 * 5. Orphan prevention for Inspection Orders and JIRs
 * 6. Exclusion of Cancelled records from active balance consumption
 */

import {
  BoqItem,
  PoRecord,
  InspectionCallRecord,
  GtpRecord,
} from '@/types';

/**
 * Extracts integer revision number from revision code string (e.g., 'R0' -> 0, 'R1' -> 1, 'Rev 2' -> 2).
 */
export function parseRevisionNumber(revStr?: string): number {
  if (!revStr) return 0;
  const match = revStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Clarification 2 & 6:
 * PO quantity balance aggregates across ALL relevant active/non-cancelled POs referencing the same BOQ item.
 *
 * Remaining BOQ quantity = BOQ quantity - SUM(relevant active PO quantities)
 * Does NOT calculate balance against only the latest PO.
 * Cancelled POs do NOT consume BOQ quantity.
 */
export function calculateRemainingBoqQuantity(
  boqItem: BoqItem | undefined,
  pos: PoRecord[],
  excludePoId?: string
): number {
  if (!boqItem) return 0;

  const relevantPos = pos.filter(
    (p) => p.status !== 'Cancelled' && (!excludePoId || p.id !== excludePoId)
  );

  const totalOrdered = relevantPos.reduce((sum, p) => {
    const matchingLines = (p.items || []).filter((l) => l.boqItemId === boqItem.id);
    const poLineSum = matchingLines.reduce((lSum, l) => lSum + (Number(l.quantity) || 0), 0);
    return sum + poLineSum;
  }, 0);

  return Math.max(0, boqItem.quantity - totalOrdered);
}

/**
 * Clarification 3 & 6:
 * Inspection Call quantity limits aggregate ALL relevant previous inspection calls for the same PO and BOQ line item.
 *
 * Remaining callable quantity = PO line quantity - SUM(relevant previous active inspection call quantities)
 * Does NOT validate only against immediately previous call.
 * Cancelled calls do NOT consume callable quantity.
 */
export function calculateRemainingCallableQuantity(
  po: PoRecord | undefined,
  boqItemId: string,
  inspectionCalls: InspectionCallRecord[],
  excludeCallId?: string
): number {
  if (!po) return 0;

  const poLine = (po.items || []).find((l) => l.boqItemId === boqItemId);
  if (!poLine) return 0;

  const relevantCalls = inspectionCalls.filter(
    (c) =>
      c.poId === po.id &&
      c.boqItemId === boqItemId &&
      c.status !== 'Cancelled' &&
      (!excludeCallId || c.id !== excludeCallId)
  );

  const totalCalled = relevantCalls.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

  return Math.max(0, poLine.quantity - totalCalled);
}

/**
 * Clarification 4:
 * GTP revision status must be determined from the current/latest revision.
 * Historical revisions must not incorrectly determine current Stage 05 status.
 */
export function determineLatestGtpForBoqItem(
  boqItemId: string,
  gtps: GtpRecord[]
): GtpRecord | undefined {
  const itemGtps = gtps.filter((g) => g.boqItemId === boqItemId);
  if (itemGtps.length === 0) return undefined;

  return [...itemGtps].sort((a, b) => {
    const revA = parseRevisionNumber(a.revision);
    const revB = parseRevisionNumber(b.revision);
    if (revB !== revA) return revB - revA;
    return b.createdAt.localeCompare(a.createdAt);
  })[0];
}

/**
 * Validates Purchase Order creation against BOQ balances and vendor requirements.
 */
export function validatePoCreation(
  data: {
    vendorId?: string;
    vendorName?: string;
    items?: Array<{ boqItemId: string; quantity: number; boqItemNumber?: string }>;
  },
  getRemainingBoqQty: (boqItemId: string) => number
): void {
  // Clarification 1: Vendor linkage becomes required at PO workflow level
  if (!data.vendorId || !data.vendorName) {
    throw new Error('Vendor is required for Purchase Order creation.');
  }

  if (!data.items || data.items.length === 0) {
    throw new Error('Purchase Order must contain at least one line item.');
  }

  // Clarification 2 & 5: Over-order prevention across all POs
  for (const line of data.items) {
    if (Number(line.quantity) <= 0) {
      throw new Error(`Line item quantity must be greater than zero.`);
    }
    const remaining = getRemainingBoqQty(line.boqItemId);
    if (line.quantity > remaining) {
      throw new Error(
        `Over-order error: Ordered quantity (${line.quantity}) exceeds remaining BOQ quantity (${remaining}) for item ${line.boqItemNumber || line.boqItemId}.`
      );
    }
  }
}

/**
 * Validates Inspection Call creation against PO balances and limits.
 */
export function validateInspectionCallCreation(
  data: {
    poId: string;
    boqItemId: string;
    quantity: number;
    poNumber?: string;
  },
  poExists: boolean,
  getRemainingCallableQty: (poId: string, boqItemId: string) => number
): void {
  if (!poExists) {
    throw new Error(`Referenced PO (${data.poId}) does not exist.`);
  }

  if (Number(data.quantity) <= 0) {
    throw new Error('Inspection Call quantity must be greater than zero.');
  }

  // Clarification 3 & 5: Over-call prevention across all previous calls
  const remaining = getRemainingCallableQty(data.poId, data.boqItemId);
  if (data.quantity > remaining) {
    throw new Error(
      `Over-call error: Called quantity (${data.quantity}) exceeds remaining callable quantity (${remaining}) for PO ${data.poNumber || data.poId}.`
    );
  }
}

/**
 * Validates Inspection Order creation (Orphan Inspection Order prevention).
 */
export function validateInspectionOrderCreation(
  data: { inspectionCallId?: string },
  callExists: boolean
): void {
  if (!data.inspectionCallId) {
    throw new Error('Inspection Order cannot be created without a valid linked Inspection Call.');
  }
  if (!callExists) {
    throw new Error(`Referenced Inspection Call (${data.inspectionCallId}) does not exist.`);
  }
}

/**
 * Validates JIR creation (Orphan JIR prevention & Arithmetic Boundary Conditions).
 *
 * Boundary rules:
 * 1. 0 <= inspectedQuantity <= offeredQuantity
 * 2. 0 <= acceptedQuantity + rejectedQuantity <= inspectedQuantity
 * 3. balanceQuantity = offeredQuantity - acceptedQuantity
 */
export function validateJirCreation(
  data: {
    inspectionOrderId?: string;
    offeredQuantity: number;
    inspectedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
  },
  orderExists: boolean
): { balanceQuantity: number } {
  // Orphan JIR prevention
  if (!data.inspectionOrderId) {
    throw new Error('JIR cannot be created without a valid linked Inspection Order.');
  }
  if (!orderExists) {
    throw new Error(`Referenced Inspection Order (${data.inspectionOrderId}) does not exist.`);
  }

  // Arithmetic boundary conditions
  if (data.offeredQuantity < 0 || data.inspectedQuantity < 0 || data.acceptedQuantity < 0 || data.rejectedQuantity < 0) {
    throw new Error('Quantities cannot be negative.');
  }

  if (data.inspectedQuantity > data.offeredQuantity) {
    throw new Error(
      `Boundary condition violated: Inspected quantity (${data.inspectedQuantity}) cannot exceed offered quantity (${data.offeredQuantity}).`
    );
  }

  if (data.acceptedQuantity + data.rejectedQuantity > data.inspectedQuantity) {
    throw new Error(
      `Boundary condition violated: Sum of accepted (${data.acceptedQuantity}) and rejected (${data.rejectedQuantity}) quantities cannot exceed inspected quantity (${data.inspectedQuantity}).`
    );
  }

  const balanceQuantity = data.offeredQuantity - data.acceptedQuantity;
  return { balanceQuantity };
}
