/**
 * UK HEAD OFFICE — Office Administration System
 * PHASE 5: COMPLETE PROJECT CONTROL ENGINE
 *
 * Deterministic business logic for the Project Control Center.
 * Derives operational summaries, current stage, 13-stage timeline,
 * pending actions, exceptions, activity timeline, health, and cross-module search
 * strictly from underlying Phase 1-4 records.
 *
 * ZERO duplicate source-of-truth storage.
 */

import {
  Project,
  TenderRecord,
  LoiLoaRecord,
  AcceptanceRecord,
  CpgRecord,
  AgreementRecord,
  BoqItem,
  GtpRecord,
  PoRecord,
  InspectionCallRecord,
  InspectionOrderRecord,
  JirRecord,
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  FinalBillRecord,
  Vendor,
  ProjectControlSummary,
  ProjectStageStatusInfo,
  ProjectControlStageStatus,
  ProjectProcurementSummary,
  ProjectInspectionSummary,
  ProjectDispatchSummary,
  ProjectMiccSummary,
  ProjectControlBillingSummary,
  ProjectPendingAction,
  ProjectException,
  ProjectActivityEvent,
  ProjectHealthSummary,
  ProjectSearchResult,
} from '@/types';
import { calculateRemainingBoqQuantity } from './procurement-engine';
import { parseContractValue } from './c-admin-engine';

export interface ProjectWorkflowRecords {
  project: Project;
  tender?: TenderRecord;
  loiLoa?: LoiLoaRecord;
  acceptance?: AcceptanceRecord;
  cpg?: CpgRecord;
  agreement?: AgreementRecord;
  boqItems: BoqItem[];
  gtps: GtpRecord[];
  pos: PoRecord[];
  inspectionCalls: InspectionCallRecord[];
  inspectionOrders: InspectionOrderRecord[];
  jirs: JirRecord[];
  dis: DiRecord[];
  miccs: MiccRecord[];
  progressiveBills: ProgressiveBillRecord[];
  finalBills: FinalBillRecord[];
  vendors?: Vendor[];
}

// ==========================================
// 1. PROCUREMENT SUMMARY (STAGES 05-06)
// ==========================================

export function calculateProcurementSummary(
  project: Project,
  boqItems: BoqItem[],
  gtps: GtpRecord[],
  pos: PoRecord[]
): ProjectProcurementSummary {
  // Strict project filtering
  const projectBoqs = boqItems.filter((b) => b.projectId === project.id);
  const projectGtps = gtps.filter((g) => g.projectId === project.id);
  const projectPos = pos.filter((p) => p.projectId === project.id);

  const boqItemCount = projectBoqs.length;
  const totalBoqEstimatedAmount = projectBoqs.reduce(
    (sum, item) => sum + (item.amount || item.quantity * item.rate),
    0
  );
  const totalBoqQuantity = projectBoqs.reduce((sum, item) => sum + item.quantity, 0);

  const activePos = projectPos.filter((p) => p.status !== 'Cancelled');
  const activePoCount = activePos.length;

  const totalOrderedQuantity = activePos.reduce(
    (sum, p) => sum + (p.items || []).reduce((lSum, l) => lSum + (l.quantity || 0), 0),
    0
  );

  // Authoritative Phase 3 remaining BOQ quantity calculation
  const remainingQuantity = projectBoqs.reduce(
    (sum, item) => sum + calculateRemainingBoqQuantity(item, projectPos),
    0
  );

  const totalPoAmount = activePos.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const gtpCount = projectGtps.length;
  const approvedGtpCount = projectGtps.filter((g) => g.status === 'Approved').length;
  const underReviewGtpCount = projectGtps.filter((g) => g.status === 'Under Review').length;

  let procurementStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required' = 'Not Started';
  if (boqItemCount === 0) {
    procurementStatus = 'Not Started';
  } else if (activePoCount > 0 && remainingQuantity === 0 && (gtpCount === 0 || approvedGtpCount === gtpCount)) {
    procurementStatus = 'Completed';
  } else if (activePoCount > 0 || gtpCount > 0) {
    procurementStatus = 'In Progress';
  } else {
    procurementStatus = 'Not Started';
  }

  return {
    boqItemCount,
    totalBoqEstimatedAmount,
    totalBoqQuantity,
    activePoCount,
    totalOrderedQuantity,
    remainingQuantity,
    totalPoAmount,
    gtpCount,
    approvedGtpCount,
    underReviewGtpCount,
    procurementStatus,
  };
}

// ==========================================
// 2. INSPECTION SUMMARY (STAGES 07-09)
// ==========================================

export function calculateInspectionSummary(
  project: Project,
  calls: InspectionCallRecord[],
  orders: InspectionOrderRecord[],
  jirs: JirRecord[]
): ProjectInspectionSummary {
  // Strict project filtering
  const projectCalls = calls.filter((c) => c.projectId === project.id);
  const projectOrders = orders.filter((o) => o.projectId === project.id);
  const projectJirs = jirs.filter((j) => j.projectId === project.id);

  const activeCalls = projectCalls.filter((c) => c.status !== 'Cancelled');
  const callCount = activeCalls.length;
  const orderCount = projectOrders.length;
  const jirCount = projectJirs.length;

  const offeredQuantity = projectJirs.reduce((sum, j) => sum + (j.offeredQuantity || 0), 0);
  const inspectedQuantity = projectJirs.reduce((sum, j) => sum + (j.inspectedQuantity || 0), 0);
  const acceptedQuantity = projectJirs.reduce((sum, j) => sum + (j.acceptedQuantity || 0), 0);
  const rejectedQuantity = projectJirs.reduce((sum, j) => sum + (j.rejectedQuantity || 0), 0);
  const balanceQuantity = projectJirs.reduce((sum, j) => sum + (j.balanceQuantity || 0), 0);

  let inspectionStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required' = 'Not Started';
  if (callCount === 0 && orderCount === 0 && jirCount === 0) {
    inspectionStatus = 'Not Started';
  } else if (jirCount > 0 && balanceQuantity === 0 && acceptedQuantity > 0) {
    inspectionStatus = 'Completed';
  } else if (callCount > 0 || orderCount > 0 || jirCount > 0) {
    inspectionStatus = 'In Progress';
  } else {
    inspectionStatus = 'Not Started';
  }

  return {
    callCount,
    orderCount,
    jirCount,
    offeredQuantity,
    inspectedQuantity,
    acceptedQuantity,
    rejectedQuantity,
    balanceQuantity,
    inspectionStatus,
  };
}

// ==========================================
// 3. DISPATCH SUMMARY (STAGE 10)
// ==========================================

export function calculateDispatchSummary(
  project: Project,
  jirs: JirRecord[],
  dis: DiRecord[]
): ProjectDispatchSummary {
  // Strict project filtering
  const projectJirs = jirs.filter((j) => j.projectId === project.id);
  const projectDis = dis.filter((d) => d.projectId === project.id);

  const acceptedQuantity = projectJirs.reduce((sum, j) => sum + (j.acceptedQuantity || 0), 0);
  const activeDis = projectDis.filter((d) => d.status !== 'Cancelled');
  const activeDiCount = activeDis.length;
  const dispatchedQuantity = activeDis.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const remainingDispatchQuantity = Math.max(0, acceptedQuantity - dispatchedQuantity);

  // Latest DI
  const sortedDis = [...activeDis].sort(
    (a, b) => new Date(b.diDate || b.createdAt).getTime() - new Date(a.diDate || a.createdAt).getTime()
  );
  const latestDi = sortedDis[0];

  let dispatchStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required' = 'Not Started';
  if (acceptedQuantity === 0 && activeDiCount === 0) {
    dispatchStatus = 'Not Started';
  } else if (acceptedQuantity > 0 && remainingDispatchQuantity === 0 && activeDiCount > 0) {
    dispatchStatus = 'Completed';
  } else if (activeDiCount > 0) {
    dispatchStatus = 'In Progress';
  } else if (acceptedQuantity > 0 && activeDiCount === 0) {
    dispatchStatus = 'Attention Required'; // JIR accepted but dispatch not started
  } else {
    dispatchStatus = 'Not Started';
  }

  return {
    acceptedQuantity,
    activeDiCount,
    dispatchedQuantity,
    remainingDispatchQuantity,
    latestDiNumber: latestDi?.diNumber,
    latestDiDate: latestDi?.diDate,
    dispatchStatus,
  };
}

// ==========================================
// 4. MICC / FIELD VERIFICATION SUMMARY (STAGE 11)
// ==========================================

