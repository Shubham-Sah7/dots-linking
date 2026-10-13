'use client';

import React from 'react';
import { Terminal, Network, GitPullRequest } from 'lucide-react';

export type DashboardMode = 'rescue' | 'synap' | 'jev';

interface DashboardModeSwitcherProps {
  currentMode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
}

export function DashboardModeSwitcher({
  currentMode,
  onModeChange,
}: DashboardModeSwitcherProps) {
  return (
    <header className="w-full bg-[#121210]/90 backdrop-blur-[16px] backdrop-saturate-[180%] border-b border-white/[0.08] px-4 sm:px-6 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-y-2 select-none z-50 sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      {/* Maximem Official Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 size-[28px] sm:size-[32px]">
          <svg className="block size-full" fill="none" viewBox="0 0 40 40">
            <g id="Image (Maximem Logo)">
              <path
                d="M0.137112 20.262C-0.0456666 20.1197 -0.0456661 19.8418 0.137113 19.6995C2.68329 17.7174 4.89707 15.2205 6.60978 12.254C8.32252 9.28751 9.37798 6.12189 9.82145 2.9258C9.85325 2.69637 10.0939 2.5574 10.3086 2.64455C13.2982 3.85853 16.5674 4.52733 19.9928 4.52733C23.4182 4.52731 26.6874 3.85854 29.6771 2.64455C29.8917 2.5574 30.1324 2.69637 30.1642 2.9258C30.6077 6.12189 31.6631 9.28751 33.3758 12.254C35.0885 15.2205 37.3023 17.7173 39.8485 19.6994C40.0313 19.8417 40.0313 20.1196 39.8485 20.2619C37.3023 22.244 35.0885 24.7408 33.3757 27.7073C31.663 30.6739 30.6077 33.8395 30.1642 37.0356C30.1324 37.265 29.8917 37.404 29.6771 37.3168C26.6874 36.1028 23.4182 35.434 19.9927 35.434C16.5673 35.434 13.2982 36.1028 10.3085 37.3168C10.0939 37.404 9.85319 37.265 9.82139 37.0356C9.37792 33.8395 8.32252 30.6739 6.60978 27.7073C4.89709 24.7409 2.68326 22.2441 0.137112 20.262ZM10.1657 19.5353C9.98593 19.6815 9.98694 19.9594 10.1676 20.1044C11.3847 21.0798 12.4461 22.2917 13.2776 23.7204C14.1091 25.1492 14.6385 26.6707 14.8855 28.2107C14.9221 28.4394 15.1634 28.5776 15.3792 28.4936C16.8326 27.9273 18.4128 27.6141 20.0659 27.6083C21.719 27.6026 23.3013 27.9049 24.7585 28.461C24.975 28.5436 25.2152 28.4038 25.2503 28.1748C25.4866 26.6331 26.0054 25.108 26.8271 23.6735C27.6486 22.239 28.7015 21.0198 29.9117 20.0359C30.0915 19.8898 30.0905 19.6117 29.9098 19.4669C28.6927 18.4914 27.6314 17.2795 26.7999 15.8507C25.9683 14.422 25.4389 12.9005 25.1919 11.3604C25.1553 11.1317 24.914 10.9936 24.6982 11.0777C23.2449 11.6439 21.6647 11.9571 20.0117 11.9628C18.3585 11.9685 16.7762 11.6663 15.3189 11.1102C15.1025 11.0276 14.8623 11.1674 14.8271 11.3964C14.5909 12.9381 14.0721 14.4632 13.2505 15.8977C12.4289 17.3322 11.376 18.5514 10.1657 19.5353Z"
                fill="#f26522"
              />
            </g>
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-white">
            Maximem
          </span>
          <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-mono uppercase tracking-wider bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30 font-semibold">
            PLATFORM
          </span>
        </div>
      </div>

      {/* Mode Switcher Pill with 3 Options */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#1a1a18] border border-white/[0.09] rounded-[10px] p-1 shadow-sm">
          {/* Option 1: 6-Agent Rescue */}
          <button
            onClick={() => onModeChange('rescue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-sans transition-all duration-200 cursor-pointer ${
              currentMode === 'rescue'
                ? 'bg-[#f26522] text-white font-semibold shadow-[0px_2px_10px_rgba(242,101,34,0.3)]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Terminal size={13} />
            <span>6-Agent Software Rescue</span>
          </button>

          {/* Option 2: Maximem Memory Map */}
          <button
            onClick={() => onModeChange('synap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-sans transition-all duration-200 cursor-pointer ${
              currentMode === 'synap'
                ? 'bg-[#f26522] text-white font-semibold shadow-[0px_2px_10px_rgba(242,101,34,0.3)]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Network size={13} />
            <span>Maximem Memory Map</span>
          </button>

          {/* Option 3: Sonnet 5.5 + Jev */}
          <button
            onClick={() => onModeChange('jev')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-sans transition-all duration-200 cursor-pointer ${
              currentMode === 'jev'
                ? 'bg-[#38bdf8] text-black font-semibold shadow-[0px_2px_10px_rgba(56,189,248,0.4)]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <GitPullRequest size={13} />
            <span>Sonnet 5.5 + Jev (15k Issues)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
