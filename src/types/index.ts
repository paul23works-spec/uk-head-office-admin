export type ProjectStatus =
  | 'Not Started'
  | 'In Progress'
  | 'On Hold'
  | 'Completed'
  | 'Attention Required';

export type AdminGroupRole = 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';

export type StageGroupCode = 'A' | 'B' | 'C';

export type StageGroupName =
  | 'A — ADMIN WORK DETAILS'
  | 'B — ADMIN WORK DETAILS'
  | 'C — ADMIN';

export type WorkflowStageStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface WorkflowStageDefinition {
  id: string; // '01' to '13'
  code: string;
  name: string;
  adminGroup: AdminGroupRole; // Internal responsibility: ADMIN A (01-04), ADMIN B (05-09), ADMIN C (10-13)
  group: StageGroupCode;
  groupTitle: string;
  description: string;
  phase: string;
}

export interface ProjectWorkflowState {
  stageId: string;
  projectId?: string;
  status: WorkflowStageStatus;
  adminGroup?: AdminGroupRole;
  assignedUser?: string;
  completedAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  department: string;
  location: string;
  tenderRef: string;
  contractValue: string;
  startDate: string;
  expectedCompletion: string;
  projectManager: string;
  status: ProjectStatus;
  currentStageId: string;
  currentStageName: string;
  stageGroup: StageGroupCode;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  workflow: ProjectWorkflowState[];
}

export type ActionPriority = 'High' | 'Medium' | 'Low';

export interface PendingAction {
  id: string;
  projectId: string;
  project: string;
  projectCode: string;
  action: string;
  priority: ActionPriority;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  category: string;
}

export interface Activity {
  id: string;
  projectId: string;
  user: string;
  action: string;
  timestamp: string;
  environment: 'DEMO';
  details?: string;
}

export interface DocumentPlaceholder {
  id: string;
  projectId: string;
  name: string;
  code: string;
  category: string;
  fileType: 'PDF' | 'DWG' | 'DOCX' | 'XLSX';
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  status: 'Verified' | 'Pending Review' | 'Draft';
}

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  environment: 'DEMO';
  avatarInitials: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'update' | 'info';
  link?: string;
}

// ==========================================
// PHASE 2: A ADMIN WORKFLOW TYPES (01 - 04)
// ==========================================

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  fileSize?: string;
  remarks?: string;
}

// 01 — Tender
export type TenderStatus =
  | 'Draft'
  | 'Published'
  | 'Submitted'
  | 'Under Evaluation'
  | 'L1'
  | 'Awarded'
  | 'Not Awarded'
  | 'Cancelled';

export type TenderL1Status = 'Not Determined' | 'L1' | 'Not L1';

