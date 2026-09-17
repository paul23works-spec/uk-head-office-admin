'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { ProjectSearchResult } from '@/types';

interface ProjectSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectCode: string;
  onSearch: (query: string) => ProjectSearchResult[];
}

export function ProjectSearchModal({
  isOpen,
  onClose,
  projectName,
  projectCode,
  onSearch,
}: ProjectSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return onSearch(query);
  }, [query, onSearch]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="p-4 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {projectCode}
              </span>
              <span className="text-xs font-bold text-slate-700">
                Cross-Module Project Record Search
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference numbers, materials, vendors, descriptions, status..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Searching strictly within records belonging to: <strong className="text-slate-700 font-medium">{projectName}</strong></span>
            {results.length > 0 && (
              <span className="font-semibold text-blue-700">{results.length} result{results.length === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 divide-y divide-slate-100 flex-1">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Type a keyword or reference to search all 13 stages</p>
              <p className="text-[11px] text-slate-400">
                Examples: PO number, DI number, transformer, vendor name, approved
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No project records found</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                No matching transactional records found for &ldquo;{query}&rdquo; in this project.
              </p>
            </div>
          ) : (
            results.map((res) => (
              <Link
                key={res.id}
                href={res.navigationHref}
                onClick={onClose}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-blue-50/40 rounded-lg transition-colors group block"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Stage {res.stageNumber}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      {res.reference}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {res.type}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {res.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {res.description}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {res.date}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                  <span>Open</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Project isolation: Project A records never appear in Project B search</span>
          <button
            onClick={handleClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
