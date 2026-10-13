'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { JevStageData } from './types';

interface TelemetryModulesProps {
  currentStage: JevStageData;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

// Generate animated equalizer waveform bars
function EqualizerBars({ count = 24, label }: { count?: number; label: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 100);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const bars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const h = 20 + 75 * Math.abs(Math.sin(i * 0.45 + tick * 0.35) * Math.cos(i * 0.2 + tick * 0.25));
      return Math.max(15, Math.min(100, h));
    });
  }, [count, tick]);

  return (
    <div className="w-full mt-2 pt-1 border-t border-[#141b26]/60">
      <div className="flex items-end justify-between h-4 px-0.5 gap-[2px]">
        {bars.map((h, idx) => (
          <div
            key={idx}
            className="flex-1 bg-[#38bdf8] opacity-75 rounded-[1px] transition-all duration-100"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="text-[8.5px] text-[#64748b] tracking-wider uppercase mt-1 truncate">
        {label}
      </div>
    </div>
  );
}

// 3D Rotating Sphere Component for Panel 4
function RotatingSphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate 110 points on unit sphere using Fibonacci spiral
    const numPoints = 110;
    const phi = (1 + Math.sqrt(5)) / 2;
    const points: [number, number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      points.push([x, y, z]);
    }

    let angleX = 0.2;
    let angleY = 0;

    const render = () => {
      angleY += 0.015;
      angleX += 0.005;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.42;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected: { x: number; y: number; z: number; alpha: number }[] = [];

      points.forEach(([px, py, pz]) => {
        // Rotate around Y
        const x1 = px * cosY + pz * sinY;
        const z1 = -px * sinY + pz * cosY;

        // Rotate around X
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        const screenX = cx + x1 * r;
        const screenY = cy + y2 * r;
        const alpha = 0.2 + 0.8 * ((z2 + 1) / 2);

        projected.push({ x: screenX, y: screenY, z: z2, alpha });
      });

      // Sort back-to-front
      projected.sort((a, b) => a.z - b.z);

      // Draw faint connections
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 4) {
        if (projected[i + 1]) {
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[i + 1].x, projected[i + 1].y);
          ctx.stroke();
        }
      }

      // Draw points
      projected.forEach((p) => {
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2 * p.alpha + 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={100}
      className="mx-auto block"
    />
  );
}

// Rotating Octagram Graph for Panel 1
function RotatingConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const render = () => {
      angle += 0.012;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.42;

      const nodes: { x: number; y: number }[] = [];
      const nodeCount = 8;
      for (let i = 0; i < nodeCount; i++) {
        const theta = angle + (i * Math.PI * 2) / nodeCount;
        nodes.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * (r * 0.65),
        });
      }

      // Draw interconnected chords
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if ((j - i) % 2 === 1 || (j - i) === 3) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#ffffff';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={100}
      className="mx-auto block"
    />
  );
}

