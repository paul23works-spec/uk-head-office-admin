'use client';

import React, { useState, useEffect } from 'react';
import { useActiveDelegation, DelegatedCoverage } from '@/hooks/useActiveDelegation';
import { UserCheck, X, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function DelegationToast() {
  const { coverages, hasActiveDelegation } = useActiveDelegation();
  const [unnotifiedCoverage, setUnnotifiedCoverage] = useState<DelegatedCoverage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasActiveDelegation || coverages.length === 0) {
      setIsVisible(false);
      setUnnotifiedCoverage(null);
      return;
    }

    // Check if there is an active delegation that hasn't been notified in this browser session
    if (typeof window !== 'undefined') {
      for (const cov of coverages) {
        const key = `delegation_notified_${cov.delegation.id}`;
        if (!sessionStorage.getItem(key)) {
          // Found an unnotified delegation
          setUnnotifiedCoverage(cov);
          setIsVisible(true);
          // Mark as notified in sessionStorage for this browser session
          sessionStorage.setItem(key, 'true');
          break;
        }
      }
    }
  }, [coverages, hasActiveDelegation]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible]);

  if (!isVisible || !unnotifiedCoverage) {
    return null;
  }

  const { delegation, grantor, grantorRole, delegatedStageIds } = unnotifiedCoverage;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="bg-[#0A192F] text-white rounded-xl shadow-2xl border border-amber-400/40 p-4 relative overflow-hidden backdrop-blur-md">
        {/* Amber accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

        <div className="flex items-start gap-3 mt-1">
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Delegated Coverage Active
              </span>
            </div>

            <p className="text-sm font-semibold text-white mt-1">
              Acting on Behalf of {grantor?.name || 'Authorized Grantor'}
            </p>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              You have been granted temporary administrative authorization for{' '}
              <span className="font-semibold text-amber-300">{grantorRole}</span> duties.
            </p>

            <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {formatDate(delegation.startDate)} – {formatDate(delegation.endDate)}
              </span>
              <span>•</span>
              <span className="text-amber-200">
                {delegatedStageIds.length} Stage{delegatedStageIds.length === 1 ? '' : 's'} Covered
              </span>
            </div>

            {delegation.reason && (
              <p className="text-[11px] text-slate-400 italic mt-1.5 truncate">
                Reason: &ldquo;{delegation.reason}&rdquo;
              </p>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsVisible(false)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>View delegated stages on Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setIsVisible(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-1"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
