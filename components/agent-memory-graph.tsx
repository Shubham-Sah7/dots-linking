"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  X,
  ArrowRight,
  Link2,
  ChevronRight,
  Activity,
  Layers,
} from "lucide-react";
import { spaceSoundscape } from "@/lib/audio/space-soundscape";

// ═══════════════════════════════════════════════════════════════════════════════
// 1.  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentMemoryTier = "active" | "recent" | "stored";

export type AgentRelationType =
  | "influenced by"
  | "derived from"
  | "verified by"
  | "supersedes"
  | "follow-up to"
  | "same context";

export interface AgentMemoryNode {
  id: string;
  title: string;
  description: string;
  topic: string;
  source: string;
  timestamp: string;
  tier: AgentMemoryTier;
  position: THREE.Vector3;
}

export interface AgentMemoryEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: AgentRelationType;
  reason: string;
}

export interface LifecyclePhase {
  id: number;
  name: string;
  tag: string;
  desc: string;
}

export const LIFECYCLE_PHASES: LifecyclePhase[] = [
  {
    id: 0,
    name: "Stored Memory",
    tag: "0s • Resting State",
    desc: "Evenly distributed sphere of muted-grey particles representing long-term knowledge.",
  },
  {
    id: 1,
    name: "New Information",
    tag: "1s • Ingestion",
    desc: "New sensory memories ignite in Maximem orange at the perimeter and stream inward.",
  },
  {
    id: 2,
    name: "Memory Formation",
    tag: "2s • Integration",
    desc: "Incoming information settles toward related areas and binds into the network.",
  },
  {
    id: 3,
    name: "Active Context",
    tag: "3s • Working Memory",
    desc: "The central core condenses and illuminates in brilliant white as the agent reasons.",
  },
  {
    id: 4,
    name: "Recall",
    tag: "4s • Synaptic Wave",
    desc: "A focused wave of light pulses outward along connection paths to relevant memories.",
  },
  {
    id: 5,
    name: "Return",
    tag: "5s • Equilibrium",
    desc: "The active context integrates back into the full circular sphere, restoring balance.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2.  SPHERICAL MATHEMATICS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function sphereShell(phi: number, theta: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function shortestAngle(current: number, target: number): number {
  const twoPi = Math.PI * 2;
  let diff = (target - current) % twoPi;
  if (diff < -Math.PI) diff += twoPi;
  if (diff > Math.PI) diff -= twoPi;
  return current + diff;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3.  DEMO GRAPH DATA — 24 STRUCTURED AGENT MEMORIES ACROSS 3 CONCENTRIC TIERS
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_MEMORIES: AgentMemoryNode[] = [
  // ── Tier 1: Active Context (Compact Core Cluster, r ≈ 2.8 - 4.6)
  {
    id: "agt-core-01",
    title: "User prompt intent: Export RAG metrics",
    description: "User asked for a low-latency comparison of vector recall vs graph search for the Q4 review.",
    topic: "Working Context",
    source: "Active Chat Session",
    timestamp: "Just now",
    tier: "active",
    position: sphereShell(1.30, 0.40, 3.2),
  },
  {
    id: "agt-core-02",
    title: "Context token constraint: 8 000 cap",
    description: "Active context window must stay strictly within 8,000 tokens to preserve fast generation speed.",
    topic: "Working Context",
    source: "Runtime System Instruction",
    timestamp: "Active",
    tier: "active",
    position: sphereShell(1.65, 0.85, 3.8),
  },
  {
    id: "agt-core-03",
    title: "Primary target schema: Zod validator",
    description: "Active response requires validated JSON output using the internal Zod schema definition.",
    topic: "Working Context",
    source: "API Boundary Spec",
    timestamp: "Active",
    tier: "active",
    position: sphereShell(1.10, 1.25, 3.5),
  },
  {
    id: "agt-core-04",
    title: "Session persona: Staff AI Architect",
    description: "Tone is technical, concise, and focused on verifiable architecture trade-offs without buzzwords.",
    topic: "Working Context",
    source: "System Prompt",
    timestamp: "Session Init",
    tier: "active",
    position: sphereShell(1.90, 0.25, 4.2),
  },
  {
    id: "agt-core-05",
    title: "Current workspace: Maximem Dashboard",
    description: "Working directory is set to app root with Next.js Turbopack and Three.js WebGL canvas.",
    topic: "Working Context",
    source: "Environment Variable",
    timestamp: "Session Init",
    tier: "active",
    position: sphereShell(1.45, 1.65, 3.6),
  },
  {
    id: "agt-core-06",
    title: "Synthesis task: Correlate latency to chunk size",
    description: "Agent is formulating the analytical response comparing 512-token chunks with 128-token chunks.",
    topic: "Working Context",
    source: "Agent Scratchpad",
    timestamp: "Just now",
    tier: "active",
    position: sphereShell(1.75, 1.15, 4.0),
  },

  // ── Tier 2: Recent Memories & Decisions (Inner Layer, r ≈ 8.5 - 11.8)
  {
    id: "agt-rec-01",
    title: "Semantic Chunker Pipeline merged (PR #412)",
    description: "Document ingestion was upgraded with recursive semantic chunking, reducing recall noise by 31%.",
    topic: "Project Decision",
    source: "GitHub PR #412",
    timestamp: "2 days ago",
    tier: "recent",
    position: sphereShell(1.15, 0.60, 9.8),
  },
  {
    id: "agt-rec-02",
    title: "Postgres pgvector selected over Pinecone",
    description: "Egress latency benchmarks confirmed co-locating embeddings in Postgres saved 42ms per query.",
    topic: "Project Decision",
    source: "Architecture Log #18",
    timestamp: "3 days ago",
    tier: "recent",
    position: sphereShell(1.85, 0.95, 10.4),
  },
  {
    id: "agt-rec-03",
    title: "Aria requested sprint thread digests",
    description: "Aria flagged notification fatigue and prefers weekly synthesized summaries over realtime mentions.",
    topic: "Past Conversation",
    source: "Slack #eng-sync",
    timestamp: "Yesterday",
    tier: "recent",
    position: sphereShell(0.75, 1.80, 10.8),
  },
  {
    id: "agt-rec-04",
    title: "Benchmark: Hybrid graph+vector recall = 89%",
    description: "Hybrid traversal outperformed pure vector similarity by 18 points on domain-specific questions.",
    topic: "Research Finding",
    source: "Research Note #34",
    timestamp: "4 days ago",
    tier: "recent",
    position: sphereShell(2.20, 1.40, 10.2),
  },
  {
    id: "agt-rec-05",
    title: "Cosine similarity threshold pinned at 0.82",
    description: "Chunks scoring below 0.82 cosine similarity add hallucinations and are discarded pre-LLM.",
    topic: "User Preference",
    source: "Calibration Report",
    timestamp: "5 days ago",
    tier: "recent",
    position: sphereShell(1.40, 2.30, 11.2),
  },
  {
    id: "agt-rec-06",
    title: "Marcus approved Vercel edge deployment",
    description: "Marcus gave final production sign-off for the streaming memory edge endpoints.",
    topic: "Project Decision",
    source: "Release Review #88",
    timestamp: "6 days ago",
    tier: "recent",
    position: sphereShell(0.90, 2.80, 9.5),
  },
  {
    id: "agt-rec-07",
    title: "Follow-up: Validate token budget under peak load",
    description: "Load test memory retrieval with 10 concurrent requests to measure latency spikes.",
    topic: "Follow-up Task",
    source: "Linear Task #519",
    timestamp: "Yesterday",
    tier: "recent",
    position: sphereShell(2.05, 2.60, 11.0),
  },
  {
    id: "agt-rec-08",
    title: "Streaming writes flushes without batch lag",
    description: "Implemented event-driven write queue so memory updates reflect in the graph within 150ms.",
    topic: "Project Decision",
    source: "Eng Meeting Notes",
    timestamp: "1 week ago",
    tier: "recent",
    position: sphereShell(1.60, 3.20, 10.6),
  },

  // ── Tier 3: Stored Long-Term Memories (Outer Layer, r ≈ 15.5 - 18.5)
  {
    id: "agt-sto-01",
    title: "Dark mode first design token rule",
    description: "All visual elements must be designed in #1B1B19 dark mode first; light mode maps secondary tokens.",
    topic: "User Preference",
    source: "Design System Guidelines",
    timestamp: "Jun 2024",
    tier: "stored",
    position: sphereShell(0.60, 0.40, 16.8),
  },
  {
    id: "agt-sto-02",
    title: "Elena owns Figma tokens and design review",
    description: "Any UI changes to spacing, radii, or palettes require Elena's review before merging.",
    topic: "User Preference",
    source: "Team Directory",
    timestamp: "Jul 2024",
    tier: "stored",
    position: sphereShell(0.50, 1.30, 17.5),
  },
  {
    id: "agt-sto-03",
    title: "Single-tenant isolation for enterprise pilots",
    description: "Client data must never cross shared database tables during the Q4 pilot deployment phase.",
    topic: "Project Decision",
    source: "Security Policy v2",
    timestamp: "Aug 2024",
    tier: "stored",
    position: sphereShell(1.15, 4.10, 17.2),
  },
  {
    id: "agt-sto-04",
    title: "NeurIPS '24 insight: Working memory in transformers",
    description: "Transformer context behaves like human working memory; Maximem's 3-tier architecture mirrors this.",
    topic: "Research Finding",
    source: "NeurIPS 2024 Paper",
    timestamp: "Sep 2024",
    tier: "stored",
    position: sphereShell(2.10, 4.40, 18.0),
  },
  {
    id: "agt-sto-05",
    title: "James timezone operates at UTC+8 (APAC)",
    description: "James works during Singapore business hours; emergency mentions should consider his schedule.",
    topic: "User Preference",
    source: "HR Sync",
    timestamp: "May 2024",
    tier: "stored",
    position: sphereShell(0.85, 5.00, 16.5),
  },
  {
    id: "agt-sto-06",
    title: "Strict TypeScript: noImplicitAny banned",
    description: "Zero type escape-hatches are permitted across the core agent codebase to protect runtime safety.",
    topic: "User Preference",
    source: "Engineering Playbook",
    timestamp: "Apr 2024",
    tier: "stored",
    position: sphereShell(2.40, 3.60, 17.4),
  },
  {
    id: "agt-sto-07",
    title: "Memory score exponential decay (30-day half-life)",
    description: "Freshness score decays exponentially over 30 days to avoid stale knowledge biasing recall.",
    topic: "Research Finding",
    source: "Algorithm Specification",
    timestamp: "Aug 2024",
    tier: "stored",
    position: sphereShell(1.80, 5.30, 18.2),
  },
  {
    id: "agt-sto-08",
    title: "Mobile-first onboarding funnel approval",
    description: "Growth analytics showed 64% of users start onboarding on mobile, leading to mobile priority.",
    topic: "Project Decision",
    source: "Growth Board Note",
    timestamp: "Sep 2024",
    tier: "stored",
    position: sphereShell(2.65, 2.10, 16.9),
  },
  {
    id: "agt-sto-09",
    title: "Open-source semantic chunker module planned",
    description: "Commitment made to open-source the core chunking module in early 2025 for community adoption.",
    topic: "Project Decision",
    source: "Public Roadmap",
    timestamp: "Oct 2024",
    tier: "stored",
    position: sphereShell(1.35, 5.70, 17.6),
  },
  {
    id: "agt-sto-10",
    title: "Cross-App Memory Bridge Linear/Slack sync",
    description: "Unified identity tokens allow memories captured in Slack to connect with Linear issues.",
    topic: "Research Finding",
    source: "Product RFC #12",
    timestamp: "Sep 2024",
    tier: "stored",
    position: sphereShell(2.25, 5.90, 17.8),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.  MEANINGFUL GRAPH EDGES (Explicit Agent Relationships)
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_EDGES: AgentMemoryEdge[] = [
  // Core working context connections
  { id: "ae-01", sourceId: "agt-core-01", targetId: "agt-rec-04", type: "derived from", reason: "The user request for RAG metrics is directly answered by the recent 89% hybrid benchmark findings." },
  { id: "ae-02", sourceId: "agt-core-01", targetId: "agt-rec-01", type: "same context", reason: "Retrieval accuracy depends directly on the Semantic Chunker Pipeline merged in PR #412." },
  { id: "ae-03", sourceId: "agt-core-02", targetId: "agt-rec-05", type: "influenced by", reason: "The 8,000 token budget is enforced using the 0.82 cosine similarity cutoff to filter noise." },
  { id: "ae-04", sourceId: "agt-core-03", targetId: "agt-sto-06", type: "verified by", reason: "Zod runtime schema validation satisfies the monorepo's strict TypeScript enforcement rule." },
  { id: "ae-05", sourceId: "agt-core-06", targetId: "agt-sto-04", type: "derived from", reason: "The synthesis task structures working memory according to the NeurIPS '24 transformer memory model." },

  // Recent decisions & bridges to stored long-term memory
  { id: "ae-06", sourceId: "agt-rec-01", targetId: "agt-sto-09", type: "same context", reason: "The production semantic chunker pipeline is the same module scheduled for open-source release." },
  { id: "ae-07", sourceId: "agt-rec-02", targetId: "agt-sto-03", type: "influenced by", reason: "Choosing pgvector was motivated by maintaining single-tenant data isolation within Postgres." },
  { id: "ae-08", sourceId: "agt-rec-03", targetId: "agt-sto-05", type: "influenced by", reason: "Aria's async preference coordinates directly with James's APAC timezone operating hours." },
  { id: "ae-09", sourceId: "agt-rec-04", targetId: "agt-rec-02", type: "verified by", reason: "Hybrid recall testing validated keeping pgvector alongside the structural graph store." },
  { id: "ae-10", sourceId: "agt-rec-05", targetId: "agt-sto-07", type: "derived from", reason: "Cosine cutoff filtering incorporates the 30-day exponential memory score decay weight." },
  { id: "ae-11", sourceId: "agt-rec-06", targetId: "agt-rec-08", type: "verified by", reason: "Marcus's production sign-off was required before deploying streaming real-time writes." },
  { id: "ae-12", sourceId: "agt-rec-07", targetId: "agt-core-02", type: "follow-up to", reason: "The load test task is a follow-up to measure whether the 8,000 token cap holds under concurrency." },

  // Stored architectural foundations
  { id: "ae-13", sourceId: "agt-sto-01", targetId: "agt-sto-02", type: "same context", reason: "Elena authors and enforces the dark-mode-first token guidelines across all UI components." },
  { id: "ae-14", sourceId: "agt-sto-04", targetId: "agt-sto-07", type: "derived from", reason: "Long-term social memory theory provides the scientific foundation for exponential score decay." },
  { id: "ae-15", sourceId: "agt-sto-08", targetId: "agt-sto-10", type: "same context", reason: "Mobile onboarding depends on the Cross-App Memory Bridge to sync credentials from desktop." },
  { id: "ae-16", sourceId: "agt-rec-08", targetId: "agt-sto-10", type: "derived from", reason: "Streaming writes power the live cross-app synchronisation between Slack and Linear." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5.  MAIN COMPONENT — AGENT MEMORY GRAPH (OPTION 03)
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentMemoryGraphProps {
  className?: string;
}

export function AgentMemoryGraph({ className = "" }: AgentMemoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lifecycle Animation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentPhaseId, setCurrentPhaseId] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0);

  // Selection & Search State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isPlayingRef = useRef(true);
  isPlayingRef.current = isPlaying;

  const currentPhaseRef = useRef(0);
  currentPhaseRef.current = currentPhaseId;

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  // Selected memory object
  const selectedMemory = useMemo(
    () => AGENT_MEMORIES.find((m) => m.id === selectedId) ?? null,
    [selectedId]
  );

  // Hovered memory object
  const hoveredMemory = useMemo(
    () => AGENT_MEMORIES.find((m) => m.id === hoveredId) ?? null,
    [hoveredId]
  );

  // Connected memories
  const relatedConnections = useMemo(() => {
    if (!selectedId) return [];
    return AGENT_EDGES.filter(
      (e) => e.sourceId === selectedId || e.targetId === selectedId
    )
      .map((e) => {
        const otherId = e.sourceId === selectedId ? e.targetId : e.sourceId;
        return {
          edge: e,
          otherNode: AGENT_MEMORIES.find((m) => m.id === otherId)!,
        };
      })
      .filter((x) => x.otherNode);
  }, [selectedId]);

  // Search filter
  const filteredMemories = useMemo(() => {
    if (!searchQuery.trim()) return AGENT_MEMORIES;
    const q = searchQuery.toLowerCase();
    return AGENT_MEMORIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Camera Orbit Reference
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const orbitRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    phi: Math.PI / 2.3,
    theta: 0.35,
    radius: 54,
    targetPhi: Math.PI / 2.3,
    targetTheta: 0.35,
    targetRadius: 54,
    focus: new THREE.Vector3(0, 0, 0),
    targetFocus: new THREE.Vector3(0, 0, 0),
    touchDist: 0,
  });

  // Smooth camera navigation
  const navigateToNode = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      const mem = AGENT_MEMORIES.find((m) => m.id === id);
      if (mem) {
        const pos = mem.position;
        const r = pos.length();
        const targetPhi = Math.acos(pos.y / r);
        const rawTheta = Math.atan2(pos.x, pos.z);
        orbitRef.current.targetTheta = shortestAngle(
          orbitRef.current.targetTheta,
          rawTheta
        );
        orbitRef.current.targetPhi = Math.max(
          0.25,
          Math.min(Math.PI - 0.25, targetPhi)
        );
        orbitRef.current.targetRadius = 36;
        orbitRef.current.targetFocus.copy(pos).multiplyScalar(0.35);
      }
    } else {
      orbitRef.current.targetRadius = 54;
      orbitRef.current.targetFocus.set(0, 0, 0);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    spaceSoundscape.playGlideTransition();
    navigateToNode(null);
    orbitRef.current.targetPhi = Math.PI / 2.3;
    orbitRef.current.targetRadius = 54;
    orbitRef.current.targetFocus.set(0, 0, 0);
  }, [navigateToNode]);

  // Phase selection helper
  const handleSelectPhase = useCallback((phaseId: number) => {
    spaceSoundscape.playGlideTransition();
    setCurrentPhaseId(phaseId);
    currentPhaseRef.current = phaseId;
    setPhaseProgress(0);
    // Smooth camera framing based on state
    if (phaseId === 3 || phaseId === 4) {
      // Zoom into active working context
      orbitRef.current.targetRadius = 38;
      orbitRef.current.targetFocus.set(0, 0, 0);
    } else {
      // Restore full spherical overview
      orbitRef.current.targetRadius = 54;
      orbitRef.current.targetFocus.set(0, 0, 0);
    }
  }, []);

  // ── Build WebGL Simulation ──
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 800);

    function syncCamera() {
      const o = orbitRef.current;
      const camX = o.focus.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta);
      const camY = o.focus.y + o.radius * Math.cos(o.phi);
      const camZ = o.focus.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta);
      camera.position.set(camX, camY, camZ);
      camera.lookAt(o.focus);
    }
    syncCamera();

    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ─────────────────────────────────────────────────────────────────────────
    // A. GPU MULTI-LAYER PARTICLE FIELD (~4,200 Particles)
    // Concentric Spherical Layers: Core, Inner, Outer, Ingestion Stream
    // ─────────────────────────────────────────────────────────────────────────
    const LAYER_SPECS = [
      { r: 3.2,  count: 240,  tierId: 0, size: 1.4 },  // Active Core Cluster
      { r: 7.2,  count: 580,  tierId: 1, size: 1.2 },  // Inner Transition Layer
      { r: 10.8, count: 1100, tierId: 1, size: 1.1 },  // Recent Memory Mantle
      { r: 15.2, count: 1200, tierId: 2, size: 0.95 }, // Long-term Memory Hull
      { r: 18.8, count: 1080, tierId: 2, size: 0.85 }, // Perimeter Boundary
    ];

    const TOTAL_PARTICLES = LAYER_SPECS.reduce((acc, s) => acc + s.count, 0);

    const posArray       = new Float32Array(TOTAL_PARTICLES * 3);
    const targetPosArray = new Float32Array(TOTAL_PARTICLES * 3);
    const tierArray      = new Float32Array(TOTAL_PARTICLES);
    const seedArray      = new Float32Array(TOTAL_PARTICLES);
    const sizeArray      = new Float32Array(TOTAL_PARTICLES);

    const GA = Math.PI * (3 - Math.sqrt(5)); // Golden Angle Fibonacci distribution
    let pIdx = 0;

    LAYER_SPECS.forEach(({ r, count, tierId, size }) => {
      for (let i = 0; i < count && pIdx < TOTAL_PARTICLES; i++, pIdx++) {
        const y = 1 - (i / Math.max(count - 1, 1)) * 2;
        const rFlat = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = GA * i;

        const jitter = (Math.random() - 0.5) * (tierId === 0 ? 0.3 : 0.65);
        const radius = r + jitter;

        const x = radius * rFlat * Math.cos(theta);
        const py = radius * y;
        const z = radius * rFlat * Math.sin(theta);

        posArray[pIdx * 3 + 0] = x;
        posArray[pIdx * 3 + 1] = py;
        posArray[pIdx * 3 + 2] = z;

        // In State 4 (Active context), core particles contract and condense
        let tx = x;
        let ty = py;
        let tz = z;
        if (tierId === 0) {
          tx *= 0.55;
          ty *= 0.55;
          tz *= 0.55;
        } else if (tierId === 1) {
          tx *= 0.88;
          ty *= 0.88;
          tz *= 0.88;
        }

        targetPosArray[pIdx * 3 + 0] = tx;
        targetPosArray[pIdx * 3 + 1] = ty;
        targetPosArray[pIdx * 3 + 2] = tz;

        tierArray[pIdx] = tierId;
        seedArray[pIdx] = Math.random();
        sizeArray[pIdx] = size * (0.88 + Math.random() * 0.25);
      }
    });

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute("targetPos", new THREE.BufferAttribute(targetPosArray, 3));
    particlesGeo.setAttribute("tier", new THREE.BufferAttribute(tierArray, 1));
    particlesGeo.setAttribute("seed", new THREE.BufferAttribute(seedArray, 1));
    particlesGeo.setAttribute("particleSize", new THREE.BufferAttribute(sizeArray, 1));

    const particlesMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:        { value: 0 },
        uPhase:       { value: 0.0 }, // Continuous lifecycle phase (0.0 to 5.99)
        uOrange:      { value: new THREE.Color(0xf26522) },
        uWhite:       { value: new THREE.Color(0xffffff) },
        uMutedGrey:   { value: new THREE.Color(0x6b7280) },
        uDarkGrey:    { value: new THREE.Color(0x374151) },
        uRecallWave:  { value: 0.0 },
        uSelectedPos: { value: new THREE.Vector3(9999, 9999, 9999) },
      },
      vertexShader: `
        attribute vec3 targetPos;
        attribute float tier;
        attribute float seed;
        attribute float particleSize;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;

        uniform float uTime;
        uniform float uPhase;
        uniform vec3 uOrange;
        uniform vec3 uWhite;
        uniform vec3 uMutedGrey;
        uniform vec3 uDarkGrey;
        uniform float uRecallWave;
        uniform vec3 uSelectedPos;

        mat3 rotY(float a) {
          float c = cos(a); float s = sin(a);
          return mat3(c,0,s, 0,1,0, -s,0,c);
        }

        void main() {
          float phaseId = floor(uPhase);
          float frac = fract(uPhase);

          // Smooth transition between base pos and active condensed core
          float condenseFactor = 0.0;
          if (phaseId == 3.0) {
            condenseFactor = smoothstep(0.0, 1.0, frac);
          } else if (phaseId == 4.0) {
            condenseFactor = 1.0 - smoothstep(0.0, 1.0, frac) * 0.4;
          } else if (phaseId == 5.0) {
            condenseFactor = 0.6 * (1.0 - smoothstep(0.0, 1.0, frac));
          }

          vec3 p = mix(position, targetPos, condenseFactor);

          // Gentle continuous spherical rotation
          float rotSpeed = (tier == 0.0 ? 0.025 : tier == 1.0 ? -0.018 : 0.012);
          p = rotY(uTime * rotSpeed + p.y * 0.005) * p;

          // Living organic breathing
          float breathe = sin(uTime * 0.9 + length(p) * 0.15 + tier * 0.6) * 0.28;
          p += normalize(p + vec3(0.0001)) * breathe;

          // ── Compute Colors According to the 6 States ──
          vec3 col = uMutedGrey;
          float alpha = 0.70;

          // State 1 (New Information): Perimeter orange influx
          if (phaseId == 1.0) {
            float distFromCenter = length(p);
            if (distFromCenter > 16.5) {
              float ingress = smoothstep(0.0, 1.0, frac);
              col = mix(uMutedGrey, uOrange, ingress);
              alpha = mix(0.65, 0.95, ingress);
            }
          }
          // State 2 (Memory Formation): Influx migrates inward
          else if (phaseId == 2.0) {
            float distFromCenter = length(p);
            if (distFromCenter > 10.0 && distFromCenter < 17.0) {
              col = mix(uOrange, uMutedGrey, frac * 0.6);
              alpha = 0.85;
            }
          }
          // State 3 (Active Context): Core illuminates in bright white
          else if (phaseId == 3.0) {
            if (tier == 0.0) {
              float glow = smoothstep(0.0, 1.0, frac);
              col = mix(uMutedGrey, uWhite, glow);
              alpha = mix(0.70, 1.0, glow);
            } else {
              col = mix(uMutedGrey, uDarkGrey, frac * 0.45);
              alpha = mix(0.70, 0.35, frac);
            }
          }
          // State 4 (Recall): Light wave travels outward from core
          else if (phaseId == 4.0) {
            float r = length(p);
            float waveFront = frac * 20.0;
            float d = abs(r - waveFront);
            float waveHit = smoothstep(2.5, 0.0, d);
            col = mix(tier == 0.0 ? uWhite : uMutedGrey, uOrange, waveHit * 0.9);
            alpha = mix(0.65, 1.0, waveHit);
          }
          // State 5 (Return): Settle back to resting state
          else if (phaseId == 5.0) {
            col = mix(uMutedGrey, uMutedGrey, frac);
            alpha = mix(0.55, 0.70, frac);
          }

          // Subtle excitation near user-selected node
          float selDist = length(p - uSelectedPos);
          if (selDist < 5.0) {
            col = mix(col, uOrange, smoothstep(5.0, 0.8, selDist) * 0.65);
            alpha = 1.0;
          }

          vColor = col;
          vAlpha = alpha;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float dist = -mv.z;
          float gsz = particleSize * (300.0 / max(dist, 8.0));
          gl_PointSize = clamp(gsz, 0.9, 8.0);
          vDepth = dist;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.18, d) * vAlpha;
          float core  = 1.0 - smoothstep(0.0, 0.22, d);
          vec3 finalCol = vColor + vec3(core * 0.25);

          float depthAlpha = smoothstep(360.0, 20.0, vDepth);
          gl_FragColor = vec4(finalCol, alpha * clamp(depthAlpha, 0.2, 1.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // B. MEMORY NODES (Clean, Crisp 3D Jewel Beads)
    // ─────────────────────────────────────────────────────────────────────────
    const nodeMeshes: {
      proxy: THREE.Mesh;
      visual: THREE.Mesh;
      mem: AgentMemoryNode;
    }[] = [];

    const nodeGroup  = new THREE.Group();
    const proxyGroup = new THREE.Group();

    const beadGeo = new THREE.SphereGeometry(0.40, 16, 16);
    const proxyGeo = new THREE.SphereGeometry(3.0, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    const orangeCol = new THREE.Color(0xf26522);
    const whiteCol  = new THREE.Color(0xffffff);
    const greyCol   = new THREE.Color(0x9ca3af);

    AGENT_MEMORIES.forEach((mem) => {
      const baseCol = mem.tier === "active" ? whiteCol : mem.tier === "recent" ? orangeCol : greyCol;
      const beadMat = new THREE.MeshBasicMaterial({
        color: baseCol,
        transparent: true,
        opacity: 0.95,
      });
      const visual = new THREE.Mesh(beadGeo, beadMat);
      visual.position.copy(mem.position);

      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.position.copy(mem.position);
      proxy.userData = { mem, visual };

      nodeGroup.add(visual);
      proxyGroup.add(proxy);

      nodeMeshes.push({ proxy, visual, mem });
    });

    scene.add(nodeGroup);
    scene.add(proxyGroup);

    // ─────────────────────────────────────────────────────────────────────────
    // C. GRAPH EDGES (Arched Bézier Curves & Photons)
    // ─────────────────────────────────────────────────────────────────────────
    const edgeObjs: {
      line: THREE.Line;
      edge: AgentMemoryEdge;
      ctrl: THREE.Vector3;
      p1: THREE.Vector3;
      p2: THREE.Vector3;
      pts: THREE.Vector3[];
    }[] = [];

    AGENT_EDGES.forEach((edge) => {
      const m1 = AGENT_MEMORIES.find((m) => m.id === edge.sourceId);
      const m2 = AGENT_MEMORIES.find((m) => m.id === edge.targetId);
      if (!m1 || !m2) return;

      const p1 = m1.position;
      const p2 = m2.position;
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const midLen = mid.length();

      let ctrl: THREE.Vector3;
      if (midLen > 0.001) {
        const norm = mid.clone().normalize();
        const archHeight = Math.min(5.5, 0.8 + dist * 0.15);
        ctrl = mid.clone().addScaledVector(norm, archHeight);
      } else {
        ctrl = new THREE.Vector3(0, 14, 0);
      }

      const pts: THREE.Vector3[] = [];
      const SUBDIVS = 24;
      for (let i = 0; i <= SUBDIVS; i++) {
        const u = i / SUBDIVS;
        const x = (1 - u) * (1 - u) * p1.x + 2 * (1 - u) * u * ctrl.x + u * u * p2.x;
        const y = (1 - u) * (1 - u) * p1.y + 2 * (1 - u) * u * ctrl.y + u * u * p2.y;
        const z = (1 - u) * (1 - u) * p1.z + 2 * (1 - u) * u * ctrl.z + u * u * p2.z;
        pts.push(new THREE.Vector3(x, y, z));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.20,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      edgeObjs.push({ line, edge, ctrl, p1, p2, pts });
    });

    // Synaptic Photons Along Edges
    const NUM_PHOTONS = 28;
    const photonPos = new Float32Array(NUM_PHOTONS * 3);
    const photonCol = new Float32Array(NUM_PHOTONS * 3);

    interface Pulse {
      edgeIdx: number;
      t: number;
      speed: number;
    }
    const pulses: Pulse[] = [];
    for (let i = 0; i < NUM_PHOTONS; i++) {
      pulses.push({
        edgeIdx: i % edgeObjs.length,
        t: i / NUM_PHOTONS,
        speed: 0.16 + Math.random() * 0.16,
      });
    }

    const photonGeo = new THREE.BufferGeometry();
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPos, 3));
    photonGeo.setAttribute("color", new THREE.BufferAttribute(photonCol, 3));

    const photonMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = clamp(3.4 * (280.0 / max(dist, 8.0)), 1.5, 6.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d);
          float core  = 1.0 - smoothstep(0.0, 0.2, d);
          gl_FragColor = vec4(vColor + vec3(core * 0.4), alpha * 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const photonPoints = new THREE.Points(photonGeo, photonMat);
    scene.add(photonPoints);

    // ─────────────────────────────────────────────────────────────────────────
    // D. LIFECYCLE ANIMATION & RENDER LOOP
    // ─────────────────────────────────────────────────────────────────────────
    let loopTimer = 0;
    const PHASE_DURATION = 3.5; // seconds per phase
    const TOTAL_CYCLE = 6 * PHASE_DURATION;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clockRef.current.getDelta(), 0.05);
      const t = clockRef.current.getElapsedTime();

      // Damped camera orbit & smooth focus lerp
      const o = orbitRef.current;
      o.phi    += (o.targetPhi    - o.phi)    * 0.055;
      o.theta  += (o.targetTheta  - o.theta)  * 0.055;
      o.radius += (o.targetRadius - o.radius) * 0.055;
      o.focus.lerp(o.targetFocus, 0.055);

      if (!o.isDragging && !selectedIdRef.current) {
        o.targetTheta += 0.0012;
      }
      syncCamera();

      // Lifecycle Clock Progress
      if (isPlayingRef.current) {
        loopTimer = (loopTimer + dt) % TOTAL_CYCLE;
        const currentContinuousPhase = (loopTimer / TOTAL_CYCLE) * 6.0;
        const pId = Math.floor(currentContinuousPhase);
        const pFrac = currentContinuousPhase - pId;

        particlesMat.uniforms.uPhase.value = currentContinuousPhase;
        if (pId !== currentPhaseRef.current) {
          currentPhaseRef.current = pId;
          setCurrentPhaseId(pId);
        }
        setPhaseProgress(pFrac);
      } else {
        // Paused on specific phase
        const targetPhase = currentPhaseRef.current + 0.5;
        particlesMat.uniforms.uPhase.value = targetPhase;
      }

      particlesMat.uniforms.uTime.value = t;

      const selId = selectedIdRef.current;
      const selMem = selId ? AGENT_MEMORIES.find((m) => m.id === selId) : null;
      if (selMem) {
        particlesMat.uniforms.uSelectedPos.value.copy(selMem.position);
      } else {
        particlesMat.uniforms.uSelectedPos.value.set(9999, 9999, 9999);
      }

      // Update Memory Nodes
      nodeMeshes.forEach(({ visual, mem }) => {
        const vMat = visual.material as THREE.MeshBasicMaterial;
        const isActive = selId === mem.id;
        const isNeighbor =
          !isActive &&
          selId !== null &&
          AGENT_EDGES.some(
            (e) =>
              (e.sourceId === selId && e.targetId === mem.id) ||
              (e.targetId === selId && e.sourceId === mem.id)
          );

        if (isActive) {
          vMat.color.set(0xf26522);
          vMat.opacity = 1.0;
          visual.scale.setScalar(1.55 + 0.12 * Math.sin(t * 3.5));
        } else if (isNeighbor) {
          vMat.color.set(0xf26522).lerp(whiteCol, 0.35);
          vMat.opacity = 0.95;
          visual.scale.setScalar(1.25 + 0.08 * Math.sin(t * 2.8));
        } else if (selId !== null) {
          vMat.color.set(0x6b7280);
          vMat.opacity = 0.14;
          visual.scale.setScalar(0.72);
        } else {
          // Idle state colored by structural tier
          const tierCol = mem.tier === "active" ? whiteCol : mem.tier === "recent" ? orangeCol : greyCol;
          vMat.color.copy(tierCol);
          vMat.opacity = mem.tier === "active" ? 1.0 : 0.88;
          visual.scale.setScalar(1.0 + 0.05 * Math.sin(t * 1.5 + mem.position.x));
        }
      });

      // Update Graph Edges
      edgeObjs.forEach(({ line, edge }) => {
        const mat = line.material as THREE.LineBasicMaterial;
        if (selId !== null) {
          const isConnected = edge.sourceId === selId || edge.targetId === selId;
          if (isConnected) {
            mat.color.set(0xf26522);
            mat.opacity = 0.92;
          } else {
            mat.color.set(0x1e293b);
            mat.opacity = 0.03;
          }
        } else {
          // Dynamic Level-of-Detail (LOD):
          // As user zooms in, micro-connections between working memories reveal with clarity
          // When zooming out, micro-connections soften so the concentric tier hulls remain crisp
          const zoomFactor = THREE.MathUtils.clamp((o.radius - 26.0) / (68.0 - 26.0), 0.0, 1.0);
          spaceSoundscape.setZoomAtmosphere(zoomFactor);

          // Subtle cosmic parallax on outer stardust hulls
          particlesMesh.rotation.y = (o.theta - 0.45) * 0.06;
          particlesMesh.rotation.x = (o.phi - Math.PI / 2.3) * 0.04;

          const lodOpacity = 0.12 + (1.0 - zoomFactor) * 0.28;
          mat.color.set(0x526071);
          mat.opacity = lodOpacity;
        }
      });

      // Update Photons Along Active Paths
      const posAttr = photonGeo.attributes.position as THREE.BufferAttribute;
      const colAttr = photonGeo.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < NUM_PHOTONS; i++) {
        const pulse = pulses[i];
        pulse.t += pulse.speed * dt;
        if (pulse.t >= 1.0) {
          pulse.t = 0;
          if (selId !== null) {
            const connectedIndices: number[] = [];
            edgeObjs.forEach((eo, idx) => {
              if (eo.edge.sourceId === selId || eo.edge.targetId === selId) {
                connectedIndices.push(idx);
              }
            });
            if (connectedIndices.length > 0) {
              pulse.edgeIdx =
                connectedIndices[Math.floor(Math.random() * connectedIndices.length)];
            }
          } else {
            pulse.edgeIdx = Math.floor(Math.random() * edgeObjs.length);
          }
        }

        const edgeObj = edgeObjs[pulse.edgeIdx];
        if (edgeObj) {
          const u = pulse.t;
          const { p1, ctrl, p2 } = edgeObj;
          const px = (1 - u) * (1 - u) * p1.x + 2 * (1 - u) * u * ctrl.x + u * u * p2.x;
          const py = (1 - u) * (1 - u) * p1.y + 2 * (1 - u) * u * ctrl.y + u * u * p2.y;
          const pz = (1 - u) * (1 - u) * p1.z + 2 * (1 - u) * u * ctrl.z + u * u * p2.z;

          posAttr.setXYZ(i, px, py, pz);
          const col = selId !== null ? orangeCol : whiteCol;
          colAttr.setXYZ(i, col.r, col.g, col.b);
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // ─────────────────────────────────────────────────────────────────────────
    // E. INTERACTION HANDLERS (Orbit, Pan, Zoom, Pinch)
    // ─────────────────────────────────────────────────────────────────────────
    function onPointerDown(e: PointerEvent) {
      orbitRef.current.isDragging = true;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!orbitRef.current.isDragging) return;
      const dx = e.clientX - orbitRef.current.lastX;
      const dy = e.clientY - orbitRef.current.lastY;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;

      orbitRef.current.targetTheta -= dx * 0.0055;
      orbitRef.current.targetPhi = Math.max(
        0.20,
        Math.min(Math.PI - 0.20, orbitRef.current.targetPhi + dy * 0.0055)
      );
    }

    function onPointerUp() {
      orbitRef.current.isDragging = false;
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      orbitRef.current.targetRadius = Math.max(
        22,
        Math.min(90, orbitRef.current.targetRadius + e.deltaY * 0.035)
      );
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        orbitRef.current.isDragging = true;
        orbitRef.current.lastX = e.touches[0].clientX;
        orbitRef.current.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        orbitRef.current.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        orbitRef.current.touchDist = Math.hypot(dx, dy);
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 1 && orbitRef.current.isDragging) {
        const dx = e.touches[0].clientX - orbitRef.current.lastX;
        const dy = e.touches[0].clientY - orbitRef.current.lastY;
        orbitRef.current.lastX = e.touches[0].clientX;
        orbitRef.current.lastY = e.touches[0].clientY;

        orbitRef.current.targetTheta -= dx * 0.0055;
        orbitRef.current.targetPhi = Math.max(
          0.20,
          Math.min(Math.PI - 0.20, orbitRef.current.targetPhi + dy * 0.0055)
        );
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = orbitRef.current.touchDist - dist;
        orbitRef.current.touchDist = dist;
        orbitRef.current.targetRadius = Math.max(
          22,
          Math.min(90, orbitRef.current.targetRadius + delta * 0.12)
        );
      }
    }

    function onTouchEnd() {
      orbitRef.current.isDragging = false;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    // ─────────────────────────────────────────────────────────────────────────
    // F. RAYCASTING & NODE INSPECTION
    // ─────────────────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pendingHover: string | null = null;

    function getNDC(cx: number, cy: number) {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((cx - r.left) / r.width) * 2 - 1;
      mouse.y = -((cy - r.top) / r.height) * 2 + 1;
    }

    function onMouseMove(e: MouseEvent) {
      getNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.proxy));
      if (hits.length > 0) {
        const mem = hits[0].object.userData.mem as AgentMemoryNode;
        if (pendingHover !== mem.id) {
          pendingHover = mem.id;
          setHoveredId(mem.id);
          setTooltipPos({ x: e.clientX, y: e.clientY });
          canvas.style.cursor = "pointer";
          const tierIdx = mem.tier === "active" ? 0 : mem.tier === "recent" ? 1 : 2;
          spaceSoundscape.playNodePulse(tierIdx, 0);
        }
      } else {
        if (pendingHover !== null) {
          pendingHover = null;
          setHoveredId(null);
          canvas.style.cursor = "grab";
        }
      }
    }

    function onClick(e: MouseEvent) {
      getNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.proxy));
      if (hits.length > 0) {
        const mem = hits[0].object.userData.mem as AgentMemoryNode;
        const tierIdx = mem.tier === "active" ? 0 : mem.tier === "recent" ? 1 : 2;
        spaceSoundscape.playNodePulse(tierIdx, 1);
        navigateToNode(selectedIdRef.current === mem.id ? null : mem.id);
      } else {
        if (selectedIdRef.current) {
          spaceSoundscape.playGlideTransition();
        }
        navigateToNode(null);
      }
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        navigateToNode(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);

      particlesGeo.dispose();
      particlesMat.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      renderer.dispose();
    };
  }, [navigateToNode]);

  // Active phase descriptor
  const activePhase = LIFECYCLE_PHASES[currentPhaseId] ?? LIFECYCLE_PHASES[0];

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER UI OVERLAYS
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#1B1B19] overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left: Lifecycle State Controller Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-xl">
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#181816] border border-white/10 shadow-lg">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? "Pause Lifecycle (Space)" : "Play Lifecycle (Space)"}
            className="flex items-center justify-center size-7 rounded text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors"
          >
            {isPlaying ? <Pause className="size-3.5 text-[#f26522]" /> : <Play className="size-3.5 text-white ml-0.5" />}
          </button>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* 6 Lifecycle Steps */}
          {LIFECYCLE_PHASES.map((phase) => {
            const isCurrent = currentPhaseId === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => handleSelectPhase(phase.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-all ${
                  isCurrent
                    ? "bg-[#282826] text-white font-semibold"
                    : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className="size-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isCurrent ? "#f26522" : "#52525b",
                  }}
                />
                <span className="hidden sm:inline">{phase.id + 1}.</span>
                <span>{phase.name}</span>
              </button>
            );
          })}
        </div>

        {/* Phase Context Subtitle */}
        <div className="flex items-center gap-2 px-2 text-[10px] font-mono text-[#a1a1aa]">
          <span className="text-[#f26522] font-semibold">{activePhase.tag}</span>
          <span>•</span>
          <span className="truncate max-w-[380px] text-[#71717a]">{activePhase.desc}</span>
        </div>
      </div>

      {/* Top Right: System Indicator & Search */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181816] border border-white/10 text-xs font-mono text-[#a1a1aa] hover:text-white hover:border-white/20 transition-all shadow-md"
        >
          <Search className="size-3.5 text-[#f26522]" />
          <span>Search Memory</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#71717a]">
            /
          </kbd>
        </button>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#a1a1aa] tracking-wider px-2.5 py-1.5 bg-[#181816] border border-white/10 rounded-md">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f26522] opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-[#f26522]" />
          </span>
          <span className="text-white/80 font-medium uppercase text-[10px] tracking-wider">
            Agent Lifecycle
          </span>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-[460px] px-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative bg-[#181816] border border-white/15 rounded-lg shadow-[0_24px_56px_rgba(0,0,0,0.9)] overflow-hidden">
            <Search className="absolute left-3.5 top-3.5 size-4 text-[#f26522]" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user preferences, decisions, tasks…"
              className="w-full bg-transparent pl-10 pr-10 py-3.5 text-sm text-white placeholder:text-[#52525b] outline-none"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="absolute right-3.5 top-3.5 text-[#71717a] hover:text-white"
            >
              <X className="size-4" />
            </button>
            {searchQuery.trim() && (
              <div className="border-t border-white/10 max-h-64 overflow-y-auto">
                {filteredMemories.length === 0 ? (
                  <p className="text-xs text-[#71717a] px-4 py-3">No memories found.</p>
                ) : (
                  filteredMemories.map((mem) => (
                    <button
                      key={mem.id}
                      onClick={() => {
                        navigateToNode(mem.id);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] border-b border-white/5 last:border-0 transition-colors flex items-center gap-3 group"
                    >
                      <span
                        className="size-2 rounded-full flex-shrink-0"
                        style={{
                          background:
                            mem.tier === "active" ? "#ffffff" : mem.tier === "recent" ? "#f26522" : "#9ca3af",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors truncate">
                          {mem.title}
                        </div>
                        <div className="text-[10px] text-[#71717a] font-mono truncate">
                          {mem.topic} · {mem.source}
                        </div>
                      </div>
                      <ArrowRight className="size-3 text-[#71717a] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredMemory && !selectedId && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2.5 rounded-md bg-[#181816] border border-white/15 shadow-[0_12px_28px_rgba(0,0,0,0.8)] max-w-[280px] -translate-x-1/2 -translate-y-full animate-in fade-in duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 16 }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{
                  background:
                    hoveredMemory.tier === "active" ? "#ffffff" : hoveredMemory.tier === "recent" ? "#f26522" : "#9ca3af",
                }}
              />
              <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-[#f26522]">
                {hoveredMemory.tier === "active" ? "Active Working Context" : hoveredMemory.tier === "recent" ? "Recent Memory" : "Stored Knowledge"}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#71717a]">{hoveredMemory.timestamp}</span>
          </div>
          <div className="text-[12px] font-medium text-white leading-snug">{hoveredMemory.title}</div>
          <div className="text-[10px] text-[#a1a1aa] mt-1 font-mono flex items-center gap-1">
            <span>Click to inspect relationships</span>
            <ArrowRight className="size-2.5 text-[#f26522]" />
          </div>
        </div>
      )}

      {/* Selected Memory Detail Drawer */}
      {selectedMemory && (
        <div className="absolute bottom-4 right-4 z-40 max-w-[410px] w-full p-4.5 rounded-lg bg-[#181816] border border-white/15 shadow-[0_24px_56px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  background:
                    selectedMemory.tier === "active" ? "#ffffff" : selectedMemory.tier === "recent" ? "#f26522" : "#9ca3af",
                }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#f26522]">
                {selectedMemory.tier === "active" ? "Active Context" : selectedMemory.tier === "recent" ? "Recent Memory" : "Stored Memory"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetCamera}
                title="Reset Perspective"
                className="text-[#a1a1aa] hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={() => navigateToNode(null)}
                className="text-[#a1a1aa] hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5">{selectedMemory.title}</h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">{selectedMemory.description}</p>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] mb-4">
            <span className="truncate max-w-[220px]">{selectedMemory.source}</span>
            <span>{selectedMemory.timestamp}</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <Link2 className="size-3 text-[#f26522]" />
                Connected Memories ({relatedConnections.length})
              </span>
              <span className="text-[#71717a]">Click to navigate</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-none">
              {relatedConnections.map(({ edge, otherNode }) => (
                <button
                  key={edge.id}
                  onClick={() => navigateToNode(otherNode.id)}
                  className="w-full text-left p-3 rounded-md bg-[#20201d] hover:bg-[#282824] border border-white/10 hover:border-[#f26522]/50 transition-all group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#f26522] flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-[#f26522]" />
                      {edge.type}
                    </span>
                    <ArrowRight className="size-3 text-[#71717a] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors leading-snug">
                    {otherNode.title}
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] leading-tight line-clamp-2">{edge.reason}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Center Reset Button */}
      {selectedId && (
        <button
          onClick={handleResetCamera}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181816] border border-white/15 text-xs font-mono text-[#a1a1aa] hover:text-white hover:border-white/30 transition-colors shadow-lg animate-in fade-in duration-150"
        >
          <RotateCcw className="size-3 text-[#f26522]" />
          <span>Reset Perspective</span>
        </button>
      )}

      {/* Bottom Left: Navigation Hints */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#181816] px-3.5 py-1.5 rounded-md border border-white/10">
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-[#f26522]" />
          Drag to rotate
        </span>
        <span>•</span>
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Click memory to inspect</span>
        <span>•</span>
        <span>
          Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd> to play/pause
        </span>
      </div>
    </div>
  );
}

export default AgentMemoryGraph;
