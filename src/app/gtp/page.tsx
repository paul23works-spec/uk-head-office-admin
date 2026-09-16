'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateGtpModal } from '@/components/gtp/CreateGtpModal';
import { ViewGtpModal } from '@/components/gtp/ViewGtpModal';
import { GtpRecord } from '@/types';

export default function GtpPage() {
  const { gtps, projects, getLatestGtpForBoqItem } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingGtp, setViewingGtp] = useState<GtpRecord | null>(null);

  // Filter
  const filteredGtps = gtps.filter((g) => {
    if (selectedProjectId !== 'ALL' && g.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && g.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.gtpNumber.toLowerCase().includes(q) ||
        g.materialItem.toLowerCase().includes(q) ||
        g.vendorName.toLowerCase().includes(q) ||
        g.revision.toLowerCase().includes(q) ||
        g.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations based on LATEST revisions per BOQ item
  const uniqueBoqIds = Array.from(new Set(gtps.map((g) => g.boqItemId)));
  const latestGtps = uniqueBoqIds
    .map((id) => getLatestGtpForBoqItem(id))
    .filter((g): g is GtpRecord => !!g);

  const approvedCount = latestGtps.filter((g) => g.status === 'Approved').length;
  const underReviewCount = latestGtps.filter(
    (g) => g.status === 'Under Review' || g.status === 'Submitted' || g.status === 'Clarification Required'
  ).length;
  const multiRevisionCount = gtps.filter((g) => g.revision !== 'R0').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 05
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Guaranteed Technical Particulars (GTP) Approval
            </h1>
            <DemoTag label="STAGE 05 DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Equipment specification clearances, drawing approvals, and revision management per turnkey BOQ item.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New GTP</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total GTP Records</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {gtps.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all equipment items &amp; revisions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved Items (Latest)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cleared for Purchase Order issuance</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Under Review / Clarification</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting client quality sign-off</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Subsequent Revisions</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {multiRevisionCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">R1+ submissions recorded</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by GTP #, material, vendor..."
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
            <option value="Approved">Approved</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Clarification Required">Clarification Required</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* GTP Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">GTP Ref #</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">BOQ Item</th>
                <th className="px-4 py-3">Material / Equipment</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3 text-center">Revision</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGtps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No GTP records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredGtps.map((gtp) => {
                  const latest = getLatestGtpForBoqItem(gtp.boqItemId);
                  const isLatestRev = latest ? latest.id === gtp.id : true;

                  return (
                    <tr key={gtp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {gtp.gtpNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {gtp.projectCode}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        Item {gtp.boqItemNumber}
                      </td>
                      <td className="px-4 py-3 max-w-xs font-medium text-slate-900 truncate" title={gtp.materialItem}>
                        {gtp.materialItem}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {gtp.vendorName}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {gtp.revision}
                        </span>
                        {isLatestRev && (
                          <span className="block text-[9px] text-blue-600 font-semibold mt-0.5">
                            Latest
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {gtp.submissionDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                            gtp.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : gtp.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : gtp.status === 'Clarification Required'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {gtp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setViewingGtp(gtp)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateGtpModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewGtpModal
        isOpen={!!viewingGtp}
        onClose={() => setViewingGtp(null)}
        gtp={viewingGtp || undefined}
      />
    </div>
  );
}
