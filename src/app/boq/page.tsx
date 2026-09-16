'use client';

import React, { useState } from 'react';
import {
  ListTree,
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateBoqModal } from '@/components/boq/CreateBoqModal';
import { ViewBoqModal } from '@/components/boq/ViewBoqModal';
import { BoqItem } from '@/types';

export default function BoqPage() {
  const { boqItems, projects, getRemainingBoqQuantity } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingBoqItem, setViewingBoqItem] = useState<BoqItem | null>(null);

  // Filter items
  const filteredItems = boqItems.filter((item) => {
    if (selectedProjectId !== 'ALL' && item.projectId !== selectedProjectId) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.itemNumber.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        (item.vendorName && item.vendorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // KPI Calculations
  const totalValue = boqItems.reduce((sum, item) => sum + item.amount, 0);
  const unassignedVendorCount = boqItems.filter((i) => !i.vendorId).length;
  const fullyOrderedCount = boqItems.filter((i) => getRemainingBoqQuantity(i.id) === 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider font-mono">
              STAGE B FOUNDATION
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Bill of Quantities (BOQ) Master
            </h1>
            <DemoTag label="B ADMIN DATA" />
            <EnvironmentBadge phase="PHASE 3" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contract bill of quantities, item rates, vendor assignments, and downstream balance tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add BOQ Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total BOQ Items</span>
            <ListTree className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {boqItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across {projects.length} turnkey projects</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Contract BOQ Value</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-mono">
            ₹ {(totalValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-400 mt-1">₹ {totalValue.toLocaleString('en-IN')} total</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unassigned Vendor Items</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
            {unassignedVendorCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vendor optional at creation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fully Ordered Items</span>
            <PackageCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 font-mono">
            {fullyOrderedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">0 remaining callable balance</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by item no, description, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="Transformers">Transformers</option>
            <option value="Switchgear">Switchgear</option>
            <option value="Conductors & Cables">Conductors & Cables</option>
            <option value="Towers & Substation Structures">Towers</option>
            <option value="Civil & Foundation">Civil</option>
          </select>
        </div>
      </div>

      {/* BOQ Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item #</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Linked Vendor</th>
                <th className="px-4 py-3 text-right">BOQ Qty</th>
                <th className="px-4 py-3 text-right">Unit Rate</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Remaining Balance</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No BOQ items found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const remaining = getRemainingBoqQuantity(item.id);
                  const isDepleted = remaining === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {item.itemNumber}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={item.description}>
                          {item.description}
                        </div>
                        {item.specification && (
                          <div className="text-[10px] text-slate-400 truncate" title={item.specification}>
                            {item.specification}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.projectCode}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.vendorName ? (
                          <span className="text-slate-800 font-medium truncate max-w-[150px] inline-block">
                            {item.vendorName}
                          </span>
                        ) : (
                          <span className="text-amber-700 text-[10px] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                        {item.quantity} <span className="text-[10px] text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        ₹ {item.rate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">
                        ₹ {item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            isDepleted
                              ? 'text-slate-400'
                              : remaining < item.quantity
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {remaining} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setViewingBoqItem(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateBoqModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewBoqModal
        isOpen={!!viewingBoqItem}
        onClose={() => setViewingBoqItem(null)}
        boqItem={viewingBoqItem || undefined}
      />
    </div>
  );
}
