'use client';

import React from 'react';
import { Clock, User, Activity as ActivityIcon } from 'lucide-react';
import { Activity } from '@/types';
import { DemoTag } from '../common/Badge';

interface ActivityTimelineProps {
  activities: Activity[];
  projectId: string;
}

export function ActivityTimeline({ activities, projectId }: ActivityTimelineProps) {
  // Filter activities for this project or general events
  const projectActivities = activities.filter(
    (a) => a.projectId === projectId || a.projectId === 'ALL'
  );

  // If none exist specifically, provide standard demo events as requested in prompt
  const displayActivities =
    projectActivities.length > 0
      ? projectActivities
      : [
          {
            id: 'ACT-D1',
            projectId,
            user: 'Prastab Raaj (Project Executive)',
            action: 'Status changed: Under administrative execution',
            timestamp: 'Today at 10:15 AM',
            environment: 'DEMO' as const,
            details: 'Status reviewed for scheduled monthly administrative reporting.',
          },
          {
            id: 'ACT-D2',
            projectId,
            user: 'Prastab Raaj (Project Executive)',
            action: 'Document placeholder added: Technical Drawings Rev 2',
            timestamp: 'Yesterday at 04:30 PM',
            environment: 'DEMO' as const,
            details: 'Placeholder entry created for drawing schedule.',
          },
          {
            id: 'ACT-D3',
            projectId,
            user: 'Er. Sanjib Baruah (Project Manager)',
            action: 'Project information updated: Expected completion milestone confirmed',
            timestamp: '14 May 2024 at 02:20 PM',
            environment: 'DEMO' as const,
            details: 'Updated timeline following review of civil foundation readiness.',
          },
          {
            id: 'ACT-D4',
            projectId,
            user: 'System Admin (Initial Setup)',
            action: 'Project created: Initial registration logged in demo environment',
            timestamp: '10 Nov 2023 at 09:00 AM',
            environment: 'DEMO' as const,
            details: 'Administrative project master record initialized with contract value and scope.',
          },
        ];

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Audit &amp; Activity Timeline
            </h3>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological audit trail of project modifications and administrative actions
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Environment: <span className="font-bold text-amber-700">DEMO</span>
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {displayActivities.map((act) => (
          <div key={act.id} className="relative group">
            {/* Timeline bullet */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            </div>

            {/* Content card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{act.action}</span>
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{act.timestamp}</span>
                </div>
              </div>

              {act.details && (
                <p className="text-xs text-slate-600 mt-1">
                  {act.details}
                </p>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{act.user}</span>
                </div>
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  DEMO RECORD
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
