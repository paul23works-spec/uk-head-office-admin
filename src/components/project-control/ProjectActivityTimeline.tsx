'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import { ProjectActivityEvent } from '@/types';

interface ProjectActivityTimelineProps {
  events: ProjectActivityEvent[];
}

export function ProjectActivityTimeline({ events }: ProjectActivityTimelineProps) {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredEvents = events.filter((ev) => {
    if (selectedStage === 'ALL') return true;
    return ev.stageNumber === selectedStage;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.date || a.timestamp).getTime() || 0;
    const timeB = new Date(b.date || b.timestamp).getTime() || 0;
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="enterprise-card rounded-xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              ACTIVITY TIMELINE
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Derived Operational History
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological log of administrative transactions across all 13 workflow stages.
          </p>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stages ({events.length})</option>
              <option value="01">Stage 01 — Tender</option>
              <option value="02">Stage 02 — LOI / LOA</option>
              <option value="03">Stage 03 — Acceptance</option>
              <option value="04">Stage 04 — CPG + Agreement</option>
              <option value="05">Stage 05 — GTP</option>
              <option value="06">Stage 06 — PO</option>
              <option value="07">Stage 07 — Inspection Call</option>
              <option value="08">Stage 08 — Inspection Order</option>
              <option value="09">Stage 09 — JIR</option>
              <option value="10">Stage 10 — DI</option>
              <option value="11">Stage 11 — MICC</option>
              <option value="12">Stage 12 — Progressive Bill</option>
              <option value="13">Stage 13 — Final Bill</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-700">
            No Activity Events Found
          </h4>
          <p className="text-xs text-slate-500">
            No transactions match the selected stage filter for this project.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {sortedEvents.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white shadow-xs" />

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white group-hover:border-blue-200 group-hover:bg-blue-50/10 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Stage {ev.stageNumber} — {ev.stageName}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {ev.reference}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {ev.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ev.date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {ev.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">{ev.type}</span>
                  <Link
                    href={ev.navigationHref}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
