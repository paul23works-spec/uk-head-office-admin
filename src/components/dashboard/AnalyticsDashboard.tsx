'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  CheckCircle2,
  ListTree,
  BellRing,
  ShoppingCart,
  Filter,
  RefreshCw
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type AnalyticsMetrics = {
  projects: { total: number; byStatus: { status: string; count: number }[] };
  stages: { total: number; byStatus: { status: string; count: number }[] };
  actionItems: { total: number; overdue: number; byStatus: { status: string; count: number }[] };
  documents: { total: number; byType: { type: string; count: number }[]; byStatus: { status: string; count: number }[] };
  organizations: { total: number; byType: { type: string; count: number }[] };
  boq: { totalItems: number; totalValue: number };
  communications: {
    notifications: { total: number; byStatus: { status: string; count: number }[] };
    logs: { total: number; byDirection: { direction: string; count: number }[] };
  };
};

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters State
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    stageCode: '',
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.projectId) query.append('projectId', filters.projectId);
      if (filters.status) query.append('status', filters.status);
      if (filters.stageCode) query.append('stageCode', filters.stageCode);

      const response = await fetch(`/api/analytics/dashboard?${query.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  if (loading && !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-3 text-slate-500 animate-pulse">
          <Activity className="w-6 h-6 animate-spin" />
          <span className="font-medium text-lg">Loading Analytics Data...</span>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <span className="font-medium">Error loading dashboard: {error}</span>
      </div>
    );
  }

  const activeProjects = metrics.projects.byStatus.find(s => s.status === 'ACTIVE')?.count || 0;
  const overdueActions = metrics.actionItems.overdue;

  // Chart Formatting Data
  const projectStatusData = metrics.projects.byStatus.map(s => ({ name: s.status, value: s.count }));
  const stageStatusData = metrics.stages.byStatus.map(s => ({ name: s.status, count: s.count }));
  const documentTypeData = metrics.documents.byType.map(d => ({ name: d.type, value: d.count }));
  const actionStatusData = metrics.actionItems.byStatus.map(s => ({ name: s.status, count: s.count }));

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex h-full min-h-[250px] items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
      <span className="text-sm font-medium">{message}</span>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Management Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time enterprise intelligence and operational overview.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button 
            onClick={() => fetchAnalytics()}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Projects"
          value={metrics.projects.total}
          subtitle={`${activeProjects} Active Projects`}
          icon={FolderKanban}
          variant="blue"
          trend="+5% MoM"
        />
        <KpiCard
          title="Documents Processed"
          value={metrics.documents.total}
          subtitle="All workflow stages"
          icon={FileSpreadsheet}
          variant="navy"
        />
        <KpiCard
          title="Overdue Actions"
          value={overdueActions}
          subtitle="Requires immediate attention"
          icon={AlertTriangle}
          variant={overdueActions > 0 ? "amber" : "emerald"}
        />
        <KpiCard
          title="BOQ Total Value"
          value={`₹${(metrics.boq.totalValue / 10000000).toFixed(2)} Cr`}
          subtitle={`${metrics.boq.totalItems} Items across projects`}
          icon={ShoppingCart}
          variant="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-500" />
            Project Status Distribution
          </h3>
          <div className="flex-1 min-h-[300px]">
            {projectStatusData.length === 0 ? (
              <EmptyState message="No projects found." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} Projects`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workflow Stage Progression */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-6 flex items-center">
            <ListTree className="w-5 h-5 mr-2 text-cyan-500" />
            Stage-Wise Progression
          </h3>
          <div className="flex-1 min-h-[300px]">
            {stageStatusData.length === 0 ? (
              <EmptyState message="No workflow stages initialized." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name="Stages" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Document Classification */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-6 flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-emerald-500" />
            Document Intelligence Classification
          </h3>
          <div className="flex-1 min-h-[300px]">
            {documentTypeData.length === 0 ? (
              <EmptyState message="No documents classified yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} name="Documents" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Activity & Communications */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-6 flex items-center">
            <BellRing className="w-5 h-5 mr-2 text-amber-500" />
            Action Items & Notifications
          </h3>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Action Items</span>
              {actionStatusData.length === 0 ? (
                <span className="text-sm text-slate-400 m-auto">No Actions</span>
              ) : (
                <div className="space-y-3 mt-auto">
                  {actionStatusData.map((a, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 capitalize">{a.name.toLowerCase()}</span>
                      <span className="text-sm font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{a.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Communications</span>
              {metrics.communications.logs.total === 0 && metrics.communications.notifications.total === 0 ? (
                <span className="text-sm text-slate-400 m-auto">No Comm Logs</span>
              ) : (
                <div className="space-y-3 mt-auto">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Notifications</span>
                      <span className="text-sm font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{metrics.communications.notifications.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Webhook Logs</span>
                      <span className="text-sm font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{metrics.communications.logs.total}</span>
                    </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
