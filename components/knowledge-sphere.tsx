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
  X,
  Link2,
  ArrowRight,
  Search,
  RotateCcw,
  Sparkles,
  Activity,
  Play,
  Pause,
  Zap,
  FastForward,
  Compass,
  Cpu,
  Layers,
  CheckCircle2,
  ChevronRight,
  Eye,
} from "lucide-react";
import { spaceSoundscape } from "@/lib/audio/space-soundscape";

// ═══════════════════════════════════════════════════════════════════════════════
// 1.  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type EdgeType =
  | "same topic"
  | "caused by"
  | "mentioned in"
  | "updated by"
  | "related to";

export interface SphereEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
  reason: string;
}

export interface SphereMemory {
  id: string;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  clusterId: string;
  topic: string;
  position: THREE.Vector3;
}

export type AgentPhase =
  | "ingest"
  | "recall"
  | "traverse"
  | "synthesize"
  | "consolidate";

export interface ReasoningStep {
  phase: AgentPhase;
  phaseName: string;
  tag: string;
  thought: string;
  subText: string;
}

export interface AgentReasoningScenario {
  id: string;
  title: string;
  triggerPrompt: string;
  primaryClusterId: string;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  steps: ReasoningStep[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.  SPHERICAL MATHEMATICAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function clusterNode(
  phiCenter: number,
  thetaCenter: number,
  dPhi: number,
  dTheta: number,
  r: number
): THREE.Vector3 {
  const phi = phiCenter + dPhi;
  const theta = thetaCenter + dTheta;
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
// 3.  DEMO DATA — 26 REALISTIC MEMORIES IN 5 DISTINCT 3D CONSTELLATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const SPHERE_CLUSTERS = [
  { id: "c-projects",  name: "Projects",    colour: 0x38bdf8, css: "#38bdf8", tag: "Active" },
  { id: "c-people",    name: "People",      colour: 0xc084fc, css: "#c084fc", tag: "Team" },
  { id: "c-prefs",     name: "Preferences", colour: 0x34d399, css: "#34d399", tag: "Style" },
  { id: "c-decisions", name: "Decisions",   colour: 0xfbbf24, css: "#fbbf24", tag: "Strategic" },
  { id: "c-knowledge", name: "Knowledge",   colour: 0xf26522, css: "#f26522", tag: "Research" },
];

const CLUSTER_COL_THREE: Record<string, THREE.Color> = {};
const CLUSTER_COL_CSS: Record<string, string> = {};
SPHERE_CLUSTERS.forEach((c) => {
  CLUSTER_COL_THREE[c.id] = new THREE.Color(c.colour);
  CLUSTER_COL_CSS[c.id] = c.css;
});

const SPHERE_MEMORIES: SphereMemory[] = [
  // ── Cluster 1: Projects (Sky Blue, Constellation East)
  {
    id: "s-proj-01",
    title: "Context-Aware Sidebar v2",
    description:
      "Proactively surfaces relevant memories based on active document and recent team threads without manual prompting.",
    source: "Notion — Product Spec",
    timestamp: "2024-10-18",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, -0.12, -0.16, 17.4),
  },
  {
    id: "s-proj-02",
    title: "Semantic Chunker Pipeline",
    description:
      "Splits ingested documents into cohesive semantic units before embedding, reducing noisy retrieval chunks by ~31%.",
    source: "GitHub PR #412",
    timestamp: "2024-10-20",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, 0.10, 0.14, 18.2),
  },
  {
    id: "s-proj-03",
    title: "Cross-App Memory Bridge",
    description:
      "Unifies tokens across Slack, Linear, and GitHub into a shared namespace for multi-tool contextual reasoning.",
    source: "Eng Design Doc",
    timestamp: "2024-10-22",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, -0.06, 0.18, 16.6),
  },
  {
    id: "s-proj-04",
    title: "Streaming Memory Ingestion",
    description:
      "Ingests memory tokens in real-time as conversations proceed, eliminating batch-write latency for immediate recall.",
    source: "Eng Sync — Slack",
    timestamp: "2024-10-23",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, 0.15, -0.10, 17.8),
  },
  {
    id: "s-proj-05",
    title: "Memory Provenance Tracker",
    description:
      "Attaches author, source document, timestamp, and confidence score to every persisted memory token in the graph.",
    source: "RFC-009 — Memory Provenance",
    timestamp: "2024-10-24",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, -0.18, 0.05, 18.5),
  },
  {
    id: "s-proj-06",
    title: "Daily Thread Digest",
    description:
      "Condenses multi-day asynchronous Slack discussions into 3-point memory summaries preserving explicit rationale.",
    source: "Product Backlog",
    timestamp: "2024-10-25",
    clusterId: "c-projects",
    topic: "Projects",
    position: clusterNode(1.18, 0.45, 0.04, -0.22, 16.9),
  },

  // ── Cluster 2: People (Soft Purple, Constellation North)
  {
    id: "s-ppl-01",
    title: "Aria works asynchronously",
    description:
      "Aria expects thread summaries at end of sprint rather than real-time pings; automated notifications respect this.",
    source: "Slack Behaviour Model",
    timestamp: "2024-09-30",
    clusterId: "c-people",
    topic: "People",
    position: clusterNode(0.65, 1.70, -0.10, -0.15, 17.5),
  },
  {
    id: "s-ppl-02",
    title: "Marcus gates production deploys",
    description:
      "Production deployments require sign-off from Marcus; preview environments must be attached to every release PR.",
    source: "Team Charter — Notion",
    timestamp: "2024-09-15",
    clusterId: "c-people",
    topic: "People",
    position: clusterNode(0.65, 1.70, 0.12, 0.12, 18.3),
  },
  {
    id: "s-ppl-03",
    title: "Elena owns design tokens",
    description:
      "Elena is primary contact for Figma token updates and ensures all frontend modules adhere strictly to CSS variables.",
    source: "Onboarding Wiki",
    timestamp: "2024-08-01",
    clusterId: "c-people",
    topic: "People",
    position: clusterNode(0.65, 1.70, -0.05, 0.18, 16.8),
  },
  {
    id: "s-ppl-04",
    title: "James working hours (UTC+8)",
    description:
      "James operates in APAC timezone; tasks requiring his input are queued until 18:00 UTC to prevent urgent pings.",
    source: "Team Sync — Notes",
    timestamp: "2024-09-20",
    clusterId: "c-people",
    topic: "People",
    position: clusterNode(0.65, 1.70, 0.14, -0.12, 17.6),
  },
  {
    id: "s-ppl-05",
    title: "Priya leads mobile initiative",
    description:
      "Priya owns mobile onboarding architecture and cross-device sync following the Q4 board realignment.",
    source: "Board Notes — Oct 2024",
    timestamp: "2024-10-10",
    clusterId: "c-people",
    topic: "People",
    position: clusterNode(0.65, 1.70, -0.12, 0.06, 18.6),
  },

  // ── Cluster 3: Preferences (Emerald Mint, Constellation South)
  {
    id: "s-pref-01",
    title: "Context window budget: 8,000 tokens",
    description:
      "Payloads are capped at 8,000 tokens per call to guarantee under-800ms time-to-first-token on GPT-4o.",
    source: "Eng Retrospective",
    timestamp: "2024-10-01",
    clusterId: "c-prefs",
    topic: "Preferences",
    position: clusterNode(2.10, 2.95, -0.12, -0.14, 17.2),
  },
  {
    id: "s-pref-02",
    title: "Strict TypeScript across all packages",
    description:
      "All packages must pass strict TypeScript checks; noImplicitAny overrides are banned in build pipelines.",
    source: "CONTRIBUTING.md",
    timestamp: "2024-07-14",
    clusterId: "c-prefs",
    topic: "Preferences",
    position: clusterNode(2.10, 2.95, 0.10, 0.12, 18.0),
  },
  {
    id: "s-pref-03",
    title: "Schema validation: Zod over Yup",
    description:
      "Zod is enforced across all API boundaries and memory serializers after benchmarking schema parsing performance.",
    source: "Arch Review — Jun 2024",
    timestamp: "2024-06-22",
    clusterId: "c-prefs",
    topic: "Preferences",
    position: clusterNode(2.10, 2.95, -0.06, 0.18, 16.8),
  },
  {
    id: "s-pref-04",
    title: "Dark mode as default theme",
    description:
      "Maximem interfaces default to dark mode (#121210 / #1B1B19) to preserve contrast with luminous graph beads.",
    source: "Brand Guidelines v3",
    timestamp: "2024-08-15",
    clusterId: "c-prefs",
    topic: "Preferences",
    position: clusterNode(2.10, 2.95, 0.14, -0.10, 18.4),
  },
  {
    id: "s-pref-05",
    title: "Never use hardcoded hex values",
    description:
      "Always reference CSS variables from globals.css; hardcoded values in component styles will be flagged in CI.",
    source: "Frontend RFC-003",
    timestamp: "2024-09-05",
    clusterId: "c-prefs",
    topic: "Preferences",
    position: clusterNode(2.10, 2.95, -0.16, 0.04, 17.6),
  },

  // ── Cluster 4: Decisions (Warm Amber, Constellation West)
  {
    id: "s-dec-01",
    title: "Vercel edge runtime for API handlers",
    description:
      "API endpoints querying graph nodes run on Vercel Edge Runtime to keep cold starts strictly under 40ms globally.",
    source: "ADR-014 — Edge Infrastructure",
    timestamp: "2024-08-20",
    clusterId: "c-decisions",
    topic: "Decisions",
    position: clusterNode(1.55, 4.25, -0.10, -0.14, 17.8),
  },
  {
    id: "s-dec-02",
    title: "Adopt pgvector alongside graph DB",
    description:
      "Retained PostgreSQL with pgvector for embedding queries while delegating structural relationships to graph storage.",
    source: "ADR-011 — Hybrid Memory Storage",
    timestamp: "2024-07-28",
    clusterId: "c-decisions",
    topic: "Decisions",
    position: clusterNode(1.55, 4.25, 0.12, 0.10, 18.5),
  },
  {
    id: "s-dec-03",
    title: "Single-tenant database isolation",
    description:
      "Enterprise customers receive isolated Postgres schemas rather than shared row-level security for SOC2.",
    source: "Security Review — Sep 2024",
    timestamp: "2024-09-10",
    clusterId: "c-decisions",
    topic: "Decisions",
    position: clusterNode(1.55, 4.25, -0.04, 0.18, 16.9),
  },
  {
    id: "s-dec-04",
    title: "Open-source core semantic chunker",
    description:
      "Decided to release @maximem/chunker on npm under Apache-2.0 to establish developer mindshare in AI engineering.",
    source: "Exec Strategy Sync",
    timestamp: "2024-10-05",
    clusterId: "c-decisions",
    topic: "Decisions",
    position: clusterNode(1.55, 4.25, 0.14, -0.12, 17.5),
  },
  {
    id: "s-dec-05",
    title: "Mobile-first onboarding funnel",
    description:
      "Prioritized responsive web over native iOS app for Q4 to accelerate conversion tracking on landing campaigns.",
    source: "Growth Strategy Sync",
    timestamp: "2024-09-25",
    clusterId: "c-decisions",
    topic: "Decisions",
    position: clusterNode(1.55, 4.25, -0.14, 0.06, 18.6),
  },

  // ── Cluster 5: Knowledge (Maximem Orange, Constellation Zenith)
  {
    id: "s-know-01",
    title: "RAG accuracy benchmarks (Q3)",
    description:
      "Evaluating RAG retrieval across 10,000 engineering queries demonstrated an 89.4% precision with 5-chunk windows.",
    source: "Internal Eval Harness",
    timestamp: "2024-09-18",
    clusterId: "c-knowledge",
    topic: "Knowledge",
    position: clusterNode(1.25, 5.45, -0.12, -0.14, 17.3),
  },
  {
    id: "s-know-02",
    title: "Cosine cutoff threshold: 0.82",
    description:
      "Chunks scoring below 0.82 cosine similarity degrade answer quality and are discarded from the prompt context.",
    source: "Embedding Calibration Report",
    timestamp: "2024-09-28",
    clusterId: "c-knowledge",
    topic: "Knowledge",
    position: clusterNode(1.25, 5.45, 0.10, 0.14, 18.2),
  },
  {
    id: "s-know-03",
    title: "Exponential memory score decay (30d)",
    description:
      "Applying exponential time decay with a 30-day half-life cuts stale memory pollution by 40% across active projects.",
    source: "ML Experiment Log",
    timestamp: "2024-10-11",
    clusterId: "c-knowledge",
    topic: "Knowledge",
    position: clusterNode(1.25, 5.45, -0.06, 0.18, 16.8),
  },
  {
    id: "s-know-04",
    title: "Working memory model from NeurIPS '24",
    description:
      "Transformer context windows model human working memory; Maximem organizes long-term recall around this foundation.",
    source: "NeurIPS 2024 Notes",
    timestamp: "2024-10-18",
    clusterId: "c-knowledge",
    topic: "Knowledge",
    position: clusterNode(1.25, 5.45, 0.14, -0.12, 18.5),
  },
  {
    id: "s-know-05",
    title: "Hybrid vector + graph traversal recall",
    description:
      "Combining structural graph traversals with vector similarity outperforms pure semantic search by 19 points.",
    source: "Internal Research Paper",
    timestamp: "2024-10-20",
    clusterId: "c-knowledge",
    topic: "Knowledge",
    position: clusterNode(1.25, 5.45, -0.15, 0.05, 17.6),
  },
];

