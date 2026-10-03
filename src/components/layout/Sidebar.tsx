'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  FileCheck,
  FileSignature,
  ShieldCheck,
  Cpu,
  ShoppingCart,
  BellRing,
  ClipboardCheck,
  FileBadge,
  Truck,
  Award,
  Receipt,
  CheckCheck,
  FileText,
  BarChart3,
  Settings,
  Lock,
  X,
  ListTree,
  UserCheck,
  Network,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { canEditStage, checkBasePermission } from '@/lib/permissions';
import { useActiveDelegation } from '@/hooks/useActiveDelegation';
import { useProjects } from '@/lib/project-context';
import { Circle, PlayCircle, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WORKFLOW_NAV_STAGES = [
  { id: '01', name: '01 Tender', icon: FileSpreadsheet, href: '/tenders', active: true },
  { id: '02', name: '02 LOI / LOA', icon: FileCheck, href: '/loi-loa', active: true },
  { id: '03', name: '03 Acceptance', icon: FileSignature, href: '/acceptance', active: true },
  { id: '04', name: '04 CPG + Agreement', icon: ShieldCheck, href: '/cpg-agreement', active: true },
  { id: '05', name: '05 GTP', icon: Cpu, href: '/gtp', active: true },
  { id: '06', name: '06 PO', icon: ShoppingCart, href: '/po', active: true },
  { id: '07', name: '07 Inspection Call', icon: BellRing, href: '/inspection-call', active: true },
  { id: '08', name: '08 Inspection Order', icon: ClipboardCheck, href: '/inspection-order', active: true },
  { id: '09', name: '09 JIR / Inspection Report', icon: FileBadge, href: '/jir', active: true },
  { id: '10', name: '10 DI / Dispatch Clearance', icon: Truck, href: '/di', active: true },
  { id: '11', name: '11 MICC', icon: Award, href: '/micc', active: true },
  { id: '12', name: '12 Progressive Bill', icon: Receipt, href: '/progressive-bill', active: true },
  { id: '13', name: '13 Final Bill', icon: CheckCheck, href: '/final-bill', active: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { coverages } = useActiveDelegation();
  const { getProject } = useProjects(); // ADDED for dynamic stages

  // Check if we are inside a specific project
  const projectIdMatch = pathname.match(/^\/projects\/([^\/]+)/);
  const activeProjectId = projectIdMatch ? projectIdMatch[1] : null;
  const activeProject = activeProjectId ? getProject(activeProjectId) : null;

  const isDashboardActive = pathname === '/';
  const isProjectsActive = pathname === '/projects' || (pathname.startsWith('/projects') && !activeProject);

  const baseStages = user ? WORKFLOW_NAV_STAGES.filter((s) => checkBasePermission(user.role, s.id)) : [];
  const delegatedStages = user
    ? WORKFLOW_NAV_STAGES.filter((s) => !checkBasePermission(user.role, s.id) && coverages.some(c => c.delegatedStageIds.includes(s.id)))
    : [];
  const viewOnlyStages = user ? WORKFLOW_NAV_STAGES.filter((s) => !checkBasePermission(user.role, s.id) && !coverages.some(c => c.delegatedStageIds.includes(s.id))) : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0A192F] text-slate-300 border-r border-[#152747] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#182C4E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-white/20 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/images/uk-group-logo.png"
                  alt="UK GROUP"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white font-editorial">
                  UK ENTERPRISE
                </h1>
                <p className="text-[11px] font-medium text-amber-400 tracking-wide uppercase">
                  Office Administration System
                </p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              v1.0-alpha
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {/* Active Modules (Phase 1) */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Active Modules
            </div>
            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isDashboardActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/projects"
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  isProjectsActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                }`}
              >
                <FolderKanban className="w-4 h-4 shrink-0" />
                <span>Projects</span>
              </Link>
              {canEditStage(user, 'BOQ') ? (
                <Link
                  href="/boq"
                  onClick={() => onClose()}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                    pathname.startsWith('/boq')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ListTree className="w-4 h-4 shrink-0" />
                    <span>BOQ Master</span>
                  </div>
                  {user && !checkBasePermission(user.role, 'BOQ') && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                      Delegated
                    </span>
                  )}
                </Link>
              ) : (
                <Link
                  href="/boq"
                  onClick={() => onClose()}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    pathname.startsWith('/boq')
                      ? 'bg-[#1e345b] text-blue-200 shadow-xs'
                      : 'text-slate-400 hover:bg-[#112444] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ListTree className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">BOQ Master</span>
                  </div>
                  <Lock className="w-3 h-3 text-slate-500 shrink-0 ml-1.5" />
                </Link>
              )}
            </nav>
          </div>

          {/* Project Workflow (Assigned Modules) */}
          <div className="pt-2 border-t border-[#152747]">
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 font-editorial">
                {activeProject ? `${activeProject.code} Stages` : 'Global Stages'}
              </span>
            </div>

            <nav className="space-y-0.5">
              {activeProject ? (
                // Dynamic Project Stages
                activeProject.projectStages?.map((stage) => {
                  const isStageActive = pathname === `/projects/${activeProject.id}/stage/${stage.stageDefId}`;
                  const IconComponent = stage.status === 'Completed' ? CheckCircle2 : stage.status === 'In Progress' ? PlayCircle : Circle;

                  return (
                    <Link
                      key={stage.id}
                      href={`/projects/${activeProject.id}/stage/${stage.stageDefId}`}
                      onClick={() => onClose()}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isStageActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isStageActive ? 'text-white' : stage.status === 'Completed' ? 'text-emerald-400' : stage.status === 'In Progress' ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className="truncate">{stage.name}</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                // Legacy Global Modules (to be removed in Phase 2/3)
                baseStages.map((stage) => {
                  const IconComponent = stage.icon;
                  const isStageActive = stage.active && (pathname === stage.href || pathname.startsWith(stage.href + '/'));

                  return (
                    <Link
                      key={stage.id}
                      href={stage.href}
                      onClick={() => onClose()}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isStageActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isStageActive ? 'text-white' : 'text-blue-400'}`} />
                        <span className="truncate">{stage.name}</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-1.5" title="Active Module" />
                    </Link>
                  );
                })
              )}
            </nav>
          </div>

          {/* Legacy static Delegated and View-Only modules removed. Will be ported to dynamic system. */}

          {/* System & Records */}
          <div className="pt-2 border-t border-[#152747]">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              System &amp; Records
            </div>
            <div className="space-y-0.5 opacity-65">
              <div
                title="Coming in future phases"
                className="flex items-center justify-between px-3 py-2 rounded-md text-slate-400 cursor-not-allowed hover:bg-[#0e213f]/40"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Documents</span>
                </div>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
              <Link
                href="/management/analytics"
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                  pathname.startsWith('/management/analytics')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Reports &amp; Analytics</span>
                </div>
              </Link>
              <Link
                href="/management/communications"
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                  pathname.startsWith('/management/communications')
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Network className="w-3.5 h-3.5 shrink-0" />
                  <span>Communications &amp; Integrations</span>
                </div>
              </Link>
              
              {user?.role === 'MASTER' && (
                <>
                  <Link
                    href="/management/activity"
                    onClick={() => onClose()}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === '/management/activity'
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-slate-400 hover:text-white hover:bg-[#0e213f]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Activity Monitor</span>
                  </Link>
                  <Link
                    href="/management/delegation"
                    onClick={() => onClose()}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === '/management/delegation'
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-slate-400 hover:text-white hover:bg-[#0e213f]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Delegation & Leaves</span>
                  </Link>
                </>
              )}

              <div
                title="Coming in future phases"
                className="flex items-center justify-between px-3 py-2 rounded-md text-slate-400 cursor-not-allowed hover:bg-[#0e213f]/40"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </div>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-[#182C4E] bg-[#071324]/80">
          <div className="p-2 rounded-lg bg-[#0E203B]/60 border border-[#1C355E] space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold text-xs flex items-center justify-center">
                {user?.avatarInitials || '??'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Unknown'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.department || 'No Department'}</p>
              </div>
            </div>

            {coverages.length > 0 && (
              <div className="pt-1.5 border-t border-[#1C355E] flex items-center gap-1.5 text-[10px] text-amber-300">
                <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Acting on behalf of:{' '}
                  <strong className="text-amber-200 font-semibold">
                    {coverages.map((c) => c.grantor?.name || 'Grantor').join(', ')}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
