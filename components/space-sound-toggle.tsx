"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Volume1, Sparkles } from "lucide-react";
import { spaceSoundscape } from "@/lib/audio/space-soundscape";

export function SpaceSoundToggle() {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.45);
  const [showSlider, setShowSlider] = useState(false);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Sync initial state
    setIsMuted(spaceSoundscape.isMuted);
    setVolume(spaceSoundscape.volume);

    // Subscribe to external updates
    const unsubscribe = spaceSoundscape.subscribe(() => {
      setIsMuted(spaceSoundscape.isMuted);
      setVolume(spaceSoundscape.volume);
    });

    return () => {
      unsubscribe();
      if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
    };
  }, []);

  const handleToggle = () => {
    spaceSoundscape.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    spaceSoundscape.setVolume(newVol);
    if (spaceSoundscape.isMuted && newVol > 0) {
      spaceSoundscape.startAudio();
    }
  };

  const handleMouseEnter = () => {
    if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
    setShowSlider(true);
  };

  const handleMouseLeave = () => {
    sliderTimeoutRef.current = setTimeout(() => {
      setShowSlider(false);
    }, 450);
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sound Toggle Button */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-mono transition-all duration-200 cursor-pointer border ${
          !isMuted
            ? "bg-[#f26522]/15 text-[#f26522] border-[#f26522]/40 shadow-[0_0_12px_rgba(242,101,34,0.25)]"
            : "bg-[#181816]/90 text-[#71717a] hover:text-[#d4d4d8] border-white/[0.08] hover:border-white/20"
        }`}
        title={isMuted ? "Unmute Cinematic Space Ambience" : "Mute Space Ambience"}
      >
        {!isMuted ? (
          volume > 0.5 ? (
            <Volume2 size={13} className="text-[#f26522] animate-pulse" />
          ) : (
            <Volume1 size={13} className="text-[#f26522]" />
          )
        ) : (
          <VolumeX size={13} />
        )}
        <span className="text-[11px] font-medium hidden sm:inline">
          {!isMuted ? "Space Audio" : "Audio Off"}
        </span>
      </button>

      {/* Flyout Volume Slider Popover */}
      {showSlider && (
        <div className="absolute right-0 top-full mt-2 z-50 p-2.5 rounded-xl bg-[#141412]/95 backdrop-blur-xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.85)] flex items-center gap-2.5 min-w-[170px] animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={handleToggle}
            className="text-[#a1a1aa] hover:text-[#f26522] transition-colors"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#f26522]"
          />

          <span className="text-[10px] font-mono text-[#a1a1aa] w-7 text-right">
            {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      )}
    </div>
  );
}