export function calculateMiccSummary(
  project: Project,
  dis: DiRecord[],
  miccs: MiccRecord[]
): ProjectMiccSummary {
  // Strict project filtering
  const projectDis = dis.filter((d) => d.projectId === project.id);
  const projectMiccs = miccs.filter((m) => m.projectId === project.id);

  const activeDis = projectDis.filter((d) => d.status !== 'Cancelled');
  const totalDispatchedQuantity = activeDis.reduce((sum, d) => sum + (d.quantity || 0), 0);

  const activeMiccs = projectMiccs.filter((m) => m.status !== 'Rejected');
  const activeMiccCount = activeMiccs.length;

  const verifiedMiccs = projectMiccs.filter((m) => m.status === 'Verified');
  const verifiedQuantity = verifiedMiccs.reduce((sum, m) => sum + (m.quantity || 0), 0);

  const pendingVerificationQuantity = Math.max(0, totalDispatchedQuantity - verifiedQuantity);
  const rejectedMiccCount = projectMiccs.filter((m) => m.status === 'Rejected').length;

  let miccStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required' = 'Not Started';
  if (totalDispatchedQuantity === 0 && activeMiccCount === 0) {
    miccStatus = 'Not Started';
  } else if (totalDispatchedQuantity > 0 && pendingVerificationQuantity === 0 && verifiedQuantity > 0) {
    miccStatus = 'Completed';
  } else if (activeMiccCount > 0) {
    miccStatus = 'In Progress';
  } else if (totalDispatchedQuantity > 0 && activeMiccCount === 0) {
    miccStatus = 'Attention Required';
  } else {
    miccStatus = 'Not Started';
  }

  return {
    totalDispatchedQuantity,
    activeMiccCount,
    verifiedQuantity,
    pendingVerificationQuantity,
    rejectedMiccCount,
    miccStatus,
  };
}

// ==========================================
// 5. BILLING SUMMARY (STAGES 12-13)
// ==========================================

export function calculateBillingSummary(
  project: Project,
  progressiveBills: ProgressiveBillRecord[],
  finalBills: FinalBillRecord[]
): ProjectControlBillingSummary {
  // Strict project filtering
  const projectProgressiveBills = progressiveBills.filter((b) => b.projectId === project.id);
  const projectFinalBills = finalBills.filter((f) => f.projectId === project.id);

  const contractValue = parseContractValue(project.contractValue);

  // Authoritative Phase 4 rule: only approved amounts from Approved / Partially Approved bills
  const approvedBills = projectProgressiveBills.filter(
    (b) => b.status === 'Approved' || b.status === 'Partially Approved'
  );
  const cumulativeApprovedBilling = approvedBills.reduce(
    (sum, b) => sum + (b.currentApprovedAmount || 0),
    0
  );

  const pendingBills = projectProgressiveBills.filter(
    (b) => b.status === 'Draft' || b.status === 'Submitted' || b.status === 'Under Review'
  );
  const pendingClaimedBilling = pendingBills.reduce(
    (sum, b) => sum + (b.currentClaimedAmount || 0),
    0
  );

  const remainingContractBalance = Math.max(0, contractValue - cumulativeApprovedBilling);
  const progressiveBillsCount = projectProgressiveBills.length;
  const approvedBillsCount = approvedBills.length;

  const activeFinalBill = projectFinalBills.find((f) => f.status !== 'Rejected');
  const finalBillStatus = activeFinalBill?.status;

  // Final Bill formula: Contract Value + Adjustments - Cumulative Approved Progressive Bills
  let finalBillAmount: number | undefined;
  if (activeFinalBill) {
    finalBillAmount = contractValue + (activeFinalBill.adjustments || 0) - cumulativeApprovedBilling;
  }

  const isFinanciallyClosed = activeFinalBill?.status === 'Approved';

  let billingStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required' = 'Not Started';
  if (isFinanciallyClosed) {
    billingStatus = 'Completed';
  } else if (activeFinalBill?.status === 'Rejected') {
    billingStatus = 'Attention Required';
  } else if (progressiveBillsCount > 0 || activeFinalBill !== undefined) {
    billingStatus = 'In Progress';
  } else {
    billingStatus = 'Not Started';
  }

  return {
    contractValue,
    cumulativeApprovedBilling,
    pendingClaimedBilling,
    remainingContractBalance,
    progressiveBillsCount,
    approvedBillsCount,
    finalBillStatus,
    finalBillAmount,
    isFinanciallyClosed,
    billingStatus,
  };
}

// ==========================================
// 6. STAGE STATUSES (ALL 13 STAGES)
// ==========================================

