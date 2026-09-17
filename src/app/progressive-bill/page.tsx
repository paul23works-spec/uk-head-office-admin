'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateProgressiveBillModal } from '@/components/progressive-bill/CreateProgressiveBillModal';
import { ViewProgressiveBillModal } from '@/components/progressive-bill/ViewProgressiveBillModal';
import { ProgressiveBillRecord } from '@/types';

export default function ProgressiveBillPage() {
  const { progressiveBills, projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingBill, setViewingBill] = useState<ProgressiveBillRecord | null>(null);

  // Filter
  const filteredBills = progressiveBills.filter((b) => {
    if (selectedProjectId !== 'ALL' && b.projectId !== selectedProjectId) return false;
    if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.billNumber.toLowerCase().includes(q) ||
        b.projectCode.toLowerCase().includes(q) ||
        b.projectName.toLowerCase().includes(q) ||
        b.remarks.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const approvedBills = progressiveBills.filter(
    (b) => b.status === 'Approved' || b.status === 'Partially Approved'
  );
  const totalApprovedAmount = approvedBills.reduce(
    (sum, b) => sum + (Number(b.currentApprovedAmount) || 0),
    0
  );
  const totalClaimedAmount = progressiveBills.reduce(
    (sum, b) => sum + (Number(b.currentClaimedAmount) || 0),
    0
  );
  const pendingReviewAmount = progressiveBills
    .filter((b) => b.status === 'Submitted' || b.status === 'Under Review')
    .reduce((sum, b) => sum + (Number(b.currentClaimedAmount) || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Approved':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider font-mono">
              STAGE 12
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Progressive Billing (RA Bills) / Interim Invoices
            </h1>
            <DemoTag label="STAGE 12 DATA" />
            <EnvironmentBadge phase="PHASE 4" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Running Account (RA) interim billing certified against verified MICCs with strict claimed vs. approved separation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate RA Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Invoices Raised</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {progressiveBills.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Running account bill records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Certified &amp; Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
            ₹{totalApprovedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Certified for payment release</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            ₹{pendingReviewAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Under verification scrutiny</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Claimed Value</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">
            ₹{totalClaimedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Aggregate of all line claims</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Bill #, project, remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Partially Approved">Partially Approved</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bill Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Bill Number</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Claimed Amount (₹)</th>
                <th className="py-3 px-4 text-right">Approved Amount (₹)</th>
                <th className="py-3 px-4 text-right">Cumulative Approved (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No progressive bill records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                      {bill.billNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{bill.projectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{bill.projectCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {bill.lineItems?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 font-mono">
                      ₹{bill.currentClaimedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      ₹{bill.currentApprovedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ₹{bill.cumulativeApprovedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {bill.billDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          bill.status
                        )}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingBill(bill)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Progressive Bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateProgressiveBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewProgressiveBillModal
        isOpen={!!viewingBill}
        onClose={() => setViewingBill(null)}
        bill={viewingBill}
      />
    </div>
  );
}
