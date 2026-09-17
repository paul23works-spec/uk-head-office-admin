'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Project,
  PendingAction,
  Activity,
  NotificationItem,
  ProjectStatus,
  TenderRecord,
  LoiLoaRecord,
  AcceptanceRecord,
  CpgRecord,
  AgreementRecord,
  WorkflowStageStatus,
  Vendor,
  BoqItem,
  GtpRecord,
  PoRecord,
  InspectionCallRecord,
  InspectionOrderRecord,
  JirRecord,
  StageBProgress,
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  ProgressiveBillLineItem,
  FinalBillRecord,
  StageCProgress,
  ProjectControlSummary,
  ProjectStageStatusInfo,
  ProjectPendingAction as ProjectControlPendingAction,
  ProjectException,
  ProjectActivityEvent,
  ProjectSearchResult,
} from '@/types';
import {
  INITIAL_PROJECTS,
  INITIAL_PENDING_ACTIONS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TENDERS,
  INITIAL_LOI_LOAS,
  INITIAL_ACCEPTANCES,
  INITIAL_CPGS,
  INITIAL_AGREEMENTS,
  INITIAL_VENDORS,
  INITIAL_BOQ_ITEMS,
  INITIAL_GTPS,
  INITIAL_POS,
  INITIAL_INSPECTION_CALLS,
  INITIAL_INSPECTION_ORDERS,
  INITIAL_JIRS,
  INITIAL_DIS,
  INITIAL_MICCS,
  INITIAL_PROGRESSIVE_BILLS,
  INITIAL_FINAL_BILLS,
} from './mock-data';
import { WORKFLOW_STAGES, DEMO_USER_PROFILE } from './constants';
import {
  calculateRemainingBoqQuantity,
  calculateRemainingCallableQuantity,
  determineLatestGtpForBoqItem,
  validatePoCreation,
  validateInspectionCallCreation,
  validateInspectionOrderCreation,
  validateJirCreation,
} from './procurement-engine';
import {
  calculateDispatchBalance,
  validateDiCreation,
  calculateMiccBalance,
  validateMiccCreation,
  calculateBillableQuantity,
  calculateProjectBillingSummary,
  validateProgressiveBillCreation,
  validateFinalBillCreation,
} from './c-admin-engine';
import {
  getProjectControlSummary as getControlSummaryFromEngine,
  calculateStageStatuses as calculateStageStatusesFromEngine,
  calculatePendingActions as calculatePendingActionsFromEngine,
  calculateProjectExceptions as calculateProjectExceptionsFromEngine,
  buildProjectActivityTimeline as buildProjectActivityTimelineFromEngine,
  searchProjectRecords as searchProjectRecordsFromEngine,
  extractProjectWorkflowRecords,
} from './project-control-engine';

export interface StageAProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  stages: {
    stageId: string;
    name: string;
    status: 'Completed' | 'In Progress' | 'Not Started';
    recordRef?: string;
    hasRecord: boolean;
  }[];
}