export function calculateStageStatuses(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectStageStatusInfo[] {
  const {
    tender,
    loiLoa,
    acceptance,
    cpg,
    agreement,
    boqItems,
    gtps,
    pos,
    inspectionCalls,
    inspectionOrders,
    jirs,
    dis,
    miccs,
    progressiveBills,
    finalBills,
  } = records;

  // Strict project filtering
  const projectBoqs = boqItems.filter((b) => b.projectId === project.id);
  const projectGtps = gtps.filter((g) => g.projectId === project.id);
  const projectPos = pos.filter((p) => p.projectId === project.id);
  const projectCalls = inspectionCalls.filter((c) => c.projectId === project.id);
  const projectOrders = inspectionOrders.filter((o) => o.projectId === project.id);
  const projectJirs = jirs.filter((j) => j.projectId === project.id);
  const projectDis = dis.filter((d) => d.projectId === project.id);
  const projectMiccs = miccs.filter((m) => m.projectId === project.id);
  const projectPbs = progressiveBills.filter((b) => b.projectId === project.id);
  const projectFbs = finalBills.filter((f) => f.projectId === project.id);

  const procSummary = calculateProcurementSummary(project, projectBoqs, projectGtps, projectPos);
  const inspSummary = calculateInspectionSummary(project, projectCalls, projectOrders, projectJirs);
  const dispSummary = calculateDispatchSummary(project, projectJirs, projectDis);
  const miccSummary = calculateMiccSummary(project, projectDis, projectMiccs);
  const billSummary = calculateBillingSummary(project, projectPbs, projectFbs);

  const stageResults: ProjectStageStatusInfo[] = [];

  // STAGE 01: Tender
  {
    const hasTender = !!tender;
    const isCompleted = tender?.status === 'Awarded' || !!loiLoa;
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : hasTender
      ? 'In Progress'
      : 'Not Started';
    stageResults.push({
      stageId: '01',
      stageNumber: '01',
      name: 'Tender',
      adminGroup: 'ADMIN_A',
      group: 'A',
      status,
      primaryReference: tender?.tenderNumber,
      date: tender?.tenderDate || tender?.createdAt,
      summary: tender ? `Tender ${tender.tenderNumber} (${tender.status})` : 'Tender preparation and submission',
      navigationHref: '/tenders',
      recordCount: tender ? 1 : 0,
    });
  }

  // STAGE 02: LOI / LOA
  {
    const hasLoi = !!loiLoa;
    const isCompleted = loiLoa?.status === 'Accepted';
    const s01Completed = stageResults[0].status === 'Completed';
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : hasLoi
      ? 'In Progress'
      : s01Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '02',
      stageNumber: '02',
      name: 'LOI / LOA',
      adminGroup: 'ADMIN_A',
      group: 'A',
      status,
      primaryReference: loiLoa?.loiNumber,
      date: loiLoa?.date || loiLoa?.createdAt,
      summary: loiLoa ? `LOI/LOA ${loiLoa.loiNumber} (${loiLoa.status})` : 'Letter of Intent / Award receipt',
      navigationHref: '/loi-loa',
      recordCount: loiLoa ? 1 : 0,
    });
  }

  // STAGE 03: Acceptance
  {
    const hasAcc = !!acceptance;
    const isCompleted = acceptance?.status === 'Accepted';
    const s02Completed = stageResults[1].status === 'Completed';
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : hasAcc
      ? 'In Progress'
      : s02Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '03',
      stageNumber: '03',
      name: 'Acceptance',
      adminGroup: 'ADMIN_A',
      group: 'A',
      status,
      primaryReference: acceptance?.acceptanceRef,
      date: acceptance?.acceptanceDate || acceptance?.createdAt,
      summary: acceptance ? `Acceptance ${acceptance.acceptanceRef} (${acceptance.status})` : 'Formal contract acceptance',
      navigationHref: '/acceptance',
      recordCount: acceptance ? 1 : 0,
    });
  }

  // STAGE 04: CPG + Agreement
  {
    const hasCpgAgreement = !!(cpg || agreement);
    const isCompleted =
      (cpg?.status === 'Valid' || cpg?.status === 'Submitted') && agreement?.status === 'Executed';
    const s03Completed = stageResults[2].status === 'Completed';
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : hasCpgAgreement
      ? 'In Progress'
      : s03Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '04',
      stageNumber: '04',
      name: 'CPG + Agreement',
      adminGroup: 'ADMIN_A',
      group: 'A',
      status,
      primaryReference: agreement?.agreementRef || cpg?.cpgRef,
      date: agreement?.agreementDate || cpg?.cpgDate,
      summary: agreement
        ? `Agreement ${agreement.agreementRef} (CPG: ${cpg?.status || 'N/A'})`
        : cpg
        ? `CPG ${cpg.cpgRef} (Agreement Pending)`
        : 'Performance guarantee & formal agreement',
      navigationHref: '/cpg-agreement',
      recordCount: (cpg ? 1 : 0) + (agreement ? 1 : 0),
    });
  }

  // STAGE 05: GTP
  {
    const gtpCount = projectGtps.length;
    const allApproved = gtpCount > 0 && projectGtps.every((g) => g.status === 'Approved');
    const s04Completed = stageResults[3].status === 'Completed';
    const status: ProjectControlStageStatus = allApproved
      ? 'Completed'
      : gtpCount > 0
      ? 'In Progress'
      : s04Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '05',
      stageNumber: '05',
      name: 'GTP Approval',
      adminGroup: 'ADMIN_B',
      group: 'B',
      status,
      primaryReference: projectGtps[0]?.gtpNumber,
      date: projectGtps[0]?.submissionDate || projectGtps[0]?.createdAt,
      summary:
        gtpCount > 0
          ? `${procSummary.approvedGtpCount} of ${gtpCount} GTP approved`
          : 'Guaranteed Technical Particulars approval',
      navigationHref: '/gtp',
      recordCount: gtpCount,
    });
  }

  // STAGE 06: PO
  {
    const poCount = procSummary.activePoCount;
    const isCompleted = poCount > 0 && procSummary.remainingQuantity === 0;
    const s05Completed = stageResults[4].status === 'Completed';
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : poCount > 0
      ? 'In Progress'
      : s05Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '06',
      stageNumber: '06',
      name: 'Purchase Order',
      adminGroup: 'ADMIN_B',
      group: 'B',
      status,
      primaryReference: projectPos[0]?.poNumber,
      date: projectPos[0]?.poDate || projectPos[0]?.createdAt,
      summary:
        poCount > 0
          ? `${poCount} active POs (${procSummary.totalOrderedQuantity} ordered, ${procSummary.remainingQuantity} remaining)`
          : 'Vendor Purchase Order placement',
      navigationHref: '/po',
      recordCount: poCount,
    });
  }

  // STAGE 07: Inspection Call
  {
    const callCount = inspSummary.callCount;
    const s06Completed = stageResults[5].status === 'Completed' || stageResults[5].status === 'In Progress';
    const isCompleted = callCount > 0 && projectCalls.every((c) => c.status === 'Completed');
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : callCount > 0
      ? 'In Progress'
      : s06Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '07',
      stageNumber: '07',
      name: 'Inspection Call',
      adminGroup: 'ADMIN_B',
      group: 'B',
      status,
      primaryReference: projectCalls[0]?.inspectionCallNumber,
      date: projectCalls[0]?.requestDate || projectCalls[0]?.createdAt,
      summary:
        callCount > 0
          ? `${callCount} inspection calls issued`
          : 'Inspection call to client / TPIA',
      navigationHref: '/inspection-call',
      recordCount: callCount,
    });
  }

  // STAGE 08: Inspection Order
  {
    const orderCount = inspSummary.orderCount;
    const s07Completed = stageResults[6].status === 'Completed' || stageResults[6].status === 'In Progress';
    const isCompleted = orderCount > 0 && projectOrders.every((o) => o.status === 'Completed');
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : orderCount > 0
      ? 'In Progress'
      : s07Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '08',
      stageNumber: '08',
      name: 'Inspection Order',
      adminGroup: 'ADMIN_B',
      group: 'B',
      status,
      primaryReference: projectOrders[0]?.inspectionOrderNumber,
      date: projectOrders[0]?.orderDate || projectOrders[0]?.createdAt,
      summary:
        orderCount > 0
          ? `${orderCount} inspection orders deputed`
          : 'Deputation of inspection officer',
      navigationHref: '/inspection-order',
      recordCount: orderCount,
    });
  }

  // STAGE 09: JIR / Inspection Report
  {
    const jirCount = inspSummary.jirCount;
    const s08Completed = stageResults[7].status === 'Completed' || stageResults[7].status === 'In Progress';
    const isCompleted = jirCount > 0 && inspSummary.balanceQuantity === 0 && inspSummary.acceptedQuantity > 0;
    const status: ProjectControlStageStatus = isCompleted
      ? 'Completed'
      : jirCount > 0
      ? 'In Progress'
      : s08Completed
      ? 'Not Started'
      : 'Locked';
    stageResults.push({
      stageId: '09',
      stageNumber: '09',
      name: 'JIR / Inspection Report',
      adminGroup: 'ADMIN_B',
      group: 'B',
      status,
      primaryReference: projectJirs[0]?.jirNumber,
      date: projectJirs[0]?.inspectionDate || projectJirs[0]?.createdAt,
      summary:
        jirCount > 0
          ? `${inspSummary.acceptedQuantity} accepted, ${inspSummary.rejectedQuantity} rejected`
          : 'Joint Inspection Report generation',
      navigationHref: '/jir',
      recordCount: jirCount,
    });
  }

  // STAGE 10: DI / Dispatch Clearance
  {
    const diCount = dispSummary.activeDiCount;
    const s09Completed = stageResults[8].status === 'Completed';
    let status: ProjectControlStageStatus = 'Not Started';
    if (s09Completed && diCount === 0 && dispSummary.acceptedQuantity > 0) {
      status = 'Attention Required'; // JIR accepted but not yet dispatched
    } else if (diCount > 0 && dispSummary.remainingDispatchQuantity === 0) {
      status = 'Completed';
    } else if (diCount > 0) {
      status = 'In Progress';
    } else if (s09Completed) {
      status = 'Not Started';
    } else {
      status = 'Locked';
    }
    stageResults.push({
      stageId: '10',
      stageNumber: '10',
      name: 'DI / Dispatch Clearance',
      adminGroup: 'ADMIN_C',
      group: 'C',
      status,
      primaryReference: dispSummary.latestDiNumber,
      date: dispSummary.latestDiDate,
      summary:
        diCount > 0
          ? `${diCount} DIs (${dispSummary.dispatchedQuantity} dispatched, ${dispSummary.remainingDispatchQuantity} remaining)`
          : dispSummary.acceptedQuantity > 0
          ? `${dispSummary.acceptedQuantity} units awaiting dispatch`
          : 'Dispatch Instruction from client',
      navigationHref: '/di',
      recordCount: diCount,
    });
  }

  // STAGE 11: MICC
  {
    const miccCount = miccSummary.activeMiccCount;
    const s10Active = stageResults[9].status === 'Completed' || stageResults[9].status === 'In Progress';
    let status: ProjectControlStageStatus = 'Not Started';
    if (miccSummary.totalDispatchedQuantity > 0 && miccSummary.pendingVerificationQuantity === 0 && miccSummary.verifiedQuantity > 0) {
      status = 'Completed';
    } else if (miccCount > 0) {
      status = 'In Progress';
    } else if (miccSummary.totalDispatchedQuantity > 0) {
      status = 'Attention Required'; // Material dispatched awaiting MICC
    } else if (s10Active) {
      status = 'Not Started';
    } else {
      status = 'Locked';
    }
    stageResults.push({
      stageId: '11',
      stageNumber: '11',
      name: 'MICC',
      adminGroup: 'ADMIN_C',
      group: 'C',
      status,
      primaryReference: projectMiccs[0]?.miccNumber,
      date: projectMiccs[0]?.miccDate || projectMiccs[0]?.createdAt,
      summary:
        miccCount > 0
          ? `${miccSummary.verifiedQuantity} verified, ${miccSummary.pendingVerificationQuantity} pending`
          : miccSummary.totalDispatchedQuantity > 0
          ? `${miccSummary.totalDispatchedQuantity} units awaiting site verification`
          : 'Material Inward & Clearance Certificate',
      navigationHref: '/micc',
      recordCount: miccCount,
    });
  }

  // STAGE 12: Progressive Bill
  {
    const pbCount = billSummary.progressiveBillsCount;
    const s11Active = stageResults[10].status === 'Completed' || stageResults[10].status === 'In Progress';
    let status: ProjectControlStageStatus = 'Not Started';
    if (billSummary.isFinanciallyClosed) {
      status = 'Completed';
    } else if (pbCount > 0 && billSummary.remainingContractBalance === 0) {
      status = 'Completed';
    } else if (pbCount > 0) {
      status = 'In Progress';
    } else if (miccSummary.verifiedQuantity > 0) {
      status = 'Attention Required'; // Verified material ready for billing
    } else if (s11Active) {
      status = 'Not Started';
    } else {
      status = 'Locked';
    }
    stageResults.push({
      stageId: '12',
      stageNumber: '12',
      name: 'Progressive Bill',
      adminGroup: 'ADMIN_C',
      group: 'C',
      status,
      primaryReference: projectPbs[0]?.billNumber,
      date: projectPbs[0]?.billDate || projectPbs[0]?.createdAt,
      summary:
        pbCount > 0
          ? `${billSummary.approvedBillsCount} approved (₹${(billSummary.cumulativeApprovedBilling / 100000).toFixed(1)}L)`
          : 'Running Account (RA) progressive billing',
      navigationHref: '/progressive-bill',
      recordCount: pbCount,
    });
  }

  // STAGE 13: Final Bill
  {
    const hasFb = !!projectFbs.find((f) => f.status !== 'Rejected');
    const s12Active = stageResults[11].status === 'Completed' || stageResults[11].status === 'In Progress';
    let status: ProjectControlStageStatus = 'Not Started';
    if (billSummary.isFinanciallyClosed) {
      status = 'Completed';
    } else if (projectFbs.some((f) => f.status === 'Rejected')) {
      status = 'Attention Required';
    } else if (hasFb) {
      status = 'In Progress';
    } else if (s12Active) {
      status = 'Not Started';
    } else {
      status = 'Locked';
    }
    stageResults.push({
      stageId: '13',
      stageNumber: '13',
      name: 'Final Bill',
      adminGroup: 'ADMIN_C',
      group: 'C',
      status,
      primaryReference: projectFbs[0]?.finalBillNumber,
      date: projectFbs[0]?.billDate || projectFbs[0]?.createdAt,
      summary: billSummary.isFinanciallyClosed
        ? 'Project financially closed & reconciled'
        : projectFbs[0]
        ? `Final Bill ${projectFbs[0].finalBillNumber} (${projectFbs[0].status})`
        : 'Final contract reconciliation and settlement',
      navigationHref: '/final-bill',
      recordCount: projectFbs.length,
    });
  }

  return stageResults;
}

