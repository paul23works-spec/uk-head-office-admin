import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DemoTag } from '../common/Badge';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'blue' | 'amber' | 'emerald' | 'navy';
  trend?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend,
}: KpiCardProps) {
  const accentClasses = {
    navy: 'border-l-4 border-l-slate-700 bg-white',
    blue: 'border-l-4 border-l-blue-600 bg-white',
    amber: 'border-l-4 border-l-amber-500 bg-white',
    emerald: 'border-l-4 border-l-emerald-600 bg-white',
  };

  const iconBgClasses = {
    navy: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div
      className={`enterprise-card rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow ${accentClasses[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            <DemoTag />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 font-editorial">
            {value}
          </div>
        </div>

        <div className={`p-2.5 rounded-lg shrink-0 ${iconBgClasses[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {trend && (
          <span className="font-mono text-[11px] font-semibold text-slate-600">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
