'use client';

import React from 'react';
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
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { PendingActionsTable } from '@/components/dashboard/PendingActionsTable';
import { RecentProjectsTable } from '@/components/dashboard/RecentProjectsTable';
import { EnvironmentBadge, DemoTag } from '@/components/common/Badge';

export default function DashboardPage() {
  const {
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

      {/* Demo Environment Notice Banner */}
      <div className="rounded-lg bg-blue-50/80 border border-blue-200/80 p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <span className="font-bold uppercase tracking-wider text-[11px] text-blue-800 mr-2">
            Phase 3 Procurement &amp; Inspection Foundation Active:
          </span>
          BOQ and Stages 05 GTP, 06 PO, 07 Inspection Call, 08 Inspection Order, and 09 JIR are fully active alongside Phase 2 Administrative Foundation (01–04). Stages 10 through 13 remain locked preview.
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