interface ProjectContextType {
  projects: Project[];
  pendingActions: PendingAction[];
  activities: Activity[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Projects
  createProject: (newProjectData: {
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
    remarks: string;
  }) => Project;
  getProject: (id: string) => Project | undefined;
  updateProjectStatus: (id: string, status: ProjectStatus, remarks?: string) => void;
  markNotificationAsRead: (id: string) => void;
  stats: {
    total: number;
    active: number;
    attentionRequired: number;
    completed: number;
    notStarted: number;
    onHold: number;
  };

  // Phase 2: A Admin Collections
  tenders: TenderRecord[];
  loiLoas: LoiLoaRecord[];
  acceptances: AcceptanceRecord[];
  cpgs: CpgRecord[];
  agreements: AgreementRecord[];

  // Stage 01 Tender CRUD
  createTender: (data: Omit<TenderRecord, 'id' | 'createdAt' | 'updatedAt'>) => TenderRecord;
  updateTender: (id: string, updates: Partial<TenderRecord>) => void;
  getTender: (id: string) => TenderRecord | undefined;
  getTenderByProjectId: (projectId: string) => TenderRecord | undefined;

  // Stage 02 LOI/LOA CRUD
  createLoiLoa: (data: Omit<LoiLoaRecord, 'id' | 'createdAt' | 'updatedAt'>) => LoiLoaRecord;
  updateLoiLoa: (id: string, updates: Partial<LoiLoaRecord>) => void;
  getLoiLoa: (id: string) => LoiLoaRecord | undefined;
  getLoiLoaByProjectId: (projectId: string) => LoiLoaRecord | undefined;

  // Stage 03 Acceptance CRUD
  createAcceptance: (data: Omit<AcceptanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => AcceptanceRecord;
  updateAcceptance: (id: string, updates: Partial<AcceptanceRecord>) => void;
  getAcceptance: (id: string) => AcceptanceRecord | undefined;
  getAcceptanceByProjectId: (projectId: string) => AcceptanceRecord | undefined;

  // Stage 04 CPG CRUD
  createCpg: (data: Omit<CpgRecord, 'id' | 'createdAt' | 'updatedAt'>) => CpgRecord;
  updateCpg: (id: string, updates: Partial<CpgRecord>) => void;
  getCpg: (id: string) => CpgRecord | undefined;
  getCpgByProjectId: (projectId: string) => CpgRecord | undefined;

  // Stage 04 Agreement CRUD
  createAgreement: (data: Omit<AgreementRecord, 'id' | 'createdAt' | 'updatedAt'>) => AgreementRecord;
  updateAgreement: (id: string, updates: Partial<AgreementRecord>) => void;
  getAgreement: (id: string) => AgreementRecord | undefined;
  getAgreementByProjectId: (projectId: string) => AgreementRecord | undefined;

  // Relational Progress Phase 2
  getStageAProgress: (projectId: string) => StageAProgress;

  // ==========================================
  // PHASE 3: B ADMIN & BOQ COLLECTIONS & CRUD
  // ==========================================

  // Vendors
  vendors: Vendor[];
  createVendor: (data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  getVendor: (id: string) => Vendor | undefined;

  // BOQ
  boqItems: BoqItem[];
  createBoqItem: (data: Omit<BoqItem, 'id' | 'createdAt' | 'updatedAt' | 'amount'>) => BoqItem;
  updateBoqItem: (id: string, updates: Partial<BoqItem>) => void;
  getBoqItem: (id: string) => BoqItem | undefined;
  getBoqItemsByProjectId: (projectId: string) => BoqItem[];
  getRemainingBoqQuantity: (boqItemId: string, excludePoId?: string) => number;

  // Stage 05 GTP
  gtps: GtpRecord[];
  createGtp: (data: Omit<GtpRecord, 'id' | 'createdAt' | 'updatedAt'>) => GtpRecord;
  updateGtp: (id: string, updates: Partial<GtpRecord>) => void;
  getGtp: (id: string) => GtpRecord | undefined;
  getGtpsByProjectId: (projectId: string) => GtpRecord[];
  getLatestGtpForBoqItem: (boqItemId: string) => GtpRecord | undefined;

  // Stage 06 PO
  pos: PoRecord[];
  createPo: (data: Omit<PoRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => PoRecord;
  updatePo: (id: string, updates: Partial<PoRecord>) => void;
  getPo: (id: string) => PoRecord | undefined;
  getPosByProjectId: (projectId: string) => PoRecord[];

  // Stage 07 Inspection Call
  inspectionCalls: InspectionCallRecord[];
  createInspectionCall: (
    data: Omit<InspectionCallRecord, 'id' | 'createdAt' | 'updatedAt' | 'previouslyCalledQuantity' | 'remainingQuantity'>
  ) => InspectionCallRecord;
  updateInspectionCall: (id: string, updates: Partial<InspectionCallRecord>) => void;
  getInspectionCall: (id: string) => InspectionCallRecord | undefined;
  getInspectionCallsByProjectId: (projectId: string) => InspectionCallRecord[];
  getRemainingCallableQuantity: (poId: string, boqItemId: string, excludeCallId?: string) => number;

  // Stage 08 Inspection Order
  inspectionOrders: InspectionOrderRecord[];
  createInspectionOrder: (data: Omit<InspectionOrderRecord, 'id' | 'createdAt' | 'updatedAt'>) => InspectionOrderRecord;
  updateInspectionOrder: (id: string, updates: Partial<InspectionOrderRecord>) => void;
  getInspectionOrder: (id: string) => InspectionOrderRecord | undefined;
  getInspectionOrdersByProjectId: (projectId: string) => InspectionOrderRecord[];

  // Stage 09 JIR
  jirs: JirRecord[];
  createJir: (data: Omit<JirRecord, 'id' | 'createdAt' | 'updatedAt' | 'balanceQuantity'>) => JirRecord;
  updateJir: (id: string, updates: Partial<JirRecord>) => void;
  getJir: (id: string) => JirRecord | undefined;
  getJirsByProjectId: (projectId: string) => JirRecord[];

  // Relational Progress Phase 3
  getStageBProgress: (projectId: string) => StageBProgress;

  // ==========================================
  // PHASE 4: C ADMIN COLLECTIONS & CRUD
  // ==========================================

  // Stage 10 DI
  dis: DiRecord[];
  createDi: (data: Omit<DiRecord, 'id' | 'createdAt' | 'updatedAt'>) => DiRecord;
  updateDi: (id: string, updates: Partial<DiRecord>) => void;
  getDi: (id: string) => DiRecord | undefined;
  getDisByProjectId: (projectId: string) => DiRecord[];
  getRemainingDispatchQuantity: (jirId: string, excludeDiId?: string) => number;

  // Stage 11 MICC
  miccs: MiccRecord[];
  createMicc: (data: Omit<MiccRecord, 'id' | 'createdAt' | 'updatedAt'>) => MiccRecord;
  updateMicc: (id: string, updates: Partial<MiccRecord>) => void;
  getMicc: (id: string) => MiccRecord | undefined;
  getMiccsByProjectId: (projectId: string) => MiccRecord[];
  getRemainingMiccQuantity: (diId: string, excludeMiccId?: string) => number;

  // Stage 12 Progressive Bill
  progressiveBills: ProgressiveBillRecord[];
  createProgressiveBill: (
    data: Omit<
      ProgressiveBillRecord,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'previousApprovedAmount'
      | 'currentClaimedAmount'
      | 'currentApprovedAmount'
      | 'cumulativeApprovedAmount'
      | 'contractValue'
      | 'remainingContractBalance'
    > & {
      previousApprovedAmount?: number;
      currentClaimedAmount?: number;
      currentApprovedAmount?: number;
      cumulativeApprovedAmount?: number;
      contractValue?: number;
      remainingContractBalance?: number;
    }
  ) => ProgressiveBillRecord;
  updateProgressiveBill: (id: string, updates: Partial<ProgressiveBillRecord>) => void;
  getProgressiveBill: (id: string) => ProgressiveBillRecord | undefined;
  getProgressiveBillsByProjectId: (projectId: string) => ProgressiveBillRecord[];
  getBillableQuantityForMicc: (miccId: string, excludeBillId?: string) => number;
  getProjectBillingSummary: (
    projectId: string,
    excludeBillId?: string
  ) => {
    contractValue: number;
    cumulativeApprovedAmount: number;
    pendingClaimedAmount: number;
    remainingContractBalance: number;
    approvedBillsCount: number;
  };

  // Stage 13 Final Bill
  finalBills: FinalBillRecord[];
  createFinalBill: (
    data: Omit<
      FinalBillRecord,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'contractValue'
      | 'totalApprovedProgressiveBills'
      | 'finalBillAmount'
    >
  ) => FinalBillRecord;
  updateFinalBill: (id: string, updates: Partial<FinalBillRecord>) => void;
  getFinalBill: (id: string) => FinalBillRecord | undefined;
  getFinalBillByProjectId: (projectId: string) => FinalBillRecord | undefined;

  // Relational Progress Phase 4
  getStageCProgress: (projectId: string) => StageCProgress;

  // ==========================================
  // PHASE 5: PROJECT CONTROL ENGINE HELPERS
  // ==========================================
  getProjectControlSummary: (projectId: string) => ProjectControlSummary | undefined;
  getProjectStageStatuses: (projectId: string) => ProjectStageStatusInfo[];
  getProjectControlPendingActions: (projectId: string) => ProjectControlPendingAction[];
  getProjectExceptions: (projectId: string) => ProjectException[];
  getProjectControlActivityTimeline: (projectId: string) => ProjectActivityEvent[];
  searchProjectRecords: (projectId: string, query: string) => ProjectSearchResult[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY_PROJECTS = 'uk_admin_projects_phase1';
const STORAGE_KEY_ACTIVITIES = 'uk_admin_activities_phase1';
const STORAGE_KEY_TENDERS = 'uk_admin_tenders_phase2';
const STORAGE_KEY_LOI_LOAS = 'uk_admin_loiloas_phase2';
const STORAGE_KEY_ACCEPTANCES = 'uk_admin_acceptances_phase2';
const STORAGE_KEY_CPGS = 'uk_admin_cpgs_phase2';
const STORAGE_KEY_AGREEMENTS = 'uk_admin_agreements_phase2';
const STORAGE_KEY_VENDORS = 'uk_admin_vendors_phase3';
const STORAGE_KEY_BOQ = 'uk_admin_boq_phase3';
const STORAGE_KEY_GTPS = 'uk_admin_gtps_phase3';
const STORAGE_KEY_POS = 'uk_admin_pos_phase3';
const STORAGE_KEY_INSPECTION_CALLS = 'uk_admin_inspection_calls_phase3';
const STORAGE_KEY_INSPECTION_ORDERS = 'uk_admin_inspection_orders_phase3';
const STORAGE_KEY_JIRS = 'uk_admin_jirs_phase3';
const STORAGE_KEY_DIS = 'uk_admin_dis_phase4';
const STORAGE_KEY_MICCS = 'uk_admin_miccs_phase4';
const STORAGE_KEY_PROGRESSIVE_BILLS = 'uk_admin_progressive_bills_phase4';
const STORAGE_KEY_FINAL_BILLS = 'uk_admin_final_bills_phase4';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [pendingActions] = useState<PendingAction[]>(INITIAL_PENDING_ACTIONS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Phase 2 State
  const [tenders, setTenders] = useState<TenderRecord[]>(INITIAL_TENDERS);
  const [loiLoas, setLoiLoas] = useState<LoiLoaRecord[]>(INITIAL_LOI_LOAS);
  const [acceptances, setAcceptances] = useState<AcceptanceRecord[]>(INITIAL_ACCEPTANCES);
  const [cpgs, setCpgs] = useState<CpgRecord[]>(INITIAL_CPGS);
  const [agreements, setAgreements] = useState<AgreementRecord[]>(INITIAL_AGREEMENTS);

  // Phase 3 State
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [boqItems, setBoqItems] = useState<BoqItem[]>(INITIAL_BOQ_ITEMS);
  const [gtps, setGtps] = useState<GtpRecord[]>(INITIAL_GTPS);
  const [pos, setPos] = useState<PoRecord[]>(INITIAL_POS);
  const [inspectionCalls, setInspectionCalls] = useState<InspectionCallRecord[]>(INITIAL_INSPECTION_CALLS);
  const [inspectionOrders, setInspectionOrders] = useState<InspectionOrderRecord[]>(INITIAL_INSPECTION_ORDERS);
  const [jirs, setJirs] = useState<JirRecord[]>(INITIAL_JIRS);

  // Phase 4 State
  const [dis, setDis] = useState<DiRecord[]>(INITIAL_DIS);
  const [miccs, setMiccs] = useState<MiccRecord[]>(INITIAL_MICCS);
  const [progressiveBills, setProgressiveBills] = useState<ProgressiveBillRecord[]>(INITIAL_PROGRESSIVE_BILLS);
  const [finalBills, setFinalBills] = useState<FinalBillRecord[]>(INITIAL_FINAL_BILLS);

  const isLoadedRef = useRef(false);

  // Safe asynchronous local storage hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
        if (storedProjects) setProjects(JSON.parse(storedProjects));

        const storedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
        if (storedActivities) setActivities(JSON.parse(storedActivities));

        const storedTenders = localStorage.getItem(STORAGE_KEY_TENDERS);
        if (storedTenders) setTenders(JSON.parse(storedTenders));

        const storedLoiLoas = localStorage.getItem(STORAGE_KEY_LOI_LOAS);
        if (storedLoiLoas) setLoiLoas(JSON.parse(storedLoiLoas));

        const storedAcceptances = localStorage.getItem(STORAGE_KEY_ACCEPTANCES);
        if (storedAcceptances) setAcceptances(JSON.parse(storedAcceptances));

        const storedCpgs = localStorage.getItem(STORAGE_KEY_CPGS);
        if (storedCpgs) setCpgs(JSON.parse(storedCpgs));

        const storedAgreements = localStorage.getItem(STORAGE_KEY_AGREEMENTS);
        if (storedAgreements) setAgreements(JSON.parse(storedAgreements));

        const storedVendors = localStorage.getItem(STORAGE_KEY_VENDORS);
        if (storedVendors) setVendors(JSON.parse(storedVendors));

        const storedBoq = localStorage.getItem(STORAGE_KEY_BOQ);
        if (storedBoq) setBoqItems(JSON.parse(storedBoq));

        const storedGtps = localStorage.getItem(STORAGE_KEY_GTPS);
        if (storedGtps) setGtps(JSON.parse(storedGtps));

        const storedPos = localStorage.getItem(STORAGE_KEY_POS);
        if (storedPos) setPos(JSON.parse(storedPos));

        const storedCalls = localStorage.getItem(STORAGE_KEY_INSPECTION_CALLS);
        if (storedCalls) setInspectionCalls(JSON.parse(storedCalls));

        const storedOrders = localStorage.getItem(STORAGE_KEY_INSPECTION_ORDERS);
        if (storedOrders) setInspectionOrders(JSON.parse(storedOrders));

        const storedJirs = localStorage.getItem(STORAGE_KEY_JIRS);
        if (storedJirs) setJirs(JSON.parse(storedJirs));

        const storedDis = localStorage.getItem(STORAGE_KEY_DIS);
        if (storedDis) setDis(JSON.parse(storedDis));

        const storedMiccs = localStorage.getItem(STORAGE_KEY_MICCS);
        if (storedMiccs) setMiccs(JSON.parse(storedMiccs));

        const storedProgressive = localStorage.getItem(STORAGE_KEY_PROGRESSIVE_BILLS);
        if (storedProgressive) setProgressiveBills(JSON.parse(storedProgressive));

        const storedFinal = localStorage.getItem(STORAGE_KEY_FINAL_BILLS);
        if (storedFinal) setFinalBills(JSON.parse(storedFinal));
      } catch {
        // Ignore localStorage read errors in restricted contexts
      }
      isLoadedRef.current = true;
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
      localStorage.setItem(STORAGE_KEY_TENDERS, JSON.stringify(tenders));
      localStorage.setItem(STORAGE_KEY_LOI_LOAS, JSON.stringify(loiLoas));
      localStorage.setItem(STORAGE_KEY_ACCEPTANCES, JSON.stringify(acceptances));
      localStorage.setItem(STORAGE_KEY_CPGS, JSON.stringify(cpgs));
      localStorage.setItem(STORAGE_KEY_AGREEMENTS, JSON.stringify(agreements));
      localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(vendors));
      localStorage.setItem(STORAGE_KEY_BOQ, JSON.stringify(boqItems));
      localStorage.setItem(STORAGE_KEY_GTPS, JSON.stringify(gtps));
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
      localStorage.setItem(STORAGE_KEY_INSPECTION_CALLS, JSON.stringify(inspectionCalls));
      localStorage.setItem(STORAGE_KEY_INSPECTION_ORDERS, JSON.stringify(inspectionOrders));
      localStorage.setItem(STORAGE_KEY_JIRS, JSON.stringify(jirs));
      localStorage.setItem(STORAGE_KEY_DIS, JSON.stringify(dis));
      localStorage.setItem(STORAGE_KEY_MICCS, JSON.stringify(miccs));
      localStorage.setItem(STORAGE_KEY_PROGRESSIVE_BILLS, JSON.stringify(progressiveBills));
      localStorage.setItem(STORAGE_KEY_FINAL_BILLS, JSON.stringify(finalBills));
    } catch {
      // Ignore localStorage write errors
    }
  }, [
    projects,
    activities,
    tenders,
    loiLoas,
    acceptances,
    cpgs,
    agreements,
    vendors,
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
  ]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'In Progress').length;
    const attentionRequired = projects.filter((p) => p.status === 'Attention Required').length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const notStarted = projects.filter((p) => p.status === 'Not Started').length;
    const onHold = projects.filter((p) => p.status === 'On Hold').length;

    return { total, active, attentionRequired, completed, notStarted, onHold };
  }, [projects]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const getProject = (id: string) => {
    const cleanId = decodeURIComponent(id);
    return projects.find((p) => p.id === cleanId || p.code === cleanId);
  };

