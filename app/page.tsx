'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RescueDashboardView } from '@/components/rescue-dashboard/rescue-dashboard-view';
import { SynapMemoryView } from '@/components/synap-memory-map/synap-memory-view';
import { JevDashboardView } from '@/components/jev-dashboard/jev-dashboard-view';
import { DashboardModeSwitcher, DashboardMode } from '@/components/dashboard-mode-switcher';

function MainDashboardContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('view') as DashboardMode) || 'synap';
  const showSwitcher = searchParams.get('switcher') === 'true';
  const [currentMode, setCurrentMode] = useState<DashboardMode>(initialMode);

  return (
    <main
      className={`w-full bg-[#000000] text-white flex flex-col ${
        currentMode === 'synap' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Project Switcher Bar (only when explicitly requested via ?switcher=true) */}
      {showSwitcher && (
        <DashboardModeSwitcher
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
      )}

      {/* Active Dashboard View: Memory Map Graph is default where everything is */}
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
