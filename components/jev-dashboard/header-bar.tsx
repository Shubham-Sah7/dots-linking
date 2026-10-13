'use client';

import React from 'react';
import { JevStageData } from './types';
import { JEV_STAGES_DATA } from './stages-data';

interface HeaderBarProps {
  currentStage: JevStageData;
  onSelectStage: (stage: JevStageData) => void;
}

export function HeaderBar({ currentStage, onSelectStage }: HeaderBarProps) {
  return (
    <header className="w-full bg-[#141413] text-white select-none border-b border-white/[0.08]">
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 gap-y-3">
        {/* Left Title */}
        <div>
          <div className="font-sans text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sonnet 5.5 + Jev</span>
          </div>
          <div className="text-xs font-mono text-[#a1a1aa]">
            15,000 GitHub issues
          </div>
        </div>

        {/* 4 Stat Columns in Clean Horizontal Layout */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          {/* Column 1: JEV CHECKS */}
          <div className="flex flex-col bg-[#181816] border border-white/[0.06] rounded-[6px] px-3 py-1.5 min-w-[105px]">
            <span className="text-[#71717a] text-[9.5px] uppercase tracking-wider font-semibold font-mono">
              JEV CHECKS
            </span>
            <span className="text-white text-xs font-bold font-mono">60,000</span>
            <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-white/20 w-full" />
            </div>
          </div>

          {/* Column 2: SONNET SHORTLIST */}
          <div className="flex flex-col bg-[#181816] border border-white/[0.06] rounded-[6px] px-3 py-1.5 min-w-[105px]">
            <span className="text-[#71717a] text-[9.5px] uppercase tracking-wider font-semibold font-mono">
              SONNET SHORTLIST
            </span>
            <span className="text-white text-xs font-bold font-mono">360 ISSUES</span>
            <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#F26522]/80 w-3/4" />
            </div>
          </div>

          {/* Column 3: TEST-PASSING PATCHES */}
          <div className="flex flex-col bg-[#181816] border border-white/[0.06] rounded-[6px] px-3 py-1.5 min-w-[105px]">
            <span className="text-[#71717a] text-[9.5px] uppercase tracking-wider font-semibold font-mono">
              TEST-PASSING PATCHES
            </span>
            <span className="text-white text-xs font-bold font-mono">42</span>
            <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-white/40 w-1/2" />
            </div>
          </div>

          {/* Column 4: FULL RUN */}
          <div className="flex flex-col bg-[#181816] border border-white/[0.06] rounded-[6px] px-3 py-1.5 min-w-[105px]">
            <span className="text-[#71717a] text-[9.5px] uppercase tracking-wider font-semibold font-mono">
              FULL RUN
            </span>
            <span className="text-[#F26522] text-xs font-bold font-mono">~4.9x FASTER</span>
            <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#F26522] w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 5 Workflow Stage Tabs */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 border-t border-white/[0.08] bg-[#181816]">
        {JEV_STAGES_DATA.map((stage) => {
          const isActive = stage.id === currentStage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage)}
              className={`relative h-8 sm:h-9 flex items-center justify-center text-[11px] font-mono tracking-wider uppercase transition-all duration-150 cursor-pointer border-r border-white/[0.06] last:border-r-0 ${
                isActive
                  ? 'bg-[#F26522]/15 text-[#F26522] font-bold border-b-2 border-b-[#F26522] z-10'
                  : 'bg-transparent text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className="truncate px-2">{stage.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
