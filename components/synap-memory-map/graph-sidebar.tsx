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
  Check,
  LogOut,
  Sparkles,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
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
function MemoriesIcon({ className = 'size-5' }: { className?: string }) {
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
  activeNav = 'dashboard',
  onNavigate,
  className = '',
}: GraphSidebarProps) {
  const [selectedNav, setSelectedNav] = useState<NavItemKey>(activeNav);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState<boolean>(true);
  const [isSetupExpanded, setIsSetupExpanded] = useState<boolean>(false);
  const [isInstancesExpanded, setIsInstancesExpanded] = useState<boolean>(false);
  const [isMemoriesExpanded, setIsMemoriesExpanded] = useState<boolean>(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleSelectNav = (key: NavItemKey) => {
    setSelectedNav(key);
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <>
      {/* Fixed Full-Height Left Sidebar */}
      <aside
        className={`h-full bg-[#0D0D0C] border-r border-white/[0.08] text-white flex flex-col justify-between shrink-0 select-none font-sans z-30 transition-all duration-200 ${
          isCollapsed
            ? 'w-[72px] px-2 py-5 items-center'
            : 'w-[280px] sm:w-[320px] xl:w-[456px] px-5 sm:px-6 py-6'
        } ${className}`}
      >
        {/* Top Section: Brand Header & Navigation Items */}
        <div className="flex flex-col space-y-7 w-full overflow-hidden">
          {/* Header: Maximem Synap Brand */}
          <div className="flex items-center justify-between w-full pt-1">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="size-6 shrink-0 flex items-center justify-center">
                <MaximemSynapLogo className="size-6" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-[18px] tracking-tight text-white truncate">
                  Maximem Synap
                </span>
              )}
            </div>

            {/* Responsive Collapse / Rail Toggle */}
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="text-[#71717A] hover:text-white p-1 rounded-[6px] hover:bg-white/[0.06] transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Navigation Items Group */}
          <nav className="flex flex-col space-y-1.5 w-full">
            {/* 1. Setup */}
            <div className="w-full">
              <button
                onClick={() => {
                  handleSelectNav('setup');
                  setIsSetupExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group ${
                  selectedNav === 'setup'
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Setup"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <PlusCircle size={19} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                  {!isCollapsed && <span className="truncate">Setup</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    size={16}
                    className={`text-[#71717A] transition-transform duration-200 shrink-0 ${
                      isSetupExpanded ? 'rotate-90 text-white' : 'group-hover:text-[#A1A1AA]'
                    }`}
                  />
                )}
              </button>

              {/* Collapsible Setup Sub-items */}
              {!isCollapsed && isSetupExpanded && (
                <div className="pl-11 pr-3 py-1 space-y-1 text-xs text-[#A1A1AA]">
                  <div className="py-1 hover:text-white cursor-pointer">API Keys</div>
                  <div className="py-1 hover:text-white cursor-pointer">Model Integration</div>
                  <div className="py-1 hover:text-white cursor-pointer">Data Connectors</div>
                </div>
              )}
            </div>

            {/* 2. Dashboard (Active & Expanded with Nested Requests) */}
            <div className="w-full space-y-1">
              <button
                onClick={() => {
                  handleSelectNav('dashboard');
                  setIsDashboardExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-sm font-semibold transition-all cursor-pointer shadow-sm ${
                  selectedNav === 'dashboard'
                    ? 'bg-[#F26522] text-white shadow-[0_2px_12px_rgba(242,101,34,0.35)]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Dashboard"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <Home
                    size={19}
                    className={`shrink-0 ${selectedNav === 'dashboard' ? 'text-white' : 'text-[#A1A1AA]'}`}
                  />
                  {!isCollapsed && <span className="truncate">Dashboard</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${
                      selectedNav === 'dashboard' ? 'text-white' : 'text-[#71717A]'
                    } ${!isDashboardExpanded ? '-rotate-90' : ''}`}
                  />
                )}
              </button>

              {/* Nested Sub-item: Requests */}
              {isDashboardExpanded && (
                <div className="w-full">
                  <button
                    onClick={() => handleSelectNav('requests')}
                    className={`w-full flex items-center gap-3 py-2 rounded-[8px] text-sm transition-colors cursor-pointer ${
                      isCollapsed ? 'justify-center px-2' : 'pl-11 pr-3.5'
                    } ${
                      selectedNav === 'requests'
                        ? 'text-white bg-white/[0.08] font-semibold'
                        : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.03]'
                    }`}
                    title="Requests"
                  >
                    <History size={16} className="text-[#A1A1AA] shrink-0" />
                    {!isCollapsed && <span className="truncate">Requests</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Instances */}
            <div className="w-full">
              <button
                onClick={() => {
                  handleSelectNav('instances');
                  setIsInstancesExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group ${
                  selectedNav === 'instances'
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Instances"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <Layers size={19} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                  {!isCollapsed && <span className="truncate">Instances</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    size={16}
                    className={`text-[#71717A] transition-transform duration-200 shrink-0 ${
                      isInstancesExpanded ? 'rotate-90 text-white' : 'group-hover:text-[#A1A1AA]'
                    }`}
                  />
                )}
              </button>

              {!isCollapsed && isInstancesExpanded && (
                <div className="pl-11 pr-3 py-1 space-y-1 text-xs text-[#A1A1AA]">
                  <div className="py-1 hover:text-white cursor-pointer">Stark Production</div>
                  <div className="py-1 hover:text-white cursor-pointer">Wayne Sandbox</div>
                  <div className="py-1 hover:text-white cursor-pointer">Omni Local Node</div>
                </div>
              )}
            </div>

            {/* 4. Memories */}
            <div className="w-full">
              <button
                onClick={() => {
                  handleSelectNav('memories');
                  setIsMemoriesExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group ${
                  selectedNav === 'memories'
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Memories"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <MemoriesIcon className="size-[19px] text-[#A1A1AA] group-hover:text-white shrink-0" />
                  {!isCollapsed && <span className="truncate">Memories</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    size={16}
                    className={`text-[#71717A] transition-transform duration-200 shrink-0 ${
                      isMemoriesExpanded ? 'rotate-90 text-white' : 'group-hover:text-[#A1A1AA]'
                    }`}
                  />
                )}
              </button>

              {!isCollapsed && isMemoriesExpanded && (
                <div className="pl-11 pr-3 py-1 space-y-1 text-xs text-[#A1A1AA]">
                  <div className="py-1 hover:text-white cursor-pointer">Spatial Scope Map</div>
                  <div className="py-1 hover:text-white cursor-pointer">Historical Evolution</div>
                  <div className="py-1 hover:text-white cursor-pointer">Vector Embeddings</div>
                </div>
              )}
            </div>

            {/* 5. Settings */}
            <div className="w-full">
              <button
                onClick={() => {
                  handleSelectNav('settings');
                  setIsSettingsExpanded((prev) => !prev);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group ${
                  selectedNav === 'settings'
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Settings"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <Settings size={19} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                  {!isCollapsed && <span className="truncate">Settings</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    size={16}
                    className={`text-[#71717A] transition-transform duration-200 shrink-0 ${
                      isSettingsExpanded ? 'rotate-90 text-white' : 'group-hover:text-[#A1A1AA]'
                    }`}
                  />
                )}
              </button>

              {!isCollapsed && isSettingsExpanded && (
                <div className="pl-11 pr-3 py-1 space-y-1 text-xs text-[#A1A1AA]">
                  <div className="py-1 hover:text-white cursor-pointer">Organization & Roles</div>
                  <div className="py-1 hover:text-white cursor-pointer">Security & Audit</div>
                  <div className="py-1 hover:text-white cursor-pointer">Billing & Invoices</div>
                </div>
              )}
            </div>

            {/* 6. Synap Doc (Direct Document Link) */}
            <div className="w-full">
              <button
                onClick={() => handleSelectNav('synap-doc')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group ${
                  selectedNav === 'synap-doc'
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#D4D4D8] hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Synap Doc"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <FileText size={19} className="text-[#A1A1AA] group-hover:text-white shrink-0" />
                  {!isCollapsed && <span className="truncate">Synap Doc</span>}
                </div>
              </button>
            </div>
          </nav>
        </div>

        {/* Flexible Empty Space in the Middle */}
        <div className="flex-1 min-h-[30px]" />

        {/* Bottom Section: Balance Left Card + User Profile */}
        <div className="w-full space-y-4 pt-2">
          {/* Balance Left Card */}
          {!isCollapsed ? (
            <div className="w-full bg-[#141413] border border-white/[0.08] rounded-[16px] p-4 flex flex-col gap-2.5 shadow-sm">
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
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-xs font-semibold text-[#F26522] hover:text-[#ff7a38] flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>Upgrade</span>
                  <ArrowUpRight size={13} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : (
            /* Icon mode for collapsed state */
            <div
              onClick={() => setIsUpgradeModalOpen(true)}
              title="Balance left: 100% ($10 of $10) - Click to upgrade"
              className="flex flex-col items-center justify-center p-2 rounded-[10px] bg-[#141413] border border-white/[0.08] text-[#34D399] cursor-pointer hover:bg-white/[0.06]"
            >
              <CreditCard size={18} />
              <span className="text-[9px] font-mono mt-1 text-white">100%</span>
            </div>
          )}

          {/* User Profile Row */}
          <div className="relative w-full">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between p-2 rounded-[12px] hover:bg-white/[0.05] transition-colors cursor-pointer group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="sahshubham953 (sahshubham953@...)"
            >
              <div className="flex items-center gap-3 truncate">
                {/* Avatar with SA */}
                <div className="size-9 rounded-full bg-[#F26522] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm select-none">
                  SA
                </div>

                {/* Username & Truncated Email */}
                {!isCollapsed && (
                  <div className="flex flex-col text-left truncate">
                    <span className="text-sm font-semibold text-white tracking-tight leading-tight truncate">
                      sahshubham953
                    </span>
                    <span className="text-xs text-[#8E8E93] truncate leading-tight">
                      sahshubham953@...
                    </span>
                  </div>
                )}
              </div>

              {/* Account Switcher Icon */}
              {!isCollapsed && (
                <ChevronsUpDown
                  size={16}
                  className="text-[#8E8E93] group-hover:text-white transition-colors shrink-0"
                />
              )}
            </button>

            {/* Account Switcher Popover Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#181816] border border-white/[0.1] rounded-[12px] p-2 shadow-2xl text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-2 border-b border-white/[0.08]">
                  <p className="font-semibold text-white">sahshubham953</p>
                  <p className="text-[#8E8E93] truncate">sahshubham953@synap.maximem.io</p>
                </div>
                <div className="py-1">
                  <div className="flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-white/[0.05] cursor-pointer text-[#D4D4D8]">
                    <span>Current Workspace</span>
                    <Check size={14} className="text-[#F26522]" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-[8px] hover:bg-white/[0.05] cursor-pointer text-[#D4D4D8]">
                    <span>Stark Industries HQ</span>
                  </div>
                  <div
                    onClick={() => {
                      setIsUpgradeModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] hover:bg-white/[0.05] cursor-pointer text-[#F26522] font-medium"
                  >
                    <Sparkles size={14} />
                    <span>Manage Subscription</span>
                  </div>
                </div>
                <div className="border-t border-white/[0.08] pt-1">
                  <div
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] hover:bg-white/[0.05] cursor-pointer text-[#EF4444]"
                  >
                    <LogOut size={14} />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141413] border border-white/[0.12] rounded-[20px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-[#F26522]/20 border border-[#F26522]/40 flex items-center justify-center text-[#F26522]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Upgrade Synap Plan</h3>
                  <p className="text-xs text-[#8E8E93]">Unlock unlimited memories and higher compute</p>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-[#8E8E93] hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-[#1B1B19] p-4 rounded-[12px] border border-white/[0.06]">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-white">Pro Dedicated Node</span>
                <span className="text-xl font-bold text-white font-mono">$49<span className="text-xs text-[#8E8E93] font-normal">/mo</span></span>
              </div>
              <ul className="text-xs text-[#D4D4D8] space-y-1.5 list-disc list-inside">
                <li>Unlimited spatial memory storage</li>
                <li>Real-time inter-agent graph sync</li>
                <li>Zero-latency vector search index</li>
                <li>Priority 24/7 dedicated support</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Thank you for choosing Maximem Synap Pro! Account upgraded.');
                  setIsUpgradeModalOpen(false);
                }}
                className="px-5 py-2 rounded-[8px] text-xs font-semibold bg-[#F26522] hover:bg-[#ff7a38] text-white shadow-md transition-colors"
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
