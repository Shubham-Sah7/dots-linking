'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { JevStageData } from './types';
import { SATELLITE_NODES } from './stages-data';

interface DandelionCanvasProps {
  currentStage: JevStageData;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function DandelionCanvas({
  currentStage,
  selectedNode,
  onSelectNode,
}: DandelionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Main 60fps render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.022;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep space black canvas
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, width, height);

      // Cyber ambient space grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Compute node positions on current canvas size
      const padX = Math.min(width * 0.08, 60);
      const padY = Math.min(height * 0.08, 40);
      const usableW = width - padX * 2;
      const usableH = height - padY * 2;

      const nodePositions: Record<string, { x: number; y: number; radius: number }> = {};
      SATELLITE_NODES.forEach((node) => {
        const cx = padX + node.xRatio * usableW;
        const cy = padY + node.yRatio * usableH;
        nodePositions[node.id] = { x: cx, y: cy, radius: node.radius };
      });

      // 1. DRAW FAINT CONCENTRIC RADAR RINGS AROUND PRIMARY CENTRAL HUB
      const centerNode = nodePositions['node-center'];
      if (centerNode) {
        [80, 150, 240, 340].forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(centerNode.x, centerNode.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.04)' : 'rgba(255, 45, 85, 0.03)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 2. DRAW INTER-NODE ENERGY STRANDS (FILAMENTS)
      const connections = [
        ['node-center', 'node-top'],
        ['node-center', 'node-top-right'],
        ['node-center', 'node-mid-right'],
        ['node-center', 'node-low-right'],
        ['node-center', 'node-shortlist'],
        ['node-center', 'node-low-left'],
        ['node-center', 'node-mid-left'],
        ['node-center', 'node-upper-left'],
        ['node-center', 'node-patch'],
        ['node-top', 'node-top-right'],
        ['node-mid-right', 'node-far-right'],
        ['node-low-left', 'node-shortlist'],
        ['node-mid-left', 'node-upper-left'],
        ['node-upper-left', 'node-patch'],
      ];

      connections.forEach(([id1, id2]) => {
        const p1 = nodePositions[id1];
        const p2 = nodePositions[id2];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Traveling pulses
        const pulseT = (time * 0.4 + (p1.x + p2.y) * 0.005) % 1;
        const px = p1.x + (p2.x - p1.x) * pulseT;
        const py = p1.y + (p2.y - p1.y) * pulseT;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. DRAW DANDELION / SEA URCHIN ASTEROIDS WITH RADIATING SPICULE SPINES
      SATELLITE_NODES.forEach((node, nIdx) => {
        const pos = nodePositions[node.id];
        if (!pos) return;

        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const isTarget = currentStage.targetNodeId === node.id;

        // Core breathing
        const breath = 1 + 0.06 * Math.sin(time * 1.5 + nIdx * 1.8);
        const coreR = node.radius * breath * (isHovered || isSelected ? 1.2 : 1.0);

        // Core radial ambient glow
        const glowR = coreR * 2.2;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
        grad.addColorStop(0, 'rgba(255, 45, 85, 0.35)');
        grad.addColorStop(0.6, 'rgba(255, 45, 85, 0.08)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Radiating spicule spines (100–180 filaments)
        const count = node.spinesCount;
        const baseLen = node.spinesLength * (isHovered ? 1.2 : 1.0);

        ctx.save();
        for (let s = 0; s < count; s++) {
          const angle = (s / count) * Math.PI * 2;
          const wave = Math.sin(time * 1.8 + s * 0.4 + nIdx) * 0.18;
          const spineLen = baseLen * (0.8 + wave + (s % 5) * 0.05);

          const startX = pos.x + Math.cos(angle) * (coreR * 0.6);
          const startY = pos.y + Math.sin(angle) * (coreR * 0.6);
          const endX = pos.x + Math.cos(angle) * spineLen;
          const endY = pos.y + Math.sin(angle) * spineLen;

          // Gradient on spine: crimson core -> cyan-white tip
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);

          if (isTarget) {
            ctx.strokeStyle = s % 3 === 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 45, 85, 0.5)';
            ctx.lineWidth = s % 4 === 0 ? 1.2 : 0.65;
          } else {
            ctx.strokeStyle = s % 4 === 0 ? 'rgba(147, 197, 253, 0.35)' : 'rgba(255, 45, 85, 0.35)';
            ctx.lineWidth = 0.55;
          }
          ctx.stroke();

          // Tiny tip dot
          if (s % 3 === 0) {
            ctx.fillStyle = s % 6 === 0 ? '#38bdf8' : '#ffffff';
            ctx.beginPath();
            ctx.arc(endX, endY, 0.85, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // Tangled inner core filaments
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a1 = (i / 16) * Math.PI * 2;
          const a2 = ((i * 7) / 16) * Math.PI * 2;
          const r1 = coreR * 0.8 * (0.5 + 0.5 * Math.sin(time + i));
          const r2 = coreR * 0.8 * (0.5 + 0.5 * Math.cos(time + i));
          ctx.moveTo(pos.x + Math.cos(a1) * r1, pos.y + Math.sin(a1) * r1);
          ctx.lineTo(pos.x + Math.cos(a2) * r2, pos.y + Math.sin(a2) * r2);
        }
        ctx.stroke();
        ctx.restore();

        // Core solid glowing sphere
        const coreGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreR * 0.65);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, '#ff2d55');
        coreGrad.addColorStop(1, 'rgba(255, 0, 85, 0.85)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreR * 0.65, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. DRAW DYNAMIC TARGETING LADDER LASER BEAM
      const targetPos = nodePositions[currentStage.targetNodeId] || nodePositions['node-shortlist'];
      if (centerNode && targetPos && currentStage.targetNodeId !== 'node-center') {
        const dx = targetPos.x - centerNode.x;
        const dy = targetPos.y - centerNode.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        ctx.save();
        // Cyan main rails
        const railOffset = 7;
        const r1StartX = centerNode.x + nx * railOffset;
        const r1StartY = centerNode.y + ny * railOffset;
        const r1EndX = targetPos.x + nx * railOffset;
        const r1EndY = targetPos.y + ny * railOffset;

        const r2StartX = centerNode.x - nx * railOffset;
        const r2StartY = centerNode.y - ny * railOffset;
        const r2EndX = targetPos.x - nx * railOffset;
        const r2EndY = targetPos.y - ny * railOffset;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(r1StartX, r1StartY);
        ctx.lineTo(r1EndX, r1EndY);
        ctx.moveTo(r2StartX, r2StartY);
        ctx.lineTo(r2EndX, r2EndY);
        ctx.stroke();

        // Ladder rungs
        const rungs = Math.floor(len / 12);
        for (let r = 0; r < rungs; r++) {
          const t = r / rungs;
          const rx1 = r1StartX + (r1EndX - r1StartX) * t;
          const ry1 = r1StartY + (r1EndY - r1StartY) * t;
          const rx2 = r2StartX + (r2EndX - r2StartX) * t;
          const ry2 = r2StartY + (r2EndY - r2StartY) * t;

          ctx.beginPath();
          ctx.moveTo(rx1, ry1);
          ctx.lineTo(rx2, ry2);
          ctx.strokeStyle = r % 2 === 0 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. DRAW STAGE HUD INSPECTION CARD
      if (currentStage.hudCard && targetPos) {
        ctx.save();
        const cardX = targetPos.x + 30;
        const cardY = targetPos.y - 30;
        const cardW = 210;
        const cardH = 68;

        // Dark glass background
        ctx.fillStyle = 'rgba(3, 7, 13, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardW, cardH);
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Vertical cyan LED ladder bar on the left
        const barX = cardX - 16;
        const barY = cardY;
        const barH = cardH;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.strokeRect(barX, barY, 10, barH);
        const steps = 8;
        for (let st = 0; st < steps; st++) {
          const sy = barY + barH - (st + 1) * (barH / steps) + 1;
          ctx.fillStyle = st < (currentStage.hudCard.meterLevel || 6) ? '#38bdf8' : '#1e293b';
          ctx.fillRect(barX + 1.5, sy, 7, barH / steps - 2);
        }

        // Text
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(currentStage.hudCard.title, cardX + 10, cardY + 18);

        ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(currentStage.hudCard.line1, cardX + 10, cardY + 36);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(currentStage.hudCard.line2, cardX + 10, cardY + 52);
        ctx.restore();
      }

      // 6. DRAW TACTICAL MONOSPACE CALLOUTS
      currentStage.callouts.forEach((callout) => {
        const cx = padX + callout.xRatio * usableW;
        const cy = padY + callout.yRatio * usableH;

        ctx.save();
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(callout.text, cx, cy);

        if (callout.subtext) {
          ctx.font = '9.5px ui-monospace, monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(callout.subtext, cx, cy + 12);
        }
        ctx.restore();
      });

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
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;

    mouseRef.current = { x, y, active: true };

    const padX = Math.min(rect.width * 0.08, 60);
    const padY = Math.min(rect.height * 0.08, 40);
    const usableW = rect.width - padX * 2;
    const usableH = rect.height - padY * 2;

    let found: string | null = null;
    SATELLITE_NODES.forEach((node) => {
      const cx = padX + node.xRatio * usableW;
      const cy = padY + node.yRatio * usableH;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < node.radius + 20) {
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
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[530px] bg-[#020408] overflow-hidden select-none cursor-crosshair border-b border-[#141b26]"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-full h-full block"
      />
    </div>
  );
}
