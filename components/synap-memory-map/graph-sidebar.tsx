'use client';

import React, { useState } from 'react';
import {
  Home,
  PlusCircle,
  History,
  Layers,
  Settings,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ArrowUpRight,
  Network,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  CustomerScope,
  UserScope,
  EntityNode,
  ViewLevel,
} from './types';

export type NavItemKey =
  | 'setup'
  | 'dashboard'
  | 'graph'
  | 'requests'
  | 'instances'
  | 'memories'
  | 'settings'
  | 'synap-doc';

export interface GraphSidebarProps {
  viewLevel?: ViewLevel;
  activeCustomer?: CustomerScope | null;
  activeUser?: UserScope | null;
  selectedEntity?: EntityNode | null;
  onSelectEntity?: (entity: EntityNode | null) => void;
  onSelectUser?: (user: UserScope | null) => void;
  activeNav?: NavItemKey;
  onNavigate?: (key: NavItemKey) => void;
  className?: string;
}

/**
 * Custom Memories Icon: Divided cell / dual hemisphere circle outline
 * Matching the exact visual silhouette in the Maximem reference image.
 */
function MemoriesIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8.5 3H7a9 9 0 0 0 0 18h1.5" />
      <path d="M15.5 3H17a9 9 0 0 1 0 18h-1.5" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

/**
 * Maximem Synap Official Faceted Logo (White SVG)
 */
