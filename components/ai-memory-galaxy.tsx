"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  Search,
  X,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Link2,
  Compass,
  Orbit,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Activity,
  Star,
  Play,
  Route,
} from "lucide-react";
import { spaceSoundscape } from "@/lib/audio/space-soundscape";

// ════════════════════════════════════════════════════════════════════════════
// 1. DATA MODELS & TYPINGS
// ════════════════════════════════════════════════════════════════════════════

export type RelationshipType =
  | "part of"
  | "influenced by"
  | "mentioned in"
  | "updated by"
  | "related to"
  | "derived from";

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  reason: string; // Plain-English explanation of why memories connect
}

export interface MemoryNode {
  id: string;
  title: string;
  description: string; // Plain-English summary for non-technical users
  source: string;      // Origin (RFC, PR, Meeting, Slack, etc.)
  timestamp: string;
  clusterId: string;
  topic: string;
  anchor: THREE.Vector3;
  isAnchor?: boolean;  // Bright landmark star with optical diffraction spike
  magnitude?: number;  // Visual prominence / brightness (1.0 = normal, 1.6 = major)
}

export interface TopicCluster {
  id: string;
  name: string;
  tag: string;
  description: string;
  centroid: THREE.Vector3;
  colorHex: string;
  colorThree: THREE.Color;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. REAL PROJECT TOPIC CLUSTERS (GALAXY REGIONS & SPIRAL ARMS)
// ════════════════════════════════════════════════════════════════════════════

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "cluster-arch",
    name: "Architecture & Storage",
    tag: "Core Engine",
    description:
      "Technical foundations powering fast, local-first memory recall without sending private logs to cloud databases.",
    centroid: new THREE.Vector3(-22, 1.8, 12),
    colorHex: "#F4F6F9",
    colorThree: new THREE.Color(0xf4f6f9),
  },
  {
    id: "cluster-decisions",
    name: "Product Decisions",
    tag: "Decisions",
    description:
      "Strategic agreements and engineering choices made across team chats, design reviews, and architecture records.",
    centroid: new THREE.Vector3(20, 2.2, -14),
    colorHex: "#FCE6B8",
    colorThree: new THREE.Color(0xfce6b8),
  },
  {
    id: "cluster-prefs",
    name: "User Preferences",
    tag: "Preferences",
    description:
      "Personal coding habits, latency thresholds, and communication cadences learned automatically by Maximem.",
    centroid: new THREE.Vector3(18, -1.2, 22),
    colorHex: "#FFF2DA",
    colorThree: new THREE.Color(0xfff2da),
  },
  {
    id: "cluster-context",
    name: "Conversations & Syncs",
    tag: "Live Context",
    description:
      "Real-time knowledge synthesized from team meetings, voice recordings, and cross-agent developer threads.",
    centroid: new THREE.Vector3(5, 1.4, 34),
    colorHex: "#E2E7F0",
    colorThree: new THREE.Color(0xe2e7f0),
  },
  {
    id: "cluster-research",
    name: "Research & Synthesis",
    tag: "Research",
    description:
      "Advanced semantic compression models that reduce token bloat and predict upcoming context before you type.",
    centroid: new THREE.Vector3(-26, -2.4, -26),
    colorHex: "#F6B794",
    colorThree: new THREE.Color(0xf6b794),
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 2B. DEEP COSMOS COMPANION GALAXIES (DISCOVERY DOCUMENTARY DEEP FIELD)
// ════════════════════════════════════════════════════════════════════════════

export const COMPANION_GALAXIES = [
  {
    id: "galaxy-andromeda",
    name: "Andromeda Galaxy (M31)",
    tag: "Major Spiral Companion",
    description:
      "Majestic sister spiral tilted at 77° across the cosmic void, holding 16,000+ stars, a luminous golden nucleus, dual logarithmic spiral arms, and dark dust absorption rings.",
    center: new THREE.Vector3(-360, 130, -410),
    radius: 120,
    colorHex: "#93c5fd",
    distanceLy: "2.537 Mly",
  },
  {
    id: "galaxy-triangulum",
    name: "Triangulum Galaxy (M33)",
    tag: "Flocculent Spiral",
    description:
      "Luminous third-largest member of the Local Group, shimmering with cyan star-forming nebulae and active stellar nurseries across open, graceful spiral filaments.",
    center: new THREE.Vector3(310, -95, -340),
    radius: 80,
    colorHex: "#c4b5fd",
    distanceLy: "2.73 Mly",
  },
  {
    id: "galaxy-lmc",
    name: "Large Magellanic Cloud",
    tag: "Satellite Dwarf Galaxy",
    description:
      "Gravitationally bound dwarf galaxy hovering beneath the galactic plane, ablaze with massive young star clusters and cosmic gas clouds like the Tarantula Nebula.",
    center: new THREE.Vector3(-85, -155, 175),
    radius: 55,
    colorHex: "#fdba74",
    distanceLy: "158.2 kly",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 3. REAL PROJECT MEMORIES (AUTHENTIC DATA FROM MAXIMEM REPOSITORY)
// ════════════════════════════════════════════════════════════════════════════

export const DEMO_MEMORIES: MemoryNode[] = [
  // ── Cluster 0: Architecture & Storage (Inner Arm Alpha) ──
  {
    id: "mem-tri-store",
    title: "Hybrid Graph & Vector Vault",
    description:
      "Combines instant local key-value lookups with vector search so the AI can recall relevant facts in under 15ms without sending data to cloud servers.",
    source: "RFC-042 System Architecture",
    timestamp: "18m ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-22, 1.4, 11),
    isAnchor: true,
    magnitude: 1.6,
  },
  {
    id: "mem-cache-iso",
    title: "Turbo Cache Boundary Isolation",
    description:
      "Separates short-term active chat memory from permanent core memory, preventing temporary chat experiments from polluting permanent knowledge.",
    source: "Git PR #149 Commit Note",
    timestamp: "2h ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-29, 2.6, 6),
    magnitude: 1.15,
  },
  {
    id: "mem-stream-ingest",
    title: "Multi-Source Background Ingestion",
    description:
      "Continuously monitors connected tools (Slack, code changes, meeting transcripts) and converts raw text into structured memory triples in the background.",
    source: "Ingest Daemon Log",
    timestamp: "4h ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-16, 0.9, -3),
    magnitude: 1.1,
  },
  {
    id: "mem-agent-harness",
    title: "Agent Harness Architecture",
    description:
      "The execution harness is the real product: atomic tools remain permanently loaded, while availability per step is governed by constrained decoding logit masking rather than dynamic tool removal.",
    source: "Doc: Agent Harness Spec v2.4",
    timestamp: "1d ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-14, 2.0, 19),
    magnitude: 1.25,
  },
  {
    id: "mem-logit-masking",
    title: "KV-Cache & Logit Masking",
    description:
      "Constraining output token probabilities during sampling eliminates prompt prefix cache thrashing, achieving 4.2x faster tool dispatch latency under multi-turn autonomous loops.",
    source: "Engineering Log #418: Acceleration",
    timestamp: "3d ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-27, 1.1, 19),
    magnitude: 1.1,
  },

  // ── Cluster 1: Product Decisions (Mid Arm Beta) ──
  {
    id: "mem-local-first",
    title: "Local-First Storage Over Cloud Sync",
    description:
      "The team agreed to keep all private memories encrypted in on-device SQLite vaults rather than syncing raw conversation logs to cloud servers.",
    source: "Architecture Decision Record #18",
    timestamp: "Yesterday",
    clusterId: "cluster-decisions",
    topic: "Product Decisions",
    anchor: new THREE.Vector3(19, 2.0, -12),
    isAnchor: true,
    magnitude: 1.6,
  },
  {
    id: "mem-eviction",
    title: "Non-Destructive Memory Updates",
    description:
      "When facts or preferences change, older facts are archived with historical timestamps rather than deleted, allowing the AI to understand how decisions evolved.",
    source: "RFC-051 Revision Memo",
    timestamp: "1d ago",
    clusterId: "cluster-decisions",
    topic: "Product Decisions",
    anchor: new THREE.Vector3(28, 2.8, -7),
    magnitude: 1.2,
  },
  {
    id: "mem-obsidian-ds",
    title: "Obsidian Monochrome Brand Palette",
    description:
      "Standardized UI theme on #1B1B19 background canvas with high-contrast white text and laser-focused #F26522 amber accents for actionable focus.",
    source: "Design System Guidelines",
    timestamp: "2d ago",
    clusterId: "cluster-decisions",
    topic: "Product Decisions",
    anchor: new THREE.Vector3(22, 1.7, -21),
    magnitude: 1.15,
  },
  {
    id: "mem-paper-aesthetic",
    title: "Tactile Restraint & Paper Aesthetic",
    description:
      "Avoid loud, generic dashboard tropes. Use deep charcoal obsidian, sumi ink, warm parchment, fine stardust particles, and precision drafting corner brackets.",
    source: "Design Manifesto: Architecture of Midnight",
    timestamp: "4d ago",
    clusterId: "cluster-decisions",
    topic: "Product Decisions",
    anchor: new THREE.Vector3(13, 2.5, -17),
    magnitude: 1.2,
  },

  // ── Cluster 2: User Preferences (Lateral Filament Gamma) ──
  {
    id: "mem-latency-sla",
    title: "Sub-15ms Recall SLA",
    description:
      "User specified that all memory augmentations must execute in under 15ms so AI autocomplete and responses never introduce perceptible typing lag.",
    source: "Latency Audit Benchmark",
    timestamp: "4d ago",
    clusterId: "cluster-prefs",
    topic: "User Preferences",
    anchor: new THREE.Vector3(16, -1.0, 20),
    isAnchor: true,
    magnitude: 1.6,
  },
  {
    id: "mem-type-strict",
    title: "Strict TypeScript Null Checks",
    description:
      "User consistently prefers strictly-typed TypeScript with zero 'any' casts and pure immutable state transforms across all generated code.",
    source: "Observed Coding Activity",
    timestamp: "12m ago",
    clusterId: "cluster-prefs",
    topic: "User Preferences",
    anchor: new THREE.Vector3(22, -1.5, 15),
    magnitude: 1.15,
  },
  {
    id: "mem-exec-cadence",
    title: "Direct Decision Cadence",
    description:
      "User prefers concise bullet points and direct trade-off comparisons rather than lengthy conversational preamble or repetitive explanations.",
    source: "User Feedback Log",
    timestamp: "3d ago",
    clusterId: "cluster-prefs",
    topic: "User Preferences",
    anchor: new THREE.Vector3(25, -1.9, 27),
    magnitude: 1.15,
  },

  // ── Cluster 3: Conversations & Syncs (Outer Arm Delta) ──
  {
    id: "mem-agent-sync",
    title: "Shared Multi-Agent Memory Pipeline",
    description:
      "Team aligned Claude, Cursor, and ChatGPT on reading the identical local Synap vault to eliminate conflicting advice across different AI coding tools.",
    source: "Slack #architecture-sync",
    timestamp: "5h ago",
    clusterId: "cluster-context",
    topic: "Conversations & Syncs",
    anchor: new THREE.Vector3(4, 1.2, 33),
    isAnchor: true,
    magnitude: 1.6,
  },
  {
    id: "mem-sprint-review",
    title: "Weekly Engineering Sprint Review",
    description:
      "Validated 91% reduction in prompt token consumption by injecting only relevant synthesized memory triples instead of full chat histories.",
    source: "Sprint Meeting Audio (Echo)",
    timestamp: "Yesterday",
    clusterId: "cluster-context",
    topic: "Conversations & Syncs",
    anchor: new THREE.Vector3(12, 1.9, 40),
    magnitude: 1.2,
  },
  {
    id: "mem-security-audit",
    title: "Local Vault Cryptographic Review",
    description:
      "Security audit verified that local memory embeddings cannot be inverted into raw conversation logs without the user's private hardware key.",
    source: "Security Review Call",
    timestamp: "5d ago",
    clusterId: "cluster-context",
    topic: "Conversations & Syncs",
    anchor: new THREE.Vector3(-4, 0.7, 36),
    magnitude: 1.15,
  },

  // ── Cluster 4: Research & Synthesis (Companion Galaxy Arm Epsilon) ──
  {
    id: "mem-episodic-comp",
    title: "Episodic vs Semantic Compression",
    description:
      "Synthesizes conversational threads into permanent knowledge triples to prevent prompt window bloat while preserving important nuances.",
    source: "Research Note #08",
    timestamp: "2d ago",
    clusterId: "cluster-research",
    topic: "Research & Synthesis",
    anchor: new THREE.Vector3(-25, -2.1, -24),
    isAnchor: true,
    magnitude: 1.6,
  },
  {
    id: "mem-anticipatory",
    title: "Anticipatory Context Retrieval",
    description:
      "Monitors current editor cursor position and recently modified files to prepare relevant memory context before the user even finishes typing.",
    source: "AI Research Memo",
    timestamp: "3d ago",
    clusterId: "cluster-research",
    topic: "Research & Synthesis",
    anchor: new THREE.Vector3(-33, -2.8, -19),
    magnitude: 1.2,
  },
  {
    id: "mem-cross-entropy",
    title: "Cross-Entropy Retrieval Reranking",
    description:
      "Uses lightweight neural rerankers to double-check candidate memory matches for semantic relevance before feeding them to the main LLM.",
    source: "Eval Benchmark Suite",
    timestamp: "4d ago",
    clusterId: "cluster-research",
    topic: "Research & Synthesis",
    anchor: new THREE.Vector3(-20, -1.6, -33),
    magnitude: 1.15,
  },
  {
    id: "mem-decay-pass",
    title: "Autonomous Memory Pruning Cycles",
    description:
      "The agent schedules autonomous background passes during low-inference idle periods to consolidate duplicate records and recalculate graph centrality.",
    source: "Synthesis Engine Benchmark",
    timestamp: "5d ago",
    clusterId: "cluster-research",
    topic: "Research & Synthesis",
    anchor: new THREE.Vector3(-32, -2.5, -31),
    magnitude: 1.1,
  },
];



// Landmark Tour Order (Key Anchor Stars)
const LANDMARK_TOUR_IDS = [
  "mem-tri-store",
  "mem-local-first",
  "mem-latency-sla",
  "mem-agent-sync",
  "mem-episodic-comp",
];



// ════════════════════════════════════════════════════════════════════════════
// 4. EXPLICIT GRAPH RELATIONSHIPS (GRAVITATIONAL FILAMENTS)
// ════════════════════════════════════════════════════════════════════════════

export const GRAPH_EDGES: GraphEdge[] = [
  {
    id: "edge-1",
    sourceId: "mem-tri-store",
    targetId: "mem-local-first",
    type: "part of",
    reason: "The on-device SQLite vault is the primary storage engine implementing the hybrid tri-store indexing layer.",
  },
  {
    id: "edge-2",
    sourceId: "mem-tri-store",
    targetId: "mem-cache-iso",
    type: "part of",
    reason: "Turbo cache boundary isolates short-term session queries before committing permanent knowledge to the tri-store.",
  },
  {
    id: "edge-3",
    sourceId: "mem-tri-store",
    targetId: "mem-type-strict",
    type: "influenced by",
    reason: "Tri-store query interfaces were written with strict immutable TypeScript types to honor user preference.",
  },
  {
    id: "edge-4",
    sourceId: "mem-stream-ingest",
    targetId: "mem-agent-sync",
    type: "related to",
    reason: "Background ingestion pipes structured data directly into the multi-agent bus used by Claude and Cursor.",
  },
  {
    id: "edge-5",
    sourceId: "mem-stream-ingest",
    targetId: "mem-tri-store",
    type: "part of",
    reason: "Ingested conversation and documentation shards are indexed directly into the hybrid tri-store.",
  },
  {
    id: "edge-6",
    sourceId: "mem-local-first",
    targetId: "mem-eviction",
    type: "updated by",
    reason: "Local vault updates enforce semantic versioning and lineage tracking rather than destructive file deletes.",
  },
  {
    id: "edge-7",
    sourceId: "mem-local-first",
    targetId: "mem-security-audit",
    type: "mentioned in",
    reason: "The local-first encryption architecture was audited and validated during the team's security call.",
  },
  {
    id: "edge-8",
    sourceId: "mem-eviction",
    targetId: "mem-episodic-comp",
    type: "related to",
    reason: "Semantic compression triggers eviction links when older conversational threads are consolidated.",
  },
  {
    id: "edge-9",
    sourceId: "mem-type-strict",
    targetId: "mem-latency-sla",
    type: "related to",
    reason: "Strict static typing enables zero-overhead compile optimizations required to maintain the sub-15ms recall SLA.",
  },
  {
    id: "edge-10",
    sourceId: "mem-exec-cadence",
    targetId: "mem-obsidian-ds",
    type: "influenced by",
    reason: "Executive communication cadence inspired the high-contrast, distraction-free monochrome Obsidian visual identity.",
  },
  {
    id: "edge-11",
    sourceId: "mem-agent-sync",
    targetId: "mem-sprint-review",
    type: "mentioned in",
    reason: "Multi-agent memory synchronization benchmarks were presented and reviewed during the engineering sprint demo.",
  },
  {
    id: "edge-12",
    sourceId: "mem-anticipatory",
    targetId: "mem-tri-store",
    type: "part of",
    reason: "Anticipatory retrieval queries the hybrid tri-store ahead of time based on editor cursor coordinates.",
  },
  {
    id: "edge-13",
    sourceId: "mem-anticipatory",
    targetId: "mem-episodic-comp",
    type: "influenced by",
    reason: "Predictive retrieval models use compressed episodic knowledge triples to rank relevant candidate files.",
  },
  {
    id: "edge-14",
    sourceId: "mem-cross-entropy",
    targetId: "mem-latency-sla",
    type: "influenced by",
    reason: "Cross-entropy rerankers are capped at 10 candidate memories to guarantee latency stays well under 15ms.",
  },
  {
    id: "edge-15",
    sourceId: "mem-agent-harness",
    targetId: "mem-logit-masking",
    type: "derived from",
    reason: "Logit masking preserves KV-cache locality across agent execution steps without tool unloading.",
  },
  {
    id: "edge-16",
    sourceId: "mem-paper-aesthetic",
    targetId: "mem-obsidian-ds",
    type: "part of",
    reason: "Combines tactile paper restraint and deep charcoal drafting backgrounds for midnight focus.",
  },
  {
    id: "edge-17",
    sourceId: "mem-decay-pass",
    targetId: "mem-episodic-comp",
    type: "related to",
    reason: "Autonomous pruning cycles operate in tandem with episodic compression to eliminate stale token bloat.",
  },
];



// ════════════════════════════════════════════════════════════════════════════
// 5. TEXTURE GENERATORS (HIGH PRECISION ASTRONOMICAL CORONAS & DIFFRACTION SPIKES)
// ════════════════════════════════════════════════════════════════════════════

function createStarTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;

  // Ultra-crisp diamond optical star with tight Airy diffraction disc
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.08, "rgba(255, 255, 255, 0.98)");
  gradient.addColorStop(0.20, "rgba(255, 250, 240, 0.75)");
  gradient.addColorStop(0.40, "rgba(245, 235, 220, 0.32)");
  gradient.addColorStop(0.68, "rgba(215, 195, 175, 0.07)");
  gradient.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createDiffractionSpikeTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  ctx.clearRect(0, 0, size, size);

  const coreGrad = ctx.createRadialGradient(c, c, 0, c, c, 38);
  coreGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  coreGrad.addColorStop(0.2, "rgba(255, 245, 220, 0.85)");
  coreGrad.addColorStop(0.5, "rgba(255, 225, 175, 0.35)");
  coreGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  const hGrad = ctx.createLinearGradient(0, c, size, c);
  hGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  hGrad.addColorStop(0.42, "rgba(255, 245, 220, 0.45)");
  hGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
  hGrad.addColorStop(0.58, "rgba(255, 245, 220, 0.45)");
  hGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, c - 1.2, size, 2.4);

  const vGrad = ctx.createLinearGradient(c, 0, c, size);
  vGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  vGrad.addColorStop(0.42, "rgba(255, 245, 220, 0.45)");
  vGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
  vGrad.addColorStop(0.58, "rgba(255, 245, 220, 0.45)");
  vGrad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = vGrad;
  ctx.fillRect(c - 1.2, 0, 2.4, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createGalacticBulgeTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  const grad = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.08, "rgba(255, 248, 230, 0.95)");
  grad.addColorStop(0.24, "rgba(255, 225, 170, 0.62)");
  grad.addColorStop(0.48, "rgba(242, 120, 40, 0.22)");
  grad.addColorStop(0.74, "rgba(180, 80, 25, 0.05)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ════════════════════════════════════════════════════════════════════════════
// 6. MAIN COMPONENT: LIVING MEMORY GALAXY
// ════════════════════════════════════════════════════════════════════════════

interface AiMemoryGalaxySectionProps {
  className?: string;
}

export function AiMemoryGalaxySection({
  className = "",
}: AiMemoryGalaxySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Selection & Filter State
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const labelContainerRef = useRef<HTMLDivElement>(null);

  // Deep Cosmos Companion Galaxies State
  const [selectedGalaxyId, setSelectedGalaxyId] = useState<string | null>(null);

  // Interactive Controls & Toggles State
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [driftSpeed, setDriftSpeed] = useState<0.5 | 1 | 2>(1);
  const [showFilaments, setShowFilaments] = useState(true);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState<number>(145);

  // Camera & Orbit State with Frame-Rate Independent Delta Damping
  const cameraStateRef = useRef({
    yaw: 0.65,
    pitch: 0.52,
    radius: 145,
    targetYaw: 0.65,
    targetPitch: 0.52,
    targetRadius: 145,
    minRadius: 0.05,     // Infinite micro zoom into star surfaces
    maxRadius: Infinity, // Completely unbounded infinite macro zoom out

    lookAt: new THREE.Vector3(0, 0, 0),
    targetLookAt: new THREE.Vector3(0, 0, 0),

    yawVelocity: 0,
    pitchVelocity: 0,
    isDragging: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    lastPinchDistance: 0,

    autoRotate: true,
  });

  // Stable references for 60-120fps render loop
  const isAutoRotatingRef = useRef(true);
  const driftSpeedRef = useRef<number>(1);
  const showFilamentsRef = useRef(true);
  const lastReportedAltitude = useRef<number>(145);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  useEffect(() => {
    driftSpeedRef.current = driftSpeed;
  }, [driftSpeed]);

  useEffect(() => {
    showFilamentsRef.current = showFilaments;
  }, [showFilaments]);

  // Active Selection Reference for 60-120fps Animation Loop
  const selectionRef = useRef<{
    selectedId: string | null;
    neighborIds: Set<string>;
    activeEdgeIds: Set<string>;
    clusterId: string | null;
  }>({
    selectedId: null,
    neighborIds: new Set(),
    activeEdgeIds: new Set(),
    clusterId: null,
  });

  // Calculate connected neighbours and edges
  const { selectedMemory, relatedConnections, neighborIdSet } = useMemo(() => {
    if (!selectedMemoryId) {
      return { selectedMemory: null, relatedConnections: [], neighborIdSet: new Set<string>() };
    }
    const mem = DEMO_MEMORIES.find((m) => m.id === selectedMemoryId) || null;
    const connections: { edge: GraphEdge; otherNode: MemoryNode; direction: "incoming" | "outgoing" }[] = [];


    const neighbors = new Set<string>();

    GRAPH_EDGES.forEach((edge) => {
      if (edge.sourceId === selectedMemoryId) {
        const target = DEMO_MEMORIES.find((m) => m.id === edge.targetId);
        if (target) {
          connections.push({ edge, otherNode: target, direction: "outgoing" });
          neighbors.add(target.id);
        }
      } else if (edge.targetId === selectedMemoryId) {
        const source = DEMO_MEMORIES.find((m) => m.id === edge.sourceId);
        if (source) {
          connections.push({ edge, otherNode: source, direction: "incoming" });
          neighbors.add(source.id);
        }
      }
    });

    return { selectedMemory: mem, relatedConnections: connections, neighborIdSet: neighbors };
  }, [selectedMemoryId]);

  // Selected Cluster
  const selectedCluster = useMemo(() => {
    if (!selectedClusterId) return null;
    return TOPIC_CLUSTERS.find((c) => c.id === selectedClusterId) || null;
  }, [selectedClusterId]);

  // Selected Companion Galaxy (Deep Cosmos)
  const selectedGalaxy = useMemo(() => {
    if (!selectedGalaxyId) return null;
    return COMPANION_GALAXIES.find((g) => g.id === selectedGalaxyId) || null;
  }, [selectedGalaxyId]);

  // Update selection ref for 3D shaders and lines
  useEffect(() => {
    const activeEdgeIds = new Set<string>();
    if (selectedMemoryId) {
      GRAPH_EDGES.forEach((edge) => {
        if (edge.sourceId === selectedMemoryId || edge.targetId === selectedMemoryId) {
          activeEdgeIds.add(edge.id);
        }
      });
    }
    selectionRef.current = {
      selectedId: selectedMemoryId,
      neighborIds: neighborIdSet,
      activeEdgeIds,
      clusterId: selectedClusterId,
    };
  }, [selectedMemoryId, neighborIdSet, selectedClusterId]);

  // Reset to full galaxy view
  const handleResetView = useCallback(() => {
    spaceSoundscape.playGlideTransition();
    setSelectedMemoryId(null);
    setSelectedClusterId(null);
    setSelectedGalaxyId(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsTourActive(false);

    const s = cameraStateRef.current;
    s.targetLookAt.set(0, 0, 0);
    s.targetRadius = 145;
    s.targetYaw = 0.65;
    s.targetPitch = 0.52;
    s.autoRotate = isAutoRotatingRef.current;
  }, []);

  // Focus on a companion galaxy (Deep cosmos Discovery documentary view)
  const handleSelectGalaxy = useCallback((galaxyId: string) => {
    const gal = COMPANION_GALAXIES.find((g) => g.id === galaxyId);
    if (!gal) return;
    spaceSoundscape.playGlideTransition();

    setSelectedGalaxyId(galaxyId);
    setSelectedMemoryId(null);
    setSelectedClusterId(null);
    setIsTourActive(false);

    const s = cameraStateRef.current;
    s.targetLookAt.copy(gal.center);
    s.targetRadius = gal.radius * 1.35;
    s.targetPitch = 0.52;
    s.autoRotate = false;
  }, []);

  // Focus on a specific memory star
  const handleSelectMemory = useCallback((memoryId: string) => {
    const target = DEMO_MEMORIES.find((m) => m.id === memoryId);
    if (!target) return;

    const clusterIdx = TOPIC_CLUSTERS.findIndex((c) => c.id === target.clusterId);
    spaceSoundscape.playNodePulse(clusterIdx !== -1 ? clusterIdx : 0, 1);

    setSelectedMemoryId(memoryId);
    setSelectedClusterId(null);
    setIsSearchOpen(false);

    const s = cameraStateRef.current;
    s.targetLookAt.copy(target.anchor);
    s.targetRadius = Math.max(30, s.radius * 0.36);
    s.autoRotate = false;
  }, []);

  // Focus on a galaxy cluster / spiral arm
  const handleSelectCluster = useCallback((clusterId: string) => {
    const cluster = TOPIC_CLUSTERS.find((c) => c.id === clusterId);
    if (!cluster) return;

    spaceSoundscape.playGlideTransition();

    setSelectedClusterId(clusterId);
    setSelectedMemoryId(null);
    setIsSearchOpen(false);
    setIsTourActive(false);

    const s = cameraStateRef.current;
    s.targetLookAt.copy(cluster.centroid);
    s.targetRadius = 60;
    s.autoRotate = false;
  }, []);

  // Smooth Infinite Zoom In
  const handleZoomIn = useCallback(() => {
    const s = cameraStateRef.current;
    s.targetRadius = Math.max(0.05, s.targetRadius * 0.65);
    spaceSoundscape.playGlideTransition();
  }, []);

  // Smooth Infinite Zoom Out (Unbounded)
  const handleZoomOut = useCallback(() => {
    const s = cameraStateRef.current;
    s.targetRadius = s.targetRadius * 1.55;
    spaceSoundscape.playGlideTransition();
  }, []);

  // Toggle Auto-Rotation
  const handleToggleAutoRotate = useCallback(() => {
    setIsAutoRotating((prev) => {
      const next = !prev;
      isAutoRotatingRef.current = next;
      cameraStateRef.current.autoRotate = next;
      return next;
    });
  }, []);

  // Cycle Drift Speed (0.5x -> 1.0x -> 2.0x)
  const handleCycleSpeed = useCallback(() => {
    setDriftSpeed((prev) => {
      const next = prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5;
      driftSpeedRef.current = next;
      return next;
    });
  }, []);

  // Toggle Gravitational Filaments
  const handleToggleFilaments = useCallback(() => {
    setShowFilaments((prev) => {
      const next = !prev;
      showFilamentsRef.current = next;
      return next;
    });
  }, []);

  // Guided Landmark Tour
  const handleStartTour = useCallback(() => {
    setIsTourActive(true);
    setTourIndex(0);
    handleSelectMemory(LANDMARK_TOUR_IDS[0]);
  }, [handleSelectMemory]);

  const handleNextTourStop = useCallback(() => {
    const nextIdx = (tourIndex + 1) % LANDMARK_TOUR_IDS.length;
    setTourIndex(nextIdx);
    handleSelectMemory(LANDMARK_TOUR_IDS[nextIdx]);
  }, [tourIndex, handleSelectMemory]);

  const handlePrevTourStop = useCallback(() => {
    const prevIdx = (tourIndex - 1 + LANDMARK_TOUR_IDS.length) % LANDMARK_TOUR_IDS.length;
    setTourIndex(prevIdx);
    handleSelectMemory(LANDMARK_TOUR_IDS[prevIdx]);
  }, [tourIndex, handleSelectMemory]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];


    const q = searchQuery.toLowerCase().trim();
    return DEMO_MEMORIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  // ════════════════════════════════════════════════════════════════════════════
  // 7. THREE.JS LIVING GALAXY ENGINE (ANDROMEDA SPIRAL ARCHITECTURE)
  // ════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.05,
      2000000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x020205, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Shared Textures
    const starTexture = createStarTexture();
    const spikeTexture = createDiffractionSpikeTexture();
    const coreBulgeTexture = createGalacticBulgeTexture();

    // ── A. CENTRAL GALACTIC BULGE (SUPERMASSIVE KNOWLEDGE NUCLEUS) ──
    const coreGroup = new THREE.Group();

    // 1. Brilliant nuclear point starlight
    const innerCoreMat = new THREE.SpriteMaterial({
      map: starTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerCoreSprite = new THREE.Sprite(innerCoreMat);
    innerCoreSprite.scale.set(22, 22, 1);
    coreGroup.add(innerCoreSprite);

    // 2. Dense central bulge glow (warm cream & amber)
    const coreMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xffeed0,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreSprite = new THREE.Sprite(coreMat);
    coreSprite.scale.set(48, 48, 1);
    coreGroup.add(coreSprite);

    // 3. Barred bulge elliptical glow (stretched along x-axis)
    const barMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xf8cc84,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const barSprite = new THREE.Sprite(barMat);
    barSprite.scale.set(88, 52, 1);
    coreGroup.add(barSprite);

    // 4. Wide atmospheric galactic halo (Maximem orange starlight warmth)
    const haloMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xf26522,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(135, 135, 1);
    coreGroup.add(haloSprite);

    // 5. Vast outer diffuse milky haze
    const outerHazeMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xd67232,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerHazeSprite = new THREE.Sprite(outerHazeMat);
    outerHazeSprite.scale.set(195, 195, 1);
    coreGroup.add(outerHazeSprite);

    scene.add(coreGroup);

    // ── B. AUTHENTIC MILKY WAY & DEEP COSMOS MULTI-GALAXY STELLAR POPULATION (106,000 PARTICLES) ──
    // Milky Way (Barred Bulge + 4 Spiral Arms + Great Rift + Halo) + Andromeda (M31 + M32) + Triangulum (M33) + Magellanic Clouds + Hubble Deep Field
    const totalParticles = 106000;
    const positions = new Float32Array(totalParticles * 3);
    const baseColors = new Float32Array(totalParticles * 3);
    const particleSizes = new Float32Array(totalParticles);
    const particleSpeeds = new Float32Array(totalParticles);

    // Astronomical stellar population color palette
    const colNuclearWhite = new THREE.Color(0xffffff);
    const colBrilliantCore = new THREE.Color(0xfff5e6);
    const colWarmAmber = new THREE.Color(0xfde4b0);
    const colGoldenCream = new THREE.Color(0xf7d399);
    const colWarmApricot = new THREE.Color(0xf5bb7d);
    const colMaximemOrange = new THREE.Color(0xf26522);
    const colSilverWhite = new THREE.Color(0xecf2f8);
    const colDiamondBlue = new THREE.Color(0xcbe3ff);
    const colSoftBlue = new THREE.Color(0x9fc0e6);
    const colMidnightBlue = new THREE.Color(0x6a8eb8);
    const colDustGlow = new THREE.Color(0x422013);
    const colDustSepia = new THREE.Color(0x281510);
    const colLavender = new THREE.Color(0xd8b4fe);
    const colCyanGlow = new THREE.Color(0x38bdf8);
    const colRedshiftAmber = new THREE.Color(0xfb923c);

    // Box-Muller normal distribution for realistic stellar density falloff
    const randn = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const armsCount = 4;
    const spiralCurvature = 0.255;
    const barAngle = 0.42; // ~24 deg barred core tilt matching Milky Way morphology
    const cosB = Math.cos(barAngle);
    const sinB = Math.sin(barAngle);

    for (let i = 0; i < totalParticles; i++) {
      const p = new THREE.Vector3();
      let col = colSilverWhite;
      let size = 1.2;
      let speedFactor = 1.0;

      if (i < 20000) {
        // 1. DENSE BARRED BULGE & NUCLEAR CORE (20,000 stars)
        // High core density + barred triaxial elongation along bar angle
        const rT = Math.pow(Math.random(), 2.85);
        const dist = rT * 22.0;
        const theta = Math.random() * Math.PI * 2.0;
        const phi = (Math.random() - 0.5) * Math.PI * 0.65;

        const x0 = Math.cos(theta) * Math.cos(phi) * dist * 1.68;
        const y0 = Math.sin(phi) * dist * 0.42 + randn() * 0.32;
        const z0 = Math.sin(theta) * Math.cos(phi) * dist * 0.74;

        // Rotate along Milky Way bar orientation
        p.x = x0 * cosB - z0 * sinB;
        p.y = y0;
        p.z = x0 * sinB + z0 * cosB;

        if (dist < 4.2) {
          col = Math.random() > 0.4 ? colNuclearWhite : colBrilliantCore;
          size = 1.8 + Math.random() * 1.4;
        } else if (dist < 9.5) {
          const r = Math.random();
          col = r > 0.55 ? colWarmAmber : r > 0.22 ? colGoldenCream : colNuclearWhite;
          size = 1.45 + Math.random() * 0.9;
        } else if (dist < 16.5) {
          const r = Math.random();
          col = r > 0.52 ? colGoldenCream : r > 0.25 ? colWarmApricot : colSilverWhite;
          size = 1.15 + Math.random() * 0.7;
        } else {
          col = Math.random() > 0.5 ? colWarmAmber : colSilverWhite;
          size = 0.95 + Math.random() * 0.6;
        }
        speedFactor = 1.45;
      } else if (i < 58000) {
        // 2. 4 MAJOR LOGARITHMIC SPIRAL ARMS + ORION SPURS (38,000 stars)
        const armIndex = i % armsCount;
        let armAngleOffset = (armIndex * 2.0 * Math.PI) / armsCount;

        // 16% secondary spurs (Orion-Cygnus & Carina inter-arm branches)
        const isSpur = Math.random() < 0.16;
        if (isSpur) {
          armAngleOffset += Math.random() > 0.5 ? 0.36 : -0.36;
        }

        const rT = Math.pow(Math.random(), 1.35);
        const radius = isSpur ? 18.0 + rT * 48.0 : 9.5 + rT * 78.5;
        const spiralAngle = armAngleOffset + Math.log(radius / 9.0) / spiralCurvature;

        const armSpread = (1.05 + radius * 0.13) * (0.65 + Math.random() * 0.45);
        p.x = Math.cos(spiralAngle) * radius + randn() * armSpread;
        p.y = randn() * (0.85 + radius * 0.036) * (Math.random() * 0.8 + 0.2);
        p.z = Math.sin(spiralAngle) * radius + randn() * armSpread;

        // Clustered star-forming OB associations (brilliant knots along spiral arms)
        if (i % 19 === 0) {
          col = Math.random() > 0.4 ? colNuclearWhite : colDiamondBlue;
          size = 2.1 + Math.random() * 1.1;
        } else if (radius < 24.0) {
          col = Math.random() > 0.42 ? colWarmAmber : colSilverWhite;
          size = 1.25 + Math.random() * 0.7;
        } else if (radius < 52.0) {
          const r = Math.random();
          col = r > 0.5 ? colDiamondBlue : r > 0.25 ? colSilverWhite : (r > 0.08 ? colSoftBlue : colMaximemOrange);
          size = 1.1 + Math.random() * 0.65;
        } else {
          const r = Math.random();
          col = r > 0.48 ? colDiamondBlue : r > 0.22 ? colSoftBlue : colMidnightBlue;
          size = 0.95 + Math.random() * 0.55;
        }
        speedFactor = Math.sqrt(28.0 / Math.max(radius, 9.5));
      } else if (i < 68000) {
        // 3. THE GREAT RIFT & DARK DUST ABSORPTION LANES (10,000 dust particles)
        // Silhouetted along inner edge of spiral arms
        const armIndex = i % armsCount;
        const armAngleOffset = (armIndex * 2.0 * Math.PI) / armsCount - 0.18;
        const rT = Math.pow(Math.random(), 1.25);
        const radius = 12.0 + rT * 62.0;
        const spiralAngle = armAngleOffset + Math.log(radius / 11.0) / spiralCurvature;

        p.x = Math.cos(spiralAngle) * radius + randn() * 1.5;
        p.y = randn() * 0.65;
        p.z = Math.sin(spiralAngle) * radius + randn() * 1.5;

        col = Math.random() > 0.35 ? colDustGlow : colDustSepia;
        size = 2.2 + Math.random() * 1.2;
        speedFactor = Math.sqrt(28.0 / Math.max(radius, 10.0));
      } else if (i < 73500) {
        // 4. OUTER FLARED DISK & STELLAR HALO (5,500 stars)
        const theta = Math.random() * Math.PI * 2.0;
        const rT = Math.pow(Math.random(), 1.4);
        const radius = 22.0 + rT * 84.0;

        p.x = Math.cos(theta) * radius + randn() * 3.4;
        p.y = randn() * (1.6 + radius * 0.075);
        p.z = Math.sin(theta) * radius + randn() * 3.4;

        col = Math.random() > 0.5 ? colSilverWhite : colSoftBlue;
        size = 0.9 + Math.random() * 0.55;
        speedFactor = Math.sqrt(28.0 / Math.max(radius, 14.0));
      } else if (i < 75000) {
        // 5. DEEP COSMIC FIELD STARS (1,500 stars)
        const theta = Math.random() * Math.PI * 2.0;
        const phi = (Math.random() - 0.5) * Math.PI;
        const dist = 260.0 + Math.random() * 260.0;

        p.set(
          Math.cos(theta) * Math.cos(phi) * dist,
          Math.sin(phi) * dist,
          Math.sin(theta) * Math.cos(phi) * dist
        );
        col = Math.random() > 0.6 ? colSilverWhite : colDiamondBlue;
        size = 0.85 + Math.random() * 0.5;
        speedFactor = 0.0;
      } else if (i < 91000) {
        // 6. ANDROMEDA GALAXY (M31) & M32 DWARF COMPANION (16,000 STARS)
        // Positioned at (-360, 130, -410) with 77° inclination tilt
        const m31Center = new THREE.Vector3(-360, 130, -410);
        const idx = i - 75000;
        let lx = 0;
        let ly = 0;
        let lz = 0;

        if (idx < 600) {
          // M32 Companion Dwarf Elliptical Galaxy (dense cluster at offset)
          const rDwarf = Math.pow(Math.random(), 2.2) * 8.5;
          const thD = Math.random() * Math.PI * 2;
          const phD = (Math.random() - 0.5) * Math.PI;
          lx = 16.0 + Math.cos(thD) * Math.cos(phD) * rDwarf;
          ly = 8.0 + Math.sin(phD) * rDwarf * 0.75;
          lz = -20.0 + Math.sin(thD) * Math.cos(phD) * rDwarf;
          col = Math.random() > 0.5 ? colWarmAmber : colGoldenCream;
          size = 0.95 + Math.random() * 0.55;
        } else if (idx < 4200) {
          // M31 Massive Golden Bulge & Nucleus (3,600 stars)
          const rBulge = Math.pow(Math.random(), 2.6) * 20.0;
          const thB = Math.random() * Math.PI * 2;
          const phB = (Math.random() - 0.5) * Math.PI * 0.65;
          lx = Math.cos(thB) * Math.cos(phB) * rBulge * 1.55;
          ly = Math.sin(phB) * rBulge * 0.42 + randn() * 0.28;
          lz = Math.sin(thB) * Math.cos(phB) * rBulge * 0.72;
          col = rBulge < 4.5 ? colNuclearWhite : rBulge < 11 ? colBrilliantCore : colWarmAmber;
          size = 1.35 + Math.random() * 0.8;
        } else if (idx < 14600) {
          // M31 Grand Dual Logarithmic Spiral Arms (10,400 stars)
          const arm = idx % 2;
          const armAngleOffset = arm * Math.PI;
          const rT = Math.pow(Math.random(), 1.25);
          const rad = 13.5 + rT * 84.0;
          const spiralAngle = armAngleOffset + Math.log(rad / 13.0) / 0.28;
          const armWidth = (1.15 + rad * 0.08) * (0.68 + Math.random() * 0.48);

          lx = Math.cos(spiralAngle) * rad + randn() * armWidth;
          ly = randn() * (0.8 + rad * 0.024);
          lz = Math.sin(spiralAngle) * rad + randn() * armWidth;

          if (idx % 22 === 0) {
            col = colNuclearWhite;
            size = 2.0 + Math.random() * 0.9;
          } else if (rad < 30.0) {
            col = Math.random() > 0.4 ? colWarmAmber : colDiamondBlue;
            size = 1.1 + Math.random() * 0.6;
          } else {
            const r = Math.random();
            col = r > 0.48 ? colDiamondBlue : r > 0.24 ? colSoftBlue : colSilverWhite;
            size = 0.95 + Math.random() * 0.55;
          }
        } else {
          // M31 Dark Dust Absorption Filaments (1,400 dust grains)
          const arm = idx % 2;
          const armAngleOffset = arm * Math.PI - 0.22;
          const rT = Math.pow(Math.random(), 1.2);
          const rad = 15.0 + rT * 66.0;
          const spiralAngle = armAngleOffset + Math.log(rad / 14.0) / 0.28;

          lx = Math.cos(spiralAngle) * rad + randn() * 1.8;
          ly = randn() * 0.6;
          lz = Math.sin(spiralAngle) * rad + randn() * 1.8;
          col = colDustGlow;
          size = 1.9 + Math.random() * 0.9;
        }

        // Apply M31 77° inclination tilt matrix:
        const cosInc = Math.cos(1.344);
        const sinInc = Math.sin(1.344);
        const cosPA = Math.cos(0.61);
        const sinPA = Math.sin(0.61);

        const rx = lx * cosPA - lz * sinPA;
        const rz = lx * sinPA + lz * cosPA;
        const ry = ly;

        p.x = m31Center.x + rx;
        p.y = m31Center.y + (ry * cosInc - rz * sinInc);
        p.z = m31Center.z + (ry * sinInc + rz * cosInc);
        speedFactor = 0.0;
      } else if (i < 99000) {
        // 7. TRIANGULUM GALAXY (M33) - 8,000 STARS
        // Face-on flocculent starburst spiral at (310, -95, -340)
        const m33Center = new THREE.Vector3(310, -95, -340);
        const idx = i - 91000;
        let lx = 0;
        let ly = 0;
        let lz = 0;

        if (idx < 1200) {
          // Triangulum diffuse nucleus
          const rN = Math.pow(Math.random(), 2.2) * 11.0;
          const thN = Math.random() * Math.PI * 2;
          lx = Math.cos(thN) * rN;
          ly = (Math.random() - 0.5) * 3.0;
          lz = Math.sin(thN) * rN;
          col = Math.random() > 0.4 ? colWarmAmber : colNuclearWhite;
          size = 1.25 + Math.random() * 0.7;
        } else {
          // Flocculent multi-arm starburst spiral
          const arm = idx % 3;
          const armOffset = (arm * 2 * Math.PI) / 3.0;
          const rT = Math.pow(Math.random(), 1.3);
          const rad = 6.5 + rT * 48.0;
          const spAngle = armOffset + Math.log(rad / 6.0) / 0.38;
          const spread = (1.1 + rad * 0.11) * (0.6 + Math.random() * 0.55);

          lx = Math.cos(spAngle) * rad + randn() * spread;
          ly = randn() * (0.9 + rad * 0.032);
          lz = Math.sin(spAngle) * rad + randn() * spread;

          // H II giant starburst nurseries (like NGC 604)
          if (idx % 16 === 0) {
            col = Math.random() > 0.5 ? colCyanGlow : colLavender;
            size = 2.1 + Math.random() * 1.0;
          } else {
            const r = Math.random();
            col = r > 0.55 ? colDiamondBlue : r > 0.28 ? colLavender : colSilverWhite;
            size = 0.95 + Math.random() * 0.55;
          }
        }

        const cosM33 = Math.cos(0.94);
        const sinM33 = Math.sin(0.94);
        p.x = m33Center.x + lx;
        p.y = m33Center.y + (ly * cosM33 - lz * sinM33);
        p.z = m33Center.z + (ly * sinM33 + lz * cosM33);
        speedFactor = 0.0;
      } else if (i < 103800) {
        // 8. LARGE & SMALL MAGELLANIC CLOUDS (LMC & SMC) - 4,800 STARS
        const idx = i - 99000;
        if (idx < 3400) {
          // Large Magellanic Cloud (LMC) centered at (-85, -155, 175)
          const lmcCenter = new THREE.Vector3(-85, -155, 175);
          const r = Math.pow(Math.random(), 1.4) * 28.0;
          const th = Math.random() * Math.PI * 2;
          const ph = (Math.random() - 0.5) * 0.85;

          let lx = Math.cos(th) * r * 1.4;
          let ly = Math.sin(ph) * r * 0.45;
          let lz = Math.sin(th) * r * 0.75;

          if (idx < 250) {
            // Tarantula Nebula 30 Doradus energetic starburst
            lx += 8.5 + randn() * 2.2;
            ly += 1.5 + randn() * 1.2;
            lz -= 5.0 + randn() * 2.2;
            col = Math.random() > 0.5 ? colNuclearWhite : colWarmApricot;
            size = 1.9 + Math.random() * 1.1;
          } else {
            col = Math.random() > 0.45 ? colSilverWhite : colDiamondBlue;
            size = 0.9 + Math.random() * 0.55;
          }

          p.set(lmcCenter.x + lx, lmcCenter.y + ly, lmcCenter.z + lz);
        } else {
          // Small Magellanic Cloud (SMC) centered at (105, -195, 135)
          const smcCenter = new THREE.Vector3(105, -195, 135);
          const r = Math.pow(Math.random(), 1.6) * 16.0;
          const th = Math.random() * Math.PI * 2;
          const ph = (Math.random() - 0.5) * 1.1;

          p.set(
            smcCenter.x + Math.cos(th) * Math.cos(ph) * r * 1.2,
            smcCenter.y + Math.sin(ph) * r * 0.65,
            smcCenter.z + Math.sin(th) * Math.cos(ph) * r * 0.9
          );
          col = Math.random() > 0.5 ? colSilverWhite : colSoftBlue;
          size = 0.85 + Math.random() * 0.5;
        }
        speedFactor = 0.0;
      } else {
        // 9. HUBBLE DEEP FIELD GALAXIES (2,200 stars forming 14 distant galactic knots)
        // Discovery Channel deep field view across 750 to 2400 AU
        const idx = i - 103800;
        const knotIndex = idx % 14;
        const seedAngle = knotIndex * 2.39996;
        const knotDist = 850.0 + (knotIndex % 6) * 260.0;
        const knotTheta = seedAngle;
        const knotPhi = ((knotIndex % 5) - 2) * 0.32;

        const kCenterX = Math.cos(knotTheta) * Math.cos(knotPhi) * knotDist;
        const kCenterY = Math.sin(knotPhi) * knotDist;
        const kCenterZ = Math.sin(knotTheta) * Math.cos(knotPhi) * knotDist;

        const knotRadius = 14.0 + (knotIndex % 4) * 6.0;
        const rK = Math.pow(Math.random(), 2.0) * knotRadius;
        const thK = Math.random() * Math.PI * 2;

        p.set(
          kCenterX + Math.cos(thK) * rK,
          kCenterY + (Math.random() - 0.5) * rK * 0.45,
          kCenterZ + Math.sin(thK) * rK
        );

        if (knotIndex % 3 === 0) {
          col = colRedshiftAmber;
          size = 0.9 + Math.random() * 0.55;
        } else if (knotIndex % 3 === 1) {
          col = colGoldenCream;
          size = 0.85 + Math.random() * 0.5;
        } else {
          col = colDiamondBlue;
          size = 0.8 + Math.random() * 0.45;
        }
        speedFactor = 0.0;
      }

      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      baseColors[i * 3 + 0] = col.r;
      baseColors[i * 3 + 1] = col.g;
      baseColors[i * 3 + 2] = col.b;

      particleSizes[i] = size;
      particleSpeeds[i] = speedFactor;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("baseColor", new THREE.BufferAttribute(baseColors, 3));
    particlesGeometry.setAttribute("particleSize", new THREE.BufferAttribute(particleSizes, 1));
    particlesGeometry.setAttribute("speedFactor", new THREE.BufferAttribute(particleSpeeds, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStarTexture: { value: starTexture },
        uHoveredPos: { value: new THREE.Vector3(-1000, -1000, -1000) },
        uOrangeColor: { value: colMaximemOrange },
        uDimming: { value: 0.0 },
      },
      vertexShader: `
        attribute vec3 baseColor;
        attribute float particleSize;
        attribute float speedFactor;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vOrange;

        uniform float uTime;
        uniform vec3 uHoveredPos;
        uniform vec3 uOrangeColor;
        uniform float uDimming;

        void main() {
          vColor = baseColor;

          float driftSpeed = 0.016 * speedFactor;
          float angle = uTime * driftSpeed;
          float cosA = cos(angle);
          float sinA = sin(angle);

          vec3 transformed = position;
          if (speedFactor > 0.05) {
            float rx = transformed.x * cosA - transformed.z * sinA;
            float rz = transformed.x * sinA + transformed.z * cosA;
            transformed.x = rx;
            transformed.z = rz;
          }

          float pulse = sin(uTime * 0.8 + length(position) * 0.08) * 0.12;
          transformed += normalize(transformed + vec3(0.001)) * pulse;

          float distToHover = length(transformed - uHoveredPos);
          float orangeVal = 0.0;
          if (distToHover < 14.0) {
            orangeVal = (1.0 - distToHover / 14.0) * 0.75;
          }
          vOrange = clamp(orangeVal, 0.0, 1.0);

          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float dist = max(-mvPosition.z, 0.05);
          float pSize = particleSize;
          if (vOrange > 0.1) pSize *= 1.4;

          // Crisp astronomical stellar disc scaling:
          // Clamped tightly so close stars NEVER turn into 120px blurred fuzzy blobs
          // Instead, every single particle remains a crisp, distinct, jewel-like diamond star!
          float pScale = 280.0 / max(dist, 1.8);
          if (dist < 25.0) {
            pScale = (280.0 / 25.0) * pow(25.0 / max(dist, 0.4), 0.38);
          }
          gl_PointSize = clamp(pSize * pScale, 0.75, 18.0);

          // Soft near-plane clip fade so particles don't pop when camera passes right through them
          float nearClipFade = smoothstep(0.04, 0.28, dist);
          vAlpha = nearClipFade;
        }
      `,
      fragmentShader: `
        uniform sampler2D uStarTexture;
        uniform vec3 uOrangeColor;
        uniform float uDimming;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vOrange;

        void main() {
          vec4 texColor = texture2D(uStarTexture, gl_PointCoord);
          if (texColor.a < 0.015) discard;

          vec3 finalColor = mix(vColor, uOrangeColor, vOrange);
          finalColor += vec3(pow(texColor.r, 2.2) * 0.38);

          float finalAlpha = texColor.a * vAlpha;
          finalAlpha = mix(finalAlpha, finalAlpha * 0.28, uDimming);

          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // ── C. REAL MEMORY STAR NODES (INTERACTIVE STARS) ──
    const nodeMeshes: {
      starSprite: THREE.Sprite;
      spikeSprite?: THREE.Sprite;
      proxyMesh: THREE.Mesh;
      item: MemoryNode;
    }[] = [];



    const starsGroup = new THREE.Group();
    const proxyGroup = new THREE.Group();

    const proxyGeo = new THREE.SphereGeometry(3.8, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    DEMO_MEMORIES.forEach((item) => {
      const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
      const starCol = cluster ? cluster.colorThree : new THREE.Color(0xffffff);

      const sMat = new THREE.SpriteMaterial({
        map: starTexture,
        color: starCol,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const starSprite = new THREE.Sprite(sMat);
      starSprite.position.copy(item.anchor);
      const starScale = item.isAnchor ? 7.5 : 4.8;
      starSprite.scale.set(starScale, starScale, 1);
      starsGroup.add(starSprite);

      let spikeSprite: THREE.Sprite | undefined;
      if (item.isAnchor) {
        const spikeMat = new THREE.SpriteMaterial({
          map: spikeTexture,
          color: 0xfff3d6,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        spikeSprite = new THREE.Sprite(spikeMat);
        spikeSprite.position.copy(item.anchor);
        spikeSprite.scale.set(15, 15, 1);
        starsGroup.add(spikeSprite);
      }

      const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
      proxyMesh.position.copy(item.anchor);
      proxyMesh.userData = { memory: item, starSprite, spikeSprite };
      proxyGroup.add(proxyMesh);

      nodeMeshes.push({ starSprite, spikeSprite, proxyMesh, item });
    });

    scene.add(starsGroup);
    scene.add(proxyGroup);

    // ── D. GRAVITATIONAL FILAMENTS ──
    const edgeMeshes: {
      line: THREE.Line;
      edge: GraphEdge;
      curvePoints: THREE.Vector3[];


    }[] = [];



    const curveResolution = 20;

    GRAPH_EDGES.forEach((edge) => {
      const m1 = DEMO_MEMORIES.find((m) => m.id === edge.sourceId);
      const m2 = DEMO_MEMORIES.find((m) => m.id === edge.targetId);
      if (!m1 || !m2) return;

      const p1 = m1.anchor;
      const p2 = m2.anchor;
      const chord = new THREE.Vector3().subVectors(p2, p1);
      const chordLen = chord.length();

      const tangent = chord.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      let perp = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (perp.lengthSq() < 0.01) {
        perp = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
      }

      const archHeight = Math.min(2.8, chordLen * 0.09);
      const controlPoint = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5)
        .addScaledVector(perp, archHeight);

      const points: THREE.Vector3[] = [];


      for (let step = 0; step <= curveResolution; step++) {
        const t = step / curveResolution;
        const pt = new THREE.Vector3()
          .copy(p1)
          .multiplyScalar((1 - t) * (1 - t))
          .addScaledVector(controlPoint, 2 * (1 - t) * t)
          .addScaledVector(p2, t * t);
        points.push(pt);
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x4f5869,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      edgeMeshes.push({
        line,
        edge,
        curvePoints: points,
      });
    });

    // ── E. TRAVELING RECALL PHOTONS ──
    const photonCount = 14;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 2.8,
      color: 0xf26522,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const photonsMesh = new THREE.Points(photonGeo, photonMat);
    scene.add(photonsMesh);

    // ── F. COMPANION GALAXY TARGETS ──
    const galaxyProxies: THREE.Mesh[] = [];
    COMPANION_GALAXIES.forEach((gal) => {
      const gProxyGeo = new THREE.SphereGeometry(gal.radius * 0.55, 8, 8);
      const gProxy = new THREE.Mesh(gProxyGeo, proxyMat);
      gProxy.position.copy(gal.center);
      gProxy.userData = { isGalaxy: true, galaxyId: gal.id };
      scene.add(gProxy);
      galaxyProxies.push(gProxy);
    });

    // Raycaster & Projections
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    const tempVec = new THREE.Vector3();
    let pendingHoverNodeId: string | null = null;

    // ════════════════════════════════════════════════════════════════════════
    // 8. 60-120FPS ANIMATION LOOP WITH FRAME-RATE-INDEPENDENT SMOOTHING
    // ════════════════════════════════════════════════════════════════════════

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      particlesMaterial.uniforms.uTime.value = time;

      const s = cameraStateRef.current;
      const sel = selectionRef.current;

      // Smooth dimming
      const targetDimming = sel.selectedId ? 0.72 : 0.0;
      particlesMaterial.uniforms.uDimming.value = THREE.MathUtils.lerp(
        particlesMaterial.uniforms.uDimming.value,
        targetDimming,
        0.08
      );

      // Distance from camera to the galactic center (0, 0, 0)
      const distToCore = Math.hypot(camera.position.x, camera.position.y, camera.position.z);

      // Atmospheric bulge fade curve based on camera distance
      // When zooming deep inside (distToCore < 45), diffuse haze sprites completely dissolve!
      // This eliminates the "blurred orange blob" when inspecting close stars and core particles!
      const hazeAlpha = THREE.MathUtils.smoothstep(distToCore, 35.0, 110.0);
      const haloAlpha = THREE.MathUtils.smoothstep(distToCore, 24.0, 85.0);
      const barAlpha = THREE.MathUtils.smoothstep(distToCore, 15.0, 60.0);
      const coreAlpha = THREE.MathUtils.smoothstep(distToCore, 8.0, 38.0);

      const coreBreath = 1.0 + Math.sin(time * 0.9) * 0.055;

      // Inner core resolves into a tight, crisp stellar singularity when flying inside
      const innerCoreScale = Math.min(22.0, Math.max(0.6, distToCore * 0.22));
      innerCoreSprite.scale.set(
        innerCoreScale * (1.0 + Math.sin(time * 1.3) * 0.04),
        innerCoreScale * (1.0 + Math.sin(time * 1.3) * 0.04),
        1
      );
      innerCoreMat.opacity = Math.min(1.0, THREE.MathUtils.smoothstep(distToCore, 0.4, 18.0) * 0.95 + 0.05);

      coreSprite.scale.set(48 * coreBreath, 48 * coreBreath, 1);
      coreMat.opacity = 0.95 * coreAlpha;

      barSprite.scale.set(88 * coreBreath, 52 * (1.0 + Math.cos(time * 0.75) * 0.04), 1);
      barMat.opacity = 0.65 * barAlpha;

      haloSprite.scale.set(135 * coreBreath, 135 * coreBreath, 1);
      haloMat.opacity = 0.38 * haloAlpha;

      outerHazeSprite.scale.set(195 * (1.0 + Math.sin(time * 0.45) * 0.03), 195 * (1.0 + Math.sin(time * 0.45) * 0.03), 1);
      outerHazeMat.opacity = 0.18 * hazeAlpha;

      // Smooth Auto-rotation drift
      if (isAutoRotatingRef.current && s.autoRotate) {
        s.targetYaw += delta * 0.045 * driftSpeedRef.current;
      }

      // Smooth inertia damping on rotation release
      if (!s.isDragging) {
        s.targetYaw += s.yawVelocity;
        s.targetPitch += s.pitchVelocity;
        const inertiaDamp = 1.0 - Math.exp(-delta * 8.0);
        s.yawVelocity = THREE.MathUtils.lerp(s.yawVelocity, 0, inertiaDamp);
        s.pitchVelocity = THREE.MathUtils.lerp(s.pitchVelocity, 0, inertiaDamp);
      }

      // Constrain pitch
      s.targetPitch = Math.max(-0.25, Math.min(1.42, s.targetPitch));

      // Frame-rate independent delta-timed critically damped smoothing
      const dampFactor = 1.0 - Math.exp(-delta * 7.5);
      s.yaw = THREE.MathUtils.lerp(s.yaw, s.targetYaw, dampFactor);
      s.pitch = THREE.MathUtils.lerp(s.pitch, s.targetPitch, dampFactor);
      s.radius = THREE.MathUtils.lerp(s.radius, s.targetRadius, dampFactor);
      s.lookAt.lerp(s.targetLookAt, dampFactor);

      // Spherical camera positioning
      const cy = Math.sin(s.pitch) * s.radius;
      const horizontalR = Math.cos(s.pitch) * s.radius;
      const cx = Math.sin(s.yaw) * horizontalR;
      const cz = Math.cos(s.yaw) * horizontalR;

      camera.position.set(cx + s.lookAt.x, cy + s.lookAt.y, cz + s.lookAt.z);
      camera.lookAt(s.lookAt);

      // Periodic altitude notification for micro or macro distances
      if (Math.abs(s.radius - lastReportedAltitude.current) > (s.radius < 10 ? 0.05 : 1.0)) {
        lastReportedAltitude.current = s.radius;
        setCurrentAltitude(s.radius < 10 ? Number(s.radius.toFixed(2)) : Math.round(s.radius));
      }

      // Update individual memory star scales & coronas
      nodeMeshes.forEach(({ starSprite, spikeSprite, item }) => {
        const isSel = sel.selectedId === item.id;
        const isNeighbor = sel.neighborIds.has(item.id);
        const isHovered = hoveredMemoryId === item.id;
        const isInCluster = sel.clusterId ? item.clusterId === sel.clusterId : true;

        const baseScale = item.isAnchor ? 7.5 : 4.8;
        let scaleMult = 1.0;
        let targetOpacity = 0.92;

        if (sel.selectedId) {
          if (isSel) {
            scaleMult = 1.75;
            targetOpacity = 1.0;
            starSprite.material.color.setHex(0xf26522);
          } else if (isNeighbor) {
            scaleMult = 1.35;
            targetOpacity = 0.95;
            starSprite.material.color.setHex(0xffe2b8);
          } else {
            scaleMult = 0.75;
            targetOpacity = 0.22;
            const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
            starSprite.material.color.copy(cluster ? cluster.colorThree : new THREE.Color(0xffffff));
          }
        } else if (isHovered) {
          scaleMult = 1.45;
          targetOpacity = 1.0;
          starSprite.material.color.setHex(0xf26522);
        } else if (sel.clusterId) {
          if (isInCluster) {
            scaleMult = 1.25;
            targetOpacity = 1.0;
          } else {
            scaleMult = 0.7;
            targetOpacity = 0.25;
          }
          const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
          starSprite.material.color.copy(cluster ? cluster.colorThree : new THREE.Color(0xffffff));
        } else {
          const twinkle = 1.0 + Math.sin(time * 2.2 + item.anchor.x * 0.4) * 0.12;
          scaleMult = twinkle;
          const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
          starSprite.material.color.copy(cluster ? cluster.colorThree : new THREE.Color(0xffffff));
        }

        const distToStar = camera.position.distanceTo(item.anchor);
        // Distance-adaptive scale compensation so close stars stay crisp and don't overwhelm the camera
        const closeDistFactor = Math.min(1.0, Math.max(0.24, distToStar / 28.0));
        const finalScale = baseScale * scaleMult * closeDistFactor;
        starSprite.scale.set(finalScale, finalScale, 1);
        starSprite.material.opacity = THREE.MathUtils.lerp(
          starSprite.material.opacity,
          targetOpacity,
          0.1
        );

        if (spikeSprite) {
          const spikeScale = finalScale * 2.0;
          spikeSprite.scale.set(spikeScale, spikeScale, 1);
          const spikeAlphaFactor = THREE.MathUtils.smoothstep(distToStar, 4.0, 24.0);
          spikeSprite.material.opacity = THREE.MathUtils.lerp(
            spikeSprite.material.opacity,
            targetOpacity * 0.85 * spikeAlphaFactor,
            0.1
          );
        }
      });

      // Update Gravitational Filaments (Connecting Trails)
      edgeMeshes.forEach(({ line, edge }) => {
        const mat = line.material as THREE.LineBasicMaterial;
        const isConnected =
          sel.selectedId === edge.sourceId ||
          sel.selectedId === edge.targetId ||
          hoveredMemoryId === edge.sourceId ||
          hoveredMemoryId === edge.targetId;

        if (!showFilamentsRef.current) {
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.0, 0.15);
        } else if (isConnected) {
          mat.color.setHex(0xf26522);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.85, 0.12);
        } else if (sel.selectedId) {
          mat.color.setHex(0x3a404d);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.04, 0.1);
        } else {
          mat.color.setHex(0x4f5869);
          // Gently brighten filaments on deep zoom into memory constellations
          const zoomFilamentBoost = THREE.MathUtils.lerp(0.48, 0.18, Math.min(1.0, s.radius / 90.0));
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, zoomFilamentBoost, 0.08);
        }
      });

      // Update Traveling Photons
      const activeEdges = edgeMeshes.filter(
        (e) =>
          showFilamentsRef.current &&
          (sel.selectedId === e.edge.sourceId ||
            sel.selectedId === e.edge.targetId ||
            hoveredMemoryId === e.edge.sourceId ||
            hoveredMemoryId === e.edge.targetId)
      );

      const pArr = photonPos;
      for (let i = 0; i < photonCount; i++) {
        if (activeEdges.length > 0) {
          const targetEdge = activeEdges[i % activeEdges.length];


          const tCycle = (time * 0.8 + i * 0.28) % 1.0;
          const sampleIdx = Math.floor(tCycle * (targetEdge.curvePoints.length - 1));
          const pt = targetEdge.curvePoints[sampleIdx];


          pArr[i * 3 + 0] = pt.x;
          pArr[i * 3 + 1] = pt.y;
          pArr[i * 3 + 2] = pt.z;
        } else {
          pArr[i * 3 + 0] = -1000;
          pArr[i * 3 + 1] = -1000;
          pArr[i * 3 + 2] = -1000;
        }
      }
      photonGeo.attributes.position.needsUpdate = true;

      // Update 3D Floating Memory Star Labels (Memory Graph emergence on deep zoom)
      if (labelContainerRef.current) {
        const labels = labelContainerRef.current.children;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const showLabels = s.radius < 110;

        for (let i = 0; i < DEMO_MEMORIES.length; i++) {
          const el = labels[i] as HTMLElement;
          if (!el) continue;
          if (!showLabels) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            continue;
          }

          const mem = DEMO_MEMORIES[i];


          const distToCam = camera.position.distanceTo(mem.anchor);

          // Only display labels for stars in reasonable view range
          if (distToCam > 125.0 || distToCam < 0.6) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            continue;
          }

          tempVec.copy(mem.anchor).project(camera);

          // Check if in front of camera (-1 to 1 clip space)
          if (tempVec.z > 0 && tempVec.z < 1 && Math.abs(tempVec.x) < 0.95 && Math.abs(tempVec.y) < 0.95) {
            const sx = (tempVec.x * 0.5 + 0.5) * width;
            const sy = (-tempVec.y * 0.5 + 0.5) * height;

            // Opacity curve: fades in gracefully as you zoom in close
            const alpha = Math.min(1.0, Math.max(0.0, (105.0 - distToCam) / 55.0));
            el.style.transform = `translate3d(${sx}px, ${sy}px, 0px) translate(-50%, -140%)`;
            el.style.opacity = String(alpha * 0.95);
            el.style.display = "block";
            el.style.pointerEvents = "auto";
          } else {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // ───────────────────────────────────────────────────────────────────────────
    // 9. POINTER, TOUCH & KEYBOARD NAVIGATION
    // ───────────────────────────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      s.isDragging = true;
      s.isPanning = e.button === 2 || e.shiftKey || e.button === 1;
      s.dragStartX = e.clientX;
      s.dragStartY = e.clientY;
      s.yawVelocity = 0;
      s.pitchVelocity = 0;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      const rect = canvas.getBoundingClientRect();

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (s.isDragging) {
        const dx = e.clientX - s.dragStartX;
        const dy = e.clientY - s.dragStartY;
        s.dragStartX = e.clientX;
        s.dragStartY = e.clientY;

        if (s.isPanning) {
          // Pan camera in camera's view plane for particle-by-particle deep exploration
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const up = camera.up.clone().normalize();

          const panFactor = Math.max(0.005, s.radius * 0.0018);
          s.targetLookAt.addScaledVector(right, -dx * panFactor);
          s.targetLookAt.addScaledVector(up, dy * panFactor);
          return;
        }

        const rotSpeed = 0.0055;
        s.targetYaw -= dx * rotSpeed;
        s.targetPitch += dy * rotSpeed;

        s.yawVelocity = -dx * rotSpeed * 0.35;
        s.pitchVelocity = dy * rotSpeed * 0.35;
        return;
      }

      raycaster.setFromCamera(mouse, camera);

      // Raycast memory star proxies
      const intersects = raycaster.intersectObjects(
        nodeMeshes.map((m) => m.proxyMesh)
      );

      if (intersects.length > 0) {
        const hitProxy = intersects[0].object as THREE.Mesh;
        const memoryItem = hitProxy.userData.memory as MemoryNode;
        const starSprite = hitProxy.userData.starSprite as THREE.Sprite;

        if (pendingHoverNodeId !== memoryItem.id) {
          pendingHoverNodeId = memoryItem.id;
          const clusterIdx = TOPIC_CLUSTERS.findIndex((c) => c.id === memoryItem.clusterId);
          spaceSoundscape.playNodePulse(clusterIdx !== -1 ? clusterIdx : 0, 0);
        }

        setHoveredMemoryId(memoryItem.id);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        particlesMaterial.uniforms.uHoveredPos.value.copy(starSprite.position);
      } else {
        pendingHoverNodeId = null;
        setHoveredMemoryId(null);
        setTooltipPos(null);
        particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      s.isDragging = false;
      s.isPanning = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = cameraStateRef.current;

      const delta = Math.abs(e.deltaY);
      const zoomFactor = Math.pow(1.0018, Math.min(delta, 120));
      if (e.deltaY > 0) {
        // Infinite Zoom Out - completely unbounded
        s.targetRadius = s.targetRadius * zoomFactor;
      } else {
        // Infinite Zoom In - down to micro 0.05 scale
        s.targetRadius = Math.max(0.05, s.targetRadius / zoomFactor);
      }
    };

    const onClick = (e: MouseEvent) => {
      const s = cameraStateRef.current;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 1. Raycast memory stars
      const intersects = raycaster.intersectObjects(
        nodeMeshes.map((m) => m.proxyMesh)
      );

      if (intersects.length > 0) {
        const hitProxy = intersects[0].object as THREE.Mesh;
        const memoryItem = hitProxy.userData.memory as MemoryNode;
        handleSelectMemory(memoryItem.id);
        return;
      }

      // 2. Raycast companion galaxies
      const galaxyIntersects = raycaster.intersectObjects(galaxyProxies);
      if (galaxyIntersects.length > 0) {
        const hit = galaxyIntersects[0].object as THREE.Mesh;
        const galaxyId = hit.userData.galaxyId as string;
        handleSelectGalaxy(galaxyId);
        return;
      }

      // 3. Click near any star particle to glide camera directly to that particle!
      raycaster.params.Points = { threshold: Math.max(0.8, s.radius * 0.02) };
      const particleIntersects = raycaster.intersectObject(particlesMesh);
      if (particleIntersects.length > 0 && particleIntersects[0].point) {
        const pt = particleIntersects[0].point;
        s.targetLookAt.copy(pt);
        s.targetRadius = Math.max(5.0, s.radius * 0.38);
        spaceSoundscape.playGlideTransition();
        return;
      }

      if (selectedMemoryId || selectedClusterId || selectedGalaxyId) {
        spaceSoundscape.playGlideTransition();
      }
      setSelectedMemoryId(null);
      setSelectedClusterId(null);
      setSelectedGalaxyId(null);
      setIsTourActive(false);
    };

    const onDblClick = () => {
      handleResetView();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "0") {
        handleResetView();
      } else if (e.key === " " && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        handleToggleAutoRotate();
      } else if ((e.key === "+" || e.key === "=") && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.key === "-" || e.key === "_") && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === "ArrowRight" && isTourActive) {
        e.preventDefault();
        handleNextTourStop();
      } else if (e.key === "ArrowLeft" && isTourActive) {
        e.preventDefault();
        handlePrevTourStop();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];


        const t2 = e.touches[1];


        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        const s = cameraStateRef.current;
        if (s.lastPinchDistance > 0) {
          const delta = dist - s.lastPinchDistance;
          const factor = Math.exp(-delta * 0.006);
          s.targetRadius = Math.max(0.05, s.targetRadius * factor);
        }
        s.lastPinchDistance = dist;
      }
    };

    const onTouchEnd = () => {
      cameraStateRef.current.lastPinchDistance = 0;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      starTexture.dispose();
      spikeTexture.dispose();
      coreBulgeTexture.dispose();
      proxyGeo.dispose();
      proxyMat.dispose();
      edgeMeshes.forEach((e) => {
        e.line.geometry.dispose();
        (e.line.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [
    handleResetView,
    handleSelectMemory,
    handleSelectGalaxy,
    handleToggleAutoRotate,
    handleZoomIn,
    handleZoomOut,
    handleNextTourStop,
    handlePrevTourStop,
    isTourActive,
    hoveredMemoryId,
    selectedGalaxyId,
    selectedClusterId,
    selectedMemoryId,
  ]);

  // Current hovered memory node
  const hoveredNode = useMemo(() => {
    if (!hoveredMemoryId) return null;
    return DEMO_MEMORIES.find((m) => m.id === hoveredMemoryId) || null;
  }, [hoveredMemoryId]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden bg-[#020205] select-none font-sans text-white ${className}`}
    >
      {/* ── 3D WebGL Canvas ── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none bg-transparent outline-none"
        tabIndex={0}
        aria-label="Maximem Living Galaxy Memory Universe"
      />

      {/* ── 3D FLOATING MEMORY STAR LABELS (EMERGE ON CLOSE INSPECTION) ── */}
      <div
        ref={labelContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      >
        {DEMO_MEMORIES.map((item) => {
          const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
          return (
            <div
              key={item.id}
              data-memory-id={item.id}
              className="absolute top-0 left-0 transition-opacity duration-150 pointer-events-auto cursor-pointer"
              style={{ opacity: 0, display: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectMemory(item.id);
              }}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0b10]/90 backdrop-blur-md border border-white/10 hover:border-[#f26522]/50 hover:bg-[#0e1017] shadow-[0_4px_16px_rgba(0,0,0,0.7)] group transition-all">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: cluster?.colorHex || "#ffffff",
                    boxShadow: `0 0 6px ${cluster?.colorHex || "#ffffff"}`,
                  }}
                />
                <span className="text-[10px] font-mono font-medium text-white/90 group-hover:text-white whitespace-nowrap tracking-tight">
                  {item.title}
                </span>
                {item.isAnchor && (
                  <span className="text-[9px] text-[#f26522] font-mono">✦</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TOP NAV & CONSTELLATION CLUSTER PILLS ── */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Galaxy Constellations Navigation */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <button
            onClick={handleResetView}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all backdrop-blur-xl border ${
              !selectedMemoryId && !selectedClusterId && !selectedGalaxyId && !isTourActive
                ? "bg-white text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                : "bg-[#0b0c10]/85 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            <Orbit className="size-3 text-[#f26522]" />
            <span>Full Galaxy View</span>
          </button>

          {/* Andromeda Galaxy Shortcut */}
          <button
            onClick={() => handleSelectGalaxy("galaxy-andromeda")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all whitespace-nowrap backdrop-blur-xl border ${
              selectedGalaxyId === "galaxy-andromeda"
                ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_4px_18px_rgba(59,130,246,0.35)]"
                : "bg-[#0b0c10]/85 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            <Sparkles className="size-3 text-[#93c5fd]" />
            <span>🌌 Andromeda (M31)</span>
          </button>

          {/* Triangulum Galaxy Shortcut */}
          <button
            onClick={() => handleSelectGalaxy("galaxy-triangulum")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all whitespace-nowrap backdrop-blur-xl border ${
              selectedGalaxyId === "galaxy-triangulum"
                ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-[0_4px_18px_rgba(139,92,246,0.35)]"
                : "bg-[#0b0c10]/85 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            <Sparkles className="size-3 text-[#c4b5fd]" />
            <span>✨ Triangulum (M33)</span>
          </button>

          {TOPIC_CLUSTERS.map((cluster) => {
            const isActive = selectedClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => handleSelectCluster(cluster.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all whitespace-nowrap backdrop-blur-xl border ${
                  isActive
                    ? "bg-[#f26522] text-white border-[#f26522] shadow-[0_4px_18px_rgba(242,101,34,0.35)]"
                    : "bg-[#0b0c10]/85 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? "#ffffff" : cluster.colorHex,
                  }}
                />
                <span>{cluster.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Instant Star Search & Quick Actions */}
        <div className="pointer-events-auto flex items-center gap-2 relative">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0b0c10]/90 backdrop-blur-xl border border-white/15 focus-within:border-[#f26522] transition-colors shadow-lg">
              <Search className="size-3.5 text-[#a1a1aa]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search galaxy stars... (/)"
                className="bg-transparent text-xs text-white placeholder-[#71717a] outline-none w-44 md:w-56 font-normal"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="text-[#a1a1aa] hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl bg-[#0e0f14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_50px_rgba(0,0,0,0.85)] p-2 z-50">
                <div className="text-[10px] font-mono uppercase text-[#71717a] px-2 py-1 flex items-center justify-between">
                  <span>Matching Memory Stars</span>
                  <span className="text-[#f26522] font-semibold">{searchResults.length}</span>
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectMemory(result.id)}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors flex flex-col gap-0.5 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-white group-hover:text-[#f26522] transition-colors flex items-center gap-1.5">
                        {result.isAnchor && <Star className="size-2.5 fill-[#f26522] text-[#f26522]" />}
                        {result.title}
                      </span>
                      <span className="text-[9px] font-mono text-[#a1a1aa]">
                        {result.topic}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a1a1aa] line-clamp-1">
                      {result.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(selectedMemoryId || selectedClusterId || selectedGalaxyId || isTourActive) && (
            <button
              onClick={handleResetView}
              className="px-2.5 py-1.5 rounded-full bg-[#0b0c10]/90 backdrop-blur-xl border border-white/15 hover:border-white/30 text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1.5 transition-colors shadow-lg"
              title="Reset View (Esc)"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── GUIDED TOUR ACTIVE BANNER (TOP-CENTER) ── */}
      {isTourActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full bg-[#0b0c10]/95 backdrop-blur-2xl border border-[#f26522]/40 shadow-[0_12px_32px_rgba(242,101,34,0.25)] animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2">
            <Route className="size-3.5 text-[#f26522] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
              Landmark {tourIndex + 1} of {LANDMARK_TOUR_IDS.length}
            </span>
          </div>

          <span className="w-[1px] h-3.5 bg-white/20" />

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevTourStop}
              className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title="Previous Landmark (Left Arrow)"
            >
              <ArrowLeft className="size-3.5" />
            </button>
            <button
              onClick={handleNextTourStop}
              className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title="Next Landmark (Right Arrow)"
            >
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <span className="w-[1px] h-3.5 bg-white/20" />

          <button
            onClick={handleResetView}
            className="text-[#a1a1aa] hover:text-white text-[10px] font-mono uppercase hover:underline"
          >
            End Tour
          </button>
        </div>
      )}

      {/* ── MINIMAL COMPACT PREVIEW TOOLTIP (ON HOVER) ── */}
      {hoveredNode && tooltipPos && !selectedMemoryId && (
        <div
          className="fixed pointer-events-none z-50 px-4 py-3 rounded-xl bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_16px_36px_rgba(0,0,0,0.85)] text-left max-w-[300px] -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in zoom-in-95 duration-150 space-y-2"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 14}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#f26522]" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#f26522] font-semibold">
                {hoveredNode.topic}
              </span>
            </div>
            {hoveredNode.isAnchor && (
              <span className="text-[9px] font-mono text-zinc-400">
                ✦ Landmark
              </span>
            )}
          </div>
          <div className="text-[13px] font-medium text-white leading-snug">
            {hoveredNode.title}
          </div>
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {hoveredNode.description}
          </p>
          <div className="text-[10px] text-zinc-500 flex items-center justify-between font-mono pt-0.5">
            <span className="truncate max-w-[160px]">{hoveredNode.source}</span>
            <span className="text-[#f26522] font-medium">Inspect →</span>
          </div>
        </div>
      )}

      {/* ── COMPREHENSIVE MEMORY DETAIL PANEL (ON STAR SELECTION) ── */}
      {selectedMemory && (
        <div className="absolute bottom-16 right-4 z-40 max-w-[400px] w-full p-5 rounded-2xl bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#f26522] shadow-[0_0_8px_#f26522]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
                {selectedMemory.topic}
              </span>
              {selectedMemory.isAnchor && (
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  ✦ Landmark
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedMemoryId(null)}
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title="Close Panel"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-[15px] font-semibold text-white leading-snug tracking-tight">
              {selectedMemory.title}
            </h3>
            <p className="text-[12.5px] text-zinc-300/90 leading-relaxed">
              {selectedMemory.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="truncate max-w-[240px]">{selectedMemory.source}</span>
            <span>{selectedMemory.timestamp}</span>
          </div>

          {/* Gravitational Filaments */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <Link2 className="size-3 text-[#f26522]" />
                Gravitational Filaments ({relatedConnections.length})
              </span>
              <span className="text-zinc-600">Click star to glide</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
              {relatedConnections.map(({ edge, otherNode }) => (
                <button
                  key={edge.id}
                  onClick={() => handleSelectMemory(otherNode.id)}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#f26522]/30 transition-all duration-200 group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#f26522]">
                      {edge.type}
                    </span>
                    <ArrowRight className="size-3 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[13px] font-medium text-white group-hover:text-[#f26522] transition-colors leading-snug">
                    {otherNode.title}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                    {edge.reason}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOPIC CLUSTER DETAIL PANEL (ON CLUSTER SELECTION) ── */}
      {selectedCluster && !selectedMemoryId && (
        <div className="absolute bottom-16 right-4 z-40 max-w-[400px] w-full p-5 rounded-2xl bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-[#f26522]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
                Cluster · {selectedCluster.tag}
              </span>
            </div>
            <button
              onClick={() => setSelectedClusterId(null)}
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold text-white leading-snug tracking-tight">
              {selectedCluster.name}
            </h3>
            <p className="text-[12.5px] text-zinc-300/90 leading-relaxed">
              {selectedCluster.description}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Stars in this Constellation (
              {DEMO_MEMORIES.filter((m) => m.clusterId === selectedCluster.id).length})
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-none">
              {DEMO_MEMORIES.filter((m) => m.clusterId === selectedCluster.id).map((mem) => (
                <button
                  key={mem.id}
                  onClick={() => handleSelectMemory(mem.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#f26522]/30 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors flex items-center gap-1.5">
                      {mem.isAnchor && <Star className="size-2.5 fill-[#f26522] text-[#f26522]" />}
                      {mem.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{mem.source}</div>
                  </div>
                  <ArrowRight className="size-3 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANION GALAXY DOSSIER PANEL (DISCOVERY COSMOS DEEP FIELD) ── */}
      {selectedGalaxy && !selectedMemoryId && (
        <div className="absolute bottom-16 right-4 z-40 max-w-[420px] w-full p-5 rounded-2xl bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-[#38bdf8]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#38bdf8] font-semibold">
                {selectedGalaxy.tag}
              </span>
            </div>
            <button
              onClick={() => setSelectedGalaxyId(null)}
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title="Close Dossier"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-[16px] font-semibold text-white leading-snug tracking-tight">
              {selectedGalaxy.name}
            </h3>
            <p className="text-[12.5px] text-zinc-300/90 leading-relaxed">
              {selectedGalaxy.description}
            </p>
          </div>

          {/* Distance & Telemetry */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase text-zinc-500">Distance from Milky Way</span>
              <div className="text-[12px] font-mono font-medium text-white">
                {selectedGalaxy.distanceLy}
              </div>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[9px] font-mono uppercase text-zinc-500">Local Group Member</span>
              <div className="text-[12px] font-mono font-medium text-[#38bdf8]">
                Gravitationally Bound
              </div>
            </div>
          </div>

          {/* Companion Galaxies Navigator */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <span>Deep Cosmos Destinations</span>
              <span className="text-zinc-600">Click to glide</span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={handleResetView}
                className="px-2.5 py-1.5 rounded-lg text-left text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              >
                <Orbit className="size-3 text-[#f26522]" />
                <span>Milky Way</span>
              </button>
              {COMPANION_GALAXIES.map((g) => {
                const isCurrent = g.id === selectedGalaxy.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGalaxy(g.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-[#38bdf8] text-black font-semibold shadow-[0_2px_10px_rgba(56,189,248,0.35)]"
                        : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: isCurrent ? "#000000" : g.colorHex }}
                    />
                    <span>{g.name.split(" (")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM TELEMETRY HUD (BOTTOM-LEFT) ── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden md:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#0b0c10]/85 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
        <div className="flex items-center gap-1.5 text-white/90">
          <Activity className="size-3 text-[#f26522]" />
          <span>FOCAL DISTANCE:</span>
          <span className="font-semibold text-[#f26522]">{currentAltitude.toLocaleString()} AU</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5 text-white/80">
          <span>SECTOR:</span>
          <span className="font-medium text-white">
            {selectedGalaxy
              ? selectedGalaxy.name.toUpperCase()
              : selectedCluster
              ? selectedCluster.name
              : selectedMemory
              ? selectedMemory.topic
              : "MILKY WAY CORE"}
          </span>
        </div>
        <span>•</span>
        <span className="text-[#a1a1aa]">{DEMO_MEMORIES.length} STARS ACTIVE</span>
        <span>•</span>
        <span className="text-[#71717a]">
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">SPACE</kbd> DRIFT
        </span>
        <span>•</span>
        <span className="text-[#71717a]">
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">RIGHT-DRAG</kbd> PAN
        </span>
      </div>

      {/* ── FLOATING GRAPH & GALAXY CONTROLS DOCK (BOTTOM-RIGHT) ── */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto flex items-center gap-1 p-1 rounded-full bg-[#0b0c10]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.65)] text-white/80">
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="size-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="size-3.5" />
        </button>

        {/* Fit to View / Full Overview */}
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors"
          title="Fit Galaxy to View (0 / Esc)"
        >
          <Maximize2 className="size-3.5" />
        </button>

        {/* Reset Camera Angle */}
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors"
          title="Reset Andromeda Angle"
        >
          <RotateCcw className="size-3.5" />
        </button>

        <span className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* Auto-Rotation Drift Toggle */}
        <button
          onClick={handleToggleAutoRotate}
          className={`p-2 rounded-full transition-colors ${
            isAutoRotating
              ? "text-[#f26522] bg-[#f26522]/15"
              : "opacity-40 hover:opacity-100 hover:bg-white/10"
          }`}
          title="Toggle Galactic Drift (Space)"
        >
          {isAutoRotating ? <Compass className="size-3.5" /> : <Play className="size-3.5" />}
        </button>

        {/* Drift Speed Toggle (0.5x, 1x, 2x) */}
        <button
          onClick={handleCycleSpeed}
          className="px-2 py-1 rounded-full hover:bg-white/10 text-[9px] font-mono text-[#a1a1aa] hover:text-white transition-colors"
          title="Cycle Drift Speed"
        >
          {driftSpeed}x
        </button>

        {/* Filaments Toggle */}
        <button
          onClick={handleToggleFilaments}
          className={`p-2 rounded-full transition-colors ${
            showFilaments
              ? "text-[#f26522] bg-[#f26522]/15"
              : "opacity-40 hover:opacity-100 hover:bg-white/10"
          }`}
          title="Toggle Gravitational Filaments"
        >
          <Layers className="size-3.5" />
        </button>

        {/* Guided Tour Toggle */}
        <button
          onClick={isTourActive ? handleResetView : handleStartTour}
          className={`px-2.5 py-1.5 rounded-full flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
            isTourActive
              ? "bg-[#f26522] text-white font-semibold shadow-[0_2px_10px_rgba(242,101,34,0.35)]"
              : "text-[#a1a1aa] hover:text-white hover:bg-white/10"
          }`}
          title="Start Guided Landmark Tour"
        >
          <Route className="size-3" />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>
    </div>
  );
}

export const AiMemoryVisualizationSection = AiMemoryGalaxySection;
export default AiMemoryGalaxySection;
