'use client';

import React from 'react';
import { X, CheckCircle, Zap, ShieldCheck, DollarSign, Clock } from 'lucide-react';

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaseStudyModal({ isOpen, onClose }: CaseStudyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#05080e] border border-[#1f293d] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#141b26] bg-[#020408]">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <h2 className="text-white text-sm sm:text-base font-bold tracking-tight">
              Sonnet 5.5 + Jev Playbook · 15,000 GitHub Issues Benchmark
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#64748b] hover:text-white hover:bg-[#141b26] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-[#cbd5e1] leading-relaxed">
          {/* Executive Summary */}
          <div className="bg-[#0b1322] border border-[#1e3a8a]/50 p-4 rounded">
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
              <Zap size={16} className="text-[#38bdf8]" />
              The Two-Tier Architecture Concept
            </h3>
            <p className="text-[#94a3b8]">
              Directly feeding 15,000 raw GitHub issues into a frontier reasoning model (Claude Sonnet 5.5) wastes massive token budget on non-actionable bugs. By placing <strong>Jev</strong> as a high-speed pre-screening filter, 14,640 dead-end issues are discarded in 4 minutes for $1.30, allowing Sonnet 5.5 to focus exclusively on 360 high-signal candidates.
            </p>
          </div>

          {/* Key Metrics Comparison Table */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-[#d4ff3f]" />
              Benchmark: Brute Force vs Two-Tier Screened
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Brute Force */}
              <div className="border border-[#1f2937] bg-[#070b12] p-4 rounded">
                <div className="text-rose-400 font-bold mb-2 uppercase tracking-wider text-[11px]">
                  Brute Force (Sonnet 5.5 All 15,000)
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Total Tokens:</span>
                    <span className="text-white font-bold">46,800,000</span>
                  </div>
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Execution Time:</span>
                    <span className="text-white font-bold">49 hours</span>
                  </div>
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Total Cost:</span>
                    <span className="text-rose-400 font-bold">$131.42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Passing Fixes:</span>
                    <span className="text-white font-bold">42 patches</span>
                  </div>
                </div>
              </div>

              {/* Jev + Sonnet Two-Tier */}
              <div className="border border-[#38bdf8]/40 bg-[#0a182c]/40 p-4 rounded">
                <div className="text-[#38bdf8] font-bold mb-2 uppercase tracking-wider text-[11px]">
                  Two-Tier (Jev First → Sonnet 5.5 Shortlist)
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Sonnet Tokens:</span>
                    <span className="text-[#38bdf8] font-bold">9,700,000 (79% less)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Execution Time:</span>
                    <span className="text-[#38bdf8] font-bold">10 hours (4.9x faster)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#141b26] pb-1">
                    <span className="text-[#64748b]">Total Cost:</span>
                    <span className="text-[#d4ff3f] font-bold">$36.26 (3.6x cheaper)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Passing Fixes:</span>
                    <span className="text-[#d4ff3f] font-bold">42 patches (Identical!)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jev 4-Check Screening Rules */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#38bdf8]" />
              Jev&apos;s 4 Mandatory Pre-Screen Checks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 border border-[#141b26] bg-[#070b12] rounded">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#38bdf8]" />
                  1. Reproduction Steps
                </div>
                <p className="text-[#94a3b8] text-[11px]">
                  Does the issue report specify an exact reproducible script, command, or environment?
                </p>
              </div>

              <div className="p-3 border border-[#141b26] bg-[#070b12] rounded">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#38bdf8]" />
                  2. Clear Failure Trace
                </div>
                <p className="text-[#94a3b8] text-[11px]">
                  Is there a verifiable traceback, error message, or unambiguous broken behavior assertion?
                </p>
              </div>

              <div className="p-3 border border-[#141b26] bg-[#070b12] rounded">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#38bdf8]" />
                  3. Bounded Scope
                </div>
                <p className="text-[#94a3b8] text-[11px]">
                  Is the fix localized to specific modules, avoiding open-ended architectural redesigns?
                </p>
              </div>

              <div className="p-3 border border-[#141b26] bg-[#070b12] rounded">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#38bdf8]" />
                  4. Requires Reading Code
                </div>
                <p className="text-[#94a3b8] text-[11px]">
                  Is the resolution a code patch (vs user configuration, documentation typo, or environment misconfiguration)?
                </p>
              </div>
            </div>
          </div>

          {/* The Handoff Workflow */}
          <div className="p-4 border border-[#1f2937] bg-[#070b12] rounded">
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              The Autonomous Handoff Protocol
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[#94a3b8]">
              <li><strong className="text-white">Jev Screens:</strong> Finds actionable issues worth opening (15k → 360).</li>
              <li><strong className="text-white">Sonnet 5.5 Investigates:</strong> Reads repository code and writes targeted patches.</li>
              <li><strong className="text-white">Automated Tests Verify:</strong> Sandboxed CI suite validates correctness (42 patches pass).</li>
              <li><strong className="text-white">Human Engineer Decides:</strong> Final merge and deploy decision by human reviewer.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#141b26] bg-[#020408] flex items-center justify-between">
          <span className="text-[11px] text-[#64748b]">Reference: @mika_systems · Claude Sonnet 5.5 + Jev</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-bold bg-[#38bdf8] text-black hover:bg-sky-300 transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
