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
    <header className="w-full bg-[#181816] text-[#F4F4F5] font-mono select-none border-b border-white/[0.08]">
      {/* Top Metadata Row */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
        {/* Left Metadata Chips */}
        <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#71717A] text-[10px] tracking-widest uppercase font-semibold">RESTORE</span>
            <span className="text-[#F4F4F5] text-[12px] font-semibold tracking-tight">six-agent software rescue</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#71717A] text-[10px] tracking-widest uppercase font-semibold">SOURCE</span>
            <span className="text-[#F4F4F5] text-[12px] font-semibold tracking-tight">220,000 LINES</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#71717A] text-[10px] tracking-widest uppercase font-semibold">DORMANT</span>
            <span className="text-[#F4F4F5] text-[12px] font-semibold tracking-tight">4 YEARS</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#71717A] text-[10px] tracking-widest uppercase font-semibold">AGENTS</span>
            <span className="text-[#F4F4F5] text-[12px] font-semibold tracking-tight">6</span>
          </div>
        </div>

        {/* Right Status Indicator Text (Warm Orange highlight) */}
        <div className="flex items-center gap-2">
          <span className="text-[#F26522] text-xs font-semibold uppercase tracking-wider select-none">
            {currentStage.topBadge}
          </span>
        </div>
      </div>

      {/* Row 2: 8 Contiguous Edge-to-Edge Rectangular Stage Tabs */}
      <div className="w-full grid grid-cols-4 sm:grid-cols-8 border-t border-white/[0.08] bg-[#141412]">
        {STAGES_DATA.map((stage) => {
          const isActive = stage.id === currentStage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage)}
              className={`relative h-7 sm:h-8 flex items-center justify-center text-[11px] font-mono tracking-tight lowercase transition-all duration-100 cursor-pointer border-r border-white/[0.08] last:border-r-0 ${
                isActive
                  ? 'bg-[#F26522]/15 text-[#F26522] font-semibold border-t-2 border-t-[#F26522] z-10'
                  : 'bg-[#181816] text-[#A1A1AA] hover:text-white hover:bg-[#20201D]'
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
