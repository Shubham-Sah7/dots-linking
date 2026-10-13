'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { JevStageData } from './types';

interface TelemetryModulesProps {
  currentStage: JevStageData;
  selectedNode: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

// Generate animated metric waveform bars (Maximem neutral grey & orange palette)
function MetricBars({ count = 24, label, highlightRatio = 0.25 }: { count?: number; label: string; highlightRatio?: number }) {
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
      const isHighlighted = i >= Math.floor(count * (1 - highlightRatio));
      return {
        height: Math.round(Math.max(15, Math.min(100, h))),
        isHighlighted,
      };
    });
  }, [count, tick, highlightRatio]);

  return (
    <div className="w-full mt-2 pt-1.5 border-t border-white/[0.06]">
      <div className="flex items-end justify-between h-3.5 px-0.5 gap-[2px]">
        {bars.map((bar, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-[1px] transition-all duration-100 ${
              bar.isHighlighted ? 'bg-[#F26522]' : 'bg-white/20'
            }`}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>
      <div className="text-[9px] font-mono text-[#a1a1aa] tracking-wider uppercase mt-1 truncate">
        {label}
      </div>
    </div>
  );
}

// Minimal Clean Issue Routing Graph for Panel 1 (Grey nodes & orange active path)
function IssueRoutingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const render = () => {
      angle += 0.01;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.4;

      const nodes: { x: number; y: number }[] = [];
      const nodeCount = 8;
      for (let i = 0; i < nodeCount; i++) {
        const theta = angle + (i * Math.PI * 2) / nodeCount;
        nodes.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * (r * 0.65),
        });
      }

      // Draw thin grey interconnected chords
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.75;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if ((j - i) % 2 === 1 || j - i === 3) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Highlight active shortlisted route in brand orange
      ctx.strokeStyle = '#F26522';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      ctx.lineTo(nodes[2].x, nodes[2].y);
      ctx.lineTo(nodes[5].x, nodes[5].y);
      ctx.stroke();

      // Draw clean nodes
      nodes.forEach((n, idx) => {
        const isShortlistNode = idx === 0 || idx === 2 || idx === 5;
        ctx.fillStyle = isShortlistNode ? '#F26522' : 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, isShortlistNode ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        if (isShortlistNode) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
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
      height={95}
      className="mx-auto block"
    />
  );
}

// Clean Tested-Patch Verification Cluster for Panel 4 (Grey cluster with 42 orange passing points)
function TestedPatchesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate 90 points on unit sphere
    const numPoints = 90;
    const phi = (1 + Math.sqrt(5)) / 2;
    const points: [number, number, number, boolean][] = [];

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      // Exactly 42 points represent passing tests
      const isPassing = i < 42;
      points.push([x, y, z, isPassing]);
    }

    let angleX = 0.2;
    let angleY = 0;

    const render = () => {
      angleY += 0.012;
      angleX += 0.004;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.4;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected: { x: number; y: number; z: number; alpha: number; isPassing: boolean }[] = [];

      points.forEach(([px, py, pz, isPassing]) => {
        const x1 = px * cosY + pz * sinY;
        const z1 = -px * sinY + pz * cosY;

        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        const screenX = cx + x1 * r;
        const screenY = cy + y2 * r;
        const alpha = 0.25 + 0.75 * ((z2 + 1) / 2);

        projected.push({ x: screenX, y: screenY, z: z2, alpha, isPassing });
      });

      projected.sort((a, b) => a.z - b.z);

      // Subtle connection webs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 4) {
        if (projected[i + 1]) {
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[i + 1].x, projected[i + 1].y);
          ctx.stroke();
        }
      }

      // Draw nodes: 42 passing test points in brand orange, rest in muted grey
      projected.forEach((p) => {
        if (p.isPassing) {
          ctx.fillStyle = `rgba(242, 101, 34, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6 * p.alpha + 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.0 * p.alpha + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
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
      height={95}
      className="mx-auto block"
    />
  );
}

export function TelemetryModules({ currentStage }: TelemetryModulesProps) {
  // Check matrix state for panel 2
  const [matrixTick, setMatrixTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatrixTick((t) => (t + 1) % 100);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const matrixDots = useMemo(() => {
    return Array.from({ length: 6 }).map((_, r) => {
      return Array.from({ length: 18 }).map((_, c) => {
        const val = Math.sin(r * 3.4 + c * 2.1 + matrixTick * 0.4);
        if (val > 0.45) return 'verified'; // orange (high-signal passed check)
        if (val > -0.1) return 'eval'; // neutral grey
        return 'idle'; // dark inactive
      });
    });
  }, [matrixTick]);

  return (
    <div className="w-full bg-[#1B1B19] p-3 sm:p-4 font-mono select-none">
      {/* 5-Column HUD Telemetry Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* ================= PANEL 1: 01 / ISSUE ROUTING ================= */}
        <div className="border border-white/[0.08] bg-[#141413] rounded-md p-3 flex flex-col justify-between h-[240px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              <span className="text-[#71717a]">01 / </span>ISSUE ROUTING
            </span>
            <span className="text-[9px] text-[#71717a] font-normal uppercase">Filter</span>
          </div>

          <div className="flex-1 flex items-center justify-center my-1">
            <IssueRoutingCanvas />
          </div>

          <div>
            <div className="text-xs font-bold text-white font-mono">
              15,000 → 360 ISSUES
            </div>
            <MetricBars count={26} label="14,640 NOT OPENED BY SONNET" highlightRatio={0.15} />
          </div>
        </div>

        {/* ================= PANEL 2: 02 / JEV / FOUR CHECKS ================= */}
        <div className="border border-white/[0.08] bg-[#141413] rounded-md p-3 flex flex-col justify-between h-[240px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              <span className="text-[#71717a]">02 / </span>JEV / FOUR CHECKS
            </span>
            <span className="text-[9px] text-[#71717a] font-normal uppercase">Matrix</span>
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 gap-1">
            {matrixDots.map((row, r) => (
              <div key={r} className="flex items-center justify-between gap-1">
                {row.map((cell, c) => {
                  let bg = 'bg-[#272724]';
                  if (cell === 'verified') bg = 'bg-[#F26522]';
                  else if (cell === 'eval') bg = 'bg-[#71717a]';

                  return (
                    <div
                      key={c}
                      className={`size-1.5 rounded-full transition-colors duration-200 ${bg}`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center justify-center gap-3 text-[9px] text-[#71717a] mt-2">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#272724]" /> IDLE
              </span>
              <span className="flex items-center gap-1 text-[#a1a1aa]">
                <span className="size-1.5 rounded-full bg-[#71717a]" /> EVAL
              </span>
              <span className="flex items-center gap-1 text-[#F26522] font-semibold">
                <span className="size-1.5 rounded-full bg-[#F26522]" /> VERIFIED
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-white font-mono">
              ~4 MIN / $1.30 INCLUDED
            </div>
            <MetricBars count={26} label="REPRO / FAILURE / SCOPE / CODE" highlightRatio={0.3} />
          </div>
        </div>

        {/* ================= PANEL 3: 03 / FULL-RUN COMPARISON ================= */}
        <div className="border border-white/[0.08] bg-[#141413] rounded-md p-3 flex flex-col justify-between h-[240px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              <span className="text-[#71717a]">03 / </span>FULL-RUN COMPARISON
            </span>
            <span className="text-[9px] text-[#71717a] font-normal uppercase">Delta</span>
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 text-xs">
            <div className="grid grid-cols-2 pb-1 border-b border-white/[0.06] text-[9.5px] text-[#71717a] font-semibold uppercase">
              <span>SONNET ALL</span>
              <span className="text-[#F26522]">JEV FIRST</span>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">46.8M</span>
                <span className="text-[#71717a] text-[8.5px] block">TOKENS</span>
              </div>
              <div>
                <span className="text-[#F26522] font-bold text-xs">9.7M</span>
                <span className="text-[#71717a] text-[8.5px] block">-79%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">49h</span>
                <span className="text-[#71717a] text-[8.5px] block">TIME</span>
              </div>
              <div>
                <span className="text-[#F26522] font-bold text-xs">10h</span>
                <span className="text-[#71717a] text-[8.5px] block">-80%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 py-1 items-baseline">
              <div>
                <span className="text-white font-bold text-xs">$131.42</span>
                <span className="text-[#71717a] text-[8.5px] block">COST</span>
              </div>
              <div>
                <span className="text-[#F26522] font-bold text-xs">$36.26</span>
                <span className="text-[#71717a] text-[8.5px] block">-72%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-white font-mono">
              ~4.9x FASTER / ~3.6x CHEAPER
            </div>
            <MetricBars count={26} label="SAME BACKLOG / SAME CHECKS" highlightRatio={0.75} />
          </div>
        </div>

        {/* ================= PANEL 4: 04 / TESTED PATCHES ================= */}
        <div className="border border-white/[0.08] bg-[#141413] rounded-md p-3 flex flex-col justify-between h-[240px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              <span className="text-[#71717a]">04 / </span>TESTED PATCHES
            </span>
            <span className="text-[9px] text-[#71717a] font-normal uppercase">Tests</span>
          </div>

          <div className="flex-1 flex items-center justify-center my-1">
            <TestedPatchesCanvas />
          </div>

          <div>
            <div className="text-xs font-bold text-white font-mono">
              42 PATCHES PASS TESTS
            </div>
            <MetricBars count={26} label="MERGE DECISION / HUMAN" highlightRatio={0.42} />
          </div>
        </div>

        {/* ================= PANEL 5: 05 / FIXING / PYTHON ================= */}
        <div className="border border-white/[0.08] bg-[#141413] rounded-md p-3 flex flex-col justify-between h-[240px] overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span>
              <span className="text-[#71717a]">05 / </span>FIXING / PYTHON
            </span>
            <span className="text-[9px] text-[#71717a] font-normal uppercase">Code</span>
          </div>

          <div className="flex-1 flex flex-col justify-center my-1 bg-[#181816] rounded border border-white/[0.06] p-2 space-y-0.5 text-[10px] font-mono leading-tight">
            {currentStage.codeSnippet.map((codeLine, idx) => {
              const isLead = idx === 0 || idx === currentStage.codeSnippet.length - 1;
              return (
                <div
                  key={idx}
                  className={`truncate flex items-center gap-1.5 ${
                    isLead ? 'text-white font-bold' : 'text-[#a1a1aa]'
                  }`}
                >
                  <span className={`text-[8px] font-mono ${isLead ? 'text-[#F26522]' : 'text-[#52525b]'}`}>
                    {idx + 1}
                  </span>
                  <span>{codeLine}</span>
                </div>
              );
            })}
          </div>

          <div>
            <div className="text-xs font-bold text-white font-mono">
              SONNET READS + PATCHES
            </div>
            <MetricBars count={26} label="SCHEMATIC CODE" highlightRatio={0.25} />
          </div>
        </div>
      </div>
    </div>
  );
}
