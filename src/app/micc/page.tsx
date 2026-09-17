'use client';

import React, { useState } from 'react';
import {
  ClipboardCheck,
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
import { CreateMiccModal } from '@/components/micc/CreateMiccModal';
import { ViewMiccModal } from '@/components/micc/ViewMiccModal';
import { MiccRecord } from '@/types';

export default function MiccPage() {
  const { miccs, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingMicc, setViewingMicc] = useState<MiccRecord | null>(null);

  // Filter
  const filteredMiccs = miccs.filter((m) => {
    if (selectedProjectId !== 'ALL' && m.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.miccNumber.toLowerCase().includes(q) ||
        m.diNumber.toLowerCase().includes(q) ||
        m.materialDescription.toLowerCase().includes(q) ||
        m.vendorName.toLowerCase().includes(q) ||
        m.projectName.toLowerCase().includes(q) ||
        m.fieldOffice.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const verifiedCount = miccs.filter((m) => m.status === 'Verified').length;
  const underVerificationCount = miccs.filter((m) => m.status === 'Under Verification').length;
  const totalVerifiedQuantity = miccs
    .filter((m) => m.status === 'Verified')
    .reduce((sum, m) => sum + m.quantity, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Verification':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected':
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase tracking-wider font-mono">
              STAGE 11
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Material Inward &amp; Clearance Certificate (MICC)
            </h1>
            <DemoTag label="STAGE 11 DATA" />
            <EnvironmentBadge phase="PHASE 4" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Site-level inward inspection and verification of materials delivered under DI for Progressive Billing clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New MICC</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total MICC Records</span>
            <ClipboardCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{miccs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Inward site receipts lodged</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Verified &amp; Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{verifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Eligible for progressive billing</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Under Site Inspection</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{underVerificationCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Field officer checking unloaded goods</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Units Verified</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">
            {totalVerifiedQuantity.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Certified for Stage 12 billing</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search MICC #, DI #, material, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Under Verification">Under Verification</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* MICC Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">MICC Number</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Material &amp; Verified Qty</th>
                <th className="py-3 px-4">Reference DI</th>
                <th className="py-3 px-4">Site Field Office</th>
                <th className="py-3 px-4">Inward Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMiccs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No MICC records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMiccs.map((micc) => (
                  <tr key={micc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-purple-700">
                      {micc.miccNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{micc.projectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{micc.projectCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{micc.materialDescription}</div>
                      <div className="text-[11px] text-emerald-700 font-medium font-mono">
                        {micc.quantity.toLocaleString('en-IN')} {micc.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {micc.diNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {micc.fieldOffice}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {micc.miccDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          micc.status
                        )}`}
                      >
                        {micc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingMicc(micc)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View MICC Details"
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
      <CreateMiccModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewMiccModal
        isOpen={!!viewingMicc}
        onClose={() => setViewingMicc(null)}
        micc={viewingMicc}
      />
    </div>
  );
}
