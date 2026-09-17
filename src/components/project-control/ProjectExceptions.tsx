'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ProjectException, ExceptionSeverity } from '@/types';

interface ProjectExceptionsProps {
  exceptions: ProjectException[];
}

export function ProjectExceptions({ exceptions }: ProjectExceptionsProps) {
  const getSeverityBadge = (severity: ExceptionSeverity) => {
    switch (severity) {
      case 'Attention':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Attention
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Pending
          </span>
        );
      case 'Info':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Info className="w-3 h-3 text-slate-400" />
            Informational
          </span>
        );
    }
  };

  return (
    <div className="enterprise-card rounded-xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              OPERATIONAL EXCEPTIONS
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Attention Conditions & Bottlenecks
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Factual conditions requiring administrative notice: unfulfilled dispatch clearances, inward backlogs, or rejected records.
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          {exceptions.length} Item{exceptions.length === 1 ? '' : 's'}
        </span>
      </div>

      {exceptions.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800">
            No Operational Exceptions Detected
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All dispatch quantities, site verification records, and billing claims are cleanly aligned with upstream records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                exc.severity === 'Attention'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Stage {exc.stageNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {exc.title}
                  </span>
                  {getSeverityBadge(exc.severity)}
                  {exc.reference && (
                    <span className="font-mono text-[11px] text-slate-500">
                      Ref: {exc.reference}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {exc.description}
                </p>
              </div>

              {exc.actionUrl && (
                <Link
                  href={exc.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 shrink-0 self-start sm:self-auto"
                >
                  <span>{exc.actionText || 'View'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
