'use client';

import React from 'react';
import {
  CustomerScope,
  UserScope,
  EntityNode,
  ViewLevel,
} from './types';
import { CATEGORY_COLORS } from './mock-data';
import { User, ChevronRight } from 'lucide-react';

interface GraphSidebarProps {
  viewLevel: ViewLevel;
  activeCustomer: CustomerScope | null;
  activeUser: UserScope | null;
  selectedEntity: EntityNode | null;
  onSelectEntity: (entity: EntityNode | null) => void;
  onSelectUser: (user: UserScope | null) => void;
}

export function GraphSidebar({
  viewLevel,
  activeCustomer,
  activeUser,
  selectedEntity,
  onSelectEntity,
  onSelectUser,
}: GraphSidebarProps) {
  if (viewLevel === 'user-graph' && activeUser) {
    const parentCustomerName = activeCustomer ? activeCustomer.name : 'STARK STUDIO';

    return (
      <aside className="w-80 border-l border-white/[0.08] bg-[#141413] p-5 flex flex-col justify-between text-white font-sans select-none shrink-0 overflow-y-auto scrollbar-none">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-[#f26522] uppercase font-semibold">
              USER SCOPE · {parentCustomerName.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{activeUser.name}</h2>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.08]">
            <div className="bg-[#1a1a18] p-2 rounded-[8px] border border-white/[0.06] text-center">
              <div className="text-base font-bold text-white">{activeUser.memoryCount}</div>
              <div className="text-[10px] text-[#8e8e93] font-medium">Memories</div>
            </div>
            <div className="bg-[#1a1a18] p-2 rounded-[8px] border border-white/[0.06] text-center">
              <div className="text-base font-bold text-[#f26522]">
                {activeUser.entityCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8e8e93] font-medium">Entities</div>
            </div>
            <div className="bg-[#1a1a18] p-2 rounded-[8px] border border-white/[0.06] text-center">
              <div className="text-base font-bold text-white">
                {activeUser.relationshipCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8e8e93] font-medium">Relationships</div>
            </div>
          </div>

          {/* Most Connected List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#a1a1aa] tracking-wider">
              Most connected
            </div>

            <div className="space-y-1.5">
              {activeUser.entities.slice(0, 9).map((entity) => {
                const catInfo = CATEGORY_COLORS[entity.category];
                const isSelected = selectedEntity?.id === entity.id;

                return (
                  <button
                    key={entity.id}
                    onClick={() => onSelectEntity(isSelected ? null : entity)}
                    className={`w-full flex items-center justify-between p-2 rounded-[6px] text-xs transition-all text-left ${
                      isSelected
                        ? 'bg-[#1f1d19] border-l-2 border-[#f26522] text-white shadow-sm'
                        : 'hover:bg-[#1a1a18] text-[#d4d4d8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catInfo?.color || '#f26522' }}
                      />
                      <span className="font-medium truncate">{entity.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#71717a]">{entity.category}</span>
                      <span className="text-xs font-mono font-bold text-[#a1a1aa]">
                        {entity.connectionsCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Guidance Text */}
        <div className="pt-6 border-t border-white/[0.08] text-xs text-[#8e8e93] leading-relaxed">
          Select a dot to see its relationships, or a line to read the memories behind it.
        </div>
      </aside>
    );
  }

  // Customer Cluster View
  if (viewLevel === 'customer-cluster' && activeCustomer) {
    return (
      <aside className="w-80 border-l border-white/[0.08] bg-[#141413] p-5 flex flex-col justify-between text-white font-sans select-none shrink-0 overflow-y-auto scrollbar-none">
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-widest text-[#f26522] uppercase font-semibold">
              CUSTOMER SCOPE REGION
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{activeCustomer.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/[0.08]">
            <div className="bg-[#1a1a18] p-2.5 rounded-[8px] border border-white/[0.06] text-center">
              <div className="text-lg font-bold text-white">
                {activeCustomer.memoryCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8e8e93] font-medium">Total Memories</div>
            </div>
            <div className="bg-[#1a1a18] p-2.5 rounded-[8px] border border-white/[0.06] text-center">
              <div className="text-lg font-bold text-[#f26522]">{activeCustomer.userCount}</div>
              <div className="text-[11px] text-[#8e8e93] font-medium">User Scopes</div>
            </div>
          </div>

          {/* Nested Users within this Customer Scope */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#a1a1aa] tracking-wider">
              Nested User Regions
            </div>

            <div className="space-y-2">
              {activeCustomer.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center justify-between p-2.5 rounded-[8px] bg-[#1a1a18] hover:bg-[#222220] border border-white/[0.08] text-xs transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-[#f26522]" />
                    <span className="font-semibold text-white group-hover:text-[#f26522] transition-colors">
                      {user.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#a1a1aa]">
                    <span>{user.memoryCount} mems</span>
                    <ChevronRight size={12} className="text-[#71717a]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.08] text-xs text-[#8e8e93] leading-relaxed">
          <strong>Rule Enforced:</strong> User regions inside {activeCustomer.name} never overlap to protect memory privacy.
        </div>
      </aside>
    );
  }

  // Cosmic / Client Default Sidebar
  return (
    <aside className="w-80 border-l border-white/[0.08] bg-[#141413] p-5 flex flex-col justify-between text-white font-sans select-none shrink-0 overflow-y-auto scrollbar-none">
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="text-[10px] font-mono tracking-widest text-[#f26522] uppercase font-semibold">
            CLIENT TENANT SCOPE
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Maximem Global Lake</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/[0.08]">
          <div className="bg-[#1a1a18] p-2.5 rounded-[8px] border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-white">7,465</div>
            <div className="text-[11px] text-[#8e8e93]">Total Memories</div>
          </div>
          <div className="bg-[#1a1a18] p-2.5 rounded-[8px] border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-[#f26522]">6 Orgs</div>
            <div className="text-[11px] text-[#8e8e93]">Customer Scopes</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#a1a1aa] tracking-wider">
            Scope Hierarchy Model
          </div>
          <div className="p-3.5 bg-[#1a1a18] border border-white/[0.08] rounded-[8px] space-y-2 text-xs text-[#d4d4d8] leading-relaxed">
            <p>
              <strong className="text-[#f26522]">1. Maximem Core:</strong> Shared cross-cutting facts accessible across tenants.
            </p>
            <p>
              <strong className="text-white">2. Customer Orbs:</strong> Distinct non-overlapping boundaries for each organization.
            </p>
            <p>
              <strong className="text-[#38bdf8]">3. User Regions:</strong> Deep personalized knowledge graph per user.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.08] text-xs text-[#8e8e93] leading-relaxed">
        Click any planetary customer bubble to zoom into its nested user regions.
      </div>
    </aside>
  );
}
