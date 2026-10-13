'use client';

import React from 'react';
import { StageData } from './types';
import { STAGES_DATA } from './stages-data';

interface HeaderBarProps {
  currentStage: StageData;
  onSelectStage: (stage: StageData) => void;
}

export function HeaderBar({ currentStage, onSelectStage }: HeaderBarProps) {
  return (
    <header className="w-full bg-[#000000] text-white font-mono select-none border-b border-[#141b26]">
      {/* Top Metadata Row: Matches header_exact_00.png */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
        {/* Left Metadata Chips */}
        <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#64748b] text-[10px] tracking-widest uppercase font-semibold">RESTORE</span>
            <span className="text-white text-[12px] font-bold tracking-tight">six-agent software rescue</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748b] text-[10px] tracking-widest uppercase font-semibold">SOURCE</span>
            <span className="text-white text-[12px] font-bold tracking-tight">220,000 LINES</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748b] text-[10px] tracking-widest uppercase font-semibold">DORMANT</span>
            <span className="text-white text-[12px] font-bold tracking-tight">4 YEARS</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748b] text-[10px] tracking-widest uppercase font-semibold">AGENTS</span>
            <span className="text-white text-[12px] font-bold tracking-tight">6</span>
          </div>
        </div>

        {/* Right Status Indicator Text (Pure Chartreuse Text, no border/pill) */}
        <div className="flex items-center gap-2">
          <span className="text-[#d4ff3f] text-xs font-bold uppercase tracking-wider select-none">
            {currentStage.topBadge}
          </span>
        </div>
      </div>

      {/* Row 2: 8 Contiguous Edge-to-Edge Rectangular Stage Tabs (Exact Match to Video) */}
      <div className="w-full grid grid-cols-4 sm:grid-cols-8 border-t border-[#141b26] bg-[#000000]">
        {STAGES_DATA.map((stage) => {
          const isActive = stage.id === currentStage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage)}
              className={`relative h-7 sm:h-8 flex items-center justify-center text-[11px] font-mono tracking-tight lowercase transition-all duration-100 cursor-pointer border-r border-[#141b26] last:border-r-0 ${
                isActive
                  ? 'bg-[#182510] text-[#d4ff3f] font-bold border-y border-[#557a22] shadow-[inset_0_0_12px_rgba(212,255,63,0.15)] z-10'
                  : 'bg-[#000000] text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#070d18]'
              }`}
            >
              <span className="truncate px-1.5">{stage.pillLabel}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
