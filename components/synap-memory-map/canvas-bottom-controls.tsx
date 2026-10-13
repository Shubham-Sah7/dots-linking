'use client';

import React from 'react';
import { Minus, Plus, Maximize, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface CanvasBottomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenGuide?: () => void;
  isDetailPanelOpen?: boolean;
  onToggleDetailPanel?: () => void;
}

export function CanvasBottomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenGuide,
  isDetailPanelOpen,
  onToggleDetailPanel,
}: CanvasBottomControlsProps) {
  return (
    <div className="absolute bottom-4 inset-x-6 z-20 flex flex-wrap items-center justify-between pointer-events-none font-sans select-none gap-2">
      {/* Left Legend: Real Visual Grammar */}
      <div className="pointer-events-auto bg-[#141413]/90 backdrop-blur-md px-3.5 py-1.5 border border-white/[0.09] rounded-xl text-xs text-white/70 flex flex-wrap items-center gap-4 shadow-lg">
        {/* Node size = importance */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#f26522]" />
            <span className="size-2.5 rounded-full bg-[#f26522]" />
          </span>
          <span className="text-[11px]">Size = Importance (1-5)</span>
        </div>

        {/* Active vs Superseded */}
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px]">Active</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-dashed border-amber-400 bg-amber-400/20" />
          <span className="text-[11px]">Superseded</span>
        </div>

        {/* Scope Boundaries */}
        <div className="flex items-center gap-1.5 border-l border-white/[0.08] pl-3">
          <span className="w-3 h-2 rounded border border-[#f26522]/50 bg-[#f26522]/10" />
          <span className="text-[11px]">Non-Overlapping Scopes</span>
        </div>
      </div>

      {/* Right Zoom Controls */}
      <div className="pointer-events-auto bg-[#141413]/90 backdrop-blur-md px-2.5 py-1.5 border border-white/[0.09] rounded-xl text-xs text-white flex items-center gap-1.5 font-mono shadow-lg">
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors text-white/70"
        >
          <Minus size={13} />
        </button>

        <span className="px-2 text-xs font-bold text-white min-w-[50px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors text-white/70"
        >
          <Plus size={13} />
        </button>

        <div className="w-[1px] h-3.5 bg-white/[0.12] mx-1" />

        <button
          onClick={onResetZoom}
          title="Fit Canvas to Overview (88% viewport)"
          className="px-2 py-0.5 text-[11px] hover:text-[#f26522] hover:bg-white/[0.08] rounded-lg transition-colors flex items-center gap-1 text-[#f26522] font-semibold"
        >
          <Maximize size={11} />
          <span>Fit View</span>
        </button>

        {onToggleDetailPanel && (
          <>
            <div className="w-[1px] h-3.5 bg-white/[0.12] mx-1" />
            <button
              onClick={onToggleDetailPanel}
              title={isDetailPanelOpen ? 'Collapse side panel' : 'Expand side panel'}
              className="px-2 py-0.5 text-[11px] hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 text-white/80 font-semibold"
            >
              {isDetailPanelOpen ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
              <span>{isDetailPanelOpen ? 'Hide Panel' : 'Panel'}</span>
            </button>
          </>
        )}

        {onOpenGuide && (
          <>
            <div className="w-[1px] h-3.5 bg-white/[0.12] mx-1" />
            <button
              onClick={onOpenGuide}
              title="Founder Guide: Scope & Memory Rules"
              className="px-2 py-0.5 text-[11px] hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 text-white/80 font-semibold"
            >
              <span className="size-1.5 rounded-full bg-[#f26522]" />
              <span>Spec Guide</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
