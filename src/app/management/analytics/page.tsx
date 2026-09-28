import React from 'react';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export default function ManagementAnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-editorial">
            Reports &amp; Analytics
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Enterprise-level business intelligence and operational oversight.
          </p>
        </div>
      </div>
      
      <div className="mt-2">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
