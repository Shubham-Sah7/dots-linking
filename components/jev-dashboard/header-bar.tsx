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
    <header className="w-full bg-[#000000] text-white font-mono select-none border-b border-[#141b26]">
      {/* Top Metadata Row: Matches frame_00_0.0s.jpg */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-2.5 gap-y-3">
        {/* Left Title */}
        <div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sonnet 5.5 + Jev</span>
          </div>
          <div className="text-[11px] text-[#64748b]">
            15,000 GitHub issues
          </div>
        </div>

        {/* 4 Stat Columns with Dotted Line Bars */}
        <div className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-2 text-xs">
          {/* Column 1: JEV CHECKS */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[#64748b] text-[9.5px] uppercase tracking-wider font-semibold">JEV CHECKS</span>
            <span className="text-white text-xs font-bold">60,000</span>
            <span className="text-[#38bdf8] text-[9px] tracking-widest leading-none">····················</span>
          </div>

          {/* Column 2: SONNET SHORTLIST */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[#64748b] text-[9.5px] uppercase tracking-wider font-semibold">SONNET SHORTLIST</span>
            <span className="text-white text-xs font-bold">360 ISSUES</span>
            <span className="text-[#38bdf8] text-[9px] tracking-widest leading-none">····················</span>
          </div>

          {/* Column 3: TEST-PASSING PATCHES */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[#64748b] text-[9.5px] uppercase tracking-wider font-semibold">TEST-PASSING PATCHES</span>
            <span className="text-white text-xs font-bold">42</span>
            <span className="text-[#38bdf8] text-[9px] tracking-widest leading-none">····················</span>
          </div>

          {/* Column 4: FULL RUN */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[#64748b] text-[9.5px] uppercase tracking-wider font-semibold">FULL RUN</span>
            <span className="text-white text-xs font-bold">~4.9x FASTER</span>
            <span className="text-[#38bdf8] text-[9px] tracking-widest leading-none">····················</span>
          </div>
        </div>
      </div>

      {/* Row 2: 5 Contiguous Edge-to-Edge Rectangular Pipeline Tabs */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 border-t border-[#141b26] bg-[#000000]">
        {JEV_STAGES_DATA.map((stage) => {
          const isActive = stage.id === currentStage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage)}
              className={`relative h-7 sm:h-8 flex items-center justify-center text-[10.5px] font-mono tracking-wider uppercase transition-all duration-100 cursor-pointer border-r border-[#141b26] last:border-r-0 ${
                isActive
                  ? 'bg-[#0a101d] text-white font-bold border-y-2 border-white shadow-[inset_0_0_12px_rgba(56,189,248,0.15)] z-10'
                  : 'bg-[#000000] text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#070d18]'
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
