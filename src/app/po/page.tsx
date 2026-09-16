'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  PackageCheck,
  Clock,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreatePoModal } from '@/components/po/CreatePoModal';
import { ViewPoModal } from '@/components/po/ViewPoModal';
import { PoRecord } from '@/types';

export default function PoPage() {
  const { pos, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPo, setViewingPo] = useState<PoRecord | null>(null);

  // Filter
  const filteredPos = pos.filter((p) => {
    if (selectedProjectId !== 'ALL' && p.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.poNumber.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.items.some((item) => item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // KPI calculations
  const totalPoValue = pos
    .filter((p) => p.status !== 'Cancelled')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const activePosCount = pos.filter(
    (p) => p.status === 'Issued' || p.status === 'Acknowledged' || p.status === 'In Progress'
  ).length;
  const closedPosCount = pos.filter((p) => p.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 06
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Purchase Order (PO) Administration
            </h1>
            <DemoTag label="STAGE 06 DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing purchase orders issued to equipment vendors, line-item quantity allocations, and value tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New PO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Purchase Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {pos.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all active contracts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total PO Value (Non-Cancelled)</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-mono">
            ₹ {(totalPoValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-400 mt-1">₹ {totalPoValue.toLocaleString('en-IN')} total</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active / In Progress POs</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {activePosCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Under manufacturing schedule</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Closed / Dispatched POs</span>
            <PackageCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {closedPosCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Completed procurement cycles</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PO #, vendor, material..."
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
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Vendor / Manufacturer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Lines</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No Purchase Orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {po.projectCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {po.vendorName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {po.poDate}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                      {po.items.length} item(s)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">
                      ₹ {po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                          po.status === 'Closed'
                            ? 'bg-purple-100 text-purple-800'
                            : po.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : po.status === 'Acknowledged'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'Cancelled'
                            ? 'bg-slate-200 text-slate-700 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewingPo(po)}
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
      <CreatePoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewPoModal
        isOpen={!!viewingPo}
        onClose={() => setViewingPo(null)}
        po={viewingPo || undefined}
      />
    </div>
  );
}
