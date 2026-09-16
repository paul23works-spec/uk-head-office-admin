'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileCheck,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { AcceptanceRecord } from '@/types';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateAcceptanceModal } from '@/components/acceptance/CreateAcceptanceModal';
import { ViewAcceptanceModal } from '@/components/acceptance/ViewAcceptanceModal';

export default function AcceptancePage() {
  const { acceptances, projects, getCpgByProjectId, getAgreementByProjectId } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingAcceptance, setViewingAcceptance] = useState<AcceptanceRecord | null>(null);

  const filteredAcceptances = useMemo(() => {
    return acceptances.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.acceptanceRef.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q) ||
        a.projectCode.toLowerCase().includes(q) ||
        a.loiLoaNumber.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchesProject = projectFilter === 'ALL' || a.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [acceptances, searchQuery, statusFilter, projectFilter]);

  const totalCount = acceptances.length;
  const acceptedCount = acceptances.filter((a) => a.status === 'Accepted').length;
  const submittedCount = acceptances.filter((a) => a.status === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              STAGE 03
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Acceptance Filing &amp; Verification
            </h1>
            <DemoTag />
            <EnvironmentBadge phase="PHASE 2" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formal unconditional contract acceptance submission, executive countersignatures, and authority filing linked to LOI / LOA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/loi-loa"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>View LOI / LOA</span>
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Acceptance</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Acceptances</span>
          <span className="text-2xl font-bold text-slate-900 font-editorial mt-0.5 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in Phase 2</span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <span className="text-[10px] text-emerald-700 uppercase font-medium block">Accepted &amp; Cleared</span>
          <span className="text-2xl font-bold text-emerald-800 font-editorial mt-0.5 block">{acceptedCount}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Fully acknowledged</span>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
          <span className="text-[10px] text-blue-700 uppercase font-medium block">Submitted / Pending</span>
          <span className="text-2xl font-bold text-blue-800 font-editorial mt-0.5 block">{submittedCount}</span>
          <span className="text-[11px] text-blue-600 mt-1 block">Awaiting authority seal</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="enterprise-card rounded-xl p-4 border border-slate-200 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by acceptance ref, project, LOI number, client..."
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
              <option value="ALL">All Acceptance Statuses</option>
              <option value="Accepted">Accepted</option>
              <option value="Submitted">Submitted</option>
              <option value="Draft">Draft</option>
              <option value="Returned">Returned</option>
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
            Showing <strong className="text-slate-800">{filteredAcceptances.length}</strong> of {totalCount} records
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
                <th className="py-3 px-4">Acceptance Reference</th>
                <th className="py-3 px-4">Linked Project</th>
                <th className="py-3 px-4">Upstream LOI / LOA</th>
                <th className="py-3 px-4">Client Authority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Stage 04 Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAcceptances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No acceptance records found.
                  </td>
                </tr>
              ) : (
                filteredAcceptances.map((a) => {
                  const linkedCpg = getCpgByProjectId(a.projectId);
                  const linkedAgr = getAgreementByProjectId(a.projectId);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ref */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>
                          <span>{a.acceptanceRef}</span>
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                            Date: {a.acceptanceDate}
                          </span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${a.projectId}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-xs"
                        >
                          {a.projectCode}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {a.projectName}
                        </span>
                      </td>

                      {/* LOI */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        <Link
                          href="/loi-loa"
                          className="hover:underline text-blue-700 block truncate max-w-[160px]"
                          title={a.loiLoaNumber}
                        >
                          {a.loiLoaNumber}
                        </Link>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[180px]" title={a.client}>
                          {a.client}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            a.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Stage 04 */}
                      <td className="py-3.5 px-4">
                        <Link
                          href="/cpg-agreement"
                          className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:text-purple-900 font-medium"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>{linkedCpg && linkedAgr ? 'CPG & Agreement' : linkedCpg ? 'CPG Logged' : 'Pending'}</span>
                        </Link>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingAcceptance(a)}
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
      <CreateAcceptanceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => {
          const a = acceptances.find((x) => x.id === id);
          if (a) setViewingAcceptance(a);
        }}
      />

      <ViewAcceptanceModal
        acceptance={viewingAcceptance}
        isOpen={!!viewingAcceptance}
        onClose={() => setViewingAcceptance(null)}
      />
    </div>
  );
}
