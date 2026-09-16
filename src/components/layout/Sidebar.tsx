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
} from 'lucide-react';
import { EnvironmentBadge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKFLOW_NAV_STAGES = [
  { id: '01', name: '01 Tender', icon: FileSpreadsheet, href: '/tenders', active: true },
  { id: '02', name: '02 LOI / LOA', icon: FileCheck, href: '/loi-loa', active: true },
  { id: '03', name: '03 Acceptance', icon: FileSignature, href: '/acceptance', active: true },
  { id: '04', name: '04 CPG + Agreement', icon: ShieldCheck, href: '/cpg-agreement', active: true },
  { id: '05', name: '05 GTP', icon: Cpu, href: '/gtp', active: true },
  { id: '06', name: '06 PO', icon: ShoppingCart, href: '/po', active: true },
  { id: '07', name: '07 Inspection Call', icon: BellRing, href: '/inspection-call', active: true },
  { id: '08', name: '08 Inspection Order', icon: ClipboardCheck, href: '/inspection-order', active: true },
  { id: '09', name: '09 JIR / Inspection Report', icon: FileBadge, href: '/jir', active: true },
  { id: '10', name: '10 DI / Dispatch Clearance', icon: Truck, href: '#', active: false },
  { id: '11', name: '11 MICC', icon: Award, href: '#', active: false },
  { id: '12', name: '12 Progressive Bill', icon: Receipt, href: '#', active: false },
  { id: '13', name: '13 Final Bill', icon: CheckCheck, href: '#', active: false },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/';
  const isProjectsActive = pathname.startsWith('/projects');

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
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold tracking-wider shadow-inner border border-blue-400/30">
                UK
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white font-editorial">
                  UK HEAD OFFICE
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
            <EnvironmentBadge />
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
              <Link
                href="/boq"
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  pathname.startsWith('/boq')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#112444] hover:text-white'
                }`}
              >
                <ListTree className="w-4 h-4 shrink-0" />
                <span>BOQ Master</span>
              </Link>
            </nav>
          </div>

          {/* Project Workflow (Continuous 13 Stages, locked for future phases) */}
          <div className="pt-2 border-t border-[#152747]">
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 font-editorial">
                Project Workflow
              </span>
              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Phase 3
              </span>
            </div>

            <nav className="space-y-0.5">
              {WORKFLOW_NAV_STAGES.map((stage) => {
                const IconComponent = stage.icon;
                const isStageActive = stage.active && (pathname === stage.href || pathname.startsWith(stage.href + '/'));

                if (stage.active) {
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
                }

                return (
                  <div
                    key={stage.id}
                    title={`${stage.name} — Coming in future phases`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-slate-500 cursor-not-allowed hover:bg-[#0e213f]/40 opacity-60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-xs">{stage.name}</span>
                    </div>
                    <Lock className="w-3 h-3 text-slate-500 shrink-0 ml-1.5" />
                  </div>
                );
              })}
            </nav>
          </div>

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
              <div
                title="Coming in future phases"
                className="flex items-center justify-between px-3 py-2 rounded-md text-slate-400 cursor-not-allowed hover:bg-[#0e213f]/40"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reports</span>
                </div>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
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
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0E203B]/60 border border-[#1C355E]">
            <div className="w-8 h-8 rounded-md bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold text-xs flex items-center justify-center">
              PR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Prastab Raaj</p>
              <p className="text-[10px] text-slate-400 truncate">Project Executive</p>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
              DEMO
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
