'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderBar } from './header-bar';
import { NetworkCanvas } from './network-canvas';
import { DividerBar } from './divider-bar';
import { TelemetryModules } from './telemetry-modules';
import { PlaybackDock } from './playback-dock';
import { CaseStudyModal } from './case-study-modal';
import { STAGES_DATA } from './stages-data';
import { StageData } from './types';
import { soundEngine } from './audio-engine';
import { GraphSidebar } from '@/components/synap-memory-map/graph-sidebar';

const TOTAL_DURATION = 28.0;

export function RescueDashboardView() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevStageIndexRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Derive current stage from currentTime
  const currentStage: StageData = React.useMemo(() => {
    const stage = STAGES_DATA.find(
      (st) => currentTime >= st.timeStart && currentTime < st.timeEnd
    );
    return stage || STAGES_DATA[STAGES_DATA.length - 1];
  }, [currentTime]);

  // Audio cue on stage transition
  useEffect(() => {
    if (currentStage.index !== prevStageIndexRef.current) {
      soundEngine.playStageTransition();
      prevStageIndexRef.current = currentStage.index;
    }
  }, [currentStage.index]);

  // Animation frame playback loop
  useEffect(() => {
    let animId: number;

    const tick = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSec * speed;
          if (next >= TOTAL_DURATION) {
            return 0; // loop seamlessly
          }
          return next;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(TOTAL_DURATION, time)));
  }, []);

  const handleSelectStage = useCallback((stage: StageData) => {
    setCurrentTime(stage.timeStart);
  }, []);

  const handlePrevStage = useCallback(() => {
    const nextIdx = Math.max(0, currentStage.index - 1);
    setCurrentTime(STAGES_DATA[nextIdx].timeStart);
  }, [currentStage.index]);

  const handleNextStage = useCallback(() => {
    const nextIdx = Math.min(STAGES_DATA.length - 1, currentStage.index + 1);
    setCurrentTime(STAGES_DATA[nextIdx].timeStart);
  }, [currentStage.index]);

  const handleReset = useCallback(() => {
    setCurrentTime(0);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStage();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextStage();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handlePrevStage, handleNextStage, handleReset]);

  return (
    <div className="min-h-screen w-full bg-[#1B1B19] text-[#F4F4F5] font-mono flex flex-row selection:bg-[#F26522] selection:text-white">
      {/* Fixed Full-Height Left Navigation Sidebar matching reference image */}
      <GraphSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between min-h-screen">
        {/* 1. Header Bar: Meta & 8 Pipeline Tabs */}
        <HeaderBar currentStage={currentStage} onSelectStage={handleSelectStage} />

        {/* 2. Interactive Network Canvas (Center Swarm Graph) */}
        <div className="relative w-full flex-1 flex flex-col">
          <NetworkCanvas
            currentStage={currentStage}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />

          {/* 3. Middle Status Banner Divider */}
          <DividerBar currentStage={currentStage} />

          {/* 4. Bottom 8-Module HUD Telemetry Modules */}
          <TelemetryModules
            currentStage={currentStage}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
        </div>

        {/* 5. Bottom Playback Dock (Scrubber, Controls, Audio, Fullscreen) */}
        <PlaybackDock
          currentTime={currentTime}
          duration={TOTAL_DURATION}
          isPlaying={isPlaying}
          speed={speed}
          currentStage={currentStage}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onPrevStage={handlePrevStage}
          onNextStage={handleNextStage}
          onSpeedChange={setSpeed}
          onReset={handleReset}
          onOpenModal={() => setIsModalOpen(true)}
        />

        {/* 6. Context & Rescue Brief Modal */}
        <CaseStudyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
