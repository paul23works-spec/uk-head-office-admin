'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, ChevronDown, ShieldCheck } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DEMO_USER_PROFILE } from '@/lib/constants';
import { NotificationsPopover } from '../common/NotificationsPopover';
import { EnvironmentBadge } from '../common/Badge';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { setIsSearchOpen } = useProjects();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

        <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-900 font-semibold font-editorial text-sm">
            UK Head Office
          </span>
          <span>/</span>
          <span className="text-slate-600">Office Administration System</span>
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
          <EnvironmentBadge />
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
            <div className="w-8 h-8 rounded-full bg-[#0A192F] text-amber-300 font-semibold text-xs flex items-center justify-center border border-amber-400/40 shadow-xs">
              {DEMO_USER_PROFILE.avatarInitials}
            </div>
            <div className="hidden xl:block leading-tight">
              <p className="text-xs font-semibold text-slate-900">{DEMO_USER_PROFILE.name}</p>
              <p className="text-[11px] text-slate-500">{DEMO_USER_PROFILE.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{DEMO_USER_PROFILE.name}</p>
                <p className="text-xs text-slate-500">{DEMO_USER_PROFILE.role}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {DEMO_USER_PROFILE.department}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    DEMO
                  </span>
                </div>
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

              <div className="border-t border-slate-100 p-2 text-[11px] text-slate-400 bg-slate-50 text-center">
                Authentication deferred to future production phase
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
