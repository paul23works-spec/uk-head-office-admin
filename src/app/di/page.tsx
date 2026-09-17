'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateDiModal } from '@/components/di/CreateDiModal';
import { ViewDiModal } from '@/components/di/ViewDiModal';
import { DiRecord } from '@/types';

export default function DiPage() {
  const { dis, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDi, setViewingDi] = useState<DiRecord | null>(null);

  // Filter
  const filteredDis = dis.filter((d) => {
    if (selectedProjectId !== 'ALL' && d.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.diNumber.toLowerCase().includes(q) ||
        d.jirNumber.toLowerCase().includes(q) ||
        d.materialDescription.toLowerCase().includes(q) ||
        d.vendorName.toLowerCase().includes(q) ||
        d.projectName.toLowerCase().includes(q) ||
        d.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const dispatchedCount = dis.filter((d) => d.status === 'Dispatched').length;
  const readyCount = dis.filter((d) => d.status === 'Ready for Dispatch').length;
  const totalQuantityDispatched = dis
    .filter((d) => d.status !== 'Cancelled')
    .reduce((sum, d) => sum + d.quantity, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Dispatched':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ready for Dispatch':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Partially Dispatched':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE 10
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Dispatch Instruction (DI) / Factory Clearance
            </h1>
            <DemoTag label="STAGE 10 DATA" />
            <EnvironmentBadge phase="PHASE 4" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authorize transport clearance for JIR-accepted materials with multi-DI aggregation &amp; destination tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New DI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total DI Clearances</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{dis.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all project consignments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Transit / Dispatched</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{dispatchedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">En route to site delivery stores</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ready for Dispatch</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{readyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cleared factory gate pass</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Units Dispatched</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {totalQuantityDispatched.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Aggregated active quantity</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search DI #, material, JIR, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Partially Dispatched">Partially Dispatched</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* DI Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">DI Number</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Material &amp; Quantity</th>
                <th className="py-3 px-4">Reference JIR</th>
                <th className="py-3 px-4">Destination Store</th>
                <th className="py-3 px-4">Clearance Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No Dispatch Instruction records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDis.map((di) => (
                  <tr key={di.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {di.diNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{di.projectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{di.projectCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{di.materialDescription}</div>
                      <div className="text-[11px] text-emerald-700 font-medium font-mono">
                        {di.quantity.toLocaleString('en-IN')} {di.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {di.jirNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {di.destination}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {di.diDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          di.status
                        )}`}
                      >
                        {di.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingDi(di)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View DI Clearance"
                      >
                        <Eye className="w-4 h-4" />
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
      <CreateDiModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewDiModal
        isOpen={!!viewingDi}
        onClose={() => setViewingDi(null)}
        di={viewingDi}
      />
    </div>
  );
}
