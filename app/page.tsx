'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RescueDashboardView } from '@/components/rescue-dashboard/rescue-dashboard-view';
import { SynapMemoryView } from '@/components/synap-memory-map/synap-memory-view';
import { JevDashboardView } from '@/components/jev-dashboard/jev-dashboard-view';
import { AiMemoryVisualizationSection } from '@/components/ai-memory-visualization';
import { KnowledgeSphere } from '@/components/knowledge-sphere';
import { AgentMemoryGraph } from '@/components/agent-memory-graph';
import { DashboardModeSwitcher, DashboardMode } from '@/components/dashboard-mode-switcher';

function MainDashboardContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('view') as DashboardMode) || 'sphere';
  const [currentMode, setCurrentMode] = useState<DashboardMode>(initialMode);

  return (
    <main
      className={`w-full bg-[#1B1B19] text-white flex flex-col ${
        currentMode === 'synap' || currentMode === 'visualization' || currentMode === 'sphere' || currentMode === 'agent' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Project Switcher Bar */}
      <DashboardModeSwitcher
        currentMode={currentMode}
        onModeChange={setCurrentMode}
      />

      {/* Active Dashboard View */}
      {currentMode === 'visualization' && (
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          <AiMemoryVisualizationSection className="w-full h-full" />
        </div>
      )}
      {/* {currentMode === 'rescue'        && <RescueDashboardView />} */}
      {/* {currentMode === 'synap'         && <SynapMemoryView />} */}
      {/* {currentMode === 'jev'           && <JevDashboardView />} */}
      {currentMode === 'sphere'        && (
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          <KnowledgeSphere className="w-full h-full" />
        </div>
      )}
      {currentMode === 'agent'         && (
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          <AgentMemoryGraph className="w-full h-full" />
        </div>
      )}
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