export function TelemetryModules({ currentStage }: TelemetryModulesProps) {
  // Flickering matrix state for panel 2
  const [matrixTick, setMatrixTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatrixTick((t) => (t + 1) % 100);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const matrixDots = useMemo(() => {
    return Array.from({ length: 6 }).map((_, r) => {
      return Array.from({ length: 18 }).map((_, c) => {
        const val = Math.sin(r * 3.4 + c * 2.1 + matrixTick * 0.4);
        if (val > 0.45) return 'ready'; // cyan
        if (val > -0.1) return 'write'; // pink
        return 'idle'; // dark
      });
    });
  }, [matrixTick]);

  return (
    <div className="w-full bg-[#000000] p-3 sm:p-4 font-mono select-none">
      {/* 5-Column HUD Telemetry Deck Matching frame_00_0.0s.jpg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* ================= PANEL 1: 01 / ISSUE ROUTING ================= */}
        <div className="border border-[#141b26] bg-[#03060a] p-2.5 flex flex-col justify-between h-[230px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1 border-b border-[#141b26]">
            01 / ISSUE ROUTING
          </div>

          <div className="flex-1 flex items-center justify-center my-1">
            <RotatingConstellationCanvas />
          </div>

          <div>
            <div className="text-[11px] font-bold text-white">
              15,000 → 360 ISSUES
            </div>
            <EqualizerBars count={26} label="14,640 NOT OPENED BY SONNET" />
          </div>
        </div>

        {/* ================= PANEL 2: 02 / JEV / FOUR CHECKS ================= */}
        <div className="border border-[#141b26] bg-[#03060a] p-2.5 flex flex-col justify-between h-[230px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1 border-b border-[#141b26]">
            02 / JEV / FOUR CHECKS
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 gap-1">
            {matrixDots.map((row, r) => (
              <div key={r} className="flex items-center justify-between gap-1">
                {row.map((cell, c) => {
                  let bg = 'bg-[#141d2b]';
                  if (cell === 'ready') bg = 'bg-[#38bdf8] shadow-[0_0_3px_#38bdf8]';
                  else if (cell === 'write') bg = 'bg-[#ff2d55] shadow-[0_0_3px_#ff2d55]';

                  return (
                    <div
                      key={c}
                      className={`size-1.5 rounded-full transition-colors duration-150 ${bg}`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center justify-center gap-4 text-[9px] text-[#64748b] mt-1">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#141d2b]" /> IDLE
              </span>
              <span className="flex items-center gap-1 text-[#ff2d55]">
                <span className="size-1.5 rounded-full bg-[#ff2d55]" /> WRITE
              </span>
              <span className="flex items-center gap-1 text-[#38bdf8]">
                <span className="size-1.5 rounded-full bg-[#38bdf8]" /> READY
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white">
              ~4 MIN / $1.30 INCLUDED
            </div>
            <EqualizerBars count={26} label="REPRO / FAILURE / SCOPE / CODE" />
          </div>
        </div>

        {/* ================= PANEL 3: 03 / FULL-RUN COMPARISON ================= */}
        <div className="border border-[#141b26] bg-[#03060a] p-2.5 flex flex-col justify-between h-[230px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1 border-b border-[#141b26]">
            03 / FULL-RUN COMPARISON
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 text-[11px]">
            <div className="grid grid-cols-2 pb-1 border-b border-[#141b26] text-[9.5px] text-[#64748b] font-semibold">
              <span>SONNET ALL</span>
              <span>JEV FIRST</span>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">46.8M</span>
                <span className="text-[#64748b] text-[8.5px] block">SONNET TOKENS</span>
              </div>
              <div>
                <span className="text-[#38bdf8] font-bold text-xs">9.7M</span>
              </div>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">49h</span>
                <span className="text-[#64748b] text-[8.5px] block">TOTAL TIME</span>
              </div>
              <div>
                <span className="text-[#38bdf8] font-bold text-xs">10h</span>
              </div>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">$131.42</span>
                <span className="text-[#64748b] text-[8.5px] block">TOTAL COST</span>
              </div>
              <div>
                <span className="text-[#d4ff3f] font-bold text-xs">$36.26</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-white">
              ~4.9x FASTER / ~3.6x CHEAPER
            </div>
            <EqualizerBars count={26} label="SAME BACKLOG / SAME CHECKS" />
          </div>
        </div>

        {/* ================= PANEL 4: 04 / TESTED PATCHES ================= */}
        <div className="border border-[#141b26] bg-[#03060a] p-2.5 flex flex-col justify-between h-[230px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1 border-b border-[#141b26]">
            04 / TESTED PATCHES
          </div>

          <div className="flex-1 flex items-center justify-center my-1">
            <RotatingSphereCanvas />
          </div>

          <div>
            <div className="text-[11px] font-bold text-white">
              42 PATCHES PASS TESTS
            </div>
            <EqualizerBars count={26} label="MERGE DECISION / HUMAN" />
          </div>
        </div>

        {/* ================= PANEL 5: 05 / FIXING / PYTHON ================= */}
        <div className="border border-[#141b26] bg-[#03060a] p-2.5 flex flex-col justify-between h-[230px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1 border-b border-[#141b26]">
            05 / FIXING / PYTHON
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 space-y-0.5 text-[10px] font-mono leading-tight">
            {currentStage.codeSnippet.map((codeLine, idx) => (
              <div
                key={idx}
                className={`truncate ${
                  idx === 0 || idx === currentStage.codeSnippet.length - 1
                    ? 'text-[#38bdf8] font-bold'
                    : 'text-[#94a3b8]'
                }`}
              >
                {codeLine}
              </div>
            ))}
          </div>

          <div>
            <div className="text-[11px] font-bold text-white">
              SONNET READS + PATCHES
            </div>
            <EqualizerBars count={26} label="SCHEMATIC CODE" />
          </div>
        </div>
      </div>
    </div>
  );
}