export interface TenderRecord {
  id: string; // TND-2024-001
  tenderNumber: string; // e.g. NIT/APDCL/MED-COLL/2023/14
  tenderDate: string;
  tenderRef: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  client: string;
  department: string;
  location: string;
  tenderValue: string; // e.g. ₹ 28.40 Cr
  estimatedValue?: string;
  openingDate: string;
  closingDate: string;
  status: TenderStatus;
  l1Status: TenderL1Status;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// 02 — LOI / LOA
export type LoiLoaStatus =
  | 'Draft'
  | 'Received'
  | 'Under Review'
  | 'Accepted'
  | 'Closed';

export interface LoiLoaRecord {
  id: string; // LOI-2024-001
  loiNumber: string; // e.g. LOA/APDCL/CGM(PP&D)/2023/889
  date: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  tenderId: string;
  tenderNumber: string;
  client: string;
  contractValue: string; // e.g. ₹ 28.40 Cr
  referenceDetails: string;
  remarks: string;
  status: LoiLoaStatus;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// 03 — Acceptance
export type AcceptanceStatus =
  | 'Draft'
  | 'Submitted'
  | 'Accepted'
  | 'Returned'
  | 'Closed';

export interface AcceptanceRecord {
  id: string; // ACC-2024-001
  acceptanceRef: string; // e.g. UK/HO/ACC/2023/104
  acceptanceDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  loiLoaId: string;
  loiLoaNumber: string;
  client: string;
  remarks: string;
  status: AcceptanceStatus;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// 04 — CPG & Agreement
export type CpgStatus =
  | 'Pending'
  | 'Submitted'
  | 'Under Verification'
  | 'Valid'
  | 'Expired'
  | 'Released';

export interface CpgRecord {
  id: string; // CPG-2024-001
  cpgRef: string; // e.g. BG/SBI/2024/771
  cpgDate: string;
  cpgAmount: string; // e.g. ₹ 2.84 Cr
  submissionDate: string;
  validityDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  loiLoaId: string;
  loiLoaNumber: string;
  bankName?: string;
  status: CpgStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

export type AgreementStatus =
  | 'Draft'
  | 'Under Preparation'
  | 'Executed'
  | 'Closed';

export interface AgreementRecord {
  id: string; // AGR-2024-001
  agreementRef: string; // e.g. AGR/APDCL/2024/019
  agreementDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  loiLoaId: string;
  loiLoaNumber: string;
  status: AgreementStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 3: B ADMIN & BOQ TYPES (STAGES 05 - 09)
// ==========================================

// Vendor Foundation
export type VendorStatus = 'Active' | 'Inactive';

export interface Vendor {
  id: string; // VND-001
  code: string; // e.g. VND-TRF-01
  name: string; // e.g. Assam Electrical Industries Ltd
  category: string; // e.g. Transformers & Switchgear
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: VendorStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// BOQ Item Model
export interface BoqItem {
  id: string; // BOQ-2024-001
  projectId: string;
  projectCode: string;
  projectName: string;
  itemNumber: string; // e.g. "1.01", "2.04"
  description: string;
  specification: string;
  quantity: number;
  unit: string; // 'Nos', 'Sets', 'Km', 'Mtr', 'MT'
  rate: number; // rate per unit
  amount: number; // deterministic: quantity * rate
  category: string; // 'Transformers', 'Switchgear', 'Conductors', 'Civil & Structures', etc.
  vendorId?: string; // OPTIONAL at creation
  vendorName?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Stage 05 — GTP (Guaranteed Technical Particulars)
export type GtpStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Clarification Required'
  | 'Approved'
  | 'Rejected';

export interface GtpRecord {
  id: string; // GTP-2024-001
  gtpNumber: string; // e.g. GTP/BGA/TRF/001
  projectId: string;
  projectCode: string;
  projectName: string;
  boqItemId: string;
  boqItemNumber: string;
  materialItem: string;
  vendorId: string;
  vendorName: string;
  submissionDate: string;
  revision: string; // e.g. "R0", "R1", "R2"
  previousRevisionRef?: string;
  revisionDate: string;
  status: GtpStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 06 — PO (Purchase Order)
export type PoStatus =
  | 'Draft'
  | 'Issued'
  | 'Acknowledged'
  | 'In Progress'
  | 'Closed'
  | 'Cancelled';

export interface PoLineItem {
  id: string; // POL-001
  poId: string;
  boqItemId: string;
  boqItemNumber: string;
  description: string;
  boqQuantity: number;
  quantity: number; // current PO line quantity
  balanceQuantity: number; // remaining BOQ qty
  unit: string;
  rate: number;
  amount: number; // quantity * rate
  deliveryRequirement?: string;
  remarks?: string;
}

export interface PoRecord {
  id: string; // PO-2024-001
  poNumber: string; // e.g. PO/UK/APDCL/2024/041
  poDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  relatedTenderId?: string;
  relatedLoiLoaId?: string;
  items: PoLineItem[];
  totalAmount: number; // deterministic sum of line amounts
  status: PoStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 07 — Inspection Call
export type InspectionCallStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Scheduled'
  | 'Completed'
  | 'Cancelled';

export interface InspectionCallRecord {
  id: string; // INC-2024-001
  inspectionCallNumber: string; // e.g. IC/UK/2024/015
  projectId: string;
  projectCode: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  poId: string;
  poNumber: string;
  boqItemId: string;
  boqItemNumber: string;
  material: string;
  poQuantity: number;
  previouslyCalledQuantity: number;
  quantity: number; // current call quantity
  remainingQuantity: number;
  unit: string;
  requestDate: string;
  proposedInspectionDate: string;
  inspectionLocation: string;
  status: InspectionCallStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 08 — Inspection Order
export type InspectionOrderStatus =
  | 'Draft'
  | 'Issued'
  | 'Scheduled'
  | 'Completed'
  | 'Cancelled';

export interface InspectionOrderRecord {
  id: string; // INO-2024-001
  inspectionOrderNumber: string; // e.g. IO/APDCL/2024/082
  inspectionCallId: string;
  inspectionCallNumber: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  poId: string;
  poNumber: string;
  boqItemId: string;
  material: string;
  quantity: number;
  unit: string;
  orderDate: string;
  inspectionDate: string;
  inspectionLocation: string;
  assignedAuthority: string; // e.g. "Chief General Manager (QC) / TPIA"
  assignedPerson: string; // e.g. "P. K. Sarmah, Dy. General Manager"
  status: InspectionOrderStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 09 — JIR (Joint Inspection Report)
export type JirStatus =
  | 'Draft'
  | 'Under Inspection'
  | 'Accepted'
  | 'Partially Accepted'
  | 'Rejected'
  | 'Completed';

export interface JirRecord {
  id: string; // JIR-2024-001
  jirNumber: string; // e.g. JIR/APDCL/2024/104
  inspectionOrderId: string;
  inspectionOrderNumber: string;
  inspectionCallId: string;
  inspectionCallNumber: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  poId: string;
  poNumber: string;
  boqItemId: string;
  inspectionDate: string;
  material: string;
  unit: string;
  offeredQuantity: number;
  inspectedQuantity: number; // <= offeredQuantity
  acceptedQuantity: number; // acceptedQuantity + rejectedQuantity <= inspectedQuantity
  rejectedQuantity: number;
  balanceQuantity: number; // offeredQuantity - acceptedQuantity
  observations: string;
  testResults: string;
  status: JirStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage B Relational Progress
export interface StageBProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  stages: {
    stageId: string; // '05' to '09'
    name: string;
    status: 'Completed' | 'In Progress' | 'Not Started';
    recordRef?: string;
    hasRecord: boolean;
  }[];
  boqItemCount: number;
  boqTotalValue: number;
}

// ==========================================
// PHASE 4: C ADMIN WORKFLOW (STAGES 10–13)
// ==========================================

// Stage 10 — DI (Dispatch Instruction / Dispatch Clearance)
export type DiStatus =
  | 'Draft'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Partially Dispatched'
  | 'Cancelled';

export interface DiRecord {
  id: string; // DI-2024-001
  diNumber: string; // e.g. DI/UK/APDCL/2024/021
  diDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  poId: string;
  poNumber: string;
  jirId: string;
  jirNumber: string;
  boqItemId: string;
  boqItemNumber?: string;
  vendorId: string;
  vendorName: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  dispatchDate?: string;
  destination: string;
  vehicleReference?: string;
  lrTransportReference?: string;
  status: DiStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 11 — MICC (Material Inspection and Clearance Certificate)
export type MiccStatus =
  | 'Draft'
  | 'Under Verification'
  | 'Verified'
  | 'Rejected';

export interface MiccRecord {
  id: string; // MICC-2024-001
  miccNumber: string; // e.g. MICC/APDCL/BGA/2024/015
  miccDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  diId: string;
  diNumber: string;
  poId: string;
  poNumber: string;
  jirId: string;
  jirNumber: string;
  boqItemId: string;
  boqItemNumber?: string;
  vendorId: string;
  vendorName: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  fieldOffice: string; // e.g. "Bongaigaon Site Circle Office"
  verifiedBy?: string;
  verificationDate?: string;
  status: MiccStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 12 — Progressive Bill
export type ProgressiveBillStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Partially Approved'
  | 'Rejected';

export interface ProgressiveBillLineItem {
  id: string; // PBL-001
  billId: string;
  miccId: string;
  miccNumber: string;
  diId: string;
  diNumber: string;
  poId: string;
  poNumber: string;
  boqItemId: string;
  boqItemNumber?: string;
  description: string;
  unit: string;
  claimedQuantity: number;
  rate: number;
  claimedAmount: number; // claimedQuantity * rate
  approvedQuantity: number;
  approvedAmount: number; // approvedQuantity * rate
  remarks?: string;
}

export interface ProgressiveBillRecord {
  id: string; // PB-2024-001
  billNumber: string; // e.g. RA-01/UK/APDCL/2024
  billDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProgressiveBillStatus;
  lineItems: ProgressiveBillLineItem[];
  previousApprovedAmount: number;
  currentClaimedAmount: number;
  currentApprovedAmount: number;
  cumulativeApprovedAmount: number;
  contractValue: number;
  remainingContractBalance: number;
  submissionDate?: string;
  approvalDate?: string;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage 13 — Final Bill
export type FinalBillStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected';

export interface FinalBillRecord {
  id: string; // FB-2024-001
  finalBillNumber: string; // e.g. FB/UK/APDCL/2024/001
  projectId: string;
  projectCode: string;
  projectName: string;
  billDate: string;
  contractValue: number;
  totalApprovedProgressiveBills: number;
  adjustments: number; // Signed: positive increases final payable, negative decreases
  finalBillAmount: number; // contractValue + adjustments - totalApprovedProgressiveBills
  approvalDate?: string;
  approvedBy?: string;
  status: FinalBillStatus;
  remarks: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

// Stage C Relational Progress
export interface StageCProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  stages: {
    stageId: string; // '10' to '13'
    name: string;
    status: 'Completed' | 'In Progress' | 'Not Started';
    recordRef?: string;
    hasRecord: boolean;
  }[];
  activeDiCount: number;
  verifiedMiccCount: number;
  cumulativeApprovedBilling: number;
  remainingContractBalance: number;
  finalBillStatus?: FinalBillStatus;
}

// ==========================================
// PHASE 5: COMPLETE PROJECT CONTROL TYPES
// ==========================================

export type ProjectControlStageStatus =
  | 'Locked'
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Attention Required';

export interface ProjectStageStatusInfo {
  stageId: string; // '01' to '13'
  stageNumber: string; // '01' to '13'
  name: string;
  adminGroup: AdminGroupRole;
  group: StageGroupCode;
  status: ProjectControlStageStatus;
  primaryReference?: string;
  date?: string;
  summary: string;
  attentionMessage?: string;
  navigationHref: string;
  recordCount: number;
}

export interface ProjectProcurementSummary {
  boqItemCount: number;
  totalBoqEstimatedAmount: number;
  totalBoqQuantity: number;
  activePoCount: number;
  totalOrderedQuantity: number;
  remainingQuantity: number;
  totalPoAmount: number;
  gtpCount: number;
  approvedGtpCount: number;
  underReviewGtpCount: number;
  procurementStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required';
}

export interface ProjectInspectionSummary {
  callCount: number;
  orderCount: number;
  jirCount: number;
  offeredQuantity: number;
  inspectedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  balanceQuantity: number;
  inspectionStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required';
}

export interface ProjectDispatchSummary {
  acceptedQuantity: number;
  activeDiCount: number;
  dispatchedQuantity: number;
  remainingDispatchQuantity: number;
  latestDiNumber?: string;
  latestDiDate?: string;
  dispatchStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required';
}

export interface ProjectMiccSummary {
  totalDispatchedQuantity: number;
  activeMiccCount: number;
  verifiedQuantity: number;
  pendingVerificationQuantity: number;
  rejectedMiccCount: number;
  miccStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required';
}

export interface ProjectControlBillingSummary {
  contractValue: number;
  cumulativeApprovedBilling: number;
  pendingClaimedBilling: number;
  remainingContractBalance: number;
  progressiveBillsCount: number;
  approvedBillsCount: number;
  finalBillStatus?: FinalBillStatus;
  finalBillAmount?: number;
  isFinanciallyClosed: boolean;
  billingStatus: 'Not Started' | 'In Progress' | 'Completed' | 'Attention Required';
}

export type ActionCategory =
  | 'Tender / Contract'
  | 'Procurement'
  | 'Inspection'
  | 'Dispatch'
  | 'Material Inward'
  | 'Billing'
  | 'Closure';

export interface ProjectPendingAction {
  id: string;
  stageNumber: string;
  stageName: string;
  title: string;
  description: string;
  category: ActionCategory;
  priority: 'High' | 'Medium' | 'Low';
  actionUrl: string;
  actionText: string;
  sourceReference?: string;
}

export type ExceptionSeverity = 'Info' | 'Pending' | 'Attention';

export interface ProjectException {
  id: string;
  stageNumber: string;
  stageName: string;
  title: string;
  description: string;
  severity: ExceptionSeverity;
  actionUrl?: string;
  actionText?: string;
  reference?: string;
}

export interface ProjectActivityEvent {
  id: string;
  stageNumber: string;
  stageName: string;
  date: string;
  timestamp: string;
  reference: string;
  title: string;
  description: string;
  status: string;
  navigationHref: string;
  type: string;
}

export interface ProjectHealthSummary {
  healthStatus: 'On Track' | 'Attention Needed' | 'Critical Attention' | 'Completed';
  completedStagesCount: number;
  totalStagesCount: number; // 13
  workflowProgressPercent: number; // (completedStagesCount / 13) * 100
  pendingActionsCount: number;
  exceptionsCount: number;
  adminAProgress: number; // 01-04
  adminBProgress: number; // 05-09
  adminCProgress: number; // 10-13
  billingProgressPercent: number;
}

export interface ProjectSearchResult {
  id: string;
  projectId: string;
  reference: string;
  stageNumber: string;
  stageName: string;
  type: string;
  status: string;
  date: string;
  description: string;
  navigationHref: string;
}

export interface ProjectControlSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  client: string;
  location: string;
  contractValueFormatted: string;
  contractValue: number;
  startDate: string;
  expectedCompletion: string;
  projectManager: string;
  currentStageNumber: string;
  currentStageName: string;
  currentStageStatus: ProjectControlStageStatus;
  overallProgress: number;
  stageStatuses: ProjectStageStatusInfo[];
  procurementSummary: ProjectProcurementSummary;
  inspectionSummary: ProjectInspectionSummary;
  dispatchSummary: ProjectDispatchSummary;
  miccSummary: ProjectMiccSummary;
  billingSummary: ProjectControlBillingSummary;
  pendingActions: ProjectPendingAction[];
  exceptions: ProjectException[];
  activityTimeline: ProjectActivityEvent[];
  healthSummary: ProjectHealthSummary;
}

