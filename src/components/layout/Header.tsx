'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, ChevronDown, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { useAuth } from '@/lib/auth-context';
import { useActiveDelegation } from '@/hooks/useActiveDelegation';
import { useRouter } from 'next/navigation';
import { NotificationsPopover } from '../common/NotificationsPopover';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { setIsSearchOpen } = useProjects();
  const { user, logout } = useAuth();
  const { coverages } = useActiveDelegation();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left side: Hamburger button for mobile & Page context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <div className="w-8 h-8 rounded-md bg-white shadow-xs border border-slate-200 p-0.5 flex items-center justify-center shrink-0 lg:hidden">
            <img
              src="/images/uk-group-logo.png"
              alt="UK GROUP"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
          <span className="text-slate-900 font-semibold font-editorial text-sm">
            UK Enterprise
          </span>
          <span className="hidden sm:inline">/</span>
          <span className="text-slate-600 hidden sm:inline">Office Administration System</span>
        </div>
      </div>

      {/* Middle: Global Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors cursor-pointer group"
          aria-label="Open global search (Ctrl+K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-slate-400">Search projects, codes, clients...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right side: Search button on mobile, Environment badge, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Open search dialog"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Environment Badge */}
        <div className="hidden sm:block">
          
        </div>

        {/* Notifications */}
        <NotificationsPopover />

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer"
            aria-label="User profile menu"
            aria-expanded={isProfileOpen}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#0A192F] text-amber-300 font-semibold text-xs flex items-center justify-center border border-amber-400/40 shadow-xs">
                {user?.avatarInitials || '?'}
              </div>
              {coverages.length > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 border-2 border-white rounded-full"
                  title="Acting under temporary delegation"
                />
              )}
            </div>
            <div className="hidden xl:block leading-tight">
              <p className="text-xs font-semibold text-slate-900">{user?.name || 'Unknown'}</p>
              {coverages.length > 0 ? (
                <p className="text-[10px] text-amber-600 font-semibold truncate">
                  Acting for: {coverages.map((c) => c.grantor?.name || 'Grantor').join(', ')}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">{user?.department || 'Unknown'}</p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{user?.department || 'Unknown'}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {user?.employeeId || 'EMP-???'}
                  </span>
                </div>

                {coverages.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80">
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[9px] uppercase tracking-wider bg-amber-200 text-amber-900 px-1 py-0.5 rounded mr-1">
                          COVERING
                        </span>
                        <span>Acting on behalf of:</span>
                        <div className="font-semibold text-slate-900">
                          {coverages.map((c) => `${c.grantor?.name || 'Grantor'} (${c.grantorRole})`).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-1 space-y-0.5 text-xs text-slate-600">
                <div className="px-3 py-2 text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Role: Office Administration</span>
                </div>
                <div className="px-3 py-2 text-slate-400 flex items-center justify-between">
                  <span>Auth Status:</span>
                  <span className="font-semibold text-slate-600">Local Mock Session</span>
                </div>
              </div>

              <div className="border-t border-slate-100 p-2 bg-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
