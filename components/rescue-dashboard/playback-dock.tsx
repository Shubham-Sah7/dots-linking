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
    <div className="w-full bg-[#060a12] border-t border-[#1f242d] px-3 sm:px-6 py-2.5 font-mono select-none text-white">
      {/* Top Timeline Slider & Timestamp */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-[#64748b]">/</span>
            <span className="text-[#64748b]">{formatTime(duration)}</span>
            <span className="text-[#d4ff3f] text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-[#d4ff3f]/10 border border-[#d4ff3f]/30">
              STAGE {currentStage.index + 1}/8: {currentStage.topBadge}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#64748b]">
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
            className="w-full h-2 bg-[#111827] rounded-none appearance-none cursor-pointer accent-[#d4ff3f] focus:outline-none"
          />

          {/* Markers for stages */}
          <div className="absolute inset-x-0 h-2 pointer-events-none flex">
            {STAGES_DATA.map((st, i) => (
              <div
                key={st.id}
                className="h-full border-r border-[#1f2937]/80 relative"
                style={{ width: `${((st.timeEnd - st.timeStart) / duration) * 100}%` }}
              >
                {i === currentStage.index && (
                  <div className="absolute inset-0 bg-[#d4ff3f]/20 pointer-events-none" />
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
            className="p-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          {/* Prev Stage */}
          <button
            onClick={onPrevStage}
            title="Previous Stage"
            className="p-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors"
          >
            <SkipBack size={14} />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onPlayPause}
            className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 border ${
              isPlaying
                ? 'bg-[#d4ff3f] text-black border-[#d4ff3f] shadow-[0_0_12px_rgba(212,255,63,0.35)]'
                : 'bg-[#1e293b] text-white border-[#334155] hover:bg-[#334155]'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Next Stage */}
          <button
            onClick={onNextStage}
            title="Next Stage"
            className="p-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors"
          >
            <SkipForward size={14} />
          </button>

          {/* Speed selector */}
          <div className="flex items-center border border-[#1e293b] bg-[#0f172a] ml-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 text-[10px] font-bold ${
                  speed === s ? 'bg-[#d4ff3f] text-black' : 'text-[#64748b] hover:text-white'
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
            title={audioEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
            className={`px-2.5 py-1.5 flex items-center gap-1.5 text-xs border transition-colors ${
              audioEnabled
                ? 'bg-[#d4ff3f]/15 border-[#d4ff3f] text-[#d4ff3f]'
                : 'bg-[#0f172a] border-[#1e293b] text-[#64748b] hover:text-[#94a3b8]'
            }`}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden sm:inline text-[10px] uppercase font-bold">
              {audioEnabled ? 'AUDIO FX: ON' : 'AUDIO FX: OFF'}
            </span>
          </button>

          {/* Case Study Story Brief Modal Button */}
          <button
            onClick={onOpenModal}
            className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs bg-[#0f172a] hover:bg-[#1e293b] text-[#38bdf8] border border-[#1e293b] hover:border-[#38bdf8]/50 transition-colors uppercase font-bold"
          >
            <Info size={13} />
            <span className="hidden sm:inline text-[10px]">RESCUE BRIEF</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
