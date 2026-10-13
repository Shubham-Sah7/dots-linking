'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { StageData } from './types';
import { STAGES_DATA } from './stages-data';
import { soundEngine } from './audio-engine';

interface PlaybackDockProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  currentStage: StageData;
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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundEngine.setEnabled(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds);
    const ms = Math.floor((seconds % 1) * 10);
    const m = Math.floor(s / 60);
    const remSec = s % 60;
    return `${m.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="w-full bg-[#181816] border-t border-white/[0.08] px-3 sm:px-6 py-2.5 font-mono select-none text-[#F4F4F5]">
      {/* Top Timeline Slider & Timestamp */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-[#71717A]">/</span>
            <span className="text-[#71717A]">{formatTime(duration)}</span>
            <span className="text-[#F26522] text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 bg-[#F26522]/10 border border-[#F26522]/30">
              STAGE {currentStage.index + 1}/8: {currentStage.topBadge}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#71717A]">
            <span>SPACE: PLAY/PAUSE</span>
            <span>←/→: STEP</span>
          </div>
        </div>

        {/* Scrub Track with Stage Dividers */}
        <div className="relative w-full flex items-center group cursor-pointer py-1">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#242422] rounded-none appearance-none cursor-pointer accent-[#F26522] focus:outline-none"
          />

          {/* Markers for stages */}
          <div className="absolute inset-x-0 h-2 pointer-events-none flex">
            {STAGES_DATA.map((st, i) => (
              <div
                key={st.id}
                className="h-full border-r border-white/[0.08] relative"
                style={{ width: `${((st.timeEnd - st.timeStart) / duration) * 100}%` }}
              >
                {i === currentStage.index && (
                  <div className="absolute inset-0 bg-[#F26522]/20 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controller Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left playback controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            title="Reset to Start"
            className="p-1.5 bg-[#20201E] hover:bg-[#262624] text-[#A1A1AA] hover:text-white border border-white/[0.08] transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          {/* Prev Stage */}
          <button
            onClick={onPrevStage}
            title="Previous Stage"
            className="p-1.5 bg-[#20201E] hover:bg-[#262624] text-[#A1A1AA] hover:text-white border border-white/[0.08] transition-colors"
          >
            <SkipBack size={14} />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onPlayPause}
            className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 border ${
              isPlaying
                ? 'bg-[#F26522] text-white border-[#F26522]'
                : 'bg-[#20201E] text-white border-white/[0.12] hover:bg-[#2A2A28]'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Next Stage */}
          <button
            onClick={onNextStage}
            title="Next Stage"
            className="p-1.5 bg-[#20201E] hover:bg-[#262624] text-[#A1A1AA] hover:text-white border border-white/[0.08] transition-colors"
          >
            <SkipForward size={14} />
          </button>

          {/* Speed selector */}
          <div className="flex items-center border border-white/[0.08] bg-[#20201E] ml-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 text-[10px] font-bold ${
                  speed === s ? 'bg-[#F26522] text-white' : 'text-[#71717A] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          {/* Cyber Audio FX Toggle */}
          <button
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
            className={`px-2.5 py-1.5 flex items-center gap-1.5 text-xs border transition-colors ${
              audioEnabled
                ? 'bg-[#F26522]/15 border-[#F26522]/40 text-[#F26522]'
                : 'bg-[#20201E] border-white/[0.08] text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden sm:inline text-[10px] uppercase font-semibold">
              {audioEnabled ? 'AUDIO FX: ON' : 'AUDIO FX: OFF'}
            </span>
          </button>

          {/* Case Study Story Brief Modal Button */}
          <button
            onClick={onOpenModal}
            className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs bg-[#20201E] hover:bg-[#262624] text-[#F4F4F5] border border-white/[0.08] hover:border-[#F26522]/50 transition-colors uppercase font-semibold"
          >
            <Info size={13} className="text-[#F26522]" />
            <span className="hidden sm:inline text-[10px]">RESCUE BRIEF</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 bg-[#20201E] hover:bg-[#262624] text-[#A1A1AA] hover:text-white border border-white/[0.08] transition-colors"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
