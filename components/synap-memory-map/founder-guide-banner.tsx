'use client';

import React from 'react';
import { X, ShieldCheck, GitBranch, Eye, CheckCircle } from 'lucide-react';

interface FounderGuideBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FounderGuideBanner({ isOpen, onClose }: FounderGuideBannerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#141413] border border-white/[0.14] text-white p-6 rounded-2xl shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f26522]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Founder Specification: Memory Map Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.08]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs text-white/70 leading-relaxed">
          <div className="p-4 bg-[#181816] border border-[#f26522]/30 rounded-xl space-y-1">
            <div className="text-[#f26522] font-bold text-xs uppercase font-mono">
              Core Mandate
            </div>
            <p className="text-white text-sm font-semibold">
              &ldquo;Whose memory is this, and what is it connected to?&rdquo;
            </p>
            <p className="text-[11px] text-white/60">
              Every user must be able to visually pinpoint ownership at a glance and explore relationship edges across scopes without confusion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div className="p-3.5 bg-[#181816] border border-white/[0.08] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#f26522]">
                <ShieldCheck size={14} /> Rule 1: No Sibling Overlap
              </div>
              <p className="text-[11px] text-white/60">
                Two user regions or customer regions must <strong>never overlap</strong>. Overlap would imply shared ownership, creating data leakage and privacy concerns.
              </p>
            </div>

            <div className="p-3.5 bg-[#181816] border border-white/[0.08] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <GitBranch size={14} /> Rule 2: Single Smallest Home Scope
              </div>
              <p className="text-[11px] text-white/60">
                Every memory sits in exactly <strong>one smallest scope</strong> it belongs to. User memories belong to that user; customer memories to customer; client memories to client.
              </p>
            </div>

            <div className="p-3.5 bg-[#181816] border border-white/[0.08] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Eye size={14} /> Rule 3: Regions vs. Edges
              </div>
              <p className="text-[11px] text-white/60">
                <strong>Regions communicate ownership</strong>. <strong>Edges communicate relationships</strong>. Never conflate proximity with relationship.
              </p>
            </div>

            <div className="p-3.5 bg-[#181816] border border-white/[0.08] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#ff732e]">
                <CheckCircle size={14} /> Rule 4: Progressive Zoom & Breadcrumb
              </div>
              <p className="text-[11px] text-white/60">
                Seamless exploration from Client → Customer → User → Memory. Search immediately navigates and focuses camera on target memory.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f26522] hover:bg-[#ff732e] text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Close & Return to Map
          </button>
        </div>
      </div>
    </div>
  );
}