// ==========================================
// 7. CURRENT STAGE ENGINE
// ==========================================

export function calculateCurrentStage(
  project: Project,
  records: ProjectWorkflowRecords
): { stageNumber: string; stageName: string; stageStatus: ProjectControlStageStatus } {
  const stageStatuses = calculateStageStatuses(project, records);

  // 1. If Stage 13 Final Bill is approved, project is Completed / Financially Closed
  const stage13 = stageStatuses.find((s) => s.stageId === '13');
  if (stage13 && stage13.status === 'Completed') {
    return {
      stageNumber: '13',
      stageName: 'Final Bill',
      stageStatus: 'Completed',
    };
  }

  // 2. If Stage 13 Final Bill is active / in progress / attention
  if (stage13 && (stage13.status === 'In Progress' || stage13.status === 'Attention Required')) {
    return {
      stageNumber: '13',
      stageName: 'Final Bill',
      stageStatus: stage13.status,
    };
  }

  // 3. Scan from Stage 12 down to Stage 01 for the highest active/pending stage
  for (let i = stageStatuses.length - 1; i >= 0; i--) {
    const s = stageStatuses[i];
    if (s.status === 'In Progress' || s.status === 'Attention Required') {
      return {
        stageNumber: s.stageNumber,
        stageName: s.name,
        stageStatus: s.status,
      };
    }
  }

  // 4. If none are In Progress or Attention, find the first 'Not Started' stage
  for (const s of stageStatuses) {
    if (s.status === 'Not Started') {
      return {
        stageNumber: s.stageNumber,
        stageName: s.name,
        stageStatus: s.status,
      };
    }
  }

  // Fallback
  return {
    stageNumber: '01',
    stageName: 'Tender',
    stageStatus: stageStatuses[0]?.status || 'Not Started',
  };
}

// ==========================================
// 8. PROJECT PROGRESS & HEALTH
// ==========================================

export function calculateProjectProgress(
  project: Project,
  stageStatuses: ProjectStageStatusInfo[]
): {
  overallProgress: number;
  completedStagesCount: number;
  adminAProgress: number;
  adminBProgress: number;
  adminCProgress: number;
} {
  const completedStages = stageStatuses.filter((s) => s.status === 'Completed');
  const completedStagesCount = completedStages.length;

  // Exact formula: (completedCount / 13) * 100
  const overallProgress = Math.round((completedStagesCount / 13) * 100);

  // Group breakdowns
  const adminACompleted = stageStatuses.slice(0, 4).filter((s) => s.status === 'Completed').length;
  const adminAProgress = Math.round((adminACompleted / 4) * 100);

  const adminBCompleted = stageStatuses.slice(4, 9).filter((s) => s.status === 'Completed').length;
  const adminBProgress = Math.round((adminBCompleted / 5) * 100);

  const adminCCompleted = stageStatuses.slice(9, 13).filter((s) => s.status === 'Completed').length;
  const adminCProgress = Math.round((adminCCompleted / 4) * 100);

  return {
    overallProgress,
    completedStagesCount,
    adminAProgress,
    adminBProgress,
    adminCProgress,
  };
}

