'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RescueDashboardView } from '@/components/rescue-dashboard/rescue-dashboard-view';
import { SynapMemoryView } from '@/components/synap-memory-map/synap-memory-view';
import { JevDashboardView } from '@/components/jev-dashboard/jev-dashboard-view';
import { DashboardModeSwitcher, DashboardMode } from '@/components/dashboard-mode-switcher';

function MainDashboardContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('view') as DashboardMode) || 'rescue';
  const [currentMode, setCurrentMode] = useState<DashboardMode>(initialMode);

  return (
    <main
      className={`w-full bg-[#000000] text-white flex flex-col ${
        currentMode === 'synap' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Project Switcher Bar */}
      <DashboardModeSwitcher
        currentMode={currentMode}
        onModeChange={setCurrentMode}
      />

      {/* Active Dashboard View: 1. Rescue (Default), 2. Synap, 3. Sonnet 5.5 + Jev */}
      {currentMode === 'rescue' && <RescueDashboardView />}
      {currentMode === 'synap' && <SynapMemoryView />}
      {currentMode === 'jev' && <JevDashboardView />}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000000] text-white flex items-center justify-center font-mono text-xs">Loading Dashboard...</div>}>
      <MainDashboardContent />
    </Suspense>
  );
}
