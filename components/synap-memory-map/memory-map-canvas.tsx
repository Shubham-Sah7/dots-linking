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
  cameraFocusTarget?: { x: number; y: number; zoom?: number } | null;
  isDetailPanelOpen?: boolean;
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

  // Function to calculate camera fit so graph occupies ~88% of container width/height
  const fitCameraToViewport = useCallback(
    (animate = true) => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      const clientBounds = data.bounds || { x: 30, y: 30, width: 1390, height: 650 };

      // Target ~88% width and ~86% height coverage
      const targetW = w * 0.88;
      const targetH = h * 0.86;
      const scaleX = targetW / clientBounds.width;
      const scaleY = targetH / clientBounds.height;
      const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 2.5);

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

  // Center camera on target if requested (user clicked a scope, memory jump, or search result)
  useEffect(() => {
    if (cameraFocusTarget) {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newZoom = cameraFocusTarget.zoom ?? 1.25;

      cameraRef.current.targetZoom = newZoom;
      cameraRef.current.targetX = w / 2 - cameraFocusTarget.x * newZoom;
      cameraRef.current.targetY = h / 2 - cameraFocusTarget.y * newZoom;
      cameraRef.current.isAnimating = true;
      onZoomChange(newZoom);
    }
  }, [cameraFocusTarget, onZoomChange]);

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

      // 1. Maximem Dark Obsidian Background (#1B1B19)
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

      // Subtle 32px Grid Dots aligned to camera
      ctx.save();
      const dotStep = 32 * cam.zoom;
      if (dotStep > 12) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        const startX = ((cam.x % dotStep) + dotStep) % dotStep;
        const startY = ((cam.y % dotStep) + dotStep) % dotStep;
        for (let x = startX; x < width; x += dotStep) {
          for (let y = startY; y < height; y += dotStep) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // Apply camera transform for world coordinates
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // =========================================================================
      // 3. DRAW SCOPE REGIONS (Nested Spatial Territory Map, Zero Overlap)
      // =========================================================================

      // A. CLIENT SCOPE BOUNDARY (Root Level Territory)
      const clientBounds = data.bounds || { x: 30, y: 30, width: 1390, height: 650 };
      ctx.save();

      // Client Outer Territory Surface
      drawRoundedRect(ctx, clientBounds.x, clientBounds.y, clientBounds.width, clientBounds.height, 22);
      ctx.fillStyle = 'rgba(22, 22, 20, 0.75)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Client Territory Header Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      drawRoundedRect(ctx, clientBounds.x, clientBounds.y, clientBounds.width, 44, 22, true);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(clientBounds.x, clientBounds.y + 44);
      ctx.lineTo(clientBounds.x + clientBounds.width, clientBounds.y + 44);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();

      // Client Scope Title & Details
      ctx.font = 'bold 13px "Geist", var(--font-sans), system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(data.name.toUpperCase(), clientBounds.x + 24, clientBounds.y + 28);

      ctx.font = 'bold 10px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = '#f26522';
      ctx.fillText('ROOT CLIENT ENCLAVE', clientBounds.x + 280, clientBounds.y + 28);

      ctx.font = '10px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(
        `Multi-Tenant Isolation · ${data.totalMemories} Memories · ${data.totalScopes} Scopes · 0 Leakage`,
        clientBounds.x + 460,
        clientBounds.y + 28
      );

      // Client Global Memories Corridor (y: 58 to 175)
      const clientCorridor = {
        x: clientBounds.x + 20,
        y: clientBounds.y + 54,
        width: clientBounds.width - 40,
        height: 120,
      };
      drawRoundedRect(ctx, clientCorridor.x, clientCorridor.y, clientCorridor.width, clientCorridor.height, 12);
      ctx.fillStyle = 'rgba(26, 26, 23, 0.6)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(242, 101, 34, 0.2)';
      ctx.stroke();

      ctx.font = 'bold 9px "Geist Mono", var(--font-mono), monospace';
      ctx.fillStyle = '#f26522';
      ctx.fillText('GLOBAL CLIENT MEMORIES (CROSS-TENANT INHERITANCE)', clientCorridor.x + 16, clientCorridor.y + 18);
      ctx.restore();

      // B. CUSTOMER SCOPE TERRITORIES
      data.customers.forEach((cust) => {
        const bounds = cust.bounds || { x: 50, y: 195, width: 645, height: 465 };
        const isHovered = hoveredScopeRef.current?.id === cust.id;
        const isSelected = activeCustomer?.id === cust.id;

        ctx.save();

        // Customer Territory Ambient Background Glow on selection/hover
        if (isSelected || isHovered) {
          const custGlow = ctx.createRadialGradient(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            40,
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            bounds.width * 0.55
          );
          custGlow.addColorStop(0, isSelected ? 'rgba(242, 101, 34, 0.09)' : 'rgba(242, 101, 34, 0.04)');
          custGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = custGlow;
          ctx.fillRect(bounds.x - 10, bounds.y - 10, bounds.width + 20, bounds.height + 20);
        }

        // Customer Territory Surface
        drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 16);
        ctx.fillStyle = 'rgba(24, 24, 22, 0.9)';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
        ctx.strokeStyle = isSelected
          ? 'rgba(242, 101, 34, 0.75)'
          : isHovered
          ? 'rgba(242, 101, 34, 0.4)'
          : 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Customer Header Zone (Height: 36px)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, 36, 16, true);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bounds.x, bounds.y + 36);
        ctx.lineTo(bounds.x + bounds.width, bounds.y + 36);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.stroke();

        // Customer Name
        ctx.font = 'bold 12px "Geist", var(--font-sans), system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(cust.name, bounds.x + 14, bounds.y + 23);

        // Industry Scope Pill (truncated if small)
        if (bounds.width > 340) {
          ctx.font = '10px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          const custIndustry = truncate(cust.industry.toUpperCase(), 24);
          ctx.fillText(`CUSTOMER SCOPE · ${custIndustry}`, bounds.x + 140, bounds.y + 23);
        }

        // Memory & User Counts
        ctx.fillStyle = '#f26522';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${cust.memoryCount} mems`,
          bounds.x + bounds.width - 14,
          bounds.y + 23
        );
        ctx.textAlign = 'left';

        // Org-wide Memories Sub-Header
        if (cust.customerLevelMemories.length > 0) {
          ctx.font = '9px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillText('TENANT-LEVEL POLICIES', bounds.x + 16, bounds.y + 50);
        }

        ctx.restore();

        // C. USER SCOPE ENCLAVES (Nested inside Customer Scope)
        cust.users.forEach((usr) => {
          const uBounds = usr.bounds || { x: bounds.x + 15, y: bounds.y + 90, width: 260, height: 350 };
          const isUserHovered = hoveredScopeRef.current?.id === usr.id;
          const isUserSelected = activeUser?.id === usr.id;

          ctx.save();
          drawRoundedRect(ctx, uBounds.x, uBounds.y, uBounds.width, uBounds.height, 12);
          ctx.fillStyle = 'rgba(30, 30, 27, 0.75)';
          ctx.fill();
          ctx.lineWidth = isUserSelected ? 2 : isUserHovered ? 1.5 : 1;
          ctx.strokeStyle = isUserSelected
            ? 'rgba(242, 101, 34, 0.75)'
            : isUserHovered
            ? 'rgba(242, 101, 34, 0.4)'
            : 'rgba(255, 255, 255, 0.07)';
          ctx.stroke();

          // User Header Bar (Height: 30px)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          drawRoundedRect(ctx, uBounds.x, uBounds.y, uBounds.width, 30, 12, true);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(uBounds.x, uBounds.y + 30);
          ctx.lineTo(uBounds.x + uBounds.width, uBounds.y + 30);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.stroke();

          // Avatar Pill
          ctx.beginPath();
          ctx.arc(uBounds.x + 16, uBounds.y + 15, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f26522';
          ctx.fill();
          ctx.font = 'bold 8.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(usr.avatar || 'U', uBounds.x + 16, uBounds.y + 18);
          ctx.textAlign = 'left';

          // User Name & Role
          ctx.font = 'bold 11px "Geist", var(--font-sans), system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(truncate(usr.name, 16), uBounds.x + 32, uBounds.y + 19);

          // Role (if width allows)
          if (uBounds.width > 240) {
            ctx.font = '9.5px "Geist Mono", var(--font-mono), monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillText(truncate(usr.role, 14), uBounds.x + 130, uBounds.y + 19);
          }

          ctx.fillStyle = '#f26522';
          ctx.textAlign = 'right';
          ctx.fillText(`${usr.memories.length} mems`, uBounds.x + uBounds.width - 10, uBounds.y + 19);
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

        // Radius scaled by importance: 7.5px to 16.5px
        const baseRadius = 7.5 + mem.importance * 1.8;
        const radius = isHovered ? baseRadius + 3 : baseRadius;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.18 : 1.0;

        // Ambient node glow on hover / selection
        if (isSelected || isHovered) {
          const glowRadius = radius * 3.4;
          const radial = ctx.createRadialGradient(mem.x, mem.y, radius * 0.4, mem.x, mem.y, glowRadius);
          radial.addColorStop(0, hexToRgba(catInfo.color, 0.65));
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
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, radius + 5 + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(mem.x, mem.y, radius, 0, Math.PI * 2);

        if (isSuperseded) {
          // Superseded node: Muted center with dashed amber outline
          ctx.fillStyle = 'rgba(28, 28, 25, 0.95)';
          ctx.fill();
          ctx.setLineDash([3, 2.5]);
          ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.setLineDash([]);

          // Center amber core dot
          ctx.beginPath();
          ctx.arc(mem.x, mem.y, radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        } else {
          // Active node: Solid luminous core with category color
          ctx.fillStyle = catInfo.color;
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
          ctx.stroke();
        }

        // =====================================================================
        // CENTERED HIGH-CONTRAST LABELS (ZERO COLLISION, 100% LEGIBILITY)
        // =====================================================================
        ctx.shadowColor = 'rgba(15, 15, 13, 0.95)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        if (isSelected || isHovered) {
          // Card badge behind label on select/hover
          const titleText = truncate(mem.title, 32);
          ctx.font = 'bold 10.5px "Geist", var(--font-sans), sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          const badgeW = Math.max(titleWidth + 16, 90);
          const badgeH = 28;

          drawRoundedRect(ctx, mem.x - badgeW / 2, mem.y + radius + 4, badgeW, badgeH, 6);
          ctx.fillStyle = 'rgba(18, 18, 16, 0.96)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#f26522' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Title
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, mem.x, mem.y + radius + 16);

          // Subtitle ID & Owner
          ctx.font = '8.5px "Geist Mono", var(--font-mono), monospace';
          ctx.fillStyle = isSuperseded ? '#f59e0b' : '#f26522';
          ctx.fillText(`${mem.id} · ${mem.ownerName}`, mem.x, mem.y + radius + 27);
        } else {
          // Clean centered title under the node
          ctx.font = 'bold 9.5px "Geist", var(--font-sans), sans-serif';
          ctx.fillStyle = isSuperseded ? 'rgba(245, 158, 11, 0.9)' : 'rgba(255, 255, 255, 0.92)';
          ctx.textAlign = 'center';
          const maxChars = mem.importance >= 4 ? 22 : 18;
          ctx.fillText(truncate(mem.title, maxChars), mem.x, mem.y + radius + 12);
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
  ]);

  // Screen to World Coordinate Conversion
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const cam = cameraRef.current;
    return {
      x: (screenX - cam.x) / cam.zoom,
      y: (screenY - cam.y) / cam.zoom,
    };
  }, []);

  // Find memory at world coordinate
  const hitTestMemory = useCallback(
    (worldX: number, worldY: number): MemoryItem | null => {
      for (const mem of allMemories) {
        if (mem.x === undefined || mem.y === undefined) continue;
        const dx = worldX - mem.x;
        const dy = worldY - mem.y;
        const hitRadius = Math.max(20, 9 + mem.importance * 2.2);
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
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
