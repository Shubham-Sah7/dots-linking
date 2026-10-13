'use client';

import React from 'react';
import { X, ExternalLink, Cpu, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaseStudyModal({ isOpen, onClose }: CaseStudyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#1B1B19] border border-white/[0.1] text-[#F4F4F5] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#181816]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F26522]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F26522]">
              Rescue Brief: 220,000 Lines of Dormant Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#D4D4D8] leading-relaxed scrollbar-none">
          {/* Catalyst Quote */}
          <div className="p-4 border border-[#F26522]/30 bg-[#F26522]/5 space-y-2">
            <div className="text-[10px] uppercase font-semibold text-[#F26522] tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> The Catalyst Idea
            </div>
            <p className="text-sm italic text-white font-medium">
              &quot;give agents abandoned software and a working definition of done&quot;
            </p>
            <p className="text-[11px] text-[#A1A1AA]">
              — Andrej Karpathy (ex-OpenAI, ex-Tesla)
            </p>
          </div>

          {/* The Scenario */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Terminal size={14} className="text-[#F26522]" /> The Scenario
            </h3>
            <p>
              A video editor with <strong>220,000 lines of code</strong> hadn&apos;t shipped a release in <strong>four years</strong>. The source was public, the installer was broken, and hundreds of users were still asking how to run it.
            </p>
            <p>
              One builder gave six autonomous AI agents one core objective:
              <span className="text-[#F26522] block font-semibold mt-1">
                &quot;Make it install, edit, and export a video on a clean machine.&quot;
              </span>
            </p>
          </div>

          {/* Six-Agent Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Cpu size={14} className="text-[#F26522]" /> The 6 Autonomous Roles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-white mb-1">agent / dependencies</div>
                <div className="text-[#A1A1AA]">Traced missing native dependencies, node-gyp incompatibilities, and reconstructed modern package manifests.</div>
              </div>

              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-white mb-1">agent / installer</div>
                <div className="text-[#A1A1AA]">Rebuilt the broken installer pipeline, producing clean standalone packages for macOS and Windows.</div>
              </div>

              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-white mb-1">agent / timeline</div>
                <div className="text-[#A1A1AA]">Restored canvas rendering, GPU hardware acceleration, timeline scrubbing, and 60fps video preview.</div>
              </div>

              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-white mb-1">agent / export</div>
                <div className="text-[#A1A1AA]">Restored the export pipeline, fixed the silent audio drop bug, and mapped multi-track stereo encoding.</div>
              </div>

              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-white mb-1">agent / projects</div>
                <div className="text-[#A1A1AA]">Tested 32 legacy project files across 4 years of schemas to guarantee 100% backward compatibility.</div>
              </div>

              <div className="p-2.5 bg-[#20201E] border border-white/[0.08]">
                <div className="font-semibold text-[#F26522] mb-1">agent / reviewer</div>
                <div className="text-[#A1A1AA]">The QA gatekeeper. Repeated every workflow on a bare machine, inspected outputs, and verified 50 export checks.</div>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="p-4 bg-[#20201E] border border-white/[0.08] space-y-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#F26522]" /> Final Outcome
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-2">
              <div className="p-2 bg-[#181816] border border-white/[0.08]">
                <div className="text-base font-bold text-[#F26522]">14</div>
                <div className="text-[10px] text-[#71717A]">Features Restored</div>
              </div>
              <div className="p-2 bg-[#181816] border border-white/[0.08]">
                <div className="text-base font-bold text-white">32</div>
                <div className="text-[10px] text-[#71717A]">Legacy Projects Passed</div>
              </div>
              <div className="p-2 bg-[#181816] border border-white/[0.08]">
                <div className="text-base font-bold text-[#F26522]">50</div>
                <div className="text-[10px] text-[#71717A]">Export Checks Approved</div>
              </div>
            </div>
            <p className="text-[#A1A1AA]">
              Four years without a release ended with a clean, reviewable patch and a production installer running smoothly on a fresh laptop.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#181816] flex items-center justify-between">
          <a
            href="https://x.com/mika_systems/status/2108911495706730762"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#F26522] transition-colors"
          >
            <span>Original Tweet by @mika_systems</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F26522] text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#ff7536] transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
}
