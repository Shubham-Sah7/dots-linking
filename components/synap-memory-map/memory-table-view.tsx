'use client';

import React, { useState } from 'react';
import { ClientScopeData, MemoryItem } from './types';
import { Search, AlertCircle, ArrowUpRight } from 'lucide-react';
import { getAllMemories, CATEGORY_COLORS } from './mock-data';

interface MemoryTableViewProps {
  data: ClientScopeData;
  onSelectMemory: (mem: MemoryItem) => void;
}

export function MemoryTableView({ data, onSelectMemory }: MemoryTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  const allMemories = React.useMemo(() => getAllMemories(data), [data]);

  const filteredMemories = allMemories.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScope =
      scopeFilter === 'all' ||
      m.customerName.toLowerCase() === scopeFilter.toLowerCase() ||
      m.scopeType === scopeFilter;

    return matchesSearch && matchesScope;
  });

  return (
    <div className="w-full flex-1 bg-[#1B1B19] p-6 text-white font-sans select-none overflow-y-auto">
      {/* Notice Banner */}
      <div className="mb-6 p-4 bg-[#141413] border border-[#f26522]/20 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-[#f26522] shrink-0" size={18} />
          <div className="text-xs text-white/70">
            <span className="font-bold text-white">Tabular Memory Audit:</span> Flat rows lack spatial ownership contexts and graph edge flows. Click any row or switch to the{' '}
            <strong className="text-[#f26522]">Interactive Memory Map</strong> to explore visual scope regions and relationship connections.
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memory text, owner, or ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#181816] border border-white/[0.09] rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#f26522] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Filter Scope:</span>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="bg-[#181816] border border-white/[0.09] rounded-lg text-xs text-white/80 px-3 py-2 focus:outline-none focus:border-[#f26522]"
          >
            <option value="all">All Scopes</option>
            <option value="client">Client Root</option>
            <option value="Stark Studio">Stark Studio</option>
            <option value="Cyberdyne Systems">Cyberdyne Systems</option>
            <option value="Acme Retail">Acme Retail</option>
            <option value="Wayne Aerospace">Wayne Aerospace</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#141413] shadow-sm">
        <table className="w-full text-left text-xs divide-y divide-white/[0.06]">
          <thead className="bg-[#181816] text-white/60 font-mono">
            <tr>
              <th className="py-3 px-4 font-semibold">Memory ID</th>
              <th className="py-3 px-4 font-semibold">Title</th>
              <th className="py-3 px-4 font-semibold">Home Scope & Owner</th>
              <th className="py-3 px-4 font-semibold">Customer Enclave</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] bg-[#141413]">
            {filteredMemories.map((mem) => {
              const catColor = CATEGORY_COLORS[mem.category]?.color || '#f26522';
              return (
                <tr
                  key={mem.id}
                  onClick={() => onSelectMemory(mem)}
                  className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-[#f26522] font-mono font-bold">{mem.id}</td>
                  <td className="py-3 px-4 text-white font-medium max-w-xs truncate">{mem.title}</td>
                  <td className="py-3 px-4 text-white/90">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/70">
                      {mem.ownerName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/60">{mem.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                      {mem.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                        mem.status === 'Superseded'
                          ? 'bg-[#d97706]/15 text-[#fbbf24] border-[#d97706]/30'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      {mem.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/50 font-mono">{(mem.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-[#f26522]">
                    <span className="flex items-center gap-1 text-[11px] hover:underline">
                      Inspect <ArrowUpRight size={12} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
