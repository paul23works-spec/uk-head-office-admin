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
} from 'lucide-react';
import { EnvironmentBadge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKFLOW_NAV_STAGES = [
  { id: '01', name: '01 Tender', icon: FileSpreadsheet },
  { id: '02', name: '02 LOI / LOA', icon: FileCheck },
  { id: '03', name: '03 Acceptance', icon: FileSignature },
  { id: '04', name: '04 CPG + Agreement', icon: ShieldCheck },
  { id: '05', name: '05 GTP', icon: Cpu },
  { id: '06', name: '06 PO', icon: ShoppingCart },
  { id: '07', name: '07 Inspection Call', icon: BellRing },
  { id: '08', name: '08 Inspection Order', icon: ClipboardCheck },
  { id: '09', name: '09 JIR / Inspection Report', icon: FileBadge },
  { id: '10', name: '10 DI / Dispatch Clearance', icon: Truck },
  { id: '11', name: '11 MICC', icon: Award },
  { id: '12', name: '12 Progressive Bill', icon: Receipt },
  { id: '13', name: '13 Final Bill', icon: CheckCheck },
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
            </nav>
          </div>

          {/* Project Workflow (Continuous 13 Stages, locked for future phases) */}
          <div className="pt-2 border-t border-[#152747]">
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 font-editorial">
                Project Workflow
              </span>
              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Future Phases
              </span>
            </div>

            <nav className="space-y-0.5 opacity-65">
              {WORKFLOW_NAV_STAGES.map((stage) => {
                const IconComponent = stage.icon;
                return (
                  <div
                    key={stage.id}
                    title={`${stage.name} — Coming in future phases`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-slate-400 cursor-not-allowed hover:bg-[#0e213f]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
