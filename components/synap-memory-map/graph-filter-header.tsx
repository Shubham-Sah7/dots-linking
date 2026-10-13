'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Layers,
  ChevronRight,
  Database,
  Network,
  X,
  Table as TableIcon,
  Map as MapIcon,
  PanelRightClose,
  PanelRightOpen,
  Maximize,
} from 'lucide-react';
import {
  ClientScopeData,
  CustomerScope,
  UserScope,
  MemoryItem,
  EntityCategory,
} from './types';
import { CATEGORY_COLORS, getAllMemories } from './mock-data';

interface GraphFilterHeaderProps {
  data: ClientScopeData;
  activeCustomer: CustomerScope | null;
  activeUser: UserScope | null;
  selectedMemory: MemoryItem | null;
  categoryFilter: EntityCategory | null;
  statusFilter: 'All' | 'Active' | 'Superseded';
  onSelectCustomer: (customer: CustomerScope | null) => void;
  onSelectUser: (user: UserScope | null) => void;
  onSelectMemory: (memory: MemoryItem | null) => void;
  onCategoryFilterChange: (category: EntityCategory | null) => void;
  onStatusFilterChange: (status: 'All' | 'Active' | 'Superseded') => void;
  onResetView: () => void;
  isTableView: boolean;
  onToggleTableView: () => void;
  isDetailPanelOpen?: boolean;
  onToggleDetailPanel?: () => void;
}

