'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ScrollText,
  Plus,
  Search,
  FolderKanban,
  FileSignature,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { CpgRecord, AgreementRecord } from '@/types';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateCpgModal } from '@/components/cpg-agreement/CreateCpgModal';
import { CreateAgreementModal } from '@/components/cpg-agreement/CreateAgreementModal';
import { ViewCpgModal } from '@/components/cpg-agreement/ViewCpgModal';
import { ViewAgreementModal } from '@/components/cpg-agreement/ViewAgreementModal';

type ActiveTab = 'overview' | 'cpg' | 'agreement';

export default function CpgAgreementPage() {
  const { cpgs, agreements, projects, getCpgByProjectId, getAgreementByProjectId } = useProjects();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [cpgStatusFilter, setCpgStatusFilter] = useState<string>('ALL');
  const [agrStatusFilter, setAgrStatusFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Modals
  const [isCreateCpgOpen, setIsCreateCpgOpen] = useState(false);
  const [isCreateAgrOpen, setIsCreateAgrOpen] = useState(false);
  const [selectedCpg, setSelectedCpg] = useState<CpgRecord | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementRecord | null>(null);

  // Metrics
  const validCpgCount = cpgs.filter((c) => c.status === 'Valid').length;
  const executedAgrCount = agreements.filter((a) => a.status === 'Executed').length;

  // Filtered CPG records
  const filteredCpgs = useMemo(() => {
    return cpgs.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.cpgRef.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q) ||
        c.projectCode.toLowerCase().includes(q) ||
        (c.bankName && c.bankName.toLowerCase().includes(q)) ||
        c.loiLoaNumber.toLowerCase().includes(q);

      const matchesStatus = cpgStatusFilter === 'ALL' || c.status === cpgStatusFilter;
      const matchesProject = projectFilter === 'ALL' || c.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [cpgs, searchQuery, cpgStatusFilter, projectFilter]);

  // Filtered Agreement records
  const filteredAgreements = useMemo(() => {
    return agreements.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.agreementRef.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q) ||
        a.projectCode.toLowerCase().includes(q) ||
        a.loiLoaNumber.toLowerCase().includes(q);

      const matchesStatus = agrStatusFilter === 'ALL' || a.status === agrStatusFilter;
      const matchesProject = projectFilter === 'ALL' || a.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [agreements, searchQuery, agrStatusFilter, projectFilter]);

  // Combined Projects Overview list
  const overviewProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q);

      const matchesProject = projectFilter === 'ALL' || p.id === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [projects, searchQuery, projectFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
              STAGE 04
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              CPG &amp; Contract Agreement Management
            </h1>
            <DemoTag />
            <EnvironmentBadge />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified administration of Contract Performance Guarantees (Bank Guarantees) and bilateral Contract Agreement executions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/acceptance"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <FileSignature className="w-3.5 h-3.5 text-slate-500" />
            <span>View Acceptances</span>
          </Link>

          <button
            onClick={() => setIsCreateCpgOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log CPG (BG)</span>
          </button>

          <button
            onClick={() => setIsCreateAgrOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Execute Agreement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Guarantee Exposure</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-editorial text-slate-900">
            {cpgs.length} Guarantees
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {validCpgCount} active verified BGs across projects
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Valid Active Guarantees</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-editorial text-slate-900">
            {validCpgCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Active verified BGs in compliance
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Executed Agreements</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <ScrollText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-editorial text-slate-900">
            {executedAgrCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {agreements.length} total agreement files tracked
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Phase 2 Admin Status</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-editorial text-purple-700">
            Stages 01–04
          </div>
          <div className="mt-1 text-[11px] text-purple-600 font-medium">
            A-Admin foundation complete &amp; linked
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Stage 04 Project Matrix ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cpg')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'cpg'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Bank Guarantees / CPG ({cpgs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agreement')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'agreement'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Contract Agreements ({agreements.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'cpg'
                ? 'Search by BG ref, bank name, project code...'
                : activeTab === 'agreement'
                ? 'Search by agreement ref, project code...'
                : 'Search projects in Stage 04 matrix...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'cpg' && (
            <select
              value={cpgStatusFilter}
              onChange={(e) => setCpgStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">All CPG Statuses</option>
              <option value="Valid">Valid</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Expired">Expired</option>
              <option value="Released">Released</option>
            </select>
          )}

          {activeTab === 'agreement' && (
            <select
              value={agrStatusFilter}
              onChange={(e) => setAgrStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Agreement Statuses</option>
              <option value="Executed">Executed</option>
              <option value="Under Preparation">Under Preparation</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          )}

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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

      {/* TAB 1: Combined Project Matrix */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Client &amp; Value</th>
                  <th className="px-5 py-3.5">Bank Guarantee (CPG)</th>
                  <th className="px-5 py-3.5">Contract Agreement</th>
                  <th className="px-5 py-3.5 text-center">Stage 04 Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {overviewProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      No matching projects found.
                    </td>
                  </tr>
                ) : (
                  overviewProjects.map((p) => {
                    const cpg = getCpgByProjectId(p.id);
                    const agr = getAgreementByProjectId(p.id);
                    const isStage04Ready = Boolean(cpg && agr && cpg.status === 'Valid' && agr.status === 'Executed');

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 font-mono transition-colors"
                          >
                            {p.code}
                          </Link>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.name}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{p.client}</div>
                          <div className="text-[11px] text-slate-500">
                            Contract: {p.contractValue || 'N/A'}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {cpg ? (
                            <button
                              onClick={() => setSelectedCpg(cpg)}
                              className="text-left group cursor-pointer"
                            >
                              <div className="font-semibold text-indigo-600 group-hover:underline flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                {cpg.cpgRef}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cpg.cpgAmount} • {cpg.bankName || 'SBI'}
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsCreateCpgOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-medium cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Log CPG
                            </button>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {agr ? (
                            <button
                              onClick={() => setSelectedAgreement(agr)}
                              className="text-left group cursor-pointer"
                            >
                              <div className="font-semibold text-teal-600 group-hover:underline flex items-center gap-1">
                                <ScrollText className="w-3.5 h-3.5 text-teal-500" />
                                {agr.agreementRef}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Date: {agr.agreementDate} • {agr.status}
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsCreateAgrOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-medium cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Record Agreement
                            </button>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          {isStage04Ready ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </span>
                          ) : cpg || agr ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded font-medium text-[11px] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View Pipeline
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CPG Bank Guarantees Table */}
      {activeTab === 'cpg' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5">CPG / BG Reference</th>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Issuing Bank</th>
                  <th className="px-5 py-3.5 text-right">Guarantee Amount</th>
                  <th className="px-5 py-3.5">Validity Expiry</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCpgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      No Bank Guarantees found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredCpgs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedCpg(c)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left font-mono transition-colors block"
                        >
                          {c.cpgRef}
                        </button>
                        <div className="text-[11px] text-slate-400 font-sans">
                          Issued {c.cpgDate}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/${c.projectId}`}
                          className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                        >
                          {c.projectCode}
                        </Link>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {c.projectName}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {c.bankName || 'State Bank of India'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          SFMS Confirmed
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900 font-mono">
                        {c.cpgAmount || 'N/A'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {c.validityDate}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            c.status === 'Valid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'Submitted' || c.status === 'Under Verification'
                              ? 'bg-blue-100 text-blue-800'
                              : c.status === 'Released'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedCpg(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 rounded font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Contract Agreements Table */}
      {activeTab === 'agreement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5">Agreement Reference</th>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Linked LOI / LOA</th>
                  <th className="px-5 py-3.5">Agreement Date</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      No Contract Agreements found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgreements.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedAgreement(a)}
                          className="font-bold text-slate-900 hover:text-teal-600 text-left font-mono transition-colors block"
                        >
                          {a.agreementRef}
                        </button>
                        <div className="text-[11px] text-slate-400 font-sans">
                          ID: {a.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/${a.projectId}`}
                          className="font-semibold text-slate-800 hover:text-teal-600 transition-colors"
                        >
                          {a.projectCode}
                        </Link>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {a.projectName}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-700 font-mono">
                          {a.loiLoaNumber || 'N/A'}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {a.agreementDate}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            a.status === 'Executed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'Under Preparation'
                              ? 'bg-blue-100 text-blue-800'
                              : a.status === 'Closed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedAgreement(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 border border-teal-200 rounded font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCpgModal
        isOpen={isCreateCpgOpen}
        onClose={() => setIsCreateCpgOpen(false)}
      />

      <CreateAgreementModal
        isOpen={isCreateAgrOpen}
        onClose={() => setIsCreateAgrOpen(false)}
      />

      <ViewCpgModal
        cpg={selectedCpg}
        isOpen={Boolean(selectedCpg)}
        onClose={() => setSelectedCpg(null)}
      />

      <ViewAgreementModal
        agreement={selectedAgreement}
        isOpen={Boolean(selectedAgreement)}
        onClose={() => setSelectedAgreement(null)}
      />
    </div>
  );
}
