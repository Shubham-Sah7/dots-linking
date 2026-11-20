"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
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
import { SpaceSoundToggle } from "@/components/space-sound-toggle";

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

function createMemoryNodeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Refined natural stellar luminosity with soft chromatic falloff (calm, elegant, not overblown)
  const grad = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.12, "rgba(255, 255, 255, 0.92)");
  grad.addColorStop(0.28, "rgba(255, 250, 245, 0.58)");
  grad.addColorStop(0.55, "rgba(250, 240, 230, 0.16)");
  grad.addColorStop(0.80, "rgba(235, 220, 205, 0.03)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

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

  // Luminous pearl-white to Maximem brand orange core falloff
  const grad = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.08, "rgba(255, 248, 230, 0.96)");
  grad.addColorStop(0.24, "rgba(255, 225, 170, 0.62)");
  grad.addColorStop(0.48, "rgba(242, 101, 34, 0.22)"); // Maximem Brand Orange (#f26522)
  grad.addColorStop(0.72, "rgba(200, 75, 18, 0.05)");
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
    radius: 160,
    targetYaw: 0.65,
    targetPitch: 0.52,
    targetRadius: 160,
    minRadius: 0.04,     // Infinite micro zoom into star surfaces
    maxRadius: Infinity, // Completely unbounded infinite macro zoom out

    lookAt: new THREE.Vector3(0, 0, 0),
    targetLookAt: new THREE.Vector3(0, 0, 0),

    parallaxYaw: 0,
    parallaxPitch: 0,

    yawVelocity: 0,
    pitchVelocity: 0,
    isDragging: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    lastPinchDistance: 0,

    autoRotate: true,
  });

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lastAltitudeUpdateMs = useRef<number>(0);
  const lastUserInteractionTime = useRef<number>(0);

  // Stable references for 60-120fps render loop
  const isAutoRotatingRef = useRef(true);
  const driftSpeedRef = useRef<number>(1);
  const showFilamentsRef = useRef(true);
  const lastReportedAltitude = useRef<number>(160);

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
    spaceSoundscape.playGlideTransition("out");
    setSelectedMemoryId(null);
    setSelectedClusterId(null);
    setSelectedGalaxyId(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsTourActive(false);

    const s = cameraStateRef.current;
    s.targetLookAt.set(0, 0, 0);
    s.targetRadius = 160;
    s.targetYaw = 0.65;
    s.targetPitch = 0.52;
    s.autoRotate = isAutoRotatingRef.current;
  }, []);

  // Focus on a companion galaxy (Deep cosmos Discovery documentary view)
  const handleSelectGalaxy = useCallback((galaxyId: string) => {
    const gal = COMPANION_GALAXIES.find((g) => g.id === galaxyId);
    if (!gal) return;

    let screenX = 0;
    if (cameraRef.current) {
      const proj = gal.center.clone().project(cameraRef.current);
      screenX = THREE.MathUtils.clamp(proj.x, -1.0, 1.0);
    }
    spaceSoundscape.playClusterBloom(2, screenX);

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

    let screenX = 0;
    if (cameraRef.current) {
      const proj = target.anchor.clone().project(cameraRef.current);
      screenX = THREE.MathUtils.clamp(proj.x, -1.0, 1.0);
    }

    const clusterIdx = TOPIC_CLUSTERS.findIndex((c) => c.id === target.clusterId);
    spaceSoundscape.playNodePulse(clusterIdx !== -1 ? clusterIdx : 0, screenX, target.isAnchor);

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

    let screenX = 0;
    if (cameraRef.current) {
      const proj = cluster.centroid.clone().project(cameraRef.current);
      screenX = THREE.MathUtils.clamp(proj.x, -1.0, 1.0);
    }

    const clusterIdx = TOPIC_CLUSTERS.findIndex((c) => c.id === clusterId);
    spaceSoundscape.playClusterBloom(clusterIdx !== -1 ? clusterIdx : 0, screenX);

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
    const currentLog = Math.log(Math.max(0.01, s.radius));
    let targetLog = Math.log(Math.max(0.01, s.targetRadius));
    if (currentLog - targetLog > 0.85) targetLog = currentLog - 0.85;
    targetLog -= 0.45;
    s.targetRadius = Math.max(0.04, Math.exp(targetLog));
    spaceSoundscape.playZoomSweep("in");
  }, []);

  // Smooth Infinite Zoom Out (Unbounded)
  const handleZoomOut = useCallback(() => {
    const s = cameraStateRef.current;
    const currentLog = Math.log(Math.max(0.01, s.radius));
    let targetLog = Math.log(Math.max(0.01, s.targetRadius));
    if (targetLog - currentLog > 0.85) targetLog = currentLog + 0.85;
    targetLog += 0.45;
    s.targetRadius = Math.max(0.04, Math.exp(targetLog));
    spaceSoundscape.playZoomSweep("out");
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
    cameraRef.current = camera;

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
    const nodeTexture = createMemoryNodeTexture();
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
    innerCoreSprite.scale.set(24, 24, 1);
    coreGroup.add(innerCoreSprite);

    // 2. Dense central bulge glow (pearl-white with warm champagne rim)
    const coreMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xfff5e6,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreSprite = new THREE.Sprite(coreMat);
    coreSprite.scale.set(54, 54, 1);
    coreGroup.add(coreSprite);

    // 3. Barred bulge elliptical glow (stretched along galaxy bar orientation)
    const barMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xf8cc84,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const barSprite = new THREE.Sprite(barMat);
    barSprite.scale.set(92, 46, 1);
    coreGroup.add(barSprite);

    // 4. Celestial polar light jet (warm diamond-gold vertical flare column)
    const jetMat = new THREE.SpriteMaterial({
      map: spikeTexture,
      color: 0xffeed5,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const jetSprite = new THREE.Sprite(jetMat);
    jetSprite.scale.set(11, 130, 1);
    coreGroup.add(jetSprite);

    // 5. Atmospheric galactic halo (Maximem brand warm amber-orange starlight)
    const haloMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(155, 155, 1);
    coreGroup.add(haloSprite);

    // 6. Outer diffuse cosmic haze (rich Maximem brand orange)
    const outerHazeMat = new THREE.SpriteMaterial({
      map: coreBulgeTexture,
      color: 0xf26522,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerHazeSprite = new THREE.Sprite(outerHazeMat);
    outerHazeSprite.scale.set(230, 230, 1);
    coreGroup.add(outerHazeSprite);

    scene.add(coreGroup);

    // ── B. AUTHENTIC MILKY WAY & DEEP COSMOS MULTI-GALAXY STELLAR POPULATION (125,000 PARTICLES) ──
    // Milky Way (Barred Bulge + 4 Spiral Arms + Great Rift + Halo) + Andromeda (M31 + M32) + Triangulum (M33) + Magellanic Clouds + Hubble Deep Field
    const totalParticles = 125000;
    const positions = new Float32Array(totalParticles * 3);
    const baseColors = new Float32Array(totalParticles * 3);
    const particleSizes = new Float32Array(totalParticles);
    const particleSpeeds = new Float32Array(totalParticles);
    const particlePhases = new Float32Array(totalParticles);
    const particleLayers = new Float32Array(totalParticles);

    // Celestial Grand Design Spiral Palette (matching reference moodboard & Image 2)
    const colMaximemOrange = new THREE.Color(0xf26522);
    const colNuclearWhite = new THREE.Color(0xffffff);
    const colBrilliantCore = new THREE.Color(0xfff8ee);
    const colChampagneGold = new THREE.Color(0xffedd5);
    const colWarmAmber = new THREE.Color(0xfde68a);
    const colGoldenCream = new THREE.Color(0xf7d399);
    const colWarmApricot = new THREE.Color(0xf5bb7d);
    const colSilverWhite = new THREE.Color(0xf8fafc);
    const colDiamondBlue = new THREE.Color(0xe0f2fe);
    const colSoftBlue = new THREE.Color(0x9fc0e6);
    const colMidnightBlue = new THREE.Color(0x6a8eb8);
    const colElectricCyan = new THREE.Color(0x38bdf8);
    const colCyanGlow = new THREE.Color(0x38bdf8);
    const colSoftLavender = new THREE.Color(0xede9fe);
    const colLavender = new THREE.Color(0xd8b4fe);
    const colCosmicViolet = new THREE.Color(0xc4b5fd);
    const colDeepIndigo = new THREE.Color(0x818cf8);
    const colRoyalSapphire = new THREE.Color(0x6366f1);
    const colDustGlow = new THREE.Color(0x281620);
    const colDustSepia = new THREE.Color(0x181024);
    const colMidnightDust = new THREE.Color(0x181024);
    const colSepiaDust = new THREE.Color(0x281620);
    const colRedshiftAmber = new THREE.Color(0xfb923c);

    // Box-Muller normal distribution for realistic stellar density falloff
    const randn = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const barAngle = 0.42; // ~24 deg barred core tilt matching Milky Way morphology
    const cosB = Math.cos(barAngle);
    const sinB = Math.sin(barAngle);

    for (let i = 0; i < totalParticles; i++) {
      const p = new THREE.Vector3();
      let col = colSilverWhite;
      let size = 1.2;
      let speedFactor = 1.0;

      let layerId = 0.0;
      if (i < 24000) layerId = 0.0;
      else if (i < 74000) layerId = 1.0;
      else if (i < 86000) layerId = 2.0;
      else if (i < 92500) layerId = 3.0;
      else if (i < 94000) layerId = 4.0;
      else if (i < 110000) layerId = 5.0;
      else if (i < 118000) layerId = 6.0;
      else if (i < 122800) layerId = 7.0;
      else layerId = 8.0;

      if (i < 24000) {
        // 1. DENSE RADIANT BARRED BULGE & NUCLEAR NUCLEUS (24,000 stars)
        // High core density with smooth exponential falloff & triaxial barred orientation
        const rT = Math.pow(Math.random(), 2.8);
        const dist = rT * 26.0;
        const theta = Math.random() * Math.PI * 2.0;
        const phi = (Math.random() - 0.5) * Math.PI * 0.85;

        // Triaxial barred ellipsoid (elongated along bar angle)
        const x0 = Math.cos(theta) * Math.cos(phi) * dist * 1.75;
        const y0 = Math.sin(phi) * dist * 0.65 + randn() * 0.45;
        const z0 = Math.sin(theta) * Math.cos(phi) * dist * 0.95;

        p.x = x0 * cosB - z0 * sinB;
        p.y = y0;
        p.z = x0 * sinB + z0 * cosB;

        if (dist < 4.5) {
          col = Math.random() > 0.35 ? colNuclearWhite : colBrilliantCore;
          size = 2.2 + Math.random() * 1.5;
        } else if (dist < 11.5) {
          const r = Math.random();
          col = r > 0.45 ? colBrilliantCore : r > 0.20 ? colChampagneGold : colNuclearWhite;
          size = 1.6 + Math.random() * 1.0;
        } else if (dist < 19.5) {
          const r = Math.random();
          col = r > 0.50 ? colChampagneGold : r > 0.22 ? colWarmAmber : colGoldenCream;
          size = 1.35 + Math.random() * 0.75;
        } else {
          col = Math.random() > 0.45 ? colWarmApricot : colMaximemOrange;
          size = 1.15 + Math.random() * 0.65;
        }
        speedFactor = 1.35;
      } else if (i < 74000) {
        // 2. GRAND-DESIGN LOGARITHMIC SPIRAL ARMS (50,000 stars)
        // 2 Dominant Primary Arms (74% of stars) + 2 Secondary Branches (26% of stars)
        const idx = i - 24000;
        const isPrimary = (idx % 100) < 74;

        let armAngleOffset = 0;
        let startRadius = 8.5;
        let endRadius = 140.0;

        if (isPrimary) {
          // 2 Grand Primary Arms winding symmetrically from ends of the core bar
          const primaryIndex = idx % 2;
          armAngleOffset = primaryIndex * Math.PI;
          startRadius = 8.5;
          endRadius = 140.0;
        } else {
          // 2 Secondary Tributary Arms branching at mid-radius
          const secondaryIndex = (idx % 4 < 2) ? 0 : 1;
          armAngleOffset = secondaryIndex * Math.PI + Math.PI * 0.5;
          startRadius = 22.0;
          endRadius = 125.0;
        }

        // Concentrated radial distribution with smooth outwards density taper
        const rT = Math.pow(Math.random(), 1.25);
        const radius = startRadius + rT * (endRadius - startRadius);

        // Pitch parameter b = 0.295 gives ~1.5 full graceful revolutions (exact match to Image 2)
        const pitchB = 0.295;
        const spiralAngle = armAngleOffset + Math.log(radius / startRadius) / pitchB;

        // Direction perpendicular to the spiral arm tangent
        const pitchAngle = Math.atan(pitchB);
        const nx = -Math.sin(spiralAngle + pitchAngle);
        const nz = Math.cos(spiralAngle + pitchAngle);

        // Tangential arm dispersion: 78% dense arm spine + 22% delicate fringe
        const isSpine = Math.random() < 0.78;
        const width = isSpine
          ? (0.60 + Math.pow(radius / 135.0, 1.2) * 3.0)
          : (1.4 + Math.pow(radius / 135.0, 1.0) * 6.2);
        const distAcross = randn() * width;

        p.x = Math.cos(spiralAngle) * radius + nx * distAcross;
        p.z = Math.sin(spiralAngle) * radius + nz * distAcross;

        // Sleek 3D disk thickness & outer S-warp (maintains high-definition arms at 30° pitch)
        const warp = Math.sin(spiralAngle * 0.92 - 0.3) * Math.pow(Math.max(0.0, radius - 40.0) / 95.0, 2.0) * 3.2;
        const diskThickness = 0.45 + Math.pow(radius / 135.0, 1.25) * 1.6;
        p.y = randn() * diskThickness + warp;

        // Luminous Maximem Brand Orange (#f26522) & Golden Amber celestial color zoning
        if (idx % 18 === 0) {
          // Brilliant OB Star Association Knots (diamond starlight)
          col = Math.random() > 0.45 ? colNuclearWhite : colDiamondBlue;
          size = 2.4 + Math.random() * 1.3;
        } else if (radius < 32.0) {
          // Inner Arm: Warm Amber & Golden Cream
          const r = Math.random();
          col = r > 0.52 ? colWarmAmber : r > 0.25 ? colGoldenCream : colSilverWhite;
          size = 1.45 + Math.random() * 0.8;
        } else if (radius < 82.0) {
          // Mid Arm: Maximem Brand Orange (#f26522) & Warm Apricot
          const r = Math.random();
          col = r > 0.48 ? colMaximemOrange : r > 0.24 ? colWarmApricot : (r > 0.10 ? colGoldenCream : colSilverWhite);
          size = 1.28 + Math.random() * 0.7;
        } else {
          // Outer Arm: Maximem Brand Orange, Warm Amber & Starlight
          const r = Math.random();
          col = r > 0.46 ? colMaximemOrange : r > 0.24 ? colWarmAmber : (r > 0.10 ? colWarmApricot : colSilverWhite);
          size = 1.12 + Math.random() * 0.6;
        }
        speedFactor = Math.sqrt(36.0 / Math.max(radius, 12.0));
      } else if (i < 86000) {
        // 3. THE GREAT RIFT & DARK DUST ABSORPTION LANES (12,000 dust particles)
        // Silhouetted tightly along the inner concave edge of the spiral arms
        const idx = i - 74000;
        const armIndex = idx % 2;
        const armAngleOffset = armIndex * Math.PI - 0.14; // inner edge offset

        const rT = Math.pow(Math.random(), 1.2);
        const radius = 12.0 + rT * 105.0;

        const pitchB = 0.295;
        const spiralAngle = armAngleOffset + Math.log(radius / 8.5) / pitchB;

        const pitchAngle = Math.atan(pitchB);
        const nx = -Math.sin(spiralAngle + pitchAngle);
        const nz = Math.cos(spiralAngle + pitchAngle);
        const dustWidth = 0.55 + Math.pow(radius / 110.0, 1.1) * 2.5;
        const distAcross = randn() * dustWidth;

        const warp = Math.sin(spiralAngle * 0.92 - 0.3) * Math.pow(Math.max(0.0, radius - 40.0) / 95.0, 2.0) * 2.6;
        p.x = Math.cos(spiralAngle) * radius + nx * distAcross;
        p.y = randn() * (0.35 + radius * 0.015) + warp;
        p.z = Math.sin(spiralAngle) * radius + nz * distAcross;

        col = Math.random() > 0.4 ? colDustGlow : colDustSepia;
        size = 2.2 + Math.random() * 1.2;
        speedFactor = Math.sqrt(36.0 / Math.max(radius, 13.0));
      } else if (i < 92500) {
        // 4. OUTER FLARED DISK & VOLUMETRIC STELLAR HALO (6,500 stars)
        // Expansive spherical-oblate 3D halo giving deep foreground/background parallax
        const theta = Math.random() * Math.PI * 2.0;
        const rT = Math.pow(Math.random(), 1.4);
        const radius = 24.0 + rT * 155.0;

        p.x = Math.cos(theta) * radius + randn() * 3.5;
        p.y = randn() * (1.2 + radius * 0.045);
        p.z = Math.sin(theta) * radius + randn() * 3.5;

        col = Math.random() > 0.5 ? colSilverWhite : colWarmApricot;
        size = 1.1 + Math.random() * 0.65;
        speedFactor = Math.sqrt(36.0 / Math.max(radius, 18.0));
      } else if (i < 94000) {
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
        size = 0.9 + Math.random() * 0.5;
        speedFactor = 0.0;
      } else if (i < 110000) {
        // 6. ANDROMEDA GALAXY (M31) & M32 DWARF COMPANION (16,000 STARS)
        // Positioned at (-360, 130, -410) with 77° inclination tilt
        const m31Center = new THREE.Vector3(-360, 130, -410);
        const idx = i - 94000;
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
      } else if (i < 118000) {
        // 7. TRIANGULUM GALAXY (M33) - 8,000 STARS
        // Face-on flocculent starburst spiral at (310, -95, -340)
        const m33Center = new THREE.Vector3(310, -95, -340);
        const idx = i - 110000;
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
      } else if (i < 122800) {
        // 8. LARGE & SMALL MAGELLANIC CLOUDS (LMC & SMC) - 4,800 STARS
        const idx = i - 118000;
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
        const idx = i - 122800;
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
      particlePhases[i] = Math.random() * Math.PI * 2.0;
      particleLayers[i] = layerId;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("baseColor", new THREE.BufferAttribute(baseColors, 3));
    particlesGeometry.setAttribute("particleSize", new THREE.BufferAttribute(particleSizes, 1));
    particlesGeometry.setAttribute("speedFactor", new THREE.BufferAttribute(particleSpeeds, 1));
    particlesGeometry.setAttribute("aPhase", new THREE.BufferAttribute(particlePhases, 1));
    particlesGeometry.setAttribute("aLayer", new THREE.BufferAttribute(particleLayers, 1));

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
        attribute float aPhase;
        attribute float aLayer;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vOrange;
        varying float vShimmer;

        uniform float uTime;
        uniform vec3 uHoveredPos;
        uniform vec3 uOrangeColor;
        uniform float uDimming;

        void main() {
          vColor = baseColor;
          vec3 pos = position;

          // ── 1. LAYER-SPECIFIC CONTINUOUS NATURAL COSMIC MOVEMENT ──
          if (aLayer < 3.5) {
            // Milky Way Galaxy (Core, Arms, Dust, Disk)
            float radius = length(pos.xz);

            // Coherent density wave pattern rotation (0.0035 rad/sec) keeps all spiral arms permanently in pattern
            float patternSpeed = 0.0035;
            float angle = uTime * patternSpeed;
            float cosA = cos(angle);
            float sinA = sin(angle);

            float rx = pos.x * cosA - pos.z * sinA;
            float rz = pos.x * sinA + pos.z * cosA;
            pos.x = rx;
            pos.z = rz;

            // Harmonious, coherent cosmic relief wave across the galactic plane (coherent, not chaotic noise)
            float theta = atan(rz, rx);
            float wavePhase = radius * 0.032 - theta * 2.0 - uTime * 0.08;
            pos.y += sin(wavePhase) * 0.22;
          } else if (aLayer > 4.5 && aLayer < 5.5) {
            // Andromeda (M31) Internal Galactic Spiral Rotation around (-360, 130, -410)
            vec3 m31Center = vec3(-360.0, 130.0, -410.0);
            vec3 localP = pos - m31Center;
            float m31Angle = uTime * 0.0035;
            float cosM = cos(m31Angle);
            float sinM = sin(m31Angle);
            float lx = localP.x * cosM - localP.z * sinM;
            float lz = localP.x * sinM + localP.z * cosM;
            pos = m31Center + vec3(lx, localP.y, lz);
          } else if (aLayer > 5.5 && aLayer < 6.5) {
            // Triangulum (M33) Internal Galactic Spiral Rotation around (290, -110, -380)
            vec3 m33Center = vec3(290.0, -110.0, -380.0);
            vec3 localP = pos - m33Center;
            float m33Angle = -uTime * 0.0042;
            float cosT = cos(m33Angle);
            float sinT = sin(m33Angle);
            float lx = localP.x * cosT - localP.z * sinT;
            float lz = localP.x * sinT + localP.z * cosT;
            pos = m33Center + vec3(lx, localP.y, lz);
          } else if (aLayer < 4.5) {
            // Distant background cosmic field stars: gentle floating micro-drift
            pos.y += sin(uTime * 0.12 + aPhase) * 0.14;
          }

          // ── 2. CAMERA PROJECTION & CRISP STELLAR POINT SCALING ──
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float dist = max(-mvPosition.z, 0.05);
          float pSize = particleSize;

          // Gentle Astronomical Stellar Twinkling (brightness shimmer, not jerky size bounce)
          vShimmer = 0.94 + 0.06 * sin(uTime * 1.1 + aPhase * 3.14);

          // Crisp diamond star scaling curve — eliminates blurred blobs on close approach
          float pScale = 315.0 / max(dist, 1.8);
          if (dist < 25.0) {
            pScale = (315.0 / 25.0) * pow(25.0 / max(dist, 0.4), 0.38);
          }
          gl_PointSize = clamp(pSize * pScale, 0.75, 18.5);

          // Near-plane soft clip fade
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
        varying float vShimmer;

        void main() {
          vec4 texColor = texture2D(uStarTexture, gl_PointCoord);
          if (texColor.a < 0.015) discard;

          vec3 finalColor = vColor + vec3(pow(texColor.r, 2.0) * 0.42);

          float finalAlpha = texColor.a * vAlpha * vShimmer;
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
      coreSprite: THREE.Sprite;
      spikeSprite: THREE.Sprite;
      proxyMesh: THREE.Mesh;
      item: MemoryNode;
      radius0: number;
      theta0: number;
      y0: number;
      phaseSeed: number;
    }[] = [];

    const starsGroup = new THREE.Group();
    const proxyGroup = new THREE.Group();

    const proxyGeo = new THREE.SphereGeometry(4.8, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    DEMO_MEMORIES.forEach((item) => {
      const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
      const starCol = cluster ? cluster.colorThree : new THREE.Color(0xffffff);

      // 1. Chromatic Corona Glare (Cluster Color with Airy ring)
      const sMat = new THREE.SpriteMaterial({
        map: nodeTexture,
        color: starCol,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const starSprite = new THREE.Sprite(sMat);
      starSprite.position.copy(item.anchor);
      const starScale = item.isAnchor ? 6.4 : 4.4;
      starSprite.scale.set(starScale, starScale, 1);
      starsGroup.add(starSprite);

      // 2. Optical Diamond Core Point (subtle pinprick glint for landmark anchors only)
      const coreMat = new THREE.SpriteMaterial({
        map: starTexture,
        color: 0xffffff,
        transparent: true,
        opacity: item.isAnchor ? 0.70 : 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreSprite = new THREE.Sprite(coreMat);
      coreSprite.position.copy(item.anchor);
      coreSprite.visible = Boolean(item.isAnchor);
      const coreScale = starScale * 0.30;
      coreSprite.scale.set(coreScale, coreScale, 1);
      starsGroup.add(coreSprite);

      // 3. Celestial Diffraction Spike (only for landmark anchor nodes, keeping normal stars clean)
      const spikeMat = new THREE.SpriteMaterial({
        map: spikeTexture,
        color: 0xfff4db,
        transparent: true,
        opacity: item.isAnchor ? 0.65 : 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const spikeSprite = new THREE.Sprite(spikeMat);
      spikeSprite.position.copy(item.anchor);
      spikeSprite.visible = Boolean(item.isAnchor);
      const spikeScale = item.isAnchor ? 11.5 : 0;
      spikeSprite.scale.set(spikeScale, spikeScale, 1);
      starsGroup.add(spikeSprite);

      const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
      proxyMesh.position.copy(item.anchor);
      proxyMesh.userData = { memory: item, starSprite, coreSprite, spikeSprite };
      proxyGroup.add(proxyMesh);

      const r0 = Math.hypot(item.anchor.x, item.anchor.z);
      const th0 = Math.atan2(item.anchor.z, item.anchor.x);

      nodeMeshes.push({
        starSprite,
        coreSprite,
        spikeSprite,
        proxyMesh,
        item,
        radius0: r0,
        theta0: th0,
        y0: item.anchor.y,
        phaseSeed: Math.random() * Math.PI * 2,
      });
    });

    const proxyMeshes = nodeMeshes.map((m) => m.proxyMesh);

    scene.add(starsGroup);
    scene.add(proxyGroup);

    // ── D. GRAVITATIONAL FILAMENTS ──
    const edgeMeshes: {
      line: THREE.Line;
      edge: GraphEdge;
      m1Idx: number;
      m2Idx: number;
      curvePoints: THREE.Vector3[];
    }[] = [];

    const curveResolution = 20;

    GRAPH_EDGES.forEach((edge) => {
      const m1Idx = DEMO_MEMORIES.findIndex((m) => m.id === edge.sourceId);
      const m2Idx = DEMO_MEMORIES.findIndex((m) => m.id === edge.targetId);
      if (m1Idx === -1 || m2Idx === -1) return;

      const m1 = DEMO_MEMORIES[m1Idx];
      const m2 = DEMO_MEMORIES[m2Idx];

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
        m1Idx,
        m2Idx,
        curvePoints: points,
      });
    });

    // ── E. TRAVELING RECALL PHOTONS (SYNAPTIC COSMIC DATA PULSES) ──
    const photonCount = 28;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    const photonProgress = new Float32Array(photonCount);
    for (let i = 0; i < photonCount * 3; i++) photonPos[i] = -1000;
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));
    photonGeo.setAttribute("aProgress", new THREE.BufferAttribute(photonProgress, 1));

    const photonMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: starTexture },
        uColor: { value: new THREE.Color(0xffe2b8) },
        uBaseSize: { value: 2.2 },
        uOpacity: { value: 0.45 },
      },
      vertexShader: `
        attribute float aProgress;
        varying float vAlpha;
        uniform float uBaseSize;

        void main() {
          // Eased arc fade: softly blooms from origin, peaks at apex, and dissolves into target star
          float fade = sin(clamp(aProgress, 0.0, 1.0) * 3.14159);
          vAlpha = fade;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float dist = max(-mvPosition.z, 0.5);
          gl_PointSize = clamp((uBaseSize * 160.0 / dist) * (0.6 + 0.4 * fade), 1.5, 22.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.02) discard;
          float alpha = tex.a * vAlpha * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
    const cursorVec2 = new THREE.Vector2();
    const tempVec = new THREE.Vector3();
    const tempChord = new THREE.Vector3();
    const tempTangent = new THREE.Vector3();
    const tempUp = new THREE.Vector3(0, 1, 0);
    const tempPerp = new THREE.Vector3();
    const tempForward = new THREE.Vector3(0, 0, 1);
    const tempControlPoint = new THREE.Vector3();
    const whiteColor = new THREE.Color(0xffffff);

    const panForward = new THREE.Vector3();
    const panRight = new THREE.Vector3();
    const panUp = new THREE.Vector3();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionScale = prefersReducedMotion ? 0.2 : 1.0;

    let pendingHoverNodeId: string | null = null;

    // ════════════════════════════════════════════════════════════════════════
    // 8. 60-120FPS ANIMATION LOOP WITH FRAME-RATE-INDEPENDENT SMOOTHING
    // ════════════════════════════════════════════════════════════════════════

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime() * motionScale;

      particlesMaterial.uniforms.uTime.value = time;

      const s = cameraStateRef.current;
      const sel = selectionRef.current;

      // Smooth dimming
      const targetDimming = sel.selectedId ? 0.68 : 0.0;
      particlesMaterial.uniforms.uDimming.value = THREE.MathUtils.lerp(
        particlesMaterial.uniforms.uDimming.value,
        targetDimming,
        0.08
      );

      // Distance from camera to the galactic center (0, 0, 0)
      const distToCore = Math.hypot(camera.position.x, camera.position.y, camera.position.z);

      const galaxyPatternSpeed = 0.0035 * motionScale;
      const galaxyAngle = time * galaxyPatternSpeed;

      // Dissolve the massive central billboard sprites as the user zooms in to inspect stars and fine particles
      // Prevents any flat beige/orange disc or blob from occluding the view during deep zoom
      const zoomCoreFade = THREE.MathUtils.smoothstep(s.radius, 20.0, 85.0);
      const zoomCoreScale = THREE.MathUtils.clamp((s.radius - 15.0) / 70.0, 0.0, 1.0);

      if (zoomCoreFade < 0.005) {
        coreGroup.visible = false;
      } else {
        coreGroup.visible = true;

        // Atmospheric bulge fade curve based on camera distance
        const hazeAlpha = THREE.MathUtils.smoothstep(distToCore, 40.0, 185.0);
        const haloAlpha = THREE.MathUtils.smoothstep(distToCore, 24.0, 115.0);
        const barAlpha = THREE.MathUtils.smoothstep(distToCore, 12.0, 68.0);
        const coreAlpha = THREE.MathUtils.smoothstep(distToCore, 8.0, 38.0);

        // Organic multi-harmonic breathing
        const breathA = Math.sin(time * 0.52) * 0.035;
        const breathB = Math.cos(time * 0.88) * 0.02;
        const compositeBreath = (1.0 + breathA + breathB) * Math.max(0.04, zoomCoreScale);
        const corePulseLuminosity = 0.94 + Math.sin(time * 0.68) * 0.06;

        // Inner core resolves into a tight, crisp stellar singularity when flying inside
        const innerCoreScale = Math.min(30.0, Math.max(0.2, distToCore * 0.22)) * zoomCoreScale;
        innerCoreSprite.scale.set(
          innerCoreScale * (1.0 + Math.sin(time * 1.1) * 0.03),
          innerCoreScale * (1.0 + Math.sin(time * 1.1) * 0.03),
          1
        );
        innerCoreMat.opacity = Math.min(1.0, THREE.MathUtils.smoothstep(distToCore, 0.4, 22.0) * 0.92 + 0.06) * corePulseLuminosity * zoomCoreFade;

        coreSprite.scale.set(70 * compositeBreath, 70 * compositeBreath, 1);
        coreMat.opacity = 0.92 * coreAlpha * corePulseLuminosity * zoomCoreFade;

        // Bar rotates in exact synchronization with the galactic pattern
        barSprite.material.rotation = -galaxyAngle;
        barSprite.scale.set(128 * compositeBreath, 72 * (1.0 + Math.cos(time * 0.72) * 0.03) * zoomCoreScale, 1);
        barMat.opacity = 0.60 * barAlpha * (0.95 + breathA) * zoomCoreFade;

        haloSprite.scale.set(195 * compositeBreath, 195 * compositeBreath, 1);
        haloMat.opacity = 0.28 * haloAlpha * zoomCoreFade;

        outerHazeSprite.scale.set(285 * (1.0 + Math.sin(time * 0.35) * 0.025) * zoomCoreScale, 285 * (1.0 + Math.sin(time * 0.35) * 0.025) * zoomCoreScale, 1);
        outerHazeMat.opacity = 0.14 * hazeAlpha * zoomCoreFade;
      }

      // Keep camera completely steady during hover / navigation (no jerky mouse parallax)
      s.parallaxYaw = 0;
      s.parallaxPitch = 0;

      // Smooth Auto-rotation drift (pause during and shortly after trackpad / touch navigation so it doesn't fight the user)
      const isNavigating = (performance.now() - lastUserInteractionTime.current) < 2500;
      if (isAutoRotatingRef.current && s.autoRotate && !isNavigating && !s.isDragging) {
        s.targetYaw += delta * 0.038 * driftSpeedRef.current * motionScale;
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

      // Track target memory node smoothly as it orbits
      if (sel.selectedId) {
        const selMesh = nodeMeshes.find((m) => m.item.id === sel.selectedId);
        if (selMesh) {
          s.targetLookAt.lerp(selMesh.starSprite.position, 0.05);
        }
      }

      // Frame-rate independent delta-timed critically damped smoothing
      const dampFactor = 1.0 - Math.exp(-delta * 6.5);
      s.yaw = THREE.MathUtils.lerp(s.yaw, s.targetYaw, dampFactor);
      s.pitch = THREE.MathUtils.lerp(s.pitch, s.targetPitch, dampFactor);

      // Logarithmic/exponential radius interpolation for seamless infinite zoom across all scales
      // Optimized trackpad-responsive damping to prevent lag and overshoot
      const zoomDampFactor = 1.0 - Math.exp(-delta * 9.5);
      const prevRadius = s.radius;
      const currentLogRadius = Math.log(Math.max(0.01, s.radius));
      const targetLogRadius = Math.log(Math.max(0.01, s.targetRadius));
      const newLogRadius = THREE.MathUtils.lerp(currentLogRadius, targetLogRadius, zoomDampFactor);
      s.radius = Math.exp(newLogRadius);
      const radiusDelta = s.radius - prevRadius;

      // Real-time spatial audio altitude crossfading (deltaRadius=0 prevents jarring whooshes on trackpad zoom)
      spaceSoundscape.updateAltitude(s.radius, 0);

      // Snappy and smooth camera lookAt tracking in sync with zoom
      const lookAtDampFactor = 1.0 - Math.exp(-delta * 9.5);
      s.lookAt.lerp(s.targetLookAt, lookAtDampFactor);

      const effectiveYaw = s.yaw + s.parallaxYaw;
      const effectivePitch = s.pitch + s.parallaxPitch;

      // Spherical camera positioning
      const cy = Math.sin(effectivePitch) * s.radius;
      const horizontalR = Math.cos(effectivePitch) * s.radius;
      const cx = Math.sin(effectiveYaw) * horizontalR;
      const cz = Math.cos(effectiveYaw) * horizontalR;

      camera.position.set(cx + s.lookAt.x, cy + s.lookAt.y, cz + s.lookAt.z);
      camera.lookAt(s.lookAt);

      // Throttled altitude notification for micro or macro distances
      const nowMs = performance.now();
      if (nowMs - lastAltitudeUpdateMs.current > 120) {
        if (Math.abs(s.radius - lastReportedAltitude.current) > (s.radius < 10 ? 0.05 : 0.8)) {
          lastReportedAltitude.current = s.radius;
          lastAltitudeUpdateMs.current = nowMs;
          setCurrentAltitude(s.radius < 10 ? Number(s.radius.toFixed(2)) : Math.round(s.radius));
        }
      }

      // ── Update individual memory star celestial orbits, scales & coronas ──
      nodeMeshes.forEach(({ starSprite, coreSprite, spikeSprite, proxyMesh, item, radius0, theta0, y0, phaseSeed }) => {
        // Celestial orbit in galactic plane - locked in exact spiral pattern
        const theta = theta0 + galaxyAngle;
        const curX = Math.cos(theta) * radius0;
        const curZ = Math.sin(theta) * radius0;
        const curY = y0;

        starSprite.position.set(curX, curY, curZ);
        coreSprite.position.set(curX, curY, curZ);
        spikeSprite.position.set(curX, curY, curZ);
        proxyMesh.position.set(curX, curY, curZ);

        const isSel = sel.selectedId === item.id;
        const isNeighbor = sel.neighborIds.has(item.id);
        const isInCluster = sel.clusterId ? item.clusterId === sel.clusterId : true;

        const baseScale = item.isAnchor ? 6.4 : 4.4;
        let scaleMult = 1.0;
        let targetOpacity = 0.90;

        if (sel.selectedId) {
          if (isSel) {
            const selPulse = 1.0 + Math.sin(time * 2.8) * 0.08;
            scaleMult = 1.65 * selPulse;
            targetOpacity = 1.0;
            starSprite.material.color.setHex(0xf26522);
          } else if (isNeighbor) {
            const neighborPulse = 1.0 + Math.sin(time * 2.2 + item.anchor.x) * 0.06;
            scaleMult = 1.30 * neighborPulse;
            targetOpacity = 0.95;
            starSprite.material.color.setHex(0xffe2b8);
          } else {
            scaleMult = 0.72;
            targetOpacity = 0.20;
            const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
            starSprite.material.color.copy(cluster ? cluster.colorThree : whiteColor);
          }
        } else if (sel.clusterId) {
          if (isInCluster) {
            const clusterPulse = 1.0 + Math.sin(time * 2.2) * 0.06;
            scaleMult = 1.25 * clusterPulse;
            targetOpacity = 1.0;
          } else {
            scaleMult = 0.68;
            targetOpacity = 0.22;
          }
          const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
          starSprite.material.color.copy(cluster ? cluster.colorThree : whiteColor);
        } else {
          // Gentle, calm astronomical breathing (steady, not jiggling)
          const calmBreath = 1.0 + Math.sin(time * 0.72 + phaseSeed) * 0.025;
          scaleMult = calmBreath;
          const cluster = TOPIC_CLUSTERS.find((c) => c.id === item.clusterId);
          starSprite.material.color.copy(cluster ? cluster.colorThree : whiteColor);
        }

        const distToStar = camera.position.distanceTo(starSprite.position);
        // Distance-adaptive scale compensation: maintains crisp luminous presence without ballooning when close
        const closeDistFactor = THREE.MathUtils.clamp(distToStar / 32.0, 0.42, 1.05);
        const finalScale = baseScale * scaleMult * closeDistFactor;
        starSprite.scale.set(finalScale, finalScale, 1);

        if (item.isAnchor) {
          coreSprite.visible = true;
          coreSprite.scale.set(finalScale * 0.30, finalScale * 0.30, 1);
          spikeSprite.visible = true;
          const spikeScale = finalScale * 1.85;
          spikeSprite.scale.set(spikeScale, spikeScale, 1);
          const spikeAlphaFactor = THREE.MathUtils.smoothstep(distToStar, 2.0, 22.0);
          spikeSprite.material.opacity = THREE.MathUtils.lerp(
            spikeSprite.material.opacity,
            targetOpacity * 0.65 * spikeAlphaFactor,
            0.1
          );
          coreSprite.material.opacity = THREE.MathUtils.lerp(
            coreSprite.material.opacity,
            targetOpacity * 0.70,
            0.1
          );
        } else {
          coreSprite.visible = false;
          spikeSprite.visible = false;
        }

        starSprite.material.opacity = THREE.MathUtils.lerp(
          starSprite.material.opacity,
          targetOpacity,
          0.1
        );
      });

      // ── Update Gravitational Filaments (Connecting Trails) ──
      edgeMeshes.forEach(({ line, edge, m1Idx, m2Idx, curvePoints }) => {
        const p1 = nodeMeshes[m1Idx].starSprite.position;
        const p2 = nodeMeshes[m2Idx].starSprite.position;

        const chord = tempChord.subVectors(p2, p1);
        const chordLen = chord.length();
        const tangent = tempTangent.copy(chord).normalize();
        let perp = tempPerp.crossVectors(tangent, tempUp).normalize();
        if (perp.lengthSq() < 0.01) {
          perp = tempPerp.crossVectors(tangent, tempForward).normalize();
        }

        const archHeight = Math.min(2.8, chordLen * 0.09);
        const controlPoint = tempControlPoint
          .addVectors(p1, p2)
          .multiplyScalar(0.5)
          .addScaledVector(perp, archHeight);

        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let step = 0; step <= curveResolution; step++) {
          const t = step / curveResolution;
          const invT = 1.0 - t;
          const x = invT * invT * p1.x + 2.0 * invT * t * controlPoint.x + t * t * p2.x;
          const y = invT * invT * p1.y + 2.0 * invT * t * controlPoint.y + t * t * p2.y;
          const z = invT * invT * p1.z + 2.0 * invT * t * controlPoint.z + t * t * p2.z;

          posArray[step * 3 + 0] = x;
          posArray[step * 3 + 1] = y;
          posArray[step * 3 + 2] = z;
          curvePoints[step].set(x, y, z);
        }
        posAttr.needsUpdate = true;

        const mat = line.material as THREE.LineBasicMaterial;
        const isConnected =
          sel.selectedId === edge.sourceId ||
          sel.selectedId === edge.targetId;

        if (!showFilamentsRef.current) {
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.0, 0.15);
        } else if (isConnected) {
          const pulseAlpha = 0.82 + Math.sin(time * 3.5) * 0.08;
          mat.color.setHex(0xf26522);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, pulseAlpha, 0.14);
        } else if (sel.selectedId) {
          mat.color.setHex(0x3a404d);
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.03, 0.1);
        } else if (sel.clusterId) {
          const m1 = DEMO_MEMORIES[m1Idx];
          const m2 = DEMO_MEMORIES[m2Idx];
          const inCluster = m1.clusterId === sel.clusterId && m2.clusterId === sel.clusterId;
          if (inCluster) {
            mat.color.setHex(0xf26522);
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.55, 0.1);
          } else {
            mat.color.setHex(0x3a404d);
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.03, 0.1);
          }
        } else {
          mat.color.setHex(0x4f5869);
          const idlePulse = 0.18 + Math.sin(time * 1.2 + m1Idx) * 0.03;
          const zoomFilamentBoost = THREE.MathUtils.lerp(0.48, idlePulse, Math.min(1.0, s.radius / 90.0));
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, zoomFilamentBoost, 0.08);
        }
      });

      // ── Update Traveling Recall Photons (Synaptic Light Pulses) ──
      const pArr = photonPos;
      const activeEdges = edgeMeshes.filter(
        (e) =>
          showFilamentsRef.current &&
          (sel.selectedId === e.edge.sourceId ||
            sel.selectedId === e.edge.targetId)
      );

      const isInteractive = activeEdges.length > 0;
      const edgesPool = isInteractive ? activeEdges : (showFilamentsRef.current ? edgeMeshes : []);

      if (edgesPool.length > 0) {
        photonMat.uniforms.uOpacity.value = isInteractive ? 0.95 : 0.45;
        photonMat.uniforms.uBaseSize.value = isInteractive ? 3.2 : 2.0;
        photonMat.uniforms.uColor.value.setHex(isInteractive ? 0xf26522 : 0xffe2b8);

        const speedMultiplier = isInteractive ? 0.65 : 0.20;
        for (let i = 0; i < photonCount; i++) {
          const targetEdge = edgesPool[i % edgesPool.length];
          const tCycle = (time * speedMultiplier + i * (1.0 / photonCount)) % 1.0;
          photonProgress[i] = tCycle;

          const sampleIdx = Math.floor(tCycle * (targetEdge.curvePoints.length - 1));
          const pt = targetEdge.curvePoints[sampleIdx];

          pArr[i * 3 + 0] = pt.x;
          pArr[i * 3 + 1] = pt.y;
          pArr[i * 3 + 2] = pt.z;
        }
      } else {
        for (let i = 0; i < photonCount; i++) {
          photonProgress[i] = 0;
          pArr[i * 3 + 0] = -1000;
          pArr[i * 3 + 1] = -1000;
          pArr[i * 3 + 2] = -1000;
        }
      }
      photonGeo.attributes.position.needsUpdate = true;
      photonGeo.attributes.aProgress.needsUpdate = true;

      // ── Update 3D Floating Memory Star Labels (Memory Graph emergence on deep zoom) ──
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

          const starPos = nodeMeshes[i].starSprite.position;
          const distToCam = camera.position.distanceTo(starPos);

          // Only display labels for stars in reasonable view range
          if (distToCam > 125.0 || distToCam < 0.6) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            continue;
          }

          tempVec.copy(starPos).project(camera);

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
    let pointerDownStart = { x: 0, y: 0, time: 0 };

    const dismissAllOverlays = () => {
      pendingHoverNodeId = null;
      particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
      setHoveredMemoryId(null);
      setTooltipPos(null);
      setSelectedMemoryId(null);
      setSelectedClusterId(null);
      setSelectedGalaxyId(null);
      setIsSearchOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      lastUserInteractionTime.current = performance.now();
      s.isDragging = true;
      s.isPanning = e.button === 2 || e.shiftKey || e.button === 1;
      s.dragStartX = e.clientX;
      s.dragStartY = e.clientY;
      pointerDownStart = { x: e.clientX, y: e.clientY, time: performance.now() };
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
        // Hide preview tooltip when actively dragging
        if (pendingHoverNodeId !== null) {
          pendingHoverNodeId = null;
          particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
          setHoveredMemoryId(null);
          setTooltipPos(null);
        }

        const dx = e.clientX - s.dragStartX;
        const dy = e.clientY - s.dragStartY;
        s.dragStartX = e.clientX;
        s.dragStartY = e.clientY;

        if (s.isPanning) {
          // Pan camera in camera's view plane for particle-by-particle deep exploration
          camera.getWorldDirection(panForward);
          panRight.crossVectors(panForward, camera.up).normalize();
          panUp.copy(camera.up).normalize();

          const panFactor = Math.max(0.005, s.radius * 0.0018);
          s.targetLookAt.addScaledVector(panRight, -dx * panFactor);
          s.targetLookAt.addScaledVector(panUp, dy * panFactor);
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

      // Raycast memory star proxies for smooth preview hover
      const intersects = raycaster.intersectObjects(proxyMeshes);

      if (intersects.length > 0) {
        const hitProxy = intersects[0].object as THREE.Mesh;
        const memoryItem = hitProxy.userData.memory as MemoryNode;

        if (pendingHoverNodeId !== memoryItem.id) {
          pendingHoverNodeId = memoryItem.id;
          setHoveredMemoryId(memoryItem.id);
        }

        setTooltipPos({ x: e.clientX, y: e.clientY });
      } else {
        if (pendingHoverNodeId !== null) {
          pendingHoverNodeId = null;
          setHoveredMemoryId(null);
          setTooltipPos(null);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      const dist = Math.hypot(e.clientX - pointerDownStart.x, e.clientY - pointerDownStart.y);
      const elapsed = performance.now() - pointerDownStart.time;

      s.isDragging = false;
      s.isPanning = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch { }

      // Click Outside: If tapped/clicked without dragging, dismiss all open tabs/panels
      if (dist < 6 && elapsed < 400) {
        dismissAllOverlays();
      }
    };

    const onPointerLeave = () => {
      pendingHoverNodeId = null;
      particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
      setHoveredMemoryId(null);
      setTooltipPos(null);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = cameraStateRef.current;
      lastUserInteractionTime.current = performance.now();

      // Dismiss hover preview card during wheel zoom
      if (pendingHoverNodeId !== null) {
        pendingHoverNodeId = null;
        particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
        setHoveredMemoryId(null);
        setTooltipPos(null);
      }

      // Determine wheel delta and normalize across browsers & trackpad modes
      let dy = e.deltaY;
      let dx = e.deltaX;
      if (e.deltaMode === 1) {
        // DOM_DELTA_LINE (traditional discrete mouse wheel)
        dy *= 18;
        dx *= 18;
      } else if (e.deltaMode === 2) {
        // DOM_DELTA_PAGE
        dy *= 100;
        dx *= 100;
      }

      // Detect Mac trackpad pinch gesture (macOS Safari & Chrome pass e.ctrlKey = true during pinch)
      const isPinch = e.ctrlKey;
      // High-precision calibrated trackpad sensitivity
      const sensitivity = isPinch ? 0.012 : 0.0035;

      // Clamp individual frame burst spikes to prevent sudden jumps
      const clampedDelta = Math.max(-60, Math.min(60, dy));
      const zoomStep = clampedDelta * sensitivity;

      const oldTargetRadius = s.targetRadius;
      const currentLog = Math.log(Math.max(0.01, s.radius));
      let targetLog = Math.log(Math.max(0.01, s.targetRadius));

      // Bounded lead window: prevents trackpad momentum from throwing targetRadius lightyears away.
      // Guarantees immediate, organic stop when fingers lift and zero overshoot/lag
      const maxLead = 0.90; // smooth 2.45x zoom lead buffer
      if (targetLog - currentLog > maxLead) targetLog = currentLog + maxLead;
      if (currentLog - targetLog > maxLead) targetLog = currentLog - maxLead;

      targetLog += zoomStep;
      s.targetRadius = Math.max(0.04, Math.exp(targetLog));

      // ── Two-Finger Trackpad Horizontal Pan (e.g. Shift+scroll or horizontal swipe) ──
      if (!isPinch && (e.shiftKey || Math.abs(dx) > Math.abs(dy) * 1.5) && Math.abs(dx) > 3) {
        camera.getWorldDirection(panForward);
        panRight.crossVectors(panForward, camera.up).normalize();
        const panFactor = Math.max(0.006, s.radius * 0.0012);
        s.targetLookAt.addScaledVector(panRight, dx * panFactor);
        s.targetLookAt.x = THREE.MathUtils.clamp(s.targetLookAt.x, -160, 160);
        s.targetLookAt.z = THREE.MathUtils.clamp(s.targetLookAt.z, -160, 160);
      }

      // ── Cursor-Directed Zoom Steering (Direct navigation smoothly to wherever cursor points) ──
      const rect = canvas.getBoundingClientRect();
      const cursorNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const cursorNdcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (Math.abs(cursorNdcX) <= 1.05 && Math.abs(cursorNdcY) <= 1.05) {
        cursorVec2.set(cursorNdcX, cursorNdcY);
        raycaster.setFromCamera(cursorVec2, camera);
        camera.getWorldDirection(panForward);

        const denom = raycaster.ray.direction.dot(panForward);
        if (denom > 0.05) {
          // Distance from camera to current focal plane passing through targetLookAt
          const toLookAt = tempVec.copy(s.targetLookAt).sub(camera.position);
          const focalDist = toLookAt.dot(panForward);

          if (focalDist > 0.1) {
            const rayDist = focalDist / denom;
            const cursorWorld = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, rayDist);

            // Check if cursor points at a specific memory star proxy for pinpoint navigation
            const starIntersects = raycaster.intersectObjects(proxyMeshes);
            const targetPoint = starIntersects.length > 0 ? starIntersects[0].object.position : cursorWorld;

            if (zoomStep < 0) {
              // Zooming IN: smoothly steer targetLookAt towards the cursor point
              const zoomInRatio = Math.max(0.01, Math.min(0.5, (oldTargetRadius - s.targetRadius) / oldTargetRadius));
              const steerFactor = Math.min(0.38, zoomInRatio * 1.6);
              s.targetLookAt.lerp(targetPoint, steerFactor);

              // Soft clamp within active cosmic bounds
              s.targetLookAt.x = THREE.MathUtils.clamp(s.targetLookAt.x, -150, 150);
              s.targetLookAt.y = THREE.MathUtils.clamp(s.targetLookAt.y, -35, 35);
              s.targetLookAt.z = THREE.MathUtils.clamp(s.targetLookAt.z, -150, 150);
            } else if (zoomStep > 0 && s.targetRadius > 35) {
              // Zooming OUT: smoothly recenter towards the galactic core (0, 0, 0)
              const recenterFactor = Math.min(0.20, (zoomStep / sensitivity) * 0.003 * Math.min(1.0, (s.targetRadius - 35) / 80));
              s.targetLookAt.lerp(new THREE.Vector3(0, 0, 0), recenterFactor);
            }
          }
        }
      }
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
        lastUserInteractionTime.current = performance.now();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        const s = cameraStateRef.current;
        if (s.lastPinchDistance > 0) {
          const deltaDist = dist - s.lastPinchDistance;
          const currentLog = Math.log(Math.max(0.01, s.radius));
          let targetLog = Math.log(Math.max(0.01, s.targetRadius));

          const maxLead = 0.85;
          if (targetLog - currentLog > maxLead) targetLog = currentLog + maxLead;
          if (currentLog - targetLog > maxLead) targetLog = currentLog - maxLead;

          targetLog -= deltaDist * 0.006;
          s.targetRadius = Math.max(0.04, Math.exp(targetLog));
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

    const onGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Preserve active state if clicked inside an interactive panel, pill, or input
      if (
        target.closest("[data-panel='true']") ||
        target.closest("button") ||
        target.closest("input")
      ) {
        return;
      }

      // Clicked outside on backdrop: dismiss all open cards/tabs
      dismissAllOverlays();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onGlobalPointerDown);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onGlobalPointerDown);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      starTexture.dispose();
      nodeTexture.dispose();
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
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[#0a0b10]/92 backdrop-blur-md border border-white/10 hover:border-[#f26522]/50 hover:bg-[#0e1017] shadow-[0_4px_16px_rgba(0,0,0,0.7)] group transition-all">
                <span
                  className="size-1.5 rounded-[1px] shrink-0"
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
      <div className="absolute top-3.5 left-4 right-4 z-30 pointer-events-none flex items-center justify-between gap-3">
        {/* Left: Galaxy Constellations Navigation */}
        <div className="pointer-events-auto flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={handleResetView}
            className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium tracking-tight whitespace-nowrap transition-all backdrop-blur-xl border ${!selectedMemoryId && !selectedClusterId && !selectedGalaxyId && !isTourActive
              ? "bg-white text-black border-white shadow-[0_2px_12px_rgba(255,255,255,0.2)] font-semibold"
              : "bg-[#0c0d12]/85 text-[#9ca3af] border-white/10 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            Full Galaxy View
          </button>

          {/* Andromeda Galaxy Shortcut */}
          <button
            onClick={() => handleSelectGalaxy("galaxy-andromeda")}
            className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium tracking-tight whitespace-nowrap transition-all backdrop-blur-xl border ${selectedGalaxyId === "galaxy-andromeda"
              ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_2px_12px_rgba(59,130,246,0.35)] font-semibold"
              : "bg-[#0c0d12]/85 text-[#9ca3af] border-white/10 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            Andromeda (M31)
          </button>

          {/* Triangulum Galaxy Shortcut */}
          <button
            onClick={() => handleSelectGalaxy("galaxy-triangulum")}
            className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium tracking-tight whitespace-nowrap transition-all backdrop-blur-xl border ${selectedGalaxyId === "galaxy-triangulum"
              ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-[0_2px_12px_rgba(139,92,246,0.35)] font-semibold"
              : "bg-[#0c0d12]/85 text-[#9ca3af] border-white/10 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            Triangulum (M33)
          </button>

          {/* Subtle separator */}
          <span className="w-px h-3.5 bg-white/15 mx-0.5 shrink-0" />

          {TOPIC_CLUSTERS.map((cluster) => {
            const isActive = selectedClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => handleSelectCluster(cluster.id)}
                className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium tracking-tight whitespace-nowrap transition-all backdrop-blur-xl border ${isActive
                  ? "bg-[#f26522] text-white border-[#f26522] shadow-[0_2px_12px_rgba(242,101,34,0.35)] font-semibold"
                  : "bg-[#0c0d12]/85 text-[#9ca3af] border-white/10 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                {cluster.name}
              </button>
            );
          })}
        </div>

        {/* Right: Instant Star Search & Quick Actions */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0 relative">
          <SpaceSoundToggle />
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0c0d12]/90 backdrop-blur-xl border border-white/12 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-md">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search galaxy stars"
                className="bg-transparent text-xs text-white placeholder-[#71717a] outline-none w-36 sm:w-44 md:w-52 font-normal"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="text-[#a1a1aa] hover:text-white transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-[5px] bg-[#0c0d12]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_50px_rgba(0,0,0,0.85)] p-2 z-50">
                <div className="text-[10px] font-mono uppercase text-[#71717a] px-2 py-1 flex items-center justify-between">
                  <span>Matching Memory Stars</span>
                  <span className="text-[#f26522] font-semibold">{searchResults.length}</span>
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectMemory(result.id)}
                    className="w-full text-left px-2.5 py-2 rounded-[3px] hover:bg-white/10 transition-colors flex flex-col gap-0.5 group"
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
              className="px-3 py-1.5 rounded-[4px] bg-[#0c0d12]/90 backdrop-blur-xl border border-white/12 hover:border-white/30 text-xs font-medium text-[#9ca3af] hover:text-white flex items-center transition-all shadow-md"
              title="Reset View (Esc)"
            >
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── GUIDED TOUR ACTIVE BANNER (TOP-CENTER) ── */}
      {isTourActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-[5px] bg-[#0b0c10]/95 backdrop-blur-2xl border border-[#f26522]/40 shadow-[0_12px_32px_rgba(242,101,34,0.25)] animate-in fade-in slide-in-from-top-3 duration-200">
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
              className="p-1 rounded-[3px] hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title="Previous Landmark (Left Arrow)"
            >
              <ArrowLeft className="size-3.5" />
            </button>
            <button
              onClick={handleNextTourStop}
              className="p-1 rounded-[3px] hover:bg-white/10 text-white/80 hover:text-white transition-colors"
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
          data-panel="true"
          className="fixed pointer-events-auto z-50 px-4 py-3 rounded-[5px] bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_16px_36px_rgba(0,0,0,0.85)] text-left max-w-[300px] -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in duration-100 space-y-2"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 14}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#f26522] font-semibold">
                {hoveredNode.topic}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hoveredNode.isAnchor && (
                <span className="text-[9px] font-mono text-zinc-400">
                  ✦ Landmark
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredMemoryId(null);
                  setTooltipPos(null);
                }}
                className="text-zinc-500 hover:text-white p-0.5 rounded-[2px] transition-colors"
                title="Dismiss"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
          <div className="text-[13px] font-medium text-white leading-snug">
            {hoveredNode.title}
          </div>
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {hoveredNode.description}
          </p>
          <div className="text-[10px] text-zinc-500 flex items-center justify-between font-mono pt-0.5">
            <span className="truncate max-w-[160px]">{hoveredNode.source}</span>
            <span className="text-[#f26522] font-medium">{hoveredNode.isAnchor ? "✦ Landmark" : "Synapse Star"}</span>
          </div>
        </div>
      )}

      {/* ── COMPREHENSIVE MEMORY DETAIL PANEL (ON STAR SELECTION) ── */}
      {selectedMemory && (
        <div
          data-panel="true"
          className="absolute bottom-16 right-4 z-40 max-w-[400px] w-full p-5 rounded-[6px] bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
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
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <Link2 className="size-3 text-[#f26522]" />
                Gravitational Filaments ({relatedConnections.length})
              </span>
              <span className="text-zinc-600">Click star to glide</span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-none pt-1">
              {relatedConnections.map(({ edge, otherNode }) => (
                <button
                  key={edge.id}
                  onClick={() => handleSelectMemory(otherNode.id)}
                  onMouseEnter={() => spaceSoundscape.playFilamentResonance(0.2)}
                  className="w-full text-left py-1 hover:opacity-85 transition-opacity duration-150 group flex flex-col gap-1 cursor-pointer"
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
                  <p className="text-[11.5px] text-zinc-400 leading-relaxed line-clamp-2">
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
        <div
          data-panel="true"
          className="absolute bottom-16 right-4 z-40 max-w-[400px] w-full p-5 rounded-[6px] bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-[#f26522]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
                Cluster · {selectedCluster.tag}
              </span>
            </div>
            <button
              onClick={() => setSelectedClusterId(null)}
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
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

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none pt-1">
              {DEMO_MEMORIES.filter((m) => m.clusterId === selectedCluster.id).map((mem) => (
                <button
                  key={mem.id}
                  onClick={() => handleSelectMemory(mem.id)}
                  className="w-full text-left py-1 hover:opacity-85 transition-opacity flex items-center justify-between group cursor-pointer"
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
        <div
          data-panel="true"
          className="absolute bottom-16 right-4 z-40 max-w-[420px] w-full p-5 rounded-[6px] bg-[#0a0b10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-3.5"
        >
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
              className="text-zinc-400 hover:text-white size-6 flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
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
          <div className="flex items-center justify-between py-1">
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
                className="px-2.5 py-1.5 rounded-[3px] text-left text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
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
                    className={`px-2.5 py-1.5 rounded-[3px] text-left text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 ${isCurrent
                      ? "bg-[#38bdf8] text-black font-semibold shadow-[0_2px_10px_rgba(56,189,248,0.35)]"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                      }`}
                  >
                    <span>{g.name.split(" (")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM TELEMETRY HUD (BOTTOM-LEFT) ── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden md:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#0b0c10]/85 backdrop-blur-xl px-3.5 py-2 rounded-[4px] border border-white/10 shadow-lg">
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
          <kbd className="px-1 py-0.5 rounded-[2px] bg-white/10 text-white font-mono">DRAG</kbd> ORBIT
        </span>
        <span>•</span>
        <span className="text-[#71717a]">
          <kbd className="px-1 py-0.5 rounded-[2px] bg-white/10 text-white font-mono">SCROLL</kbd> ZOOM
        </span>
        <span>•</span>
        <span className="text-[#71717a]">
          <kbd className="px-1 py-0.5 rounded-[2px] bg-white/10 text-white font-mono">RIGHT-DRAG</kbd> PAN
        </span>
        <span>•</span>
        <span className="text-[#71717a]">
          <kbd className="px-1 py-0.5 rounded-[2px] bg-white/10 text-white font-mono">SPACE</kbd> DRIFT
        </span>
      </div>

      {/* ── FLOATING GRAPH & GALAXY CONTROLS DOCK (BOTTOM-RIGHT) ── */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto flex items-center gap-1 p-1 rounded-[4px] bg-[#0b0c10]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.65)] text-white/80">
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-white/10 hover:text-white rounded-[3px] transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="size-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-white/10 hover:text-white rounded-[3px] transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="size-3.5" />
        </button>

        {/* Fit to View / Full Overview */}
        <button
          onClick={handleResetView}
          className="p-1.5 hover:bg-white/10 hover:text-white rounded-[3px] transition-colors"
          title="Fit Galaxy to View (0 / Esc)"
        >
          <Maximize2 className="size-3.5" />
        </button>

        {/* Reset Camera Angle */}
        <button
          onClick={handleResetView}
          className="p-1.5 hover:bg-white/10 hover:text-white rounded-[3px] transition-colors"
          title="Reset Camera Angle"
        >
          <RotateCcw className="size-3.5" />
        </button>

        <span className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* Auto-Rotation Drift Toggle */}
        <button
          onClick={handleToggleAutoRotate}
          className={`p-1.5 rounded-[3px] transition-colors ${isAutoRotating
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
          className="px-2 py-1 rounded-[3px] hover:bg-white/10 text-[9px] font-mono text-[#a1a1aa] hover:text-white transition-colors"
          title="Cycle Drift Speed"
        >
          {driftSpeed}x
        </button>

        {/* Filaments Toggle */}
        <button
          onClick={handleToggleFilaments}
          className={`p-1.5 rounded-[3px] transition-colors ${showFilaments
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
          className={`px-2.5 py-1 rounded-[3px] flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-all ${isTourActive
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
