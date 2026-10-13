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
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#070b12] border border-[#1f2937] text-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] bg-[#0a101d]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff3f] animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4ff3f]">
              Rescue Brief: 220,000 Lines of Dormant Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1f2937] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#cbd5e1] leading-relaxed scrollbar-none">
          {/* Karpathy's Inspiration Quote */}
          <div className="p-4 border border-[#d4ff3f]/30 bg-[#d4ff3f]/5 rounded-xs space-y-2">
            <div className="text-[10px] uppercase font-bold text-[#d4ff3f] tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> The 18M-View Catalyst Idea
            </div>
            <p className="text-sm italic text-white font-medium">
              &quot;give agents abandoned software and a working definition of done&quot;
            </p>
            <p className="text-[11px] text-[#94a3b8]">
              — Andrej Karpathy (ex-OpenAI, ex-Tesla)
            </p>
          </div>

          {/* The Mission */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Terminal size={14} className="text-[#38bdf8]" /> The Scenario
            </h3>
            <p>
              A video editor with <strong>220,000 lines of code</strong> hadn&apos;t shipped a release in <strong>four years</strong>. The source was public, the installer was broken, and hundreds of users were still asking how to run it.
            </p>
            <p>
              One builder gave six autonomous AI agents one core objective:
              <span className="text-[#d4ff3f] block font-semibold mt-1">
                &quot;Make it install, edit, and export a video on a clean machine.&quot;
              </span>
            </p>
          </div>

          {/* Six-Agent Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Cpu size={14} className="text-[#d4ff3f]" /> The 6 Autonomous Roles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / dependencies</div>
                <div className="text-[#94a3b8]">Traced missing native dependencies, node-gyp incompatibilities, and reconstructed modern package manifests.</div>
              </div>

              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / installer</div>
                <div className="text-[#94a3b8]">Rebuilt the broken installer pipeline, producing clean standalone packages for macOS and Windows.</div>
              </div>

              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / timeline</div>
                <div className="text-[#38bdf8]">Restored canvas rendering, GPU hardware acceleration, timeline scrubbing, and 60fps video preview.</div>
              </div>

              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / export</div>
                <div className="text-[#94a3b8]">Restored the export pipeline, fixed the silent audio drop bug, and mapped multi-track stereo encoding.</div>
              </div>

              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / projects</div>
                <div className="text-[#94a3b8]">Tested 32 legacy project files across 4 years of schemas to guarantee 100% backward compatibility.</div>
              </div>

              <div className="p-2.5 bg-[#0e1626] border border-[#1e293b]">
                <div className="font-bold text-[#38bdf8] mb-1">agent / reviewer</div>
                <div className="text-[#d4ff3f]">The QA gatekeeper. Repeated every workflow on a bare machine, inspected outputs, and verified 50 export checks.</div>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="p-4 bg-[#0a1420] border border-[#38bdf8]/30 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#d4ff3f]" /> Final Outcome
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-2">
              <div className="p-2 bg-[#060a12] border border-[#1e293b]">
                <div className="text-base font-bold text-[#d4ff3f]">14</div>
                <div className="text-[10px] text-[#64748b]">Features Restored</div>
              </div>
              <div className="p-2 bg-[#060a12] border border-[#1e293b]">
                <div className="text-base font-bold text-[#38bdf8]">32</div>
                <div className="text-[10px] text-[#64748b]">Legacy Projects Passed</div>
              </div>
              <div className="p-2 bg-[#060a12] border border-[#1e293b]">
                <div className="text-base font-bold text-emerald-400">50</div>
                <div className="text-[10px] text-[#64748b]">Export Checks Approved</div>
              </div>
            </div>
            <p className="text-[#94a3b8]">
              Four years without a release ended with a clean, reviewable patch and a production installer running smoothly on a fresh laptop.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f2937] bg-[#0a101d] flex items-center justify-between">
          <a
            href="https://x.com/mika_systems/status/2108911495706730762"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#38bdf8] hover:text-white transition-colors"
          >
            <span>Original Tweet by @mika_systems</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#d4ff3f] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#bef264] transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
}