function MaximemSynapLogo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 40 40">
      <path
        d="M0.137112 20.262C-0.0456666 20.1197 -0.0456661 19.8418 0.137113 19.6995C2.68329 17.7174 4.89707 15.2205 6.60978 12.254C8.32252 9.28751 9.37798 6.12189 9.82145 2.9258C9.85325 2.69637 10.0939 2.5574 10.3086 2.64455C13.2982 3.85853 16.5674 4.52733 19.9928 4.52733C23.4182 4.52731 26.6874 3.85854 29.6771 2.64455C29.8917 2.5574 30.1324 2.69637 30.1642 2.9258C30.6077 6.12189 31.6631 9.28751 33.3758 12.254C35.0885 15.2205 37.3023 17.7173 39.8485 19.6994C40.0313 19.8417 40.0313 20.1196 39.8485 20.2619C37.3023 22.244 35.0885 24.7408 33.3757 27.7073C31.663 30.6739 30.6077 33.8395 30.1642 37.0356C30.1324 37.265 29.8917 37.404 29.6771 37.3168C26.6874 36.1028 23.4182 35.434 19.9927 35.434C16.5673 35.434 13.2982 36.1028 10.3085 37.3168C10.0939 37.404 9.85319 37.265 9.82139 37.0356C9.37792 33.8395 8.32252 30.6739 6.60978 27.7073C4.89709 24.7409 2.68326 22.2441 0.137112 20.262ZM10.1657 19.5353C9.98593 19.6815 9.98694 19.9594 10.1676 20.1044C11.3847 21.0798 12.4461 22.2917 13.2776 23.7204C14.1091 25.1492 14.6385 26.6707 14.8855 28.2107C14.9221 28.4394 15.1634 28.5776 15.3792 28.4936C16.8326 27.9273 18.4128 27.6141 20.0659 27.6083C21.719 27.6026 23.3013 27.9049 24.7585 28.461C24.975 28.5436 25.2152 28.4038 25.2503 28.1748C25.4866 26.6331 26.0054 25.108 26.8271 23.6735C27.6486 22.239 28.7015 21.0198 29.9117 20.0359C30.0915 19.8898 30.0905 19.6117 29.9098 19.4669C28.6927 18.4914 27.6314 17.2795 26.7999 15.8507C25.9683 14.422 25.4389 12.9005 25.1919 11.3604C25.1553 11.1317 24.914 10.9936 24.6982 11.0777C23.2449 11.6439 21.6647 11.9571 20.0117 11.9628C18.3585 11.9685 16.7762 11.6663 15.3189 11.1102C15.1025 11.0276 14.8623 11.1674 14.8271 11.3964C14.5909 12.9381 14.0721 14.4632 13.2505 15.8977C12.4289 17.3322 11.376 18.5514 10.1657 19.5353Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function GraphSidebar({
  activeNav = 'graph',
  onNavigate,
  className = '',
}: GraphSidebarProps) {
  const [selectedNav, setSelectedNav] = useState<NavItemKey>(activeNav);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Trigger notice when clicking non-graph items ("only graph should work")
  const handleDisabledNavClick = (name: string) => {
    setFeedbackNotice(`${name} is disabled — only Graph is active`);
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 2200);
  };

  const handleNavClick = (key: NavItemKey) => {
    setSelectedNav(key);
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <>
      {/* Fixed Full-Height Left Sidebar - Exact 240px width matching reference image */}
      <aside
        className={`h-screen sticky top-0 bg-[#0D0D0C] border-r border-white/[0.08] text-white flex flex-col justify-between shrink-0 select-none font-sans z-30 transition-all duration-150 overflow-y-auto scrollbar-none w-[240px] px-2.5 py-4 ${className}`}
      >
        {/* Top Section: Brand Header & Navigation Items */}
        <div className="flex flex-col space-y-6 w-full">
          {/* Header: Maximem Synap Brand (No extra close buttons) */}
          <div className="flex items-center gap-3 w-full px-2 pt-1">
            <div className="size-6 shrink-0 flex items-center justify-center">
              <MaximemSynapLogo className="size-6" />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white truncate font-sans">
              Maximem Synap
            </span>
          </div>

          {/* Navigation Items Group */}
          <nav className="flex flex-col space-y-1 w-full">
            {/* 1. Setup (Disabled: only graph works) */}
            <button
              type="button"
              onClick={() => handleDisabledNavClick('Setup')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[9px] text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer group"
              title="Setup"
            >
              <div className="flex items-center gap-3 truncate">
                <PlusCircle size={18} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                <span className="truncate">Setup</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0" />
            </button>

            {/* 2. Dashboard with nested Requests (as in reference image) */}
            <div className="w-full space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                  selectedNav === 'dashboard'
                    ? 'bg-[#F26522] text-white shadow-sm'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.03]'
                }`}
                title="Dashboard"
              >
                <div className="flex items-center gap-3 truncate">
                  <Home
                    size={18}
                    className={`shrink-0 ${selectedNav === 'dashboard' ? 'text-white' : 'text-[#A1A1AA]'}`}
                  />
                  <span className="truncate">Dashboard</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`shrink-0 ${selectedNav === 'dashboard' ? 'text-white' : 'text-[#71717A]'}`}
                />
              </button>

              {/* Nested Requests under Dashboard (matching reference design) */}
              <button
                type="button"
                onClick={() => handleDisabledNavClick('Requests')}
                className="w-full flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-[7px] text-xs text-[#A1A1AA] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
                title="Requests"
              >
                <History size={14} className="text-[#71717A] shrink-0" />
                <span className="truncate">Requests</span>
              </button>
            </div>

            {/* 3. Graph (One More Separate Menu!) */}
            <button
              type="button"
              onClick={() => handleNavClick('graph')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                selectedNav === 'graph'
                  ? 'bg-[#F26522] text-white shadow-sm'
                  : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.03]'
              }`}
              title="Graph (Memory Map)"
            >
              <div className="flex items-center gap-3 truncate">
                <Network
                  size={18}
                  className={`shrink-0 ${selectedNav === 'graph' ? 'text-white' : 'text-[#A1A1AA]'}`}
                />
                <span className="truncate">Graph</span>
              </div>
              <ChevronRight
                size={14}
                className={`shrink-0 ${selectedNav === 'graph' ? 'text-white' : 'text-[#71717A]'}`}
              />
            </button>

            {/* 3. Instances (Disabled: only graph works) */}
            <button
              type="button"
              onClick={() => handleDisabledNavClick('Instances')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[9px] text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer group"
              title="Instances"
            >
              <div className="flex items-center gap-3 truncate">
                <Layers size={18} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                <span className="truncate">Instances</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0" />
            </button>

            {/* 4. Memories */}
            <button
              type="button"
              onClick={() => handleNavClick('graph')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[9px] text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer group"
              title="Memories"
            >
              <div className="flex items-center gap-3 truncate">
                <MemoriesIcon className="size-[18px] text-[#A1A1AA] group-hover:text-white shrink-0" />
                <span className="truncate">Memories</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0" />
            </button>

            {/* 5. Settings (Disabled: only graph works) */}
            <button
              type="button"
              onClick={() => handleDisabledNavClick('Settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[9px] text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer group"
              title="Settings"
            >
              <div className="flex items-center gap-3 truncate">
                <Settings size={18} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                <span className="truncate">Settings</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0" />
            </button>

            {/* 6. Synap Doc (Disabled: only graph works) */}
            <button
              type="button"
              onClick={() => handleDisabledNavClick('Synap Doc')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-[9px] text-sm font-medium text-[#D4D4D8] hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer group"
              title="Synap Doc"
            >
              <div className="flex items-center gap-3 truncate">
                <FileText size={18} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                <span className="truncate">Synap Doc</span>
              </div>
            </button>
          </nav>

          {/* Feedback notice when non-graph item is clicked */}
          {feedbackNotice && (
            <div className="mx-1 px-2.5 py-1.5 rounded-[8px] bg-[#F26522]/15 border border-[#F26522]/30 text-[11px] text-[#F26522] text-center animate-in fade-in duration-150">
              {feedbackNotice}
            </div>
          )}
        </div>

        {/* Middle Empty Flexible Space */}
        <div className="flex-1 min-h-[40px]" />

        {/* Bottom Section: Balance Left Card + User Profile */}
        <div className="w-full space-y-3 pt-2">
          {/* Balance Left Card */}
          <div className="w-full bg-[#141413] border border-white/[0.08] rounded-[14px] p-3.5 flex flex-col gap-2.5 shadow-sm">
            {/* Header Row: Balance Left & 100% */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA] font-normal">Balance left</span>
              <span className="text-sm font-bold text-white font-mono">100%</span>
            </div>

            {/* Progress Bar (Mint Green) */}
            <div className="w-full h-1.5 bg-[#262624] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#34D399] rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              />
            </div>

            {/* Bottom Row: $10 of $10 & Upgrade link */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-[#A1A1AA] font-mono">$10 of $10</span>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-xs font-semibold text-[#F26522] hover:text-[#ff7a38] flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Upgrade</span>
                <ArrowUpRight size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* User Profile Row */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-1.5 rounded-[10px] hover:bg-white/[0.04] transition-colors cursor-pointer group"
              title="sahshubham953 (sahshubham953@...)"
            >
              <div className="flex items-center gap-2.5 truncate">
                {/* Avatar with SA */}
                <div className="size-8 rounded-full bg-[#F26522] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm select-none">
                  SA
                </div>

                {/* Username & Truncated Email */}
                <div className="flex flex-col text-left truncate">
                  <span className="text-sm font-semibold text-white tracking-tight leading-tight truncate">
                    sahshubham953
                  </span>
                  <span className="text-[11px] text-[#8E8E93] truncate leading-tight">
                    sahshubham953@...
                  </span>
                </div>
              </div>

              {/* Account Switcher Icon */}
              <ChevronsUpDown
                size={14}
                className="text-[#8E8E93] group-hover:text-white transition-colors shrink-0"
              />
            </button>

            {/* Account Switcher Popover Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#181816] border border-white/[0.1] rounded-[12px] p-2 shadow-2xl text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-2 border-b border-white/[0.08]">
                  <p className="font-semibold text-white">sahshubham953</p>
                  <p className="text-[#8E8E93] truncate text-[10px]">sahshubham953@synap.maximem.io</p>
                </div>
                <div className="py-1">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-[7px] hover:bg-white/[0.05] cursor-pointer text-[#D4D4D8]">
                    <span>Current Workspace</span>
                    <Check size={13} className="text-[#F26522]" />
                  </div>
                  <div
                    onClick={() => {
                      setIsUpgradeModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] hover:bg-white/[0.05] cursor-pointer text-[#F26522] font-medium"
                  >
                    <Sparkles size={13} />
                    <span>Manage Subscription</span>
                  </div>
                </div>
                <div className="border-t border-white/[0.08] pt-1">
                  <div
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] hover:bg-white/[0.05] cursor-pointer text-[#EF4444]"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Subscription Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141413] border border-white/[0.12] rounded-[18px] max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-[#F26522]/20 border border-[#F26522]/40 flex items-center justify-center text-[#F26522]">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Upgrade Synap Plan</h3>
                  <p className="text-[11px] text-[#8E8E93]">Unlimited spatial memories & graph sync</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-[#8E8E93] hover:text-white p-1 rounded-md text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-[#1B1B19] p-3.5 rounded-[10px] border border-white/[0.06]">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-white text-xs">Pro Dedicated Node</span>
                <span className="text-lg font-bold text-white font-mono">$49<span className="text-[10px] text-[#8E8E93] font-normal">/mo</span></span>
              </div>
              <ul className="text-[11px] text-[#D4D4D8] space-y-1 list-disc list-inside">
                <li>Unlimited spatial memory storage</li>
                <li>Real-time inter-agent graph sync</li>
                <li>Zero-latency vector search index</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[7px] text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Thank you for choosing Maximem Synap Pro! Account upgraded.');
                  setIsUpgradeModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-[7px] text-xs font-semibold bg-[#F26522] hover:bg-[#ff7a38] text-white shadow-md transition-colors"
              >
                Confirm Upgrade ($49)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { GraphSidebar as SynapSidebar };
export default GraphSidebar;
