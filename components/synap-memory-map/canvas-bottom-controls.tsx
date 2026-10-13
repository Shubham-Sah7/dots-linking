'use client';

import React from 'react';
import { Minus, Plus, Maximize, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';

interface CanvasBottomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenGuide?: () => void;
  isDetailPanelOpen?: boolean;
  onToggleDetailPanel?: () => void;
  patternMode?: 'integrated' | 'reference';
  onTogglePatternMode?: () => void;
  onOpenPatternModal?: () => void;
  onFocusScopeTier?: (tier: 'overview' | 'customer' | 'user' | 'memory') => void;
}

export function CanvasBottomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenGuide,
  isDetailPanelOpen,
  onToggleDetailPanel,
  patternMode = 'integrated',
  onTogglePatternMode,
  onOpenPatternModal,
  onFocusScopeTier,
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

        {/* Active vs Superseded vs Selected */}
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-white ring-1 ring-white/40" />
          <span className="text-[11px]">Active</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-dashed border-white/40 bg-[#d97706]/30" />
          <span className="text-[11px]">Superseded</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-[#f26522] bg-[#f26522]" />
          <span className="text-[11px] text-[#f26522]">Selected</span>
        </div>

        {/* Scope Boundaries */}
        <div className="flex items-center gap-1.5 border-l border-white/[0.08] pl-3">
          <span className="w-3 h-2 rounded border border-white/20 bg-white/5" />
          <span className="text-[11px]">Scope Boundaries</span>
        </div>

        {/* Dotted Scope Silhouette */}
        <div className="flex items-center gap-1.5 border-l border-white/[0.08] pl-3">
          <span className="flex items-center gap-0.5">
            <span className="size-1 rounded-full bg-white/60" />
            <span className="size-1 rounded-full bg-[#f26522]" />
            <span className="size-1 rounded-full bg-white/60" />
          </span>
          <span className="text-[11px]">Dotted Silhouette</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="pointer-events-auto bg-[#141413]/90 backdrop-blur-md px-2.5 py-1.5 border border-white/[0.09] rounded-xl text-xs text-white flex items-center gap-1.5 font-mono shadow-lg">
        {onTogglePatternMode && (
          <>
            <button
              id="toggle-pattern-mode-btn"
              onClick={onTogglePatternMode}
              title={
                patternMode === 'reference'
                  ? 'Switch back to Maximem Brand Layer'
                  : 'Switch to Reference B&W Dotted Silhouette'
              }
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
                patternMode === 'reference'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white border border-white/[0.08]'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  patternMode === 'reference' ? 'bg-black' : 'bg-[#f26522]'
                }`}
              />
              <span>{patternMode === 'reference' ? 'Reference B&W' : 'Maximem Map'}</span>
            </button>

            <div className="w-[1px] h-3.5 bg-white/[0.12] mx-0.5" />
          </>
        )}

        {onOpenPatternModal && (
          <>
            <button
              id="open-dotted-pattern-modal-btn"
              onClick={onOpenPatternModal}
              title="Inspect Reference Dotted Pattern (Customizable Spacing, Size & SVG Export)"
              className="px-2.5 py-1 text-[11px] rounded-lg hover:text-[#f26522] hover:bg-[#f26522]/10 transition-colors flex items-center gap-1.5 text-white/80 font-semibold border border-white/[0.08] bg-white/[0.03]"
            >
              <Sparkles size={12} className="text-[#f26522]" />
              <span>Dot Pattern</span>
            </button>

            <div className="w-[1px] h-3.5 bg-white/[0.12] mx-0.5" />
          </>
        )}

        {/* Interactive Scope Tier Transitions (Zoom-out -> Zoom-in -> Deep Memory) */}
        {onFocusScopeTier && (
          <div className="hidden lg:flex items-center rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06] text-[10px] font-mono mr-1">
            <button
              onClick={() => onFocusScopeTier('overview')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomLevel < 0.95
                  ? 'bg-[#f26522] text-white font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Zoom out: Full Client & Customer overview"
            >
              Overview
            </button>
            <button
              onClick={() => onFocusScopeTier('customer')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomLevel >= 0.95 && zoomLevel < 1.35
                  ? 'bg-[#f26522] text-white font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Zoom in: Customer Scope territory"
            >
              Customer
            </button>
            <button
              onClick={() => onFocusScopeTier('user')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomLevel >= 1.35 && zoomLevel < 1.6
                  ? 'bg-[#f26522] text-white font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Zoom in: User Enclave"
            >
              User
            </button>
            <button
              onClick={() => onFocusScopeTier('memory')}
              className={`px-2 py-0.5 rounded transition-all ${
                zoomLevel >= 1.6
                  ? 'bg-[#f26522] text-white font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Deep Zoom: Inspect individual memory node & relationships"
            >
              Memory
            </button>
          </div>
        )}

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
          id="fit-view-bottom-btn"
          onClick={onResetZoom}
          title="Fit Canvas to Overview"
          className="px-2 py-0.5 text-[11px] hover:text-[#f26522] hover:bg-white/[0.08] rounded-lg transition-colors flex items-center gap-1 text-[#f26522] font-semibold"
        >
          <Maximize size={11} />
          <span>Fit View</span>
        </button>

        {onToggleDetailPanel && (
          <>
            <div className="w-[1px] h-3.5 bg-white/[0.12] mx-1" />
            <button
              id="toggle-panel-bottom-btn"
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
