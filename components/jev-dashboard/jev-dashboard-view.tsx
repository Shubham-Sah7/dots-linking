'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderBar } from './header-bar';
import { DandelionCanvas } from './dandelion-canvas';
import { DividerBar } from './divider-bar';
import { TelemetryModules } from './telemetry-modules';
import { PlaybackDock } from './playback-dock';
import { CaseStudyModal } from './case-study-modal';
import { JEV_STAGES_DATA } from './stages-data';
import { JevStageData } from './types';
import { soundEngine } from '../rescue-dashboard/audio-engine';

const TOTAL_DURATION = 26.0;

export function JevDashboardView() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevStageIndexRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Derive current stage
  const currentStage: JevStageData = React.useMemo(() => {
    const stage = JEV_STAGES_DATA.find(
      (st) => currentTime >= st.timeStart && currentTime < st.timeEnd
    );
    return stage || JEV_STAGES_DATA[JEV_STAGES_DATA.length - 1];
  }, [currentTime]);

  // Audio cue on transition
  useEffect(() => {
    if (currentStage.index !== prevStageIndexRef.current) {
      soundEngine.playStageTransition();
      prevStageIndexRef.current = currentStage.index;
    }
  }, [currentStage.index]);

  // Playback animation loop
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
            return 0; // loop
          }
          return next;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed]);

  // Handlers
  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(TOTAL_DURATION, time)));
  }, []);

  const handleSelectStage = useCallback((stage: JevStageData) => {
    setCurrentTime(stage.timeStart);
  }, []);

  const handlePrevStage = useCallback(() => {
    const nextIdx = Math.max(0, currentStage.index - 1);
    setCurrentTime(JEV_STAGES_DATA[nextIdx].timeStart);
  }, [currentStage.index]);

  const handleNextStage = useCallback(() => {
    const nextIdx = Math.min(JEV_STAGES_DATA.length - 1, currentStage.index + 1);
    setCurrentTime(JEV_STAGES_DATA[nextIdx].timeStart);
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
    <div className="min-h-screen w-full bg-[#1B1B19] text-white flex flex-col justify-between selection:bg-[#F26522]/30 selection:text-white">
      {/* 1. Header Bar: Title, 4 Stat Columns, 5 Tabs */}
      <HeaderBar currentStage={currentStage} onSelectStage={handleSelectStage} />

      {/* 2. Interactive Dandelion Canvas */}
      <div className="relative w-full flex-1 flex flex-col">
        <DandelionCanvas
          currentStage={currentStage}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />

        {/* 3. Divider Bar */}
        <DividerBar currentStage={currentStage} />

        {/* 4. Bottom 5-Module HUD Telemetry Grid */}
        <TelemetryModules
          currentStage={currentStage}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />
      </div>

      {/* 5. Bottom Playback Dock */}
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

      {/* 6. Case Study & Playbook Modal */}
      <CaseStudyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
