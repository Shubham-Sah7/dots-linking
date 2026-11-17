'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { spaceSoundscape } from '@/lib/audio/space-soundscape';
import {
  MEMORY_NODES,
  AIMemoryNode,
  RelationshipType,
  MemoryConnection,
  MemoryCategory,
  getAllCategories,
  findShortestPath,
  GUIDED_TOUR_STOPS,
} from './hxlfed/memory-graph-data';
import {
  ArrowUp,
  ArrowDown,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Maximize2,
  Compass,
  Layers,
  Sparkles,
  HelpCircle,
  Filter,
  Route,
  ChevronRight,
} from 'lucide-react';

export type HxlfedTheme = 'night' | 'paper';
export type HxlfedLang = 'en' | 'zh' | 'ja' | 'ko';

interface HxlfedViewProps {
  className?: string;
  onNavigateToSynap?: () => void;
}

export function HxlfedView({ className = '', onNavigateToSynap }: HxlfedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Core Theme & Language
  const [theme, setTheme] = useState<HxlfedTheme>('night');
  const [lang, setLang] = useState<HxlfedLang>('en');
  const [currentTime, setCurrentTime] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Selection & Navigation State
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Controls & Toggles
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  // Path Discovery (Shortest Path between 2 nodes)
  const [pathFindingTarget, setPathFindingTarget] = useState<string | null>(null);
  const [isPathDiscoveryOpen, setIsPathDiscoveryOpen] = useState(false);

  // Camera Zoom Distance & Altitude Telemetry
  const [cameraDistance, setCameraDistance] = useState<number>(16.5);
  const [zoomAltitude, setZoomAltitude] = useState<number>(0);

  // Stable refs for 60-120fps WebGL render loop without unmounting
  const selectedMemoryIdRef = useRef<string | null>(null);
  const hoveredMemoryIdRef = useRef<string | null>(null);
  const liftRef = useRef<number>(0);
  const liftTargetRef = useRef<number>(0);
  const pulseTriggerRef = useRef<number>(-10);
  const isAutoRotatingRef = useRef<boolean>(true);
  const showLinesRef = useRef<boolean>(true);
  const activePathRef = useRef<string[] | null>(null);
  const categoryFilterRef = useRef<string>('ALL');

  // User Interactive Orbit & Pan state
  const userRotationRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const userPanRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Sync state to refs
  useEffect(() => {
    selectedMemoryIdRef.current = selectedMemoryId;
  }, [selectedMemoryId]);
  useEffect(() => {
    hoveredMemoryIdRef.current = hoveredMemoryId;
  }, [hoveredMemoryId]);
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);
  useEffect(() => {
    showLinesRef.current = showConstellationLines;
  }, [showConstellationLines]);
  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  // Stable DOM element refs for hardware-accelerated 60fps tracking without React re-renders
  const nodeDomRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const nodeScreensRef = useRef<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [zoomTier, setZoomTier] = useState<'overview' | 'medium' | 'close'>('overview');
  const zoomTierRef = useRef<'overview' | 'medium' | 'close'>('overview');

  // Active memory details (ONLY defined when explicitly selected)
  const activeMemory = useMemo(() => {
    return MEMORY_NODES.find((m) => m.id === selectedMemoryId) || null;
  }, [selectedMemoryId]);

  // Hovered memory preview
  const hoveredMemory = useMemo(() => {
    return MEMORY_NODES.find((m) => m.id === hoveredMemoryId) || null;
  }, [hoveredMemoryId]);

  // Directly connected memory IDs
  const connectedIds = useMemo(() => {
    if (!activeMemory) return new Set<string>();
    const ids = new Set<string>();
    activeMemory.connections.forEach((c) => ids.add(c.targetId));
    MEMORY_NODES.forEach((m) => {
      if (m.connections.some((c) => c.targetId === activeMemory.id)) {
        ids.add(m.id);
      }
    });
    return ids;
  }, [activeMemory]);

  // Computed shortest path if path discovery is engaged
  const discoveredPath = useMemo(() => {
    if (!selectedMemoryId || !pathFindingTarget) return null;
    return findShortestPath(selectedMemoryId, pathFindingTarget);
  }, [selectedMemoryId, pathFindingTarget]);

  useEffect(() => {
    activePathRef.current = discoveredPath;
  }, [discoveredPath]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return MEMORY_NODES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q) ||
        m.entities.some((e) => e.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Guided Tour Step Timer
  useEffect(() => {
    if (!isTourActive) return;
    const tourNodeId = GUIDED_TOUR_STOPS[tourIndex];
    if (tourNodeId) {
      setSelectedMemoryId(tourNodeId);
      spaceSoundscape.playNodePulse(1, 2);
    }

    const timer = setTimeout(() => {
      if (tourIndex < GUIDED_TOUR_STOPS.length - 1) {
        setTourIndex((prev) => prev + 1);
      } else {
        setIsTourActive(false);
      }
    }, 7500);

    return () => clearTimeout(timer);
  }, [isTourActive, tourIndex]);

  // Select a memory node and push to history
  const navigateToMemory = useCallback(
    (nodeId: string, addToHistory = true) => {
      if (addToHistory && selectedMemoryId && selectedMemoryId !== nodeId) {
        setHistoryStack((prev) => [...prev, selectedMemoryId]);
      }
      setSelectedMemoryId(nodeId);
      pulseTriggerRef.current = performance.now() / 1000;
      spaceSoundscape.playNodePulse(1, 3);
    },
    [selectedMemoryId]
  );

  // Return to previous view in history
  const navigateBack = useCallback(() => {
    if (historyStack.length > 0) {
      const previousId = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, -1));
      setSelectedMemoryId(previousId);
      spaceSoundscape.playGlideTransition();
    } else {
      setSelectedMemoryId(null);
      spaceSoundscape.playGlideTransition();
    }
  }, [historyStack]);

  // Fit graph to view (clears selection, resets pan and rotation)
  const fitGraphToView = useCallback(() => {
    setSelectedMemoryId(null);
    liftTargetRef.current = 0;
    userRotationRef.current.targetX = 0;
    userRotationRef.current.targetY = 0;
    userPanRef.current.targetX = 0;
    userPanRef.current.targetY = 0;
    spaceSoundscape.playGlideTransition();
  }, []);

  // ==============================================================
  // INTELLIGENT LABEL VISIBILITY & COLLISION AVOIDANCE
  // ==============================================================
  // Core Rule: ZERO labels by default! Reveal labels ONLY based on:
  // 1. Explicit hover on a point (single-line tooltip)
  // 2. Explicit selection of a point (selected + directly connected points)
  // 3. Medium zoom: only primary hub memories without collision
  // 4. Close zoom: nearby memories without collision
  const visibleLabelIds = useMemo(() => {
    const visible = new Set<string>();
    const occupiedBoxes: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const doesOverlap = (box: { x1: number; y1: number; x2: number; y2: number }) => {
      return occupiedBoxes.some(
        (b) => !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2)
      );
    };

    const labelWidth = 145;
    const labelHeight = 26;
    const padding = 12;

    // 1. Hovered node always gets an active label tooltip
    if (hoveredMemoryId) {
      visible.add(hoveredMemoryId);
      const pos = nodeScreensRef.current[hoveredMemoryId];
      if (pos) {
        occupiedBoxes.push({
          x1: pos.x - labelWidth / 2 - padding,
          y1: pos.y - labelHeight - padding,
          x2: pos.x + labelWidth / 2 + padding,
          y2: pos.y + padding,
        });
      }
    }

    // 2. Selected node always gets an active label + connected nodes without collision
    if (selectedMemoryId) {
      visible.add(selectedMemoryId);
      const pos = nodeScreensRef.current[selectedMemoryId];
      if (pos) {
        occupiedBoxes.push({
          x1: pos.x - labelWidth / 2 - padding,
          y1: pos.y - labelHeight - padding,
          x2: pos.x + labelWidth / 2 + padding,
          y2: pos.y + padding,
        });
      }

      // Connected nodes get labels if they do not collide
      connectedIds.forEach((targetId) => {
        const p = nodeScreensRef.current[targetId];
        if (!p) return;
        const box = {
          x1: p.x - labelWidth / 2 - padding,
          y1: p.y - labelHeight - padding,
          x2: p.x + labelWidth / 2 + padding,
          y2: p.y + padding,
        };
        if (!doesOverlap(box)) {
          visible.add(targetId);
          occupiedBoxes.push(box);
        }
      });
      // When a node is selected, keep unrelated nodes visually quiet (no additional labels)
      return visible;
    }

    // 3. ZOOM LEVEL OF DETAIL (LOD) when no node is selected:
    // Default view (orbit / zoomTier === 'overview'): ZERO labels visible!
    if (zoomTier === 'overview') {
      return visible;
    }

    const isCloseZoom = zoomTier === 'close';
    const screenCenter = {
      x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2,
      y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2,
    };

    // Sort candidate nodes by relevance and center-proximity
    const candidates = [...MEMORY_NODES].sort((a, b) => {
      if (!isCloseZoom) {
        // At medium zoom, prioritize hub nodes with more connections
        const diffConn = b.connections.length - a.connections.length;
        if (diffConn !== 0) return diffConn;
      }
      const pA = nodeScreensRef.current[a.id];
      const pB = nodeScreensRef.current[b.id];
      const distA = pA ? Math.hypot(pA.x - screenCenter.x, pA.y - screenCenter.y) : 9999;
      const distB = pB ? Math.hypot(pB.x - screenCenter.x, pB.y - screenCenter.y) : 9999;
      return distA - distB;
    });

    // Cap number of revealed labels based on zoom tier to prevent visual noise
    const maxLabels = isCloseZoom ? 8 : 3;
    let revealedCount = 0;

    for (const node of candidates) {
      if (revealedCount >= maxLabels) break;
      if (visible.has(node.id)) continue;
      const pos = nodeScreensRef.current[node.id];
      if (!pos) continue;
      const box = {
        x1: pos.x - labelWidth / 2 - padding,
        y1: pos.y - labelHeight - padding,
        x2: pos.x + labelWidth / 2 + padding,
        y2: pos.y + padding,
      };
      if (!doesOverlap(box)) {
        visible.add(node.id);
        occupiedBoxes.push(box);
        revealedCount++;
      }
    }

    return visible;
  }, [hoveredMemoryId, selectedMemoryId, connectedIds, zoomTier]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
        } else if (e.key === 'Enter' && searchResults.length > 0) {
          const target = searchResults[searchMatchIndex % searchResults.length];
          if (target) {
            navigateToMemory(target.id);
            setSearchMatchIndex((prev) => prev + 1);
          }
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (isPathDiscoveryOpen) {
            setIsPathDiscoveryOpen(false);
            setPathFindingTarget(null);
          } else if (showHelpModal) {
            setShowHelpModal(false);
          } else if (isTourActive) {
            setIsTourActive(false);
          } else if (selectedMemoryId) {
            setSelectedMemoryId(null);
            spaceSoundscape.playGlideTransition();
          } else {
            fitGraphToView();
          }
          break;

        case '+':
        case '=':
          liftTargetRef.current = Math.max(-1.0, liftTargetRef.current - 0.35);
          spaceSoundscape.playGlideTransition();
          break;

        case '-':
        case '_':
          liftTargetRef.current = Math.min(1.0, liftTargetRef.current + 0.35);
          spaceSoundscape.playGlideTransition();
          break;

        case '0':
        case 'f':
        case 'F':
          fitGraphToView();
          break;

        case ' ':
          e.preventDefault();
          setIsAutoRotating((prev) => !prev);
          break;

        case '/':
          e.preventDefault();
          setIsSearchOpen(true);
          break;

        case 'h':
        case 'H':
        case '?':
          setShowHelpModal((prev) => !prev);
          break;

        case 'ArrowLeft':
          if (activeMemory && activeMemory.connections.length > 0) {
            const currentIdx = activeMemory.connections.findIndex(
              (c) => c.targetId === selectedMemoryId
            );
            const prevIdx =
              (currentIdx - 1 + activeMemory.connections.length) % activeMemory.connections.length;
            navigateToMemory(activeMemory.connections[prevIdx].targetId);
          }
          break;

        case 'ArrowRight':
          if (activeMemory && activeMemory.connections.length > 0) {
            const currentIdx = activeMemory.connections.findIndex(
              (c) => c.targetId === selectedMemoryId
            );
            const nextIdx = (currentIdx + 1) % activeMemory.connections.length;
            navigateToMemory(activeMemory.connections[nextIdx].targetId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeMemory,
    selectedMemoryId,
    searchResults,
    searchMatchIndex,
    isTourActive,
    showHelpModal,
    isPathDiscoveryOpen,
    navigateToMemory,
    fitGraphToView,
  ]);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
    camera.position.set(0, 4.6, 16);
    camera.lookAt(0, 0.2, 0);

    // Keyframe anchors from hxlfed.com (Continuous Zoom Range)
    const camAnchors = {
      chart: { eye: new THREE.Vector3(0, 32, 4), look: new THREE.Vector3(0, 0, 0.4) }, // Overview
      orbit: { eye: new THREE.Vector3(0, 4.6, 16), look: new THREE.Vector3(0, 0.2, 0) }, // Default
      sea: { eye: new THREE.Vector3(0, -1.0, 9.6), look: new THREE.Vector3(0, 0.8, 0) }, // Close exploration
    };

    const camTarget = {
      pos: new THREE.Vector3(0, 4.6, 16),
      look: new THREE.Vector3(0, 0.2, 0),
    };

    // Parallax mouse tilt
    const mousePos = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Saturn axial tilt (approx 25 deg x, 12 deg z)
    const celestialGroup = new THREE.Group();
    celestialGroup.rotation.z = THREE.MathUtils.degToRad(12);
    celestialGroup.rotation.x = THREE.MathUtils.degToRad(25);
    worldGroup.add(celestialGroup);

    const isNight = theme === 'night';

    // Color definitions from hxlfed.com
    const colorInk = isNight ? new THREE.Color('#f0ece1') : new THREE.Color('#16161a');
    const colorGold = isNight ? new THREE.Color('#e8c88a') : new THREE.Color('#2b4cff');
    const colorDim = isNight ? new THREE.Color('#4a463d') : new THREE.Color('#8b887f');
    const colorPath = isNight ? new THREE.Color('#ff9f43') : new THREE.Color('#ff3838');

    // ==============================================================
    // 1. CENTRAL CELESTIAL CORE (Planetary Cloud Bands & Directional Sunlit Stippling)
    // ==============================================================
    const coreRadius = 1.38;
    const coreParticleCount = 14500;
    const corePositions = new Float32Array(coreParticleCount * 3);
    const coreColors = new Float32Array(coreParticleCount * 3);
    const coreSizes = new Float32Array(coreParticleCount);
    const coreLatitudes = new Float32Array(coreParticleCount);

    const baseColorA = isNight ? new THREE.Color('#ffffff') : new THREE.Color('#16161a');
    const baseColorB = isNight ? new THREE.Color('#e8c88a') : new THREE.Color('#444855');
    const shadowColor = isNight ? new THREE.Color('#070709') : new THREE.Color('#c5c2b8');
    const lightDir = new THREE.Vector3(-0.62, 0.46, 0.64).normalize();

    for (let i = 0; i < coreParticleCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / coreParticleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = coreRadius * Math.sin(phi) * Math.cos(theta);
      const y = coreRadius * Math.cos(phi);
      const z = coreRadius * Math.sin(phi) * Math.sin(theta);

      corePositions[i * 3] = x;
      corePositions[i * 3 + 1] = y;
      corePositions[i * 3 + 2] = z;
      coreLatitudes[i] = y;

      // Saturnian cloud bands + micro-striae
      const band1 = Math.sin(y * 18.0) * 0.35 + 0.65;
      const band2 = Math.sin(y * 46.0) * 0.20 + 0.80;
      const band3 = Math.sin(y * 94.0) * 0.12 + 0.88;
      const cloudFactor = band1 * band2 * band3;

      // Directional sunlit hemisphere illumination
      const normal = new THREE.Vector3(x, y, z).normalize();
      const nDotL = normal.dot(lightDir);
      const sunlit = Math.pow(Math.max(0.0, nDotL * 0.5 + 0.5), 1.75);

      // Limb rim Fresnel highlight
      const rim = Math.pow(1.0 - Math.abs(normal.z), 2.8) * 0.32;

      const col = new THREE.Color().lerpColors(baseColorB, baseColorA, cloudFactor);
      col.lerp(shadowColor, 1.0 - Math.min(1.0, sunlit * 1.35 + rim));

      coreColors[i * 3] = col.r;
      coreColors[i * 3 + 1] = col.g;
      coreColors[i * 3 + 2] = col.b;
      coreSizes[i] = Math.random() * 0.020 + 0.014;
    }

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    coreGeo.setAttribute('color', new THREE.BufferAttribute(coreColors, 3));
    coreGeo.setAttribute('size', new THREE.BufferAttribute(coreSizes, 1));
    coreGeo.setAttribute('latitude', new THREE.BufferAttribute(coreLatitudes, 1));

    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: dpr },
        uOp: { value: isNight ? 1.0 : 0.82 },
      },
      vertexShader: `
        attribute float size;
        attribute float latitude;
        uniform float uTime;
        uniform float uDpr;
        uniform float uOp;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          float breathe = sin(uTime * 0.6 + latitude * 4.0) * 0.008;
          vec3 pos = position * (1.0 + breathe);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uDpr * clamp(size * (290.0 / -mvPosition.z), 1.2, 3.4);
          vAlpha = uOp * clamp(1.0 - (-mvPosition.z - 8.0) / 18.0, 0.35, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float g = smoothstep(0.5, 0.04, dist);
          gl_FragColor = vec4(vColor, g * vAlpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const coreMesh = new THREE.Points(coreGeo, coreMat);
    celestialGroup.add(coreMesh);

    // ==============================================================
    // 2. KEPLERIAN DUAL SPIRAL ARMS & CONCENTRIC GUIDE TRACKS (hxlfed.com)
    // ==============================================================
    const ringInnerRadius = 1.76;
    const ringOuterRadius = 5.15;
    const ringParticleCount = 28000;

    const ringPositions = new Float32Array(ringParticleCount * 3);
    const ringSeeds = new Float32Array(ringParticleCount);
    const ringSweeps = new Float32Array(ringParticleCount);

    const guideTracks = [2.08, 2.62, 3.14, 3.78, 4.48, 4.92];

    for (let i = 0; i < ringParticleCount; i++) {
      let r: number;
      let theta: number;
      let tilt: number;
      let isGuide = false;

      // 22% of particles create crisp dotted astronomical guide rings
      if (i < ringParticleCount * 0.22) {
        isGuide = true;
        const trackRadius = guideTracks[i % guideTracks.length];
        r = trackRadius + (Math.random() - 0.5) * 0.018;
        const steps = 128;
        const stepIdx = Math.floor(Math.random() * steps);
        theta = (stepIdx / steps) * Math.PI * 2 + (Math.random() - 0.5) * 0.008;
        tilt = (Math.random() - 0.5) * 0.008;
      } else {
        // 78% form two sweeping logarithmic spiral dust arms with Cassini division gaps
        const rNorm = Math.pow(Math.random(), 0.88);
        r = THREE.MathUtils.lerp(ringInnerRadius, ringOuterRadius, rNorm);

        // Cassini Division (dark ring gaps)
        if (r > 3.20 && r < 3.44) {
          r = Math.random() < 0.5 ? 3.16 - Math.random() * 0.06 : 3.48 + Math.random() * 0.06;
        }
        if (r > 4.22 && r < 4.32) {
          r = 4.34 + Math.random() * 0.05;
        }

        // Two primary logarithmic spiral arms
        const armPhase = Math.random() < 0.5 ? 0.0 : Math.PI;
        const spiralTheta = 3.65 * Math.log(Math.max(1.0, r / ringInnerRadius)) + armPhase;
        const dispersion = (Math.random() - 0.5) * (0.24 + 0.14 * rNorm);
        theta = spiralTheta + dispersion;

        // Subtle vertical wave undulation
        tilt = Math.sin(r * 2.6 + theta * 2.0) * 0.038 + (Math.random() - 0.5) * 0.022;
      }

      ringPositions[i * 3] = r;
      ringPositions[i * 3 + 1] = theta;
      ringPositions[i * 3 + 2] = tilt;

      ringSeeds[i] = Math.random();
      ringSweeps[i] = isGuide ? 1.4 : Math.random() < 0.28 ? 1.0 : 0.42;
    }

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('sd', new THREE.BufferAttribute(ringSeeds, 1));
    ringGeo.setAttribute('uSweepAttr', new THREE.BufferAttribute(ringSweeps, 1));

    const ringUniforms = {
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uOp: { value: isNight ? 0.88 : 0.72 },
      uInk: { value: colorInk },
      uGold: { value: colorGold },
      uGlow: { value: 0 },
      uHead: { value: 0 },
      uPulse: { value: -10 },
      uHotRadius: { value: -1 },
    };

    const ringMat = new THREE.ShaderMaterial({
      uniforms: ringUniforms,
      vertexShader: `
        attribute float sd;
        attribute float uSweepAttr;
        uniform float uTime;
        uniform float uDpr;
        uniform float uOp;
        uniform float uGlow;
        uniform float uHead;
        uniform float uPulse;
        uniform float uHotRadius;
        varying float vA;
        varying float vG;

        void main() {
          float r = position.x;
          float w = 0.85 / pow(r, 1.45);
          float a = position.y + uTime * w;

          float lead = mod(uTime * w * 2.2 + float(r) * 1.7 - a, 6.2831853);
          float sweep = uSweepAttr * exp(-lead * 0.8) * 1.8;

          float ringPulse = uSweepAttr * exp(-pow((uTime - uPulse) * 1.3 - (r - 3.2) * 0.5, 2.0) * 4.0) * step(0.0, uTime - uPulse) * 2.5;

          float isHotRing = abs(r - uHotRadius) < 0.28 ? 1.0 : 0.0;
          float behind = mod(uHead - a, 6.2831853);
          float run = isHotRing * exp(-behind * 2.2) * uGlow;

          vec2 xz = vec2(cos(a), sin(a)) * r;
          vec3 p = vec3(xz.x, position.z + sin(uTime * 0.5 + a * 2.0) * 0.015, xz.y);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + sd) + sd * 45.0);
          float boost = 1.0 + (uGlow * isHotRing * 2.5) + (run * 5.2) + (sweep * 0.85) + ringPulse;
          vA = uOp * twinkle * boost;
          vG = max(max(uGlow * isHotRing * 0.85, run), ringPulse * 0.45);

          gl_PointSize = uDpr * (1.2 + sd * 1.0 + uGlow * isHotRing * 1.2 + run * 2.0) * clamp(18.0 / -mv.z, 0.7, 2.2);
        }
      `,
      fragmentShader: `
        uniform vec3 uInk;
        uniform vec3 uGold;
        varying float vA;
        varying float vG;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float g = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(mix(uInk, uGold, vG * 0.88) * g * vA, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const ringMesh = new THREE.Points(ringGeo, ringMat);
    celestialGroup.add(ringMesh);

    // ==============================================================
    // 3. AMBIENT COSMIC MOTES
    // ==============================================================
    const moteCount = 2800;
    const moteBuffer = new Float32Array(moteCount * 4);
    for (let m = 0; m < moteCount; m++) {
      moteBuffer[m * 4] = (Math.random() - 0.5) * 2;
      moteBuffer[m * 4 + 1] = Math.random();
      moteBuffer[m * 4 + 2] = Math.random();
      moteBuffer[m * 4 + 3] = Math.random();
    }

    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(moteCount * 3), 3));
    moteGeo.setAttribute('mote', new THREE.BufferAttribute(moteBuffer, 4));

    const moteUniforms = {
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uInk: { value: colorInk },
      uRush: { value: 0 },
      uEye: { value: new THREE.Vector3() },
      uFwd: { value: new THREE.Vector3(0, 0, -1) },
      uRight: { value: new THREE.Vector3(1, 0, 0) },
    };

    const moteMat = new THREE.ShaderMaterial({
      uniforms: moteUniforms,
      vertexShader: `
        attribute vec4 mote;
        uniform float uTime;
        uniform float uDpr;
        uniform float uRush;
        uniform vec3 uEye;
        uniform vec3 uFwd;
        uniform vec3 uRight;
        varying float vA;
        varying float vStreak;

        void main() {
          float dist = 2.0 + mote.z * 22.0;
          float hh = dist * 0.32;
          float x = mote.x * hh * 1.8 + sin(uTime * 0.2 + mote.w * 20.0) * 0.08;
          float y = fract(mote.y + uTime * 0.008 * (1.0 + mote.w)) * 2.0 - 1.0;
          vec3 p = uEye + uRight * x + vec3(0.0, y * hh, 0.0) + uFwd * dist;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);

          float tw = 0.6 + 0.4 * sin(uTime * (0.6 + mote.w) + mote.x * 40.0);
          vA = tw * (0.25 + 0.6 * (1.0 - mote.z)) * smoothstep(1.0, 0.7, abs(y)) * (1.0 + uRush * 1.5);
          vStreak = 1.0 + uRush * 12.0 * (1.0 - mote.z);
          gl_PointSize = max(1.0, uDpr * (1.8 - mote.z * 1.1) * mix(1.0, 3.2, min(uRush, 1.0)));
        }
      `,
      fragmentShader: `
        uniform vec3 uInk;
        varying float vA;
        varying float vStreak;

        void main() {
          vec2 q = (gl_PointCoord - 0.5) * vec2(vStreak, 1.0);
          float g = smoothstep(0.5, 0.0, length(q));
          gl_FragColor = vec4(uInk * g * vA * 0.45, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const moteMesh = new THREE.Points(moteGeo, moteMat);
    scene.add(moteMesh);

    // ==============================================================
    // 4. MEMORY NODE BEACONS WITH STAR DIFFRACTION SPIKES
    // ==============================================================
    const nodeCount = MEMORY_NODES.length;
    const nodeBeaconPositions = new Float32Array(nodeCount * 3);
    const nodeBeaconHot = new Float32Array(nodeCount);

    const nodeBeaconGeo = new THREE.BufferGeometry();
    nodeBeaconGeo.setAttribute('position', new THREE.BufferAttribute(nodeBeaconPositions, 3));
    nodeBeaconGeo.setAttribute('uHot', new THREE.BufferAttribute(nodeBeaconHot, 1));

    const nodeBeaconUniforms = {
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uGold: { value: colorGold },
      uInk: { value: colorInk },
    };

    const nodeBeaconMat = new THREE.ShaderMaterial({
      uniforms: nodeBeaconUniforms,
      vertexShader: `
        attribute float uHot;
        uniform float uTime;
        uniform float uDpr;
        varying float vHot;
        varying float vA;

        void main() {
          vHot = uHot;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vA = 0.85 + 0.15 * sin(uTime * 2.5 + position.x * 4.0);
          gl_PointSize = uDpr * (18.0 + uHot * 18.0) * clamp(18.0 / -mv.z, 0.7, 1.8);
        }
      `,
      fragmentShader: `
        uniform vec3 uGold;
        uniform vec3 uInk;
        varying float vHot;
        varying float vA;

        float star(vec2 c) {
          float d = length(c);
          float core = exp(-d * d * 190.0);
          float halo = exp(-d * 14.0) * 0.08;
          float sx = exp(-abs(c.y) * 110.0) * exp(-abs(c.x) * 8.0);
          float sy = exp(-abs(c.x) * 110.0) * exp(-abs(c.y) * 8.0);
          return core + halo + (sx + sy) * 0.28;
        }

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float s = star(c);
          vec3 col = mix(uInk, uGold, 0.65 + vHot * 0.35);
          gl_FragColor = vec4(col * s * vA, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const nodeBeaconMesh = new THREE.Points(nodeBeaconGeo, nodeBeaconMat);
    celestialGroup.add(nodeBeaconMesh);

    // ==============================================================
    // 5. CONSTELLATION RELATIONSHIP LINES & PULSES
    // ==============================================================
    const MAX_EDGES = 60;
    const POINTS_PER_EDGE = 24;
    const totalLinePoints = MAX_EDGES * POINTS_PER_EDGE;

    const linePositions = new Float32Array(totalLinePoints * 3);
    const lineColors = new Float32Array(totalLinePoints * 3);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isNight ? 0.75 : 0.65,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
      linewidth: 1.2,
    });

    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    celestialGroup.add(lineMesh);

    const PULSE_COUNT = 40;
    const pulsePositions = new Float32Array(PULSE_COUNT * 3);
    const pulseColors = new Float32Array(PULSE_COUNT * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseColors, 3));

    const pulseMat = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: isNight ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthTest: false,
    });

    const pulseMesh = new THREE.Points(pulseGeo, pulseMat);
    celestialGroup.add(pulseMesh);

    // ==============================================================
    // DRAG, ORBIT & PAN CONTROLS
    // ==============================================================
    let isMouseDown = false;
    let isPanning = false;
    let mouseDownPos = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    let hasDraggedBeyondThreshold = false;

    const handlePointerDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('button, input, [role="button"]')) {
        return;
      }
      isMouseDown = true;
      isPanning = e.button === 2 || e.shiftKey || e.button === 1;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      lastMousePos = { x: e.clientX, y: e.clientY };
      hasDraggedBeyondThreshold = false;
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.targetX = nx * 0.45;
      mousePos.targetY = ny * 0.35;

      if (!isMouseDown) return;

      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      lastMousePos = { x: e.clientX, y: e.clientY };

      const totalDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (totalDist > 5) {
        hasDraggedBeyondThreshold = true;
      }

      if (isPanning) {
        userPanRef.current.targetX += dx * 0.012;
        userPanRef.current.targetY -= dy * 0.012;
      } else {
        userRotationRef.current.targetY += dx * 0.007;
        userRotationRef.current.targetX += dy * 0.005;
      }
    };

    const handlePointerUp = () => {
      isMouseDown = false;
      isPanning = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Wheel listener: smooth continuous zoom in / out
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 80) * 0.0035;
      const newLift = Math.max(-1.0, Math.min(1.0, liftTargetRef.current - delta * 2.8));
      liftTargetRef.current = newLift;

      if (Math.abs(newLift) > 0.45 && selectedMemoryIdRef.current) {
        setSelectedMemoryId(null);
      }
    };

    // Canvas click: trigger shockwave pulse if not dragging
    const handleCanvasClick = (e: MouseEvent) => {
      if (hasDraggedBeyondThreshold) return;
      pulseTriggerRef.current = performance.now() / 1000;
      spaceSoundscape.playNodePulse(0, 0);
    };

    const handleResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const newDpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(newDpr);
      coreMat.uniforms.uDpr.value = newDpr;
      ringMat.uniforms.uDpr.value = newDpr;
      moteMat.uniforms.uDpr.value = newDpr;
      nodeBeaconMat.uniforms.uDpr.value = newDpr;
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', handleResize);

    // ==============================================================
    // MAIN RENDER LOOP (60-120 FPS)
    // ==============================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    const node3DPositions: Record<string, THREE.Vector3> = {};

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse parallax interpolation
      mousePos.x += (mousePos.targetX - mousePos.x) * 0.055;
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.055;

      // Smooth user orbit & pan interpolation
      userRotationRef.current.x +=
        (userRotationRef.current.targetX - userRotationRef.current.x) * 0.09;
      userRotationRef.current.y +=
        (userRotationRef.current.targetY - userRotationRef.current.y) * 0.09;
      userPanRef.current.x += (userPanRef.current.targetX - userPanRef.current.x) * 0.09;
      userPanRef.current.y += (userPanRef.current.targetY - userPanRef.current.y) * 0.09;

      worldGroup.rotation.y = mousePos.x * 0.28 + userRotationRef.current.y;
      worldGroup.rotation.x = -mousePos.y * 0.22 + userRotationRef.current.x;

      worldGroup.position.x = userPanRef.current.x;
      worldGroup.position.y = userPanRef.current.y;

      // Smooth continuous lift zoom interpolation (-1.0 to +1.0)
      liftRef.current += (liftTargetRef.current - liftRef.current) * 0.085;
      const currentLift = liftRef.current;
      setZoomAltitude(currentLift);

      // Auto rotation if enabled
      if (isAutoRotatingRef.current) {
        celestialGroup.rotation.y += 0.0035;
      }

      // Update shader uniforms
      coreMat.uniforms.uTime.value = time;
      ringMat.uniforms.uTime.value = time;
      ringMat.uniforms.uPulse.value = pulseTriggerRef.current;
      moteMat.uniforms.uTime.value = time;
      nodeBeaconMat.uniforms.uTime.value = time;

      moteMat.uniforms.uEye.value.copy(camera.position);
      camera.getWorldDirection(moteMat.uniforms.uFwd.value);
      moteMat.uniforms.uRight.value
        .crossVectors(moteMat.uniforms.uFwd.value, new THREE.Vector3(0, 1, 0))
        .normalize();

      // Update Node positions & beacons
      const activeId = selectedMemoryIdRef.current || hoveredMemoryIdRef.current;
      const currentFilter = categoryFilterRef.current;
      const currentPath = activePathRef.current;
      let activeHotRadius = -1;
      let activeHeadAngle = 0;

      MEMORY_NODES.forEach((node, idx) => {
        const currentAngle = node.baseAngle + (isAutoRotatingRef.current ? time * node.orbitSpeed : 0);
        const x = node.orbitRadius * Math.cos(currentAngle);
        const z = node.orbitRadius * Math.sin(currentAngle);
        const y = node.tilt;

        node3DPositions[node.id] = new THREE.Vector3(x, y, z);
        nodeBeaconPositions[idx * 3] = x;
        nodeBeaconPositions[idx * 3 + 1] = y;
        nodeBeaconPositions[idx * 3 + 2] = z;

        const isFiltered = currentFilter === 'ALL' || node.category === currentFilter;
        const isHot = (node.id === activeId || (currentPath && currentPath.includes(node.id))) && isFiltered;
        nodeBeaconHot[idx] = isHot ? 1.0 : 0.0;

        if (node.id === activeId) {
          activeHotRadius = node.orbitRadius;
          activeHeadAngle = currentAngle;
        }
      });

      (nodeBeaconGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (nodeBeaconGeo.attributes.uHot as THREE.BufferAttribute).needsUpdate = true;

      // Ring glow run
      const targetGlow = activeId ? 1.0 : 0.0;
      ringMat.uniforms.uGlow.value += (targetGlow - ringMat.uniforms.uGlow.value) * 0.1;
      ringMat.uniforms.uHead.value = activeHeadAngle;
      ringMat.uniforms.uHotRadius.value = activeHotRadius;

      // Dynamic Constellation Edges
      let lineIndex = 0;
      let pulseIdx = 0;

      const activeColor = isNight ? new THREE.Color('#e8c88a') : new THREE.Color('#2b4cff');
      const dimmedColor = isNight ? new THREE.Color('#38352e') : new THREE.Color('#cdc8bc');
      const ghostColor = isNight ? new THREE.Color('#141416') : new THREE.Color('#e0ded6');

      if (showLinesRef.current) {
        MEMORY_NODES.forEach((sourceNode) => {
          const p1 = node3DPositions[sourceNode.id];
          if (!p1) return;

          sourceNode.connections.forEach((conn) => {
            const p2 = node3DPositions[conn.targetId];
            if (!p2 || lineIndex >= MAX_EDGES) return;

            const isPathEdge =
              currentPath &&
              currentPath.includes(sourceNode.id) &&
              currentPath.includes(conn.targetId);

            const isDirectlyActive =
              isPathEdge ||
              (activeId && (sourceNode.id === activeId || conn.targetId === activeId));
            const hasAnyActive = !!activeId || !!currentPath;

            const edgeCol = isPathEdge
              ? colorPath
              : isDirectlyActive
              ? activeColor
              : hasAnyActive
              ? ghostColor
              : dimmedColor;

            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            mid.y += 0.25;

            const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
            const samples = curve.getPoints(POINTS_PER_EDGE / 2);

            for (let s = 0; s < samples.length - 1; s++) {
              const startPt = samples[s];
              const endPt = samples[s + 1];

              const baseIdx = (lineIndex * POINTS_PER_EDGE + s * 2) * 3;
              linePositions[baseIdx] = startPt.x;
              linePositions[baseIdx + 1] = startPt.y;
              linePositions[baseIdx + 2] = startPt.z;

              linePositions[baseIdx + 3] = endPt.x;
              linePositions[baseIdx + 4] = endPt.y;
              linePositions[baseIdx + 5] = endPt.z;

              const alphaScale = isPathEdge ? 1.0 : isDirectlyActive ? 0.95 : hasAnyActive ? 0.15 : 0.35;
              lineColors[baseIdx] = edgeCol.r * alphaScale;
              lineColors[baseIdx + 1] = edgeCol.g * alphaScale;
              lineColors[baseIdx + 2] = edgeCol.b * alphaScale;

              lineColors[baseIdx + 3] = edgeCol.r * alphaScale;
              lineColors[baseIdx + 4] = edgeCol.g * alphaScale;
              lineColors[baseIdx + 5] = edgeCol.b * alphaScale;
            }

            if (isDirectlyActive && pulseIdx < PULSE_COUNT) {
              const pulseT = (time * 1.2 + lineIndex * 0.3) % 1.0;
              const pt = curve.getPoint(pulseT);
              pulsePositions[pulseIdx * 3] = pt.x;
              pulsePositions[pulseIdx * 3 + 1] = pt.y;
              pulsePositions[pulseIdx * 3 + 2] = pt.z;

              pulseColors[pulseIdx * 3] = edgeCol.r;
              pulseColors[pulseIdx * 3 + 1] = edgeCol.g;
              pulseColors[pulseIdx * 3 + 2] = edgeCol.b;
              pulseIdx++;
            }

            lineIndex++;
          });
        });
      }

      // Clear remaining lines
      for (let k = lineIndex * POINTS_PER_EDGE * 3; k < totalLinePoints * 3; k++) {
        linePositions[k] = 0;
        lineColors[k] = 0;
      }
      (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

      for (let k = pulseIdx * 3; k < PULSE_COUNT * 3; k++) {
        pulsePositions[k] = 9999;
      }
      (pulseGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (pulseGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

      // Camera Easing & Continuous Zoom Target
      const activeSelId = selectedMemoryIdRef.current;

      if (activeSelId && node3DPositions[activeSelId]) {
        const nodePos = node3DPositions[activeSelId].clone();
        nodePos.applyMatrix4(celestialGroup.matrixWorld);

        camTarget.pos.set(nodePos.x * 0.45, nodePos.y + 1.8, nodePos.z + 4.5);
        camTarget.look.copy(nodePos);
        moteMat.uniforms.uRush.value += (0.45 - moteMat.uniforms.uRush.value) * 0.1;
      } else {
        if (currentLift >= 0) {
          const t = Math.min(1.0, currentLift);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          camTarget.pos.lerpVectors(camAnchors.orbit.eye, camAnchors.chart.eye, eased);
          camTarget.look.lerpVectors(camAnchors.orbit.look, camAnchors.chart.look, eased);
        } else {
          const t = Math.min(1.0, -currentLift);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          camTarget.pos.lerpVectors(camAnchors.orbit.eye, camAnchors.sea.eye, eased);
          camTarget.look.lerpVectors(camAnchors.orbit.look, camAnchors.sea.look, eased);
        }

        const rush = Math.abs(currentLift) * 0.6;
        moteMat.uniforms.uRush.value += (rush - moteMat.uniforms.uRush.value) * 0.1;
      }

      camera.position.lerp(camTarget.pos, 0.065);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      camera.lookAt(camTarget.look);

      // Track camera distance & zoom tier for dynamic LOD
      const dist = camera.position.distanceTo(camTarget.look);
      setCameraDistance(dist);

      const newTier: 'overview' | 'medium' | 'close' =
        dist > 15.0 && currentLift > -0.15
          ? 'overview'
          : dist < 12.0 || currentLift < -0.55
          ? 'close'
          : 'medium';
      if (newTier !== zoomTierRef.current) {
        zoomTierRef.current = newTier;
        setZoomTier(newTier);
      }

      renderer.render(scene, camera);

      // Project Memory Nodes to 2D Screen Space directly on DOM element refs
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

      MEMORY_NODES.forEach((node) => {
        const el = nodeDomRefs.current[node.id];
        if (!el) return;
        const localPos = node3DPositions[node.id];
        if (!localPos) return;

        const worldPos = localPos.clone().applyMatrix4(celestialGroup.matrixWorld);
        const screenPos = worldPos.clone().project(camera);

        if (screenPos.z >= 1.0) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          nodeScreensRef.current[node.id] = { x: -9999, y: -9999, visible: false };
          return;
        }

        const sx = ((screenPos.x + 1) / 2) * w;
        const sy = ((-screenPos.y + 1) / 2) * h;

        el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';

        nodeScreensRef.current[node.id] = { x: sx, y: sy, visible: true };
      });
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      nodeBeaconGeo.dispose();
      nodeBeaconMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
    };
  }, [theme]);

  const categories = useMemo(() => ['ALL', ...getAllCategories()], []);

  return (
    <div
      ref={containerRef}
      data-theme={theme}
      className={`relative w-full h-full overflow-hidden select-none font-mono transition-colors duration-700 ${
        theme === 'night' ? 'bg-[#000000] text-[#f1ece3]' : 'bg-[#e8e6df] text-[#16161a]'
      } ${className}`}
      style={{
        fontFamily: "'IBM Plex Mono', 'Fustat', monospace",
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Drafting Corner Marks */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <span
          className={`absolute top-4 left-4 text-xs tracking-widest ${
            theme === 'night' ? 'text-white/40' : 'text-black/40'
          }`}
        >
          ┌
        </span>
        <span
          className={`absolute top-4 right-4 text-xs tracking-widest ${
            theme === 'night' ? 'text-white/40' : 'text-black/40'
          }`}
        >
          ┐
        </span>
        <span
          className={`absolute bottom-4 left-4 text-xs tracking-widest ${
            theme === 'night' ? 'text-white/40' : 'text-black/40'
          }`}
        >
          └
        </span>
        <span
          className={`absolute bottom-4 right-4 text-xs tracking-widest ${
            theme === 'night' ? 'text-white/40' : 'text-black/40'
          }`}
        >
          ┘
        </span>
      </div>

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 px-6 sm:px-10 py-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={fitGraphToView}
            className={`text-[13px] font-semibold tracking-[0.38em] uppercase transition-opacity hover:opacity-70 ${
              theme === 'night' ? 'text-[#f1ece3]' : 'text-[#16161a]'
            }`}
          >
            MAXIMEM
          </button>

          {/* Breadcrumb Trail (Shown only when a memory is selected) */}
          {activeMemory && (
            <div className="flex items-center gap-1.5 text-[10px] tracking-wider opacity-75 border-l border-current/20 pl-3 animate-in fade-in duration-300">
              <button onClick={fitGraphToView} className="hover:underline uppercase opacity-60 hover:opacity-100">
                GRAPH
              </button>
              <ChevronRight size={10} className="opacity-40" />
              <button
                onClick={() => setCategoryFilter(activeMemory.category)}
                className="hover:underline uppercase text-[#e8c88a] font-bold"
              >
                {activeMemory.category}
              </button>
              <ChevronRight size={10} className="opacity-40" />
              <span className="font-bold uppercase truncate max-w-[150px]">
                {activeMemory.title}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-widest uppercase border rounded-[2px] transition-colors ${
              theme === 'night'
                ? 'border-white/20 bg-white/5 hover:border-[#e8c88a] text-white/80'
                : 'border-black/20 bg-black/5 hover:border-[#2b4cff] text-black/80'
            }`}
            title="Search Memories (/)"
          >
            <Search size={11} />
            <span className="hidden sm:inline">FIND</span>
            <kbd className="opacity-40 font-mono text-[9px]">[/]</kbd>
          </button>

          {/* Cluster Filter Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase border rounded-[2px] transition-colors ${
                categoryFilter !== 'ALL'
                  ? 'bg-[#e8c88a] text-black border-[#e8c88a] font-bold'
                  : theme === 'night'
                  ? 'border-white/15 bg-white/5 text-white/70 hover:border-white/30'
                  : 'border-black/15 bg-black/5 text-black/70 hover:border-black/30'
              }`}
              title="Filter by Category"
            >
              <Filter size={10} />
              <span className="hidden md:inline">{categoryFilter}</span>
            </button>

            {isFilterMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-44 p-1.5 border backdrop-blur-md shadow-xl z-40 space-y-1 text-[10px] uppercase font-mono ${
                  theme === 'night'
                    ? 'border-white/20 bg-[#0d0f14]/95 text-white'
                    : 'border-black/20 bg-[#f7f5ee]/95 text-black'
                }`}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsFilterMenuOpen(false);
                      spaceSoundscape.playNodePulse(0, 1);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-[2px] transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#e8c88a] text-black font-bold'
                        : 'hover:bg-current/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guided Tour Trigger */}
          <button
            onClick={() => {
              setIsTourActive(!isTourActive);
              if (!isTourActive) setTourIndex(0);
              spaceSoundscape.playGlideTransition();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-widest uppercase border rounded-[2px] transition-colors ${
              isTourActive
                ? 'bg-[#e8c88a] text-black border-[#e8c88a] font-bold shadow-[0_0_12px_rgba(232,200,138,0.5)]'
                : theme === 'night'
                ? 'border-white/20 text-white/70 hover:border-white/40'
                : 'border-black/20 text-black/70 hover:border-black/40'
            }`}
            title="Guided Tour of AI Memories"
          >
            <Sparkles size={11} />
            <span className="hidden sm:inline">{isTourActive ? 'END TOUR' : 'TOUR'}</span>
          </button>

          {/* Help Modal Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className={`p-1.5 transition-opacity hover:opacity-70 ${
              theme === 'night' ? 'text-white/70' : 'text-black/70'
            }`}
            title="Keyboard Shortcuts & Guide (?)"
          >
            <HelpCircle size={15} />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => {
              setTheme(theme === 'night' ? 'paper' : 'night');
              spaceSoundscape.playGlideTransition();
            }}
            className={`p-1.5 rounded transition-transform hover:scale-110 ${
              theme === 'night' ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
            }`}
            title="Toggle Night / Paper Theme"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="6" strokeWidth="1.2" />
              <ellipse cx="12" cy="12" rx="10" ry="3.6" strokeWidth="1.0" transform="rotate(-25 12 12)" />
            </svg>
          </button>

          {/* Audio Mute */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              spaceSoundscape.toggleMute();
            }}
            className={`transition-opacity hover:opacity-70 ${
              theme === 'night' ? 'text-white/70' : 'text-black/70'
            }`}
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Live Clock */}
          <div className="hidden sm:block text-[12px] tracking-widest tabular-nums opacity-60">
            {currentTime}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* INTERACTIVE POINT BEACONS & PROGRESSIVE LABELS                 */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {MEMORY_NODES.map((node) => {
          const isSelected = selectedMemoryId === node.id;
          const isHovered = hoveredMemoryId === node.id;
          const isTargetConnected = connectedIds.has(node.id);
          const isPathNode = discoveredPath && discoveredPath.includes(node.id);
          const isLabelVisible = visibleLabelIds.has(node.id);
          const matchesCategory = categoryFilter === 'ALL' || node.category === categoryFilter;

          return (
            <div
              key={node.id}
              ref={(el) => {
                nodeDomRefs.current[node.id] = el;
              }}
              id={`memory-node-wrapper-${node.id}`}
              style={{
                display: matchesCategory ? 'block' : 'none',
                transform: 'translate3d(-9999px, -9999px, 0)',
              }}
              className="absolute top-0 left-0 pointer-events-auto transition-opacity duration-300"
            >
              {/* Ultra-precise point hit target with diamond anchor and hairline stem (hxlfed.com signature) */}
              <div className="relative flex flex-col items-center">
                {/* Progressive, non-overlapping label: appears ONLY when hovered, selected, or at close zoom */}
                <div
                  className={`absolute bottom-full mb-6 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-[2px] transition-all duration-300 pointer-events-none whitespace-nowrap flex flex-col items-center backdrop-blur-md shadow-2xl ${
                    isLabelVisible
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-75 translate-y-1'
                  } ${
                    isSelected
                      ? 'bg-[#0d0f14]/95 border border-[#e8c88a] ring-1 ring-[#e8c88a]/50 text-[#f1ece3] z-40'
                      : isHovered
                      ? theme === 'night'
                        ? 'bg-[#0d0f14]/95 border border-[#e8c88a] text-[#e8c88a] z-50'
                        : 'bg-[#f7f5ee]/95 border border-[#2b4cff] text-[#2b4cff] z-50'
                      : isPathNode
                      ? 'bg-[#ff9f43] text-black font-bold z-35'
                      : isTargetConnected
                      ? theme === 'night'
                        ? 'bg-[#12141a]/95 border border-white/20 text-white/95 z-30'
                        : 'bg-[#dedbd2]/95 border border-black/20 text-black/95 z-30'
                      : theme === 'night'
                      ? 'bg-[#0d0f14]/90 border border-white/10 text-white/80 z-20'
                      : 'bg-[#dedbd2]/90 border border-black/10 text-black/80 z-20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[8px] font-mono tracking-[0.22em] text-[#e8c88a] uppercase">
                    <span>{node.num}</span>
                    <span>·</span>
                    <span>{node.category}</span>
                    {isTargetConnected && activeMemory && (
                      <span className="px-1 py-0.2 bg-[#e8c88a]/20 border border-[#e8c88a]/40 text-[#e8c88a] text-[7px] font-bold">
                        LINKED
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono tracking-[0.16em] uppercase font-bold text-[#f1ece3]">
                    {node.title}
                  </span>
                </div>

                {/* Delicate Hairline Connecting Stem */}
                <div
                  className={`w-[1px] h-5 mb-0.5 transition-all duration-300 pointer-events-none origin-bottom ${
                    isLabelVisible || isHovered || isSelected
                      ? isSelected || isHovered
                        ? 'bg-[#e8c88a] opacity-100 scale-y-100'
                        : 'bg-white/40 opacity-70 scale-y-100'
                      : 'opacity-0 scale-y-0'
                  }`}
                />

                {/* Rotated Diamond Anchor (◇ / ◈) matching hxlfed.com */}
                <button
                  id={`memory-node-${node.id}`}
                  data-node-id={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToMemory(node.id);
                  }}
                  onMouseEnter={() => {
                    setHoveredMemoryId(node.id);
                    spaceSoundscape.playNodePulse(0, 1);
                  }}
                  onMouseLeave={() => setHoveredMemoryId(null)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    navigateToMemory(node.id);
                    liftTargetRef.current = -0.5;
                  }}
                  className="group relative w-7 h-7 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                  aria-label={node.title}
                >
                  {/* Subtle radiating glow halo on hover / selection */}
                  <span
                    className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                      isSelected
                        ? 'w-7 h-7 bg-[#e8c88a]/35 ring-1 ring-[#e8c88a] scale-125 animate-pulse'
                        : isHovered
                        ? 'w-6 h-6 bg-[#e8c88a]/25 ring-1 ring-[#e8c88a]/80 scale-110'
                        : isPathNode
                        ? 'w-6 h-6 bg-[#ff9f43]/25 ring-1 ring-[#ff9f43] scale-100'
                        : isTargetConnected
                        ? 'w-5 h-5 bg-[#e8c88a]/15 ring-1 ring-[#e8c88a]/40 scale-95'
                        : 'w-3 h-3 bg-white/10 group-hover:bg-[#e8c88a]/30 group-hover:scale-125'
                    }`}
                  />

                  {/* Central Diamond Anchor Point */}
                  <span
                    className={`relative w-2 h-2 rotate-45 border transition-all duration-200 pointer-events-none ${
                      isSelected
                        ? 'bg-[#e8c88a] border-[#e8c88a] shadow-[0_0_8px_#e8c88a] scale-125'
                        : isHovered
                        ? 'bg-[#e8c88a]/50 border-[#e8c88a] scale-115'
                        : isPathNode
                        ? 'bg-[#ff9f43] border-[#ff9f43]'
                        : isTargetConnected
                        ? 'bg-[#e8c88a]/30 border-[#e8c88a]/80'
                        : theme === 'night'
                        ? 'border-white/60 bg-white/20 group-hover:border-[#e8c88a] group-hover:bg-[#e8c88a]/40'
                        : 'border-black/60 bg-black/20 group-hover:border-[#2b4cff] group-hover:bg-[#2b4cff]/40'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* CONTEXTUAL HUD CARD (Appears ONLY when a node is selected)     */}
      {/* ============================================================== */}
      {activeMemory && (
        <div
          className={`absolute bottom-20 right-6 sm:right-10 max-w-sm sm:max-w-md p-5 border backdrop-blur-md z-30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 font-mono ${
            theme === 'night'
              ? 'border-white/20 bg-[#0d0f14]/95 text-[#f1ece3] shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
              : 'border-black/20 bg-[#f7f5ee]/95 text-[#16161a] shadow-[0_4px_30px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Drafting technical corner marks */}
          <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-[#e8c88a] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-[#e8c88a] pointer-events-none" />
          <span className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-[#e8c88a] pointer-events-none" />
          <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-[#e8c88a] pointer-events-none" />

          {/* Card Top Metadata & Dismiss Button */}
          <div className="flex items-center justify-between text-[10px] tracking-widest opacity-70 uppercase mb-2">
            <div className="flex items-center gap-2">
              {historyStack.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="flex items-center gap-1 text-[#e8c88a] hover:underline transition-colors"
                  title="Back to Previous Memory"
                >
                  <ArrowLeft size={11} /> [BACK]
                </button>
              )}
              <span className="text-[#e8c88a] font-bold">
                {activeMemory.num}
              </span>
              <span className="opacity-40">/</span>
              <span>{activeMemory.caps}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#e8c88a]/40 bg-[#e8c88a]/10 text-[9px] text-[#e8c88a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c88a] animate-pulse" />
                {activeMemory.category}
              </span>
              <button
                onClick={() => setSelectedMemoryId(null)}
                className="opacity-50 hover:opacity-100 hover:text-[#e8c88a] transition-all p-0.5"
                title="Deselect [ESC]"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Heading */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 uppercase">
            {activeMemory.title}
          </h3>

          {/* Summary */}
          <div className="text-[12px] sm:text-[13px] leading-relaxed opacity-90 mb-3 flex items-start gap-2">
            <span className="text-[#e8c88a] select-none font-bold font-mono">&gt;</span>
            <p className="flex-1 font-sans">{activeMemory.summary}</p>
          </div>

          {/* Source Document Reference */}
          <div className="text-[10px] font-mono opacity-60 mb-3 border-t border-current/15 pt-2">
            <span className="font-bold">SOURCE:</span> {activeMemory.source}
          </div>

          {/* Meaningful Connections List with Next/Prev Traversal */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                Relationships ({activeMemory.connections.length})
              </span>
              <span className="text-[9px] font-mono opacity-50">[← / → STEP]</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {activeMemory.connections.map((conn) => {
                const targetNode = MEMORY_NODES.find((m) => m.id === conn.targetId);
                return (
                  <button
                    key={conn.targetId}
                    onClick={() => navigateToMemory(conn.targetId)}
                    className={`w-full text-left p-2 border text-[11px] transition-colors rounded-[2px] cursor-pointer group ${
                      theme === 'night'
                        ? 'border-white/10 bg-white/5 hover:border-[#e8c88a] hover:bg-white/10'
                        : 'border-black/10 bg-black/5 hover:border-[#2b4cff] hover:bg-black/10'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px] mb-0.5">
                      <span className="font-bold text-[#e8c88a] uppercase tracking-wider">
                        [{conn.type}]
                      </span>
                      <span className="opacity-60 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Explore <ArrowRight size={10} />
                      </span>
                    </div>
                    <div className="font-bold text-[11px] mb-0.5">
                      {targetNode ? targetNode.title : conn.targetId}
                    </div>
                    <p className="text-[10px] font-sans opacity-75 leading-tight">
                      {conn.explanation}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Path Discovery Action */}
          <div className="mb-3 pt-2 border-t border-current/15 flex items-center justify-between">
            <button
              onClick={() => setIsPathDiscoveryOpen(!isPathDiscoveryOpen)}
              className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-mono transition-colors ${
                isPathDiscoveryOpen ? 'text-[#e8c88a]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Route size={12} />
              <span>{isPathDiscoveryOpen ? 'Close Path Finder' : 'Find Path to Node...'}</span>
            </button>

            {discoveredPath && (
              <span className="text-[9px] text-[#ff9f43] font-bold">
                PATH: {discoveredPath.length} HOPS
              </span>
            )}
          </div>

          {/* Target Selector for Path Discovery */}
          {isPathDiscoveryOpen && (
            <div className="mb-3 p-2 border border-current/20 bg-current/5 space-y-1 text-[10px]">
              <span className="block opacity-60 uppercase mb-1">Select Destination Memory:</span>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {MEMORY_NODES.filter((m) => m.id !== activeMemory.id).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPathFindingTarget(m.id)}
                    className={`w-full text-left px-2 py-0.5 border rounded-[2px] truncate ${
                      pathFindingTarget === m.id
                        ? 'border-[#ff9f43] text-[#ff9f43] font-bold'
                        : 'border-transparent hover:bg-current/10'
                    }`}
                  >
                    {m.num} {m.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-current/15">
            <button
              onClick={fitGraphToView}
              className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest px-3 py-1.5 border border-current/20 hover:bg-current/10 transition-colors cursor-pointer"
            >
              <CornerDownLeft size={12} />
              <span>Reset to Graph</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToSynap) onNavigateToSynap();
              }}
              className="text-xs font-mono font-bold tracking-widest text-[#e8c88a] hover:underline"
            >
              SYNAP LABS →
            </button>
          </div>
        </div>
      )}

      {/* COMPACT FLOATING GRAPH CONTROLS DOCK */}
      <div className="absolute bottom-5 right-6 sm:right-10 z-20 flex items-center gap-1 p-1.5 border rounded-[4px] backdrop-blur-md shadow-lg transition-colors pointer-events-auto bg-black/60 border-white/20 text-white/80">
        <button
          onClick={() => {
            liftTargetRef.current = Math.max(-1.0, liftTargetRef.current - 0.35);
            spaceSoundscape.playGlideTransition();
          }}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn size={14} />
        </button>

        <button
          onClick={() => {
            liftTargetRef.current = Math.min(1.0, liftTargetRef.current + 0.35);
            spaceSoundscape.playGlideTransition();
          }}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut size={14} />
        </button>

        <button
          onClick={fitGraphToView}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Fit Graph to View (F)"
        >
          <Maximize2 size={14} />
        </button>

        <button
          onClick={fitGraphToView}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Reset Camera (0)"
        >
          <RotateCcw size={14} />
        </button>

        <span className="w-[1px] h-4 bg-white/20 mx-1" />

        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-1.5 rounded transition-colors ${
            isAutoRotating ? 'text-[#e8c88a]' : 'opacity-40 hover:opacity-100'
          }`}
          title="Toggle Auto-Rotation (Space)"
        >
          <Compass size={14} />
        </button>

        <button
          onClick={() => setShowConstellationLines(!showConstellationLines)}
          className={`p-1.5 rounded transition-colors ${
            showConstellationLines ? 'text-[#e8c88a]' : 'opacity-40 hover:opacity-100'
          }`}
          title="Toggle Constellation Lines"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Bottom Navigation & Zoom Level Controls */}
      <footer className="absolute bottom-5 left-0 right-0 z-20 flex items-center justify-between px-6 sm:px-10 pointer-events-none text-[11px] tracking-widest uppercase">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => {
              liftTargetRef.current = liftTargetRef.current > 0.4 ? 0 : 1.0;
              setSelectedMemoryId(null);
              spaceSoundscape.playGlideTransition();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              zoomAltitude > 0.4
                ? 'text-[#e8c88a] font-bold bg-white/10'
                : theme === 'night'
                ? 'text-white/60 hover:text-white'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <ArrowUp size={12} />
            <span>THE CHART (OVERVIEW)</span>
          </button>

          <span className={theme === 'night' ? 'text-white/20' : 'text-black/20'}>·</span>

          <button
            onClick={() => {
              liftTargetRef.current = liftTargetRef.current < -0.4 ? 0 : -1.0;
              setSelectedMemoryId(null);
              spaceSoundscape.playGlideTransition();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              zoomAltitude < -0.4
                ? 'text-[#e8c88a] font-bold bg-white/10'
                : theme === 'night'
                ? 'text-white/60 hover:text-white'
                : 'text-black/60 hover:text-black'
            }`}
          >
            <ArrowDown size={12} />
            <span>OUT TO SEA (DEEP FOCUS)</span>
          </button>
        </div>

        <div className="hidden lg:block opacity-40 text-[10px]">
          [ HOVER/CLICK POINT TO EXPLORE · SCROLL TO ZOOM · &apos;?&apos; FOR SHORTCUTS ]
        </div>
      </footer>

      {/* MINIMALIST SEARCH MODAL */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg border border-white/20 bg-[#0d0f14] p-5 shadow-2xl text-[#f1ece3]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
              <div className="flex items-center gap-2 w-full">
                <Search size={16} className="text-[#e8c88a]" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchMatchIndex(0);
                  }}
                  placeholder="SEARCH MEMORY, TOPIC, PERSON, OR SPEC..."
                  className="w-full bg-transparent border-none outline-none font-mono text-sm tracking-wider uppercase placeholder:text-white/30"
                />
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="opacity-50 hover:opacity-100 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      navigateToMemory(m.id);
                      setIsSearchOpen(false);
                    }}
                    className={`w-full text-left p-3 border text-xs transition-colors rounded-[2px] group ${
                      idx === searchMatchIndex % searchResults.length
                        ? 'border-[#e8c88a] bg-white/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-60 mb-1">
                      <span>
                        {m.num} · {m.caps}
                      </span>
                      <span className="px-1 border border-current">{m.category}</span>
                    </div>
                    <div className="font-bold text-sm text-[#e8c88a] uppercase mb-1">
                      {m.title}
                    </div>
                    <p className="font-sans text-[11px] opacity-75 line-clamp-2">
                      {m.summary}
                    </p>
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <div className="py-8 text-center text-xs opacity-50 uppercase tracking-widest font-mono">
                  No memories matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="py-6 text-center text-[11px] opacity-40 uppercase tracking-widest font-mono">
                  Type any title, person (Alex Chen), architecture, or security topic...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[10px] opacity-50 uppercase">
              <span>{searchResults.length} Results Found</span>
              <span>[Enter to Select · Esc to Close]</span>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS & HELP MODAL */}
      {showHelpModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border border-white/20 bg-[#0d0f14] p-6 shadow-2xl text-[#f1ece3]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#e8c88a]" />
                <h4 className="font-bold tracking-widest uppercase text-sm">
                  Navigation &amp; Shortcuts
                </h4>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="opacity-50 hover:opacity-100 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Zoom In / Zoom Out</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  + / - or Scroll Wheel
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Orbit Rotate Camera</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  Left-Click Drag
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Pan Camera Plane</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  Shift + Drag or Right-Click
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Fit / Reset Graph View</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  F or 0
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Toggle Auto-Rotation</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Traverse Connections</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  ← / →
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Search Memories</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="opacity-70">Clear Selection / Close</span>
                <kbd className="px-2 py-0.5 border border-white/20 font-mono text-[10px]">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 border border-white/20 hover:bg-white/10 uppercase text-xs tracking-wider"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
