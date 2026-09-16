'use client';

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateInspectionOrderModal } from '@/components/inspection-order/CreateInspectionOrderModal';
import { ViewInspectionOrderModal } from '@/components/inspection-order/ViewInspectionOrderModal';
import { InspectionOrderRecord } from '@/types';

export default function InspectionOrderPage() {
  const { inspectionOrders, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<InspectionOrderRecord | null>(null);

  // Filter
  const filteredOrders = inspectionOrders.filter((o) => {
    if (selectedProjectId !== 'ALL' && o.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.inspectionOrderNumber.toLowerCase().includes(q) ||
        o.inspectionCallNumber.toLowerCase().includes(q) ||
        o.assignedAuthority.toLowerCase().includes(q) ||
        o.material.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q) ||
        o.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const issuedCount = inspectionOrders.filter((o) => o.status === 'Issued').length;
  const completedCount = inspectionOrders.filter((o) => o.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 08
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Inspection Order (IO) Administration
            </h1>
            <DemoTag label="STAGE 08 DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official inspection authorization orders issued by utility engineers or third-party inspection agency (TPIA).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Inspection Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Inspection Orders</span>
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {inspectionOrders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Formal inspector deputations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Orders Active / Issued</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {issuedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Authorized for site / factory visit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Scheduled Inspections</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {inspectionOrders.filter((o) => o.status === 'Scheduled').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Confirmed testing dates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed &amp; Signed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inspection report executed</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Call #, authority..."
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
            <option value="Issued">Issued</option>
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
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Linked Call</th>
                <th className="px-4 py-3">Material / Equipment</th>
                <th className="px-4 py-3">Assigned Authority</th>
                <th className="px-4 py-3 text-right">Offered Qty</th>
                <th className="px-4 py-3">Inspection Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No Inspection Orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {o.inspectionOrderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {o.projectCode}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-semibold">
                      {o.inspectionCallNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs" title={o.material}>
                      {o.material}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={o.assignedAuthority}>
                      {o.assignedAuthority}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                      {o.quantity} {o.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {o.inspectionDate}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          o.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'Scheduled'
                            ? 'bg-purple-100 text-purple-800'
                            : o.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewingOrder(o)}
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
      <CreateInspectionOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewInspectionOrderModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder || undefined}
      />
    </div>
  );
}
