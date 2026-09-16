'use client';

import React, { useState } from 'react';
import {
  FileBadge,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateJirModal } from '@/components/jir/CreateJirModal';
import { ViewJirModal } from '@/components/jir/ViewJirModal';
import { JirRecord } from '@/types';

export default function JirPage() {
  const { jirs, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingJir, setViewingJir] = useState<JirRecord | null>(null);

  // Filter
  const filteredJirs = jirs.filter((j) => {
    if (selectedProjectId !== 'ALL' && j.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && j.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.jirNumber.toLowerCase().includes(q) ||
        j.inspectionOrderNumber.toLowerCase().includes(q) ||
        j.material.toLowerCase().includes(q) ||
        j.vendorName.toLowerCase().includes(q) ||
        j.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const acceptedCount = jirs.filter((j) => j.status === 'Accepted' || j.status === 'Completed').length;
  const partiallyAcceptedCount = jirs.filter((j) => j.status === 'Partially Accepted').length;
  const underInspectionCount = jirs.filter((j) => j.status === 'Under Inspection' || j.status === 'Draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 09
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Joint Inspection Report (JIR) / Quality Sign-Off
            </h1>
            <DemoTag label="STAGE 09 DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official Joint Inspection Reports, test certificate validation, and quality clearance for Stage 10 DI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New JIR</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total JIR Reports</span>
            <FileBadge className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {jirs.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all equipment inspections</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accepted &amp; Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {acceptedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for Dispatch Instruction</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Partially Accepted</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {partiallyAcceptedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Minor rectifications pending</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Under Witness Testing</span>
            <ClipboardCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {underInspectionCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Factory tests underway</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by JIR #, Order #, material..."
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
            <option value="Accepted">Accepted</option>
            <option value="Partially Accepted">Partially Accepted</option>
            <option value="Completed">Completed</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Rejected">Rejected</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">JIR Number</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Material / Equipment</th>
                <th className="px-4 py-3 text-right">Offered</th>
                <th className="px-4 py-3 text-right">Inspected</th>
                <th className="px-4 py-3 text-right">Accepted</th>
                <th className="px-4 py-3 text-right">Rejected</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJirs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No Joint Inspection Reports found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJirs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {j.jirNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {j.projectCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-semibold">
                      {j.inspectionOrderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs" title={j.material}>
                      {j.material}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {j.offeredQuantity} {j.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {j.inspectedQuantity} {j.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {j.acceptedQuantity} {j.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                      {j.rejectedQuantity} {j.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          j.status === 'Accepted' || j.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : j.status === 'Partially Accepted'
                            ? 'bg-amber-100 text-amber-800'
                            : j.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewingJir(j)}
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
      <CreateJirModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewJirModal
        isOpen={!!viewingJir}
        onClose={() => setViewingJir(null)}
        jir={viewingJir || undefined}
      />
    </div>
  );
}
