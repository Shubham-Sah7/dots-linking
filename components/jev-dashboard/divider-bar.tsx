'use client';

import React from 'react';
import { JevStageData } from './types';

interface DividerBarProps {
  currentStage: JevStageData;
}

export function DividerBar({ currentStage }: DividerBarProps) {
  return (
    <div className="w-full bg-[#181816] border-y border-white/[0.08] px-4 sm:px-6 py-2.5 flex items-center justify-between font-mono select-none text-xs">
      {/* Left Phase Command */}
      <div className="flex items-center gap-2">
        <span className="text-[#F26522] font-bold">&gt;</span>
        <span className="text-[#f4f4f5] font-medium tracking-wide">
          {currentStage.dividerLeft}
        </span>
      </div>

      {/* Right Target / Benchmark Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[#71717a]">/</span>
        <span className="text-white font-bold tracking-wider uppercase">
          {currentStage.dividerRight}
        </span>
      </div>
    </div>
  );
}
