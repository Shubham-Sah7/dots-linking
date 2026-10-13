'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  DottedSilhouettePattern,
  PatternVariant,
  PatternRenderer,
} from './dotted-silhouette-pattern';
import { EXACT_REFERENCE_DOTS, evaluateReferenceSilhouette } from './reference-data';

interface ReferencePatternModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferencePatternModal({ isOpen, onClose }: ReferencePatternModalProps) {
  const [variant, setVariant] = useState<PatternVariant>('reference');
  const [renderer, setRenderer] = useState<PatternRenderer>('canvas');
  const [dotSize, setDotSize] = useState<number>(1.75);
  const [spacing, setSpacing] = useState<number>(14);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [useExactDots, setUseExactDots] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  // Calculate live dot count
  const liveDotCount = useMemo(() => {
    if (useExactDots) return EXACT_REFERENCE_DOTS.length;
    let count = 0;
    const w = 840;
    const h = 440;
    for (let y = spacing * 0.75; y < h; y += spacing) {
      const v = y / h;
      for (let x = spacing * 0.75; x < w; x += spacing) {
        const u = x / w;
        if (evaluateReferenceSilhouette(u, v).inside) {
          count++;
        }
      }
    }
    return count;
  }, [useExactDots, spacing]);

  // Generate raw SVG string for copying/downloading
  const generateSvgString = () => {
    const w = 1000;
    const h = 520;
    const circles: string[] = [];

    const getFill = (cluster: string) => {
      if (activeScope && activeScope.toLowerCase().includes(cluster)) {
        return '#f26522';
      }
      if (variant === 'reference') return '#ffffff';
      if (cluster === 'product') return '#f26522';
      if (cluster === 'engineering') return '#60a5fa';
      if (cluster === 'operations') return '#34d399';
      return 'rgba(255, 255, 255, 0.2)';
    };

    if (useExactDots) {
      for (const d of EXACT_REFERENCE_DOTS) {
        circles.push(
          `<circle cx="${(d.x * w).toFixed(1)}" cy="${(d.y * h).toFixed(1)}" r="${dotSize}" fill="${getFill(d.cluster)}" />`
        );
      }
    } else {
      for (let y = spacing * 0.75; y < h; y += spacing) {
        const v = y / h;
        for (let x = spacing * 0.75; x < w; x += spacing) {
          const u = x / w;
          const res = evaluateReferenceSilhouette(u, v);
          if (res.inside) {
            circles.push(
              `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotSize}" fill="${getFill(res.cluster)}" />`
            );
          }
        }
      }
    }

    const bg = variant === 'reference' ? '#000000' : '#1B1B19';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}" />
  <g id="dotted-silhouette-layer">
    ${circles.join('\n    ')}
  </g>
</svg>`;
  };

  const handleCopySvg = () => {
    const svg = generateSvgString();
    navigator.clipboard.writeText(svg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svg = generateSvgString();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maximem-dotted-pattern-${variant}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-pattern-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-[#141413] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1a1a18]">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#f26522]/15 border border-[#f26522]/40 flex items-center justify-center text-[#f26522]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 id="reference-pattern-modal-title" className="text-sm font-bold text-white tracking-wide">
                Dotted-Pattern Visual Component Inspector
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                Maximem Memory Map Silhouette · Stepped Geometric Boundary · Configurable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySvg}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Copy SVG XML"
            >
              {copiedSvg ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedSvg ? 'Copied SVG' : 'Copy SVG'}</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 rounded-lg bg-[#f26522]/20 hover:bg-[#f26522]/30 border border-[#f26522]/50 text-xs font-mono text-[#f26522] flex items-center gap-1.5 transition-colors font-semibold"
              title="Download as standalone SVG"
            >
              <Download size={13} />
              <span>Export SVG</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors ml-2"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body: Preview + Control Sidebar */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Visual Preview Area */}
          <div className="flex-1 min-h-[380px] bg-black p-6 flex flex-col justify-center items-center overflow-hidden relative">
            {/* Viewport Frame */}
            <div className="w-full h-full max-w-4xl max-h-[480px] rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl relative flex flex-col">
              <DottedSilhouettePattern
                variant={variant}
                renderer={renderer}
                dotSize={dotSize}
                spacing={spacing}
                activeScope={activeScope}
                useExactReferenceDots={useExactDots}
                className="flex-1 w-full h-full"
              />

              {/* Floating Status Pill */}
              <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.1] text-[10px] font-mono text-white/70 flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: variant === 'reference' ? '#ffffff' : '#f26522',
                  }}
                />
                <span>
                  {variant === 'reference' ? 'PURE REFERENCE (WHITE ON BLACK)' : 'MAXIMEM BRAND (#1B1B19)'}
                </span>
                <span className="text-white/30">|</span>
                <span>{liveDotCount.toLocaleString()} DOTS</span>
                <span className="text-white/30">|</span>
                <span>{spacing}PX PITCH</span>
              </div>
            </div>
          </div>

          {/* Right Control Inspector Panel */}
          <div className="w-full lg:w-80 bg-[#161615] border-t lg:border-t-0 lg:border-l border-white/[0.08] p-5 overflow-y-auto flex flex-col gap-5 text-xs text-white/80">
            {/* Variant Switcher */}
            <div>
              <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-2 font-mono">
                Visual Preset
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#1f1f1d] p-1 rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => setVariant('reference')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    variant === 'reference'
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Reference B&W
                </button>
                <button
                  onClick={() => setVariant('memory-map')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    variant === 'memory-map'
                      ? 'bg-[#f26522] text-white font-bold shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Maximem Brand
                </button>
              </div>
            </div>

            {/* Dot Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider font-mono">
                  Dot Radius
                </label>
                <span className="font-mono text-white font-bold">{dotSize.toFixed(2)} px</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="3.5"
                step="0.25"
                value={dotSize}
                onChange={(e) => setDotSize(parseFloat(e.target.value))}
                className="w-full accent-[#f26522] bg-white/[0.1] rounded-lg h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1">
                <span>0.75px (fine)</span>
                <span>1.75px (default)</span>
                <span>3.5px (bold)</span>
              </div>
            </div>

            {/* Grid Spacing Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider font-mono">
                  Grid Spacing
                </label>
                <span className="font-mono text-white font-bold">{spacing} px</span>
              </div>
              <input
                type="range"
                min="8"
                max="26"
                step="2"
                value={spacing}
                disabled={useExactDots}
                onChange={(e) => setSpacing(parseInt(e.target.value))}
                className={`w-full accent-[#f26522] bg-white/[0.1] rounded-lg h-1.5 cursor-pointer ${
                  useExactDots ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1">
                <span>8px (dense)</span>
                <span>14px (standard)</span>
                <span>26px (sparse)</span>
              </div>
            </div>

            {/* Scope Cluster Accent Highlighter */}
            <div>
              <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-2 font-mono">
                Scope Highlight (Orange Accent)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: null, label: 'None' },
                  { id: 'product', label: 'Product Team' },
                  { id: 'engineering', label: 'Engineering' },
                  { id: 'operations', label: 'Operations' },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setActiveScope(s.id)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] border text-left transition-colors font-mono ${
                      activeScope === s.id
                        ? 'border-[#f26522] bg-[#f26522]/15 text-[#f26522] font-bold'
                        : 'border-white/[0.08] hover:bg-white/[0.05] text-white/70'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Renderer Switcher */}
            <div>
              <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-2 font-mono">
                Render Engine
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#1f1f1d] p-1 rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => setRenderer('canvas')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    renderer === 'canvas'
                      ? 'bg-white/[0.15] text-white font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  HTML5 Canvas
                </button>
                <button
                  onClick={() => setRenderer('svg')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    renderer === 'svg'
                      ? 'bg-white/[0.15] text-white font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Vector SVG
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="pt-2 border-t border-white/[0.08]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useExactDots}
                  onChange={(e) => setUseExactDots(e.target.checked)}
                  className="rounded accent-[#f26522]"
                />
                <span className="text-[11px] text-white/80">
                  Exact 1:1 Reference Dots Mode (Fixed 1,404 dots)
                </span>
              </label>
              <p className="text-[10px] text-white/40 mt-1 pl-5">
                Locks dots to the exact coordinates extracted directly from the reference image.
              </p>
            </div>

            {/* Reference Architecture Details */}
            <div className="mt-auto pt-3 border-t border-white/[0.08] text-[10px] text-white/40 space-y-1 font-mono">
              <div>Boundary: Stepped pixel quantization</div>
              <div>Negative Space: Preserved on left flank</div>
              <div>Voids: Cleared around memory nodes</div>
              <div>Aesthetics: Pure minimal geometric</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
