'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { PendingActionsTable } from '@/components/dashboard/PendingActionsTable';
import { RecentProjectsTable } from '@/components/dashboard/RecentProjectsTable';
import { EnvironmentBadge } from '@/components/common/Badge';

export default function DashboardPage() {
  const { stats } = useProjects();

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
      <div className="rounded-lg bg-amber-50/90 border border-amber-200/80 p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 mr-2">
            Phase 1 Foundation:
          </span>
          All records, figures, and stage progressions displayed on this dashboard are purely fictional demonstration data.
          No production database or external administrative engine is connected in this phase.
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