export function GraphFilterHeader({
  data,
  activeCustomer,
  activeUser,
  selectedMemory,
  categoryFilter,
  statusFilter,
  onSelectCustomer,
  onSelectUser,
  onSelectMemory,
  onCategoryFilterChange,
  onStatusFilterChange,
  onResetView,
  isTableView,
  onToggleTableView,
  isDetailPanelOpen = true,
  onToggleDetailPanel,
}: GraphFilterHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const allMemories = useMemo(() => getAllMemories(data), [data]);

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<EntityCategory, number>> = {};
    for (const m of allMemories) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [allMemories]);

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allMemories
      .filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.text.toLowerCase().includes(q) ||
          m.ownerName.toLowerCase().includes(q) ||
          m.customerName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allMemories, searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (mem: MemoryItem) => {
    if (mem.scopeType === 'user') {
      for (const cust of data.customers) {
        const u = cust.users.find((usr) => usr.id === mem.scopeId);
        if (u) {
          onSelectCustomer(cust);
          onSelectUser(u);
          break;
        }
      }
    } else if (mem.scopeType === 'customer') {
      const cust = data.customers.find((c) => c.id === mem.scopeId);
      if (cust) {
        onSelectCustomer(cust);
        onSelectUser(null);
      }
    } else {
      onSelectCustomer(null);
      onSelectUser(null);
    }
    onSelectMemory(mem);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="w-full bg-[#141413]/98 backdrop-blur-[16px] border-b border-white/[0.09] px-4 py-2.5 shrink-0 z-20 font-sans select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Maximem Brand Logo, Title, Subtitle, and Data Overview Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            {/* Maximem SVG Logo */}
            <div className="relative shrink-0 size-[28px]">
              <svg className="block size-full" fill="none" viewBox="0 0 40 40">
                <path
                  d="M0.137112 20.262C-0.0456666 20.1197 -0.0456661 19.8418 0.137113 19.6995C2.68329 17.7174 4.89707 15.2205 6.60978 12.254C8.32252 9.28751 9.37798 6.12189 9.82145 2.9258C9.85325 2.69637 10.0939 2.5574 10.3086 2.64455C13.2982 3.85853 16.5674 4.52733 19.9928 4.52733C23.4182 4.52731 26.6874 3.85854 29.6771 2.64455C29.8917 2.5574 30.1324 2.69637 30.1642 2.9258C30.6077 6.12189 31.6631 9.28751 33.3758 12.254C35.0885 15.2205 37.3023 17.7173 39.8485 19.6994C40.0313 19.8417 40.0313 20.1196 39.8485 20.2619C37.3023 22.244 35.0885 24.7408 33.3757 27.7073C31.663 30.6739 30.6077 33.8395 30.1642 37.0356C30.1324 37.265 29.8917 37.404 29.6771 37.3168C26.6874 36.1028 23.4182 35.434 19.9927 35.434C16.5673 35.434 13.2982 36.1028 10.3085 37.3168C10.0939 37.404 9.85319 37.265 9.82139 37.0356C9.37792 33.8395 8.32252 30.6739 6.60978 27.7073C4.89709 24.7409 2.68326 22.2441 0.137112 20.262ZM10.1657 19.5353C9.98593 19.6815 9.98694 19.9594 10.1676 20.1044C11.3847 21.0798 12.4461 22.2917 13.2776 23.7204C14.1091 25.1492 14.6385 26.6707 14.8855 28.2107C14.9221 28.4394 15.1634 28.5776 15.3792 28.4936C16.8326 27.9273 18.4128 27.6141 20.0659 27.6083C21.719 27.6026 23.3013 27.9049 24.7585 28.461C24.975 28.5436 25.2152 28.4038 25.2503 28.1748C25.4866 26.6331 26.0054 25.108 26.8271 23.6735C27.6486 22.239 28.7015 21.0198 29.9117 20.0359C30.0915 19.8898 30.0905 19.6117 29.9098 19.4669C28.6927 18.4914 27.6314 17.2795 26.7999 15.8507C25.9683 14.422 25.4389 12.9005 25.1919 11.3604C25.1553 11.1317 24.914 10.9936 24.6982 11.0777C23.2449 11.6439 21.6647 11.9571 20.0117 11.9628C18.3585 11.9685 16.7762 11.6663 15.3189 11.1102C15.1025 11.0276 14.8623 11.1674 14.8271 11.3964C14.5909 12.9381 14.0721 14.4632 13.2505 15.8977C12.4289 17.3322 11.376 18.5514 10.1657 19.5353Z"
                  fill="#f26522"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-white">
                  Maximem
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30 font-semibold tracking-wider uppercase">
                  Memory Map
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] tracking-tight font-sans">
                Explore how memories are stored, owned, and connected.
              </p>
            </div>
          </div>

          {/* Compact Overview of Actual Data Metrics */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#a1a1aa] bg-[#1a1a18] border border-white/[0.08] rounded-[8px] px-2.5 py-1 self-start sm:self-center shadow-sm">
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/[0.08]">
              <Database size={12} className="text-[#f26522]" />
              <span>
                <strong className="text-white font-semibold">{data.totalMemories}</strong>{' '}
                Memories
              </span>
            </div>
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/[0.08]">
              <Layers size={12} className="text-[#a1a1aa]" />
              <span>
                <strong className="text-white font-semibold">{data.totalScopes}</strong>{' '}
                Scopes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network size={12} className="text-[#34d399]" />
              <span>
                <strong className="text-white font-semibold">{data.totalRelationships}</strong>{' '}
                Relationships
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Search Memories Input and Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box with Auto-Suggest */}
          <div ref={searchContainerRef} className="relative w-full sm:w-64 md:w-72">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3 text-[#71717a] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search memories, owners, scopes..."
                className="w-full bg-[#181816] border border-white/[0.1] rounded-[8px] pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]/30 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 text-[#71717a] hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#181816] border border-white/[0.14] rounded-[10px] shadow-[0_12px_36px_rgba(0,0,0,0.85)] z-50 overflow-hidden divide-y divide-white/[0.06]">
                <div className="px-3 py-1.5 text-[10px] font-mono text-[#8e8e93] uppercase tracking-wider bg-white/[0.02]">
                  Found {searchResults.length} matching memories
                </div>
                {searchResults.map((mem) => {
                  const catColor = CATEGORY_COLORS[mem.category]?.color || '#f26522';
                  return (
                    <button
                      key={mem.id}
                      onClick={() => handleSelectSearchResult(mem)}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="font-semibold text-white truncate">
                            {mem.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#8e8e93] shrink-0">
                            {mem.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a1a1aa] line-clamp-1">
                          {mem.text}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-[#a1a1aa] border border-white/[0.06]">
                          {mem.ownerName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset View Button */}
          <button
            onClick={onResetView}
            title="Reset canvas camera and fit all scopes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1aa] hover:text-white border border-white/[0.08] transition-colors"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Table / Graph Mode Toggle */}
          <button
            onClick={onToggleTableView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1aa] hover:text-white border border-white/[0.08] transition-colors"
          >
            {isTableView ? (
              <>
                <MapIcon size={13} className="text-[#f26522]" />
                <span className="hidden sm:inline">Graph</span>
              </>
            ) : (
              <>
                <TableIcon size={13} className="text-[#71717a]" />
                <span className="hidden sm:inline">Table</span>
              </>
            )}
          </button>

          {/* Side Inspector Toggle Button */}
          {onToggleDetailPanel && (
            <button
              onClick={onToggleDetailPanel}
              title={isDetailPanelOpen ? 'Collapse inspector panel (expands graph space)' : 'Open inspector panel'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                isDetailPanelOpen
                  ? 'bg-[#f26522]/15 text-[#f26522] border-[#f26522]/30'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1aa] hover:text-white border-white/[0.08]'
              }`}
            >
              {isDetailPanelOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
              <span className="hidden md:inline">
                {isDetailPanelOpen ? 'Hide Panel' : 'Inspect'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Bar: Scope Breadcrumb Hierarchy & Category Filter Chips */}
      <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Breadcrumb Hierarchy */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto py-0.5">
          <span className="text-[#71717a] uppercase tracking-wider text-[10px] mr-1">
            Scope:
          </span>

          {/* Client Scope Root */}
          <button
            onClick={() => {
              onSelectCustomer(null);
              onSelectUser(null);
              onSelectMemory(null);
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              !activeCustomer && !activeUser
                ? 'bg-[#f26522]/20 text-[#f26522] font-semibold border border-[#f26522]/40'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Client ({data.name})
          </button>

          {/* Customer Scope */}
          {activeCustomer && (
            <>
              <ChevronRight size={12} className="text-[#71717a] shrink-0" />
              <button
                onClick={() => {
                  onSelectUser(null);
                  onSelectMemory(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeCustomer && !activeUser
                    ? 'bg-[#f26522]/20 text-[#f26522] font-semibold border border-[#f26522]/40'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                Customer ({activeCustomer.name})
              </button>
            </>
          )}

          {/* User Scope */}
          {activeUser && (
            <>
              <ChevronRight size={12} className="text-[#71717a] shrink-0" />
              <span className="px-2 py-0.5 rounded bg-[#f26522]/15 text-[#f26522] font-semibold border border-[#f26522]/30">
                User ({activeUser.name})
              </span>
            </>
          )}

          {/* Selected Memory */}
          {selectedMemory && (
            <>
              <ChevronRight size={12} className="text-[#71717a] shrink-0" />
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 truncate max-w-[180px]">
                {selectedMemory.id}
              </span>
            </>
          )}
        </div>

        {/* Filter Chips: Category & Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* Status selector */}
          <div className="flex items-center rounded-[6px] bg-[#1a1a18] border border-white/[0.08] p-0.5 mr-1">
            {(['All', 'Active', 'Superseded'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusFilterChange(s)}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-[#f26522] text-white shadow-sm font-semibold'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <button
            onClick={() => onCategoryFilterChange(null)}
            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium transition-colors ${
              categoryFilter === null
                ? 'bg-white/[0.15] text-white font-semibold'
                : 'text-[#a1a1aa] hover:text-white bg-white/[0.04]'
            }`}
          >
            All Categories
          </button>

          {(
            [
              'Product',
              'Security',
              'Contract',
              'Preference',
              'Topic',
              'Event',
              'Place',
              'Channel',
            ] as EntityCategory[]
          ).map((catKey) => {
            const count = categoryCounts[catKey] || 0;
            if (count === 0) return null;
            const cat = CATEGORY_COLORS[catKey];
            const isSelected = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                onClick={() => onCategoryFilterChange(isSelected ? null : catKey)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-medium transition-colors border ${
                  isSelected
                    ? 'bg-[#f26522]/15 text-[#f26522] border-[#f26522]/50 font-semibold'
                    : 'bg-white/[0.03] text-[#a1a1aa] hover:text-white border-transparent hover:border-white/[0.08]'
                }`}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.label}</span>
                <span className="text-[9px] text-[#71717a]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
