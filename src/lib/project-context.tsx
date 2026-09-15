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
} from './mock-data';
import { WORKFLOW_STAGES, DEMO_USER_PROFILE } from './constants';

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

  // Relational Progress
  getStageAProgress: (projectId: string) => StageAProgress;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY_PROJECTS = 'uk_admin_projects_phase1';
const STORAGE_KEY_ACTIVITIES = 'uk_admin_activities_phase1';
const STORAGE_KEY_TENDERS = 'uk_admin_tenders_phase2';
const STORAGE_KEY_LOI_LOAS = 'uk_admin_loiloas_phase2';
const STORAGE_KEY_ACCEPTANCES = 'uk_admin_acceptances_phase2';
const STORAGE_KEY_CPGS = 'uk_admin_cpgs_phase2';
const STORAGE_KEY_AGREEMENTS = 'uk_admin_agreements_phase2';

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
    } catch {
      // Ignore localStorage write errors
    }
  }, [projects, activities, tenders, loiLoas, acceptances, cpgs, agreements]);

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

