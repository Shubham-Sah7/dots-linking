'use client';

import React from 'react';
import { StageData } from './types';

interface DividerBarProps {
  currentStage: StageData;
}

export function DividerBar({ currentStage }: DividerBarProps) {
  return (
    <div className="w-full bg-[#181816] border-y border-white/[0.08] px-3 sm:px-5 py-2 flex items-center justify-between font-mono select-none">
      {/* Left Phase Headline */}
      <div className="flex items-center gap-2">
        <span className="text-[#F4F4F5] text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase">
          {currentStage.middleBannerLeft}
        </span>
      </div>

      {/* Right Target Operation Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[#F26522] text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase">
          {currentStage.middleBannerRight}
        </span>
      </div>
    </div>
  );
}
