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
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#181816] border border-white/[0.1] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#141413]">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-[#F26522] animate-pulse" />
            <h2 className="text-white text-sm sm:text-base font-bold tracking-tight font-sans">
              Sonnet 5.5 + Jev Playbook · 15,000 GitHub Issues Benchmark
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-[#d4d4d8] leading-relaxed">
          {/* Executive Summary */}
          <div className="bg-[#141413] border border-white/[0.08] p-4 rounded-md">
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2 font-sans">
              <Zap size={16} className="text-[#F26522]" />
              The Two-Tier Architecture Concept
            </h3>
            <p className="text-[#a1a1aa]">
              Directly feeding 15,000 raw GitHub issues into a frontier reasoning model (Claude Sonnet 5.5) wastes massive token budget on non-actionable bugs. By placing <strong className="text-white">Jev</strong> as a high-speed pre-screening filter, 14,640 dead-end issues are discarded in 4 minutes for $1.30, allowing Sonnet 5.5 to focus exclusively on 360 high-signal candidates.
            </p>
          </div>

          {/* Key Metrics Comparison Table */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2 font-sans">
              <DollarSign size={16} className="text-[#F26522]" />
              Benchmark: Brute Force vs Two-Tier Screened
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Brute Force */}
              <div className="border border-white/[0.08] bg-[#141413] p-4 rounded-md">
                <div className="text-[#a1a1aa] font-bold mb-2 uppercase tracking-wider text-[11px] font-mono">
                  Brute Force (Sonnet 5.5 All 15,000)
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Total Tokens:</span>
                    <span className="text-white font-bold font-mono">46,800,000</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Execution Time:</span>
                    <span className="text-white font-bold font-mono">49 hours</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Total Cost:</span>
                    <span className="text-white font-bold font-mono">$131.42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">Passing Fixes:</span>
                    <span className="text-white font-bold font-mono">42 patches</span>
                  </div>
                </div>
              </div>

              {/* Jev + Sonnet Two-Tier */}
              <div className="border border-[#F26522]/30 bg-[#F26522]/5 p-4 rounded-md">
                <div className="text-[#F26522] font-bold mb-2 uppercase tracking-wider text-[11px] font-mono">
                  Two-Tier (Jev First → Sonnet 5.5 Shortlist)
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Sonnet Tokens:</span>
                    <span className="text-white font-bold font-mono">9,700,000 (79% less)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Execution Time:</span>
                    <span className="text-[#F26522] font-bold font-mono">10 hours (4.9x faster)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-[#71717a]">Total Cost:</span>
                    <span className="text-[#F26522] font-bold font-mono">$36.26 (3.6x cheaper)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">Passing Fixes:</span>
                    <span className="text-[#F26522] font-bold font-mono">42 patches (Identical!)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jev 4-Check Screening Rules */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2 font-sans">
              <ShieldCheck size={16} className="text-[#F26522]" />
              Jev&apos;s 4 Mandatory Pre-Screen Checks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 border border-white/[0.08] bg-[#141413] rounded-md">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#F26522]" />
                  1. Reproduction Steps
                </div>
                <p className="text-[#a1a1aa] text-[11px]">
                  Does the issue report specify an exact reproducible script, command, or environment?
                </p>
              </div>

              <div className="p-3 border border-white/[0.08] bg-[#141413] rounded-md">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#F26522]" />
                  2. Clear Failure Trace
                </div>
                <p className="text-[#a1a1aa] text-[11px]">
                  Is there a verifiable traceback, error message, or unambiguous broken behavior assertion?
                </p>
              </div>

              <div className="p-3 border border-white/[0.08] bg-[#141413] rounded-md">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#F26522]" />
                  3. Bounded Scope
                </div>
                <p className="text-[#a1a1aa] text-[11px]">
                  Is the fix localized to specific modules, avoiding open-ended architectural redesigns?
                </p>
              </div>

              <div className="p-3 border border-white/[0.08] bg-[#141413] rounded-md">
                <div className="text-white font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle size={13} className="text-[#F26522]" />
                  4. Requires Reading Code
                </div>
                <p className="text-[#a1a1aa] text-[11px]">
                  Is the resolution a code patch (vs user configuration, documentation typo, or environment misconfiguration)?
                </p>
              </div>
            </div>
          </div>

          {/* The Handoff Workflow */}
          <div className="p-4 border border-white/[0.08] bg-[#141413] rounded-md">
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2 font-sans">
              <Clock size={16} className="text-[#F26522]" />
              The Autonomous Handoff Protocol
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[#a1a1aa]">
              <li><strong className="text-white">Jev Screens:</strong> Finds actionable issues worth opening (15k → 360).</li>
              <li><strong className="text-white">Sonnet 5.5 Investigates:</strong> Reads repository code and writes targeted patches.</li>
              <li><strong className="text-white">Automated Tests Verify:</strong> Sandboxed CI suite validates correctness (42 patches pass).</li>
              <li><strong className="text-white">Human Engineer Decides:</strong> Final merge and deploy decision by human reviewer.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#141413] flex items-center justify-between">
          <span className="text-[11px] text-[#71717a]">Reference: @mika_systems · Claude Sonnet 5.5 + Jev</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] text-xs font-bold bg-[#F26522] text-white hover:bg-[#ff7738] transition-colors cursor-pointer shadow-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
