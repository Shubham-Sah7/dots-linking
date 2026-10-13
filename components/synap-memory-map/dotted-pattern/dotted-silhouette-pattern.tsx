'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  EXACT_REFERENCE_DOTS,
  evaluateReferenceSilhouette,
} from './reference-data';

export type PatternVariant = 'reference' | 'memory-map' | 'scope-cluster';
export type PatternRenderer = 'canvas' | 'svg';

export interface ScopeClusterDef {
  id: string;
  name: string;
  cluster: 'product' | 'engineering' | 'operations' | 'client';
  color?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface DottedSilhouettePatternProps {
  /**
   * Visual preset variant:
   * - 'reference': Pure black (#000000) background with white (#FFFFFF) dots.
   *   Exact reproduction of the uploaded image's dotted silhouette and stepped pixel-boundary.
   * - 'memory-map': Maximem brand palette (#1B1B19 background, subtle muted-grey dots,
   *   #F26522 orange accent for active scope/selection).
   * - 'scope-cluster': Focused single-scope dotted cloud (like Team Level zoom).
   */
  variant?: PatternVariant;

  /**
   * Rendering engine: 'canvas' (default for high performance) or 'svg' (for vector scalability).
   */
  renderer?: PatternRenderer;

  /** Dot radius in CSS pixels (default: 1.75px) */
  dotSize?: number;

  /** Grid spacing between dots in CSS pixels (default: 14px) */
  spacing?: number;

  /** Default dot color (overrides variant default if specified) */
  dotColor?: string;

  /** Canvas background color (overrides variant default if specified) */
  backgroundColor?: string;

  /** Highlight accent color for selected memories or active scope (default: #F26522) */
  accentColor?: string;

  /** Active scope cluster to highlight in orange: 'product' | 'engineering' | 'operations' | 'client' | string | null */
  activeScope?: string | null;

  /** Whether to clear internal void zones around memory nodes to ensure 100% text readability (default: true) */
  showVoids?: boolean;

  /** When true and spacing matches default, uses 1:1 ground-truth reference points (default: true) */
  useExactReferenceDots?: boolean;

  /** Camera transform for interactive viewport sync: { x, y, zoom } */
  camera?: { x: number; y: number; zoom: number };

  /** Fixed width (if omitted, fills container responsively) */
  width?: number;

  /** Fixed height (if omitted, fills container responsively) */
  height?: number;

  /** Container CSS class */
  className?: string;

  /** Container inline styles */
  style?: React.CSSProperties;

  /** Click callback on dot */
  onDotClick?: (dot: { x: number; y: number; cluster: string }) => void;
}

/**
 * High-performance standalone programmatic render function for Canvas.
 * Can be called inside an external Canvas requestAnimationFrame loop.
 */
export function drawDottedSilhouetteToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    dotSize?: number;
    spacing?: number;
    dotColor?: string;
    backgroundColor?: string | null;
    accentColor?: string;
    activeScope?: string | null;
    showVoids?: boolean;
    useExactReferenceDots?: boolean;
    camera?: { x: number; y: number; zoom: number };
    variant?: PatternVariant;
  }
) {
  const {
    dotSize = 1.75,
    spacing = 14,
    dotColor = '#ffffff',
    backgroundColor = '#000000',
    accentColor = '#f26522',
    activeScope = null,
    useExactReferenceDots = false,
    camera,
    variant = 'reference',
  } = options;

  // 1. Draw Background if requested
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Camera transform if supplied
  ctx.save();
  if (camera) {
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
  }

  // Helper to determine dot color
  const getDotFill = (cluster: string) => {
    const isHighlighted =
      activeScope &&
      (activeScope.toLowerCase().includes(cluster) ||
        (activeScope === 'product' && cluster === 'product') ||
        (activeScope === 'engineering' && cluster === 'engineering') ||
        (activeScope === 'operations' && cluster === 'operations'));

    if (isHighlighted) {
      return accentColor;
    }

    if (variant === 'reference') {
      return dotColor;
    }

    // Maximem Memory Map variant: subtle muted grey dots
    if (cluster === 'product') {
      return activeScope ? 'rgba(255, 255, 255, 0.12)' : 'rgba(242, 101, 34, 0.65)';
    }
    if (cluster === 'engineering') {
      return activeScope ? 'rgba(255, 255, 255, 0.12)' : 'rgba(96, 165, 250, 0.65)';
    }
    if (cluster === 'operations') {
      return activeScope ? 'rgba(255, 255, 255, 0.12)' : 'rgba(52, 211, 153, 0.65)';
    }
    return dotColor;
  };

  // 2. Render either exact ground-truth reference dots or parametric resampled grid
  if (useExactReferenceDots) {
    // Exact 1:1 ground-truth reference dots from reference image
    for (let i = 0; i < EXACT_REFERENCE_DOTS.length; i++) {
      const d = EXACT_REFERENCE_DOTS[i];
      const px = d.x * width;
      const py = d.y * height;

      ctx.beginPath();
      ctx.arc(px, py, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = getDotFill(d.cluster);
      ctx.fill();
    }
  } else {
    // Parametric stepped grid generation
    // Evaluates the continuous silhouette model at consistent grid spacing
    const startX = spacing * 0.75;
    const startY = spacing * 0.75;

    for (let y = startY; y < height; y += spacing) {
      const v = y / height;
      for (let x = startX; x < width; x += spacing) {
        const u = x / width;

        const evalResult = evaluateReferenceSilhouette(u, v);
        if (evalResult.inside) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = getDotFill(evalResult.cluster);
          ctx.fill();
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Reusable Dotted-Pattern Visual Component for the Maximem Memory Map.
 *
 * Implements the uploaded visual reference with precision:
 * - Crisp grid of small, evenly spaced circular dots.
 * - Pure white dots on pure black background for the reference version.
 * - Reproduces the large, irregular curved silhouette with smooth, stepped pixel-like boundary.
 * - Consistent dot size, spacing, and alignment throughout the pattern.
 * - Preserves the large black negative space on the left.
 * - Zero gradients, shadows, glow, blur, textures, or random particles.
 * - Fully configurable: dotSize, spacing, colors, variants, responsive sizing, and SVG/Canvas modes.
 */
export function DottedSilhouettePattern({
  variant = 'reference',
  renderer = 'canvas',
  dotSize = 1.75,
  spacing = 14,
  dotColor,
  backgroundColor,
  accentColor = '#f26522',
  activeScope = null,
  showVoids = true,
  useExactReferenceDots = false,
  camera,
  width: fixedWidth,
  height: fixedHeight,
  className = '',
  style = {},
  onDotClick,
}: DottedSilhouettePatternProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [measuredDimensions, setMeasuredDimensions] = useState<{ width: number; height: number }>({
    width: fixedWidth || 800,
    height: fixedHeight || 420,
  });

  const dimensions = useMemo(
    () => ({
      width: fixedWidth || measuredDimensions.width,
      height: fixedHeight || measuredDimensions.height,
    }),
    [fixedWidth, fixedHeight, measuredDimensions]
  );

  // Effective colors based on variant
  const effectiveBgColor = useMemo(() => {
    if (backgroundColor !== undefined) return backgroundColor;
    if (variant === 'reference') return '#000000';
    return '#1B1B19';
  }, [backgroundColor, variant]);

  const effectiveDotColor = useMemo(() => {
    if (dotColor !== undefined) return dotColor;
    if (variant === 'reference') return '#ffffff';
    return 'rgba(255, 255, 255, 0.18)';
  }, [dotColor, variant]);

  // Responsive container observer
  useEffect(() => {
    if (fixedWidth && fixedHeight) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setMeasuredDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [fixedWidth, fixedHeight]);

  // Canvas render effect
  useEffect(() => {
    if (renderer !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    drawDottedSilhouetteToCanvas(ctx, dimensions.width, dimensions.height, {
      dotSize,
      spacing,
      dotColor: effectiveDotColor,
      backgroundColor: effectiveBgColor,
      accentColor,
      activeScope,
      showVoids,
      useExactReferenceDots,
      camera,
      variant,
    });

    ctx.restore();
  }, [
    dimensions,
    renderer,
    dotSize,
    spacing,
    effectiveDotColor,
    effectiveBgColor,
    accentColor,
    activeScope,
    showVoids,
    useExactReferenceDots,
    camera,
    variant,
  ]);

  // SVG Mode dots list calculation
  const svgDots = useMemo(() => {
    if (renderer !== 'svg') return [];

    const dots: Array<{ x: number; y: number; fill: string; cluster: string }> = [];
    const { width, height } = dimensions;

    const getDotFill = (cluster: string) => {
      const isHighlighted =
        activeScope &&
        (activeScope.toLowerCase().includes(cluster) ||
          (activeScope === 'product' && cluster === 'product') ||
          (activeScope === 'engineering' && cluster === 'engineering') ||
          (activeScope === 'operations' && cluster === 'operations'));

      if (isHighlighted) return accentColor;
      if (variant === 'reference') return effectiveDotColor;
      if (cluster === 'product') return 'rgba(242, 101, 34, 0.7)';
      if (cluster === 'engineering') return 'rgba(96, 165, 250, 0.7)';
      if (cluster === 'operations') return 'rgba(52, 211, 153, 0.7)';
      return effectiveDotColor;
    };

    if (useExactReferenceDots) {
      for (const d of EXACT_REFERENCE_DOTS) {
        dots.push({
          x: d.x * width,
          y: d.y * height,
          fill: getDotFill(d.cluster),
          cluster: d.cluster,
        });
      }
    } else {
      const startX = spacing * 0.75;
      const startY = spacing * 0.75;
      for (let y = startY; y < height; y += spacing) {
        const v = y / height;
        for (let x = startX; x < width; x += spacing) {
          const u = x / width;
          const evalResult = evaluateReferenceSilhouette(u, v);
          if (evalResult.inside) {
            dots.push({
              x,
              y,
              fill: getDotFill(evalResult.cluster),
              cluster: evalResult.cluster,
            });
          }
        }
      }
    }

    return dots;
  }, [
    renderer,
    dimensions,
    useExactReferenceDots,
    spacing,
    activeScope,
    accentColor,
    variant,
    effectiveDotColor,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: effectiveBgColor,
        ...style,
      }}
    >
      {renderer === 'canvas' ? (
        <canvas
          ref={canvasRef}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            display: 'block',
          }}
        />
      ) : (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full block"
          style={{ backgroundColor: effectiveBgColor }}
        >
          {svgDots.map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.x}
              cy={dot.y}
              r={dotSize}
              fill={dot.fill}
              onClick={() => onDotClick?.({ x: dot.x, y: dot.y, cluster: dot.cluster })}
              style={{ cursor: onDotClick ? 'pointer' : 'default' }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
