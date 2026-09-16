'use client';

import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateInspectionCallModal } from '@/components/inspection-call/CreateInspectionCallModal';
import { ViewInspectionCallModal } from '@/components/inspection-call/ViewInspectionCallModal';
import { InspectionCallRecord } from '@/types';

export default function InspectionCallPage() {
  const { inspectionCalls, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingCall, setViewingCall] = useState<InspectionCallRecord | null>(null);

  // Filter
  const filteredCalls = inspectionCalls.filter((c) => {
    if (selectedProjectId !== 'ALL' && c.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.inspectionCallNumber.toLowerCase().includes(q) ||
        c.poNumber.toLowerCase().includes(q) ||
        c.material.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const scheduledCount = inspectionCalls.filter((c) => c.status === 'Scheduled').length;
  const underReviewCount = inspectionCalls.filter(
    (c) => c.status === 'Under Review' || c.status === 'Submitted'
  ).length;
  const completedCount = inspectionCalls.filter((c) => c.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 07
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Inspection Call Administration
            </h1>
            <DemoTag label="STAGE 07 DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Factory inspection call notices issued to client quality engineers &amp; third-party inspection authorities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Inspection Call</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Inspection Calls</span>
            <BellRing className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {inspectionCalls.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all manufacturing vendor POs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Scheduled Inspections</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {scheduledCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inspector deputation formalized</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting client inspection order</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed Inspections</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Joint inspection reports completed</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Call #, PO #, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Call #</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">PO Reference</th>
                <th className="px-4 py-3">Material / Equipment</th>
                <th className="px-4 py-3 text-right">Call Qty</th>
                <th className="px-4 py-3 text-right">PO Total</th>
                <th className="px-4 py-3">Proposed Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No Inspection Calls found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {c.inspectionCallNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {c.projectCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {c.poNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs" title={c.material}>
                      {c.material}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">
                      {c.quantity} {c.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {c.poQuantity} {c.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {c.proposedInspectionDate}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          c.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'Scheduled'
                            ? 'bg-purple-100 text-purple-800'
                            : c.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewingCall(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateInspectionCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewInspectionCallModal
        isOpen={!!viewingCall}
        onClose={() => setViewingCall(null)}
        call={viewingCall || undefined}
      />
    </div>
  );
}
