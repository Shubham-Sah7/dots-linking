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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Smooth camera interpolation
      const cam = cameraRef.current;
      if (cam.isAnimating) {
        const ease = 0.14;
        cam.x += (cam.targetX - cam.x) * ease;
        cam.y += (cam.targetY - cam.y) * ease;
        cam.zoom += (cam.targetZoom - cam.zoom) * ease;

        if (
          Math.abs(cam.targetX - cam.x) < 0.4 &&
          Math.abs(cam.targetY - cam.y) < 0.4 &&
          Math.abs(cam.targetZoom - cam.zoom) < 0.003
        ) {
          cam.x = cam.targetX;
          cam.y = cam.targetY;
          cam.zoom = cam.targetZoom;
          cam.isAnimating = false;
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

      // Collect memory node positions for void exclusion (so text & icons remain 100% readable)
      const nodeVoids: Array<{ x: number; y: number; r: number }> = [];
      allMemories.forEach((m) => {
        if (m.x !== undefined && m.y !== undefined) {
          nodeVoids.push({ x: m.x, y: m.y, r: 42 });
        }
      });

      // Active scope cluster mapping for highlighting
      const activeScopeCluster = activeCustomer
        ? activeCustomer.id.includes('stark') || activeCustomer.name.toLowerCase().includes('stark')
          ? 'product'
          : activeCustomer.id.includes('cyber') || activeCustomer.name.toLowerCase().includes('cyber')
          ? 'engineering'
          : 'operations'
        : selectedMemory
        ? selectedMemory.customerName.toLowerCase().includes('stark')
          ? 'product'
          : selectedMemory.customerName.toLowerCase().includes('cyber')
          ? 'engineering'
          : 'operations'
        : null;

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

          // Dot Color formatting
          let dotFill = 'rgba(255, 255, 255, 0.35)';
          if (patternMode === 'reference') {
            dotFill = '#ffffff'; // Pure crisp white for reference mode
          } else {
            const isSelectedCluster = activeScopeCluster && evalResult.cluster === activeScopeCluster;
            if (isSelectedCluster) {
              dotFill = '#f26522'; // Maximem orange accent for selected memories / active scope
            } else if (evalResult.cluster === 'product') {
              dotFill = activeScopeCluster ? 'rgba(255, 255, 255, 0.14)' : 'rgba(242, 101, 34, 0.85)';
            } else if (evalResult.cluster === 'engineering') {
              dotFill = activeScopeCluster ? 'rgba(255, 255, 255, 0.14)' : 'rgba(96, 165, 250, 0.85)';
            } else if (evalResult.cluster === 'operations') {
              dotFill = activeScopeCluster ? 'rgba(255, 255, 255, 0.14)' : 'rgba(52, 211, 153, 0.85)';
            }
          }

          ctx.beginPath();
          ctx.arc(wx, wy, effectiveDotRadius, 0, Math.PI * 2);
          ctx.fillStyle = dotFill;
          ctx.fill();
        }
      }
      ctx.restore();

      // =========================================================================
      // 3. DRAW SCOPE REGIONS (Nested Spatial Territory Map, Zero Overlap)
      // =========================================================================

      // A. CLIENT SCOPE BOUNDARY (Root Level Territory)
      ctx.save();

      // Client Outer Territory Surface (Organic Rounded Boundary)
      drawRoundedRect(ctx, clientBounds.x, clientBounds.y, clientBounds.width, clientBounds.height, 24);
      ctx.fillStyle = patternMode === 'reference' ? 'transparent' : 'rgba(20, 20, 18, 0.45)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = patternMode === 'reference' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.09)';
      ctx.stroke();

      // Floating Territory Brand Badge (Top-Left Pill, No divider line)
      const clientBadgeW = Math.min(clientBounds.width - 40, 720);
      drawRoundedRect(ctx, clientBounds.x + 16, clientBounds.y + 12, clientBadgeW, 36, 10);
      ctx.fillStyle = 'rgba(26, 26, 24, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Client Brand Dot
      ctx.beginPath();
      ctx.arc(clientBounds.x + 32, clientBounds.y + 30, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f26522';
      ctx.fill();

      // Client Scope Title & Details
      ctx.font = 'bold 13.5px "Geist", var(--font-sans), system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(data.name.toUpperCase(), clientBounds.x + 44, clientBounds.y + 35);

      ctx.font = 'bold 9.5px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = '#f26522';
      ctx.fillText('ROOT CLIENT ENCLAVE', clientBounds.x + 295, clientBounds.y + 35);

      ctx.font = '10px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(
        `Multi-Tenant Isolation · ${data.totalMemories} Memories · ${data.totalScopes} Scopes`,
        clientBounds.x + 445,
        clientBounds.y + 35
      );

      // Client Global Memories Terrace (y: 56 to 175)
      const clientCorridor = {
        x: clientBounds.x + 20,
        y: clientBounds.y + 56,
        width: clientBounds.width - 40,
        height: 118,
      };
      drawRoundedRect(ctx, clientCorridor.x, clientCorridor.y, clientCorridor.width, clientCorridor.height, 14);
      ctx.fillStyle = patternMode === 'reference' ? 'transparent' : 'rgba(25, 25, 23, 0.35)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = patternMode === 'reference' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(242, 101, 34, 0.22)';
      ctx.stroke();

      // Terrace floating label
      ctx.font = 'bold 9.5px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = '#f26522';
      ctx.fillText('GLOBAL CLIENT-LEVEL MEMORIES (CROSS-TENANT INHERITANCE)', clientCorridor.x + 18, clientCorridor.y + 20);
      ctx.restore();

      // B. CUSTOMER SCOPE TERRITORIES
      data.customers.forEach((cust) => {
        const bounds = cust.bounds || { x: 50, y: 195, width: 645, height: 465 };
        const isHovered = hoveredScopeRef.current?.id === cust.id;
        const isSelected = activeCustomer?.id === cust.id;

        ctx.save();

        // Customer Territory Ambient Background Glow on selection/hover
        if (patternMode !== 'reference' && (isSelected || isHovered)) {
          const custGlow = ctx.createRadialGradient(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            40,
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            bounds.width * 0.55
          );
          custGlow.addColorStop(0, isSelected ? 'rgba(242, 101, 34, 0.10)' : 'rgba(242, 101, 34, 0.05)');
          custGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = custGlow;
          ctx.fillRect(bounds.x - 12, bounds.y - 12, bounds.width + 24, bounds.height + 24);
        }

        // Customer Territory Spatial Surface (No widget lines)
        drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 18);
        ctx.fillStyle = patternMode === 'reference'
          ? 'transparent'
          : isSelected
          ? 'rgba(242, 101, 34, 0.08)'
          : isHovered
          ? 'rgba(25, 25, 22, 0.45)'
          : 'rgba(24, 24, 21, 0.35)';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
        ctx.strokeStyle = isSelected
          ? '#f26522'
          : isHovered
          ? 'rgba(242, 101, 34, 0.5)'
          : patternMode === 'reference'
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Customer Floating Header Badge (Seamless pill at top)
        const headerPillW = Math.min(bounds.width - 24, bounds.width > 400 ? 460 : bounds.width - 24);
        drawRoundedRect(ctx, bounds.x + 12, bounds.y + 10, headerPillW, 30, 8);
        ctx.fillStyle = patternMode === 'reference' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(32, 32, 29, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Customer Name
        ctx.font = 'bold 12px "Geist", var(--font-sans), system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(cust.name, bounds.x + 22, bounds.y + 30);

        // Industry Scope Pill (inside pill)
        if (bounds.width > 340) {
          ctx.font = '9px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          const custIndustry = truncate(cust.industry.toUpperCase(), 18);
          ctx.fillText(`· ${custIndustry}`, bounds.x + 130, bounds.y + 30);
        }

        // Memory Count Tag on right inside header pill
        ctx.font = 'bold 9.5px "Geist Mono", var(--font-mono), monospace';
        ctx.fillStyle = '#f26522';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${cust.memoryCount} mems`,
          bounds.x + headerPillW,
          bounds.y + 30
        );
        ctx.textAlign = 'left';

        ctx.restore();

        // C. USER SCOPE ENCLAVES (Nested inside Customer Scope)
        cust.users.forEach((usr) => {
          const uBounds = usr.bounds || { x: bounds.x + 15, y: bounds.y + 90, width: 260, height: 350 };
          const isUserHovered = hoveredScopeRef.current?.id === usr.id;
          const isUserSelected = activeUser?.id === usr.id;

          ctx.save();
          // User Enclave Surface
          drawRoundedRect(ctx, uBounds.x, uBounds.y, uBounds.width, uBounds.height, 14);
          ctx.fillStyle = patternMode === 'reference'
            ? 'transparent'
            : isUserSelected
            ? 'rgba(32, 32, 28, 0.55)'
            : isUserHovered
            ? 'rgba(30, 30, 26, 0.45)'
            : 'rgba(29, 29, 26, 0.35)';
          ctx.fill();
          ctx.lineWidth = isUserSelected ? 2 : isUserHovered ? 1.5 : 1;
          ctx.strokeStyle = isUserSelected
            ? '#f26522'
            : isUserHovered
            ? 'rgba(242, 101, 34, 0.45)'
            : patternMode === 'reference'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(255, 255, 255, 0.07)';
          ctx.stroke();

          // User Enclave Floating Top Identity Tag
          drawRoundedRect(ctx, uBounds.x + 10, uBounds.y + 8, uBounds.width - 20, 26, 7);
          ctx.fillStyle = 'rgba(38, 38, 34, 0.6)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Avatar Pill
          ctx.beginPath();
          ctx.arc(uBounds.x + 22, uBounds.y + 21, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f26522';
          ctx.fill();
          ctx.font = 'bold 8.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(usr.avatar || 'U', uBounds.x + 22, uBounds.y + 24);
          ctx.textAlign = 'left';

          // User Name & Role
          ctx.font = 'bold 11px "Geist", var(--font-sans), system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(truncate(usr.name, 16), uBounds.x + 36, uBounds.y + 25);

          // Role (if width allows)
          if (uBounds.width > 240) {
            ctx.font = '9px "Geist Mono", var(--font-mono), monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillText(truncate(usr.role, 14), uBounds.x + 130, uBounds.y + 25);
          }

          ctx.font = 'bold 9.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = '#f26522';
          ctx.textAlign = 'right';
          ctx.fillText(`${usr.memories.length} mems`, uBounds.x + uBounds.width - 16, uBounds.y + 25);
          ctx.textAlign = 'left';

          ctx.restore();
        });
      });

      // =========================================================================
      // 4. DRAW RELATIONSHIP EDGES (With Directional Arrows & Traveling Photons)
      // =========================================================================
      allRelationships.forEach((rel) => {
        const sourceMem = findMemoryById(rel.sourceMemoryId, data);
        const targetMem = findMemoryById(rel.targetMemoryId, data);
        if (!sourceMem || !targetMem || sourceMem.x === undefined || sourceMem.y === undefined || targetMem.x === undefined || targetMem.y === undefined) return;

        const isIncident =
          selectedMemory &&
          (rel.sourceMemoryId === selectedMemory.id || rel.targetMemoryId === selectedMemory.id);
        const isDimmed = selectedMemory && !isIncident;

        const relInfo = RELATIONSHIP_METRICS[rel.type] || {
          label: rel.type,
          color: '#38bdf8',
          borderStyle: 'solid',
        };

        ctx.save();
        ctx.beginPath();

        // Curved Bezier curve between nodes
        const sx = sourceMem.x;
        const sy = sourceMem.y;
        const tx = targetMem.x;
        const ty = targetMem.y;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Curvature calculation
        const curvature = Math.min(dist * 0.14, 55);
        const midX = (sx + tx) / 2 - (dy / dist) * curvature;
        const midY = (sy + ty) / 2 + (dx / dist) * curvature;

        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(midX, midY, tx, ty);

        if (isIncident) {
          // Highlighted active edge
          ctx.strokeStyle = relInfo.color;
          ctx.lineWidth = 2.4;
          ctx.shadowColor = relInfo.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Traveling photon bead on selected edge!
          const photonProgress = (time * 0.75) % 1;
          const t = photonProgress;
          const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
          const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = relInfo.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Relationship Type Pill Label at curve midpoint
          ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
          const labelText = relInfo.label.toUpperCase();
          const textMetrics = ctx.measureText(labelText);
          const pillW = textMetrics.width + 12;
          const pillH = 16;

          // Pill Background
          drawRoundedRect(ctx, midX - pillW / 2, midY - pillH / 2 - 4, pillW, pillH, 4);
          ctx.fillStyle = 'rgba(20, 20, 19, 0.95)';
          ctx.fill();
          ctx.strokeStyle = relInfo.color;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pill Text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, midX, midY + 1);
          ctx.textAlign = 'left';
        } else {
          // Normal or dimmed edge
          const alpha = isDimmed ? 0.08 : 0.4;
          ctx.strokeStyle = hexToRgba(relInfo.color, alpha);
          ctx.lineWidth = 1.3;
          if (relInfo.borderStyle === 'dashed') {
            ctx.setLineDash([4, 4]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Directional Arrow Head at the target node
        const targetRadius = 7.5 + targetMem.importance * 1.8;
        const arrowDx = tx - midX;
        const arrowDy = ty - midY;
        const arrowLen = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);
        if (arrowLen > 0) {
          const arrowX = tx - (arrowDx / arrowLen) * (targetRadius + 2);
          const arrowY = ty - (arrowDy / arrowLen) * (targetRadius + 2);
          const angle = Math.atan2(arrowDy, arrowDx);
          const arrowSize = isIncident ? 6.5 : 4.5;

          ctx.fillStyle = isIncident ? relInfo.color : hexToRgba(relInfo.color, isDimmed ? 0.1 : 0.5);
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
      // 5. DRAW MEMORY NODES & CENTERED HIGH-CONTRAST LABELS
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

        const catInfo = CATEGORY_COLORS[mem.category] || { color: '#f26522' };
        const isSuperseded = mem.status === 'Superseded';

        // Radius scaled by importance: 11px to 18px
        const baseRadius = 10 + mem.importance * 1.6;
        const radius = isHovered ? baseRadius + 3.5 : baseRadius;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.14 : 1.0;

        // Ambient node glow on hover / selection
        if (isSelected || isHovered) {
          const glowRadius = radius * 3.6;
          const radial = ctx.createRadialGradient(mem.x, mem.y, radius * 0.4, mem.x, mem.y, glowRadius);
          radial.addColorStop(0, hexToRgba(catInfo.color, 0.7));
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        } else if (isConnected && selectedMemory) {
          // Connected related node subtle glow
          const glowRadius = radius * 2.4;
          const radial = ctx.createRadialGradient(mem.x, mem.y, radius * 0.4, mem.x, mem.y, glowRadius);
          radial.addColorStop(0, 'rgba(242, 101, 34, 0.4)');
          radial.addColorStop(1, 'transparent');
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Selected Pulsing Ring with Maximem Brand Orange
        if (isSelected) {
          const pulse = Math.sin(time * 4) * 4;
          ctx.strokeStyle = '#f26522';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, radius + 6 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isConnected && selectedMemory) {
          // Connected related node border ring
          ctx.strokeStyle = 'rgba(242, 101, 34, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(mem.x, mem.y, radius, 0, Math.PI * 2);

        if (isSuperseded) {
          // Superseded node: Muted center with dashed amber outline
          ctx.fillStyle = 'rgba(28, 28, 25, 0.95)';
          ctx.fill();
          ctx.setLineDash([3.5, 2.5]);
          ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.setLineDash([]);

          // Center amber core dot
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        } else {
          // Active node: Solid luminous core with category color
          ctx.fillStyle = catInfo.color;
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)';
          ctx.stroke();
        }

        // =====================================================================
        // HIGH-CONTRAST CAPSULE LABELS (100% LEGIBILITY AT NORMAL ZOOM)
        // =====================================================================
        if (isSelected || isHovered) {
          // Expanded Inspection Card Badge
          const titleText = truncate(mem.title, 34);
          ctx.font = 'bold 11.5px "Geist", var(--font-sans), sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          const badgeW = Math.max(titleWidth + 20, 100);
          const badgeH = 32;

          drawRoundedRect(ctx, mem.x - badgeW / 2, mem.y + radius + 5, badgeW, badgeH, 7);
          ctx.fillStyle = 'rgba(18, 18, 16, 0.98)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#f26522' : 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = isSelected ? 1.5 : 1;
          ctx.stroke();

          // Title
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, mem.x, mem.y + radius + 19);

          // Subtitle ID & Owner
          ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = isSuperseded ? '#f59e0b' : '#f26522';
          ctx.fillText(`${mem.id} · ${mem.ownerName}`, mem.x, mem.y + radius + 30);
        } else {
          // Crisp Capsule Pill behind normal node label
          const maxChars = mem.importance >= 4 ? 24 : 20;
          const titleText = truncate(mem.title, maxChars);
          ctx.font = 'bold 11px "Geist", var(--font-sans), sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          const pillW = titleWidth + 14;
          const pillH = 19;

          // Capsule pill backing
          drawRoundedRect(ctx, mem.x - pillW / 2, mem.y + radius + 4, pillW, pillH, 5);
          ctx.fillStyle = 'rgba(16, 16, 14, 0.92)';
          ctx.fill();
          ctx.strokeStyle = isConnected
            ? 'rgba(242, 101, 34, 0.5)'
            : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Title text
          ctx.fillStyle = isSuperseded ? '#f59e0b' : '#f4f4f5';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, mem.x, mem.y + radius + 17);
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

  // Find memory at world coordinate (covers both circle node and capsule pill)
  const hitTestMemory = useCallback(
    (worldX: number, worldY: number): MemoryItem | null => {
      for (const mem of allMemories) {
        if (mem.x === undefined || mem.y === undefined) continue;
        const dx = worldX - mem.x;
        const dy = worldY - mem.y;
        const baseRadius = 10 + mem.importance * 1.6;
        const hitRadius = Math.max(25, baseRadius + 10);
        if (
          dx * dx + dy * dy <= hitRadius * hitRadius ||
          (Math.abs(dx) <= 55 && dy >= 0 && dy <= baseRadius + 26)
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
      hasDraggedRef.current = true;
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
    lastMousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.currentTarget.style.cursor = 'grabbing';
  };

  // Mouse Up & Click Selection
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
      // Check if user clicked a customer scope header to focus it
      let hitScope = false;
      for (const cust of data.customers) {
        if (cust.bounds) {
          const b = cust.bounds;
          if (
            world.x >= b.x &&
            world.x <= b.x + b.width &&
            world.y >= b.y &&
            world.y <= b.y + 36
          ) {
            onSelectCustomer(cust);
            onSelectUser(null);
            hitScope = true;
            break;
          }
        }
      }
      if (!hitScope) {
        onSelectMemory(null);
      }
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const currentZoom = cameraRef.current.zoom;
    const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.35), 3.0);

    // Zoom centered on cursor position
    const worldBefore = screenToWorld(mouseX, mouseY);
    cameraRef.current.zoom = newZoom;
    cameraRef.current.x = mouseX - worldBefore.x * newZoom;
    cameraRef.current.y = mouseY - worldBefore.y * newZoom;
    cameraRef.current.targetX = cameraRef.current.x;
    cameraRef.current.targetY = cameraRef.current.y;
    cameraRef.current.targetZoom = newZoom;
    cameraRef.current.isAnimating = false;

    onZoomChange(newZoom);
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
                backgroundColor: `${CATEGORY_COLORS[tooltip.memory.category]?.color}22`,
                color: CATEGORY_COLORS[tooltip.memory.category]?.color,
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
            <span className="text-[#34d399]">
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

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}
