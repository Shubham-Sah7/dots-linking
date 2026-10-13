'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { JevStageData } from './types';
import { SATELLITE_NODES } from './stages-data';
import { X, CheckCircle2 } from 'lucide-react';

interface DandelionCanvasProps {
  currentStage: JevStageData;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

// Logical workflow edges connecting issues, screening, patches, testing, and decisions
const WORKFLOW_EDGES = [
  { from: 'node-center', to: 'node-upper-left', label: 'Screen backlog' },
  { from: 'node-upper-left', to: 'node-low-left', label: 'Repro check' },
  { from: 'node-upper-left', to: 'node-mid-right', label: 'Scope check' },
  { from: 'node-center', to: 'node-shortlist', label: 'Filter shortlist' },
  { from: 'node-shortlist', to: 'node-mid-left', label: 'Read repo' },
  { from: 'node-shortlist', to: 'node-patch', label: 'Generate patch' },
  { from: 'node-patch', to: 'node-top', label: 'Run test suite' },
  { from: 'node-top', to: 'node-tests', label: 'Vector check' },
  { from: 'node-top', to: 'node-low-right', label: 'Pass validation' },
  { from: 'node-low-right', to: 'node-top-right', label: 'Human review' },
  { from: 'node-mid-right', to: 'node-far-right', label: 'Bounded scope' },
  { from: 'node-center', to: 'node-merge', label: 'Backlog intake' },
];

export function DandelionCanvas({
  currentStage,
  selectedNode,
  onSelectNode,
}: DandelionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Derive active node details for the inspection panel
  const activeNodeData = useMemo(() => {
    if (!selectedNode) return null;
    return SATELLITE_NODES.find((n) => n.id === selectedNode) || null;
  }, [selectedNode]);

  // Main 60fps render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Maximem Brand Canvas Background (#1B1B19)
      ctx.fillStyle = '#1B1B19';
      ctx.fillRect(0, 0, width, height);

      // Subtle enterprise dot grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const gridSize = 36;
      for (let x = gridSize; x < width; x += gridSize) {
        for (let y = gridSize; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Compute node positions on current canvas dimensions
      const padX = Math.min(width * 0.09, 80);
      const padY = Math.min(height * 0.1, 55);
      const usableW = width - padX * 2;
      const usableH = height - padY * 2;

      const nodePositions: Record<string, { x: number; y: number; radius: number }> = {};
      SATELLITE_NODES.forEach((node) => {
        const cx = padX + node.xRatio * usableW;
        const cy = padY + node.yRatio * usableH;
        // Meaningful node radii: hub is distinct, major stages prominent, satellites compact
        let r = 12;
        if (node.id === 'node-center') r = 24;
        else if (['node-shortlist', 'node-patch', 'node-top', 'node-top-right', 'node-upper-left'].includes(node.id)) {
          r = 16;
        }
        nodePositions[node.id] = { x: cx, y: cy, radius: r };
      });

      // 2. Draw Connections Between Nodes
      WORKFLOW_EDGES.forEach(({ from, to }) => {
        const p1 = nodePositions[from];
        const p2 = nodePositions[to];
        if (!p1 || !p2) return;

        // Determine if connection is active in the current stage or connected to selected/hovered node
        const isCurrentStageTarget =
          (from === 'node-center' && to === currentStage.targetNodeId) ||
          (from === currentStage.targetNodeId || to === currentStage.targetNodeId);

        const isRelatedToSelection =
          (selectedNode && (from === selectedNode || to === selectedNode)) ||
          (hoveredNode && (from === hoveredNode || to === hoveredNode));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (isRelatedToSelection) {
          ctx.strokeStyle = '#F26522';
          ctx.lineWidth = 1.75;
          ctx.stroke();
        } else if (isCurrentStageTarget) {
          ctx.strokeStyle = 'rgba(242, 101, 34, 0.65)';
          ctx.lineWidth = 1.25;
          ctx.stroke();

          // Traveling discrete data packet (orange)
          const pulseT = (time * 0.6 + (p1.x + p2.y) * 0.003) % 1;
          const px = p1.x + (p2.x - p1.x) * pulseT;
          const py = p1.y + (p2.y - p1.y) * pulseT;
          ctx.fillStyle = '#F26522';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }

        // Draw clean directional chevron along edge midpoint
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.fillStyle = isRelatedToSelection || isCurrentStageTarget ? '#F26522' : 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-3, -3);
        ctx.lineTo(3, 0);
        ctx.lineTo(-3, 3);
        ctx.lineTo(-1, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 3. Draw Clean, Solid Restrained Nodes
      SATELLITE_NODES.forEach((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return;

        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const isTarget = currentStage.targetNodeId === node.id;
        const isPassed = node.state === 'passed' || node.state === 'merged';

        const baseR = pos.radius;
        const r = isHovered || isSelected ? baseR + 2 : baseR;

        // Outer focus ring for selected or target node
        if (isSelected || isTarget) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#F26522' : 'rgba(242, 101, 34, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash(isSelected ? [] : [3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Solid Node Body
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);

        if (isSelected || isTarget) {
          ctx.fillStyle = '#F26522';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Inner white pip
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else if (isPassed) {
          ctx.fillStyle = '#272724';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Subtle warm white check/core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#e4e4e7';
          ctx.fill();
        } else {
          // Neutral / idle node
          ctx.fillStyle = isHovered ? '#2c2c28' : '#20201d';
          ctx.fill();
          ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Inner muted dot
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
        }

        // Node Labels: render clean pill background for maximum legibility
        ctx.save();
        const labelY = pos.y + r + 13;
        const sublabelY = labelY + 11;

        ctx.font = 'bold 10.5px var(--font-sans, system-ui, sans-serif)';
        const labelWidth = ctx.measureText(node.label).width;
        ctx.font = '9px var(--font-mono, monospace)';
        const sublabelWidth = ctx.measureText(node.sublabel).width;
        const badgeW = Math.max(labelWidth, sublabelWidth) + 12;
        const badgeH = 24;

        // Label background badge
        ctx.fillStyle = 'rgba(22, 22, 20, 0.88)';
        ctx.strokeStyle = isSelected || isTarget ? 'rgba(242, 101, 34, 0.4)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.75;
        const badgeX = pos.x - badgeW / 2;
        const badgeTop = labelY - 10;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeTop, badgeW, badgeH, 3);
        ctx.fill();
        ctx.stroke();

        // Primary Label
        ctx.font = 'bold 10px var(--font-sans, system-ui, sans-serif)';
        ctx.textAlign = 'center';
        ctx.fillStyle = isSelected || isTarget ? '#ffffff' : '#f4f4f5';
        ctx.fillText(node.label, pos.x, labelY);

        // Secondary Metadata
        ctx.font = '8.5px var(--font-mono, monospace)';
        ctx.fillStyle = isSelected || isTarget ? '#F26522' : '#71717a';
        ctx.fillText(node.sublabel, pos.x, sublabelY);

        ctx.restore();
      });

      // 4. Draw Stage HUD Card (Maximem Enterprise Style)
      const targetPos = nodePositions[currentStage.targetNodeId] || nodePositions['node-shortlist'];
      if (currentStage.hudCard && targetPos) {
        ctx.save();
        const cardW = 220;
        const cardH = 64;

        // Position card near target without overflowing canvas
        let cardX = targetPos.x + 36;
        let cardY = targetPos.y - 32;
        if (cardX + cardW > width - 20) cardX = targetPos.x - cardW - 36;
        if (cardY < 20) cardY = 20;
        if (cardY + cardH > height - 20) cardY = height - cardH - 20;

        // Charcoal card surface
        ctx.fillStyle = '#141413';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 4);
        ctx.fill();
        ctx.stroke();

        // Left solid orange accent border bar
        ctx.fillStyle = '#F26522';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, 3, cardH, [4, 0, 0, 4]);
        ctx.fill();

        // HUD Title
        ctx.font = 'bold 11px var(--font-sans, system-ui, sans-serif)';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(currentStage.hudCard.title, cardX + 12, cardY + 18);

        // Metric Line 1
        ctx.font = 'bold 10px var(--font-mono, monospace)';
        ctx.fillStyle = '#F26522';
        ctx.fillText(currentStage.hudCard.line1, cardX + 12, cardY + 35);

        // Metric Line 2
        ctx.font = '9.5px var(--font-mono, monospace)';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(currentStage.hudCard.line2, cardX + 12, cardY + 50);

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentStage, hoveredNode, selectedNode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y, active: true };

    const padX = Math.min(rect.width * 0.09, 80);
    const padY = Math.min(rect.height * 0.1, 55);
    const usableW = rect.width - padX * 2;
    const usableH = rect.height - padY * 2;

    let found: string | null = null;
    SATELLITE_NODES.forEach((node) => {
      const cx = padX + node.xRatio * usableW;
      const cy = padY + node.yRatio * usableH;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 26) {
        found = node.id;
      }
    });

    setHoveredNode(found);
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
    setHoveredNode(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      onSelectNode(selectedNode === hoveredNode ? null : hoveredNode);
    } else {
      onSelectNode(null);
    }
  }, [hoveredNode, selectedNode, onSelectNode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] bg-[#1B1B19] overflow-hidden select-none cursor-default border-b border-white/[0.08]"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-full h-full block"
      />

      {/* Clean Maximem Selected Node Inspection Panel (HTML Overlay) */}
      {activeNodeData && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-72 bg-[#141413]/95 backdrop-blur-md border border-white/[0.12] rounded-md shadow-xl p-3.5 text-xs font-mono z-20 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#F26522]" />
              <span className="text-white font-bold text-[12px] font-sans">
                {activeNodeData.label}
              </span>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              className="text-[#71717a] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#71717a]">Handler:</span>
              <span className="text-[#f4f4f5] font-semibold">{activeNodeData.sublabel}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#71717a]">Status:</span>
              <span className="text-[#F26522] uppercase font-bold flex items-center gap-1">
                <CheckCircle2 size={11} />
                {activeNodeData.state}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#71717a]">Target Scope:</span>
              <span className="text-[#a1a1aa]">
                {activeNodeData.id === 'node-center'
                  ? '15,000 issues'
                  : activeNodeData.id === 'node-shortlist'
                  ? '360 candidates'
                  : activeNodeData.id === 'node-top'
                  ? '42 patches'
                  : 'Screening pipeline'}
              </span>
            </div>

            <div className="flex justify-between border-t border-white/[0.06] pt-1.5 mt-1.5">
              <span className="text-[#71717a]">Workflow Stage:</span>
              <span className="text-white font-sans font-medium">{currentStage.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
