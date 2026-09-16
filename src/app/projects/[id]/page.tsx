'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Layers,
  Activity as ActivityIcon,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Lock,
  ListTree,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { StatusBadge, DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { WorkflowPreview } from '@/components/projects/WorkflowPreview';
import { ActivityTimeline } from '@/components/projects/ActivityTimeline';
import { DocumentsPlaceholder } from '@/components/projects/DocumentsPlaceholder';
import { ProjectStatus } from '@/types';

type TabKey = 'overview' | 'progress' | 'documents' | 'activity';

export default function ProjectDetailPage() {
  const params = useParams();
  const {
    getProject,
    updateProjectStatus,
    activities,
    getStageAProgress,
    getStageBProgress,
    getTenderByProjectId,
    getLoiLoaByProjectId,
    getAcceptanceByProjectId,
    getCpgByProjectId,
    getAgreementByProjectId,
    gtps,
    pos,
    inspectionCalls,
    inspectionOrders,
    jirs,
  } = useProjects();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const projectId = params?.id ? String(params.id) : '';
  const project = getProject(projectId);

  if (!project) {
    return (
      <div className="enterprise-card rounded-xl p-12 text-center border border-slate-200 bg-white max-w-xl mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 font-editorial">
          Project Record Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested project code or identifier &ldquo;{projectId}&rdquo; could not be located in the demo register.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Directory</span>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProjectStatus(
      project.id,
      newStatus,
      `Status updated to ${newStatus} via project control console.`
    );
  };

  const stageA = getStageAProgress(project.id);
  const stageB = getStageBProgress(project.id);
  const tender = getTenderByProjectId(project.id);
  const loiLoa = getLoiLoaByProjectId(project.id);
  const acceptance = getAcceptanceByProjectId(project.id);
  const cpg = getCpgByProjectId(project.id);
  const agreement = getAgreementByProjectId(project.id);

  const projectGtps = gtps.filter((g) => g.projectId === project.id);
  const projectPos = pos.filter((p) => p.projectId === project.id);
  const projectCalls = inspectionCalls.filter((c) => c.projectId === project.id);
  const projectOrders = inspectionOrders.filter((o) => o.projectId === project.id);
  const projectJirs = jirs.filter((j) => j.projectId === project.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects Directory</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700">{project.code}</span>
        </div>

        <div className="flex items-center gap-2">
          <EnvironmentBadge />
          <DemoTag />
        </div>
      </div>

      {/* Hero Project Banner */}
      <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                {project.code}
              </span>
              <StatusBadge status={project.status} size="md" />
              <span className="text-xs font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                Stage {project.currentStageName}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-editorial">
              {project.name}
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              {project.remarks}
            </p>
          </div>

          {/* Quick Status Control */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5 shrink-0 self-start">
            <span className="text-[11px] font-semibold text-slate-500">
              Quick Administrative Status:
            </span>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              className="text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="In Progress">In Progress</option>
              <option value="Attention Required">Attention Required</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
        </div>

        {/* 10 Required Project Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Client</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5" title={project.client}>
              {project.client}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Location</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5" title={project.location}>
              {project.location}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Project Manager</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5">
              {project.projectManager}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Contract Value</span>
            <span className="font-bold text-slate-900 font-editorial text-sm block mt-0.5">
              {project.contractValue}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Start Date</span>
            <span className="font-mono text-slate-700 block mt-0.5">
              {project.startDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Expected Completion</span>
            <span className="font-mono text-slate-700 block mt-0.5">
              {project.expectedCompletion}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold" aria-label="Project tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'progress'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workflow Pipeline (Stages 01–13)</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Project Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ActivityIcon className="w-4 h-4" />
            <span>Activity Timeline</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Contract Details & Phase 2 Admin Foundation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phase 2 Administrative Foundation Module Status */}
              <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        PHASE 2
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-editorial">
                        Administrative Foundation (Stages 01–04)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Direct tracking of Tender, LOI/LOA, Acceptance, and CPG + Agreement for this project.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {stageA.completedCount} of {stageA.totalCount} Complete
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stageA.percentage}% Progression
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-xs font-mono text-blue-700 bg-blue-50/50">
                      {stageA.percentage}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stageA.percentage}%` }}
                  />
                </div>

                {/* 4 Active Module Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Stage 01 Tender */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          01 Tender
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            tender
                              ? tender.status === 'Awarded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tender ? tender.status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {tender ? tender.tenderNumber : 'No Tender Record'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tender ? `NIT Ref • ${tender.client}` : 'Tender submission record'}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/tenders"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{tender ? 'View in Register' : '+ Register Tender'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 02 LOI / LOA */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          02 LOI / LOA
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            loiLoa
                              ? loiLoa.status === 'Accepted' || loiLoa.status === 'Received'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {loiLoa ? loiLoa.status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {loiLoa ? loiLoa.loiNumber : 'No LOI / LOA Record'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {loiLoa ? `${loiLoa.contractValue} • Issued ${loiLoa.date}` : 'Contract Award Letter'}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/loi-loa"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{loiLoa ? 'View in Register' : '+ Log LOI / LOA'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 03 Acceptance */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          03 Acceptance
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            acceptance
                              ? acceptance.status === 'Accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {acceptance ? acceptance.status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {acceptance ? acceptance.acceptanceRef : 'No Acceptance Filed'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {acceptance ? `Filed ${acceptance.acceptanceDate}` : 'Unconditional acceptance letter'}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/acceptance"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{acceptance ? 'View Acceptance' : '+ File Acceptance'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 04 CPG + Agreement */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          04 CPG + Agreement
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            cpg && agreement
                              ? 'bg-emerald-100 text-emerald-800'
                              : cpg || agreement
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {cpg && agreement ? 'Complete' : cpg || agreement ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {cpg ? `BG: ${cpg.cpgRef}` : 'CPG: Not Lodged'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
                        {agreement ? `Agr: ${agreement.agreementRef}` : 'Agr: Pending Execution'}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/cpg-agreement"
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <span>Manage Stage 04</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 3 Active: Procurement & Inspection Foundation (Stages 05–09) + BOQ */}
              <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        PHASE 3
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-editorial">
                        Procurement &amp; Inspection Foundation (Stages 05–09)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      BOQ baseline, GTP approval, Purchase Orders, Inspection Calls, Inspection Orders, and JIR reports.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {stageB.boqItemCount} BOQ Items (₹{stageB.boqTotalValue.toLocaleString('en-IN')})
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stageB.percentage}% Progression
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-xs font-mono text-amber-700 bg-amber-50/50">
                      {stageB.percentage}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stageB.percentage}%` }}
                  />
                </div>

                {/* BOQ Summary Pill / Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-amber-200/80 bg-amber-50/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100/80 text-amber-800">
                      <ListTree className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Project Bill of Quantities (BOQ)</div>
                      <div className="text-[11px] text-slate-500">
                        {stageB.boqItemCount} registered items • ₹{stageB.boqTotalValue.toLocaleString('en-IN')} total estimated value
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/boq"
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-amber-200 self-start sm:self-auto hover:border-amber-300 transition-colors shadow-xs"
                  >
                    <span>Manage BOQ Items</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* 5 Stage Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {/* Stage 05 GTP */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          05 GTP
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            projectGtps.length > 0 && projectGtps[0].status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : projectGtps.length > 0 && (projectGtps[0].status === 'Submitted' || projectGtps[0].status === 'Under Review')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {projectGtps.length > 0 ? projectGtps[0].status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {projectGtps.length > 0 ? `${projectGtps.length} Submissions (${projectGtps[0].gtpNumber})` : 'No GTP Record'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Guaranteed technical parameters
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/gtp"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{projectGtps.length > 0 ? 'View in Register' : '+ Submit GTP'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 06 PO */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          06 PO
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            projectPos.length > 0 && (projectPos[0].status === 'Issued' || projectPos[0].status === 'Acknowledged')
                              ? 'bg-emerald-100 text-emerald-800'
                              : projectPos.length > 0 && projectPos[0].status === 'Draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {projectPos.length > 0 ? projectPos[0].status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {projectPos.length > 0 ? `${projectPos.length} Orders (${projectPos[0].poNumber})` : 'No PO Issued'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Purchase orders to vendors
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/po"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{projectPos.length > 0 ? 'View in Register' : '+ Issue PO'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 07 Inspection Call */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          07 Inspection Call
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            projectCalls.length > 0 && (projectCalls[0].status === 'Scheduled' || projectCalls[0].status === 'Completed')
                              ? 'bg-emerald-100 text-emerald-800'
                              : projectCalls.length > 0 && (projectCalls[0].status === 'Submitted' || projectCalls[0].status === 'Under Review')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {projectCalls.length > 0 ? projectCalls[0].status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {projectCalls.length > 0 ? `${projectCalls.length} Calls (${projectCalls[0].inspectionCallNumber})` : 'No Call Raised'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Factory inspection notifications
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/inspection-call"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{projectCalls.length > 0 ? 'View in Register' : '+ Raise Call'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 08 Inspection Order */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          08 Inspection Order
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            projectOrders.length > 0 && (projectOrders[0].status === 'Issued' || projectOrders[0].status === 'Scheduled' || projectOrders[0].status === 'Completed')
                              ? 'bg-emerald-100 text-emerald-800'
                              : projectOrders.length > 0 && projectOrders[0].status === 'Draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {projectOrders.length > 0 ? projectOrders[0].status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {projectOrders.length > 0 ? `${projectOrders.length} Orders (${projectOrders[0].inspectionOrderNumber})` : 'No Order Issued'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Deputation of inspecting agency
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/inspection-order"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{projectOrders.length > 0 ? 'View in Register' : '+ Issue Order'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stage 09 JIR */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          09 JIR / Report
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            projectJirs.length > 0 && projectJirs[0].status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : projectJirs.length > 0 && projectJirs[0].status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : projectJirs.length > 0 && projectJirs[0].status === 'Partially Accepted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {projectJirs.length > 0 ? projectJirs[0].status : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-2 font-mono truncate">
                        {projectJirs.length > 0 ? `${projectJirs.length} Reports (${projectJirs[0].jirNumber})` : 'No JIR Recorded'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Joint inspection findings &amp; results
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <Link
                        href="/jir"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span>{projectJirs.length > 0 ? 'View in Register' : '+ Record JIR'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract & Administrative Parameters */}
              <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-editorial border-b border-slate-100 pb-3">
                  Contract &amp; Administrative Parameters
                </h3>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-xs">
                  <div>
                    <dt className="text-slate-400 font-medium">Department / Nodal Authority</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{project.department}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Tender Reference / NIT</dt>
                    <dd className="font-mono font-semibold text-slate-800 mt-0.5">{project.tenderRef}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Site Location &amp; Circle</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{project.location}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Project Manager / In-Charge</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{project.projectManager}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Contract Value (Agreed Sum)</dt>
                    <dd className="font-bold text-slate-900 font-editorial text-sm mt-0.5">{project.contractValue}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Project Record Created Date</dt>
                    <dd className="font-mono text-slate-700 mt-0.5">{project.createdAt}</dd>
                  </div>
                </dl>
              </div>

              {/* Scope & Remarks */}
              <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-3">
                <h3 className="text-base font-bold text-slate-900 font-editorial border-b border-slate-100 pb-3">
                  Scope of Work &amp; Execution Remarks
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {project.remarks}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Last Administrative Update: <strong className="text-slate-600">{project.updatedAt}</strong></span>
                  <span className="font-mono">Record ID: {project.id}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Stage Overview & Workflow Snapshot */}
            <div className="space-y-6">
              <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-editorial border-b border-slate-100 pb-3">
                  Current Execution Stage
                </h3>

                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      Stage {project.currentStageId}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700">
                      Stage {project.currentStageId} of 13
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 font-editorial">
                    {project.currentStageName}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {parseInt(project.currentStageId, 10) <= 9
                      ? 'Live Phase 2/3 administrative, procurement & inspection module connected and active.'
                      : 'Future operational stage. Stage preview mode.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('progress')}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>View Full 13-Stage Pipeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Locked Subsequent Stages Panel */}
              <div className="rounded-xl p-5 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Subsequent Stages (10 – 13)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Stages 10 DI through 13 Final Bill are reserved for Phase 4 development and remain locked.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['10 DI', '11 MICC', '12 Prog Bill', '13 Final Bill'].map(
                    (s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-600 font-mono font-medium"
                      >
                        {s}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <WorkflowPreview project={project} />
        )}

        {activeTab === 'documents' && (
          <DocumentsPlaceholder projectId={project.id} />
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline activities={activities} projectId={project.id} />
        )}
      </div>
    </div>
  );
}