const SPHERE_EDGES: SphereEdge[] = [
  { id: "se-01", sourceId: "s-proj-01", targetId: "s-proj-02", type: "same topic", reason: "Context-Aware Sidebar relies directly on the Semantic Chunker to format retrieved memories." },
  { id: "se-02", sourceId: "s-proj-02", targetId: "s-know-01", type: "caused by", reason: "Semantic Chunker was initiated following RAG benchmark results showing chunk quality dictates precision." },
  { id: "se-03", sourceId: "s-proj-03", targetId: "s-dec-01", type: "related to", reason: "Memory Bridge runs on Vercel edge runtime, tying operational latency to the edge infrastructure choice." },
  { id: "se-04", sourceId: "s-proj-04", targetId: "s-proj-02", type: "same topic", reason: "Streaming Ingestion feeds text chunks directly through the semantic pipeline as live conversations occur." },
  { id: "se-05", sourceId: "s-proj-05", targetId: "s-proj-04", type: "related to", reason: "Provenance Tracker attaches source metadata to memory packets during streaming ingestion." },
  { id: "se-06", sourceId: "s-proj-06", targetId: "s-ppl-01", type: "caused by", reason: "Daily Thread Digest was designed to support Aria's async working style with compact summaries." },
  { id: "se-07", sourceId: "s-ppl-02", targetId: "s-dec-01", type: "related to", reason: "Marcus's deploy sign-off requirement favored Vercel because of its automatic preview deployment environments." },
  { id: "se-08", sourceId: "s-ppl-05", targetId: "s-dec-05", type: "caused by", reason: "Priya was appointed to lead mobile after strategic adoption of a mobile-first onboarding funnel." },
  { id: "se-09", sourceId: "s-ppl-03", targetId: "s-pref-04", type: "same topic", reason: "Elena authors and maintains dark mode color tokens as part of design system ownership." },
  { id: "se-10", sourceId: "s-pref-01", targetId: "s-know-02", type: "caused by", reason: "The 8,000-token budget was determined using the 0.82 cosine threshold to retain high-confidence memories." },
  { id: "se-11", sourceId: "s-know-03", targetId: "s-pref-01", type: "updated by", reason: "Exponential memory decay updated the token budget algorithm to discard low-freshness memories first." },
  { id: "se-12", sourceId: "s-know-04", targetId: "s-proj-01", type: "related to", reason: "NeurIPS working memory insight directly informed the proactive recall behavior of the sidebar." },
  { id: "se-13", sourceId: "s-know-05", targetId: "s-dec-02", type: "caused by", reason: "Hybrid graph-vector recall research proved that keeping pgvector alongside the graph yields top accuracy." },
  { id: "se-14", sourceId: "s-dec-02", targetId: "s-proj-02", type: "same topic", reason: "pgvector stores vector embeddings produced by the semantic chunker in the core indexing pipeline." },
  { id: "se-15", sourceId: "s-dec-04", targetId: "s-proj-02", type: "same topic", reason: "The open-source module release is the same semantic chunking algorithm deployed in production." },
  { id: "se-16", sourceId: "s-dec-03", targetId: "s-proj-05", type: "related to", reason: "Single-tenant architecture requires strict provenance tracking so each organization's data remains isolated." },
  { id: "se-17", sourceId: "s-ppl-04", targetId: "s-proj-06", type: "mentioned in", reason: "James's APAC timezone is cited in Thread Digest spec as key justification for asynchronous digests." },
  { id: "se-18", sourceId: "s-pref-02", targetId: "s-proj-04", type: "related to", reason: "Strict TypeScript mode enforces end-to-end type safety across the real-time streaming ingestion pipeline." },
  { id: "se-19", sourceId: "s-pref-03", targetId: "s-proj-01", type: "same topic", reason: "Context-Aware Sidebar uses Zod schemas to validate all memory payloads before rendering." },
  { id: "se-20", sourceId: "s-know-01", targetId: "s-dec-02", type: "caused by", reason: "RAG outperforming fine-tuning led the team to invest in pgvector retrieval rather than model retraining." },
  { id: "se-21", sourceId: "s-know-02", targetId: "s-proj-02", type: "updated by", reason: "The 0.82 threshold was updated directly inside the Semantic Chunker similarity filtering stage." },
  { id: "se-22", sourceId: "s-know-03", targetId: "s-dec-02", type: "related to", reason: "Memory score decay calculations are implemented directly inside the pgvector SQL ranking query." },
  { id: "se-23", sourceId: "s-ppl-02", targetId: "s-proj-04", type: "mentioned in", reason: "Marcus is mentioned in streaming ingest architecture as reviewer for high-throughput pipeline updates." },
  { id: "se-24", sourceId: "s-dec-05", targetId: "s-proj-03", type: "related to", reason: "Mobile onboarding requires Cross-App Memory Bridge to synchronize memories between devices." },
  { id: "se-25", sourceId: "s-pref-05", targetId: "s-pref-04", type: "same topic", reason: "CSS variables only and dark mode first are codified together in the team visual style guide." },
  { id: "se-26", sourceId: "s-know-04", targetId: "s-know-05", type: "same topic", reason: "Working memory theory and hybrid graph-vector search together form the core Maximem memory model." },
  { id: "se-27", sourceId: "s-proj-01", targetId: "s-pref-01", type: "related to", reason: "The sidebar context builder is strictly limited by the 8,000-token budget to prevent prompt overflow." },
  { id: "se-28", sourceId: "s-ppl-03", targetId: "s-pref-05", type: "same topic", reason: "Elena enforces the CSS variable rule during pull request reviews across all product interfaces." },
  { id: "se-29", sourceId: "s-proj-05", targetId: "s-know-03", type: "updated by", reason: "Memory decay coefficients are recorded alongside provenance tags by the tracker to calculate age decay." },
  { id: "se-30", sourceId: "s-dec-01", targetId: "s-proj-04", type: "related to", reason: "Streaming ingestion uses Vercel edge streaming responses to deliver live memory updates to users." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.  AUTONOMOUS AGENT REASONING SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════════

export const REASONING_SCENARIOS: AgentReasoningScenario[] = [
  {
    id: "scen-rag-opt",
    title: "Optimizing Vector Recall Latency",
    triggerPrompt: "User requested sub-800ms time-to-first-token on RAG memory recall.",
    primaryClusterId: "c-projects",
    activeNodeIds: ["s-proj-01", "s-proj-02", "s-know-01", "s-dec-02", "s-pref-01"],
    activeEdgeIds: ["se-01", "se-02", "se-14", "se-10"],
    steps: [
      {
        phase: "ingest",
        phaseName: "01 • Ingest Prompt",
        tag: "Ingestion",
        thought: "Perceiving token budget constraint (8,000 cap) and sub-800ms SLA threshold...",
        subText: "Context tokens allocated to working memory nucleus.",
      },
      {
        phase: "recall",
        phaseName: "02 • Vector Recall",
        tag: "Cosine Wave",
        thought: "Emitting cosine similarity wave (threshold > 0.82) across semantic clusters...",
        subText: "Spherical shockwave scanning 26 nodes in pgvector cache.",
      },
      {
        phase: "traverse",
        phaseName: "03 • Synaptic Traversal",
        tag: "Graph Walk",
        thought: "Traversing Semantic Chunker ➔ pgvector hybrid recall ➔ Context Sidebar...",
        subText: "Synaptic energy streaming across Projects & Decisions pathways.",
      },
      {
        phase: "synthesize",
        phaseName: "04 • Heuristic Synthesis",
        tag: "Synthesizing",
        thought: "Coordinating hybrid graph-vector retrieval with 30-day exponential decay...",
        subText: "Synthesizing optimal recall policy: 14ms projected retrieval latency.",
      },
      {
        phase: "consolidate",
        phaseName: "05 • Consolidation",
        tag: "Equilibrium",
        thought: "Committing verified latency tuning parameter into persistent knowledge graph...",
        subText: "Graph equilibrium restored. Coherence: 99.8%.",
      },
    ],
  },
  {
    id: "scen-design-sync",
    title: "Cross-Device Style Governance",
    triggerPrompt: "Elena updates dark mode tokens in Figma for mobile onboarding release.",
    primaryClusterId: "c-people",
    activeNodeIds: ["s-ppl-03", "s-pref-04", "s-pref-05", "s-ppl-05", "s-dec-05"],
    activeEdgeIds: ["se-09", "se-25", "se-28", "se-08"],
    steps: [
      {
        phase: "ingest",
        phaseName: "01 • Webhook Ingestion",
        tag: "Figma Payload",
        thought: "Receiving Figma token update payload from Elena's design branch...",
        subText: "Analyzing CSS custom properties against strict design token rules.",
      },
      {
        phase: "recall",
        phaseName: "02 • Policy Recall",
        tag: "Rule Scan",
        thought: "Scanning team governance rules: 'CSS variables only' & 'dark mode first'...",
        subText: "Cross-referencing Preferences constellation guidelines.",
      },
      {
        phase: "traverse",
        phaseName: "03 • Synaptic Walk",
        tag: "Verification",
        thought: "Traversing Elena ➔ CSS Variables ➔ Priya's Mobile Funnel...",
        subText: "Ensuring zero CSS token regressions across cross-device layouts.",
      },
      {
        phase: "synthesize",
        phaseName: "04 • Automated Consensus",
        tag: "Consensus",
        thought: "Validating mobile-first color contrast ratios with dark mode specification...",
        subText: "All 18 tokens validated against WCAG AAA standard.",
      },
      {
        phase: "consolidate",
        phaseName: "05 • Graph Update",
        tag: "Committed",
        thought: "Persisting validated design token hash into shared memory index...",
        subText: "Consolidated into People & Preferences constellation.",
      },
    ],
  },
  {
    id: "scen-async-digest",
    title: "Asynchronous Team Coordination",
    triggerPrompt: "James checks out for APAC night; compiling daily thread summaries for Aria.",
    primaryClusterId: "c-projects",
    activeNodeIds: ["s-ppl-04", "s-proj-06", "s-ppl-01", "s-proj-04", "s-dec-01"],
    activeEdgeIds: ["se-06", "se-17", "se-30", "se-23"],
    steps: [
      {
        phase: "ingest",
        phaseName: "01 • Chrono Detection",
        tag: "Time Shift",
        thought: "Detecting APAC time shift (James UTC+8) and pending PR review queue...",
        subText: "Contextual trigger: asynchronous digest generation.",
      },
      {
        phase: "recall",
        phaseName: "02 • Provenance Search",
        tag: "Log Query",
        thought: "Searching Slack threads & streaming ingest commits from last 12 hours...",
        subText: "Wavefront scanning high-priority architectural discussions.",
      },
      {
        phase: "traverse",
        phaseName: "03 • Context Linking",
        tag: "Async Connect",
        thought: "Linking Daily Thread Digest with Aria's asynchronous notification preferences...",
        subText: "Connecting APAC engineering notes with executive sprint status.",
      },
      {
        phase: "synthesize",
        phaseName: "04 • Condensation",
        tag: "Synthesis",
        thought: "Synthesizing 14-thread asynchronous conversation into 3 actionable memory points...",
        subText: "Zero alert fatigue: batch delivery scheduled for 18:00 UTC.",
      },
      {
        phase: "consolidate",
        phaseName: "05 • Persistent Dispatch",
        tag: "Complete",
        thought: "Storing digest memory token with immutable provenance and author citations...",
        subText: "Memory state updated across Projects & People.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5.  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface KnowledgeSphereProps {
  className?: string;
}

export function KnowledgeSphere({ className = "" }: KnowledgeSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Agent Cognitive Live Engine State
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [cinematicCamera, setCinematicCamera] = useState(false);
  const [sparkPulse, setSparkPulse] = useState(0);

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const activeClusterRef = useRef<string | null>(null);
  activeClusterRef.current = activeClusterId;

  const currentScenario = REASONING_SCENARIOS[scenarioIdx] ?? REASONING_SCENARIOS[0];
  const currentStep = currentScenario.steps[currentStepIdx] ?? currentScenario.steps[0];

  const selectionTimeRef = useRef<number>(0);

  const selectedMemory = useMemo(
    () => SPHERE_MEMORIES.find((m) => m.id === selectedId) ?? null,
    [selectedId]
  );

  const relatedConnections = useMemo(() => {
    if (!selectedId) return [];
    return SPHERE_EDGES
      .filter((e) => e.sourceId === selectedId || e.targetId === selectedId)
      .map((e) => {
        const otherId = e.sourceId === selectedId ? e.targetId : e.sourceId;
        return {
          edge: e,
          otherNode: SPHERE_MEMORIES.find((m) => m.id === otherId)!,
        };
      })
      .filter((x) => x.otherNode);
  }, [selectedId]);

  const filteredMemories = useMemo(() => {
    if (!searchQuery.trim()) return SPHERE_MEMORIES;
    const q = searchQuery.toLowerCase();
    return SPHERE_MEMORIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const hoveredMemory = useMemo(
    () => SPHERE_MEMORIES.find((m) => m.id === hoveredId) ?? null,
    [hoveredId]
  );

  // Camera Orbit State
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const orbitRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    phi: Math.PI / 2.3,
    theta: 0.45,
    radius: 56,
    targetPhi: Math.PI / 2.3,
    targetTheta: 0.45,
    targetRadius: 56,
    focus: new THREE.Vector3(0, 0, 0),
    targetFocus: new THREE.Vector3(0, 0, 0),
    touchDist: 0,
  });

  // Navigate to Node
  const navigateToNode = useCallback((id: string | null) => {
    setSelectedId(id);
    selectionTimeRef.current = performance.now();
    if (id) {
      const mem = SPHERE_MEMORIES.find((m) => m.id === id);
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
        orbitRef.current.targetRadius = 38;
        orbitRef.current.targetFocus.copy(pos).multiplyScalar(0.28);
      }
    } else {
      orbitRef.current.targetRadius = 56;
      orbitRef.current.targetFocus.set(0, 0, 0);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    spaceSoundscape.playGlideTransition();
    navigateToNode(null);
    setActiveClusterId(null);
    orbitRef.current.targetPhi = Math.PI / 2.3;
    orbitRef.current.targetRadius = 56;
    orbitRef.current.targetFocus.set(0, 0, 0);
  }, [navigateToNode]);

  // Trigger Instant "Spark Thought" Surge
  const handleSparkThought = useCallback(() => {
    setSparkPulse(Date.now());
    spaceSoundscape.playShockwaveWhoosh();
    // Advance to next step or switch scenario
    setCurrentStepIdx((prev) => (prev + 1) % 5);
  }, []);

  // Autonomous Reasoning Loop Driver
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= 4) {
          // Advance scenario after finishing consolidation
          setScenarioIdx((s) => (s + 1) % REASONING_SCENARIOS.length);
          return 0;
        }
        return prev + 1;
      });
    }, 3800 / playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed]);

  // Keyboard shortcut '/' to search & 'Space' to pause/play
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      } else if (e.code === "Space" && !searchOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  // ── Build WebGL Scene ──
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    const container: HTMLDivElement = containerRef.current;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

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
    // A. QUANTUM NUCLEUS — HYPER-TECH MULTI-LAYER WORKING CONTEXT CORE
    // ─────────────────────────────────────────────────────────────────────────
    const coreGroup = new THREE.Group();

    // 1. Outer Icosahedron Wireframe (Maximem Orange)
    const icoGeo = new THREE.IcosahedronGeometry(3.8, 1);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0xf26522,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const icoWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(icoGeo),
      icoMat
    );
    coreGroup.add(icoWire);

    // 2. Middle Dodecahedron Wireframe (Warm Gold, Counter-Rotating)
    const dodecGeo = new THREE.DodecahedronGeometry(2.5, 0);
    const dodecMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const dodecWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(dodecGeo),
      dodecMat
    );
    coreGroup.add(dodecWire);

    // 3. Central Luminous Plasma Orb
    const coreOrbGeo = new THREE.SphereGeometry(1.15, 20, 20);
    const coreOrbMat = new THREE.MeshBasicMaterial({
      color: 0xf26522,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreOrb = new THREE.Mesh(coreOrbGeo, coreOrbMat);
    coreGroup.add(coreOrb);

    // 4. Orbiting Quantum Sparkles (Working Context Tokens)
    const NUM_CORE_SPARKS = 8;
    const coreSparksGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(NUM_CORE_SPARKS * 3);
    const sparkColors = new Float32Array(NUM_CORE_SPARKS * 3);
    const sparkSeeds = new Float32Array(NUM_CORE_SPARKS);

    for (let i = 0; i < NUM_CORE_SPARKS; i++) {
      sparkSeeds[i] = (i / NUM_CORE_SPARKS) * Math.PI * 2;
      sparkColors[i * 3 + 0] = 1.0;
      sparkColors[i * 3 + 1] = 0.85;
      sparkColors[i * 3 + 2] = 0.55;
    }
    coreSparksGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    coreSparksGeo.setAttribute("color", new THREE.BufferAttribute(sparkColors, 3));

    const coreSparksMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreSparks = new THREE.Points(coreSparksGeo, coreSparksMat);
    coreGroup.add(coreSparks);

    scene.add(coreGroup);

    // 5. Dynamic Expanding Spherical Shockwave Wavefront
    const shockwaveGeo = new THREE.RingGeometry(0.5, 0.9, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xf26522,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = Math.PI / 2;
    scene.add(shockwaveMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // B. LIVING FIBONACCI SPHERICAL PARTICLE FIELD (~4,800 Stippled Dots)
    // ─────────────────────────────────────────────────────────────────────────
    const SHELL_SPECS = [
      { r: 4.2,  count: 140,  baseBrightness: 0.95, size: 1.45, shellId: 0 },
      { r: 8.5,  count: 650,  baseBrightness: 0.82, size: 1.25, shellId: 1 },
      { r: 13.5, count: 1200, baseBrightness: 0.68, size: 1.08, shellId: 2 },
      { r: 17.5, count: 1400, baseBrightness: 0.52, size: 0.96, shellId: 3 },
      { r: 21.5, count: 1450, baseBrightness: 0.38, size: 0.85, shellId: 4 },
    ];

    const TOTAL_PARTICLES = SHELL_SPECS.reduce((acc, s) => acc + s.count, 0);

    const pPositions = new Float32Array(TOTAL_PARTICLES * 3);
    const pColors    = new Float32Array(TOTAL_PARTICLES * 3);
    const pSizes     = new Float32Array(TOTAL_PARTICLES);
    const pShellIds  = new Float32Array(TOTAL_PARTICLES);
    const pSeeds     = new Float32Array(TOTAL_PARTICLES);

    const GA = Math.PI * (3 - Math.sqrt(5));
    let pIdx = 0;

    SHELL_SPECS.forEach(({ r, count, baseBrightness, size, shellId }) => {
      for (let i = 0; i < count && pIdx < TOTAL_PARTICLES; i++, pIdx++) {
        const y = 1 - (i / Math.max(count - 1, 1)) * 2;
        const rFlat = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = GA * i;

        const jitter = (Math.random() - 0.5) * (shellId === 0 ? 0.2 : 0.7);
        const radius = r + jitter;

        pPositions[pIdx * 3 + 0] = radius * rFlat * Math.cos(theta);
        pPositions[pIdx * 3 + 1] = radius * y;
        pPositions[pIdx * 3 + 2] = radius * rFlat * Math.sin(theta);

        let b = baseBrightness * (0.8 + Math.random() * 0.25);
        if (Math.random() > 0.95) b *= 1.4;

        pColors[pIdx * 3 + 0] = b;
        pColors[pIdx * 3 + 1] = b;
        pColors[pIdx * 3 + 2] = b;

        pSizes[pIdx]    = size * (0.85 + Math.random() * 0.3);
        pShellIds[pIdx] = shellId;
        pSeeds[pIdx]    = Math.random();
      }
    });

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particlesGeo.setAttribute("baseColor", new THREE.BufferAttribute(pColors, 3));
    particlesGeo.setAttribute("particleSize", new THREE.BufferAttribute(pSizes, 1));
    particlesGeo.setAttribute("shellId", new THREE.BufferAttribute(pShellIds, 1));
    particlesGeo.setAttribute("seed", new THREE.BufferAttribute(pSeeds, 1));

    const particlesMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:        { value: 0 },
        uOrange:      { value: new THREE.Color(0xf26522) },
        uSkyBlue:     { value: new THREE.Color(0x38bdf8) },
        uDimming:     { value: 0.0 },
        uShockwaveR:  { value: 0.0 },
        uShockwaveA:  { value: 0.0 },
        uSelectedPos: { value: new THREE.Vector3(9999, 9999, 9999) },
      },
      vertexShader: `
        attribute vec3 baseColor;
        attribute float particleSize;
        attribute float shellId;
        attribute float seed;

        varying vec3 vCol;
        varying float vOrange;
        varying float vDepth;
        varying float vSeed;

        uniform float uTime;
        uniform vec3 uOrange;
        uniform vec3 uSkyBlue;
        uniform float uDimming;
        uniform float uShockwaveR;
        uniform float uShockwaveA;
        uniform vec3 uSelectedPos;

        mat3 rotY(float a) {
          float c = cos(a); float s = sin(a);
          return mat3(c,0,s, 0,1,0, -s,0,c);
        }

        mat3 rotX(float a) {
          float c = cos(a); float s = sin(a);
          return mat3(1,0,0, 0,c,-s, 0,s,c);
        }

        void main() {
          vCol = baseColor;
          vSeed = seed;

          // Multi-layer differential orbital rotation
          float dir = mod(shellId, 2.0) == 0.0 ? 1.0 : -0.85;
          float shellSpeed = (0.015 + (4.0 - shellId) * 0.004) * dir;
          float angleY = uTime * shellSpeed + position.y * 0.005;
          float tiltX  = (shellId - 2.0) * 0.06;

          vec3 p = rotX(tiltX) * (rotY(angleY) * position);

          // Living organic synaptic breathing
          float breathe = sin(uTime * 0.85 + length(position) * 0.12 + shellId * 0.5) * 0.35;
          p += normalize(position + vec3(0.0001)) * breathe;

          // Spherical shockwave illumination wavefront
          float rLen = length(p);
          float orangeVal = 0.0;
          if (uShockwaveA > 0.01) {
            float distToWave = abs(rLen - uShockwaveR);
            if (distToWave < 3.8) {
              orangeVal += (1.0 - distToWave / 3.8) * uShockwaveA;
            }
          }

          // Local excitation near selected node
          float selDist = length(p - uSelectedPos);
          if (selDist < 6.0) {
            orangeVal += smoothstep(6.0, 1.0, selDist) * 0.55;
          }

          vOrange = clamp(orangeVal, 0.0, 1.0);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float dist = -mv.z;
          float gsz = particleSize * (315.0 / max(dist, 10.0));
          gsz = clamp(gsz, 0.85, 9.5);
          if (vOrange > 0.12) gsz *= 1.35;
          gl_PointSize = gsz;
          vDepth = dist;
        }
      `,
      fragmentShader: `
        uniform vec3 uOrange;
        uniform vec3 uSkyBlue;
        uniform float uDimming;
        uniform float uTime;

        varying vec3 vCol;
        varying float vOrange;
        varying float vDepth;
        varying float vSeed;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;

          float alpha = smoothstep(0.5, 0.20, d);
          float core  = 1.0 - smoothstep(0.0, 0.22, d);

          float twinkle = 0.86 + 0.14 * sin(uTime * 3.4 + vSeed * 25.0);
          vec3 highlightCol = mix(uOrange, uSkyBlue, sin(vSeed * 12.0) * 0.5 + 0.5);
          vec3 finalCol = mix(vCol, highlightCol, vOrange) * twinkle + vec3(core * 0.28);

          float depthAlpha = smoothstep(380.0, 20.0, vDepth);
          float a = alpha * clamp(depthAlpha, 0.22, 1.0);
          a = mix(a, a * 0.22, uDimming);

          gl_FragColor = vec4(finalCol, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // C. MEMORY NODES + GLOWING CORONA HALOS
    // ─────────────────────────────────────────────────────────────────────────
    const nodeMeshes: {
      proxy: THREE.Mesh;
      visual: THREE.Mesh;
      halo: THREE.Mesh;
      mem: SphereMemory;
    }[] = [];

    const nodeGroup  = new THREE.Group();
    const proxyGroup = new THREE.Group();

    const beadGeo = new THREE.SphereGeometry(0.44, 20, 20);
    const haloGeo = new THREE.RingGeometry(0.48, 1.25, 24);
    const proxyGeo = new THREE.SphereGeometry(3.2, 8, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });

    SPHERE_MEMORIES.forEach((mem) => {
      const clusterCol = CLUSTER_COL_THREE[mem.clusterId] ?? new THREE.Color(0xffffff);

      const beadMat = new THREE.MeshBasicMaterial({
        color: clusterCol,
        transparent: true,
        opacity: 0.95,
      });
      const visual = new THREE.Mesh(beadGeo, beadMat);
      visual.position.copy(mem.position);

      // Glowing Corona Halo Ring
      const haloMat = new THREE.MeshBasicMaterial({
        color: clusterCol,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mem.position);

      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      proxy.position.copy(mem.position);
      proxy.userData = { mem, visual, halo };

      nodeGroup.add(visual);
      nodeGroup.add(halo);
      proxyGroup.add(proxy);

      nodeMeshes.push({ proxy, visual, halo, mem });
    });

    scene.add(nodeGroup);
    scene.add(proxyGroup);

    // ─────────────────────────────────────────────────────────────────────────
    // D. GRAPH EDGES (Graceful Arched 3D Bézier Synapses)
    // ─────────────────────────────────────────────────────────────────────────
    const edgeObjs: {
      line: THREE.Line;
      edge: SphereEdge;
      ctrl: THREE.Vector3;
      p1: THREE.Vector3;
      p2: THREE.Vector3;
      pts: THREE.Vector3[];
    }[] = [];

    SPHERE_EDGES.forEach((edge) => {
      const m1 = SPHERE_MEMORIES.find((m) => m.id === edge.sourceId);
      const m2 = SPHERE_MEMORIES.find((m) => m.id === edge.targetId);
      if (!m1 || !m2) return;

      const p1 = m1.position;
      const p2 = m2.position;
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const midLen = mid.length();

      let ctrl: THREE.Vector3;
      if (midLen > 0.001) {
        const norm = mid.clone().normalize();
        const archHeight = Math.min(6.8, 1.0 + dist * 0.16);
        ctrl = mid.clone().addScaledVector(norm, archHeight);
      } else {
        ctrl = new THREE.Vector3(0, 16, 0);
      }

      const pts: THREE.Vector3[] = [];
      const SUBDIVS = 30;
      for (let i = 0; i <= SUBDIVS; i++) {
        const u = i / SUBDIVS;
        const x = (1 - u) * (1 - u) * p1.x + 2 * (1 - u) * u * ctrl.x + u * u * p2.x;
        const y = (1 - u) * (1 - u) * p1.y + 2 * (1 - u) * u * ctrl.y + u * u * p2.y;
        const z = (1 - u) * (1 - u) * p1.z + 2 * (1 - u) * u * ctrl.z + u * u * p2.z;
        pts.push(new THREE.Vector3(x, y, z));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x526071,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      edgeObjs.push({ line, edge, ctrl, p1, p2, pts });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // E. SYNAPTIC PHOTON DATA PULSES WITH COMET TAILS (80 Photons)
    // ─────────────────────────────────────────────────────────────────────────
    const NUM_PHOTONS = 80;
    const photonPositions = new Float32Array(NUM_PHOTONS * 3);
    const photonColors    = new Float32Array(NUM_PHOTONS * 3);

    interface SynapsePulse {
      edgeIdx: number;
      t: number;
      speed: number;
      color: THREE.Color;
      isPriority: boolean;
    }

    const pulses: SynapsePulse[] = [];
    const orangeColor = new THREE.Color(0xf26522);
    const cyanColor   = new THREE.Color(0x38bdf8);

    for (let i = 0; i < NUM_PHOTONS; i++) {
      const eIdx = i % edgeObjs.length;
      const edge = edgeObjs[eIdx];
      const m1 = SPHERE_MEMORIES.find((m) => m.id === edge.edge.sourceId);
      const cCol = m1 ? CLUSTER_COL_THREE[m1.clusterId] : orangeColor;

      pulses.push({
        edgeIdx: eIdx,
        t: (i / NUM_PHOTONS),
        speed: 0.18 + Math.random() * 0.22,
        color: Math.random() > 0.4 ? orangeColor : (cCol ?? orangeColor),
        isPriority: false,
      });
    }

    const photonGeo = new THREE.BufferGeometry();
    photonGeo.setAttribute("position", new THREE.BufferAttribute(photonPositions, 3));
    photonGeo.setAttribute("color", new THREE.BufferAttribute(photonColors, 3));

    const photonShaderMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = 4.2 * (290.0 / max(dist, 8.0));
          gl_PointSize = clamp(gl_PointSize, 1.8, 7.5);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.08, d);
          float core  = 1.0 - smoothstep(0.0, 0.20, d);
          vec3 col = vColor + vec3(core * 0.5);
          gl_FragColor = vec4(col, alpha * 0.98);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const photonPoints = new THREE.Points(photonGeo, photonShaderMat);
    scene.add(photonPoints);

    // ─────────────────────────────────────────────────────────────────────────
    // F. ANIMATION & RENDER LOOP
    // ─────────────────────────────────────────────────────────────────────────
    let shockwaveRadius = 0;
    let shockwaveAlpha  = 0;
    let shockwaveActive = false;
    let lastStepSeen = -1;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const dt = Math.min(clockRef.current.getDelta(), 0.05);
      const t = clockRef.current.getElapsedTime();

      // Camera Orbit Dampening
      const o = orbitRef.current;
      o.phi    += (o.targetPhi    - o.phi)    * 0.06;
      o.theta  += (o.targetTheta  - o.theta)  * 0.06;
      o.radius += (o.targetRadius - o.radius) * 0.06;
      o.focus.lerp(o.targetFocus, 0.06);

      // Gentle continuous ambient drift
      if (!o.isDragging && !selectedIdRef.current) {
        o.targetTheta += 0.0010;
      }
      syncCamera();

      // Rotate Quantum Nucleus Core
      icoWire.rotation.y = t * 0.08;
      icoWire.rotation.x = Math.sin(t * 0.4) * 0.12;

      dodecWire.rotation.y = -t * 0.14;
      dodecWire.rotation.z = Math.cos(t * 0.35) * 0.16;

      // Pulse Core Plasma Orb
      const orbScale = 1.0 + 0.22 * Math.sin(t * 4.2);
      coreOrb.scale.setScalar(orbScale);

      // Rotate Quantum Tokens Inside Core
      const sparkPosAttr = coreSparksGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < NUM_CORE_SPARKS; i++) {
        const seed = sparkSeeds[i];
        const sR = 2.0 + 0.4 * Math.sin(t * 2.0 + i);
        const sTheta = seed + t * (1.2 + (i % 3) * 0.3);
        const sY = Math.sin(t * 1.5 + seed * 2.0) * 1.2;
        sparkPosAttr.setXYZ(i, sR * Math.cos(sTheta), sY, sR * Math.sin(sTheta));
      }
      sparkPosAttr.needsUpdate = true;

      // Trigger Shockwave on Recall Phase
      const activeScen = REASONING_SCENARIOS[scenarioIdx] ?? REASONING_SCENARIOS[0];
      const activeSt = activeScen.steps[currentStepIdx] ?? activeScen.steps[0];

      if (activeSt.phase === "recall" && !shockwaveActive) {
        shockwaveActive = true;
        shockwaveRadius = 3.6;
        shockwaveAlpha = 1.0;
        spaceSoundscape.playShockwaveWhoosh();
      }

      if (shockwaveActive) {
        shockwaveRadius += dt * 24.0;
        shockwaveAlpha = Math.max(0, 1.0 - (shockwaveRadius - 3.6) / 22.0);
        shockwaveMesh.scale.setScalar(shockwaveRadius);
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = shockwaveAlpha * 0.65;
        shockwaveMesh.quaternion.copy(camera.quaternion);

        if (shockwaveRadius > 26.0) {
          shockwaveActive = false;
          shockwaveAlpha = 0.0;
        }
      } else {
        (shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      particlesMat.uniforms.uTime.value       = t;
      particlesMat.uniforms.uShockwaveR.value = shockwaveRadius;
      particlesMat.uniforms.uShockwaveA.value = shockwaveAlpha;

      const selId    = selectedIdRef.current;
      const activeCl = activeClusterRef.current;
      const selMem   = selId ? SPHERE_MEMORIES.find((m) => m.id === selId) : null;

      if (selMem) {
        particlesMat.uniforms.uSelectedPos.value.copy(selMem.position);
        particlesMat.uniforms.uDimming.value = Math.min(
          particlesMat.uniforms.uDimming.value + 0.05,
          0.72
        );
      } else {
        particlesMat.uniforms.uDimming.value = Math.max(
          particlesMat.uniforms.uDimming.value - 0.05,
          0
        );
        particlesMat.uniforms.uSelectedPos.value.set(9999, 9999, 9999);
      }

      // Update Memory Nodes & Corona Halos
      const scenarioActiveNodes = activeScen.activeNodeIds;

      nodeMeshes.forEach(({ visual, halo, mem }) => {
        const vMat = visual.material as THREE.MeshBasicMaterial;
        const hMat = halo.material as THREE.MeshBasicMaterial;
        const baseCol = CLUSTER_COL_THREE[mem.clusterId] ?? new THREE.Color(0xffffff);

        // Keep halo facing camera
        halo.quaternion.copy(camera.quaternion);

        const isActive = selId === mem.id;
        const isNeighbor =
          !isActive &&
          selId !== null &&
          SPHERE_EDGES.some(
            (e) =>
              (e.sourceId === selId && e.targetId === mem.id) ||
              (e.targetId === selId && e.sourceId === mem.id)
          );
        const matchesCluster = activeCl ? mem.clusterId === activeCl : true;
        const isScenarioNode = scenarioActiveNodes.includes(mem.id);

        if (isActive) {
          // Selected: vibrant glowing orange
          vMat.color.set(0xf26522);
          vMat.opacity = 1.0;
          visual.scale.setScalar(1.6 + 0.12 * Math.sin(t * 3.5));

          hMat.color.set(0xf26522);
          hMat.opacity = 0.85;
          halo.scale.setScalar(2.4 + 0.2 * Math.sin(t * 4.0));
        } else if (isScenarioNode && (activeSt.phase === "traverse" || activeSt.phase === "synthesize")) {
          // Active in Autonomous Cognitive Reasoning
          vMat.color.copy(baseCol).lerp(orangeColor, 0.65);
          vMat.opacity = 1.0;
          const sScale = 1.45 + 0.16 * Math.sin(t * 4.0 + mem.position.x);
          visual.scale.setScalar(sScale);

          hMat.color.set(0xf26522);
          hMat.opacity = 0.75 + 0.2 * Math.sin(t * 5.0);
          halo.scale.setScalar(2.0 + 0.25 * Math.sin(t * 3.5));
        } else if (isNeighbor) {
          // Direct Neighbor in manual inspection
          vMat.color.copy(baseCol).lerp(orangeColor, 0.45);
          vMat.opacity = 0.95;
          visual.scale.setScalar(1.28 + 0.08 * Math.sin(t * 2.8 + mem.position.x));

          hMat.color.copy(baseCol);
          hMat.opacity = 0.45;
          halo.scale.setScalar(1.5);
        } else if (selId !== null || !matchesCluster) {
          // Dimmed background
          vMat.color.copy(baseCol);
          vMat.opacity = 0.14;
          visual.scale.setScalar(0.72);

          hMat.opacity = 0.05;
          halo.scale.setScalar(0.8);
        } else {
          // Idle state: rhythmic organic breathing
          vMat.color.copy(baseCol);
          vMat.opacity = 0.92;
          const bScale = 1.0 + 0.05 * Math.sin(t * 1.5 + mem.position.y * 0.5);
          visual.scale.setScalar(bScale);

          hMat.color.copy(baseCol);
          hMat.opacity = 0.22 + 0.08 * Math.sin(t * 2.0 + mem.position.x);
          halo.scale.setScalar(1.2 + 0.08 * Math.sin(t * 2.0));
        }
      });

      // Update Graph Edges
      const selElapsed = (performance.now() - selectionTimeRef.current) / 1000;
      let connectedEdgeCount = 0;
      const scenarioActiveEdges = activeScen.activeEdgeIds;

      edgeObjs.forEach(({ line, edge }) => {
        const mat = line.material as THREE.LineBasicMaterial;
        const isScenarioEdge = scenarioActiveEdges.includes(edge.id);

        if (selId !== null) {
          const isConnected = edge.sourceId === selId || edge.targetId === selId;
          if (isConnected) {
            const revealStart = connectedEdgeCount * 0.08;
            const progress = THREE.MathUtils.clamp((selElapsed - revealStart) / 0.32, 0, 1);
            connectedEdgeCount++;
            mat.color.set(0xf26522);
            mat.opacity = 0.92 * progress;
          } else {
            mat.color.set(0x282828);
            mat.opacity = 0.03;
          }
        } else if (isScenarioEdge && (activeSt.phase === "traverse" || activeSt.phase === "synthesize")) {
          // Glowing electric synapse in active reasoning
          mat.color.set(0xf26522);
          mat.opacity = 0.88 + 0.12 * Math.sin(t * 6.0);
        } else if (activeCl !== null) {
          const m1 = SPHERE_MEMORIES.find((m) => m.id === edge.sourceId);
          const m2 = SPHERE_MEMORIES.find((m) => m.id === edge.targetId);
          const inCluster = m1?.clusterId === activeCl || m2?.clusterId === activeCl;
          if (inCluster) {
            const cCol = CLUSTER_COL_THREE[activeCl] ?? cyanColor;
            mat.color.copy(cCol);
            mat.opacity = 0.65;
          } else {
            mat.color.set(0x334155);
            mat.opacity = 0.06;
          }
        } else {
          // Dynamic Level-of-Detail (LOD):
          // As user zooms in, micro-connections and deep relationships smoothly reveal
          // When zooming out, micro-connections gently soften to keep the wider network pristine
          const zoomFactor = THREE.MathUtils.clamp((o.radius - 28.0) / (72.0 - 28.0), 0.0, 1.0);
          spaceSoundscape.setZoomAtmosphere(zoomFactor);

          // Subtle cosmic parallax: outer stardust field responds smoothly to camera orbit
          particlesMesh.rotation.y = (o.theta - 0.45) * 0.06;
          particlesMesh.rotation.x = (o.phi - Math.PI / 2.3) * 0.04;

          const lodOpacity = 0.12 + (1.0 - zoomFactor) * 0.28;
          mat.color.set(0x526071);
          mat.opacity = lodOpacity;
        }
      });

      // Update Synaptic Photons Along Bézier Curves
      const posAttr = photonGeo.attributes.position as THREE.BufferAttribute;
      const colAttr = photonGeo.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < NUM_PHOTONS; i++) {
        const pulse = pulses[i];

        pulse.t += pulse.speed * dt * playSpeed;
        if (pulse.t >= 1.0) {
          pulse.t = 0;

          // Priority assignment if scenario is in traversal/synthesis
          const isTraversing = activeSt.phase === "traverse" || activeSt.phase === "synthesize";
          if (isTraversing && i < 48 && scenarioActiveEdges.length > 0) {
            const randomActiveEdgeId = scenarioActiveEdges[Math.floor(Math.random() * scenarioActiveEdges.length)];
            const foundIdx = edgeObjs.findIndex((eo) => eo.edge.id === randomActiveEdgeId);
            pulse.edgeIdx = foundIdx !== -1 ? foundIdx : Math.floor(Math.random() * edgeObjs.length);
            pulse.color = orangeColor;
            pulse.speed = 0.35 + Math.random() * 0.25;
            pulse.isPriority = true;
          } else if (selId !== null) {
            const connectedEdgeIndices: number[] = [];
            edgeObjs.forEach((eo, idx) => {
              if (eo.edge.sourceId === selId || eo.edge.targetId === selId) {
                connectedEdgeIndices.push(idx);
              }
            });
            if (connectedEdgeIndices.length > 0) {
              pulse.edgeIdx = connectedEdgeIndices[Math.floor(Math.random() * connectedEdgeIndices.length)];
              pulse.color = orangeColor;
              pulse.speed = 0.28 + Math.random() * 0.18;
            } else {
              pulse.edgeIdx = Math.floor(Math.random() * edgeObjs.length);
              pulse.speed = 0.18 + Math.random() * 0.18;
            }
          } else {
            pulse.edgeIdx = Math.floor(Math.random() * edgeObjs.length);
            const ed = edgeObjs[pulse.edgeIdx];
            const m1 = SPHERE_MEMORIES.find((m) => m.id === ed.edge.sourceId);
            pulse.color = m1 ? CLUSTER_COL_THREE[m1.clusterId] : orangeColor;
            pulse.speed = 0.18 + Math.random() * 0.18;
            pulse.isPriority = false;
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
          colAttr.setXYZ(i, pulse.color.r, pulse.color.g, pulse.color.b);
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // ─────────────────────────────────────────────────────────────────────────
    // G. ORBIT & TOUCH CONTROLS
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
        24,
        Math.min(95, orbitRef.current.targetRadius + e.deltaY * 0.035)
      );
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // ─────────────────────────────────────────────────────────────────────────
    // H. RAYCASTING & CLICK SELECTION
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

      const hits = raycaster.intersectObjects(
        nodeMeshes.map((n) => n.proxy)
      );

      if (hits.length > 0) {
        const mem = hits[0].object.userData.mem as SphereMemory;
        if (pendingHover !== mem.id) {
          pendingHover = mem.id;
          setHoveredId(mem.id);
          setTooltipPos({ x: e.clientX, y: e.clientY });
          canvas.style.cursor = "pointer";
          const cIdx = SPHERE_CLUSTERS.findIndex((c) => c.id === mem.clusterId);
          spaceSoundscape.playNodePulse(cIdx !== -1 ? cIdx : 0, 0);
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

      const hits = raycaster.intersectObjects(
        nodeMeshes.map((n) => n.proxy)
      );

      if (hits.length > 0) {
        const mem = hits[0].object.userData.mem as SphereMemory;
        const cIdx = SPHERE_CLUSTERS.findIndex((c) => c.id === mem.clusterId);
        spaceSoundscape.playNodePulse(cIdx !== -1 ? cIdx : 0, 1);
        navigateToNode(mem.id);
      } else {
        if (selectedIdRef.current) {
          spaceSoundscape.playGlideTransition();
          navigateToNode(null);
        }
      }
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      renderer.dispose();
    };
  }, [navigateToNode, scenarioIdx, currentStepIdx, playSpeed]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#1B1B19] select-none overflow-hidden font-sans ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOP LEFT: Constellation Cluster Selector Pills */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141412]/85 backdrop-blur-md border border-white/10 shadow-lg">
          <button
            onClick={() => setActiveClusterId(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              activeClusterId === null
                ? "bg-[#f26522] text-white font-medium shadow-sm"
                : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
            }`}
          >
            All Clusters
          </button>
          {SPHERE_CLUSTERS.map((c) => {
            const isActive = activeClusterId === c.id;
            return (
              <button
                key={c.id}
                onClick={() =>
                  setActiveClusterId(isActive ? null : c.id)
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-medium border border-white/20"
                    : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: c.css,
                  }}
                />
                <span className="capitalize">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOP CENTER: Cybernetic Agent Live Cognitive Telemetry HUD */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-[620px] w-full px-4 pointer-events-none sm:pointer-events-auto">
        <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#141412]/90 backdrop-blur-xl border border-[#f26522]/30 shadow-[0_12px_36px_rgba(0,0,0,0.8)]">
          {/* Status Row */}
          <div className="flex items-center justify-between w-full text-[11px] font-mono border-b border-white/[0.08] pb-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-[#f26522] ${isPlaying ? 'animate-ping opacity-75' : 'opacity-0'}`} />
                <span className="relative inline-flex rounded-full size-2 bg-[#f26522]" />
              </span>
              <span className="text-[#f26522] font-semibold uppercase tracking-wider text-[10px]">
                {isPlaying ? "AGENT REASONING ACTIVE" : "ENGINE PAUSED"}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[#e4e4e7] font-medium truncate max-w-[240px]">
                {currentScenario.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30 font-semibold">
                {currentStep.tag}
              </span>
              <span className="text-[10px] text-[#71717a]">
                Step {currentStepIdx + 1}/5
              </span>
            </div>
          </div>

          {/* Real-Time Agent Thought Display */}
          <div className="w-full flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Cpu className="size-3.5 text-[#f26522] shrink-0 animate-pulse" />
              <p className="text-xs text-white/95 font-medium leading-tight truncate">
                {currentStep.thought}
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#a1a1aa] shrink-0 hidden md:block">
              {currentStep.subText}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOP RIGHT: Search & System Metrics */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181816]/90 border border-white/10 text-xs font-mono text-[#a1a1aa] hover:text-white hover:border-white/20 transition-all shadow-md backdrop-blur-md"
        >
          <Search className="size-3.5 text-[#f26522]" />
          <span>Search Graph</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[#71717a]">
            /
          </kbd>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM CENTER: Smart Agent Controls & Cognitive Step Timeline */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
        {/* Step Progress Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141412]/90 backdrop-blur-md border border-white/10 shadow-lg">
          {currentScenario.steps.map((st, idx) => {
            const isCurrent = idx === currentStepIdx;
            return (
              <button
                key={st.phase}
                onClick={() => setCurrentStepIdx(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                  isCurrent
                    ? "bg-[#f26522] text-white font-semibold shadow-[0_2px_10px_rgba(242,101,34,0.4)]"
                    : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{st.phaseName}</span>
              </button>
            );
          })}
        </div>

        {/* Master Playback Dock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181816]/95 backdrop-blur-xl border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.8)] text-xs font-mono">
          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-[#f26522] hover:text-white text-[#e4e4e7] transition-all font-medium"
            title={isPlaying ? "Pause Autonomous Thinking (Space)" : "Start Autonomous Thinking (Space)"}
          >
            {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
            <span>{isPlaying ? "Pause Flow" : "Resume Flow"}</span>
          </button>

          {/* Spark Thought Surge Button */}
          <button
            onClick={handleSparkThought}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f26522]/20 hover:bg-[#f26522] text-[#f26522] hover:text-white border border-[#f26522]/40 transition-all font-semibold shadow-sm"
            title="Immediately spark a new reasoning surge"
          >
            <Zap className="size-3" />
            <span>Spark Thought</span>
          </button>

          <span className="text-white/20">|</span>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-[#71717a]">Speed:</span>
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaySpeed(s)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  playSpeed === s
                    ? "bg-white/20 text-[#f26522] font-bold"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <span className="text-white/20">|</span>

          {/* Reset Perspective */}
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1 text-[#a1a1aa] hover:text-white transition-colors"
            title="Reset Perspective"
          >
            <RotateCcw className="size-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SEARCH MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {searchOpen && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-[460px] px-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="relative bg-[#181816] border border-white/15 rounded-lg shadow-[0_24px_56px_rgba(0,0,0,0.9)] overflow-hidden">
            <Search className="absolute left-3.5 top-3.5 size-4 text-[#f26522]" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories, facts, people, decisions…"
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
                  <p className="text-xs text-[#71717a] px-4 py-3">
                    No memories found.
                  </p>
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
                            CLUSTER_COL_CSS[mem.clusterId] ?? "#888",
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HOVER TOOLTIP */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
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
                    CLUSTER_COL_CSS[hoveredMemory.clusterId] ?? "#888",
                  boxShadow: `0 0 6px ${
                    CLUSTER_COL_CSS[hoveredMemory.clusterId] ?? "#888"
                  }`,
                }}
              />
              <span
                className="font-mono text-[9px] uppercase tracking-wider font-semibold"
                style={{
                  color:
                    CLUSTER_COL_CSS[hoveredMemory.clusterId] ?? "#888",
                }}
              >
                {hoveredMemory.topic}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#71717a]">
              {hoveredMemory.timestamp}
            </span>
          </div>
          <div className="text-[12px] font-medium text-white leading-snug">
            {hoveredMemory.title}
          </div>
          <div className="text-[10px] text-[#f26522] mt-1 font-mono flex items-center gap-1">
            <span>Click to inspect relationships</span>
            <ArrowRight className="size-2.5" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SELECTED MEMORY DETAIL DRAWER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedMemory && (
        <div className="absolute bottom-4 right-4 z-40 max-w-[410px] w-full p-4.5 rounded-lg bg-[#181816] border border-white/15 shadow-[0_24px_56px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  background:
                    CLUSTER_COL_CSS[selectedMemory.clusterId] ?? "#888",
                }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                style={{
                  color:
                    CLUSTER_COL_CSS[selectedMemory.clusterId] ?? "#888",
                }}
              >
                {selectedMemory.topic}
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

          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5">
            {selectedMemory.title}
          </h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">
            {selectedMemory.description}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] mb-4">
            <span className="truncate max-w-[220px]">
              {selectedMemory.source}
            </span>
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
                  <p className="text-[11px] text-[#a1a1aa] leading-tight line-clamp-2">
                    {edge.reason}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM LEFT: Navigation Hints */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#181816]/90 px-3.5 py-1.5 rounded-md border border-white/10 backdrop-blur-md">
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
          Press{" "}
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">
            Space
          </kbd>{" "}
          to pause flow
        </span>
      </div>
    </div>
  );
}

export default KnowledgeSphere;
