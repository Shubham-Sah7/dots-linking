'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { StageData } from './types';

interface TelemetryModulesProps {
  currentStage: StageData;
  selectedAgent: string | null;
  onSelectAgent: (agentId: string | null) => void;
}

const AGENT_KEYS = ['dependencies', 'installer', 'timeline', 'export', 'projects', 'reviewer'];
const MATRIX_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MATRIX_COLS = 24;

export function TelemetryModules({ currentStage, selectedAgent, onSelectAgent }: TelemetryModulesProps) {
  // Animated tick for flickering signal matrix
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 240);
    return () => clearInterval(timer);
  }, []);

  // Compute signal matrix cells dynamically based on stage seed + tick (Maximem brand palette)
  const matrixCells = useMemo(() => {
    return MATRIX_ROWS.map((_, rIdx) => {
      return Array.from({ length: MATRIX_COLS }).map((_, cIdx) => {
        const rand = Math.sin(rIdx * 13.5 + cIdx * 7.2 + currentStage.signalPatternSeed + tick * 0.4);
        if (rand > 0.6) return 'orange'; // active check (orange)
        if (rand > 0.15) return 'lightgrey'; // verified check (warm grey)
        if (rand > -0.3) return 'darkgrey'; // idle check (dark grey)
        return 'off';
      });
    });
  }, [currentStage.signalPatternSeed, tick]);

  // Task metrics for each agent in this stage
  const taskRows = useMemo(() => {
    return MATRIX_ROWS.map((row, idx) => {
      const isVerified = currentStage.id === 'approved';
      const stageIdx = currentStage.index;

      const read = Math.min(100, 20 + stageIdx * 12 + (idx * 5) % 20);
      const verify = Math.min(100, isVerified ? 100 : 15 + stageIdx * 11 + (idx * 8) % 18);
      const share = Math.min(100, isVerified ? 100 : 10 + stageIdx * 13 + (idx * 6) % 15);
      const retain = Math.min(100, isVerified ? 100 : 30 + stageIdx * 9 + (idx * 4) % 22);

      return {
        letter: row,
        agentId: AGENT_KEYS[idx],
        read,
        verify,
        share,
        retain,
      };
    });
  }, [currentStage.index, currentStage.id]);

  return (
    <div className="w-full bg-[#1B1B19] p-3 sm:p-4 font-mono select-none">
      {/* 2 Rows x 4 Columns Technical HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {/* ================= MODULE 1: RUN LOG ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>RUN LOG</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-0.5 text-[11px] leading-tight scrollbar-none">
            {currentStage.runLogs.map((log, idx) => {
              if (log.isActive) {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-1.5 py-0.5 bg-[#F26522]/10 border border-[#F26522]/30 text-[#F26522] font-semibold"
                  >
                    <span className="text-[#F26522] font-bold shrink-0">{log.prefix.replace(':', '')}</span>
                    <span className="truncate text-[#F4F4F5]">{log.text}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex items-center gap-2 px-1 py-0.5 text-[#A1A1AA]">
                  <span className="text-[#71717A] shrink-0 font-medium">{log.prefix.replace(':', '')}</span>
                  <span
                    className={`truncate ${
                      log.type === 'warning'
                        ? 'text-amber-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-[#F4F4F5] font-semibold'
                        : 'text-[#D4D4D8]'
                    }`}
                  >
                    {log.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODULE 2: SIGNAL MATRIX ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>SIGNAL MATRIX</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5">
            {matrixCells.map((rowCells, rIdx) => (
              <div key={rIdx} className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#71717A] w-3 font-semibold">{MATRIX_ROWS[rIdx]}</span>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {rowCells.map((cellState, cIdx) => {
                    let bg = 'bg-[#242422]';
                    if (cellState === 'orange') bg = 'bg-[#F26522]';
                    else if (cellState === 'lightgrey') bg = 'bg-[#52525B]';
                    else if (cellState === 'darkgrey') bg = 'bg-[#2E2E2B]';

                    return <div key={cIdx} className={`h-2.5 rounded-none transition-colors duration-150 ${bg}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 3: TASK HISTORY ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>TASK HISTORY</span>
            <div className="flex items-center gap-3 text-[9px] text-[#71717A]">
              <span>read</span>
              <span>verify</span>
              <span>share</span>
              <span>retain</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5">
            {taskRows.map((row) => (
              <div key={row.letter} className="flex items-center gap-2 text-[10px]">
                <span className="text-[#71717A] w-3 font-semibold">{row.letter}</span>
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  {/* read */}
                  <div className="h-2 bg-[#242422] overflow-hidden">
                    <div
                      className="h-full bg-[#71717A] transition-all duration-300"
                      style={{ width: `${row.read}%` }}
                    />
                  </div>
                  {/* verify */}
                  <div className="h-2 bg-[#242422] overflow-hidden">
                    <div
                      className="h-full bg-[#F26522] transition-all duration-300"
                      style={{ width: `${row.verify}%` }}
                    />
                  </div>
                  {/* share */}
                  <div className="h-2 bg-[#242422] overflow-hidden">
                    <div
                      className="h-full bg-[#A1A1AA] transition-all duration-300"
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                  {/* retain */}
                  <div className="h-2 bg-[#242422] overflow-hidden">
                    <div
                      className="h-full bg-[#52525B] transition-all duration-300"
                      style={{ width: `${row.retain}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 4: AGENT STATES ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>AGENT STATES</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1 text-[11px]">
            {AGENT_KEYS.map((agentId) => {
              const isSelected = selectedAgent === agentId;
              const isApproved = currentStage.id === 'approved';

              let statusText = 'tracing';
              let meterBar = <span className="text-[#F26522] font-bold">-</span>;

              if (isApproved) {
                statusText = 'verified';
                meterBar = <span className="text-[#F26522] font-bold">----</span>;
              } else if (currentStage.index === 0) {
                if (agentId === 'export' || agentId === 'projects') {
                  statusText = 'joining';
                  meterBar = <span className="text-transparent">-</span>;
                } else if (agentId === 'installer') {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#A1A1AA] font-bold">--</span>;
                } else if (agentId === 'reviewer') {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#A1A1AA] font-bold">-</span>;
                } else {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#F26522] font-bold">-</span>;
                }
              } else if (currentStage.index === 4) {
                // Audio repair
                if (agentId === 'projects') {
                  statusText = 'relaying';
                  meterBar = <span className="text-[#F26522] font-bold">---</span>;
                } else if (agentId === 'installer' || agentId === 'export') {
                  statusText = 'relaying';
                  meterBar = <span className="text-[#A1A1AA] font-bold">---</span>;
                } else {
                  statusText = 'linked';
                  meterBar = <span className="text-[#F4F4F5] font-bold">-</span>;
                }
              } else {
                statusText = 'relaying';
                meterBar = <span className="text-[#A1A1AA] font-bold">--</span>;
              }

              return (
                <div
                  key={agentId}
                  onClick={() => onSelectAgent(isSelected ? null : agentId)}
                  className={`flex items-center justify-between px-1.5 py-0.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#F26522]/15 border border-[#F26522]/30 text-[#F26522]'
                      : 'hover:bg-[#20201D]'
                  }`}
                >
                  <span className={`font-semibold ${isSelected ? 'text-[#F26522]' : 'text-[#F4F4F5]'}`}>
                    {agentId}
                  </span>
                  <div className="flex items-center gap-5">
                    <span className={isApproved ? 'text-[#F26522]' : 'text-[#71717A]'}>{statusText}</span>
                    <div className="w-8 text-right font-mono tracking-widest">{meterBar}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODULE 5: RESTORATION CODE ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>RESTORATION CODE</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-0.5 text-[11px] font-mono leading-relaxed scrollbar-none">
            {currentStage.codeLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 px-1 ${
                  line.isHighlighted
                    ? 'bg-[#F26522]/10 text-[#F4F4F5] font-semibold border-l-2 border-[#F26522]'
                    : 'text-[#A1A1AA]'
                }`}
              >
                <span className="text-[#52525B] select-none text-[10px] w-5 text-right">{line.num}</span>
                <span className="truncate">{line.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 6: EVIDENCE TREE ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>EVIDENCE TREE</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-1 text-[11px] font-mono leading-tight scrollbar-none">
            {currentStage.evidenceTree.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-1 ${
                  item.isHighlighted ? 'text-[#F26522] font-semibold' : 'text-[#A1A1AA]'
                }`}
                style={{ paddingLeft: `${item.indent * 12 + 4}px` }}
              >
                <span className="truncate">{item.text}</span>
                <span
                  className={`text-[10px] lowercase ${
                    item.status === 'fixed' || item.status === 'read' ? 'text-[#F26522] font-semibold' : 'text-[#71717A]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 7: CONTEXT LEDGER ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>CONTEXT LEDGER</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5 space-y-1 text-[10px]">
            {Object.entries(currentStage.contextLedger).map(([metric, val], idx) => {
              const isHighlighted = idx % 2 === 0;
              return (
                <div key={metric} className="flex items-center gap-3">
                  <span className="text-[#71717A] w-16 lowercase font-mono text-[10px]">{metric}</span>
                  <div className="flex-1 h-2 bg-[#242422] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isHighlighted ? 'bg-[#F26522]' : 'bg-[#71717A]'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODULE 8: PAYLOAD INSPECTOR ================= */}
        <div className="border border-white/[0.08] bg-[#181816] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-semibold text-[#F4F4F5] tracking-wider pb-1.5 border-b border-white/[0.08] flex items-center justify-between">
            <span>PAYLOAD INSPECTOR</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1 text-[11px] font-mono">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">sender</span>
              <span className="text-[#52525B] px-1">:</span>
              <span className="text-[#F4F4F5] flex-1 text-right">{currentStage.payload.sender}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">target</span>
              <span className="text-[#52525B] px-1">:</span>
              <span className="text-[#F4F4F5] flex-1 text-right">{currentStage.payload.target}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">artifact</span>
              <span className="text-[#52525B] px-1">:</span>
              <span className="text-[#F4F4F5] flex-1 text-right">{currentStage.payload.artifact}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">audio</span>
              <span className="text-[#52525B] px-1">:</span>
              <span
                className={`flex-1 text-right ${
                  currentStage.payload.audio === 'MISSING'
                    ? 'text-rose-400 font-semibold'
                    : currentStage.payload.audio === 'repairing'
                    ? 'text-amber-400 font-semibold'
                    : 'text-[#F26522] font-semibold'
                }`}
              >
                {currentStage.payload.audio}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">review</span>
              <span className="text-[#52525B] px-1">:</span>
              <span
                className={`flex-1 text-right ${
                  currentStage.payload.review === 'REJECTED'
                    ? 'text-rose-400 font-semibold'
                    : currentStage.payload.review === 'APPROVED'
                    ? 'text-[#F26522] font-semibold'
                    : 'text-[#F4F4F5]'
                }`}
              >
                {currentStage.payload.review}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#71717A] w-20">patch</span>
              <span className="text-[#52525B] px-1">:</span>
              <span className="text-[#F26522] font-semibold flex-1 text-right">{currentStage.payload.patch}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
