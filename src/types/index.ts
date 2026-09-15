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
