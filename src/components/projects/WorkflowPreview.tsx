'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { Project, WorkflowStageDefinition, WorkflowStageStatus } from '@/types';
import { WORKFLOW_STAGES } from '@/lib/constants';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface WorkflowPreviewProps {
  project: Project;
}

export function WorkflowPreview({ project }: WorkflowPreviewProps) {
  const {
    getTenderByProjectId,
    getLoiLoaByProjectId,
    getAcceptanceByProjectId,
    getCpgByProjectId,
    getAgreementByProjectId,
    getGtpsByProjectId,
    getPosByProjectId,
    getInspectionCallsByProjectId,
    getInspectionOrdersByProjectId,
    getJirsByProjectId,
    getDisByProjectId,
    getMiccsByProjectId,
    getProgressiveBillsByProjectId,
    getFinalBillByProjectId,
    getLatestGtpForBoqItem,
    boqItems,
  } = useProjects();

  const tender = getTenderByProjectId(project.id);
  const loiLoa = getLoiLoaByProjectId(project.id);
  const acceptance = getAcceptanceByProjectId(project.id);
  const cpg = getCpgByProjectId(project.id);
  const agreement = getAgreementByProjectId(project.id);

  const projectGtps = getGtpsByProjectId(project.id);
  const projectPos = getPosByProjectId(project.id);
  const projectCalls = getInspectionCallsByProjectId(project.id);
  const projectOrders = getInspectionOrdersByProjectId(project.id);
  const projectJirs = getJirsByProjectId(project.id);
  const projectDis = getDisByProjectId(project.id);
  const projectMiccs = getMiccsByProjectId(project.id);
  const projectProgressiveBills = getProgressiveBillsByProjectId(project.id);
  const projectFinalBill = getFinalBillByProjectId(project.id);

  const getStageRoute = (stageId: string): string | null => {
    switch (stageId) {
      case '01':
        return '/tenders';
      case '02':
        return '/loi-loa';
      case '03':
        return '/acceptance';
      case '04':
        return '/cpg-agreement';
      case '05':
        return '/gtp';
      case '06':
        return '/po';
      case '07':
        return '/inspection-call';
      case '08':
        return '/inspection-order';
      case '09':
        return '/jir';
      case '10':
        return '/di';
      case '11':
        return '/micc';
      case '12':
        return '/progressive-bill';
      case '13':
        return '/final-bill';
      default:
        return null;
    }
  };

  const getStageStatus = (stageId: string): { status: WorkflowStageStatus; detail?: string } => {
    switch (stageId) {
      case '01':
        if (tender) {
          return {
            status: tender.status === 'Awarded' ? 'Completed' : 'In Progress',
            detail: tender.tenderNumber,
          };
        }
        return { status: 'Not Started' };

      case '02':
        if (loiLoa) {
          return {
            status: loiLoa.status === 'Accepted' || loiLoa.status === 'Received' ? 'Completed' : 'In Progress',
            detail: loiLoa.loiNumber,
          };
        }
        return { status: 'Not Started' };

      case '03':
        if (acceptance) {
          return {
            status: acceptance.status === 'Accepted' ? 'Completed' : 'In Progress',
            detail: acceptance.acceptanceRef,
          };
        }
        return { status: 'Not Started' };

      case '04':
        if (cpg && agreement && cpg.status === 'Valid' && agreement.status === 'Executed') {
          return {
            status: 'Completed',
            detail: `${cpg.cpgRef} / ${agreement.agreementRef}`,
          };
        }
        if (cpg || agreement) {
          return {
            status: 'In Progress',
            detail: cpg ? cpg.cpgRef : agreement?.agreementRef,
          };
        }
        return { status: 'Not Started' };

      case '05': {
        if (projectGtps.length > 0) {
          const pBoq = boqItems.filter((b) => b.projectId === project.id);
          const allApproved = pBoq.length > 0 && pBoq.every((b) => {
            const latest = getLatestGtpForBoqItem(b.id);
            return latest && latest.status === 'Approved';
          });
          return {
            status: allApproved ? 'Completed' : 'In Progress',
            detail: `${projectGtps.length} GTP(s) Submitted`,
          };
        }
        return { status: 'Not Started' };
      }

      case '06': {
        const active = projectPos.filter((p) => p.status !== 'Cancelled');
        if (active.length > 0) {
          const allClosed = active.every((p) => p.status === 'Closed');
          return {
            status: allClosed ? 'Completed' : 'In Progress',
            detail: active[0].poNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '07': {
        const active = projectCalls.filter((c) => c.status !== 'Cancelled');
        if (active.length > 0) {
          const allDone = active.every((c) => c.status === 'Completed');
          return {
            status: allDone ? 'Completed' : 'In Progress',
            detail: active[0].inspectionCallNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '08': {
        const active = projectOrders.filter((o) => o.status !== 'Cancelled');
        if (active.length > 0) {
          const allDone = active.every((o) => o.status === 'Completed');
          return {
            status: allDone ? 'Completed' : 'In Progress',
            detail: active[0].inspectionOrderNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '09': {
        if (projectJirs.length > 0) {
          const hasAccepted = projectJirs.some((j) => j.status === 'Accepted' || j.status === 'Completed');
          return {
            status: hasAccepted ? 'Completed' : 'In Progress',
            detail: projectJirs[0].jirNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '10': {
        const activeDis = projectDis.filter((d) => d.status !== 'Cancelled');
        if (activeDis.length > 0) {
          const hasDispatched = activeDis.some((d) => d.status === 'Dispatched');
          return {
            status: hasDispatched ? 'Completed' : 'In Progress',
            detail: activeDis[0].diNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '11': {
        const activeMiccs = projectMiccs.filter((m) => m.status !== 'Rejected');
        if (activeMiccs.length > 0) {
          const hasVerified = activeMiccs.some((m) => m.status === 'Verified');
          return {
            status: hasVerified ? 'Completed' : 'In Progress',
            detail: activeMiccs[0].miccNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '12': {
        const activeBills = projectProgressiveBills.filter((b) => b.status !== 'Rejected');
        if (activeBills.length > 0) {
          const hasApproved = activeBills.some((b) => b.status === 'Approved');
          return {
            status: hasApproved ? 'Completed' : 'In Progress',
            detail: activeBills[0].billNumber,
          };
        }
        return { status: 'Not Started' };
      }

      case '13': {
        if (projectFinalBill) {
          const isApproved = projectFinalBill.status === 'Approved';
          return {
            status: isApproved ? 'Completed' : 'In Progress',
            detail: projectFinalBill.finalBillNumber,
          };
        }
        return { status: 'Not Started' };
      }

      default: {
        const stageState = project.workflow?.find((w) => w.stageId === stageId);
        if (stageState) return { status: stageState.status };

        const currentNum = parseInt(project.currentStageId, 10);
        const stageNum = parseInt(stageId, 10);
        if (stageNum < currentNum) return { status: 'Completed' };
        if (stageNum === currentNum) return { status: 'In Progress' };
        return { status: 'Not Started' };
      }
    }
  };

  const renderStageItem = (stage: WorkflowStageDefinition) => {
    const route = getStageRoute(stage.id);
    const { status, detail } = getStageStatus(stage.id);

    return (
      <div
        key={stage.id}
        className={`p-3.5 rounded-lg border transition-all relative flex flex-col justify-between ${
          status === 'Completed'
            ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
            : status === 'In Progress'
            ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400/30'
            : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold ${
                  status === 'Completed'
                    ? 'bg-emerald-600 text-white'
                    : status === 'In Progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stage.id}
              </span>
              <h4
                className={`text-xs font-bold ${
                  status === 'In Progress' ? 'text-blue-900' : 'text-slate-900'
                }`}
              >
                {stage.name}
              </h4>
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'In Progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status === 'Completed' ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : status === 'In Progress' ? (
                <Clock className="w-3 h-3 text-blue-600" />
              ) : null}
              {status}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
            {stage.description}
          </p>

          {detail && (
            <div className="mt-2 text-[10px] font-mono text-slate-700 bg-slate-100/80 px-2 py-1 rounded truncate">
              Ref: {detail}
            </div>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
          <span className="text-slate-400 font-mono">Stage {stage.id}/13</span>

          {route ? (
            <Link
              href={route}
              className="font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage Stage</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          ) : (
            <span className="font-semibold text-slate-400">View</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-6">
      {/* Header & Scope Disclaimer */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-editorial">
                Project Workflow Pipeline
              </h3>
              <DemoTag />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous 13-stage turnkey project administration pipeline (01 Tender to 13 Final Bill).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
            Current Stage: {project.currentStageName}
          </span>
        </div>

        {/* Phase 4 Architecture Notice */}
        <div className="mt-3 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-950">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-emerald-950">Phase 4 Complete Pipeline:</strong> All 13 stages (01 Tender through 13 Final Bill) are live, fully interconnected, and synchronized with enterprise project records.
          </span>
        </div>
      </div>

      {/* Continuous 13-Stage Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800 font-editorial">
            Workflow Progression (Stages 01 – 13)
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Stages 01–13 Active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {WORKFLOW_STAGES.map(renderStageItem)}
        </div>
      </div>
    </div>
  );
}
