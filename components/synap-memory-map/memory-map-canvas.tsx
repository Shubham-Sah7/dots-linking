'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ClientScopeData,
  CustomerScope,
  UserScope,
  MemoryItem,
  EntityCategory,
} from './types';
import {
  CATEGORY_COLORS,
  RELATIONSHIP_METRICS,
  getAllMemories,
  getAllRelationships,
  findMemoryById,
} from './mock-data';
import { evaluateReferenceSilhouette } from './dotted-pattern/reference-data';

interface MemoryMapCanvasProps {
  data: ClientScopeData;
  activeCustomer: CustomerScope | null;
  activeUser: UserScope | null;
  selectedMemory: MemoryItem | null;
  categoryFilter: EntityCategory | null;
  statusFilter: 'All' | 'Active' | 'Superseded';
  onSelectCustomer: (customer: CustomerScope | null) => void;
  onSelectUser: (user: UserScope | null) => void;
  onSelectMemory: (memory: MemoryItem | null) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  cameraFocusTarget?: { x: number; y: number; zoom?: number; t?: number } | null;
  isDetailPanelOpen?: boolean;
  patternMode?: 'integrated' | 'reference';
  dotSize?: number;
  dotSpacing?: number;
}

export function MemoryMapCanvas({
  data,
  activeCustomer,
  activeUser,
  selectedMemory,
  categoryFilter,
  statusFilter,
  onSelectCustomer,
  onSelectUser,
  onSelectMemory,
  zoomLevel,
  onZoomChange,
  cameraFocusTarget,
  isDetailPanelOpen,
  patternMode = 'integrated',
  dotSize = 1.85,
  dotSpacing = 16,
}: MemoryMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan and camera state
  const cameraRef = useRef<{
    x: number;
    y: number;
    zoom: number;
    targetX: number;
    targetY: number;
    targetZoom: number;
    isAnimating: boolean;
  }>({
    x: 0,
    y: 0,
    zoom: 0.85,
    targetX: 0,
    targetY: 0,
    targetZoom: 0.85,
    isAnimating: false,
  });

  const timeRef = useRef(0);
  const lastNotifiedZoomRef = useRef(0.85);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredMemoryRef = useRef<MemoryItem | null>(null);
  const hoveredScopeRef = useRef<{ type: 'customer' | 'user'; id: string } | null>(null);

  // Tooltip state for React overlay
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    memory: MemoryItem | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    memory: null,
  });

  // Extract all memories and relationships
  const allMemories = useMemo(() => getAllMemories(data), [data]);
  const allRelationships = useMemo(() => getAllRelationships(data), [data]);

  // Connected memory IDs set for active selection
  const connectedMemoryIds = useMemo(() => {
    if (!selectedMemory) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedMemory.id);

    // Direct outgoing
    for (const rel of selectedMemory.relationships) {
      ids.add(rel.targetMemoryId);
    }
    // Direct incoming
    for (const m of allMemories) {
      for (const r of m.relationships) {
        if (r.targetMemoryId === selectedMemory.id) {
          ids.add(m.id);
        }
      }
    }
    return ids;
  }, [selectedMemory, allMemories]);

  // Function to calculate camera fit so graph occupies ~90% of container width/height
  const fitCameraToViewport = useCallback(
    (animate = true) => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      const clientBounds = data.bounds || { x: 30, y: 30, width: 1380, height: 650 };

      // Target ~90% width and ~94% height coverage so graph fills 85-90% of available canvas
      const targetW = w * 0.90;
      const targetH = h * 0.94;
      const scaleX = targetW / clientBounds.width;
      const scaleY = targetH / clientBounds.height;
      // Calculate fit zoom ensuring optimal coverage of the viewport
      const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 2.5);

      const centerX = clientBounds.x + clientBounds.width / 2;
      const centerY = clientBounds.y + clientBounds.height / 2;

      const targetX = w / 2 - centerX * fitZoom;
      const targetY = h / 2 - centerY * fitZoom;

      if (animate) {
        cameraRef.current.targetZoom = fitZoom;
        cameraRef.current.targetX = targetX;
        cameraRef.current.targetY = targetY;
        cameraRef.current.isAnimating = true;
      } else {
        cameraRef.current.x = targetX;
        cameraRef.current.y = targetY;
        cameraRef.current.zoom = fitZoom;
        cameraRef.current.targetX = targetX;
        cameraRef.current.targetY = targetY;
        cameraRef.current.targetZoom = fitZoom;
        cameraRef.current.isAnimating = false;
      }
      onZoomChange(fitZoom);
    },
    [data, onZoomChange]
  );

  // ResizeObserver: Automatically reflow and fit graph when container size changes
  // (e.g. when detail panel opens or closes)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const canvas = canvasRef.current;
          if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
          }
          // Smoothly reflow camera to fit the newly available viewport
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (selectedMemory && selectedMemory.x !== undefined && selectedMemory.y !== undefined) {
              const curZoom = cameraRef.current.zoom;
              cameraRef.current.targetX = width / 2 - selectedMemory.x * curZoom;
              cameraRef.current.targetY = height / 2 - selectedMemory.y * curZoom;
              cameraRef.current.isAnimating = true;
            } else {
              fitCameraToViewport(true);
            }
          }, 40);
        }
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [fitCameraToViewport, selectedMemory, isDetailPanelOpen]);

  // Initial camera fit on mount
  useEffect(() => {
    fitCameraToViewport(false);
  }, [fitCameraToViewport]);

  // Center camera on target if requested (user clicked a scope, memory jump, search result, or reset/fit view)
  useEffect(() => {
    if (cameraFocusTarget) {
      if (cameraFocusTarget.zoom === undefined) {
        fitCameraToViewport(true);
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newZoom = cameraFocusTarget.zoom;

      cameraRef.current.targetZoom = newZoom;
      cameraRef.current.targetX = w / 2 - cameraFocusTarget.x * newZoom;
      cameraRef.current.targetY = h / 2 - cameraFocusTarget.y * newZoom;
      cameraRef.current.isAnimating = true;
      onZoomChange(newZoom);
    }
  }, [cameraFocusTarget, fitCameraToViewport, onZoomChange]);

  // Handle external zoom changes from controls
  useEffect(() => {
    if (Math.abs(cameraRef.current.zoom - zoomLevel) > 0.02) {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const centerWorldX = (w / 2 - cameraRef.current.x) / cameraRef.current.zoom;
      const centerWorldY = (h / 2 - cameraRef.current.y) / cameraRef.current.zoom;

      cameraRef.current.targetZoom = zoomLevel;
      cameraRef.current.targetX = w / 2 - centerWorldX * zoomLevel;
      cameraRef.current.targetY = h / 2 - centerWorldY * zoomLevel;
      cameraRef.current.isAnimating = true;
    }
  }, [zoomLevel]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.016;
      timeRef.current = time;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Smooth camera interpolation with buttery easing
      const cam = cameraRef.current;
      if (cam.isAnimating) {
        const ease = 0.12;
        cam.x += (cam.targetX - cam.x) * ease;
        cam.y += (cam.targetY - cam.y) * ease;
        cam.zoom += (cam.targetZoom - cam.zoom) * ease;

        if (
          Math.abs(cam.targetX - cam.x) < 0.25 &&
          Math.abs(cam.targetY - cam.y) < 0.25 &&
          Math.abs(cam.targetZoom - cam.zoom) < 0.002
        ) {
          cam.x = cam.targetX;
          cam.y = cam.targetY;
          cam.zoom = cam.targetZoom;
          cam.isAnimating = false;
        }

        // Throttle onZoomChange so parent state doesn't re-render excessively
        if (Math.abs(lastNotifiedZoomRef.current - cam.zoom) > 0.025) {
          lastNotifiedZoomRef.current = cam.zoom;
          onZoomChangeRef.current(cam.zoom);
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Background Fill (#000000 for Reference Mode, #1B1B19 for Maximem Integrated Mode)
      if (patternMode === 'reference') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#1B1B19';
        ctx.fillRect(0, 0, width, height);

        // 2. Maximem Ambient Radial Glow centered around the camera focus
        const glowCenterX = width / 2;
        const glowCenterY = height / 2;
        const bgRadial = ctx.createRadialGradient(
          glowCenterX,
          glowCenterY,
          20,
          glowCenterX,
          glowCenterY,
          Math.max(width, height) * 0.75
        );
        bgRadial.addColorStop(0, 'rgba(242, 101, 34, 0.08)');
        bgRadial.addColorStop(0.35, 'rgba(242, 101, 34, 0.025)');
        bgRadial.addColorStop(0.7, 'rgba(20, 20, 19, 0)');
        bgRadial.addColorStop(1, 'rgba(10, 10, 9, 0.6)');
        ctx.fillStyle = bgRadial;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply camera transform for world coordinates
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // =========================================================================
      // 2.5 PROGRAMMATIC DOTTED SILHOUETTE PATTERN LAYER
      // =========================================================================
      // Reproduces the exact irregular curved silhouette from the reference image,
      // with stepped pixel-like boundary on the grid, preserving large left negative space.
      const clientBounds = data.bounds || { x: 30, y: 30, width: 1380, height: 650 };
      const effectiveSpacing = dotSpacing || 16;
      // Scale dot radius inversely with camera zoom so dots maintain crisp screen size (1.8 - 2.2px)
      const effectiveDotRadius = (dotSize || 2.0) / Math.max(0.55, Math.min(cam.zoom, 1.2));

      // Collect dynamic floating memory node positions for void exclusion (so text & icons remain 100% readable)
      const nodeVoids: Array<{ x: number; y: number; r: number }> = [];
      allMemories.forEach((m) => {
        if (m.x !== undefined && m.y !== undefined) {
          const pos = getNodeWorldPos(m, time);
          nodeVoids.push({ x: pos.x, y: pos.y, r: 42 });
        }
      });

      // Draw the crisp grid of small circular dots matching the reference silhouette
      ctx.save();
      const startX = clientBounds.x + 8;
      const endX = clientBounds.x + clientBounds.width - 8;
      const startY = clientBounds.y + 8;
      const endY = clientBounds.y + clientBounds.height - 8;

      for (let wy = startY; wy <= endY; wy += effectiveSpacing) {
        const v = (wy - clientBounds.y) / clientBounds.height;
        for (let wx = startX; wx <= endX; wx += effectiveSpacing) {
          const u = (wx - clientBounds.x) / clientBounds.width;

          const evalResult = evaluateReferenceSilhouette(u, v);
          if (!evalResult.inside) continue;

          // Inner voids check around memory nodes for crisp readability
          let inNodeVoid = false;
          for (let ni = 0; ni < nodeVoids.length; ni++) {
            const nv = nodeVoids[ni];
            const dx = wx - nv.x;
            const dy = wy - nv.y;
            if (dx * dx + dy * dy < nv.r * nv.r) {
              inNodeVoid = true;
              break;
            }
          }
          if (inNodeVoid) continue;

          // Dot Color formatting (Monochrome, subtle Maximem texture)
          let dotFill = 'rgba(255, 255, 255, 0.08)';
          if (patternMode === 'reference') {
            dotFill = '#ffffff'; // Pure crisp white for reference mode
          } else {
            // Subtle monochrome dotted pattern that never competes with data
            dotFill = 'rgba(255, 255, 255, 0.08)';
          }

          ctx.beginPath();
          ctx.arc(wx, wy, effectiveDotRadius, 0, Math.PI * 2);
          ctx.fillStyle = dotFill;
          ctx.fill();
        }
      }
      ctx.restore();

      // =========================================================================
      // 3. DRAW SCOPE REGIONS (Ownership Scope Territories)
      // =========================================================================

      // A. CLIENT SCOPE BOUNDARY (Root Level Territory)
      ctx.save();

      // Client Outer Territory Surface
      drawRoundedRect(ctx, clientBounds.x, clientBounds.y, clientBounds.width, clientBounds.height, 16);
      ctx.fillStyle = patternMode === 'reference' ? 'transparent' : 'rgba(20, 20, 18, 0.35)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = patternMode === 'reference' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.07)';
      ctx.stroke();

      // Integrated Client Scope Header
      const clientHeaderW = Math.min(clientBounds.width - 32, 680);
      drawRoundedRect(ctx, clientBounds.x + 16, clientBounds.y + 12, clientHeaderW, 30, 6);
      ctx.fillStyle = 'rgba(28, 28, 26, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Client Brand Accent Dot
      ctx.beginPath();
      ctx.arc(clientBounds.x + 30, clientBounds.y + 27, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f26522';
      ctx.fill();

      // Client Scope Title & Details
      ctx.font = 'bold 12px "Geist", var(--font-sans), system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(data.name.toUpperCase(), clientBounds.x + 42, clientBounds.y + 31);

      ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = '#f26522';
      ctx.fillText('ROOT CLIENT ENCLAVE', clientBounds.x + 280, clientBounds.y + 31);

      ctx.font = '9.5px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(
        `Multi-Tenant Isolation · ${data.totalMemories} Memories · ${data.totalScopes} Scopes`,
        clientBounds.x + 420,
        clientBounds.y + 31
      );

      // Client Global Memories Terrace (y: 52 to 170)
      const clientCorridor = {
        x: clientBounds.x + 16,
        y: clientBounds.y + 48,
        width: clientBounds.width - 32,
        height: 122,
      };
      drawRoundedRect(ctx, clientCorridor.x, clientCorridor.y, clientCorridor.width, clientCorridor.height, 10);
      ctx.fillStyle = patternMode === 'reference' ? 'transparent' : 'rgba(26, 26, 24, 0.25)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = patternMode === 'reference' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)';
      ctx.stroke();

      // Terrace label
      ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('GLOBAL CLIENT POLICIES (CROSS-TENANT INHERITANCE)', clientCorridor.x + 16, clientCorridor.y + 18);
      ctx.restore();

      // B. CUSTOMER SCOPE TERRITORIES
      data.customers.forEach((cust) => {
        const bounds = cust.bounds || { x: 50, y: 195, width: 645, height: 465 };
        const isHovered = hoveredScopeRef.current?.id === cust.id;
        const isSelected = activeCustomer?.id === cust.id;

        ctx.save();

        // Customer Territory Surface
        drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 12);
        ctx.fillStyle = patternMode === 'reference'
          ? 'transparent'
          : isSelected
          ? 'rgba(242, 101, 34, 0.04)'
          : isHovered
          ? 'rgba(28, 28, 26, 0.45)'
          : 'rgba(24, 24, 22, 0.35)';
        ctx.fill();
        ctx.lineWidth = isSelected ? 1.8 : isHovered ? 1.4 : 1;
        ctx.strokeStyle = isSelected
          ? '#f26522'
          : isHovered
          ? 'rgba(242, 101, 34, 0.4)'
          : patternMode === 'reference'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Integrated Header Bar
        const headerW = bounds.width - 20;
        drawRoundedRect(ctx, bounds.x + 10, bounds.y + 8, headerW, 26, 6);
        ctx.fillStyle = patternMode === 'reference' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(30, 30, 28, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Customer Name
        ctx.font = 'bold 11.5px "Geist", var(--font-sans), system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(cust.name, bounds.x + 20, bounds.y + 25);

        // Industry Scope
        if (bounds.width > 340) {
          ctx.font = '9px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          const custIndustry = truncate(cust.industry.toUpperCase(), 20);
          ctx.fillText(`· ${custIndustry}`, bounds.x + 125, bounds.y + 25);
        }

        // Memory Count Tag
        ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
        ctx.fillStyle = '#f26522';
        ctx.textAlign = 'right';
        ctx.fillText(`${cust.memoryCount} mems`, bounds.x + headerW, bounds.y + 25);
        ctx.textAlign = 'left';

        ctx.restore();

        // C. USER SCOPE ENCLAVES (Nested inside Customer Scope)
        cust.users.forEach((usr) => {
          const uBounds = usr.bounds || { x: bounds.x + 15, y: bounds.y + 90, width: 260, height: 350 };
          const isUserHovered = hoveredScopeRef.current?.id === usr.id;
          const isUserSelected = activeUser?.id === usr.id;

          ctx.save();
          // User Enclave Surface
          drawRoundedRect(ctx, uBounds.x, uBounds.y, uBounds.width, uBounds.height, 10);
          ctx.fillStyle = patternMode === 'reference'
            ? 'transparent'
            : isUserSelected
            ? 'rgba(34, 34, 30, 0.5)'
            : isUserHovered
            ? 'rgba(30, 30, 28, 0.4)'
            : 'rgba(26, 26, 24, 0.25)';
          ctx.fill();
          ctx.lineWidth = isUserSelected ? 1.6 : isUserHovered ? 1.2 : 1;
          ctx.strokeStyle = isUserSelected
            ? '#f26522'
            : isUserHovered
            ? 'rgba(242, 101, 34, 0.35)'
            : patternMode === 'reference'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.05)';
          ctx.stroke();

          // User Enclave Header Tag
          drawRoundedRect(ctx, uBounds.x + 8, uBounds.y + 6, uBounds.width - 16, 22, 5);
          ctx.fillStyle = 'rgba(34, 34, 32, 0.5)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // User Avatar Pip
          ctx.beginPath();
          ctx.arc(uBounds.x + 19, uBounds.y + 17, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#2e2e2a';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.font = 'bold 7.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(usr.avatar || 'U', uBounds.x + 19, uBounds.y + 20);
          ctx.textAlign = 'left';

          // User Name & Role
          ctx.font = 'bold 10.5px "Geist", var(--font-sans), system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(truncate(usr.name, 15), uBounds.x + 31, uBounds.y + 21);

          // Role (if width allows)
          if (uBounds.width > 240) {
            ctx.font = '8.5px "Geist Mono", var(--font-mono), monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(truncate(usr.role, 14), uBounds.x + 120, uBounds.y + 21);
          }

          ctx.font = 'bold 8.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = '#f26522';
          ctx.textAlign = 'right';
          ctx.fillText(`${usr.memories.length} mems`, uBounds.x + uBounds.width - 14, uBounds.y + 21);
          ctx.textAlign = 'left';

          ctx.restore();
        });
      });

      // =========================================================================
      // 4. DRAW RELATIONSHIP EDGES (Real Verified Relationships - Organic Cubic Bézier)
      // =========================================================================
      allRelationships.forEach((rel) => {
        const sourceMem = findMemoryById(rel.sourceMemoryId, data);
        const targetMem = findMemoryById(rel.targetMemoryId, data);
        if (
          !sourceMem ||
          !targetMem ||
          sourceMem.x === undefined ||
          sourceMem.y === undefined ||
          targetMem.x === undefined ||
          targetMem.y === undefined
        )
          return;

        const isIncident =
          selectedMemory &&
          (rel.sourceMemoryId === selectedMemory.id || rel.targetMemoryId === selectedMemory.id);
        const isDimmed = selectedMemory && !isIncident;

        const relInfo = RELATIONSHIP_METRICS[rel.type] || {
          label: rel.type,
          color: '#f26522',
          borderStyle: 'solid',
        };

        const sPos = getNodeWorldPos(sourceMem, time);
        const tPos = getNodeWorldPos(targetMem, time);
        const sx = sPos.x;
        const sy = sPos.y;
        const tx = tPos.x;
        const ty = tPos.y;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return;

        // Normal perpendicular vector for organic curve
        const nx = -dy / dist;
        const ny = dx / dist;

        // Deterministic offset seed so multiple curves between nodes or scopes never overlap
        let relSeed = 0;
        const relKey = `${rel.sourceMemoryId}::${rel.targetMemoryId}::${rel.type}`;
        for (let i = 0; i < relKey.length; i++) {
          relSeed = (relSeed * 29 + relKey.charCodeAt(i)) & 0xff;
        }
        const seedMod = (relSeed % 5) - 2; // -2, -1, 0, 1, 2

        // Curvature scales with distance and scope crossover
        const isCrossScope = sourceMem.scopeId !== targetMem.scopeId;
        const baseCurvature = isCrossScope ? Math.min(dist * 0.16, 52) : Math.min(dist * 0.11, 28);
        const curvature = baseCurvature + seedMod * 6;

        // Organic cubic Bézier control points
        const cp1x = sx + dx * 0.35 + nx * curvature;
        const cp1y = sy + dy * 0.35 + ny * curvature;
        const cp2x = sx + dx * 0.68 + nx * (curvature * 0.86);
        const cp2y = sy + dy * 0.68 + ny * (curvature * 0.86);

        // Parametric midpoint at t = 0.5
        const midX = 0.125 * sx + 0.375 * cp1x + 0.375 * cp2x + 0.125 * tx;
        const midY = 0.125 * sy + 0.375 * cp1y + 0.375 * cp2y + 0.125 * ty;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tx, ty);

        if (isIncident) {
          // Highlighted active edge in Maximem Orange
          ctx.strokeStyle = '#f26522';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Animated energy data pulse traveling along the curve
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 10]);
          ctx.lineDashOffset = -time * 26;
          ctx.stroke();
          ctx.setLineDash([]);

          // Relationship Type Label Badge at curve midpoint
          ctx.font = 'bold 8.5px "Geist Mono", var(--font-mono), monospace';
          const labelText = relInfo.label.toUpperCase();
          const textMetrics = ctx.measureText(labelText);
          const pillW = textMetrics.width + 10;
          const pillH = 15;

          // Pill Background
          drawRoundedRect(ctx, midX - pillW / 2, midY - pillH / 2 - 2, pillW, pillH, 4);
          ctx.fillStyle = '#181816';
          ctx.fill();
          ctx.strokeStyle = '#f26522';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pill Text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, midX, midY + 2);
          ctx.textAlign = 'left';
        } else {
          // Progressive zoom disclosure for inactive edges (clean overview, details on zoom)
          const zoomFactor = Math.min(Math.max((cam.zoom - 0.7) / 0.5, 0), 1);
          const edgeAlpha = isDimmed ? 0.025 : 0.06 + zoomFactor * 0.14;
          ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha})`;
          ctx.lineWidth = 1.2;
          if (relInfo.borderStyle === 'dashed') {
            ctx.setLineDash([3, 4]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Directional Arrow Head at target node along cubic tangent
        const zoomScale = Math.min(Math.max((cam.zoom - 0.55) / 0.5, 0.68), 1.0);
        const targetRadius = (8 + targetMem.importance * 1.5) * zoomScale;
        const arrowDx = tx - cp2x;
        const arrowDy = ty - cp2y;
        const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);
        if (arrowLen > 0) {
          const arrowX = tx - (arrowDx / arrowLen) * (targetRadius + 2);
          const arrowY = ty - (arrowDy / arrowLen) * (targetRadius + 2);
          const angle = Math.atan2(arrowDy, arrowDx);
          const arrowSize = isIncident ? 6 : 4;

          ctx.fillStyle = isIncident ? '#f26522' : `rgba(255, 255, 255, ${isDimmed ? 0.04 : 0.25})`;
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      // =========================================================================
      // 5. DRAW MEMORY NODES & SMART LABELS
      // =========================================================================
      allMemories.forEach((mem) => {
        if (mem.x === undefined || mem.y === undefined) return;

        // Filters
        if (categoryFilter && mem.category !== categoryFilter) return;
        if (statusFilter !== 'All' && mem.status !== statusFilter) return;

        const isSelected = selectedMemory?.id === mem.id;
        const isConnected = connectedMemoryIds.has(mem.id);
        const isHovered = hoveredMemoryRef.current?.id === mem.id;
        const isDimmed = selectedMemory && !isConnected && !isSelected;

        const catInfo = CATEGORY_COLORS[mem.category] || { color: '#a1a1aa' };
        const isSuperseded = mem.status === 'Superseded';

        // Dynamic harmonic floating position for breathing constellation effect
        const pos = getNodeWorldPos(mem, time);

        // Smooth radius scaling from macro dots to full interactive nodes
        const zoomScale = Math.min(Math.max((cam.zoom - 0.55) / 0.5, 0.68), 1.0);
        const baseRadius = (8 + mem.importance * 1.5) * zoomScale;
        const radius = isHovered ? baseRadius + 2.5 : baseRadius;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.14 : 1.0;

        // Selected Pulsing Ring with Maximem Brand Orange
        if (isSelected) {
          const pulse = Math.sin(time * 3) * 2.5;
          ctx.strokeStyle = '#f26522';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 5 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isConnected && selectedMemory) {
          // Connected related node border ring
          ctx.strokeStyle = 'rgba(242, 101, 34, 0.8)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

        if (isSelected) {
          // Selected: Solid Maximem Orange body with crisp white center core
          ctx.fillStyle = '#f26522';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center white core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else if (isSuperseded) {
          // Superseded: Dark body with dashed grey border & muted core
          ctx.fillStyle = '#1c1c1a';
          ctx.fill();
          ctx.setLineDash([3, 2]);
          ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          // Center muted core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#d97706';
          ctx.fill();
        } else {
          // Active node: Solid dark charcoal body with crisp silver border
          ctx.fillStyle = '#242422';
          ctx.fill();
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.strokeStyle = isHovered
            ? '#ffffff'
            : isConnected
            ? '#f26522'
            : 'rgba(255, 255, 255, 0.38)';
          ctx.stroke();

          // Center white core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Subtle discrete category pip
          ctx.beginPath();
          ctx.arc(pos.x + radius * 0.45, pos.y - radius * 0.45, 2, 0, Math.PI * 2);
          ctx.fillStyle = catInfo.color;
          ctx.fill();
        }

        // =====================================================================
        // SMART ADAPTIVE LABELS (Clear hierarchy, smooth progressive fade)
        // =====================================================================
        const isZoomedIn = cam.zoom >= 1.05;
        const labelFadeAlpha = Math.min(Math.max((cam.zoom - 0.85) / 0.3, 0), 1.0);
        const showLandmark = mem.importance >= 5 && cam.zoom >= 0.72;
        const shouldShowLabel = isSelected || isHovered || isZoomedIn || showLandmark;

        if (isSelected || isHovered) {
          // Expanded Inspection Card Badge
          const titleText = truncate(mem.title, 34);
          ctx.font = 'bold 11px "Geist", var(--font-sans), sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          const badgeW = Math.max(titleWidth + 18, 96);
          const badgeH = 30;

          drawRoundedRect(ctx, pos.x - badgeW / 2, pos.y + radius + 5, badgeW, badgeH, 6);
          ctx.fillStyle = 'rgba(18, 18, 16, 0.96)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#f26522' : 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Title
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, pos.x, pos.y + radius + 17);

          // Subtitle ID & Owner
          ctx.font = 'bold 8.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = isSuperseded ? '#d97706' : '#f26522';
          ctx.fillText(`${mem.id} · ${mem.ownerName}`, pos.x, pos.y + radius + 27);
        } else if (shouldShowLabel && (labelFadeAlpha > 0.05 || showLandmark)) {
          const effectiveAlpha = showLandmark && !isZoomedIn ? 0.75 : labelFadeAlpha;
          ctx.save();
          ctx.globalAlpha = (isDimmed ? 0.12 : 1.0) * effectiveAlpha;

          // Sleek compact label (clean, readable, progressive fade-in)
          const titleText = truncate(mem.title, isZoomedIn ? 24 : 18);
          ctx.font = '10px "Geist", var(--font-sans), sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          const pillW = titleWidth + 10;
          const pillH = 16;

          drawRoundedRect(ctx, pos.x - pillW / 2, pos.y + radius + 3, pillW, pillH, 4);
          ctx.fillStyle = 'rgba(18, 18, 16, 0.88)';
          ctx.fill();
          ctx.strokeStyle = isConnected
            ? 'rgba(242, 101, 34, 0.45)'
            : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Title text
          ctx.fillStyle = isSuperseded ? '#a1a1aa' : '#f4f4f5';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, pos.x, pos.y + radius + 14);
          ctx.restore();
        }

        ctx.restore();
      });

      ctx.restore(); // Restore camera translation
      ctx.restore(); // Restore dpr scale

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    data,
    allMemories,
    allRelationships,
    activeCustomer,
    activeUser,
    selectedMemory,
    connectedMemoryIds,
    categoryFilter,
    statusFilter,
    dotSize,
    dotSpacing,
    patternMode,
  ]);

  // Screen to World Coordinate Conversion
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const cam = cameraRef.current;
    return {
      x: (screenX - cam.x) / cam.zoom,
      y: (screenY - cam.y) / cam.zoom,
    };
  }, []);

  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Find memory at world coordinate (covers both circle node and label, accounting for organic floating)
  const hitTestMemory = useCallback(
    (worldX: number, worldY: number): MemoryItem | null => {
      const time = timeRef.current;
      for (const mem of allMemories) {
        if (mem.x === undefined || mem.y === undefined) continue;
        const pos = getNodeWorldPos(mem, time);
        const dx = worldX - pos.x;
        const dy = worldY - pos.y;
        const baseRadius = 8 + mem.importance * 1.5;
        const hitRadius = Math.max(22, baseRadius + 12);
        if (
          dx * dx + dy * dy <= hitRadius * hitRadius ||
          (Math.abs(dx) <= 60 && dy >= 0 && dy <= baseRadius + 24)
        ) {
          return mem;
        }
      }
      return null;
    },
    [allMemories]
  );

  // Mouse Move & Hover Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const totalDist = Math.hypot(
        mouseX - dragStartPosRef.current.x,
        mouseY - dragStartPosRef.current.y
      );
      if (totalDist > 4) {
        hasDraggedRef.current = true;
      }
      const dx = mouseX - lastMousePosRef.current.x;
      const dy = mouseY - lastMousePosRef.current.y;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      cameraRef.current.targetX = cameraRef.current.x;
      cameraRef.current.targetY = cameraRef.current.y;
      cameraRef.current.isAnimating = false;
      lastMousePosRef.current = { x: mouseX, y: mouseY };
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }

    const world = screenToWorld(mouseX, mouseY);
    const hitMem = hitTestMemory(world.x, world.y);

    if (hitMem) {
      hoveredMemoryRef.current = hitMem;
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        memory: hitMem,
      });
      e.currentTarget.style.cursor = 'pointer';
    } else {
      hoveredMemoryRef.current = null;
      setTooltip((prev) => ({ ...prev, visible: false }));
      e.currentTarget.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
    }
  };

  // Mouse Down for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    dragStartPosRef.current = { x: mouseX, y: mouseY };
    lastMousePosRef.current = { x: mouseX, y: mouseY };
    e.currentTarget.style.cursor = 'grabbing';
  };

  // Mouse Up & Click Selection (Scope & Memory Exploration)
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasDragMovement = hasDraggedRef.current;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    e.currentTarget.style.cursor = 'grab';

    if (wasDragMovement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);
    const hitMem = hitTestMemory(world.x, world.y);

    if (hitMem) {
      onSelectMemory(hitMem);
    } else {
      // Check if user clicked a user enclave or customer territory to focus into that scope
      let hitScope = false;
      // 1. Check nested user enclaves first
      for (const cust of data.customers) {
        for (const usr of cust.users) {
          if (usr.bounds) {
            const ub = usr.bounds;
            if (
              world.x >= ub.x &&
              world.x <= ub.x + ub.width &&
              world.y >= ub.y &&
              world.y <= ub.y + ub.height
            ) {
              onSelectCustomer(cust);
              onSelectUser(usr);
              hitScope = true;
              break;
            }
          }
        }
        if (hitScope) break;
      }

      // 2. If not user enclave, check customer scope territory
      if (!hitScope) {
        for (const cust of data.customers) {
          if (cust.bounds) {
            const b = cust.bounds;
            if (
              world.x >= b.x &&
              world.x <= b.x + b.width &&
              world.y >= b.y &&
              world.y <= b.y + b.height
            ) {
              onSelectCustomer(cust);
              onSelectUser(null);
              hitScope = true;
              break;
            }
          }
        }
      }

      if (!hitScope) {
        onSelectMemory(null);
      }
    }
  };

  // Double Click: Smooth Zoom-In centered on cursor
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);
    const hitMem = hitTestMemory(world.x, world.y);

    if (hitMem) {
      onSelectMemory(hitMem);
      return;
    }

    // Smoothly zoom in +35% centered on mouse position
    const currentTargetZoom = cameraRef.current.targetZoom;
    const newTargetZoom = Math.min(currentTargetZoom * 1.35, 2.8);
    const worldX = (mouseX - cameraRef.current.targetX) / currentTargetZoom;
    const worldY = (mouseY - cameraRef.current.targetY) / currentTargetZoom;

    cameraRef.current.targetZoom = newTargetZoom;
    cameraRef.current.targetX = mouseX - worldX * newTargetZoom;
    cameraRef.current.targetY = mouseY - worldY * newTargetZoom;
    cameraRef.current.isAnimating = true;
  };

  // Mouse Wheel Zoom: Silky smooth target interpolation preserving cursor world anchor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.86;
    const currentTargetZoom = cameraRef.current.targetZoom;
    const newTargetZoom = Math.min(Math.max(currentTargetZoom * zoomFactor, 0.38), 2.8);

    // Keep world coordinate under cursor stable:
    const worldX = (mouseX - cameraRef.current.targetX) / currentTargetZoom;
    const worldY = (mouseY - cameraRef.current.targetY) / currentTargetZoom;

    cameraRef.current.targetZoom = newTargetZoom;
    cameraRef.current.targetX = mouseX - worldX * newTargetZoom;
    cameraRef.current.targetY = mouseY - worldY * newTargetZoom;
    cameraRef.current.isAnimating = true;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full min-h-0 bg-[#1B1B19] overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Floating Hover Tooltip */}
      {tooltip.visible && tooltip.memory && (
        <div
          className="pointer-events-none fixed z-50 transform -translate-y-full -translate-x-1/2 mb-3 bg-[#141413]/95 backdrop-blur-[16px] border border-white/[0.14] rounded-[10px] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-white font-sans max-w-xs transition-opacity duration-150"
          style={{ left: tooltip.x, top: tooltip.y - 12 }}
        >
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span
              className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded tracking-wider"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: CATEGORY_COLORS[tooltip.memory.category]?.color || '#ffffff',
              }}
            >
              {tooltip.memory.category}
            </span>
            <span className="text-[10px] font-mono text-[#8e8e93]">
              {tooltip.memory.id}
            </span>
          </div>

          <h4 className="text-xs font-bold text-white leading-snug mb-1 font-sans">
            {tooltip.memory.title}
          </h4>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#a1a1aa] pt-1.5 border-t border-white/[0.08]">
            <span className="text-[#71717a]">Owner:</span>
            <span className="text-[#f26522] font-semibold">
              {tooltip.memory.ownerName}
            </span>
            <span className="text-[#71717a]">·</span>
            <span className="text-[#f26522]">
              {tooltip.memory.relationships.length} links
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  topOnly = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  if (topOnly) {
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  } else {
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.closePath();
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}

/**
 * Organic harmonic floating movement for memory nodes.
 * Creates a subtle living constellation feel without jitter.
 */
function getNodeFloat(memId: string, importance: number, time: number) {
  let seed = 0;
  for (let i = 0; i < memId.length; i++) {
    seed = (seed * 31 + memId.charCodeAt(i)) & 0xfff;
  }
  const speed = 0.52 + (importance % 3) * 0.08;
  const phaseX = (seed % 100) * 0.06;
  const phaseY = (seed % 97) * 0.07 + 1.2;
  return {
    floatX: Math.sin(time * speed + phaseX) * 1.35,
    floatY: Math.cos(time * (speed * 0.88) + phaseY) * 1.35,
  };
}

function getNodeWorldPos(mem: MemoryItem, time: number): { x: number; y: number } {
  if (mem.x === undefined || mem.y === undefined) return { x: 0, y: 0 };
  const { floatX, floatY } = getNodeFloat(mem.id, mem.importance, time);
  return { x: mem.x + floatX, y: mem.y + floatY };
}
