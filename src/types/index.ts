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