export function getProjectHealth(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectHealthSummary {
  const stageStatuses = calculateStageStatuses(project, records);
  const progress = calculateProjectProgress(project, stageStatuses);
  const pendingActions = calculatePendingActions(project, records);
  const exceptions = calculateProjectExceptions(project, records);
  const billingSummary = calculateBillingSummary(project, records.progressiveBills, records.finalBills);

  const billingProgressPercent =
    billingSummary.contractValue > 0
      ? Math.min(100, Math.round((billingSummary.cumulativeApprovedBilling / billingSummary.contractValue) * 100))
      : 0;

  const attentionExceptions = exceptions.filter((e) => e.severity === 'Attention').length;

  let healthStatus: 'On Track' | 'Attention Needed' | 'Critical Attention' | 'Completed' = 'On Track';
  if (billingSummary.isFinanciallyClosed) {
    healthStatus = 'Completed';
  } else if (attentionExceptions > 1) {
    healthStatus = 'Critical Attention';
  } else if (attentionExceptions === 1 || exceptions.length > 2) {
    healthStatus = 'Attention Needed';
  } else {
    healthStatus = 'On Track';
  }

  return {
    healthStatus,
    completedStagesCount: progress.completedStagesCount,
    totalStagesCount: 13,
    workflowProgressPercent: progress.overallProgress,
    pendingActionsCount: pendingActions.length,
    exceptionsCount: exceptions.length,
    adminAProgress: progress.adminAProgress,
    adminBProgress: progress.adminBProgress,
    adminCProgress: progress.adminCProgress,
    billingProgressPercent,
  };
}

// ==========================================
// 9. PENDING ACTIONS ENGINE
// ==========================================

export function calculatePendingActions(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectPendingAction[] {
  const {
    tender,
    loiLoa,
    acceptance,
    cpg,
    agreement,
    boqItems,
    gtps,
    pos,
    inspectionCalls,
    inspectionOrders,
    jirs,
    dis,
    miccs,
    progressiveBills,
    finalBills,
  } = records;

  // Strict project filtering
  const projectBoqs = boqItems.filter((b) => b.projectId === project.id);
  const projectGtps = gtps.filter((g) => g.projectId === project.id);
  const projectPos = pos.filter((p) => p.projectId === project.id);
  const projectCalls = inspectionCalls.filter((c) => c.projectId === project.id);
  const projectOrders = inspectionOrders.filter((o) => o.projectId === project.id);
  const projectJirs = jirs.filter((j) => j.projectId === project.id);
  const projectDis = dis.filter((d) => d.projectId === project.id);
  const projectMiccs = miccs.filter((m) => m.projectId === project.id);
  const projectPbs = progressiveBills.filter((b) => b.projectId === project.id);
  const projectFbs = finalBills.filter((f) => f.projectId === project.id);

  const dispSummary = calculateDispatchSummary(project, projectJirs, projectDis);
  const miccSummary = calculateMiccSummary(project, projectDis, projectMiccs);
  const billSummary = calculateBillingSummary(project, projectPbs, projectFbs);

  const actions: ProjectPendingAction[] = [];

  // Action 1: Tender awarded -> LOI / LOA pending
  if (tender && tender.status === 'Awarded' && !loiLoa) {
    actions.push({
      id: `act-${project.id}-02`,
      stageNumber: '02',
      stageName: 'LOI / LOA',
      title: 'Receive LOI / LOA',
      description: `Tender ${tender.tenderNumber} awarded; await or upload Letter of Intent / Award.`,
      category: 'Tender / Contract',
      priority: 'High',
      actionUrl: '/loi-loa',
      actionText: 'Register LOI/LOA',
      sourceReference: tender.tenderNumber,
    });
  }

  // Action 2: LOI / LOA received or accepted -> Acceptance pending
  if (loiLoa && (loiLoa.status === 'Received' || loiLoa.status === 'Accepted') && !acceptance) {
    actions.push({
      id: `act-${project.id}-03`,
      stageNumber: '03',
      stageName: 'Acceptance',
      title: 'Issue Contract Acceptance',
      description: `LOI ${loiLoa.loiNumber} received/accepted; formal acceptance letter required.`,
      category: 'Tender / Contract',
      priority: 'High',
      actionUrl: '/acceptance',
      actionText: 'Submit Acceptance',
      sourceReference: loiLoa.loiNumber,
    });
  }

  // Action 3: Acceptance acknowledged -> CPG + Agreement pending
  if (acceptance && acceptance.status === 'Accepted' && (!cpg || !agreement)) {
    actions.push({
      id: `act-${project.id}-04`,
      stageNumber: '04',
      stageName: 'CPG + Agreement',
      title: 'Submit CPG & Sign Agreement',
      description: 'Acceptance completed; Contract Performance Guarantee and signed contract required.',
      category: 'Tender / Contract',
      priority: 'High',
      actionUrl: '/cpg-agreement',
      actionText: 'Manage CPG & Agreement',
      sourceReference: acceptance.acceptanceRef,
    });
  }

  // Action 4: GTP review pending
  const pendingGtps = projectGtps.filter((g) => g.status === 'Submitted' || g.status === 'Under Review');
  if (pendingGtps.length > 0) {
    actions.push({
      id: `act-${project.id}-05`,
      stageNumber: '05',
      stageName: 'GTP Approval',
      title: 'Approve Pending GTP Drawings',
      description: `${pendingGtps.length} technical GTP submissions are awaiting client approval.`,
      category: 'Procurement',
      priority: 'Medium',
      actionUrl: '/gtp',
      actionText: 'Review GTPs',
      sourceReference: pendingGtps[0].gtpNumber,
    });
  }

  // Action 5: Remaining BOQ quantities to be ordered
  const remainingBoqQty = projectBoqs.reduce(
    (sum, item) => sum + calculateRemainingBoqQuantity(item, projectPos),
    0
  );
  if (projectBoqs.length > 0 && remainingBoqQty > 0) {
    actions.push({
      id: `act-${project.id}-06`,
      stageNumber: '06',
      stageName: 'Purchase Order',
      title: 'Place Purchase Orders for Remaining BOQ',
      description: `${remainingBoqQty} units across BOQ items remain to be ordered through vendors.`,
      category: 'Procurement',
      priority: 'Medium',
      actionUrl: '/po',
      actionText: 'Create PO',
    });
  }

  // Action 6: Active POs without inspection calls
  const activePos = projectPos.filter((p) => p.status !== 'Cancelled');
  const posWithoutCall = activePos.filter((p) => !projectCalls.some((c) => c.poId === p.id && c.status !== 'Cancelled'));
  if (posWithoutCall.length > 0) {
    actions.push({
      id: `act-${project.id}-07`,
      stageNumber: '07',
      stageName: 'Inspection Call',
      title: 'Raise Inspection Call for Active PO',
      description: `${posWithoutCall.length} purchase orders are ready for material inspection calls.`,
      category: 'Inspection',
      priority: 'Medium',
      actionUrl: '/inspection-call',
      actionText: 'Raise Call',
      sourceReference: posWithoutCall[0].poNumber,
    });
  }

  // Action 7: Inspection Calls without Orders
  const callsWithoutOrder = projectCalls.filter(
    (c) => c.status !== 'Cancelled' && !projectOrders.some((o) => o.inspectionCallId === c.id)
  );
  if (callsWithoutOrder.length > 0) {
    actions.push({
      id: `act-${project.id}-08`,
      stageNumber: '08',
      stageName: 'Inspection Order',
      title: 'Depute Inspection Order',
      description: `${callsWithoutOrder.length} inspection calls require deputation of an inspecting officer.`,
      category: 'Inspection',
      priority: 'High',
      actionUrl: '/inspection-order',
      actionText: 'Issue Order',
      sourceReference: callsWithoutOrder[0].inspectionCallNumber,
    });
  }

  // Action 8: Inspection Orders without JIR
  const ordersWithoutJir = projectOrders.filter(
    (o) => o.status !== 'Completed' && !projectJirs.some((j) => j.inspectionOrderId === o.id)
  );
  if (ordersWithoutJir.length > 0) {
    actions.push({
      id: `act-${project.id}-09`,
      stageNumber: '09',
      stageName: 'JIR / Inspection Report',
      title: 'Upload Joint Inspection Report (JIR)',
      description: `${ordersWithoutJir.length} inspection orders require final inspection report entry.`,
      category: 'Inspection',
      priority: 'High',
      actionUrl: '/jir',
      actionText: 'Create JIR',
      sourceReference: ordersWithoutJir[0].inspectionOrderNumber,
    });
  }

  // Action 9: JIR accepted quantity > active DI quantity -> Dispatch pending
  if (dispSummary.acceptedQuantity > dispSummary.dispatchedQuantity) {
    actions.push({
      id: `act-${project.id}-10`,
      stageNumber: '10',
      stageName: 'DI / Dispatch Clearance',
      title: 'Issue Dispatch Instruction (DI)',
      description: `${dispSummary.remainingDispatchQuantity} units accepted under JIR remain available for dispatch clearance.`,
      category: 'Dispatch',
      priority: 'High',
      actionUrl: '/di',
      actionText: 'Create DI',
    });
  }

  // Action 10: DI quantity > verified MICC quantity -> MICC verification pending
  if (miccSummary.totalDispatchedQuantity > miccSummary.verifiedQuantity) {
    actions.push({
      id: `act-${project.id}-11`,
      stageNumber: '11',
      stageName: 'MICC',
      title: 'Complete Field Verification (MICC)',
      description: `${miccSummary.pendingVerificationQuantity} units dispatched from factory require site inward verification.`,
      category: 'Material Inward',
      priority: 'High',
      actionUrl: '/micc',
      actionText: 'Record MICC',
    });
  }

  // Action 11: Verified MICC quantity > billed quantity -> Progressive Bill submission pending
  const verifiedMiccs = projectMiccs.filter((m) => m.status === 'Verified');
  const totalVerifiedQty = verifiedMiccs.reduce((sum, m) => sum + m.quantity, 0);
  const totalBilledQty = projectPbs
    .filter((b) => b.status !== 'Rejected')
    .reduce((sum, b) => sum + (b.lineItems || []).reduce((lSum, l) => lSum + l.claimedQuantity, 0), 0);

  if (totalVerifiedQty > totalBilledQty && billSummary.remainingContractBalance > 0) {
    actions.push({
      id: `act-${project.id}-12`,
      stageNumber: '12',
      stageName: 'Progressive Bill',
      title: 'Submit Progressive Bill for Verified Materials',
      description: `${totalVerifiedQty - totalBilledQty} verified units available for progressive billing against contract balance.`,
      category: 'Billing',
      priority: 'High',
      actionUrl: '/progressive-bill',
      actionText: 'Raise Bill',
    });
  }

  // Action 12: Progressive Bill submitted / under review
  const pendingReviewBills = projectPbs.filter((b) => b.status === 'Under Review' || b.status === 'Submitted');
  if (pendingReviewBills.length > 0) {
    const claimedAmt = pendingReviewBills[0].currentClaimedAmount || (pendingReviewBills[0] as unknown as { claimedAmount?: number }).claimedAmount || 0;
    actions.push({
      id: `act-${project.id}-12-review`,
      stageNumber: '12',
      stageName: 'Progressive Bill',
      title: 'Approve Progressive Bill',
      description: `Bill ${pendingReviewBills[0].billNumber} (claimed ₹${(claimedAmt / 100000).toFixed(1)}L) awaits client certification.`,
      category: 'Billing',
      priority: 'High',
      actionUrl: '/progressive-bill',
      actionText: 'Review Bill',
      sourceReference: pendingReviewBills[0].billNumber,
    });
  }

  // Action 13: Contract balance remains & Final Bill not approved
  if (!billSummary.isFinanciallyClosed && miccSummary.verifiedQuantity > 0 && billSummary.remainingContractBalance > 0) {
    const activeFb = projectFbs.find((f) => f.status !== 'Rejected');
    if (!activeFb) {
      actions.push({
        id: `act-${project.id}-13`,
        stageNumber: '13',
        stageName: 'Final Bill',
        title: 'Prepare Final Contract Bill',
        description: `Remaining balance of ₹${(billSummary.remainingContractBalance / 100000).toFixed(1)}L eligible for final reconciliation.`,
        category: 'Closure',
        priority: 'Medium',
        actionUrl: '/final-bill',
        actionText: 'Reconcile Final Bill',
      });
    }
  }

  return actions;
}

// ==========================================
// 10. EXCEPTION ENGINE
// ==========================================

export function calculateProjectExceptions(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectException[] {
  const {
    jirs,
    dis,
    miccs,
    progressiveBills,
    finalBills,
  } = records;

  // Strict project filtering
  const projectJirs = jirs.filter((j) => j.projectId === project.id);
  const projectDis = dis.filter((d) => d.projectId === project.id);
  const projectMiccs = miccs.filter((m) => m.projectId === project.id);
  const projectPbs = progressiveBills.filter((b) => b.projectId === project.id);
  const projectFbs = finalBills.filter((f) => f.projectId === project.id);

  const dispSummary = calculateDispatchSummary(project, projectJirs, projectDis);
  const miccSummary = calculateMiccSummary(project, projectDis, projectMiccs);

  const exceptions: ProjectException[] = [];

  // Exception 0A: Rejected GTP drawing
  const rejectedGtps = (records.gtps || []).filter((g) => g.projectId === project.id && g.status === 'Rejected');
  if (rejectedGtps.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-gtp-rej`,
      stageNumber: '05',
      stageName: 'GTP Approval',
      title: 'GTP Drawing Rejected',
      description: `GTP drawing ${rejectedGtps[0].gtpNumber} (${rejectedGtps[0].materialItem || 'material'}) was rejected by the client/nodal agency.`,
      severity: 'Attention',
      actionUrl: '/gtp',
      actionText: 'Revise GTP',
      reference: rejectedGtps[0].gtpNumber,
    });
  }

  // Exception 0B: JIR with rejected quantities
  const jirsWithRejections = projectJirs.filter((j) => (j.rejectedQuantity || 0) > 0);
  if (jirsWithRejections.length > 0) {
    const totalRej = jirsWithRejections.reduce((sum, j) => sum + (j.rejectedQuantity || 0), 0);
    exceptions.push({
      id: `exc-${project.id}-jir-rej`,
      stageNumber: '09',
      stageName: 'JIR / Inspection Report',
      title: 'Inspection Rejection Notice',
      description: `${totalRej} material units were rejected in inspection report ${jirsWithRejections[0].jirNumber}.`,
      severity: 'Attention',
      actionUrl: '/jir',
      actionText: 'View JIR',
      reference: jirsWithRejections[0].jirNumber,
    });
  }

  // Exception 1: JIR accepted quantity awaiting dispatch
  if (dispSummary.acceptedQuantity > 0 && dispSummary.remainingDispatchQuantity > 0) {
    exceptions.push({
      id: `exc-${project.id}-jir-disp`,
      stageNumber: '10',
      stageName: 'DI / Dispatch Clearance',
      title: 'Accepted Material Awaiting Dispatch',
      description: `${dispSummary.remainingDispatchQuantity} units accepted in inspection reports await dispatch clearance.`,
      severity: 'Pending',
      actionUrl: '/di',
      actionText: 'Generate DI',
    });
  }

  // Exception 2: Dispatched awaiting MICC
  if (miccSummary.totalDispatchedQuantity > 0 && miccSummary.pendingVerificationQuantity > 0) {
    exceptions.push({
      id: `exc-${project.id}-disp-micc`,
      stageNumber: '11',
      stageName: 'MICC',
      title: 'Dispatched Material Pending Site Verification',
      description: `${miccSummary.pendingVerificationQuantity} units dispatched from factory await field inward inspection.`,
      severity: 'Pending',
      actionUrl: '/micc',
      actionText: 'Record MICC',
    });
  }

  // Exception 3: Rejected MICC
  const rejectedMiccs = projectMiccs.filter((m) => m.status === 'Rejected');
  if (rejectedMiccs.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-micc-rej`,
      stageNumber: '11',
      stageName: 'MICC',
      title: 'Rejected Material Inward Record',
      description: `MICC certificate ${rejectedMiccs[0].miccNumber} was rejected during site inspection.`,
      severity: 'Attention',
      actionUrl: '/micc',
      actionText: 'View Details',
      reference: rejectedMiccs[0].miccNumber,
    });
  }

  // Exception 4: Rejected Progressive Bill
  const rejectedPbs = projectPbs.filter((b) => b.status === 'Rejected');
  if (rejectedPbs.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-pb-rej`,
      stageNumber: '12',
      stageName: 'Progressive Bill',
      title: 'Rejected Progressive Bill',
      description: `Bill ${rejectedPbs[0].billNumber} was rejected by client and requires rectification.`,
      severity: 'Attention',
      actionUrl: '/progressive-bill',
      actionText: 'Review Rejection',
      reference: rejectedPbs[0].billNumber,
    });
  }

  // Exception 5: Progressive Bill Under Review
  const underReviewPbs = projectPbs.filter((b) => b.status === 'Under Review');
  if (underReviewPbs.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-pb-review`,
      stageNumber: '12',
      stageName: 'Progressive Bill',
      title: 'Progressive Bill Under Review',
      description: `Bill ${underReviewPbs[0].billNumber} is currently undergoing departmental review.`,
      severity: 'Pending',
      actionUrl: '/progressive-bill',
      actionText: 'Track Status',
      reference: underReviewPbs[0].billNumber,
    });
  }

  // Exception 6: Rejected Final Bill
  const rejectedFbs = projectFbs.filter((f) => f.status === 'Rejected');
  if (rejectedFbs.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-fb-rej`,
      stageNumber: '13',
      stageName: 'Final Bill',
      title: 'Rejected Final Bill Reconciliation',
      description: `Final Bill ${rejectedFbs[0].finalBillNumber} was rejected; contract reconciliation adjustments must be resolved.`,
      severity: 'Attention',
      actionUrl: '/final-bill',
      actionText: 'Reconcile Bill',
      reference: rejectedFbs[0].finalBillNumber,
    });
  }

  // Exception 7: Cancelled DIs
  const cancelledDis = projectDis.filter((d) => d.status === 'Cancelled');
  if (cancelledDis.length > 0) {
    exceptions.push({
      id: `exc-${project.id}-di-cancel`,
      stageNumber: '10',
      stageName: 'DI / Dispatch Clearance',
      title: 'Cancelled Dispatch Instruction Record',
      description: `DI ${cancelledDis[0].diNumber} was cancelled; dispatchable quantity has been restored to pool.`,
      severity: 'Info',
      actionUrl: '/di',
      actionText: 'View DIs',
      reference: cancelledDis[0].diNumber,
    });
  }

  return exceptions;
}

// ==========================================
// 11. ACTIVITY TIMELINE ENGINE
// ==========================================

export function buildProjectActivityTimeline(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectActivityEvent[] {
  const {
    tender,
    loiLoa,
    acceptance,
    cpg,
    agreement,
    gtps,
    pos,
    inspectionCalls,
    inspectionOrders,
    jirs,
    dis,
    miccs,
    progressiveBills,
    finalBills,
  } = records;

  // Strict project filtering
  const projectGtps = gtps.filter((g) => g.projectId === project.id);
  const projectPos = pos.filter((p) => p.projectId === project.id);
  const projectCalls = inspectionCalls.filter((c) => c.projectId === project.id);
  const projectOrders = inspectionOrders.filter((o) => o.projectId === project.id);
  const projectJirs = jirs.filter((j) => j.projectId === project.id);
  const projectDis = dis.filter((d) => d.projectId === project.id);
  const projectMiccs = miccs.filter((m) => m.projectId === project.id);
  const projectPbs = progressiveBills.filter((b) => b.projectId === project.id);
  const projectFbs = finalBills.filter((f) => f.projectId === project.id);

  const events: ProjectActivityEvent[] = [];

  // Stage 01 Tender
  if (tender) {
    events.push({
      id: `ev-tender-${tender.id}`,
      stageNumber: '01',
      stageName: 'Tender',
      date: tender.tenderDate || tender.createdAt,
      timestamp: tender.tenderDate || tender.createdAt,
      reference: tender.tenderNumber,
      title: `Tender ${tender.tenderNumber}`,
      description: `Tender status updated to ${tender.status}. Value: ${tender.tenderValue || 'N/A'}`,
      status: tender.status,
      navigationHref: '/tenders',
      type: 'Tender',
    });
  }

  // Stage 02 LOI/LOA
  if (loiLoa) {
    events.push({
      id: `ev-loi-${loiLoa.id}`,
      stageNumber: '02',
      stageName: 'LOI / LOA',
      date: loiLoa.date || loiLoa.createdAt,
      timestamp: loiLoa.date || loiLoa.createdAt,
      reference: loiLoa.loiNumber,
      title: `LOI/LOA ${loiLoa.loiNumber}`,
      description: `Letter of Intent/Award recorded with status ${loiLoa.status}. Contract Value: ${loiLoa.contractValue}`,
      status: loiLoa.status,
      navigationHref: '/loi-loa',
      type: 'LOI/LOA',
    });
  }

  // Stage 03 Acceptance
  if (acceptance) {
    events.push({
      id: `ev-acc-${acceptance.id}`,
      stageNumber: '03',
      stageName: 'Acceptance',
      date: acceptance.acceptanceDate || acceptance.createdAt,
      timestamp: acceptance.acceptanceDate || acceptance.createdAt,
      reference: acceptance.acceptanceRef,
      title: `Acceptance ${acceptance.acceptanceRef}`,
      description: `Contract acceptance letter registered with status ${acceptance.status}.`,
      status: acceptance.status,
      navigationHref: '/acceptance',
      type: 'Acceptance',
    });
  }

  // Stage 04 CPG
  if (cpg) {
    events.push({
      id: `ev-cpg-${cpg.id}`,
      stageNumber: '04',
      stageName: 'CPG',
      date: cpg.cpgDate || cpg.createdAt,
      timestamp: cpg.cpgDate || cpg.createdAt,
      reference: cpg.cpgRef,
      title: `Bank Guarantee ${cpg.cpgRef}`,
      description: `Contract Performance Guarantee (CPG) issued for ${cpg.cpgAmount}. Status: ${cpg.status}.`,
      status: cpg.status,
      navigationHref: '/cpg-agreement',
      type: 'CPG',
    });
  }

  // Stage 04 Agreement
  if (agreement) {
    events.push({
      id: `ev-agr-${agreement.id}`,
      stageNumber: '04',
      stageName: 'Agreement',
      date: agreement.agreementDate || agreement.createdAt,
      timestamp: agreement.agreementDate || agreement.createdAt,
      reference: agreement.agreementRef,
      title: `Agreement ${agreement.agreementRef}`,
      description: `Formal contract agreement executed. Status: ${agreement.status}.`,
      status: agreement.status,
      navigationHref: '/cpg-agreement',
      type: 'Agreement',
    });
  }

  // Stage 05 GTP
  for (const g of projectGtps) {
    events.push({
      id: `ev-gtp-${g.id}`,
      stageNumber: '05',
      stageName: 'GTP Approval',
      date: g.submissionDate || g.createdAt,
      timestamp: g.submissionDate || g.createdAt,
      reference: g.gtpNumber,
      title: `GTP ${g.gtpNumber}`,
      description: `GTP for ${g.materialItem || 'item'} (Rev ${g.revision}). Status: ${g.status}.`,
      status: g.status,
      navigationHref: '/gtp',
      type: 'GTP',
    });
  }

  // Stage 06 PO
  for (const p of projectPos) {
    events.push({
      id: `ev-po-${p.id}`,
      stageNumber: '06',
      stageName: 'Purchase Order',
      date: p.poDate || p.createdAt,
      timestamp: p.poDate || p.createdAt,
      reference: p.poNumber,
      title: `PO ${p.poNumber}`,
      description: `Purchase order placed with vendor for ₹${(p.totalAmount / 100000).toFixed(1)}L. Status: ${p.status}.`,
      status: p.status,
      navigationHref: '/po',
      type: 'Purchase Order',
    });
  }

  // Stage 07 Inspection Call
  for (const c of projectCalls) {
    events.push({
      id: `ev-call-${c.id}`,
      stageNumber: '07',
      stageName: 'Inspection Call',
      date: c.requestDate || c.createdAt,
      timestamp: c.requestDate || c.createdAt,
      reference: c.inspectionCallNumber,
      title: `Inspection Call ${c.inspectionCallNumber}`,
      description: `Call raised for ${c.quantity} units (${c.material}). Status: ${c.status}.`,
      status: c.status,
      navigationHref: '/inspection-call',
      type: 'Inspection Call',
    });
  }

  // Stage 08 Inspection Order
  for (const o of projectOrders) {
    events.push({
      id: `ev-order-${o.id}`,
      stageNumber: '08',
      stageName: 'Inspection Order',
      date: o.orderDate || o.createdAt,
      timestamp: o.orderDate || o.createdAt,
      reference: o.inspectionOrderNumber,
      title: `Inspection Order ${o.inspectionOrderNumber}`,
      description: `Inspecting officer ${o.assignedPerson || ''} deputed for inspection call. Status: ${o.status}.`,
      status: o.status,
      navigationHref: '/inspection-order',
      type: 'Inspection Order',
    });
  }

  // Stage 09 JIR
  for (const j of projectJirs) {
    events.push({
      id: `ev-jir-${j.id}`,
      stageNumber: '09',
      stageName: 'JIR / Inspection Report',
      date: j.inspectionDate || j.createdAt,
      timestamp: j.inspectionDate || j.createdAt,
      reference: j.jirNumber,
      title: `JIR ${j.jirNumber}`,
      description: `${j.acceptedQuantity} units accepted (${j.rejectedQuantity} rejected) out of ${j.offeredQuantity} offered.`,
      status: j.status,
      navigationHref: '/jir',
      type: 'JIR Report',
    });
  }

  // Stage 10 DI
  for (const d of projectDis) {
    events.push({
      id: `ev-di-${d.id}`,
      stageNumber: '10',
      stageName: 'DI / Dispatch Clearance',
      date: d.diDate || d.createdAt,
      timestamp: d.diDate || d.createdAt,
      reference: d.diNumber,
      title: `Dispatch Instruction ${d.diNumber}`,
      description: `${d.quantity} units cleared for dispatch to ${d.destination || 'site'}. Status: ${d.status}.`,
      status: d.status,
      navigationHref: '/di',
      type: 'Dispatch Instruction',
    });
  }

  // Stage 11 MICC
  for (const m of projectMiccs) {
    events.push({
      id: `ev-micc-${m.id}`,
      stageNumber: '11',
      stageName: 'MICC',
      date: m.miccDate || m.createdAt,
      timestamp: m.miccDate || m.createdAt,
      reference: m.miccNumber,
      title: `MICC ${m.miccNumber}`,
      description: `${m.quantity} units received and inspected at site. Status: ${m.status}.`,
      status: m.status,
      navigationHref: '/micc',
      type: 'Material Inward',
    });
  }

  // Stage 12 Progressive Bill
  for (const b of projectPbs) {
    events.push({
      id: `ev-pb-${b.id}`,
      stageNumber: '12',
      stageName: 'Progressive Bill',
      date: b.billDate || b.createdAt,
      timestamp: b.billDate || b.createdAt,
      reference: b.billNumber,
      title: `Progressive Bill ${b.billNumber}`,
      description: `Claimed: ₹${(b.currentClaimedAmount / 100000).toFixed(1)}L | Approved: ₹${(b.currentApprovedAmount / 100000).toFixed(1)}L. Status: ${b.status}.`,
      status: b.status,
      navigationHref: '/progressive-bill',
      type: 'Progressive Bill',
    });
  }

  // Stage 13 Final Bill
  for (const f of projectFbs) {
    events.push({
      id: `ev-fb-${f.id}`,
      stageNumber: '13',
      stageName: 'Final Bill',
      date: f.billDate || f.createdAt,
      timestamp: f.billDate || f.createdAt,
      reference: f.finalBillNumber,
      title: `Final Bill ${f.finalBillNumber}`,
      description: `Contract reconciliation bill for ₹${(f.finalBillAmount / 100000).toFixed(1)}L. Status: ${f.status}.`,
      status: f.status,
      navigationHref: '/final-bill',
      type: 'Final Bill',
    });
  }

  // Sort chronologically descending (latest first)
  return events.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.date).getTime() || 0;
    const timeB = new Date(b.timestamp || b.date).getTime() || 0;
    return timeB - timeA;
  });
}

// ==========================================
// 12. CROSS-MODULE SEARCH ENGINE
// ==========================================

export function searchProjectRecords(
  project: Project,
  records: ProjectWorkflowRecords,
  rawQuery: string
): ProjectSearchResult[] {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return [];

  // STRICT ISOLATION: records belong exclusively to project.id
  const results: ProjectSearchResult[] = [];

  const matches = (text?: string) => (text ? text.toLowerCase().includes(query) : false);

  // 01 Tender
  if (records.tender && records.tender.projectId === project.id) {
    const t = records.tender;
    if (matches(t.tenderNumber) || matches(t.tenderRef) || matches(t.client) || matches(t.status)) {
      results.push({
        id: `sr-tender-${t.id}`,
        projectId: project.id,
        reference: t.tenderNumber,
        stageNumber: '01',
        stageName: 'Tender',
        type: 'Tender',
        status: t.status,
        date: t.tenderDate || t.createdAt,
        description: `Tender ref ${t.tenderRef} (${t.tenderValue})`,
        navigationHref: '/tenders',
      });
    }
  }

  // 02 LOI/LOA
  if (records.loiLoa && records.loiLoa.projectId === project.id) {
    const l = records.loiLoa;
    if (matches(l.loiNumber) || matches(l.client) || matches(l.status) || matches(l.referenceDetails)) {
      results.push({
        id: `sr-loi-${l.id}`,
        projectId: project.id,
        reference: l.loiNumber,
        stageNumber: '02',
        stageName: 'LOI / LOA',
        type: 'LOI / LOA',
        status: l.status,
        date: l.date || l.createdAt,
        description: l.referenceDetails || `LOI issued for ${l.contractValue}`,
        navigationHref: '/loi-loa',
      });
    }
  }

  // 03 Acceptance
  if (records.acceptance && records.acceptance.projectId === project.id) {
    const a = records.acceptance;
    if (matches(a.acceptanceRef) || matches(a.client) || matches(a.status)) {
      results.push({
        id: `sr-acc-${a.id}`,
        projectId: project.id,
        reference: a.acceptanceRef,
        stageNumber: '03',
        stageName: 'Acceptance',
        type: 'Acceptance',
        status: a.status,
        date: a.acceptanceDate || a.createdAt,
        description: `Acceptance letter for ${a.client}`,
        navigationHref: '/acceptance',
      });
    }
  }

  // 04 CPG & Agreement
  if (records.cpg && records.cpg.projectId === project.id) {
    const c = records.cpg;
    if (matches(c.cpgRef) || matches(c.bankName) || matches(c.status)) {
      results.push({
        id: `sr-cpg-${c.id}`,
        projectId: project.id,
        reference: c.cpgRef,
        stageNumber: '04',
        stageName: 'CPG',
        type: 'CPG Bank Guarantee',
        status: c.status,
        date: c.cpgDate || c.createdAt,
        description: `Bank Guarantee issued by ${c.bankName || 'bank'} (${c.cpgAmount})`,
        navigationHref: '/cpg-agreement',
      });
    }
  }
  if (records.agreement && records.agreement.projectId === project.id) {
    const ag = records.agreement;
    if (matches(ag.agreementRef) || matches(ag.status) || matches(ag.remarks)) {
      results.push({
        id: `sr-agr-${ag.id}`,
        projectId: project.id,
        reference: ag.agreementRef,
        stageNumber: '04',
        stageName: 'Agreement',
        type: 'Contract Agreement',
        status: ag.status,
        date: ag.agreementDate || ag.createdAt,
        description: `Contract Agreement executed for ${project.name}`,
        navigationHref: '/cpg-agreement',
      });
    }
  }

  // 05 BOQ Items
  for (const b of records.boqItems.filter((item) => item.projectId === project.id)) {
    if (matches(b.itemNumber) || matches(b.description) || matches(b.category) || matches(b.unit) || matches(b.vendorName)) {
      results.push({
        id: `sr-boq-${b.id}`,
        projectId: project.id,
        reference: b.itemNumber,
        stageNumber: '05',
        stageName: 'BOQ',
        type: 'BOQ Item',
        status: 'Active',
        date: b.createdAt,
        description: `${b.description} (${b.quantity} ${b.unit})`,
        navigationHref: '/boq',
      });
    }
  }

  // 05 GTP
  for (const g of records.gtps.filter((gtp) => gtp.projectId === project.id)) {
    if (matches(g.gtpNumber) || matches(g.materialItem) || matches(g.vendorName) || matches(g.status)) {
      results.push({
        id: `sr-gtp-${g.id}`,
        projectId: project.id,
        reference: g.gtpNumber,
        stageNumber: '05',
        stageName: 'GTP Approval',
        type: 'GTP Submission',
        status: g.status,
        date: g.submissionDate || g.createdAt,
        description: `${g.materialItem} (Vendor: ${g.vendorName}) - Rev ${g.revision}`,
        navigationHref: '/gtp',
      });
    }
  }

  // 06 PO
  for (const p of records.pos.filter((po) => po.projectId === project.id)) {
    if (matches(p.poNumber) || matches(p.vendorName) || matches(p.status) || matches(p.remarks)) {
      results.push({
        id: `sr-po-${p.id}`,
        projectId: project.id,
        reference: p.poNumber,
        stageNumber: '06',
        stageName: 'Purchase Order',
        type: 'Purchase Order',
        status: p.status,
        date: p.poDate || p.createdAt,
        description: `PO placed with ${p.vendorName} for ₹${(p.totalAmount / 100000).toFixed(1)}L`,
        navigationHref: '/po',
      });
    }
  }

  // 07 Inspection Call
  for (const c of records.inspectionCalls.filter((call) => call.projectId === project.id)) {
    if (matches(c.inspectionCallNumber) || matches(c.poNumber) || matches(c.material) || matches(c.vendorName) || matches(c.status)) {
      results.push({
        id: `sr-call-${c.id}`,
        projectId: project.id,
        reference: c.inspectionCallNumber,
        stageNumber: '07',
        stageName: 'Inspection Call',
        type: 'Inspection Call',
        status: c.status,
        date: c.requestDate || c.createdAt,
        description: `${c.quantity} units of ${c.material} for PO ${c.poNumber}`,
        navigationHref: '/inspection-call',
      });
    }
  }

  // 08 Inspection Order
  for (const o of records.inspectionOrders.filter((ord) => ord.projectId === project.id)) {
    if (matches(o.inspectionOrderNumber) || matches(o.assignedPerson) || matches(o.inspectionCallNumber) || matches(o.status)) {
      results.push({
        id: `sr-order-${o.id}`,
        projectId: project.id,
        reference: o.inspectionOrderNumber,
        stageNumber: '08',
        stageName: 'Inspection Order',
        type: 'Inspection Order',
        status: o.status,
        date: o.orderDate || o.createdAt,
        description: `Deputation of ${o.assignedPerson || 'officer'} for Call ${o.inspectionCallNumber}`,
        navigationHref: '/inspection-order',
      });
    }
  }

  // 09 JIR
  for (const j of records.jirs.filter((jir) => jir.projectId === project.id)) {
    if (matches(j.jirNumber) || matches(j.inspectionOrderNumber) || matches(j.status) || matches(j.material)) {
      results.push({
        id: `sr-jir-${j.id}`,
        projectId: project.id,
        reference: j.jirNumber,
        stageNumber: '09',
        stageName: 'JIR / Inspection Report',
        type: 'Inspection Report',
        status: j.status,
        date: j.inspectionDate || j.createdAt,
        description: `${j.acceptedQuantity} units accepted out of ${j.offeredQuantity} offered`,
        navigationHref: '/jir',
      });
    }
  }

  // 10 DI
  for (const d of records.dis.filter((di) => di.projectId === project.id)) {
    if (matches(d.diNumber) || matches(d.jirNumber) || matches(d.destination) || matches(d.status) || matches(d.materialDescription)) {
      results.push({
        id: `sr-di-${d.id}`,
        projectId: project.id,
        reference: d.diNumber,
        stageNumber: '10',
        stageName: 'DI / Dispatch Clearance',
        type: 'Dispatch Instruction',
        status: d.status,
        date: d.diDate || d.createdAt,
        description: `${d.quantity} units dispatched to ${d.destination || 'site'}`,
        navigationHref: '/di',
      });
    }
  }

  // 11 MICC
  for (const m of records.miccs.filter((micc) => micc.projectId === project.id)) {
    if (matches(m.miccNumber) || matches(m.diNumber) || matches(m.verifiedBy) || matches(m.status) || matches(m.materialDescription)) {
      results.push({
        id: `sr-micc-${m.id}`,
        projectId: project.id,
        reference: m.miccNumber,
        stageNumber: '11',
        stageName: 'MICC',
        type: 'Material Inward Certificate',
        status: m.status,
        date: m.miccDate || m.createdAt,
        description: `${m.quantity} units inward verified by ${m.verifiedBy || 'site office'}`,
        navigationHref: '/micc',
      });
    }
  }

  // 12 Progressive Bill
  for (const b of records.progressiveBills.filter((bill) => bill.projectId === project.id)) {
    if (matches(b.billNumber) || matches(b.status) || matches(b.remarks)) {
      results.push({
        id: `sr-pb-${b.id}`,
        projectId: project.id,
        reference: b.billNumber,
        stageNumber: '12',
        stageName: 'Progressive Bill',
        type: 'Progressive Bill',
        status: b.status,
        date: b.billDate || b.createdAt,
        description: `Claimed ₹${(b.currentClaimedAmount / 100000).toFixed(1)}L | Approved ₹${(b.currentApprovedAmount / 100000).toFixed(1)}L`,
        navigationHref: '/progressive-bill',
      });
    }
  }

  // 13 Final Bill
  for (const f of records.finalBills.filter((fb) => fb.projectId === project.id)) {
    if (matches(f.finalBillNumber) || matches(f.status) || matches(f.approvedBy)) {
      results.push({
        id: `sr-fb-${f.id}`,
        projectId: project.id,
        reference: f.finalBillNumber,
        stageNumber: '13',
        stageName: 'Final Bill',
        type: 'Final Bill',
        status: f.status,
        date: f.billDate || f.createdAt,
        description: `Final bill for ₹${(f.finalBillAmount / 100000).toFixed(1)}L (${f.status})`,
        navigationHref: '/final-bill',
      });
    }
  }

  return results;
}

// ==========================================
// 13. PROJECT CONTROL SUMMARY ASSEMBLY
// ==========================================

export function getProjectControlSummary(
  project: Project,
  records: ProjectWorkflowRecords
): ProjectControlSummary {
  const contractValue = parseContractValue(project.contractValue);

  const stageStatuses = calculateStageStatuses(project, records);
  const currentStage = calculateCurrentStage(project, records);
  const progress = calculateProjectProgress(project, stageStatuses);

  const procurementSummary = calculateProcurementSummary(project, records.boqItems, records.gtps, records.pos);
  const inspectionSummary = calculateInspectionSummary(project, records.inspectionCalls, records.inspectionOrders, records.jirs);
  const dispatchSummary = calculateDispatchSummary(project, records.jirs, records.dis);
  const miccSummary = calculateMiccSummary(project, records.dis, records.miccs);
  const billingSummary = calculateBillingSummary(project, records.progressiveBills, records.finalBills);

  const pendingActions = calculatePendingActions(project, records);
  const exceptions = calculateProjectExceptions(project, records);
  const activityTimeline = buildProjectActivityTimeline(project, records);
  const healthSummary = getProjectHealth(project, records);

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    client: project.client,
    location: project.location,
    contractValueFormatted: project.contractValue,
    contractValue,
    startDate: project.startDate,
    expectedCompletion: project.expectedCompletion,
    projectManager: project.projectManager,
    currentStageNumber: currentStage.stageNumber,
    currentStageName: currentStage.stageName,
    currentStageStatus: currentStage.stageStatus,
    overallProgress: progress.overallProgress,
    stageStatuses,
    procurementSummary,
    inspectionSummary,
    dispatchSummary,
    miccSummary,
    billingSummary,
    pendingActions,
    exceptions,
    activityTimeline,
    healthSummary,
  };
}

// Pure helper to extract workflow records for a given project ID from all collections
export function extractProjectWorkflowRecords(
  projectId: string,
  allProjects: Project[],
  allTenders: TenderRecord[],
  allLoiLoas: LoiLoaRecord[],
  allAcceptances: AcceptanceRecord[],
  allCpgs: CpgRecord[],
  allAgreements: AgreementRecord[],
  allBoqs: BoqItem[],
  allGtps: GtpRecord[],
  allPos: PoRecord[],
  allCalls: InspectionCallRecord[],
  allOrders: InspectionOrderRecord[],
  allJirs: JirRecord[],
  allDis: DiRecord[],
  allMiccs: MiccRecord[],
  allProgressiveBills: ProgressiveBillRecord[],
  allFinalBills: FinalBillRecord[],
  allVendors?: Vendor[]
): ProjectWorkflowRecords | undefined {
  const project = allProjects.find((p) => p.id === projectId);
  if (!project) return undefined;

  return {
    project,
    tender: allTenders.find((t) => t.projectId === projectId),
    loiLoa: allLoiLoas.find((l) => l.projectId === projectId),
    acceptance: allAcceptances.find((a) => a.projectId === projectId),
    cpg: allCpgs.find((c) => c.projectId === projectId),
    agreement: allAgreements.find((ag) => ag.projectId === projectId),
    boqItems: allBoqs.filter((b) => b.projectId === projectId),
    gtps: allGtps.filter((g) => g.projectId === projectId),
    pos: allPos.filter((p) => p.projectId === projectId),
    inspectionCalls: allCalls.filter((c) => c.projectId === projectId),
    inspectionOrders: allOrders.filter((o) => o.projectId === projectId),
    jirs: allJirs.filter((j) => j.projectId === projectId),
    dis: allDis.filter((d) => d.projectId === projectId),
    miccs: allMiccs.filter((m) => m.projectId === projectId),
    progressiveBills: allProgressiveBills.filter((b) => b.projectId === projectId),
    finalBills: allFinalBills.filter((f) => f.projectId === projectId),
    vendors: allVendors,
  };
}
