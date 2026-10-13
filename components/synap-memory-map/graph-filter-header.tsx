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
    <header className="w-full bg-[#141413]/98 backdrop-blur-[16px] border-b border-white/[0.09] px-4 py-2 shrink-0 z-20 font-sans select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Memory Map Title & Metrics Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#f26522] shadow-[0_0_8px_rgba(242,101,34,0.8)]" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white font-sans">
                  Memory Map
                </h1>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30 font-semibold tracking-wider uppercase">
                  Spatial Scopes
                </span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] tracking-tight font-sans">
                Memory ownership enclaves, hierarchy, and inter-agent relationships
              </p>
            </div>
          </div>

          {/* Compact Overview of Actual Data Metrics */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#a1a1aa] bg-[#1a1a18] border border-white/[0.08] rounded-[8px] px-2.5 py-1 self-start sm:self-center shadow-sm">
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/[0.08]">
              <Database size={11} className="text-[#f26522]" />
              <span>
                <strong className="text-white font-semibold">{data.totalMemories}</strong> Memories
              </span>
            </div>
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/[0.08]">
              <Layers size={11} className="text-[#a1a1aa]" />
              <span>
                <strong className="text-white font-semibold">{data.totalScopes}</strong> Scopes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network size={11} className="text-[#34d399]" />
              <span>
                <strong className="text-white font-semibold">{data.totalRelationships}</strong> Links
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
            id="reset-view-btn"
            onClick={onResetView}
            title="Reset canvas camera and fit all scopes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] text-[#a1a1aa] hover:text-white border border-white/[0.08] transition-colors"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Table / Graph Mode Toggle */}
          <button
            id="toggle-table-btn"
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
              id="toggle-panel-header-btn"
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
      <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
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
              !activeCustomer && !activeUser && !selectedMemory
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
                  onSelectCustomer(activeCustomer);
                  onSelectUser(null);
                  onSelectMemory(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeCustomer && !activeUser && !selectedMemory
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
              <button
                onClick={() => {
                  onSelectUser(activeUser);
                  onSelectMemory(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeUser && !selectedMemory
                    ? 'bg-[#f26522]/20 text-[#f26522] font-semibold border border-[#f26522]/40'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                User ({activeUser.name})
              </button>
            </>
          )}

          {/* Selected Memory */}
          {selectedMemory && (
            <>
              <ChevronRight size={12} className="text-[#71717a] shrink-0" />
              <button
                onClick={() => onSelectMemory(selectedMemory)}
                className="px-2 py-0.5 rounded bg-[#f26522]/20 text-[#f26522] font-semibold border border-[#f26522]/40 truncate max-w-[220px]"
                title={`${selectedMemory.id}: ${selectedMemory.title}`}
              >
                {selectedMemory.id} · {selectedMemory.title}
              </button>
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
