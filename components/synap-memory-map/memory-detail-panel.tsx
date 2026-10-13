'use client';

import React from 'react';
import {
  X,
  Shield,
  ArrowRight,
  Clock,
  FileText,
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  Compass,
  CornerDownRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  MemoryItem,
  ClientScopeData,
  CustomerScope,
  UserScope,
} from './types';
import {
  CATEGORY_COLORS,
  RELATIONSHIP_METRICS,
  findMemoryById,
  getAllMemories,
} from './mock-data';

interface MemoryDetailPanelProps {
  memory: MemoryItem | null;
  data: ClientScopeData;
  activeCustomer: CustomerScope | null;
  activeUser: UserScope | null;
  onSelectCustomer: (customer: CustomerScope | null) => void;
  onSelectUser: (user: UserScope | null) => void;
  onSelectMemory: (memory: MemoryItem | null) => void;
  onClose: () => void;
  onFocusMemory: (memory: MemoryItem) => void;
}

export function MemoryDetailPanel({
  memory,
  data,
  activeCustomer,
  activeUser,
  onSelectCustomer,
  onSelectUser,
  onSelectMemory,
  onClose,
  onFocusMemory,
}: MemoryDetailPanelProps) {
  const allMemories = React.useMemo(() => getAllMemories(data), [data]);

  // If NO memory is selected: Show the Contextual Scope Telemetry & Directory
  if (!memory) {
    // Determine active scope details
    const currentScopeName = activeUser
      ? activeUser.name
      : activeCustomer
      ? activeCustomer.name
      : data.name;

    const currentScopeType = activeUser
      ? 'User Enclave'
      : activeCustomer
      ? 'Customer Scope'
      : 'Root Client Scope';

    const currentMemoryCount = activeUser
      ? activeUser.memories.length
      : activeCustomer
      ? activeCustomer.memoryCount
      : data.totalMemories;

    const childScopeCount = activeUser
      ? 0
      : activeCustomer
      ? activeCustomer.userCount
      : data.customers.length;

    return (
      <aside className="w-80 lg:w-[375px] border-l border-white/[0.08] bg-[#141413]/98 backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between text-white font-sans shrink-0 overflow-y-auto z-10 animate-in slide-in-from-right duration-150 select-none">
        <div className="space-y-4 sm:space-y-5">
          {/* Top Header: Title & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Compass size={15} className="text-[#f26522]" />
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-white/90">
                Scope Telemetry & Navigator
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Close panel to expand canvas"
            >
              <X size={14} />
            </button>
          </div>

          {/* Current Active Scope Summary Card */}
          <div className="rounded-xl bg-[#181816] border border-white/[0.08] p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f26522] font-semibold flex items-center gap-1.5">
                <Shield size={12} />
                Current Scope
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#a1a1aa] border border-white/[0.06]">
                {currentScopeType}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{currentScopeName}</h3>
              <p className="text-[11px] text-[#a1a1aa] font-mono mt-0.5">
                {activeUser
                  ? `Role: ${activeUser.role} · Belongs to ${activeCustomer?.name}`
                  : activeCustomer
                  ? `Industry: ${activeCustomer.industry}`
                  : 'Multi-Tenant Master Security Boundary'}
              </p>
            </div>

            {/* Scope Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono">
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-[#71717a] uppercase">Memories</div>
                <div className="text-sm font-bold text-white mt-0.5">{currentMemoryCount}</div>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-[#71717a] uppercase">Children</div>
                <div className="text-sm font-bold text-white mt-0.5">{childScopeCount}</div>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-[#71717a] uppercase">Links</div>
                <div className="text-sm font-bold text-[#34d399] mt-0.5">
                  {data.totalRelationships}
                </div>
              </div>
            </div>
          </div>

          {/* Scope Hierarchy Quick Jump Directory */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-[#a1a1aa]" />
                Enclave Directory (Click to Focus)
              </h3>
              {(activeCustomer || activeUser) && (
                <button
                  onClick={() => {
                    onSelectCustomer(null);
                    onSelectUser(null);
                  }}
                  className="text-[10px] font-mono text-[#f26522] hover:underline"
                >
                  Clear Scope Filter
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {/* Root Client Enclave */}
              <button
                onClick={() => {
                  onSelectCustomer(null);
                  onSelectUser(null);
                }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  !activeCustomer && !activeUser
                    ? 'bg-[#f26522]/15 border-[#f26522]/40 text-white font-medium'
                    : 'bg-[#181816] hover:bg-[#20201d] border-white/[0.05] text-[#a1a1aa]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-[#f26522]" />
                  <span className="font-medium text-white">{data.name}</span>
                </div>
                <span className="text-[10px] font-mono text-white/50">
                  {data.clientLevelMemories.length} global mems
                </span>
              </button>

              {/* Customer Enclaves */}
              {data.customers.map((cust) => {
                const isCustActive = activeCustomer?.id === cust.id;
                return (
                  <div key={cust.id} className="space-y-1">
                    <button
                      onClick={() => {
                        onSelectCustomer(cust);
                        onSelectUser(null);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        isCustActive && !activeUser
                          ? 'bg-[#f26522]/15 border-[#f26522]/40 text-white font-medium'
                          : 'bg-[#181816] hover:bg-[#20201d] border-white/[0.05] text-[#a1a1aa]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building size={13} className={isCustActive ? 'text-[#ff8a4c]' : 'text-[#f26522]'} />
                        <span className="font-medium text-white">{cust.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/50">
                        {cust.memoryCount} mems · {cust.userCount} users
                      </span>
                    </button>

                    {/* Nested User Enclaves under this Customer */}
                    {isCustActive && (
                      <div className="pl-4 space-y-1 border-l-2 border-[#f26522]/30 ml-3">
                        {cust.users.map((usr) => {
                          const isUserActive = activeUser?.id === usr.id;
                          return (
                            <button
                              key={usr.id}
                              onClick={() => {
                                onSelectCustomer(cust);
                                onSelectUser(usr);
                              }}
                              className={`w-full text-left p-1.5 rounded-md border text-[11px] flex items-center justify-between transition-colors ${
                                isUserActive
                                  ? 'bg-[#f26522]/20 border-[#f26522]/50 text-white font-medium'
                                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.04] text-[#a1a1aa]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="size-4 rounded-full bg-[#f26522] text-[9px] font-mono font-bold text-white flex items-center justify-center shrink-0">
                                  {usr.avatar || 'U'}
                                </span>
                                <span className="text-white truncate">{usr.name}</span>
                              </div>
                              <span className="text-[9px] font-mono text-[#f26522] shrink-0">
                                {usr.memories.length} mems
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Explore Guide */}
          <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#f26522] font-semibold text-[11px] uppercase tracking-wider font-mono">
              <Sparkles size={13} />
              <span>How to Explore the Map</span>
            </div>
            <ul className="text-[11px] text-white/60 space-y-1.5 font-sans leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#f26522] font-bold">1.</span>
                <span>Click any memory node to inspect its exact owner and relationships.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#f26522] font-bold">2.</span>
                <span>Scroll wheel to zoom in/out; click-drag anywhere to pan the map.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#f26522] font-bold">3.</span>
                <span>Use search in the header to jump to specific facts or people.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Isolation Guarantee */}
        <div className="pt-4 border-t border-white/[0.08] text-[10px] font-mono text-white/40 flex items-center justify-between">
          <span>Maximem Privacy Engine</span>
          <span className="text-[#f26522] font-semibold">Zero-Leakage Verified</span>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // When a MEMORY IS SELECTED: Full Contextual Memory Inspector
  // =========================================================================
  const isSuperseded = memory.status === 'Superseded';
  const categoryInfo = CATEGORY_COLORS[memory.category];

  // Find incoming relationships pointing TO this memory
  const incomingRelationships = allMemories.flatMap((m) =>
    m.relationships
      .filter((r) => r.targetMemoryId === memory.id)
      .map((r) => ({
        ...r,
        originMemory: m,
      }))
  );

  return (
    <aside className="w-80 lg:w-[375px] border-l border-white/[0.08] bg-[#141413]/98 backdrop-blur-2xl p-4 sm:p-5 flex flex-col justify-between text-white font-sans shrink-0 overflow-y-auto z-10 animate-in slide-in-from-right duration-150 select-none">
      <div className="space-y-4">
        {/* Top Header: ID, Status Badge, Importance Rating, Center Camera, Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSuperseded
                  ? 'bg-[#d97706] ring-2 ring-[#d97706]/30'
                  : 'bg-white ring-2 ring-white/30'
              }`}
            />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {memory.id}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                isSuperseded
                  ? 'bg-[#d97706]/15 text-[#fbbf24] border border-[#d97706]/30'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {memory.status}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onFocusMemory(memory)}
              title="Center canvas camera on this memory"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Compass size={14} />
            </button>
            <button
              onClick={onClose}
              title="Close inspection panel"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scope Ownership Hierarchy Card: Directly answers "Who owns this memory?" */}
        <div className="rounded-xl bg-[#181816] border border-white/[0.08] p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#f26522] font-semibold flex items-center gap-1.5">
              <Shield size={12} />
              Ownership & Scope Enclave
            </span>
            <span className="text-[10px] font-mono text-white/40 uppercase">
              {memory.scopeType} level
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              {memory.scopeType === 'user' ? (
                <User size={15} className="text-[#f26522]" />
              ) : memory.scopeType === 'customer' ? (
                <Building size={15} className="text-[#f26522]" />
              ) : (
                <Shield size={15} className="text-[#f26522]" />
              )}
              <span>{memory.ownerName}</span>
            </div>

            {/* Scope Breadcrumb Path */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-white/60 pt-1">
              <span className="text-white/40">Scope path:</span>
              <span className="text-white/80">{memory.clientName}</span>
              <span className="text-white/30">/</span>
              <span className="text-[#ff8a4c]">{memory.customerName}</span>
              {memory.scopeType === 'user' && (
                <>
                  <span className="text-white/30">/</span>
                  <span className="text-white/90 font-semibold">{memory.ownerName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Memory Title & Full Verbatim Quote */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white leading-snug">
            {memory.title}
          </h2>
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-white/90 leading-relaxed font-sans">
            &ldquo;{memory.text}&rdquo;
          </div>
        </div>

        {/* Category, Confidence & Importance Rating */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          {/* Category */}
          <div className="p-2.5 rounded-lg bg-[#181816] border border-white/[0.06] space-y-1">
            <span className="text-[9px] text-white/40 uppercase">Category</span>
            <div className="flex items-center gap-1.5 font-semibold text-white truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: categoryInfo?.color }}
              />
              <span className="truncate">{memory.category}</span>
            </div>
          </div>

          {/* Importance (1..5) */}
          <div className="p-2.5 rounded-lg bg-[#181816] border border-white/[0.06] space-y-1">
            <span className="text-[9px] text-white/40 uppercase">Importance</span>
            <div className="flex items-center gap-1 text-[#f26522] font-bold">
              <span>{memory.importance}/5</span>
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full ${
                      i <= memory.importance ? 'bg-[#f26522]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Verified Confidence */}
          <div className="p-2.5 rounded-lg bg-[#181816] border border-white/[0.06] space-y-1">
            <span className="text-[9px] text-white/40 uppercase">Confidence</span>
            <div className="flex items-center gap-1 font-semibold text-white">
              <CheckCircle2 size={12} className="text-[#f26522]" />
              <span>{Math.round(memory.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Document Ref & Timestamps */}
        <div className="flex flex-col gap-1.5 text-[11px] font-mono text-white/50 bg-[#181816]/60 p-2.5 rounded-lg border border-white/[0.04]">
          {memory.documentRef && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-white/40">
                <FileText size={11} /> Source Ref:
              </span>
              <span className="text-white/80 font-semibold">{memory.documentRef}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-white/40">
              <Clock size={11} /> Captured:
            </span>
            <span className="text-white/70">{memory.createdAt}</span>
          </div>
        </div>

        {/* Superseded Warning Banner if applicable */}
        {isSuperseded && memory.supersededBy && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Superseded Memory</p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                This fact has been superseded by newer data revision{' '}
                <button
                  onClick={() => {
                    const target = findMemoryById(memory.supersededBy!, data);
                    if (target) {
                      onSelectMemory(target);
                      onFocusMemory(target);
                    }
                  }}
                  className="font-mono underline text-amber-100 hover:text-white"
                >
                  {memory.supersededBy}
                </button>
                .
              </p>
            </div>
          </div>
        )}

        {/* Connected Relationships: Answers "What is it connected to?" */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <CornerDownRight size={13} className="text-[#f26522]" />
              Connected Memories ({memory.relationships.length + incomingRelationships.length})
            </h3>
          </div>

          {memory.relationships.length === 0 && incomingRelationships.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#181816]/60 border border-white/[0.04] text-[11px] text-white/50 text-center">
              No direct graph edges connected to this atomic memory.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Outgoing relationships */}
              {memory.relationships.map((rel) => {
                const targetMem = findMemoryById(rel.targetMemoryId, data);
                const relInfo = RELATIONSHIP_METRICS[rel.type] || {
                  label: rel.type,
                  color: '#f26522',
                };

                return (
                  <div
                    key={rel.id}
                    onClick={() => {
                      if (targetMem) {
                        onSelectMemory(targetMem);
                        onFocusMemory(targetMem);
                      }
                    }}
                    className="p-3 rounded-xl bg-[#181816] hover:bg-[#22221f] border border-white/[0.08] hover:border-[#f26522]/50 cursor-pointer transition-all group space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className="px-2 py-0.5 rounded font-mono font-semibold text-[9px] uppercase tracking-wider"
                        style={{
                          backgroundColor: `${relInfo.color}22`,
                          color: relInfo.color,
                        }}
                      >
                        {relInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 group-hover:text-[#f26522] flex items-center gap-1">
                        Jump to <ArrowRight size={10} />
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white group-hover:text-[#ff8a4c] transition-colors leading-snug">
                      {targetMem ? targetMem.title : rel.targetMemoryId}
                    </div>

                    <p className="text-[11px] text-white/60 leading-normal">
                      {rel.description}
                    </p>
                  </div>
                );
              })}

              {/* Incoming relationships */}
              {incomingRelationships.map((rel) => {
                const relInfo = RELATIONSHIP_METRICS[rel.type] || {
                  label: rel.type,
                  color: '#f26522',
                };

                return (
                  <div
                    key={`in-${rel.id}`}
                    onClick={() => {
                      onSelectMemory(rel.originMemory);
                      onFocusMemory(rel.originMemory);
                    }}
                    className="p-3 rounded-xl bg-[#181816] hover:bg-[#22221f] border border-white/[0.08] hover:border-[#f26522]/50 cursor-pointer transition-all group space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className="px-2 py-0.5 rounded font-mono font-semibold text-[9px] uppercase tracking-wider"
                        style={{
                          backgroundColor: `${relInfo.color}22`,
                          color: relInfo.color,
                        }}
                      >
                        Target of: {relInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 group-hover:text-[#f26522] flex items-center gap-1">
                        Jump to <ArrowRight size={10} />
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white group-hover:text-[#ff8a4c] transition-colors leading-snug">
                      {rel.originMemory.title}
                    </div>

                    <p className="text-[11px] text-white/60 leading-normal">
                      {rel.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/[0.08] text-[10px] font-mono text-white/40 flex items-center justify-between">
        <span>Owner: {memory.ownerName}</span>
        <span>ID: {memory.id}</span>
      </div>
    </aside>
  );
}
