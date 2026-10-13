'use client';

import React from 'react';
import {
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { MemoryItem } from './types';

interface MemoryInspectorPopoverProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onNextMemory: () => void;
  onPrevMemory: () => void;
}

export function MemoryInspectorPopover({
  memory,
  onClose,
  onNextMemory,
  onPrevMemory,
}: MemoryInspectorPopoverProps) {
  if (!memory) return null;

  const isSuperseded = memory.status === 'Superseded';

  return (
    <div className="absolute bottom-16 left-6 z-30 max-w-sm w-full bg-[#141413]/95 backdrop-blur-xl border border-white/[0.12] text-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] font-sans select-none rounded-[12px]">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isSuperseded
                ? 'bg-amber-400'
                : memory.status === 'Active'
                ? 'bg-emerald-400'
                : 'bg-[#f26522]'
            }`}
          />
          <span className="text-[11px] font-mono text-[#a1a1aa] tracking-wider uppercase">
            Memory {memory.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#71717a] hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Memory Text */}
      <div className="py-3">
        <p className="text-xs sm:text-sm font-medium text-[#f4f4f5] leading-relaxed">
          &quot;{memory.text}&quot;
        </p>
      </div>

      {/* Status & Ownership Question Answered */}
      <div className="space-y-2 py-2 border-y border-white/[0.08] text-[11px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[#8e8e93]">Status</span>
          <span
            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
              isSuperseded
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {memory.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#8e8e93]">Home Scope</span>
          <span className="text-[#f26522] font-semibold flex items-center gap-1">
            <Shield size={11} /> {memory.ownerName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#8e8e93]">Customer Org</span>
          <span className="text-white font-medium">{memory.customerName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#8e8e93]">Confidence</span>
          <span className="text-[#a1a1aa]">{(memory.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Action Buttons matching Screenshot 3 */}
      <div className="pt-3 flex flex-col gap-1.5">
        <button className="w-full py-1.5 px-3 bg-[#1e1d1a] hover:bg-[#282622] text-white text-xs font-mono flex items-center justify-between border border-white/[0.1] rounded-[6px] transition-colors group">
          <span className="flex items-center gap-1.5 text-[#f26522] font-medium">
            <FileText size={12} /> Go to document
          </span>
          <ExternalLink size={11} className="text-[#71717a] group-hover:text-white" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPrevMemory}
            className="py-1 px-2.5 bg-[#1a1a18] hover:bg-[#222220] text-[#a1a1aa] hover:text-white text-[11px] font-mono flex items-center justify-center gap-1 border border-white/[0.08] rounded-[6px] transition-colors"
          >
            <ArrowLeft size={11} /> Prev memory
          </button>
          <button
            onClick={onNextMemory}
            className="py-1 px-2.5 bg-[#1a1a18] hover:bg-[#222220] text-[#a1a1aa] hover:text-white text-[11px] font-mono flex items-center justify-center gap-1 border border-white/[0.08] rounded-[6px] transition-colors"
          >
            Next memory <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