  const createProject = (newProjectData: {
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
    remarks: string;
  }): Project => {
    const newId = `PRJ-2024-${String(projects.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const stageDef = WORKFLOW_STAGES[0];
    const initialWorkflow = WORKFLOW_STAGES.map((s, idx) => ({
      stageId: s.id,
      projectId: newId,
      status: (idx === 0 ? 'In Progress' : 'Not Started') as 'In Progress' | 'Not Started',
      adminGroup: s.adminGroup,
      assignedUser: s.adminGroup === 'ADMIN_A' ? 'Admin A Team' : s.adminGroup === 'ADMIN_B' ? 'Admin B Team' : 'Admin C Team',
      notes: idx === 0 ? 'Project administrative record initialized.' : undefined,
    }));

    const newProject: Project = {
      ...newProjectData,
      id: newId,
      currentStageId: stageDef.id,
      currentStageName: stageDef.name,
      stageGroup: stageDef.group,
      createdAt: nowStr,
      updatedAt: nowStr,
      workflow: initialWorkflow,
    };

    const newActivity: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: newId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Created new demo project entry: ${newProject.code}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Project registered for ${newProject.client} with contract value ${newProject.contractValue}.`,
    };

    setProjects((prev) => [newProject, ...prev]);
    setActivities((prev) => [newActivity, ...prev]);

