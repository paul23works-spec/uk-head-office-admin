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
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { PendingActionsTable } from '@/components/dashboard/PendingActionsTable';
import { RecentProjectsTable } from '@/components/dashboard/RecentProjectsTable';
import { EnvironmentBadge, DemoTag } from '@/components/common/Badge';

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
    <div className="space-y-8">
      {/* Top Welcome & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-editorial">
              UK HEAD OFFICE
            </h1>
            <EnvironmentBadge />
            <DemoTag />
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
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Manage Projects</span>
          </Link>
        </div>
      </div>

      {/* Phase 5 Banner */}
      <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950">
          <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-800 mr-2">
            Phase 5 Complete Project Control Active:
          </span>
          All 13 turnkey workflow stages (01 Tender through 13 Final Bill) are live and unified under real-time operational control, health scoring, pending actions, and cross-stage audits.
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title="Total Projects"
          value={stats.total}
          subtitle="All registered contract packages"
          icon={FolderKanban}
          variant="navy"
          trend="12 Contracts Total"
        />
        <KpiCard
          title="Active Projects"
          value={stats.active}
          subtitle="Currently under administrative execution"
          icon={Activity}
          variant="blue"
          trend="8 Active in Execution"
        />
        <KpiCard
          title="Requiring Attention"
          value={stats.attentionRequired}
          subtitle="Items with pending administrative hold"
          icon={AlertTriangle}
          variant="amber"
          trend="3 Flagged for Review"
        />
        <KpiCard
          title="Completed Projects"
          value={stats.completed}
          subtitle="Successfully reconciled & closed"
          icon={CheckCircle2}
          variant="emerald"
          trend="4 Finalized Contracts"
        />
      </div>

      {/* Phase 2: Active Administrative Foundation (Stages 01–04) */}
      <section aria-labelledby="stage-a-heading" className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 id="stage-a-heading" className="font-bold text-sm uppercase tracking-wider text-slate-900 font-editorial">
              Phase 2 Active Workflow Modules (Stages 01 – 04)
            </h2>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Live Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage 01 Tender */}
          <Link
            href="/tenders"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                01 Tender
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {tenders.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{tendersUnderEval} in bidding / evaluation</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 02 LOI / LOA */}
          <Link
            href="/loi-loa"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                02 LOI / LOA
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {loiLoas.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{loiActive} active award letters</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 03 Acceptance */}
          <Link
            href="/acceptance"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                03 Acceptance
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileSignature className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {acceptances.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{accAccepted} formally accepted</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 04 CPG + Agreement */}
          <Link
            href="/cpg-agreement"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                04 CPG + Agreement
              </span>
              <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {cpgs.length} / {agreements.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{validCpgs} BGs • {executedAgreements} Aggr.</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Phase 3: Active Procurement & Inspection Foundation (BOQ & Stages 05–09) */}
      <section aria-labelledby="stage-b-heading" className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-600" />
            <h2 id="stage-b-heading" className="font-bold text-sm uppercase tracking-wider text-slate-900 font-editorial">
              Phase 3 Active Workflow Modules (BOQ &amp; Stages 05 – 09)
            </h2>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Phase 3 Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* BOQ Register */}
          <Link
            href="/boq"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                BOQ
              </span>
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ListTree className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {boqItems.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>₹{(totalBoqVal / 100000).toFixed(1)}L Est.</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 05 GTP */}
          <Link
            href="/gtp"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                05 GTP
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {gtps.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{gtpApproved} approved</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 06 PO */}
          <Link
            href="/po"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                06 PO
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {pos.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{poActive} active POs</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 07 Inspection Call */}
          <Link
            href="/inspection-call"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                07 Call
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BellRing className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {inspectionCalls.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{callActive} raised/ack</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 08 Inspection Order */}
          <Link
            href="/inspection-order"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                08 Order
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {inspectionOrders.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{orderIssued} deputed</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 09 JIR */}
          <Link
            href="/jir"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                09 JIR
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileBadge className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {jirs.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{jirAccepted} accepted</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Phase 4: Active C-Admin Modules (Stages 10–13) */}
      <section aria-labelledby="stage-c-heading" className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h2 id="stage-c-heading" className="font-bold text-sm uppercase tracking-wider text-slate-900 font-editorial">
              Phase 4 Active C-Admin Modules (Stages 10 – 13)
            </h2>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Phase 4 Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage 10 DI */}
          <Link
            href="/di"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                10 DI
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {dis.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{disActive} active clearances</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 11 MICC */}
          <Link
            href="/micc"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                11 MICC
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {miccs.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{miccsVerified} verified receipts</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 12 Progressive Bill */}
          <Link
            href="/progressive-bill"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                12 Progressive Bill
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {progressiveBills.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>₹{(totalApprovedBilling / 100000).toFixed(1)}L approved</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Stage 13 Final Bill */}
          <Link
            href="/final-bill"
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                13 Final Bill
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold font-editorial text-slate-900">
              {finalBills.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>{finalBillsApproved} settled closures</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Phase 5: Complete Project Control & Stage Pipeline */}
      <section aria-labelledby="project-control-heading" className="space-y-4">
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
