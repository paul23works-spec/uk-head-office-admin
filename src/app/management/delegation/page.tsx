'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Plus, Calendar, Clock, UserCheck, XCircle } from 'lucide-react';
import { delegationStore, Delegation, Leave } from '@/lib/delegation-store';
import { USERS } from '@/lib/permissions';

export default function DelegationManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<'leaves' | 'delegations'>('leaves');
  
  // Forms state
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [isAddingDelegation, setIsAddingDelegation] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'MASTER') {
        router.push('/');
      } else {
        refreshData();
      }
    }
  }, [user, isLoading, router]);

  const refreshData = () => {
    setDelegations(delegationStore.getAllDelegations().reverse());
    setLeaves(delegationStore.getAllLeaves().reverse());
  };

  const handleRevokeDelegation = (id: string) => {
    delegationStore.revokeDelegation(id);
    refreshData();
  };

  const handleCancelLeave = (id: string) => {
    delegationStore.cancelLeave(id);
    refreshData();
  };

  if (isLoading || !user || user.role !== 'MASTER') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
          <ShieldAlert className="w-8 h-8" />
          <p>Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-editorial text-slate-900 flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Leave & Delegation Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage employee leaves and temporary role delegations.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
              ${activeTab === 'leaves' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
            `}
          >
            <Calendar className="w-4 h-4" />
            Employee Leaves
          </button>
          <button
            onClick={() => setActiveTab('delegations')}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2
              ${activeTab === 'delegations' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
            `}
          >
            <UserCheck className="w-4 h-4" />
            Active Delegations
          </button>
        </nav>
      </div>

      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingLeave(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Leave
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No leave records found.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => {
                    const isActive = leave.status === 'ACTIVE';
                    return (
                      <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{leave.employeeName}</div>
                          <div className="text-xs text-slate-500 mt-1">{leave.role}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {formatDate(leave.startDate)} <span className="text-slate-400 mx-1">to</span> {formatDate(leave.endDate)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{leave.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'delegations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingDelegation(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Delegate Authority
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Grantor (On Leave)</th>
                  <th className="px-6 py-4">Grantee (Acting)</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delegations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No delegation records found.
                    </td>
                  </tr>
                ) : (
                  delegations.map((del) => {
                    const isActive = del.status === 'ACTIVE';
                    const grantor = USERS.find(u => u.employeeId === del.grantorId);
                    const grantee = USERS.find(u => u.employeeId === del.granteeId);
                    
                    return (
                      <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{grantor?.name || del.grantorId}</div>
                          <div className="text-xs text-slate-500 mt-1">{grantor?.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-indigo-700">{grantee?.name || del.granteeId}</div>
                          <div className="text-xs text-indigo-500 mt-1">{grantee?.role}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {formatDate(del.startDate)} <span className="text-slate-400 mx-1">to</span> {formatDate(del.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {del.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleRevokeDelegation(del.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Basic Create Modals for Prototype */}
      {isAddingLeave && (
        <CreateLeaveModal 
          onClose={() => setIsAddingLeave(false)} 
          onSuccess={() => { setIsAddingLeave(false); refreshData(); }} 
        />
      )}
      
      {isAddingDelegation && (
        <CreateDelegationModal 
          onClose={() => setIsAddingDelegation(false)} 
          onSuccess={() => { setIsAddingDelegation(false); refreshData(); }}
          currentUser={user}
        />
      )}
    </div>
  );
}

function CreateLeaveModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [empId, setEmpId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = USERS.find(u => u.employeeId === empId);
    if (!emp) return alert('Employee not found');
    
    delegationStore.createLeave(emp.employeeId, emp.name, emp.role, startDate, endDate, reason);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Register Leave</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
            <select required value={empId} onChange={e => setEmpId(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Select employee...</option>
              {USERS.filter(u => u.role !== 'MASTER').map(u => (
                <option key={u.id} value={u.employeeId}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <input type="text" required value={reason} onChange={e => setReason(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save Leave</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateDelegationModal({ onClose, onSuccess, currentUser }: { onClose: () => void, onSuccess: () => void, currentUser: any }) {
  const [grantorId, setGrantorId] = useState('');
  const [granteeId, setGranteeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (grantorId === granteeId) return alert('Cannot self-delegate');
    
    delegationStore.createDelegation(grantorId, granteeId, startDate, endDate, currentUser.employeeId, reason);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Delegate Authority</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grantor (On Leave)</label>
            <select required value={grantorId} onChange={e => setGrantorId(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Select employee...</option>
              {USERS.filter(u => u.role !== 'MASTER').map(u => (
                <option key={u.id} value={u.employeeId}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grantee (Acting)</label>
            <select required value={granteeId} onChange={e => setGranteeId(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Select employee...</option>
              {USERS.filter(u => u.role !== 'MASTER').map(u => (
                <option key={u.id} value={u.employeeId}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <input type="text" required value={reason} onChange={e => setReason(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save Delegation</button>
          </div>
        </form>
      </div>
    </div>
  );
}
