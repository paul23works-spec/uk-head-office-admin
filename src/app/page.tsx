'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileSpreadsheet,
  FileCheck,
  FileSignature,
  ShieldCheck,
  ChevronRight,
  Layers,
  ListTree,
  Cpu,
  ShoppingCart,
  BellRing,
  ClipboardCheck,
  FileBadge,
  Truck,
  Award,
  Receipt,
  CheckCheck,
  SlidersHorizontal,
  UserCheck,
  ArrowRight,
  Network,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';
import { canEditStage, checkBasePermission, USERS } from '@/lib/permissions';
import { useActiveDelegation } from '@/hooks/useActiveDelegation';
import { WORKFLOW_NAV_STAGES } from '@/components/layout/Sidebar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { PendingActionsTable } from '@/components/dashboard/PendingActionsTable';
import { RecentProjectsTable } from '@/components/dashboard/RecentProjectsTable';



const STAGE_NAMES: Record<number, string> = {
  1: 'Tender',
  2: 'LOI / LOA',
  3: 'Acceptance',
  4: 'CPG & Aggr.',
  5: 'GTP Approval',
  6: 'PO Issued',
  7: 'Insp. Call',
  8: 'Insp. Order',
  9: 'JIR Accepted',
  10: 'DI Clearance',
  11: 'MICC Received',
  12: 'Prog. Bill',
  13: 'Final Bill',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { coverages, allActiveDelegations, debugInfo } = useActiveDelegation();
  const {
    projects,
    stats,
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
    getProjectControlSummary,
  } = useProjects();

  const tendersUnderEval = tenders.filter((t) => t.status === 'Under Evaluation' || t.status === 'Submitted').length;
  const loiActive = loiLoas.filter((l) => l.status === 'Received' || l.status === 'Accepted').length;
  const accAccepted = acceptances.filter((a) => a.status === 'Accepted').length;
  const validCpgs = cpgs.filter((c) => c.status === 'Valid').length;
  const executedAgreements = agreements.filter((a) => a.status === 'Executed').length;

  const totalBoqVal = boqItems.reduce((acc, b) => acc + (b.amount || 0), 0);
  const gtpApproved = gtps.filter((g) => g.status === 'Approved').length;
  const poActive = pos.filter((p) => p.status !== 'Cancelled').length;
  const callActive = inspectionCalls.filter((c) => c.status !== 'Cancelled').length;
  const orderIssued = inspectionOrders.filter((o) => o.status === 'Issued').length;
  const jirAccepted = jirs.filter((j) => j.status === 'Accepted').length;

  const disActive = dis.filter((d) => d.status !== 'Cancelled').length;
  const miccsVerified = miccs.filter((m) => m.status === 'Verified').length;
  const totalApprovedBilling = progressiveBills
    .filter((b) => b.status === 'Approved')
    .reduce((sum, b) => sum + (b.currentApprovedAmount || 0), 0);
  const finalBillsApproved = finalBills.filter((b) => b.status === 'Approved').length;

  // Phase 5 Project Control aggregates
  const projectControlSummaries = useMemo(() => {
    return projects
      .map((p) => {
        const summary = getProjectControlSummary(p.id);
        return summary ? { project: p, summary } : null;
      })
      .filter((item): item is { project: (typeof projects)[0]; summary: NonNullable<ReturnType<typeof getProjectControlSummary>> } => item !== null);
  }, [projects, getProjectControlSummary]);

  const totalContractVal = useMemo(() => {
    return projects.reduce((acc, p) => acc + (typeof p.contractValue === 'number' ? p.contractValue : Number(p.contractValue) || 0), 0);
  }, [projects]);

  const totalApprovedBillingFromControl = useMemo(() => {
    return projectControlSummaries.reduce(
      (sum, item) => sum + (item.summary.billingSummary.cumulativeApprovedBilling || 0),
      0
    );
  }, [projectControlSummaries]);

  const totalRemainingBalance = Math.max(0, totalContractVal - totalApprovedBillingFromControl);

  const projectsWithPendingActions = useMemo(() => {
    return projectControlSummaries.filter((item) => item.summary.pendingActions.length > 0).length;
  }, [projectControlSummaries]);

  const projectsRequiringAttention = useMemo(() => {
    return projectControlSummaries.filter(
      (item) =>
        item.summary.exceptions.some((e) => e.severity === 'Attention') ||
        item.summary.healthSummary.healthStatus === 'Attention Needed' ||
        item.summary.healthSummary.healthStatus === 'Critical Attention'
    ).length;
  }, [projectControlSummaries]);

  // Stage distribution (1..13)
  const stageDistribution = useMemo(() => {
    const dist: Record<number, { count: number; projectIds: string[] }> = {};
    for (let i = 1; i <= 13; i++) {
      dist[i] = { count: 0, projectIds: [] };
    }
    projectControlSummaries.forEach(({ project, summary }) => {
      const s = parseInt(summary.currentStageNumber, 10);
      if (!isNaN(s) && dist[s]) {
        dist[s].count++;
        dist[s].projectIds.push(project.id);
      }
    });
    return dist;
  }, [projectControlSummaries]);

  return (
    <div className="flex flex-col gap-8">
      <div className="order-1 flex flex-col gap-8">
      {/* Top Welcome & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-editorial">
              UK ENTERPRISE
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Office Administration &amp; Project Control
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal operations dashboard for turnkey power substations, transmission lines, and distribution contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/management/communications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Network className="w-4 h-4 text-slate-500" />
            <span>Communications &amp; Integrations</span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Manage Projects</span>
          </Link>
        </div>
      </div>

      

      {/* Grantee Temporary Delegations */}
      {coverages.length > 0 && (
        <div className="space-y-4">
          {coverages.map((coverage) => (
            <div key={coverage.delegation.id} className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 p-4 sm:p-5 relative overflow-hidden shadow-2xs">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[10px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                        Active Delegation
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-editorial">
                        You are temporarily acting on behalf of{' '}
                        <span className="text-amber-700 font-semibold">
                          {coverage.grantor?.name || 'Grantor'}
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You have been granted temporary edit authorization for{' '}
                      <strong>{coverage.grantorRole} ({coverage.grantor?.department || ''})</strong>.
                      All actions performed on delegated stages will be recorded under your identity on behalf of the grantor.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-amber-200/50">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delegation Details</h4>
                        <p className="text-xs text-slate-700">
                          <strong>Duration:</strong> {new Date(coverage.delegation.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(coverage.delegation.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {coverage.delegation.reason && (
                          <p className="text-xs text-slate-700 italic mt-0.5">
                            &ldquo;{coverage.delegation.reason}&rdquo;
                          </p>
                        )}
                      </div>
                      
                      {coverage.leave && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Leave Record</h4>
                          <p className="text-xs text-slate-700">
                            <strong>Status:</strong> <span className="text-emerald-600 font-semibold">{coverage.leave.status}</span>
                          </p>
                          {coverage.leave.reason && (
                            <p className="text-xs text-slate-700 italic mt-0.5">
                              &ldquo;{coverage.leave.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 flex-wrap text-xs font-medium text-slate-700">
                      <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">Delegated Stages:</span>
                      {coverage.delegatedStageIds.map((stageId) => {
                        const stageNav = WORKFLOW_NAV_STAGES.find((s) => s.id === stageId);
                        const href = stageNav ? stageNav.href : stageId === 'BOQ' ? '/boq' : '#';
                        const name = stageNav ? stageNav.name : stageId === 'BOQ' ? 'BOQ Master' : `Stage ${stageId}`;
                        return (
                          <Link
                            key={stageId}
                            href={href}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:border-amber-400 hover:bg-amber-50 text-slate-800 text-[11px] font-semibold transition-colors shadow-2xs"
                          >
                            <span>{name}</span>
                            <ArrowRight className="w-3 h-3 text-amber-600" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MASTER: Active Delegations & Leaves Section */}
      {user?.role === 'MASTER' && (
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-editorial uppercase tracking-wider">
                  Active Leaves &amp; Temporary Delegations Overview
                </h3>
                <p className="text-xs text-slate-500">
                  Administrative oversight of active employee coverage across project stages.
                </p>
              </div>
            </div>
            <Link
              href="/management/delegation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Manage Delegations &amp; Leaves</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          {allActiveDelegations.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-700">All Employees on Regular Assignment</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No active leaves or temporary delegations currently in effect.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allActiveDelegations.map((del) => {
                const grantor = USERS.find((u) => u.employeeId === del.grantorId);
                const grantee = USERS.find((u) => u.employeeId === del.granteeId);
                return (
                  <div
                    key={del.id}
                    className="p-3.5 rounded-lg bg-amber-50/40 border border-amber-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[9px] uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                          ACTIVE DELEGATION
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(del.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                          {new Date(del.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">
                        <strong className="text-slate-900">{grantee?.name || del.granteeId}</strong>{' '}
                        ({grantee?.role}) is covering for{' '}
                        <strong className="text-slate-900">{grantor?.name || del.grantorId}</strong>{' '}
                        ({grantor?.role})
                      </p>
                      {del.reason && (
                        <p className="text-slate-500 italic text-[11px]">
                          Reason: &ldquo;{del.reason}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" title="Currently Active" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Native Interactive Dashboard Powered by Centralized Analytics Engine */}
      {/* Moved to /management/analytics as per Phase 20 requirements */}
      
      </div>

      {/* LEGACY STATIC MODULES REMOVED */}
      {/* The platform has migrated to the Dynamic Workflow Engine. Stages are now accessed through Project context. */}

      {/* Phase 5: Complete Project Control & Stage Pipeline */}
      <section aria-labelledby="project-control-heading" className="order-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 id="project-control-heading" className="font-bold text-base uppercase tracking-wider text-slate-900 font-editorial">
                Project Control &amp; 13-Stage Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Unified real-time project control, current stage distribution, and administrative health monitoring.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Phase 5 Control Active
            </span>
          </div>
        </div>

        {/* Control Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contract Portfolio</div>
            <div className="mt-1 text-2xl font-bold font-editorial text-slate-900">
              ₹{(totalContractVal / 10000000).toFixed(2)} Cr
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {projects.length} turnkey contracts registered
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Progressive Billing</div>
            <div className="mt-1 text-2xl font-bold font-editorial text-emerald-700">
              ₹{(totalApprovedBillingFromControl / 10000000).toFixed(2)} Cr
            </div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">
              {totalContractVal > 0 ? ((totalApprovedBillingFromControl / totalContractVal) * 100).toFixed(1) : 0}% contract realized
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Unbilled Balance</div>
            <div className="mt-1 text-2xl font-bold font-editorial text-blue-700">
              ₹{(totalRemainingBalance / 10000000).toFixed(2)} Cr
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Contract value pending realization
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operational Queues</div>
            <div className="mt-1 text-2xl font-bold font-editorial text-amber-700">
              {projectsWithPendingActions} Projects
            </div>
            <div className="mt-1 text-xs text-amber-600 font-medium">
              {projectsRequiringAttention} contracts requiring attention
            </div>
          </div>
        </div>

        {/* 13-Stage Project Distribution Ribbon */}
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Current Stage Distribution (Stages 01 – 13)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Deterministic 13-Stage Linear Sequence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((stageNum) => {
              const item = stageDistribution[stageNum] || { count: 0, projectIds: [] };
              const hasProjects = item.count > 0;
              return (
                <div
                  key={stageNum}
                  className={`p-2.5 rounded-lg text-center transition-all ${
                    hasProjects
                      ? 'bg-indigo-600/90 border border-indigo-400 shadow-xs text-white'
                      : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
                    S{String(stageNum).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold truncate mt-0.5" title={STAGE_NAMES[stageNum]}>
                    {STAGE_NAMES[stageNum]}
                  </div>
                  <div className="mt-1.5 flex items-center justify-center">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        hasProjects
                          ? 'bg-white text-indigo-900 shadow-xs'
                          : 'bg-slate-700/70 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Project Status Distribution Section */}
      <section aria-labelledby="status-dist-heading">
        <StatusDistribution />
      </section>

      {/* Grid: Pending Actions & Recent Projects */}
      <div className="space-y-8">
        {/* Pending Actions */}
        <section aria-labelledby="pending-actions-heading">
          <PendingActionsTable />
        </section>

        {/* Recent Projects Table */}
        <section aria-labelledby="recent-projects-heading">
          <RecentProjectsTable />
        </section>
      </div>
    </div>
  );
}