    return newProject;
  };

  const updateProjectStatus = (id: string, status: ProjectStatus, remarks?: string) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id || p.code === id) {
          return {
            ...p,
            status,
            remarks: remarks || p.remarks,
            updatedAt: nowStr,
          };
        }
        return p;
      })
    );

    const target = projects.find((p) => p.id === id || p.code === id);
    if (target) {
      const newActivity: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: target.id,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Status updated to ${status}`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: remarks || `Administrative status change applied.`,
      };
      setActivities((prev) => [newActivity, ...prev]);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // ==========================================
  // PHASE 2: TENDER METHODS (STAGE 01)
  // ==========================================
  const getTender = (id: string) => tenders.find((t) => t.id === id || t.tenderNumber === id);
  const getTenderByProjectId = (projectId: string) => tenders.find((t) => t.projectId === projectId);

  const createTender = (data: Omit<TenderRecord, 'id' | 'createdAt' | 'updatedAt'>): TenderRecord => {
    const newId = `TND-2024-${String(tenders.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: TenderRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setTenders((prev) => [newRecord, ...prev]);

    // Update project workflow stage 01 if applicable
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const updatedWorkflow = p.workflow.map((w) => {
            if (w.stageId === '01') {
              const stageStatus: WorkflowStageStatus = data.status === 'Awarded' ? 'Completed' : 'In Progress';
              return { ...w, status: stageStatus, updatedAt: nowStr };
            }
            return w;
          });
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Created Tender Record: ${data.tenderNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Tender registered for ${data.projectName} with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateTender = (id: string, updates: Partial<TenderRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setTenders((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          targetProject = t.projectId;
          return { ...t, ...updates, updatedAt: nowStr };
        }
        return t;
      })
    );

    if (targetProject) {
      const newAct: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: targetProject,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Updated Tender details (${id})`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: updates.status ? `Tender status updated to ${updates.status}` : 'Administrative modifications recorded.',
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  // ==========================================
  // PHASE 2: LOI / LOA METHODS (STAGE 02)
  // ==========================================
  const getLoiLoa = (id: string) => loiLoas.find((l) => l.id === id || l.loiNumber === id);
  const getLoiLoaByProjectId = (projectId: string) => loiLoas.find((l) => l.projectId === projectId);

  const createLoiLoa = (data: Omit<LoiLoaRecord, 'id' | 'createdAt' | 'updatedAt'>): LoiLoaRecord => {
    const newId = `LOI-2024-${String(loiLoas.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: LoiLoaRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setLoiLoas((prev) => [newRecord, ...prev]);

    // Update project workflow stage 02
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const updatedWorkflow = p.workflow.map((w) => {
            if (w.stageId === '02') {
              const stageStatus: WorkflowStageStatus = data.status === 'Accepted' ? 'Completed' : 'In Progress';
              return { ...w, status: stageStatus, updatedAt: nowStr };
            }
            return w;
          });
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Recorded LOI / LOA: ${data.loiNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Letter of Award registered for ${data.projectName} with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateLoiLoa = (id: string, updates: Partial<LoiLoaRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setLoiLoas((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          targetProject = l.projectId;
          return { ...l, ...updates, updatedAt: nowStr };
        }
        return l;
      })
    );

    if (targetProject) {
      const newAct: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: targetProject,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Updated LOI / LOA details (${id})`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: updates.status ? `LOI/LOA status updated to ${updates.status}` : 'Administrative modifications saved.',
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  // ==========================================
  // PHASE 2: ACCEPTANCE METHODS (STAGE 03)
  // ==========================================
  const getAcceptance = (id: string) => acceptances.find((a) => a.id === id || a.acceptanceRef === id);
  const getAcceptanceByProjectId = (projectId: string) => acceptances.find((a) => a.projectId === projectId);

  const createAcceptance = (data: Omit<AcceptanceRecord, 'id' | 'createdAt' | 'updatedAt'>): AcceptanceRecord => {
    const newId = `ACC-2024-${String(acceptances.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: AcceptanceRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setAcceptances((prev) => [newRecord, ...prev]);

    // Update project workflow stage 03
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const updatedWorkflow = p.workflow.map((w) => {
            if (w.stageId === '03') {
              const stageStatus: WorkflowStageStatus = data.status === 'Accepted' ? 'Completed' : 'In Progress';
              return { ...w, status: stageStatus, updatedAt: nowStr };
            }
            return w;
          });
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Submitted Formal Acceptance: ${data.acceptanceRef}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Acceptance documentation logged for ${data.projectName}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateAcceptance = (id: string, updates: Partial<AcceptanceRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setAcceptances((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          targetProject = a.projectId;
          return { ...a, ...updates, updatedAt: nowStr };
        }
        return a;
      })
    );

    if (targetProject) {
      const newAct: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: targetProject,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Updated Acceptance Record (${id})`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: updates.status ? `Acceptance status updated to ${updates.status}` : 'Modifications saved.',
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  // ==========================================
  // PHASE 2: CPG METHODS (STAGE 04A)
  // ==========================================
  const getCpg = (id: string) => cpgs.find((c) => c.id === id || c.cpgRef === id);
  const getCpgByProjectId = (projectId: string) => cpgs.find((c) => c.projectId === projectId);

  const createCpg = (data: Omit<CpgRecord, 'id' | 'createdAt' | 'updatedAt'>): CpgRecord => {
    const newId = `CPG-2024-${String(cpgs.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: CpgRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setCpgs((prev) => [newRecord, ...prev]);

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Lodged CPG Guarantee: ${data.cpgRef}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Performance Guarantee of ${data.cpgAmount} recorded for ${data.projectName}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateCpg = (id: string, updates: Partial<CpgRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setCpgs((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          targetProject = c.projectId;
          return { ...c, ...updates, updatedAt: nowStr };
        }
        return c;
      })
    );

    if (targetProject) {
      const newAct: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: targetProject,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Updated CPG Record (${id})`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: updates.status ? `CPG status changed to ${updates.status}` : 'CPG record modified.',
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  // ==========================================
  // PHASE 2: AGREEMENT METHODS (STAGE 04B)
  // ==========================================
  const getAgreement = (id: string) => agreements.find((a) => a.id === id || a.agreementRef === id);
  const getAgreementByProjectId = (projectId: string) => agreements.find((a) => a.projectId === projectId);

  const createAgreement = (data: Omit<AgreementRecord, 'id' | 'createdAt' | 'updatedAt'>): AgreementRecord => {
    const newId = `AGR-2024-${String(agreements.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: AgreementRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setAgreements((prev) => [newRecord, ...prev]);

    // Check if CPG also valid -> update stage 04
    const existingCpg = cpgs.find((c) => c.projectId === data.projectId);
    const stage04Complete = existingCpg?.status === 'Valid' && data.status === 'Executed';

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const updatedWorkflow = p.workflow.map((w) => {
            if (w.stageId === '04') {
              const stageStatus: WorkflowStageStatus = stage04Complete ? 'Completed' : 'In Progress';
              return {
                ...w,
                status: stageStatus,
                updatedAt: nowStr,
              };
            }
            return w;
          });
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Executed Contract Agreement: ${data.agreementRef}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Formal Contract Agreement logged for ${data.projectName}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateAgreement = (id: string, updates: Partial<AgreementRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setAgreements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          targetProject = a.projectId;
          return { ...a, ...updates, updatedAt: nowStr };
        }
        return a;
      })
    );

    if (targetProject) {
      const newAct: Activity = {
        id: `HIST-${Date.now()}`,
        projectId: targetProject,
        user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
        action: `Updated Contract Agreement (${id})`,
        timestamp: 'Just now',
        environment: 'DEMO',
        details: updates.status ? `Agreement status updated to ${updates.status}` : 'Agreement details saved.',
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  // ==========================================
  // RELATIONAL STAGE A PROGRESS CALCULATOR
  // ==========================================
  const getStageAProgress = (projectId: string): StageAProgress => {
    const tender = tenders.find((t) => t.projectId === projectId);
    const loi = loiLoas.find((l) => l.projectId === projectId);
    const acceptance = acceptances.find((a) => a.projectId === projectId);
    const cpg = cpgs.find((c) => c.projectId === projectId);
    const agreement = agreements.find((a) => a.projectId === projectId);

    const stages = [
      {
        stageId: '01',
        name: '01 Tender',
        status: tender
          ? tender.status === 'Awarded'
            ? ('Completed' as const)
            : ('In Progress' as const)
          : ('Not Started' as const),
        recordRef: tender?.tenderNumber,
        hasRecord: !!tender,
      },
      {
        stageId: '02',
        name: '02 LOI / LOA',
        status: loi
          ? loi.status === 'Accepted'
            ? ('Completed' as const)
            : ('In Progress' as const)
          : ('Not Started' as const),
        recordRef: loi?.loiNumber,
        hasRecord: !!loi,
      },
      {
        stageId: '03',
        name: '03 Acceptance',
        status: acceptance
          ? acceptance.status === 'Accepted'
            ? ('Completed' as const)
            : ('In Progress' as const)
          : ('Not Started' as const),
        recordRef: acceptance?.acceptanceRef,
        hasRecord: !!acceptance,
      },
      {
        stageId: '04',
        name: '04 CPG + Agreement',
        status:
          cpg?.status === 'Valid' && agreement?.status === 'Executed'
            ? ('Completed' as const)
            : cpg || agreement
            ? ('In Progress' as const)
            : ('Not Started' as const),
        recordRef:
          cpg && agreement
            ? `${cpg.cpgRef} / ${agreement.agreementRef}`
            : cpg?.cpgRef || agreement?.agreementRef,
        hasRecord: !!(cpg || agreement),
      },
    ];

    const completedCount = stages.filter((s) => s.status === 'Completed').length;
    const totalCount = stages.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    return { completedCount, totalCount, percentage, stages };
  };

  // ==========================================
  // PHASE 3: HELPER UTILITIES
  // ==========================================
  function parseRevisionNumber(revStr?: string): number {
    if (!revStr) return 0;
    const match = revStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // ==========================================
  // PHASE 3: VENDOR METHODS
  // ==========================================
  const getVendor = (id: string) => vendors.find((v) => v.id === id || v.code === id);

  const createVendor = (data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Vendor => {
    const newId = `VND-${String(vendors.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];
    const newRecord: Vendor = { ...data, id: newId, createdAt: nowStr, updatedAt: nowStr };
    setVendors((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: nowStr } : v)));
  };

  // ==========================================
  // PHASE 3: BOQ METHODS
  // ==========================================
  const getBoqItem = (id: string) => boqItems.find((b) => b.id === id);
  const getBoqItemsByProjectId = (projectId: string) => boqItems.filter((b) => b.projectId === projectId);

  // Clarification 2: PO quantity balance must aggregate quantities across ALL relevant active/non-cancelled POs
  // Clarification 6: Do not count cancelled records
  const getRemainingBoqQuantity = (boqItemId: string, excludePoId?: string): number => {
    const item = boqItems.find((b) => b.id === boqItemId);
    return calculateRemainingBoqQuantity(item, pos, excludePoId);
  };

  const createBoqItem = (data: Omit<BoqItem, 'id' | 'createdAt' | 'updatedAt' | 'amount'>): BoqItem => {
    const newId = `BOQ-2024-${String(boqItems.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];
    const deterministicAmount = Math.round(data.quantity * data.rate);
    const newRecord: BoqItem = {
      ...data,
      id: newId,
      amount: deterministicAmount,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setBoqItems((prev) => [newRecord, ...prev]);

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Added BOQ Item: ${data.itemNumber} - ${data.description.substring(0, 30)}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `BOQ line item created for ${data.projectName}. Qty: ${data.quantity} ${data.unit} @ ₹${data.rate.toLocaleString('en-IN')}`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateBoqItem = (id: string, updates: Partial<BoqItem>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setBoqItems((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const qty = updates.quantity !== undefined ? updates.quantity : b.quantity;
          const rate = updates.rate !== undefined ? updates.rate : b.rate;
          const amount = Math.round(qty * rate);
          return { ...b, ...updates, quantity: qty, rate, amount, updatedAt: nowStr };
        }
        return b;
      })
    );
  };

  // ==========================================
  // PHASE 3: GTP METHODS (STAGE 05)
  // ==========================================
  const getGtp = (id: string) => gtps.find((g) => g.id === id || g.gtpNumber === id);
  const getGtpsByProjectId = (projectId: string) => gtps.filter((g) => g.projectId === projectId);

  // Clarification 4: GTP revision status must be determined from the CURRENT/LATEST revision
  const getLatestGtpForBoqItem = (boqItemId: string): GtpRecord | undefined => {
    return determineLatestGtpForBoqItem(boqItemId, gtps);
  };

  const createGtp = (data: Omit<GtpRecord, 'id' | 'createdAt' | 'updatedAt'>): GtpRecord => {
    const newId = `GTP-2024-${String(gtps.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];
    const newRecord: GtpRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    const updatedGtps = [newRecord, ...gtps];
    setGtps(updatedGtps);

    // Sync Project Workflow Stage 05 based on latest revision of each BOQ item
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const projectGtps = updatedGtps.filter((g) => g.projectId === data.projectId);
          const pBoq = boqItems.filter((b) => b.projectId === data.projectId);
          let stageStatus: WorkflowStageStatus = 'In Progress';
          if (pBoq.length > 0) {
            const allBoqApproved = pBoq.every((b) => {
              const latest = [...projectGtps]
                .filter((g) => g.boqItemId === b.id)
                .sort((a, c) => parseRevisionNumber(c.revision) - parseRevisionNumber(a.revision))[0];
              return latest && latest.status === 'Approved';
            });
            if (allBoqApproved) stageStatus = 'Completed';
          } else if (data.status === 'Approved') {
            stageStatus = 'Completed';
          }
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '05' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Submitted GTP: ${data.gtpNumber} (${data.revision})`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Guaranteed Technical Particulars for ${data.materialItem} submitted with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateGtp = (id: string, updates: Partial<GtpRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';
    let nextGtps: GtpRecord[] = [];

    setGtps((prev) => {
      nextGtps = prev.map((g) => {
        if (g.id === id) {
          targetProject = g.projectId;
          return { ...g, ...updates, updatedAt: nowStr };
        }
        return g;
      });
      return nextGtps;
    });

    if (targetProject) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const projectGtps = nextGtps.filter((g) => g.projectId === targetProject);
            const pBoq = boqItems.filter((b) => b.projectId === targetProject);
            let stageStatus: WorkflowStageStatus = 'In Progress';
            if (pBoq.length > 0) {
              const allBoqApproved = pBoq.every((b) => {
                const latest = [...projectGtps]
                  .filter((g) => g.boqItemId === b.id)
                  .sort((a, c) => parseRevisionNumber(c.revision) - parseRevisionNumber(a.revision))[0];
                return latest && latest.status === 'Approved';
              });
              if (allBoqApproved) stageStatus = 'Completed';
            }
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '05' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 3: PO METHODS (STAGE 06)
  // ==========================================
  const getPo = (id: string) => pos.find((p) => p.id === id || p.poNumber === id);
  const getPosByProjectId = (projectId: string) => pos.filter((p) => p.projectId === projectId);

  const createPo = (data: Omit<PoRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>): PoRecord => {
    // Clarification 1, 2, 5 & 6: Vendor required, Multi-PO over-order prevention
    validatePoCreation(data, (bId) => getRemainingBoqQuantity(bId));

    const newId = `PO-2024-${String(pos.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const processedItems = data.items.map((line, idx) => ({
      ...line,
      id: line.id || `POL-${String(idx + 1).padStart(3, '0')}`,
      poId: newId,
      amount: Math.round(line.quantity * line.rate),
      balanceQuantity: getRemainingBoqQuantity(line.boqItemId) - line.quantity,
    }));

    const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

    const newRecord: PoRecord = {
      ...data,
      id: newId,
      items: processedItems,
      totalAmount,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setPos((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 06
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus = data.status === 'Closed' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '06' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Issued Purchase Order: ${data.poNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `PO for ₹${totalAmount.toLocaleString('en-IN')} issued to ${data.vendorName}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updatePo = (id: string, updates: Partial<PoRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setPos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          targetProject = p.projectId;
          const items = updates.items ? updates.items : p.items;
          const totalAmount = updates.items
            ? items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
            : updates.totalAmount !== undefined
            ? updates.totalAmount
            : p.totalAmount;
          return { ...p, ...updates, items, totalAmount, updatedAt: nowStr };
        }
        return p;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus = updates.status === 'Closed' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '06' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 3: INSPECTION CALL METHODS (STAGE 07)
  // ==========================================
  const getInspectionCall = (id: string) =>
    inspectionCalls.find((c) => c.id === id || c.inspectionCallNumber === id);
  const getInspectionCallsByProjectId = (projectId: string) =>
    inspectionCalls.filter((c) => c.projectId === projectId);

  // Clarification 3: Aggregate ALL relevant previous inspection calls for this PO & line item
  // Clarification 6: Cancelled calls do NOT count towards active balance
  const getRemainingCallableQuantity = (poId: string, boqItemId: string, excludeCallId?: string): number => {
    const po = pos.find((p) => p.id === poId);
    return calculateRemainingCallableQuantity(po, boqItemId, inspectionCalls, excludeCallId);
  };

  const createInspectionCall = (
    data: Omit<InspectionCallRecord, 'id' | 'createdAt' | 'updatedAt' | 'previouslyCalledQuantity' | 'remainingQuantity'>
  ): InspectionCallRecord => {
    const po = pos.find((p) => p.id === data.poId);
    validateInspectionCallCreation(data, !!po, (pId, bId) => getRemainingCallableQuantity(pId, bId));

    const remaining = getRemainingCallableQuantity(data.poId, data.boqItemId);
    const relevantCalls = inspectionCalls.filter(
      (c) => c.poId === data.poId && c.boqItemId === data.boqItemId && c.status !== 'Cancelled'
    );
    const previouslyCalled = relevantCalls.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
    const remainingAfter = Math.max(0, remaining - data.quantity);

    const newId = `INC-2024-${String(inspectionCalls.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: InspectionCallRecord = {
      ...data,
      id: newId,
      previouslyCalledQuantity: previouslyCalled,
      remainingQuantity: remainingAfter,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setInspectionCalls((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 07
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus = data.status === 'Completed' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '07' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Raised Inspection Call: ${data.inspectionCallNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Inspection Call raised for ${data.material} (${data.quantity} ${data.unit}) against ${data.poNumber}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateInspectionCall = (id: string, updates: Partial<InspectionCallRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setInspectionCalls((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          targetProject = c.projectId;
          return { ...c, ...updates, updatedAt: nowStr };
        }
        return c;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus = updates.status === 'Completed' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '07' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 3: INSPECTION ORDER METHODS (STAGE 08)
  // ==========================================
  const getInspectionOrder = (id: string) =>
    inspectionOrders.find((o) => o.id === id || o.inspectionOrderNumber === id);
  const getInspectionOrdersByProjectId = (projectId: string) =>
    inspectionOrders.filter((o) => o.projectId === projectId);

  const createInspectionOrder = (
    data: Omit<InspectionOrderRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): InspectionOrderRecord => {
    // Clarification 5: Orphan Inspection Order prevention
    const callExists = inspectionCalls.some((c) => c.id === data.inspectionCallId);
    validateInspectionOrderCreation(data, callExists);

    const newId = `INO-2024-${String(inspectionOrders.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: InspectionOrderRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setInspectionOrders((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 08
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus = data.status === 'Completed' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '08' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Issued Inspection Order: ${data.inspectionOrderNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Inspection Order issued to ${data.assignedAuthority} for ${data.material}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateInspectionOrder = (id: string, updates: Partial<InspectionOrderRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setInspectionOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          targetProject = o.projectId;
          return { ...o, ...updates, updatedAt: nowStr };
        }
        return o;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus = updates.status === 'Completed' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '08' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 3: JIR METHODS (STAGE 09)
  // ==========================================
  const getJir = (id: string) => jirs.find((j) => j.id === id || j.jirNumber === id);
  const getJirsByProjectId = (projectId: string) => jirs.filter((j) => j.projectId === projectId);

  const createJir = (
    data: Omit<JirRecord, 'id' | 'createdAt' | 'updatedAt' | 'balanceQuantity'>
  ): JirRecord => {
    // Clarification 5: Orphan JIR prevention & Arithmetic boundary conditions
    const orderExists = inspectionOrders.some((o) => o.id === data.inspectionOrderId);
    const { balanceQuantity: balanceQty } = validateJirCreation(data, orderExists);

    const newId = `JIR-2024-${String(jirs.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: JirRecord = {
      ...data,
      id: newId,
      balanceQuantity: balanceQty,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setJirs((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 09
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus =
            data.status === 'Accepted' || data.status === 'Completed' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '09' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Recorded JIR: ${data.jirNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Joint Inspection Report recorded for ${data.material} with status ${data.status}. Accepted: ${data.acceptedQuantity} / Rejected: ${data.rejectedQuantity}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateJir = (id: string, updates: Partial<JirRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setJirs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          targetProject = j.projectId;
          const offered = updates.offeredQuantity !== undefined ? updates.offeredQuantity : j.offeredQuantity;
          const accepted = updates.acceptedQuantity !== undefined ? updates.acceptedQuantity : j.acceptedQuantity;
          const balanceQuantity = offered - accepted;
          return { ...j, ...updates, balanceQuantity, updatedAt: nowStr };
        }
        return j;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus =
              updates.status === 'Accepted' || updates.status === 'Completed' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '09' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // RELATIONAL STAGE B PROGRESS CALCULATOR
  // ==========================================
  const getStageBProgress = (projectId: string): StageBProgress => {
    const projectBoq = boqItems.filter((b) => b.projectId === projectId);
    const projectGtps = gtps.filter((g) => g.projectId === projectId);
    const projectPos = pos.filter((p) => p.projectId === projectId);
    const projectCalls = inspectionCalls.filter((c) => c.projectId === projectId);
    const projectOrders = inspectionOrders.filter((o) => o.projectId === projectId);
    const projectJirs = jirs.filter((j) => j.projectId === projectId);

    // Stage 05 status based on latest GTP revisions
    let gtpStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    if (projectGtps.length > 0) {
      if (projectBoq.length > 0) {
        const allBoqApproved = projectBoq.every((b) => {
          const latest = getLatestGtpForBoqItem(b.id);
          return latest && latest.status === 'Approved';
        });
        gtpStageStatus = allBoqApproved ? 'Completed' : 'In Progress';
      } else {
        const hasApproved = projectGtps.some((g) => g.status === 'Approved');
        gtpStageStatus = hasApproved ? 'Completed' : 'In Progress';
      }
    }

    // Stage 06 status (PO)
    let poStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activePos = projectPos.filter((p) => p.status !== 'Cancelled');
    if (activePos.length > 0) {
      const allClosed = activePos.every((p) => p.status === 'Closed');
      poStageStatus = allClosed ? 'Completed' : 'In Progress';
    }

    // Stage 07 status (Inspection Call)
    let callStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activeCalls = projectCalls.filter((c) => c.status !== 'Cancelled');
    if (activeCalls.length > 0) {
      const allCompleted = activeCalls.every((c) => c.status === 'Completed');
      callStageStatus = allCompleted ? 'Completed' : 'In Progress';
    }

    // Stage 08 status (Inspection Order)
    let orderStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activeOrders = projectOrders.filter((o) => o.status !== 'Cancelled');
    if (activeOrders.length > 0) {
      const allCompleted = activeOrders.every((o) => o.status === 'Completed');
      orderStageStatus = allCompleted ? 'Completed' : 'In Progress';
    }

    // Stage 09 status (JIR)
    let jirStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    if (projectJirs.length > 0) {
      const hasAccepted = projectJirs.some((j) => j.status === 'Accepted' || j.status === 'Completed');
      jirStageStatus = hasAccepted ? 'Completed' : 'In Progress';
    }

    const stages = [
      {
        stageId: '05',
        name: 'GTP Approval',
        status: gtpStageStatus,
        recordRef: projectGtps.length > 0 ? `${projectGtps.length} GTP(s)` : undefined,
        hasRecord: projectGtps.length > 0,
      },
      {
        stageId: '06',
        name: 'Purchase Order',
        status: poStageStatus,
        recordRef: activePos.length > 0 ? activePos[0].poNumber : undefined,
        hasRecord: activePos.length > 0,
      },
      {
        stageId: '07',
        name: 'Inspection Call',
        status: callStageStatus,
        recordRef: activeCalls.length > 0 ? activeCalls[0].inspectionCallNumber : undefined,
        hasRecord: activeCalls.length > 0,
      },
      {
        stageId: '08',
        name: 'Inspection Order',
        status: orderStageStatus,
        recordRef: activeOrders.length > 0 ? activeOrders[0].inspectionOrderNumber : undefined,
        hasRecord: activeOrders.length > 0,
      },
      {
        stageId: '09',
        name: 'Joint Inspection Report',
        status: jirStageStatus,
        recordRef: projectJirs.length > 0 ? projectJirs[0].jirNumber : undefined,
        hasRecord: projectJirs.length > 0,
      },
    ];

    const completedCount = stages.filter((s) => s.status === 'Completed').length;
    const totalCount = stages.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const boqTotalValue = projectBoq.reduce((sum, b) => sum + b.amount, 0);

    return {
      completedCount,
      totalCount,
      percentage,
      stages,
      boqItemCount: projectBoq.length,
      boqTotalValue,
    };
  };

  // ==========================================
  // PHASE 4: DI METHODS (STAGE 10)
  // ==========================================
  const getRemainingDispatchQuantity = (jirId: string, excludeDiId?: string): number => {
    const jir = jirs.find((j) => j.id === jirId);
    return calculateDispatchBalance(jir, dis, excludeDiId);
  };

  const getDi = (id: string) => dis.find((d) => d.id === id || d.diNumber === id);
  const getDisByProjectId = (projectId: string) => dis.filter((d) => d.projectId === projectId);

  const createDi = (data: Omit<DiRecord, 'id' | 'createdAt' | 'updatedAt'>): DiRecord => {
    const jir = jirs.find((j) => j.id === data.jirId);
    validateDiCreation(data, jir, dis);

    const newId = `DI-2024-${String(dis.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: DiRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setDis((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 10
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus =
            data.status === 'Dispatched' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '10' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Issued Dispatch Instruction: ${data.diNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `DI issued for ${data.materialDescription} (${data.quantity} ${data.unit}) to ${data.destination} with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateDi = (id: string, updates: Partial<DiRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setDis((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          targetProject = d.projectId;
          return { ...d, ...updates, updatedAt: nowStr };
        }
        return d;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus =
              updates.status === 'Dispatched' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '10' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 4: MICC METHODS (STAGE 11)
  // ==========================================
  const getRemainingMiccQuantity = (diId: string, excludeMiccId?: string): number => {
    const di = dis.find((d) => d.id === diId);
    return calculateMiccBalance(di, miccs, excludeMiccId);
  };

  const getMicc = (id: string) => miccs.find((m) => m.id === id || m.miccNumber === id);
  const getMiccsByProjectId = (projectId: string) => miccs.filter((m) => m.projectId === projectId);

  const createMicc = (data: Omit<MiccRecord, 'id' | 'createdAt' | 'updatedAt'>): MiccRecord => {
    const di = dis.find((d) => d.id === data.diId);
    validateMiccCreation(data, di, miccs);

    const newId = `MICC-2024-${String(miccs.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: MiccRecord = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setMiccs((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 11
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus =
            data.status === 'Verified' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '11' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Recorded MICC: ${data.miccNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `MICC certificate recorded for ${data.materialDescription} (${data.quantity} ${data.unit}) with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateMicc = (id: string, updates: Partial<MiccRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setMiccs((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          targetProject = m.projectId;
          return { ...m, ...updates, updatedAt: nowStr };
        }
        return m;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus =
              updates.status === 'Verified' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '11' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 4: PROGRESSIVE BILL METHODS (STAGE 12)
  // ==========================================
  const getBillableQuantityForMicc = (miccId: string, excludeBillId?: string): number => {
    const micc = miccs.find((m) => m.id === miccId);
    return calculateBillableQuantity(micc, progressiveBills, excludeBillId);
  };

  const getProjectBillingSummary = (projectId: string, excludeBillId?: string) => {
    const project = projects.find((p) => p.id === projectId || p.code === projectId);
    return calculateProjectBillingSummary(project, progressiveBills, excludeBillId);
  };

  const getProgressiveBill = (id: string) =>
    progressiveBills.find((b) => b.id === id || b.billNumber === id);
  const getProgressiveBillsByProjectId = (projectId: string) =>
    progressiveBills.filter((b) => b.projectId === projectId);

  const createProgressiveBill = (
    data: Omit<
      ProgressiveBillRecord,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'previousApprovedAmount'
      | 'currentClaimedAmount'
      | 'currentApprovedAmount'
      | 'cumulativeApprovedAmount'
      | 'contractValue'
      | 'remainingContractBalance'
    > & {
      previousApprovedAmount?: number;
      currentClaimedAmount?: number;
      currentApprovedAmount?: number;
      cumulativeApprovedAmount?: number;
      contractValue?: number;
      remainingContractBalance?: number;
    }
  ): ProgressiveBillRecord => {
    const project = projects.find((p) => p.id === data.projectId || p.code === data.projectId);
    validateProgressiveBillCreation(data, project, miccs, progressiveBills);

    const summary = calculateProjectBillingSummary(project, progressiveBills);
    const newId = `PB-2024-${String(progressiveBills.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const processedItems: ProgressiveBillLineItem[] = (data.lineItems || []).map((line, idx) => {
      const lineClaimed =
        line.claimedAmount !== undefined
          ? line.claimedAmount
          : Math.round((Number(line.claimedQuantity) || 0) * (Number(line.rate) || 0));
      const lineApproved =
        line.approvedAmount !== undefined
          ? line.approvedAmount
          : (data.status === 'Approved' || data.status === 'Partially Approved')
          ? lineClaimed
          : 0;
      return {
        ...line,
        id: line.id || `PBL-${String(idx + 1).padStart(3, '0')}`,
        billId: newId,
        claimedAmount: lineClaimed,
        approvedAmount: lineApproved,
        approvedQuantity: line.approvedQuantity !== undefined ? line.approvedQuantity : line.claimedQuantity,
      };
    });

    const claimedTotal =
      data.currentClaimedAmount !== undefined
        ? data.currentClaimedAmount
        : processedItems.reduce((sum, item) => sum + item.claimedAmount, 0);

    const approvedTotal =
      data.currentApprovedAmount !== undefined
        ? data.currentApprovedAmount
        : (data.status === 'Approved' || data.status === 'Partially Approved')
        ? processedItems.reduce((sum, item) => sum + item.approvedAmount, 0)
        : 0;

    const cumulativeApproved = summary.cumulativeApprovedAmount + approvedTotal;
    const remainingContractBalance = Math.max(0, summary.contractValue - cumulativeApproved);

    const newRecord: ProgressiveBillRecord = {
      ...data,
      id: newId,
      lineItems: processedItems,
      previousApprovedAmount: summary.cumulativeApprovedAmount,
      currentClaimedAmount: claimedTotal,
      currentApprovedAmount: approvedTotal,
      cumulativeApprovedAmount: cumulativeApproved,
      contractValue: summary.contractValue,
      remainingContractBalance,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setProgressiveBills((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 12
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus =
            data.status === 'Approved' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '12' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Submitted Progressive Bill: ${data.billNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Invoice for Claimed: ₹${claimedTotal.toLocaleString('en-IN')} submitted with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateProgressiveBill = (id: string, updates: Partial<ProgressiveBillRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setProgressiveBills((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          targetProject = b.projectId;
          const lineItems = updates.lineItems ? updates.lineItems : b.lineItems;
          const claimedTotal =
            updates.currentClaimedAmount !== undefined
              ? updates.currentClaimedAmount
              : updates.lineItems
              ? lineItems.reduce((sum: number, i: ProgressiveBillLineItem) => sum + i.claimedAmount, 0)
              : b.currentClaimedAmount;

          let approvedTotal =
            updates.currentApprovedAmount !== undefined ? updates.currentApprovedAmount : b.currentApprovedAmount;
          if (updates.status === 'Approved' && approvedTotal === 0) {
            approvedTotal = claimedTotal;
          }

          return {
            ...b,
            ...updates,
            lineItems,
            currentClaimedAmount: claimedTotal,
            currentApprovedAmount: approvedTotal,
            updatedAt: nowStr,
          };
        }
        return b;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus =
              updates.status === 'Approved' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '12' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // PHASE 4: FINAL BILL METHODS (STAGE 13)
  // ==========================================
  const getFinalBill = (id: string) => finalBills.find((f) => f.id === id || f.finalBillNumber === id);
  const getFinalBillByProjectId = (projectId: string) =>
    finalBills.find((f) => f.projectId === projectId && f.status !== 'Rejected');

  const createFinalBill = (
    data: Omit<
      FinalBillRecord,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'contractValue'
      | 'totalApprovedProgressiveBills'
      | 'finalBillAmount'
    >
  ): FinalBillRecord => {
    const project = projects.find((p) => p.id === data.projectId || p.code === data.projectId);
    const { contractValue, totalApprovedProgressiveBills, finalBillAmount } = validateFinalBillCreation(
      data,
      project,
      finalBills,
      progressiveBills
    );

    const newId = `FB-2024-${String(finalBills.length + 1).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newRecord: FinalBillRecord = {
      ...data,
      id: newId,
      contractValue,
      totalApprovedProgressiveBills,
      finalBillAmount,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setFinalBills((prev) => [newRecord, ...prev]);

    // Sync Project Workflow Stage 13
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === data.projectId) {
          const stageStatus: WorkflowStageStatus =
            data.status === 'Approved' ? 'Completed' : 'In Progress';
          const updatedWorkflow = p.workflow.map((w) =>
            w.stageId === '13' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
          );
          return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
        }
        return p;
      })
    );

    const newAct: Activity = {
      id: `HIST-${Date.now()}`,
      projectId: data.projectId,
      user: `${DEMO_USER_PROFILE.name} (${DEMO_USER_PROFILE.role})`,
      action: `Lodged Final Bill: ${data.finalBillNumber}`,
      timestamp: 'Just now',
      environment: 'DEMO',
      details: `Final reconciliation bill for ₹${finalBillAmount.toLocaleString('en-IN')} submitted with status ${data.status}.`,
    };
    setActivities((prev) => [newAct, ...prev]);

    return newRecord;
  };

  const updateFinalBill = (id: string, updates: Partial<FinalBillRecord>) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let targetProject = '';

    setFinalBills((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          targetProject = f.projectId;
          const adj = updates.adjustments !== undefined ? updates.adjustments : f.adjustments;
          const finalBillAmount =
            updates.finalBillAmount !== undefined
              ? updates.finalBillAmount
              : Math.max(0, f.contractValue + adj - f.totalApprovedProgressiveBills);

          return {
            ...f,
            ...updates,
            adjustments: adj,
            finalBillAmount,
            updatedAt: nowStr,
          };
        }
        return f;
      })
    );

    if (targetProject && updates.status) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProject) {
            const stageStatus: WorkflowStageStatus =
              updates.status === 'Approved' ? 'Completed' : 'In Progress';
            const updatedWorkflow = p.workflow.map((w) =>
              w.stageId === '13' ? { ...w, status: stageStatus, updatedAt: nowStr } : w
            );
            return { ...p, workflow: updatedWorkflow, updatedAt: nowStr };
          }
          return p;
        })
      );
    }
  };

  // ==========================================
  // RELATIONAL STAGE C PROGRESS CALCULATOR
  // ==========================================
  const getStageCProgress = (projectId: string): StageCProgress => {
    const project = projects.find((p) => p.id === projectId || p.code === projectId);
    const projectDis = dis.filter((d) => d.projectId === projectId);
    const projectMiccs = miccs.filter((m) => m.projectId === projectId);
    const projectBills = progressiveBills.filter((b) => b.projectId === projectId);
    const projectFinal = finalBills.find(
      (f) => f.projectId === projectId && f.status !== 'Rejected'
    );

    // Stage 10 (DI)
    let diStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activeDis = projectDis.filter((d) => d.status !== 'Cancelled');
    if (activeDis.length > 0) {
      const hasCompleted = activeDis.some((d) => d.status === 'Dispatched');
      diStageStatus = hasCompleted ? 'Completed' : 'In Progress';
    }

    // Stage 11 (MICC)
    let miccStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activeMiccs = projectMiccs.filter((m) => m.status !== 'Rejected');
    if (activeMiccs.length > 0) {
      const hasCompleted = activeMiccs.some((m) => m.status === 'Verified');
      miccStageStatus = hasCompleted ? 'Completed' : 'In Progress';
    }

    // Stage 12 (Progressive Bill)
    let billStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    const activeBills = projectBills.filter((b) => b.status !== 'Rejected');
    const billingSummary = calculateProjectBillingSummary(project, projectBills);
    if (activeBills.length > 0) {
      if (billingSummary.remainingContractBalance === 0 || activeBills.some((b) => b.status === 'Approved')) {
        billStageStatus = 'Completed';
      } else {
        billStageStatus = 'In Progress';
      }
    }

    // Stage 13 (Final Bill)
    let finalStageStatus: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
    if (projectFinal) {
      if (projectFinal.status === 'Approved') {
        finalStageStatus = 'Completed';
      } else {
        finalStageStatus = 'In Progress';
      }
    }

    const stages = [
      {
        stageId: '10',
        name: 'Dispatch Instruction (DI)',
        status: diStageStatus,
        recordRef: activeDis.length > 0 ? activeDis[0].diNumber : undefined,
        hasRecord: activeDis.length > 0,
      },
      {
        stageId: '11',
        name: 'Material Inward & Clearance (MICC)',
        status: miccStageStatus,
        recordRef: activeMiccs.length > 0 ? activeMiccs[0].miccNumber : undefined,
        hasRecord: activeMiccs.length > 0,
      },
      {
        stageId: '12',
        name: 'Progressive Billing',
        status: billStageStatus,
        recordRef: activeBills.length > 0 ? `${activeBills.length} Bill(s)` : undefined,
        hasRecord: activeBills.length > 0,
      },
      {
        stageId: '13',
        name: 'Final Bill Reconciliation',
        status: finalStageStatus,
        recordRef: projectFinal ? projectFinal.finalBillNumber : undefined,
        hasRecord: !!projectFinal,
      },
    ];

    const completedCount = stages.filter((s) => s.status === 'Completed').length;
    const totalCount = stages.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    return {
      completedCount,
      totalCount,
      percentage,
      stages,
      activeDiCount: activeDis.length,
      verifiedMiccCount: activeMiccs.filter((m) => m.status === 'Verified').length,
      cumulativeApprovedBilling: billingSummary.cumulativeApprovedAmount,
      remainingContractBalance: billingSummary.remainingContractBalance,
      finalBillStatus: projectFinal?.status,
    };
  };

  // ==========================================
  // PHASE 5: COMPLETE PROJECT CONTROL HELPERS
  // ==========================================

  const getWorkflowDataForProject = (projectId: string) => {
    return extractProjectWorkflowRecords(
      projectId,
      projects,
      tenders,
      loiLoas,
      acceptances,
      cpgs,
      agreements,
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
      vendors
    );
  };

  const getProjectControlSummary = (projectId: string): ProjectControlSummary | undefined => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return undefined;
    return getControlSummaryFromEngine(data.project, data);
  };

  const getProjectStageStatuses = (projectId: string): ProjectStageStatusInfo[] => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return [];
    return calculateStageStatusesFromEngine(data.project, data);
  };

  const getProjectControlPendingActions = (projectId: string): ProjectControlPendingAction[] => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return [];
    return calculatePendingActionsFromEngine(data.project, data);
  };

  const getProjectExceptions = (projectId: string): ProjectException[] => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return [];
    return calculateProjectExceptionsFromEngine(data.project, data);
  };

  const getProjectControlActivityTimeline = (projectId: string): ProjectActivityEvent[] => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return [];
    return buildProjectActivityTimelineFromEngine(data.project, data);
  };

  const searchProjectRecords = (projectId: string, query: string): ProjectSearchResult[] => {
    const data = getWorkflowDataForProject(projectId);
    if (!data) return [];
    return searchProjectRecordsFromEngine(data.project, data, query);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        pendingActions,
        activities,
        notifications,
        unreadNotificationCount,
        isSearchOpen,
        setIsSearchOpen,
        createProject,
        getProject,
        updateProjectStatus,
        markNotificationAsRead,
        stats,

        // Phase 2
        tenders,
        loiLoas,
        acceptances,
        cpgs,
        agreements,

        createTender,
        updateTender,
        getTender,
        getTenderByProjectId,

        createLoiLoa,
        updateLoiLoa,
        getLoiLoa,
        getLoiLoaByProjectId,

        createAcceptance,
        updateAcceptance,
        getAcceptance,
        getAcceptanceByProjectId,

        createCpg,
        updateCpg,
        getCpg,
        getCpgByProjectId,

        createAgreement,
        updateAgreement,
        getAgreement,
        getAgreementByProjectId,

        getStageAProgress,

        // Phase 3
        vendors,
        createVendor,
        updateVendor,
        getVendor,

        boqItems,
        createBoqItem,
        updateBoqItem,
        getBoqItem,
        getBoqItemsByProjectId,
        getRemainingBoqQuantity,

        gtps,
        createGtp,
        updateGtp,
        getGtp,
        getGtpsByProjectId,
        getLatestGtpForBoqItem,

        pos,
        createPo,
        updatePo,
        getPo,
        getPosByProjectId,

        inspectionCalls,
        createInspectionCall,
        updateInspectionCall,
        getInspectionCall,
        getInspectionCallsByProjectId,
        getRemainingCallableQuantity,

        inspectionOrders,
        createInspectionOrder,
        updateInspectionOrder,
        getInspectionOrder,
        getInspectionOrdersByProjectId,

        jirs,
        createJir,
        updateJir,
        getJir,
        getJirsByProjectId,

        getStageBProgress,

        // Phase 4
        dis,
        createDi,
        updateDi,
        getDi,
        getDisByProjectId,
        getRemainingDispatchQuantity,

        miccs,
        createMicc,
        updateMicc,
        getMicc,
        getMiccsByProjectId,
        getRemainingMiccQuantity,

        progressiveBills,
        createProgressiveBill,
        updateProgressiveBill,
        getProgressiveBill,
        getProgressiveBillsByProjectId,
        getBillableQuantityForMicc,
        getProjectBillingSummary,

        finalBills,
        createFinalBill,
        updateFinalBill,
        getFinalBill,
        getFinalBillByProjectId,

        getStageCProgress,

        // Phase 5: Project Control Center Helpers
        getProjectControlSummary,
        getProjectStageStatuses,
        getProjectControlPendingActions,
        getProjectExceptions,
        getProjectControlActivityTimeline,
        searchProjectRecords,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

