'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Project, PendingAction, Activity, NotificationItem, ProjectStatus } from '@/types';
import { INITIAL_PROJECTS, INITIAL_PENDING_ACTIONS, INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS } from './mock-data';
import { WORKFLOW_STAGES, DEMO_USER_PROFILE } from './constants';

interface ProjectContextType {
  projects: Project[];
  pendingActions: PendingAction[];
  activities: Activity[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY_PROJECTS = 'uk_admin_projects_phase1';
const STORAGE_KEY_ACTIVITIES = 'uk_admin_activities_phase1';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [pendingActions] = useState<PendingAction[]>(INITIAL_PENDING_ACTIONS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isLoadedRef = useRef(false);

  // Load from local storage asynchronously after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
        if (storedProjects) {
          setProjects(JSON.parse(storedProjects));
        }
        const storedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
        if (storedActivities) {
          setActivities(JSON.parse(storedActivities));
        }
      } catch {
        // Ignore localStorage read errors in SSR or restricted environments
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
    } catch {
      // Ignore localStorage write errors
    }
  }, [projects, activities]);

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

    // Default to Stage 01 Tender
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
