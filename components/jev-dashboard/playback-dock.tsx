'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
} from 'lucide-react';
import { JevStageData } from './types';
import { soundEngine } from '../rescue-dashboard/audio-engine';

interface PlaybackDockProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  currentStage: JevStageData;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrevStage: () => void;
  onNextStage: () => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
  onOpenModal: () => void;
}

export function PlaybackDock({
  currentTime,
  duration,
  isPlaying,
  speed,
  currentStage,
  onPlayPause,
  onSeek,
  onPrevStage,
  onNextStage,
  onSpeedChange,
  onReset,
  onOpenModal,
}: PlaybackDockProps) {
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setEnabled(!next);
  };

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <footer className="w-full bg-[#141413] border-t border-white/[0.08] p-2.5 sm:px-6 select-none font-mono">
      {/* Top Status & Timestamp Bar */}
      <div className="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-2 px-1">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold tracking-wider">{formatTime(currentTime)}</span>
          <span className="text-[#71717a]">/</span>
          <span className="text-[#71717a]">{formatTime(duration)}</span>

          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase bg-[#F26522]/15 text-[#F26522] border border-[#F26522]/30">
            STAGE {currentStage.index + 1}/5: {currentStage.label}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[10px] text-[#71717a]">
          <span>SPACE: PLAY/PAUSE</span>
          <span>←/→: STEP</span>
        </div>
      </div>

      {/* Interactive Timeline Progress Bar */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * duration);
        }}
        className="relative w-full h-2 bg-[#222220] border border-white/[0.06] rounded-full overflow-hidden cursor-pointer group mb-2.5"
      >
        <div
          className="h-full bg-[#F26522] transition-all duration-75 relative rounded-full"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-[#F26522] rounded-full shadow-[0_1px_6px_rgba(242,101,34,0.4)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Control Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onReset}
            title="Reset to Start (R)"
            className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={onPrevStage}
            title="Previous Stage (←)"
            className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={onPlayPause}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#F26522] text-white hover:bg-[#ff7738] shadow-[0_2px_10px_rgba(242,101,34,0.3)]'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={onNextStage}
            title="Next Stage (→)"
            className="p-1.5 rounded-[6px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <SkipForward size={14} />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-2 bg-[#181816] rounded-[6px] p-0.5 border border-white/[0.08] text-[10px]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded-[4px] cursor-pointer transition-colors ${
                  speed === s ? 'bg-[#F26522] text-white font-bold' : 'text-[#71717a] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right Aux Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[11px] border border-white/[0.1] bg-[#181816] transition-colors cursor-pointer ${
              !isMuted
                ? 'text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-[#F26522]" />}
            <span>{isMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}</span>
          </button>

          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#181816] border border-white/[0.1] text-white hover:border-[#F26522]/60 hover:text-white transition-colors cursor-pointer"
          >
            <FileText size={13} className="text-[#F26522]" />
            <span>PLAYBOOK & BENCHMARK</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
