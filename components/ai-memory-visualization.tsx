"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Search, X, RotateCcw, ArrowRight, Sparkles, Layers, Link2, Compass } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// 1. TYPINGS & DATA MODELS
// ════════════════════════════════════════════════════════════════════════════

export type RelationshipType =
  | "part of"
  | "influenced by"
  | "mentioned in"
  | "updated by"
  | "related to";

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
  source: string;      // Origin (Slack, Meeting transcript, PR, RFC, etc.)
  timestamp: string;
  clusterId: string;
  topic: string;
  anchor: THREE.Vector3;
}

export interface TopicCluster {
  id: string;
  name: string;
  tag: string;
  description: string;
  centroid: THREE.Vector3;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. DEMO TOPIC CLUSTERS
// ════════════════════════════════════════════════════════════════════════════

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "cluster-arch",
    name: "Architecture & Storage",
    tag: "Core Engine",
    description:
      "Technical foundations powering fast, local-first memory recall without sending private logs to cloud databases.",
    centroid: new THREE.Vector3(-18, 6, 3),
  },
  {
    id: "cluster-decisions",
    name: "Product Decisions",
    tag: "Decisions",
    description:
      "Strategic agreements and engineering choices made across team chats, design reviews, and architecture records.",
    centroid: new THREE.Vector3(16, 16, -2),
  },
  {
    id: "cluster-prefs",
    name: "User Preferences",
    tag: "Preferences",
    description:
      "Personal coding habits, latency thresholds, and communication cadences learned automatically by Maximem.",
    centroid: new THREE.Vector3(14, -15, 9),
  },
  {
    id: "cluster-context",
    name: "Conversations & Syncs",
    tag: "Live Context",
    description:
      "Real-time knowledge synthesized from team meetings, voice recordings, and cross-agent developer threads.",
    centroid: new THREE.Vector3(4, 0, 19),
  },
  {
    id: "cluster-research",
    name: "Research & Synthesis",
    tag: "Research",
    description:
      "Advanced semantic compression models that reduce token bloat and predict upcoming context before you type.",
    centroid: new THREE.Vector3(-15, -14, -12),
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 3. DEMO MEMORIES (REALISTIC, ACCESSIBLE DEMO DATA)
// ════════════════════════════════════════════════════════════════════════════

export const DEMO_MEMORIES: MemoryNode[] = [
  // ── Cluster 0: Architecture & Storage ──
  {
    id: "mem-tri-store",
    title: "Hybrid Graph & Vector Vault",
    description:
      "Combines instant local key-value lookups with vector search so the AI can recall relevant facts in under 15ms without sending data to cloud servers.",
    source: "RFC-042 System Architecture",
    timestamp: "18m ago",
    clusterId: "cluster-arch",
    topic: "Architecture & Storage",
    anchor: new THREE.Vector3(-18, 5, 8),
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
    anchor: new THREE.Vector3(-24, 12, 2),
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
    anchor: new THREE.Vector3(-15, 2, -6),
  },

  // ── Cluster 1: Product Decisions ──
  {
    id: "mem-local-first",
    title: "Local-First Storage Over Cloud Sync",
    description:
      "The team agreed to keep all private memories encrypted in on-device SQLite vaults rather than syncing raw conversation logs to cloud servers.",
    source: "Architecture Decision Record #18",
    timestamp: "Yesterday",
    clusterId: "cluster-decisions",
    topic: "Product Decisions",
    anchor: new THREE.Vector3(14, 16, -6),
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
    anchor: new THREE.Vector3(22, 14, -2),
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
    anchor: new THREE.Vector3(16, 21, 4),
  },

  // ── Cluster 2: User Preferences ──
  {
    id: "mem-type-strict",
    title: "Strict TypeScript Null Checks",
    description:
      "User consistently prefers strictly-typed TypeScript with zero 'any' casts and pure immutable state transforms across all generated code.",
    source: "Observed Coding Activity",
    timestamp: "12m ago",
    clusterId: "cluster-prefs",
    topic: "User Preferences",
    anchor: new THREE.Vector3(14, -12, 10),
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
    anchor: new THREE.Vector3(20, -17, 4),
  },
  {
    id: "mem-latency-sla",
    title: "Sub-15ms Recall SLA",
    description:
      "User specified that all memory augmentations must execute in under 15ms so AI autocomplete and responses never introduce perceptible typing lag.",
    source: "Latency Audit Benchmark",
    timestamp: "4d ago",
    clusterId: "cluster-prefs",
    topic: "User Preferences",
    anchor: new THREE.Vector3(10, -19, 15),
  },

  // ── Cluster 3: Conversations & Syncs ──
  {
    id: "mem-agent-sync",
    title: "Shared Multi-Agent Memory Pipeline",
    description:
      "Team aligned Claude, Cursor, and ChatGPT on reading the identical local Synap vault to eliminate conflicting advice across different AI coding tools.",
    source: "Slack #architecture-sync",
    timestamp: "5h ago",
    clusterId: "cluster-context",
    topic: "Conversations & Syncs",
    anchor: new THREE.Vector3(2, -3, 18),
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
    anchor: new THREE.Vector3(6, 3, 22),
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
    anchor: new THREE.Vector3(-2, 7, 24),
  },

  // ── Cluster 4: Research & Synthesis ──
  {
    id: "mem-episodic-comp",
    title: "Episodic vs Semantic Compression",
    description:
      "Synthesizes conversational threads into permanent knowledge triples to prevent prompt window bloat while preserving important nuances.",
    source: "Research Note #08",
    timestamp: "2d ago",
    clusterId: "cluster-research",
    topic: "Research & Synthesis",
    anchor: new THREE.Vector3(-12, -15, -10),
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
    anchor: new THREE.Vector3(-19, -11, -15),
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
    anchor: new THREE.Vector3(-10, -19, -16),
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 4. EXPLICIT GRAPH RELATIONSHIPS (NEVER ARBITRARY LINES)
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
];

// Helper: Circular Sprite Texture for Soft Anti-Aliased Photons
function createSoftCircleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const radius = size / 2;

  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.25)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ════════════════════════════════════════════════════════════════════════════
// 5. MAIN COMPONENT: LIVING MEMORY GRAPH WITH NATURAL EXPLORATION
// ════════════════════════════════════════════════════════════════════════════

interface AiMemoryVisualizationSectionProps {
  className?: string;
  isLight?: boolean;
}

export function AiMemoryVisualizationSection({
  className = "",
}: AiMemoryVisualizationSectionProps) {
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

  // Camera & Orbit State with Inertial Damping
  const cameraStateRef = useRef({
    yaw: 0.35,
    pitch: 0.18,
    radius: 145,
    targetYaw: 0.35,
    targetPitch: 0.18,
    targetRadius: 145,
    minRadius: 24, // Deep zoom into individual cluster nodes
    maxRadius: 320, // Macro universe overview

    lookAt: new THREE.Vector3(0, 0, 0),
    targetLookAt: new THREE.Vector3(0, 0, 0),

    yawVelocity: 0,
    pitchVelocity: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastPinchDistance: 0,

    autoRotate: true,
  });

  // Active Selection Reference for Animation Loop
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

  // Reset to full universe view
  const handleResetView = useCallback(() => {
    setSelectedMemoryId(null);
    setSelectedClusterId(null);
    setSearchQuery("");
    setIsSearchOpen(false);

    const s = cameraStateRef.current;
    s.targetLookAt.set(0, 0, 0);
    s.targetRadius = 145;
    s.targetYaw = 0.35;
    s.targetPitch = 0.18;
    s.autoRotate = true;
  }, []);

  // Focus on a specific memory
  const handleSelectMemory = useCallback((memoryId: string) => {
    const target = DEMO_MEMORIES.find((m) => m.id === memoryId);
    if (!target) return;

    setSelectedMemoryId(memoryId);
    setSelectedClusterId(null);
    setIsSearchOpen(false);

    const s = cameraStateRef.current;
    s.targetLookAt.copy(target.anchor);
    s.targetRadius = Math.max(34, s.radius * 0.42);
    s.autoRotate = false;
  }, []);

  // Focus on a cluster
  const handleSelectCluster = useCallback((clusterId: string) => {
    const cluster = TOPIC_CLUSTERS.find((c) => c.id === clusterId);
    if (!cluster) return;

    setSelectedClusterId(clusterId);
    setSelectedMemoryId(null);
    setIsSearchOpen(false);

    const s = cameraStateRef.current;
    s.targetLookAt.copy(cluster.centroid);
    s.targetRadius = 65;
    s.autoRotate = false;
  }, []);

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
  // 6. THREE.JS RENDERING ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      1600
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0); // 100% transparent over #1B1B19
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // ── 1. Continuous Layered 3D Particle Field (~6,500 Points) ──
    const totalParticles = 6500;
    const positions = new Float32Array(totalParticles * 3);
    const baseColors = new Float32Array(totalParticles * 3);
    const particleSizes = new Float32Array(totalParticles);

    const colorWhite = new THREE.Color(0xf4f4f5);
    const colorSilver = new THREE.Color(0xa1a1aa);
    const colorMutedGrey = new THREE.Color(0x52525b);
    const colorDeepGrey = new THREE.Color(0x3f3f46);
    const colorOrange = new THREE.Color(0xf26522);

    const randn = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    for (let i = 0; i < totalParticles; i++) {
      const p = new THREE.Vector3();
      let size = 1.35;
      let col = colorMutedGrey;

      if (i < 2800) {
        // Continuous Central Knowledge Field (Gaussian Mixture, No Globe Boundary)
        p.set(randn() * 14.0, randn() * 10.0, randn() * 12.0);

        const dist = p.length();
        if (dist < 8.0) {
          col = Math.random() > 0.4 ? colorWhite : colorSilver;
          size = 1.8;
        } else if (dist < 18.0) {
          col = Math.random() > 0.6 ? colorSilver : colorMutedGrey;
          size = 1.45;
        } else {
          col = colorDeepGrey;
          size = 1.15;
        }
      } else if (i < 5800) {
        // Organic Topic Clusters Extending Outward & Merging
        const targetCluster = (i - 2800) % TOPIC_CLUSTERS.length;
        const center = TOPIC_CLUSTERS[targetCluster].centroid;

        const localOffset = new THREE.Vector3(randn() * 7.5, randn() * 6.5, randn() * 7.5);
        const bridgeT = Math.random() < 0.35 ? Math.random() * 0.75 : 0.0;
        const baseCenter = center.clone().lerp(new THREE.Vector3(0, 0, 0), bridgeT);

        p.copy(baseCenter).add(localOffset);

        if (Math.random() > 0.82) {
          col = colorWhite;
          size = 1.9;
        } else if (Math.random() > 0.45) {
          col = colorSilver;
          size = 1.4;
        } else {
          col = colorMutedGrey;
          size = 1.15;
        }
      } else {
        // Inflowing Streamline Memory Particles (Incoming Knowledge)
        const targetCluster = i % TOPIC_CLUSTERS.length;
        const center = TOPIC_CLUSTERS[targetCluster].centroid;
        const t = Math.random();

        const angle = t * Math.PI * 4.0;
        const radius = 28.0 + (1.0 - t) * 35.0;
        p.set(
          Math.cos(angle) * radius * 0.85 + center.x * t,
          Math.sin(angle * 1.5) * 12.0 + center.y * t,
          Math.sin(angle) * radius * 0.85 + center.z * t
        );

        col = colorDeepGrey;
        size = 1.0;
      }

      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      baseColors[i * 3 + 0] = col.r;
      baseColors[i * 3 + 1] = col.g;
      baseColors[i * 3 + 2] = col.b;

      particleSizes[i] = size;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("baseColor", new THREE.BufferAttribute(baseColors, 3));
    particlesGeometry.setAttribute("particleSize", new THREE.BufferAttribute(particleSizes, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOrangeColor: { value: colorOrange },
        uHoveredPos: { value: new THREE.Vector3(-1000, -1000, -1000) },
        uRecallPhase: { value: 0 },
        uDimming: { value: 0.0 }, // Fades background particles when a node is selected
      },
      vertexShader: `
        attribute vec3 baseColor;
        attribute float particleSize;

        varying vec3 vColor;
        varying float vOrange;
        varying float vDepth;

        uniform float uTime;
        uniform vec3 uOrangeColor;
        uniform vec3 uHoveredPos;
        uniform float uRecallPhase;
        uniform float uDimming;

        mat3 rotY(float a) {
          float c = cos(a); float s = sin(a);
          return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
        }

        void main() {
          vColor = baseColor;

          float driftSpeed = 0.035;
          float angle = uTime * driftSpeed + position.y * 0.012;
          vec3 transformed = rotY(angle) * position;

          float breathe = sin(uTime * 0.75 + length(position) * 0.06) * 0.65;
          transformed += normalize(position + vec3(0.001)) * breathe;

          float distToHover = length(transformed - uHoveredPos);
          float orangeVal = 0.0;
          if (distToHover < 10.0) {
            orangeVal = (1.0 - distToHover / 10.0) * 0.8;
          }

          if (uRecallPhase > 0.01) {
            float wave = sin(uRecallPhase * 6.28 - length(transformed) * 0.1);
            if (wave > 0.82) {
              orangeVal = max(orangeVal, (wave - 0.82) * 2.8);
            }
          }

          vOrange = clamp(orangeVal, 0.0, 1.0);

          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float dist = -mvPosition.z;
          float pSize = particleSize;
          if (vOrange > 0.2) pSize *= 1.3;

          gl_PointSize = pSize * (360.0 / max(dist, 10.0));
          gl_PointSize = clamp(gl_PointSize, 1.2, 28.0);
          vDepth = dist;
        }
      `,
      fragmentShader: `
        uniform vec3 uOrangeColor;
        uniform float uDimming;

        varying vec3 vColor;
        varying float vOrange;
        varying float vDepth;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.32, dist);
          float core = 1.0 - smoothstep(0.0, 0.26, dist);

          vec3 finalColor = mix(vColor, uOrangeColor, vOrange);
          finalColor += vec3(core * 0.25);

          float depthAlpha = smoothstep(380.0, 25.0, vDepth);
          float baseAlpha = alpha * clamp(depthAlpha, 0.25, 1.0);

          // Subtle dimming when inspecting relationships
          float finalAlpha = mix(baseAlpha, baseAlpha * 0.25, uDimming);
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // ── 2. Small, Consistent Memory Nodes with Real Graph Data ──
    const nodeMeshes: {
      visualMesh: THREE.Mesh;
      proxyMesh: THREE.Mesh;
      item: MemoryNode;
    }[] = [];

    const memoryGroup = new THREE.Group();
    const proxyGroup = new THREE.Group();

    const nodeGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const proxyGeo = new THREE.SphereGeometry(3.6, 8, 8); // Generous invisible hit-proxy
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    DEMO_MEMORIES.forEach((item) => {
      const nodeMat = new THREE.MeshBasicMaterial({
        color: 0xf4f4f5,
        transparent: true,
        opacity: 0.88,
      });

      const visualMesh = new THREE.Mesh(nodeGeo, nodeMat);
      visualMesh.position.copy(item.anchor);

      const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
      proxyMesh.position.copy(item.anchor);
      proxyMesh.userData = { memory: item, visualMesh };

      memoryGroup.add(visualMesh);
      proxyGroup.add(proxyMesh);

      nodeMeshes.push({ visualMesh, proxyMesh, item });
    });

    scene.add(memoryGroup);
    scene.add(proxyGroup);

    // ── 3. Explicit Graph Edges (Bézier Synapses Based on Exact Relationships) ──
    // Each edge has its own dedicated line segment representation for independent opacity/color control
    const edgeMeshes: {
      line: THREE.Line;
      edge: GraphEdge;
      startPoint: THREE.Vector3;
      endPoint: THREE.Vector3;
    }[] = [];

    const curveResolution = 16;

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

      const archHeight = Math.min(2.2, chordLen * 0.075);
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
        color: 0x666a74,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      edgeMeshes.push({
        line,
        edge,
        startPoint: p1.clone(),
        endPoint: p2.clone(),
      });
    });

    // ── 4. Traveling Recall Impulses (Smooth Circular Photons Along Graph Edges) ──
    const softCircleTex = createSoftCircleTexture();
    const photonCount = 10;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 1.8,
      color: 0xf26522,
      map: softCircleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const photonsMesh = new THREE.Points(photonGeo, photonMat);
    scene.add(photonsMesh);

    // ── Raycaster for Clean Hover & Click Inspection ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);

    // ════════════════════════════════════════════════════════════════════════
    // 7. ANIMATION & RENDER LOOP
    // ════════════════════════════════════════════════════════════════════════

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      particlesMaterial.uniforms.uTime.value = time;

      const recallCycle = (time % 14.0) / 14.0;
      particlesMaterial.uniforms.uRecallPhase.value = recallCycle;

      const s = cameraStateRef.current;
      const sel = selectionRef.current;

      // Update dimming uniform
      const targetDimming = sel.selectedId ? 0.75 : 0.0;
      particlesMaterial.uniforms.uDimming.value +=
        (targetDimming - particlesMaterial.uniforms.uDimming.value) * 0.08;

      // Gentle continuous ambient drift (stops during inspection)
      if (s.autoRotate && !s.isDragging && !sel.selectedId && !sel.clusterId) {
        s.targetYaw += delta * 0.032;
      }

      // Smooth inertial damping
      if (!s.isDragging) {
        s.targetYaw += s.yawVelocity;
        s.targetPitch += s.pitchVelocity;
        s.yawVelocity *= 0.93;
        s.pitchVelocity *= 0.93;
      }

      s.yaw += (s.targetYaw - s.yaw) * 0.08;
      s.pitch += (s.targetPitch - s.pitch) * 0.08;
      s.radius += (s.targetRadius - s.radius) * 0.08;
      s.lookAt.lerp(s.targetLookAt, 0.065);

      s.pitch = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, s.pitch));

      const cosP = Math.cos(s.pitch);
      const sinP = Math.sin(s.pitch);
      const cosY = Math.cos(s.yaw);
      const sinY = Math.sin(s.yaw);

      camera.position.x = s.lookAt.x + s.radius * cosP * sinY;
      camera.position.y = s.lookAt.y + s.radius * sinP;
      camera.position.z = s.lookAt.z + s.radius * cosP * cosY;
      camera.lookAt(s.lookAt);

      // Subtle organic breathing of node coordinates
      const nodeBreath = Math.sin(time * 0.8) * 0.012;
      memoryGroup.scale.set(1 + nodeBreath, 1 + nodeBreath, 1 + nodeBreath);
      proxyGroup.scale.set(1 + nodeBreath, 1 + nodeBreath, 1 + nodeBreath);

      // ── Dynamic Node Highlighting Based on Selection ──
      nodeMeshes.forEach(({ visualMesh, item }) => {
        const mat = visualMesh.material as THREE.MeshBasicMaterial;

        if (sel.selectedId) {
          if (item.id === sel.selectedId) {
            // Selected node: bright glowing orange, slightly larger
            mat.color.setHex(0xf26522);
            mat.opacity = 1.0;
            visualMesh.scale.set(1.6, 1.6, 1.6);
          } else if (sel.neighborIds.has(item.id)) {
            // Direct neighbour: crisp white, prominent
            mat.color.setHex(0xffffff);
            mat.opacity = 0.95;
            visualMesh.scale.set(1.3, 1.3, 1.3);
          } else {
            // Unrelated nodes: faded but retained in 3D context
            mat.color.setHex(0x52525b);
            mat.opacity = 0.18;
            visualMesh.scale.set(0.9, 0.9, 0.9);
          }
        } else if (sel.clusterId) {
          if (item.clusterId === sel.clusterId) {
            // Active cluster: highlighted
            mat.color.setHex(0xf26522);
            mat.opacity = 0.95;
            visualMesh.scale.set(1.35, 1.35, 1.35);
          } else {
            mat.color.setHex(0x52525b);
            mat.opacity = 0.22;
            visualMesh.scale.set(0.95, 0.95, 0.95);
          }
        } else {
          // Default universe overview
          mat.color.setHex(0xf4f4f5);
          mat.opacity = 0.88;
          visualMesh.scale.set(1.0, 1.0, 1.0);
        }
      });

      // ── Dynamic Edge Highlighting Based on Selection ──
      edgeMeshes.forEach(({ line, edge }) => {
        const mat = line.material as THREE.LineBasicMaterial;

        if (sel.selectedId) {
          if (sel.activeEdgeIds.has(edge.id)) {
            // Active connecting relationship: vibrant orange
            mat.color.setHex(0xf26522);
            mat.opacity = 0.85;
          } else {
            // Faded background edge
            mat.color.setHex(0x3f3f46);
            mat.opacity = 0.04;
          }
        } else if (sel.clusterId) {
          const m1 = DEMO_MEMORIES.find((m) => m.id === edge.sourceId);
          const m2 = DEMO_MEMORIES.find((m) => m.id === edge.targetId);
          const isClusterEdge = m1?.clusterId === sel.clusterId || m2?.clusterId === sel.clusterId;

          if (isClusterEdge) {
            mat.color.setHex(0xf26522);
            mat.opacity = 0.65;
          } else {
            mat.color.setHex(0x3f3f46);
            mat.opacity = 0.05;
          }
        } else {
          mat.color.setHex(0x666a74);
          mat.opacity = 0.22;
        }
      });

      // ── Traveling Photons (Flow along active or ambient edges) ──
      const activeEdges =
        sel.selectedId && sel.activeEdgeIds.size > 0
          ? edgeMeshes.filter((e) => sel.activeEdgeIds.has(e.edge.id))
          : edgeMeshes;

      if (activeEdges.length > 0) {
        const pArray = photonGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < photonCount; i++) {
          const e = activeEdges[i % activeEdges.length];
          const t = (time * 0.35 + i * (1.0 / photonCount)) % 1.0;
          const pos = new THREE.Vector3().lerpVectors(e.startPoint, e.endPoint, t);
          pArray[i * 3 + 0] = pos.x;
          pArray[i * 3 + 1] = pos.y;
          pArray[i * 3 + 2] = pos.z;
        }
        photonGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ════════════════════════════════════════════════════════════════════════
    // 8. INTERACTIVE EVENTS: HOVER, CLICK, ZOOM, ORBIT
    // ════════════════════════════════════════════════════════════════════════

    const onPointerDown = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      s.isDragging = true;
      s.autoRotate = false;
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

        const rotSpeed = 0.0065;
        s.targetYaw -= dx * rotSpeed;
        s.targetPitch += dy * rotSpeed;

        s.yawVelocity = -dx * rotSpeed * 0.35;
        s.pitchVelocity = dy * rotSpeed * 0.35;
        return;
      }

      // Raycast against proxy meshes for smooth, reliable hovering
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        nodeMeshes.map((m) => m.proxyMesh)
      );

      if (intersects.length > 0) {
        const hitProxy = intersects[0].object as THREE.Mesh;
        const memoryItem = hitProxy.userData.memory as MemoryNode;
        const visualMesh = hitProxy.userData.visualMesh as THREE.Mesh;

        setHoveredMemoryId(memoryItem.id);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        particlesMaterial.uniforms.uHoveredPos.value.copy(visualMesh.position);
      } else {
        setHoveredMemoryId(null);
        setTooltipPos(null);
        particlesMaterial.uniforms.uHoveredPos.value.set(-1000, -1000, -1000);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = cameraStateRef.current;
      s.isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = cameraStateRef.current;
      s.autoRotate = false;

      const zoomFactor = 1.0 + Math.abs(e.deltaY) * 0.0016;
      if (e.deltaY > 0) {
        s.targetRadius = Math.min(s.maxRadius, s.targetRadius * zoomFactor);
      } else {
        s.targetRadius = Math.max(s.minRadius, s.targetRadius / zoomFactor);
      }
    };

    // Click: select memory node or click empty space to reset
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        nodeMeshes.map((m) => m.proxyMesh)
      );

      if (intersects.length > 0) {
        const hitProxy = intersects[0].object as THREE.Mesh;
        const memoryItem = hitProxy.userData.memory as MemoryNode;
        handleSelectMemory(memoryItem.id);
      } else {
        // Click on empty space: clear selection
        setSelectedMemoryId(null);
        setSelectedClusterId(null);
      }
    };

    const onDblClick = () => {
      handleResetView();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleResetView();
      } else if (e.key === "r" || e.key === "R") {
        handleResetView();
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
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
          s.targetRadius = Math.max(
            s.minRadius,
            Math.min(s.maxRadius, s.targetRadius - delta * 0.8)
          );
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

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDblClick);
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
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      softCircleTex.dispose();
      nodeGeo.dispose();
      proxyGeo.dispose();
      edgeMeshes.forEach((e) => {
        e.line.geometry.dispose();
        (e.line.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [handleResetView, handleSelectMemory]);

  // Current hovered memory node
  const hoveredNode = useMemo(() => {
    if (!hoveredMemoryId) return null;
    return DEMO_MEMORIES.find((m) => m.id === hoveredMemoryId) || null;
  }, [hoveredMemoryId]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden bg-transparent select-none font-sans text-white ${className}`}
    >
      {/* ── 3D WebGL Canvas ── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none bg-transparent outline-none"
        tabIndex={0}
        aria-label="Maximem Explorable Living Memory Graph"
      />

      {/* ── TOP CONTROLS & SEARCH BAR ── */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Topic Cluster Navigation Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <button
            onClick={handleResetView}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all backdrop-blur-md border ${
              !selectedMemoryId && !selectedClusterId
                ? "bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.15)]"
                : "bg-[#141412]/80 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
            }`}
          >
            <Compass className="size-3" />
            <span>Complete Universe</span>
          </button>

          {TOPIC_CLUSTERS.map((cluster) => {
            const isActive = selectedClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => handleSelectCluster(cluster.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide flex items-center gap-1.5 transition-all whitespace-nowrap backdrop-blur-md border ${
                  isActive
                    ? "bg-[#f26522] text-white border-[#f26522] shadow-[0_4px_16px_rgba(242,101,34,0.35)]"
                    : "bg-[#141412]/80 text-[#a1a1aa] border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isActive ? "bg-white" : "bg-[#f26522]"
                  }`}
                />
                <span>{cluster.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search Box & Reset Action */}
        <div className="pointer-events-auto flex items-center gap-2 relative">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141412]/90 backdrop-blur-md border border-white/15 focus-within:border-[#f26522] transition-colors shadow-lg">
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
                placeholder="Search memories... (/)"
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
              <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-xl bg-[#141412]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-50">
                <div className="text-[10px] font-mono uppercase text-[#71717a] px-2 py-1">
                  Matching Memories ({searchResults.length})
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectMemory(result.id)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col gap-0.5 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-white group-hover:text-[#f26522] transition-colors">
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

          {(selectedMemoryId || selectedClusterId) && (
            <button
              onClick={handleResetView}
              className="px-2.5 py-1.5 rounded-full bg-[#141412]/90 backdrop-blur-md border border-white/15 hover:border-white/30 text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1.5 transition-colors shadow-lg"
              title="Reset View (Esc)"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MINIMAL HOVER TOOLTIP ── */}
      {hoveredNode && tooltipPos && !selectedMemoryId && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-[8px] bg-[#121210]/95 backdrop-blur-md border border-white/[0.14] shadow-[0_12px_28px_rgba(0,0,0,0.65)] text-left max-w-[280px] -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 12}px`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="size-1.5 rounded-full bg-[#f26522]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#f26522] font-semibold">
              {hoveredNode.topic}
            </span>
          </div>
          <div className="text-[12px] font-medium text-white leading-snug">
            {hoveredNode.title}
          </div>
          <div className="text-[10px] text-[#71717a] mt-1 flex items-center justify-between font-mono">
            <span>{hoveredNode.source}</span>
            <span className="text-[#f26522]">Click to explore →</span>
          </div>
        </div>
      )}

      {/* ── COMPACT MEMORY DETAIL PANEL (SHOWN ON SELECTION) ── */}
      {selectedMemory && (
        <div className="absolute bottom-4 right-4 z-40 max-w-[390px] w-full p-4 rounded-2xl bg-[#141412]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_48px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header with Topic Badge & Close */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#f26522] ring-4 ring-[#f26522]/20" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
                {selectedMemory.topic}
              </span>
            </div>
            <button
              onClick={() => setSelectedMemoryId(null)}
              className="text-[#a1a1aa] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Close Panel"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Title & Description */}
          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5">
            {selectedMemory.title}
          </h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">
            {selectedMemory.description}
          </p>

          {/* Provenance Metadata */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] pb-3 border-b border-white/10 mb-3">
            <span className="truncate max-w-[210px]">{selectedMemory.source}</span>
            <span>{selectedMemory.timestamp}</span>
          </div>

          {/* Connected Memories & Plain-English Relationship Reasons */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Link2 className="size-3 text-[#f26522]" />
                Related Memories ({relatedConnections.length})
              </span>
              <span className="text-[#71717a]">Click to navigate</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
              {relatedConnections.map(({ edge, otherNode }) => (
                <button
                  key={edge.id}
                  onClick={() => handleSelectMemory(otherNode.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-[#f26522]/40 transition-all group flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium capitalize bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30">
                      {edge.type}
                    </span>
                    <ArrowRight className="size-3 text-[#71717a] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors leading-snug">
                    {otherNode.title}
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] leading-tight line-clamp-2">
                    {edge.reason}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOPIC CLUSTER DETAIL PANEL (SHOWN ON CLUSTER SELECTION) ── */}
      {selectedCluster && !selectedMemoryId && (
        <div className="absolute bottom-4 right-4 z-40 max-w-[380px] w-full p-4 rounded-2xl bg-[#141412]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_48px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-[#f26522]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f26522] font-semibold">
                Topic Cluster · {selectedCluster.tag}
              </span>
            </div>
            <button
              onClick={() => setSelectedClusterId(null)}
              className="text-[#a1a1aa] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug mb-1">
            {selectedCluster.name}
          </h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">
            {selectedCluster.description}
          </p>

          <div className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider mb-2">
            Memories in this Cluster (
            {DEMO_MEMORIES.filter((m) => m.clusterId === selectedCluster.id).length})
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-none">
            {DEMO_MEMORIES.filter((m) => m.clusterId === selectedCluster.id).map((mem) => (
              <button
                key={mem.id}
                onClick={() => handleSelectMemory(mem.id)}
                className="w-full text-left p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors">
                    {mem.title}
                  </div>
                  <div className="text-[10px] text-[#71717a] font-mono">{mem.source}</div>
                </div>
                <ArrowRight className="size-3 text-[#71717a] group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM CANVAS INSTRUCTIONS & HINTS ── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#141412]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Click memory to inspect relationships</span>
        <span>•</span>
        <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">/</kbd> to search</span>
      </div>
    </div>
  );
}

export default AiMemoryVisualizationSection;
