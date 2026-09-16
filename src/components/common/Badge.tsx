import React from 'react';
import { ProjectStatus, ActionPriority } from '@/types';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  switch (status) {
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          In Progress
        </span>
      );
    case 'Attention Required':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Attention Required
        </span>
      );
    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Completed
        </span>
      );
    case 'On Hold':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          On Hold
        </span>
      );
    case 'Not Started':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Not Started
        </span>
      );
  }
}

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  switch (priority) {
    case 'High':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          High Priority
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Low
        </span>
      );
  }
}

export function DemoTag({ label = 'DEMO DATA' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold bg-amber-100/70 text-amber-900 border border-amber-300">
      <span className="w-1 h-1 rounded-full bg-amber-700"></span>
      {label}
    </span>
  );
}

export function EnvironmentBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A192F] text-amber-400 text-xs font-semibold tracking-wide border border-amber-500/40 shadow-xs">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
      <span>DEMO / PHASE 2</span>
    </div>
  );
}
