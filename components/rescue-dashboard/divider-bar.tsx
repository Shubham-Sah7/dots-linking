'use client';

import React from 'react';
import { StageData } from './types';

interface DividerBarProps {
  currentStage: StageData;
}

export function DividerBar({ currentStage }: DividerBarProps) {
  return (
    <div className="w-full bg-[#000000] border-y border-[#141b26] px-3 sm:px-5 py-2 flex items-center justify-between font-mono select-none">
      {/* Left Phase Headline */}
      <div className="flex items-center gap-2">
        <span className="text-white text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">
          {currentStage.middleBannerLeft}
        </span>
      </div>

      {/* Right Target Operation Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[#d4ff3f] text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">
          {currentStage.middleBannerRight}
        </span>
      </div>
    </div>
  );
}
