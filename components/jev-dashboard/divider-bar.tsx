'use client';

import React from 'react';
import { JevStageData } from './types';

interface DividerBarProps {
  currentStage: JevStageData;
}

export function DividerBar({ currentStage }: DividerBarProps) {
  return (
    <div className="w-full bg-[#000000] border-y border-[#141b26] px-3 sm:px-6 py-2 flex items-center justify-between font-mono select-none text-xs">
      {/* Left Phase Command */}
      <div className="flex items-center gap-2">
        <span className="text-[#38bdf8] font-semibold tracking-wider">
          {currentStage.dividerLeft}
        </span>
      </div>

      {/* Right Target / Benchmark Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[#64748b]">/</span>
        <span className="text-white font-bold tracking-wider uppercase">
          {currentStage.dividerRight}
        </span>
      </div>
    </div>
  );
}
