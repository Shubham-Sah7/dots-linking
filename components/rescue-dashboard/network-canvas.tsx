'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StageData } from './types';
import { AGENT_COORDINATES } from './stages-data';

interface Vertex {
  baseR: number; // distance from cluster center
  baseAngle: number;
  rNorm: number;
  freq: number;
  phase: number;
  colorType: 'blue' | 'lime' | 'white';
  radius: number;
  alpha: number;
}

interface ClusterModel {
  id: string;
  name: string;
  label: string;
  shapeLobes: number;
  shapeSeed: number;
  vertices: Vertex[];
  boundaryIndices: number[];
}

interface DataPacket {
  fromCluster: string;
  toCluster: string;
  strandIdx: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

interface NetworkCanvasProps {
  currentStage: StageData;
  selectedAgent: string | null;
  onSelectAgent: (agentId: string | null) => void;
}

const AGENT_ORDER = ['installer', 'dependencies', 'timeline', 'projects', 'reviewer', 'export'];

// Connections matching the video topology
const INTER_CLUSTER_CONNECTIONS = [
  // Stage 0 triangle + Stage 1 full web
  { from: 'dependencies', to: 'installer', strands: 36, defaultColor: 'mixed' },
  { from: 'installer', to: 'reviewer', strands: 34, defaultColor: 'mixed' },
  { from: 'dependencies', to: 'timeline', strands: 34, defaultColor: 'mixed' },
  // Core horizontal bridge
  { from: 'dependencies', to: 'projects', strands: 44, defaultColor: 'blue', isThickBridge: true },
  { from: 'projects', to: 'reviewer', strands: 34, defaultColor: 'mixed' },
  { from: 'installer', to: 'projects', strands: 32, defaultColor: 'mixed' },
  { from: 'timeline', to: 'export', strands: 32, defaultColor: 'blue' },
  { from: 'export', to: 'reviewer', strands: 34, defaultColor: 'mixed' },
  { from: 'timeline', to: 'projects', strands: 30, defaultColor: 'blue' },
  { from: 'installer', to: 'timeline', strands: 28, defaultColor: 'mixed' },
  { from: 'projects', to: 'export', strands: 32, defaultColor: 'mixed' },
];

export function NetworkCanvas({ currentStage, selectedAgent, onSelectAgent }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clustersRef = useRef<Map<string, ClusterModel>>(new Map());
  const packetsRef = useRef<DataPacket[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Initialize organic fractal cluster models
  useEffect(() => {
    const clusterMap = new Map<string, ClusterModel>();

    AGENT_ORDER.forEach((id, cIdx) => {
      const vertexCount = 150 + Math.floor(Math.random() * 25);
      const vertices: Vertex[] = [];
      const lobes = 5 + (cIdx % 3);
      const shapeSeed = (cIdx + 1) * 2.37;

      for (let i = 0; i < vertexCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        // Amoebic / organic multi-harmonic boundary
        const lobeMod = 1 + 0.22 * Math.sin(lobes * theta + shapeSeed) + 0.12 * Math.cos(3 * theta + shapeSeed * 1.4);
        const rNorm = Math.pow(Math.random(), 0.65); // denser in center, wispier outer filaments
        const baseR = 48 * lobeMod;

        // Color distribution
        let colorType: 'blue' | 'lime' | 'white' = 'blue';
        const rand = Math.random();
        if (rand < 0.32) {
          colorType = 'lime';
        } else if (rand > 0.88) {
          colorType = 'white';
        }

        vertices.push({
          baseR,
          baseAngle: theta,
          rNorm,
          freq: 0.6 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          colorType,
          radius: 1.0 + Math.random() * 1.4,
          alpha: 0.45 + Math.random() * 0.5,
        });
      }

      // Sort some vertices by angle to create boundary contour
      const boundaryIndices = vertices
        .map((v, idx) => ({ idx, angle: v.baseAngle, rNorm: v.rNorm }))
        .filter((v) => v.rNorm > 0.75)
        .sort((a, b) => a.angle - b.angle)
        .map((v) => v.idx);

      clusterMap.set(id, {
        id,
        name: id,
        label: `agent / ${id}`,
        shapeLobes: lobes,
        shapeSeed,
        vertices,
        boundaryIndices,
      });
    });

    clustersRef.current = clusterMap;

    // Seed continuous traveling data packets along strands
    const packets: DataPacket[] = [];
    INTER_CLUSTER_CONNECTIONS.forEach((conn) => {
      const count = 4;
      for (let k = 0; k < count; k++) {
        packets.push({
          fromCluster: conn.from,
          toCluster: conn.to,
          strandIdx: Math.floor(Math.random() * conn.strands),
          progress: Math.random(),
          speed: 0.012 + Math.random() * 0.016,
          color: Math.random() < 0.35 ? '#d4ff3f' : '#60a5fa',
          size: 1.6 + Math.random() * 1.2,
        });
      }
    });
    packetsRef.current = packets;
  }, []);

  // Main 60fps render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.024;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Deep pure black background with subtle edge vignette
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient space grid
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

      // 2. Compute absolute pixel positions for each agent cluster
      // Constrain cluster spread nicely within the canvas bounds
      const paddingX = Math.min(width * 0.08, 60);
      const paddingY = Math.min(height * 0.08, 40);
      const usableW = width - paddingX * 2;
      const usableH = height - paddingY * 2;

      const clusterCenters: Record<string, { x: number; y: number; isActive: boolean }> = {};
      AGENT_ORDER.forEach((id) => {
        const coords = AGENT_COORDINATES[id];
        const isActive = currentStage.activeAgents.includes(id);
        const cx = paddingX + coords.x * usableW;
        const cy = paddingY + coords.y * usableH;
        clusterCenters[id] = { x: cx, y: cy, isActive };
      });

      // 3. DRAW INTER-CLUSTER FILAMENTOUS FIBER BUNDLES (TENDONS)
      INTER_CLUSTER_CONNECTIONS.forEach((conn) => {
        const c1 = clusterCenters[conn.from];
        const c2 = clusterCenters[conn.to];
        if (!c1 || !c2) return;

        // In Stage 0, only connections between active clusters are visible
        const isConnActive = c1.isActive && c2.isActive;
        if (!isConnActive && currentStage.index === 0) return;

        const strandsCount = conn.strands;
        const midX = (c1.x + c2.x) / 2;
        const midY = (c1.y + c2.y) / 2;
        const normalX = -(c2.y - c1.y);
        const normalY = c2.x - c1.x;
        const len = Math.hypot(normalX, normalY) || 1;
        const nx = normalX / len;
        const ny = normalY / len;

        // Is this the highlighted vertical column in stage 4 (audio repair)?
        const isAudioRepairColumn =
          currentStage.id === 'audio-repair' &&
          ((conn.from === 'installer' && conn.to === 'projects') ||
            (conn.from === 'projects' && conn.to === 'export') ||
            (conn.from === 'installer' && conn.to === 'reviewer'));

        const isHorizontalBridge = conn.isThickBridge && currentStage.index >= 1;

        for (let s = 0; s < strandsCount; s++) {
          const spreadFactor = (s - strandsCount / 2) * 1.15;
          const wave = Math.sin(s * 0.6 + time * 0.7) * 4.5;
          const ctrlX = midX + nx * (spreadFactor * 0.8 + wave);
          const ctrlY = midY + ny * (spreadFactor * 0.8 + wave);

          ctx.beginPath();
          ctx.moveTo(c1.x + nx * spreadFactor * 0.7, c1.y + ny * spreadFactor * 0.7);
          ctx.quadraticCurveTo(ctrlX, ctrlY, c2.x + nx * spreadFactor * 0.7, c2.y + ny * spreadFactor * 0.7);

          if (isAudioRepairColumn) {
            ctx.strokeStyle =
              s % 3 === 0
                ? 'rgba(212, 255, 63, 0.45)'
                : 'rgba(96, 165, 250, 0.38)';
            ctx.lineWidth = s % 4 === 0 ? 1.4 : 0.8;
          } else if (isHorizontalBridge) {
            ctx.strokeStyle =
              s % 4 === 0
                ? 'rgba(212, 255, 63, 0.28)'
                : 'rgba(96, 165, 250, 0.35)';
            ctx.lineWidth = s % 5 === 0 ? 1.4 : 0.85;
          } else if (isConnActive) {
            if (currentStage.index === 0) {
              ctx.strokeStyle =
                s % 3 === 0
                  ? 'rgba(212, 255, 63, 0.22)'
                  : 'rgba(147, 197, 253, 0.22)';
              ctx.lineWidth = 0.8;
            } else {
              ctx.strokeStyle =
                s % 4 === 0
                  ? 'rgba(255, 255, 255, 0.26)'
                  : 'rgba(96, 165, 250, 0.18)';
              ctx.lineWidth = 0.75;
            }
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.5;
          }

          ctx.stroke();
        }
      });

      // 4. DRAW CONTINUOUS TRAVELING PHOTON PULSES
      packetsRef.current.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) {
          pkt.progress = 0;
          pkt.strandIdx = Math.floor(Math.random() * 32);
        }

        const c1 = clusterCenters[pkt.fromCluster];
        const c2 = clusterCenters[pkt.toCluster];
        if (!c1 || !c2) return;
        if ((!c1.isActive || !c2.isActive) && currentStage.index === 0) return;

        const normalX = -(c2.y - c1.y);
        const normalY = c2.x - c1.x;
        const len = Math.hypot(normalX, normalY) || 1;
        const spreadOffset = (pkt.strandIdx - 16) * 1.1;
        const nx = (normalX / len) * spreadOffset * 0.7;
        const ny = (normalY / len) * spreadOffset * 0.7;

        const t = pkt.progress;
        const midX = (c1.x + c2.x) / 2 + nx * 1.3;
        const midY = (c1.y + c2.y) / 2 + ny * 1.3;

        // Quadratic bezier position
        const p0x = c1.x + nx;
        const p0y = c1.y + ny;
        const p1x = midX;
        const p1y = midY;
        const p2x = c2.x + nx;
        const p2y = c2.y + ny;

        const px = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * p1x + t * t * p2x;
        const py = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;

        // Draw glowing photon packet
        ctx.save();
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = pkt.color;
        ctx.beginPath();
        ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle motion trail
        const trailT = Math.max(0, t - 0.04);
        const tx = (1 - trailT) * (1 - trailT) * p0x + 2 * (1 - trailT) * trailT * p1x + trailT * trailT * p2x;
        const ty = (1 - trailT) * (1 - trailT) * p0y + 2 * (1 - trailT) * trailT * p1y + trailT * trailT * p2y;
        ctx.fillStyle = pkt.color === '#d4ff3f' ? 'rgba(212, 255, 63, 0.4)' : 'rgba(96, 165, 250, 0.4)';
        ctx.beginPath();
        ctx.arc(tx, ty, pkt.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. DRAW ORGANIC FRACTAL AGENT CLUSTERS
      AGENT_ORDER.forEach((id, cIdx) => {
        const center = clusterCenters[id];
        const cluster = clustersRef.current.get(id);
        if (!center || !cluster) return;

        // If stage 0 and cluster is dormant (projects/export), don't draw
        if (!center.isActive && currentStage.index === 0) return;

        const isHovered = hoveredAgent === id;
        const isSelected = selectedAgent === id;
        const isActive = center.isActive;
        const isApproved = currentStage.id === 'approved';

        // Stage 4 color specialization: projects is pure lime green!
        const isAudioSpecial = currentStage.id === 'audio-repair' && (id === 'projects' || id === 'reviewer');

        // Ambient radial glow
        const glowRadius = isHovered || isSelected ? 80 : 64;
        const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, glowRadius);
        if (isAudioSpecial && id === 'projects') {
          grad.addColorStop(0, 'rgba(212, 255, 63, 0.28)');
          grad.addColorStop(0.7, 'rgba(212, 255, 63, 0.08)');
        } else if (isActive) {
          grad.addColorStop(0, 'rgba(96, 165, 250, 0.24)');
          grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.07)');
        } else {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
        }
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(center.x, center.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Cluster breathing scale
        const clusterBreathing = 1 + 0.05 * Math.sin(time * 1.1 + cIdx * 1.4);

        // Compute instantaneous vertex positions
        const computedPts: { x: number; y: number; color: string; radius: number; alpha: number }[] = [];

        cluster.vertices.forEach((v) => {
          const curR = v.baseR * v.rNorm * clusterBreathing;
          const curAngle = v.baseAngle + Math.sin(time * v.freq + v.phase) * 0.08;

          let px = center.x + Math.cos(curAngle) * curR;
          let py = center.y + Math.sin(curAngle) * curR;

          // Micro jitter / Brownian drift
          px += Math.sin(time * 1.3 + v.phase) * 1.5;
          py += Math.cos(time * 1.1 + v.phase) * 1.5;

          // Color calculation
          let ptColor = '#60a5fa';
          if (isAudioSpecial && id === 'projects') {
            ptColor = v.colorType === 'lime' || Math.random() < 0.75 ? '#d4ff3f' : '#bef264';
          } else if (currentStage.index === 0) {
            ptColor = v.colorType === 'lime' ? '#d4ff3f' : '#60a5fa';
          } else if (isApproved) {
            ptColor = v.colorType === 'white' ? '#ffffff' : '#60a5fa';
          } else {
            ptColor = v.colorType === 'lime' && Math.random() < 0.2 ? '#d4ff3f' : '#60a5fa';
          }

          computedPts.push({
            x: px,
            y: py,
            color: ptColor,
            radius: v.radius,
            alpha: v.alpha,
          });
        });

        // Intra-cluster proximity spiderweb lines (Delaunay-like tessellation)
        const maxLinkDist = 28;
        const ptsCount = computedPts.length;

        for (let i = 0; i < ptsCount; i++) {
          const p1 = computedPts[i];
          for (let j = i + 1; j < ptsCount; j++) {
            const p2 = computedPts[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxLinkDist) {
              const linkAlpha = (1 - dist / maxLinkDist) * 0.42;

              if (isAudioSpecial && id === 'projects') {
                ctx.strokeStyle = `rgba(212, 255, 63, ${linkAlpha})`;
              } else if (p1.color === '#d4ff3f' || p2.color === '#d4ff3f') {
                ctx.strokeStyle = `rgba(212, 255, 63, ${linkAlpha * 0.8})`;
              } else {
                ctx.strokeStyle = `rgba(96, 165, 250, ${linkAlpha})`;
              }

              ctx.lineWidth = 0.65;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Draw outer contour / hull between peripheral vertices
        if (cluster.boundaryIndices.length > 3) {
          ctx.beginPath();
          const firstIdx = cluster.boundaryIndices[0];
          ctx.moveTo(computedPts[firstIdx].x, computedPts[firstIdx].y);
          for (let b = 1; b < cluster.boundaryIndices.length; b++) {
            const bIdx = cluster.boundaryIndices[b];
            ctx.lineTo(computedPts[bIdx].x, computedPts[bIdx].y);
          }
          ctx.closePath();
          ctx.strokeStyle =
            isAudioSpecial && id === 'projects'
              ? 'rgba(212, 255, 63, 0.35)'
              : 'rgba(96, 165, 250, 0.3)';
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }

        // Draw particle vertices
        computedPts.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // 6. DRAW AGENT TITLE & SUBTITLE OVER CLUSTER (EXACT MATCH TO VIDEO)
        // Position labels cleanly next to or inside cluster
        ctx.save();
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
        const labelText = `agent / ${id}`;
        const subtitleText = currentStage.agentSubtitles[id] || 'active';

        // Subtitle position offset depending on cluster placement
        let textX = center.x + 18;
        let textY = center.y + 6;

        if (id === 'installer') {
          textX = center.x + 24;
          textY = center.y + 8;
        } else if (id === 'dependencies') {
          textX = center.x + 12;
          textY = center.y - 12;
        } else if (id === 'timeline') {
          textX = center.x + 16;
          textY = center.y + 8;
        } else if (id === 'projects') {
          textX = center.x + 10;
          textY = center.y - 8;
        } else if (id === 'reviewer') {
          textX = center.x + 18;
          textY = center.y + 12;
        } else if (id === 'export') {
          textX = center.x + 18;
          textY = center.y + 10;
        }

        // Agent title: crisp pure white bold
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(labelText, textX, textY);

        // Verified indicator in Stage 7
        if (isApproved) {
          ctx.fillStyle = '#d4ff3f';
          ctx.font = 'bold 11px ui-monospace, monospace';
          ctx.fillText(' ✓', textX + ctx.measureText(labelText).width, textY);
        }

        // Agent subtitle: crisp slate / chartreuse if active
        ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
        ctx.fillStyle = isAudioSpecial && id === 'projects' ? '#d4ff3f' : '#94a3b8';
        ctx.fillText(subtitleText, textX, textY + 13);
        ctx.restore();
      });

      // 7. DRAW TACTICAL STREAM CALLOUT LABELS & ANGLED LEADER LINES
      // In the video, these are pure crisp monospace text with angled pointer lines (NO background pill)
      currentStage.callouts.forEach((callout) => {
        const fromPos = clusterCenters[callout.from];
        const toPos = clusterCenters[callout.to];
        if (!fromPos || !toPos) return;

        // Skip callouts referring to dormant clusters in stage 0
        if ((!fromPos.isActive || !toPos.isActive) && currentStage.index === 0) return;

        const targetX = (fromPos.x + toPos.x) / 2;
        const targetY = (fromPos.y + toPos.y) / 2;

        let calloutX = targetX;
        let calloutY = targetY;

        if (callout.xRatio !== undefined && callout.yRatio !== undefined) {
          calloutX = paddingX + callout.xRatio * usableW;
          calloutY = paddingY + callout.yRatio * usableH;
        }

        ctx.save();

        // Draw angled leader line
        ctx.strokeStyle = 'rgba(212, 255, 63, 0.65)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(calloutX, calloutY + 2);
        const elbowX = calloutX < targetX ? calloutX + 12 : calloutX - 12;
        ctx.lineTo(elbowX, calloutY + 2);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Terminal tick/diamond at target intersection
        ctx.fillStyle = '#d4ff3f';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Render clean monospace text (no box/pill, matching video)
        ctx.font = '10.5px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#d4ff3f';
        ctx.fillText(callout.text, calloutX, calloutY - 2);

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentStage, hoveredAgent, selectedAgent]);

  // Handle Canvas Resizing
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

  // Mouse interaction handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;

    mouseRef.current = { x, y, active: true };

    // Check cluster hit testing
    const usableW = rect.width - Math.min(rect.width * 0.08, 60) * 2;
    const usableH = rect.height - Math.min(rect.height * 0.08, 40) * 2;
    const padX = Math.min(rect.width * 0.08, 60);
    const padY = Math.min(rect.height * 0.08, 40);

    let foundAgent: string | null = null;
    AGENT_ORDER.forEach((id) => {
      const coords = AGENT_COORDINATES[id];
      const cx = padX + coords.x * usableW;
      const cy = padY + coords.y * usableH;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 50) {
        foundAgent = id;
      }
    });

    setHoveredAgent(foundAgent);
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
    setHoveredAgent(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredAgent) {
      onSelectAgent(selectedAgent === hoveredAgent ? null : hoveredAgent);
    } else {
      onSelectAgent(null);
    }
  }, [hoveredAgent, selectedAgent, onSelectAgent]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] bg-[#000000] overflow-hidden select-none cursor-crosshair"
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
