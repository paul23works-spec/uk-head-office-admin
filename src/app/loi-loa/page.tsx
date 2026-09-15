'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Eye,
  FileSignature,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { LoiLoaRecord } from '@/types';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateLoiLoaModal } from '@/components/loi-loa/CreateLoiLoaModal';
import { ViewLoiLoaModal } from '@/components/loi-loa/ViewLoiLoaModal';
import { CreateAcceptanceModal } from '@/components/acceptance/CreateAcceptanceModal';

export default function LoiLoaPage() {
  const { loiLoas, projects, getAcceptanceByProjectId } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingLoi, setViewingLoi] = useState<LoiLoaRecord | null>(null);
  const [isCreateAcceptanceOpen, setIsCreateAcceptanceOpen] = useState(false);
  const [selectedLoiForAcceptance, setSelectedLoiForAcceptance] = useState<LoiLoaRecord | null>(null);

  const filteredLois = useMemo(() => {
    return loiLoas.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.loiNumber.toLowerCase().includes(q) ||
        l.projectName.toLowerCase().includes(q) ||
        l.projectCode.toLowerCase().includes(q) ||
        l.tenderNumber.toLowerCase().includes(q) ||
        l.client.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
      const matchesProject = projectFilter === 'ALL' || l.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [loiLoas, searchQuery, statusFilter, projectFilter]);

  const totalCount = loiLoas.length;
  const acceptedCount = loiLoas.filter((l) => l.status === 'Accepted').length;
  const underReviewCount = loiLoas.filter((l) => l.status === 'Under Review').length;
  const receivedCount = loiLoas.filter((l) => l.status === 'Received').length;

  const handleOpenCreateAcceptance = (loi: LoiLoaRecord) => {
    setSelectedLoiForAcceptance(loi);
    setIsCreateAcceptanceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              STAGE 02
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Letter of Intent / Letter of Award (LOI / LOA)
            </h1>
            <DemoTag />
            <EnvironmentBadge />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official contract awards, notification of awards (NOA), and formal order acknowledgment linked to Tender.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>View Tenders</span>
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register LOI / LOA</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Total LOI / LOA</span>
          <span className="text-2xl font-bold text-slate-900 font-editorial mt-0.5 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in Phase 2</span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <span className="text-[10px] text-emerald-700 uppercase font-medium block">Accepted Awards</span>
          <span className="text-2xl font-bold text-emerald-800 font-editorial mt-0.5 block">{acceptedCount}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Countersigned &amp; filed</span>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
          <span className="text-[10px] text-blue-700 uppercase font-medium block">Received</span>
          <span className="text-2xl font-bold text-blue-800 font-editorial mt-0.5 block">{receivedCount}</span>
          <span className="text-[11px] text-blue-600 mt-1 block">Awaiting formal review</span>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <span className="text-[10px] text-amber-800 uppercase font-medium block">Under Review</span>
          <span className="text-2xl font-bold text-amber-900 font-editorial mt-0.5 block">{underReviewCount}</span>
          <span className="text-[11px] text-amber-700 mt-1 block">Legal/commercial check</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="enterprise-card rounded-xl p-4 border border-slate-200 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by LOI number, project, tender number, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All LOI Statuses</option>
              <option value="Accepted">Accepted</option>
              <option value="Received">Received</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredLois.length}</strong> of {totalCount} records
          </span>
          {(searchQuery || statusFilter !== 'ALL' || projectFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setProjectFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="enterprise-card rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">LOI / LOA Number</th>
                <th className="py-3 px-4">Linked Project</th>
                <th className="py-3 px-4">Upstream Tender</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Downstream Acceptance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLois.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No LOI / LOA records found.
                  </td>
                </tr>
              ) : (
                filteredLois.map((l) => {
                  const linkedAcceptance = getAcceptanceByProjectId(l.projectId);

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* LOI Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>
                          <span>{l.loiNumber}</span>
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            Dated: {l.date}
                          </span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${l.projectId}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-xs"
                        >
                          {l.projectCode}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {l.projectName}
                        </span>
                      </td>

                      {/* Tender */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        <span className="truncate block max-w-[160px]" title={l.tenderNumber}>
                          {l.tenderNumber}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[160px]" title={l.client}>
                          {l.client}
                        </span>
                      </td>

                      {/* Contract Value */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-editorial">
                        {l.contractValue}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            l.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'Received'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>

                      {/* Stage 03 connection */}
                      <td className="py-3.5 px-4">
                        {linkedAcceptance ? (
                          <Link
                            href="/acceptance"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                            title={`Ref: ${linkedAcceptance.acceptanceRef}`}
                          >
                            <FileSignature className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Accepted</span>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingLoi(l)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
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
      <CreateLoiLoaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => {
          const l = loiLoas.find((x) => x.id === id);
          if (l) setViewingLoi(l);
        }}
      />

      <ViewLoiLoaModal
        loi={viewingLoi}
        isOpen={!!viewingLoi}
        onClose={() => setViewingLoi(null)}
        onOpenCreateAcceptance={handleOpenCreateAcceptance}
      />

      <CreateAcceptanceModal
        isOpen={isCreateAcceptanceOpen}
        onClose={() => {
          setIsCreateAcceptanceOpen(false);
          setSelectedLoiForAcceptance(null);
        }}
        defaultProjectId={selectedLoiForAcceptance?.projectId}
      />
    </div>
  );
}
