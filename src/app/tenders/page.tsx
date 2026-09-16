'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FolderKanban,
  FileCheck,
  Eye,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { TenderRecord } from '@/types';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateTenderModal } from '@/components/tenders/CreateTenderModal';
import { ViewTenderModal } from '@/components/tenders/ViewTenderModal';
import { CreateLoiLoaModal } from '@/components/loi-loa/CreateLoiLoaModal';

export default function TendersPage() {
  const { tenders, projects, getLoiLoaByProjectId } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [l1Filter, setL1Filter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingTender, setViewingTender] = useState<TenderRecord | null>(null);
  const [isCreateLoiOpen, setIsCreateLoiOpen] = useState(false);
  const [selectedTenderForLoi, setSelectedTenderForLoi] = useState<TenderRecord | null>(null);

  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.tenderNumber.toLowerCase().includes(q) ||
        t.tenderRef.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.projectCode.toLowerCase().includes(q) ||
        t.client.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesL1 = l1Filter === 'ALL' || t.l1Status === l1Filter;
      const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesL1 && matchesProject;
    });
  }, [tenders, searchQuery, statusFilter, l1Filter, projectFilter]);

  // Tender stats
  const totalCount = tenders.length;
  const awardedCount = tenders.filter((t) => t.status === 'Awarded').length;
  const underEvalCount = tenders.filter((t) => t.status === 'Under Evaluation').length;
  const l1Count = tenders.filter((t) => t.l1Status === 'L1').length;

  const handleOpenCreateLoi = (tender: TenderRecord) => {
    setSelectedTenderForLoi(tender);
    setIsCreateLoiOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              STAGE 01
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Tender Administration
            </h1>
            <DemoTag />
            <EnvironmentBadge phase="PHASE 2" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Turnkey project bid records, NIT specification files, qualification tracking, and commercial submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects Directory</span>
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Tender</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Tenders</span>
          <span className="text-2xl font-bold text-slate-900 font-editorial mt-0.5 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in Phase 2</span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <span className="text-[10px] text-emerald-700 uppercase font-medium block">Awarded Contracts</span>
          <span className="text-2xl font-bold text-emerald-800 font-editorial mt-0.5 block">{awardedCount}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Successfully converted</span>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
          <span className="text-[10px] text-blue-700 uppercase font-medium block">L1 Qualified</span>
          <span className="text-2xl font-bold text-blue-800 font-editorial mt-0.5 block">{l1Count}</span>
          <span className="text-[11px] text-blue-600 mt-1 block">Lowest verified bidder</span>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <span className="text-[10px] text-amber-800 uppercase font-medium block">Under Evaluation</span>
          <span className="text-2xl font-bold text-amber-900 font-editorial mt-0.5 block">{underEvalCount}</span>
          <span className="text-[11px] text-amber-700 mt-1 block">Pending client review</span>
        </div>
      </div>

      {/* Filters & Search Box */}
      <div className="enterprise-card rounded-xl p-4 border border-slate-200 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by tender no., NIT, project, client, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All Tender Statuses</option>
              <option value="Awarded">Awarded</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Published">Published</option>
              <option value="Submitted">Submitted</option>
              <option value="L1">L1</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* L1 Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={l1Filter}
              onChange={(e) => setL1Filter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All L1 States</option>
              <option value="L1">L1 Only</option>
              <option value="Not L1">Not L1</option>
              <option value="Not Determined">Not Determined</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="lg:col-span-2">
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

        {/* Counter and Active Filters */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredTenders.length}</strong> of {totalCount} tenders
          </span>
          {(searchQuery || statusFilter !== 'ALL' || l1Filter !== 'ALL' || projectFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setL1Filter('ALL');
                setProjectFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tenders Table */}
      <div className="enterprise-card rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Tender / NIT Number</th>
                <th className="py-3 px-4">Linked Project</th>
                <th className="py-3 px-4">Client &amp; Dept</th>
                <th className="py-3 px-4">Tender Value</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">L1 Status</th>
                <th className="py-3 px-4">Downstream LOI</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No tenders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenders.map((t) => {
                  const linkedLoi = getLoiLoaByProjectId(t.projectId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tender Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>
                          <span>{t.tenderNumber}</span>
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            Dated: {t.tenderDate}
                          </span>
                        </div>
                      </td>

                      {/* Linked Project */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${t.projectId}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-xs"
                          title={t.projectName}
                        >
                          {t.projectCode}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {t.projectName}
                        </span>
                      </td>

                      {/* Client & Dept */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[180px]" title={t.client}>
                          {t.client}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                          {t.department}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-editorial">
                        {t.tenderValue}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {t.closingDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.status === 'Awarded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'Under Evaluation'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* L1 Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.l1Status === 'L1'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.l1Status}
                        </span>
                      </td>

                      {/* Downstream Stage 02 connection */}
                      <td className="py-3.5 px-4">
                        {linkedLoi ? (
                          <Link
                            href="/loi-loa"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                            title={`Linked LOI: ${linkedLoi.loiNumber}`}
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>LOI Recorded</span>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pending LOI
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingTender(t)}
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
      <CreateTenderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => {
          const t = tenders.find((x) => x.id === id);
          if (t) setViewingTender(t);
        }}
      />

      <ViewTenderModal
        tender={viewingTender}
        isOpen={!!viewingTender}
        onClose={() => setViewingTender(null)}
        onOpenCreateLoi={handleOpenCreateLoi}
      />

      {/* Downstream LOI/LOA registration helper */}
      <CreateLoiLoaModal
        isOpen={isCreateLoiOpen}
        onClose={() => {
          setIsCreateLoiOpen(false);
          setSelectedTenderForLoi(null);
        }}
        defaultProjectId={selectedTenderForLoi?.projectId}
      />
    </div>
  );
}
