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

  // Compute signal matrix cells dynamically based on stage seed + tick
  const matrixCells = useMemo(() => {
    return MATRIX_ROWS.map((_, rIdx) => {
      return Array.from({ length: MATRIX_COLS }).map((_, cIdx) => {
        const rand = Math.sin(rIdx * 13.5 + cIdx * 7.2 + currentStage.signalPatternSeed + tick * 0.4);
        if (rand > 0.6) return 'yellow';
        if (rand > 0.15) return 'blue';
        if (rand > -0.3) return 'darkblue';
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
    <div className="w-full bg-[#000000] p-3 sm:p-4 font-mono select-none">
      {/* 2 Rows x 4 Columns Terminal HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {/* ================= MODULE 1: RUN LOG ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>RUN LOG</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-0.5 text-[11px] leading-tight scrollbar-none">
            {currentStage.runLogs.map((log, idx) => {
              if (log.isActive) {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-1.5 py-0.5 bg-[#182510] border border-[#557a22] text-[#d4ff3f] font-bold shadow-[0_0_8px_rgba(212,255,63,0.15)]"
                  >
                    <span className="text-[#d4ff3f] font-bold shrink-0">{log.prefix.replace(':', '')}</span>
                    <span className="truncate">{log.text}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex items-center gap-2 text-[#94a3b8] px-1 py-0.5">
                  <span className="text-[#64748b] shrink-0 font-medium">{log.prefix.replace(':', '')}</span>
                  <span
                    className={`truncate ${
                      log.type === 'warning'
                        ? 'text-amber-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-[#cbd5e1]'
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
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>SIGNAL MATRIX</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5">
            {matrixCells.map((rowCells, rIdx) => (
              <div key={rIdx} className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#64748b] w-3 font-semibold">{MATRIX_ROWS[rIdx]}</span>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {rowCells.map((cellState, cIdx) => {
                    let bg = 'bg-[#111827]';
                    if (cellState === 'yellow') bg = 'bg-[#d4ff3f] shadow-[0_0_3px_#d4ff3f]';
                    else if (cellState === 'blue') bg = 'bg-[#60a5fa] shadow-[0_0_2px_#60a5fa]';
                    else if (cellState === 'darkblue') bg = 'bg-[#1e293b]';

                    return <div key={cIdx} className={`h-2.5 rounded-none transition-colors duration-150 ${bg}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 3: TASK HISTORY ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>TASK HISTORY</span>
            <div className="flex items-center gap-3 text-[9px] text-[#64748b]">
              <span>read</span>
              <span>verify</span>
              <span>share</span>
              <span>retain</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5">
            {taskRows.map((row) => (
              <div key={row.letter} className="flex items-center gap-2 text-[10px]">
                <span className="text-[#64748b] w-3 font-semibold">{row.letter}</span>
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  {/* read */}
                  <div className="h-2 bg-[#111827] overflow-hidden">
                    <div
                      className="h-full bg-[#60a5fa] transition-all duration-300"
                      style={{ width: `${row.read}%` }}
                    />
                  </div>
                  {/* verify */}
                  <div className="h-2 bg-[#111827] overflow-hidden">
                    <div
                      className="h-full bg-[#d4ff3f] transition-all duration-300"
                      style={{ width: `${row.verify}%` }}
                    />
                  </div>
                  {/* share */}
                  <div className="h-2 bg-[#111827] overflow-hidden">
                    <div
                      className="h-full bg-[#818cf8] transition-all duration-300"
                      style={{ width: `${row.share}%` }}
                    />
                  </div>
                  {/* retain */}
                  <div className="h-2 bg-[#111827] overflow-hidden">
                    <div
                      className="h-full bg-[#94a3b8] transition-all duration-300"
                      style={{ width: `${row.retain}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 4: AGENT STATES ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>AGENT STATES</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1 text-[11px]">
            {AGENT_KEYS.map((agentId) => {
              const isSelected = selectedAgent === agentId;
              const isApproved = currentStage.id === 'approved';

              let statusText = 'tracing';
              let meterBar = <span className="text-[#d4ff3f] font-bold">-</span>;

              if (isApproved) {
                statusText = 'verified';
                meterBar = <span className="text-[#d4ff3f] font-bold">----</span>;
              } else if (currentStage.index === 0) {
                if (agentId === 'export' || agentId === 'projects') {
                  statusText = 'joining';
                  meterBar = <span className="text-transparent">-</span>;
                } else if (agentId === 'installer') {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#60a5fa] font-bold">--</span>;
                } else if (agentId === 'reviewer') {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#60a5fa] font-bold">-</span>;
                } else {
                  statusText = 'tracing';
                  meterBar = <span className="text-[#d4ff3f] font-bold">-</span>;
                }
              } else if (currentStage.index === 4) {
                // Audio repair
                if (agentId === 'projects') {
                  statusText = 'relaying';
                  meterBar = <span className="text-[#d4ff3f] font-bold">---</span>;
                } else if (agentId === 'installer' || agentId === 'export') {
                  statusText = 'relaying';
                  meterBar = <span className="text-[#60a5fa] font-bold">---</span>;
                } else {
                  statusText = 'linked';
                  meterBar = <span className="text-white font-bold">-</span>;
                }
              } else {
                statusText = 'relaying';
                meterBar = <span className="text-[#60a5fa] font-bold">--</span>;
              }

              return (
                <div
                  key={agentId}
                  onClick={() => onSelectAgent(isSelected ? null : agentId)}
                  className={`flex items-center justify-between px-1.5 py-0.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#182510] border border-[#557a22] text-[#d4ff3f]' : 'hover:bg-[#0c121d]'
                  }`}
                >
                  <span className={`font-semibold ${isSelected ? 'text-[#d4ff3f]' : 'text-[#e2e8f0]'}`}>
                    {agentId}
                  </span>
                  <div className="flex items-center gap-5">
                    <span className={isApproved ? 'text-[#d4ff3f]' : 'text-[#64748b]'}>{statusText}</span>
                    <div className="w-8 text-right font-mono tracking-widest">{meterBar}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODULE 5: RESTORATION CODE ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>RESTORATION CODE</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-0.5 text-[11px] font-mono leading-relaxed scrollbar-none">
            {currentStage.codeLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 px-1 ${
                  line.isHighlighted
                    ? 'bg-[#182510] text-[#d4ff3f] font-bold border-l-2 border-[#d4ff3f]'
                    : 'text-[#94a3b8]'
                }`}
              >
                <span className="text-[#475569] select-none text-[10px] w-5 text-right">{line.num}</span>
                <span className="truncate">{line.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 6: EVIDENCE TREE ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>EVIDENCE TREE</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-1.5 space-y-1 text-[11px] font-mono leading-tight scrollbar-none">
            {currentStage.evidenceTree.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-1 ${
                  item.isHighlighted ? 'text-[#d4ff3f] font-bold' : 'text-[#94a3b8]'
                }`}
                style={{ paddingLeft: `${item.indent * 12 + 4}px` }}
              >
                <span className="truncate">{item.text}</span>
                <span
                  className={`text-[10px] lowercase ${
                    item.status === 'fixed' || item.status === 'read' ? 'text-[#d4ff3f] font-bold' : 'text-[#64748b]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MODULE 7: CONTEXT LEDGER ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>CONTEXT LEDGER</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1.5 space-y-1 text-[10px]">
            {Object.entries(currentStage.contextLedger).map(([metric, val], idx) => {
              const isLime = idx % 2 === 0;
              return (
                <div key={metric} className="flex items-center gap-3">
                  <span className="text-[#64748b] w-16 lowercase font-mono text-[10px]">{metric}</span>
                  <div className="flex-1 h-2 bg-[#111827] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isLime ? 'bg-[#d4ff3f]' : 'bg-[#60a5fa]'}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= MODULE 8: PAYLOAD INSPECTOR ================= */}
        <div className="border border-[#141b26] bg-[#03060a] flex flex-col h-[225px] p-2.5 overflow-hidden">
          <div className="text-[11px] font-bold text-white tracking-wider pb-1.5 border-b border-[#141b26] flex items-center justify-between">
            <span>PAYLOAD INSPECTOR</span>
          </div>

          <div className="flex-1 flex flex-col justify-around py-1 text-[11px] font-mono">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">sender</span>
              <span className="text-[#64748b] px-1">:</span>
              <span className="text-[#f1f5f9] flex-1 text-right">{currentStage.payload.sender}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">target</span>
              <span className="text-[#64748b] px-1">:</span>
              <span className="text-[#60a5fa] flex-1 text-right">{currentStage.payload.target}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">artifact</span>
              <span className="text-[#64748b] px-1">:</span>
              <span className="text-[#f1f5f9] flex-1 text-right">{currentStage.payload.artifact}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">audio</span>
              <span className="text-[#64748b] px-1">:</span>
              <span
                className={`flex-1 text-right ${
                  currentStage.payload.audio === 'MISSING'
                    ? 'text-rose-400 font-bold'
                    : currentStage.payload.audio === 'repairing'
                    ? 'text-amber-400 font-bold'
                    : 'text-[#d4ff3f] font-semibold'
                }`}
              >
                {currentStage.payload.audio}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">review</span>
              <span className="text-[#64748b] px-1">:</span>
              <span
                className={`flex-1 text-right ${
                  currentStage.payload.review === 'REJECTED'
                    ? 'text-rose-400 font-bold'
                    : currentStage.payload.review === 'APPROVED'
                    ? 'text-[#d4ff3f] font-bold'
                    : 'text-[#d4ff3f]'
                }`}
              >
                {currentStage.payload.review}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#64748b] w-20">patch</span>
              <span className="text-[#64748b] px-1">:</span>
              <span className="text-[#d4ff3f] font-bold flex-1 text-right">{currentStage.payload.patch}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
