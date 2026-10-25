"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import { X, Link2, ArrowRight, Search, RotateCcw } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// 1.  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type EdgeType =
  | "part of"
  | "influenced by"
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

// ═══════════════════════════════════════════════════════════════════════════════
// 2.  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function sphereShell(phi: number, theta: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3.  DEMO DATA
// ═══════════════════════════════════════════════════════════════════════════════

const SPHERE_MEMORIES: SphereMemory[] = [
  // ── Projects
  { id: "s-proj-01", title: "Context-Aware Sidebar v2", description: "The sidebar reads the user's current file, meeting notes, and recent chat history to proactively surface relevant memories without any manual prompt.", source: "Notion — Product Spec", timestamp: "2024-10-18", clusterId: "c-projects", topic: "Projects", position: sphereShell(1.1, 0.3, 10) },
  { id: "s-proj-02", title: "Semantic Chunker Pipeline", description: "A new ingestion step that splits documents into semantically coherent chunks before embedding, reducing noise in vector similarity searches by ~31%.", source: "GitHub PR #412", timestamp: "2024-10-20", clusterId: "c-projects", topic: "Projects", position: sphereShell(1.3, 0.6, 12) },
  { id: "s-proj-03", title: "Cross-App Memory Bridge", description: "Memory tokens from Slack, Linear, and GitHub are unified into a single graph namespace, allowing the AI to reason across silos.", source: "Eng Design Doc", timestamp: "2024-10-22", clusterId: "c-projects", topic: "Projects", position: sphereShell(0.9, 0.1, 11) },
  { id: "s-proj-04", title: "Streaming Memory Write", description: "Memories are streamed into the graph in real-time as conversations progress, eliminating the batch-write lag that caused stale recall.", source: "Eng Sync — Slack", timestamp: "2024-10-23", clusterId: "c-projects", topic: "Projects", position: sphereShell(1.5, 0.8, 9) },
  { id: "s-proj-05", title: "Metadata Fingerprinting", description: "Each memory stores provenance metadata (author, app, timestamp, confidence) so the AI can judge freshness and authoritativeness before recall.", source: "RFC-009 — Memory Metadata", timestamp: "2024-10-24", clusterId: "c-projects", topic: "Projects", position: sphereShell(1.0, 1.0, 13) },
  { id: "s-proj-06", title: "Persistent Thread Summariser", description: "Long Slack threads are compressed into 3-sentence memory cards preserving the decision and its rationale, not the noise.", source: "Product Backlog", timestamp: "2024-10-25", clusterId: "c-projects", topic: "Projects", position: sphereShell(1.2, 1.4, 11) },

  // ── People
  { id: "s-ppl-01", title: "Aria prefers async communication", description: "Aria rarely responds in real-time and expects threads summarised at the end of each sprint. Maximem learned this from 3 months of Slack patterns.", source: "Slack Behaviour Model", timestamp: "2024-09-30", clusterId: "c-people", topic: "People", position: sphereShell(0.4, 2.1, 11) },
  { id: "s-ppl-02", title: "Marcus is the deployment gatekeeper", description: "All production deployments require Marcus's sign-off. This was explicitly stated in the team charter and confirmed in 2 incident reviews.", source: "Team Charter — Notion", timestamp: "2024-09-15", clusterId: "c-people", topic: "People", position: sphereShell(0.5, 2.4, 13) },
  { id: "s-ppl-03", title: "Elena owns the design system", description: "Any new UI component requires Elena's design review. She is also the primary contact for Figma token updates and brand decisions.", source: "Onboarding Wiki", timestamp: "2024-08-01", clusterId: "c-people", topic: "People", position: sphereShell(0.6, 1.9, 10) },
  { id: "s-ppl-04", title: "James works 6 PM–2 AM UTC", description: "James's working hours differ from the core team; messages requiring his input should not be marked urgent until 18:00 UTC.", source: "Team Sync — Meeting Notes", timestamp: "2024-09-20", clusterId: "c-people", topic: "People", position: sphereShell(0.3, 2.7, 12) },
  { id: "s-ppl-05", title: "Priya leads the mobile pivot", description: "Priya was assigned to own the mobile strategy following the Q4 board decision. All mobile PRs should CC her.", source: "Board Notes — Oct 2024", timestamp: "2024-10-10", clusterId: "c-people", topic: "People", position: sphereShell(0.7, 3.0, 14) },

  // ── Preferences
  { id: "s-pref-01", title: "Max token budget: 8 000", description: "The team agreed to cap context windows at 8 000 tokens per call after noticing GPT-4o latency spikes with larger payloads.", source: "Eng Retrospective", timestamp: "2024-10-01", clusterId: "c-prefs", topic: "Preferences", position: sphereShell(2.5, 1.2, 10) },
  { id: "s-pref-02", title: "TypeScript strict mode enforced", description: "All new modules must pass strict TypeScript checks. Disabling noImplicitAny is not allowed even for legacy adapters.", source: "CONTRIBUTING.md", timestamp: "2024-07-14", clusterId: "c-prefs", topic: "Preferences", position: sphereShell(2.7, 1.5, 12) },
  { id: "s-pref-03", title: "Prefer Zod over Yup", description: "The team migrated to Zod after Yup caused performance issues in large form schemas. This preference is pinned in the engineering playbook.", source: "Eng Playbook v3", timestamp: "2024-08-22", clusterId: "c-prefs", topic: "Preferences", position: sphereShell(2.4, 0.9, 11) },
  { id: "s-pref-04", title: "Dark mode first", description: "All UI components are designed in dark mode first. Light mode tokens are mapped afterward in a second pass.", source: "Design System Guidelines", timestamp: "2024-06-01", clusterId: "c-prefs", topic: "Preferences", position: sphereShell(2.6, 1.8, 9) },
  { id: "s-pref-05", title: "No inline styles — CSS variables only", description: "Inline style overrides are banned in the codebase to ensure design tokens remain the single source of truth.", source: "Design System Guidelines", timestamp: "2024-06-01", clusterId: "c-prefs", topic: "Preferences", position: sphereShell(2.8, 2.1, 13) },

  // ── Decisions
  { id: "s-dec-01", title: "Ship to Vercel, not AWS", description: "The infrastructure decision to use Vercel was made in September after benchmarking cold-start times. AWS Lambda was 3x slower for edge routes.", source: "Infra Decision Log", timestamp: "2024-09-05", clusterId: "c-decisions", topic: "Decisions", position: sphereShell(1.6, 4.8, 12) },
  { id: "s-dec-02", title: "Vector store: pgvector over Pinecone", description: "The team chose pgvector to keep everything in a single Postgres instance. Pinecone's egress cost at scale was a deal-breaker.", source: "Architecture Review", timestamp: "2024-09-12", clusterId: "c-decisions", topic: "Decisions", position: sphereShell(1.4, 5.1, 10) },
  { id: "s-dec-03", title: "No multi-tenancy until 10k users", description: "Single-tenant architecture will be maintained until the user base exceeds 10k active users, deferring tenant isolation complexity.", source: "CTO Office Hours", timestamp: "2024-10-02", clusterId: "c-decisions", topic: "Decisions", position: sphereShell(1.8, 5.4, 11) },
  { id: "s-dec-04", title: "Open-source the embedding layer", description: "The semantic embedding module will be open-sourced in Q1 2025 to build developer trust and attract contributor improvements.", source: "Roadmap Planning — Q4", timestamp: "2024-10-15", clusterId: "c-decisions", topic: "Decisions", position: sphereShell(1.2, 4.6, 13) },
  { id: "s-dec-05", title: "Mobile-first for onboarding", description: "The new user onboarding funnel prioritises mobile after analytics showed 64% of sign-ups happen on iOS/Android.", source: "Growth Team Report", timestamp: "2024-10-08", clusterId: "c-decisions", topic: "Decisions", position: sphereShell(1.7, 4.3, 9) },

  // ── Knowledge
  { id: "s-know-01", title: "RAG outperforms fine-tuning for recall", description: "Benchmark results showed RAG-based retrieval achieves 88% accuracy on domain-specific Q&A vs. 71% for fine-tuned GPT-3.5.", source: "Research Review — Oct 2024", timestamp: "2024-10-03", clusterId: "c-knowledge", topic: "Knowledge", position: sphereShell(2.0, 3.3, 15) },
  { id: "s-know-02", title: "Cosine similarity threshold: 0.82", description: "Below 0.82 cosine similarity, retrieved chunks add noise rather than context. This threshold was calibrated from 500 test queries.", source: "Embedding Calibration Report", timestamp: "2024-09-28", clusterId: "c-knowledge", topic: "Knowledge", position: sphereShell(2.2, 3.6, 16) },
  { id: "s-know-03", title: "Memory decay improves relevance", description: "Applying exponential time decay to memory scores (half-life = 30 days) reduces stale context pollution by 40% in long-running sessions.", source: "ML Experiment Log", timestamp: "2024-10-11", clusterId: "c-knowledge", topic: "Knowledge", position: sphereShell(1.9, 3.0, 14) },
  { id: "s-know-04", title: "LLM context window is social memory", description: "Key insight from NeurIPS 2024: the transformer context window functions analogously to human working memory. Maximem is built around this model.", source: "NeurIPS 2024 Notes", timestamp: "2024-10-18", clusterId: "c-knowledge", topic: "Knowledge", position: sphereShell(2.1, 3.9, 17) },
  { id: "s-know-05", title: "Graph + Vector = best recall", description: "Hybrid retrieval (graph traversal for structural context + vector search for semantic match) outperforms either approach alone by 19 points.", source: "Internal Research Paper", timestamp: "2024-10-20", clusterId: "c-knowledge", topic: "Knowledge", position: sphereShell(2.3, 2.7, 15) },
];

const SPHERE_EDGES: SphereEdge[] = [
  { id: "se-01", sourceId: "s-proj-01", targetId: "s-proj-02", type: "related to", reason: "The Context-Aware Sidebar relies on the Semantic Chunker to split retrieved documents into readable pieces before displaying them inline." },
  { id: "se-02", sourceId: "s-proj-02", targetId: "s-know-01", type: "influenced by", reason: "The decision to build a Semantic Chunker was informed by RAG research showing chunk quality directly determines recall accuracy." },
  { id: "se-03", sourceId: "s-proj-03", targetId: "s-dec-01", type: "part of", reason: "The Cross-App Memory Bridge deploys on Vercel edge functions, making the Vercel infrastructure decision a prerequisite." },
  { id: "se-04", sourceId: "s-proj-04", targetId: "s-proj-02", type: "related to", reason: "Streaming Memory Writes feed freshly chunked content directly into the graph, making the two pipelines tightly coupled." },
  { id: "se-05", sourceId: "s-proj-05", targetId: "s-proj-04", type: "part of", reason: "Metadata fingerprinting is a required step inside the streaming write path — without it, memories lack provenance." },
  { id: "se-06", sourceId: "s-proj-06", targetId: "s-ppl-01", type: "mentioned in", reason: "The Thread Summariser was designed specifically to accommodate Aria's async preference so she gets concise digests, not long threads." },
  { id: "se-07", sourceId: "s-ppl-02", targetId: "s-dec-01", type: "related to", reason: "Marcus's deployment gate was a key input in the Vercel decision — the team needed preview deploys for his sign-off process." },
  { id: "se-08", sourceId: "s-ppl-05", targetId: "s-dec-05", type: "influenced by", reason: "Priya's appointment as mobile lead was a direct consequence of the mobile-first onboarding decision made by the growth team." },
  { id: "se-09", sourceId: "s-ppl-03", targetId: "s-pref-04", type: "related to", reason: "Elena's design system ownership directly shapes the dark-mode-first guideline — she authored and enforces this preference." },
  { id: "se-10", sourceId: "s-pref-01", targetId: "s-know-02", type: "influenced by", reason: "The 8 000-token budget was calibrated using the 0.82 cosine similarity threshold — fewer, higher-quality chunks fit within that limit." },
  { id: "se-11", sourceId: "s-know-03", targetId: "s-pref-01", type: "updated by", reason: "Memory decay research changed how the token budget is allocated: fresher memories get more tokens, stale ones are trimmed first." },
  { id: "se-12", sourceId: "s-know-04", targetId: "s-proj-01", type: "influenced by", reason: "The NeurIPS insight about context windows as working memory directly shaped the Context-Aware Sidebar product philosophy." },
  { id: "se-13", sourceId: "s-know-05", targetId: "s-dec-02", type: "related to", reason: "The hybrid graph+vector recall finding validated the architectural decision to keep pgvector alongside the graph store." },
  { id: "se-14", sourceId: "s-dec-02", targetId: "s-proj-02", type: "part of", reason: "pgvector stores the embeddings produced by the Semantic Chunker — these two components are in the same data pipeline." },
  { id: "se-15", sourceId: "s-dec-04", targetId: "s-proj-02", type: "part of", reason: "The embedding module being open-sourced is the same Semantic Chunker pipeline — open-sourcing it creates a public implementation." },
  { id: "se-16", sourceId: "s-dec-03", targetId: "s-proj-05", type: "related to", reason: "Metadata fingerprinting became more critical because single-tenant architecture means user data must be precisely scoped at the memory level." },
  { id: "se-17", sourceId: "s-ppl-04", targetId: "s-proj-06", type: "mentioned in", reason: "James's timezone was the trigger for building the Thread Summariser — async summaries mean he gets context without being in real-time." },
  { id: "se-18", sourceId: "s-pref-02", targetId: "s-proj-04", type: "related to", reason: "TypeScript strict mode applies to the streaming write module — the type-safe event stream was a prerequisite for merging." },
  { id: "se-19", sourceId: "s-pref-03", targetId: "s-proj-01", type: "related to", reason: "The Context-Aware Sidebar uses Zod schemas to validate every memory payload before rendering to prevent malformed data reaching the UI." },
  { id: "se-20", sourceId: "s-know-01", targetId: "s-dec-02", type: "influenced by", reason: "The RAG-over-fine-tuning finding reinforced keeping retrieval (pgvector) at the core rather than investing in model fine-tuning." },
  { id: "se-21", sourceId: "s-know-02", targetId: "s-proj-02", type: "updated by", reason: "The 0.82 threshold is baked into the Semantic Chunker's post-retrieval filter to discard low-confidence chunks at ingestion." },
  { id: "se-22", sourceId: "s-know-03", targetId: "s-dec-02", type: "influenced by", reason: "Memory decay required pgvector score adjustments — the time-weighted similarity score is computed inside the vector store query." },
  { id: "se-23", sourceId: "s-ppl-02", targetId: "s-proj-04", type: "mentioned in", reason: "Streaming writes are gated behind Marcus's deployment approval because the pipeline flushes to production on each commit." },
  { id: "se-24", sourceId: "s-dec-05", targetId: "s-proj-03", type: "part of", reason: "Mobile-first onboarding requires the Cross-App Memory Bridge to sync mobile-captured memories with the desktop graph." },
  { id: "se-25", sourceId: "s-pref-05", targetId: "s-pref-04", type: "related to", reason: "CSS variable enforcement and dark-mode-first design are both governed by the same Design System Guidelines document." },
  { id: "se-26", sourceId: "s-know-04", targetId: "s-know-05", type: "related to", reason: "The social-memory insight and the hybrid retrieval finding together form the theoretical foundation for Maximem's architecture." },
  { id: "se-27", sourceId: "s-proj-01", targetId: "s-pref-01", type: "part of", reason: "The sidebar context assembly must respect the 8 000-token budget or it over-fills the LLM window and degrades generation quality." },
  { id: "se-28", sourceId: "s-ppl-03", targetId: "s-pref-05", type: "related to", reason: "Elena enforces the no-inline-styles rule as part of her design system ownership — violations are flagged in her review cycle." },
];

const SPHERE_CLUSTERS = [
  { id: "c-projects", name: "Projects", colour: 0x6b9fff, css: "#6b9fff", tag: "Active" },
  { id: "c-people",   name: "People",   colour: 0xa78bfa, css: "#a78bfa", tag: "Team"     },
  { id: "c-prefs",    name: "Preferences", colour: 0x34d399, css: "#34d399", tag: "Style" },
  { id: "c-decisions",name: "Decisions",colour: 0xfbbf24, css: "#fbbf24", tag: "Strategic"},
  { id: "c-knowledge",name: "Knowledge",colour: 0xf26522, css: "#f26522", tag: "Research" },
];

const CLUSTER_COL_THREE: Record<string, THREE.Color> = {};
const CLUSTER_COL_CSS: Record<string, string> = {};
SPHERE_CLUSTERS.forEach((c) => {
  CLUSTER_COL_THREE[c.id] = new THREE.Color(c.colour);
  CLUSTER_COL_CSS[c.id] = c.css;
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4.  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface KnowledgeSphereProps { className?: string }

export function KnowledgeSphere({ className = "" }: KnowledgeSphereProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredId,    setHoveredId]    = useState<string | null>(null);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [tooltipPos,   setTooltipPos]   = useState({ x: 0, y: 0 });
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

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
        return { edge: e, otherNode: SPHERE_MEMORIES.find((m) => m.id === otherId)! };
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

  // ── Internal WebGL refs ──────────────────────────────────────────────────────
  const particleMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const nodeMeshesRef  = useRef<{ proxy: THREE.Mesh; visual: THREE.Mesh; mem: SphereMemory }[]>([]);
  const edgesRef       = useRef<{ line: THREE.Line; edge: SphereEdge }[]>([]);
  const rafRef         = useRef<number>(0);
  const clockRef       = useRef(new THREE.Clock());

  const orbitRef = useRef({
    isDragging: false,
    lastX: 0, lastY: 0,
    phi: Math.PI / 2.4, theta: 0, radius: 58,
    targetPhi: Math.PI / 2.4, targetTheta: 0, targetRadius: 58,
  });

  // ── Build scene ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    const container: HTMLDivElement = containerRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Scene & camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 600);

    function syncCamera() {
      const o = orbitRef.current;
      camera.position.set(
        o.radius * Math.sin(o.phi) * Math.sin(o.theta),
        o.radius * Math.cos(o.phi),
        o.radius * Math.sin(o.phi) * Math.cos(o.theta)
      );
      camera.lookAt(0, 0, 0);
    }
    syncCamera();

    function onResize() {
      if (!container) return;
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ─────────────────────────────────────────────
    // A. PARTICLE SPHERE  (6 concentric shells)
    // ─────────────────────────────────────────────
    const TOTAL = 6000;
    const pos   = new Float32Array(TOTAL * 3);
    const col   = new Float32Array(TOTAL * 3);
    const sz    = new Float32Array(TOTAL);

    const shells = [
      { r: 3.5,  count: 300,  b: 1.00 },
      { r: 7.0,  count: 600,  b: 0.85 },
      { r: 10.5, count: 900,  b: 0.70 },
      { r: 14.0, count: 1100, b: 0.60 },
      { r: 17.5, count: 1300, b: 0.45 },
      { r: 20.0, count: 1800, b: 0.30 },
    ];

    const GA = Math.PI * (3 - Math.sqrt(5)); // golden angle
    let pi = 0;

    shells.forEach(({ r, count, b }) => {
      for (let i = 0; i < count && pi < TOTAL; i++, pi++) {
        const y      = 1 - (i / (count - 1)) * 2;
        const rFlat  = Math.sqrt(Math.max(0, 1 - y * y));
        const theta  = GA * i;
        const jitter = (Math.random() - 0.5) * 0.8;
        const rr     = r + jitter;

        pos[pi * 3 + 0] = rr * rFlat * Math.cos(theta);
        pos[pi * 3 + 1] = rr * y;
        pos[pi * 3 + 2] = rr * rFlat * Math.sin(theta);

        const bright = b * (0.7 + Math.random() * 0.3);
        col[pi * 3 + 0] = bright;
        col[pi * 3 + 1] = bright;
        col[pi * 3 + 2] = bright;

        sz[pi] = 1.2 + Math.random() * 1.6;
      }
    });

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position",     new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("baseColor",    new THREE.BufferAttribute(col, 3));
    pGeo.setAttribute("particleSize", new THREE.BufferAttribute(sz,  1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:        { value: 0 },
        uOrange:      { value: new THREE.Color(0xf26522) },
        uDimming:     { value: 0.0 },
        uRecallPhase: { value: 0.0 },
        uSelectedPos: { value: new THREE.Vector3(9999, 9999, 9999) },
      },
      vertexShader: `
        attribute vec3 baseColor;
        attribute float particleSize;
        varying vec3 vCol;
        varying float vOrange;
        varying float vDepth;
        uniform float uTime;
        uniform vec3 uOrange;
        uniform float uDimming;
        uniform float uRecallPhase;
        uniform vec3 uSelectedPos;

        mat3 rotY(float a) {
          float c = cos(a); float s = sin(a);
          return mat3(c,0,s, 0,1,0, -s,0,c);
        }
        void main() {
          vCol = baseColor;
          float angle = uTime * 0.022 + position.y * 0.008;
          vec3 p = rotY(angle) * position;
          float breathe = sin(uTime * 0.55 + length(position) * 0.08) * 0.45;
          p += normalize(position + vec3(0.001)) * breathe;

          float rLen = length(p);
          float wave = 0.0;
          if (uRecallPhase > 0.01) {
            float waveFront = uRecallPhase * 24.0;
            float d = abs(rLen - waveFront);
            wave = smoothstep(2.5, 0.0, d) * 0.9;
          }
          float selDist = length(p - uSelectedPos);
          float selRing = smoothstep(8.0, 1.5, selDist) * 0.55;
          vOrange = clamp(wave + selRing, 0.0, 1.0);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          float gsz = particleSize * (320.0 / max(dist, 8.0));
          gsz = clamp(gsz, 0.8, 18.0);
          if (vOrange > 0.15) gsz *= 1.4;
          gl_PointSize = gsz;
          vDepth = dist;
        }
      `,
      fragmentShader: `
        uniform vec3 uOrange;
        uniform float uDimming;
        varying vec3 vCol;
        varying float vOrange;
        varying float vDepth;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float d = length(coord);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.28, d);
          float core  = 1.0 - smoothstep(0.0, 0.22, d);
          vec3 finalCol = mix(vCol, uOrange, vOrange) + vec3(core * 0.2);
          float depthAlpha = smoothstep(350.0, 20.0, vDepth);
          float a = alpha * clamp(depthAlpha, 0.18, 1.0);
          a = mix(a, a * 0.2, uDimming);
          gl_FragColor = vec4(finalCol, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    particleMatRef.current = pMat;
    scene.add(new THREE.Points(pGeo, pMat));

    // Inner-shell fine mesh lines
    const innerPos: THREE.Vector3[] = [];
    for (let i = 0; i < 300; i++) {
      innerPos.push(new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    }
    const linePositions: number[] = [];
    const THRESH = 5.5;
    for (let a = 0; a < innerPos.length; a++) {
      for (let b = a + 1; b < innerPos.length; b++) {
        if (innerPos[a].distanceTo(innerPos[b]) < THRESH) {
          linePositions.push(
            innerPos[a].x, innerPos[a].y, innerPos[a].z,
            innerPos[b].x, innerPos[b].y, innerPos[b].z
          );
        }
      }
    }
    const webGeo = new THREE.BufferGeometry();
    webGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    scene.add(new THREE.LineSegments(webGeo, new THREE.LineBasicMaterial({
      color: 0x888888, transparent: true, opacity: 0.06, depthWrite: false,
    })));

    // ─────────────────────────────────────────────
    // B. MEMORY NODES
    // ─────────────────────────────────────────────
    const nodeMeshes: { proxy: THREE.Mesh; visual: THREE.Mesh; mem: SphereMemory }[] = [];
    const nodeGroup  = new THREE.Group();
    const proxyGroup = new THREE.Group();
    const vGeo2  = new THREE.SphereGeometry(0.28, 10, 10);
    const pGeo3  = new THREE.SphereGeometry(3.8, 8, 8);
    const pMat3  = new THREE.MeshBasicMaterial({ visible: false });

    SPHERE_MEMORIES.forEach((mem) => {
      const clusterCol = CLUSTER_COL_THREE[mem.clusterId] ?? new THREE.Color(0xffffff);
      const vMat = new THREE.MeshBasicMaterial({ color: clusterCol, transparent: true, opacity: 0.92 });
      const visual = new THREE.Mesh(vGeo2, vMat);
      visual.position.copy(mem.position);
      const proxy = new THREE.Mesh(pGeo3, pMat3);
      proxy.position.copy(mem.position);
      proxy.userData = { mem, visual };
      nodeGroup.add(visual);
      proxyGroup.add(proxy);
      nodeMeshes.push({ proxy, visual, mem });
    });
    scene.add(nodeGroup);
    scene.add(proxyGroup);
    nodeMeshesRef.current = nodeMeshes;

    // ─────────────────────────────────────────────
    // C. GRAPH EDGES
    // ─────────────────────────────────────────────
    const edgeObjs: { line: THREE.Line; edge: SphereEdge }[] = [];

    SPHERE_EDGES.forEach((edge) => {
      const m1 = SPHERE_MEMORIES.find((m) => m.id === edge.sourceId);
      const m2 = SPHERE_MEMORIES.find((m) => m.id === edge.targetId);
      if (!m1 || !m2) return;
      const p1  = m1.position;
      const p2  = m2.position;
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const ctrl = mid.clone().addScaledVector(mid.clone().negate().normalize(), p1.distanceTo(p2) * 0.12);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        pts.push(new THREE.Vector3(
          (1-t)*(1-t)*p1.x + 2*(1-t)*t*ctrl.x + t*t*p2.x,
          (1-t)*(1-t)*p1.y + 2*(1-t)*t*ctrl.y + t*t*p2.y,
          (1-t)*(1-t)*p1.z + 2*(1-t)*t*ctrl.z + t*t*p2.z,
        ));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, transparent: true, opacity: 0.18, depthWrite: false });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      edgeObjs.push({ line, edge });
    });
    edgesRef.current = edgeObjs;

    // ─────────────────────────────────────────────
    // D. ANIMATION LOOP
    // ─────────────────────────────────────────────
    let recallPhase = 0;
    let recallTarget = 0;
    let recallTimer = 0;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();

      const o = orbitRef.current;
      o.phi    += (o.targetPhi    - o.phi)    * 0.06;
      o.theta  += (o.targetTheta  - o.theta)  * 0.06;
      o.radius += (o.targetRadius - o.radius) * 0.06;
      if (!o.isDragging) o.targetTheta += 0.0018;
      syncCamera();

      recallTimer += 0.016;
      if (recallTimer > 12 && recallPhase < 0.01) { recallTimer = 0; recallTarget = 1; }
      if (recallTarget > 0.01) {
        recallPhase = Math.min(recallPhase + 0.012, 1.0);
        if (recallPhase >= 1.0) { recallTarget = 0; recallPhase = 0; }
      }

      pMat.uniforms.uTime.value        = t;
      pMat.uniforms.uRecallPhase.value = recallPhase;

      const selId  = selectedIdRef.current;
      const selMem = selId ? SPHERE_MEMORIES.find((m) => m.id === selId) : null;
      if (selMem) {
        pMat.uniforms.uSelectedPos.value.copy(selMem.position);
        pMat.uniforms.uDimming.value = Math.min(pMat.uniforms.uDimming.value + 0.04, 0.75);
      } else {
        pMat.uniforms.uDimming.value = Math.max(pMat.uniforms.uDimming.value - 0.04, 0);
        pMat.uniforms.uSelectedPos.value.set(9999, 9999, 9999);
      }

      nodeMeshes.forEach(({ visual, mem }) => {
        const mat  = visual.material as THREE.MeshBasicMaterial;
        const base = CLUSTER_COL_THREE[mem.clusterId] ?? new THREE.Color(0xffffff);
        const isActive   = selId === mem.id;
        const isNeighbor = !isActive && selId !== null && SPHERE_EDGES.some(
          (e) => (e.sourceId === selId && e.targetId === mem.id) || (e.targetId === selId && e.sourceId === mem.id)
        );
        if (isActive) {
          mat.color.set(0xf26522);
          mat.opacity = 1.0;
          visual.scale.setScalar(1.6 + 0.15 * Math.sin(t * 3.5));
        } else if (isNeighbor) {
          mat.color.copy(base).lerp(new THREE.Color(0xf26522), 0.5);
          mat.opacity = 0.9;
          visual.scale.setScalar(1.2);
        } else if (selId !== null) {
          mat.color.copy(base);
          mat.opacity = 0.15;
          visual.scale.setScalar(0.9);
        } else {
          mat.color.copy(base);
          mat.opacity = 0.92;
          visual.scale.setScalar(1.0 + 0.04 * Math.sin(t * 1.2 + mem.position.x * 0.3));
        }
      });

      edgeObjs.forEach(({ line, edge }) => {
        const mat = line.material as THREE.LineBasicMaterial;
        if (selId !== null) {
          const rel = edge.sourceId === selId || edge.targetId === selId;
          mat.color.set(rel ? 0xf26522 : 0x282828);
          mat.opacity = rel ? 0.75 : 0.04;
        } else {
          mat.color.set(0x4a4a4a);
          mat.opacity = 0.18;
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    // ─────────────────────────────────────────────
    // E. ORBIT + ZOOM
    // ─────────────────────────────────────────────
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
      orbitRef.current.targetTheta -= dx * 0.007;
      orbitRef.current.targetPhi = Math.max(0.15, Math.min(Math.PI - 0.15, orbitRef.current.targetPhi + dy * 0.007));
    }
    function onPointerUp() { orbitRef.current.isDragging = false; }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      orbitRef.current.targetRadius = Math.max(28, Math.min(110, orbitRef.current.targetRadius + e.deltaY * 0.04));
    }
    canvas.addEventListener("pointerdown",  onPointerDown);
    canvas.addEventListener("pointermove",  onPointerMove);
    canvas.addEventListener("pointerup",    onPointerUp);
    canvas.addEventListener("wheel",        onWheel, { passive: false });

    // ─────────────────────────────────────────────
    // F. RAYCASTING
    // ─────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    let pendingHover: string | null = null;

    function getNDC(cx: number, cy: number) {
      const r = canvas.getBoundingClientRect();
      mouse.x =  ((cx - r.left) / r.width)  * 2 - 1;
      mouse.y = -((cy - r.top)  / r.height)  * 2 + 1;
    }

    function onMouseMove(e: MouseEvent) {
      getNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes.map((n) => n.proxy));
      if (hits.length > 0) {
        const mem = hits[0].object.userData.mem as SphereMemory;
        if (pendingHover !== mem.id) {
          pendingHover = mem.id;
          setHoveredId(mem.id);
          setTooltipPos({ x: e.clientX, y: e.clientY });
          canvas.style.cursor = "pointer";
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
        const mem = hits[0].object.userData.mem as SphereMemory;
        setSelectedId((prev) => (prev === mem.id ? null : mem.id));
      } else {
        setSelectedId(null);
      }
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click",     onClick);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSelectedId(null); }
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown",  onPointerDown);
      canvas.removeEventListener("pointermove",  onPointerMove);
      canvas.removeEventListener("pointerup",    onPointerUp);
      canvas.removeEventListener("wheel",        onWheel);
      canvas.removeEventListener("mousemove",    onMouseMove);
      canvas.removeEventListener("click",        onClick);
      window.removeEventListener("keydown",      onKeyDown);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFromPanel = useCallback((id: string) => setSelectedId(id), []);

  // ═════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#1B1B19] overflow-hidden select-none ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cluster legend */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        {SPHERE_CLUSTERS.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: c.css }} />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{c.name}</span>
          </div>
        ))}
      </div>

      {/* Concept badge */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-full bg-[#f26522]/15 border border-[#f26522]/30 text-[10px] font-mono text-[#f26522] uppercase tracking-wider font-semibold">
          Concept 02 · Living Knowledge Sphere
        </span>
      </div>

      {/* Search */}
      {searchOpen && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px] px-4">
          <div className="relative bg-[#141412]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_20px_48px_rgba(0,0,0,0.9)] overflow-hidden">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#71717a]" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories…"
              className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-white placeholder:text-[#52525b] outline-none"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
            >
              <X className="size-4" />
            </button>
            {searchQuery.trim() && (
              <div className="border-t border-white/10 max-h-64 overflow-y-auto">
                {filteredMemories.length === 0 ? (
                  <p className="text-xs text-[#71717a] px-4 py-3">No memories match.</p>
                ) : (
                  filteredMemories.map((mem) => (
                    <button
                      key={mem.id}
                      onClick={() => { setSelectedId(mem.id); setSearchOpen(false); setSearchQuery(""); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"
                    >
                      <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: CLUSTER_COL_CSS[mem.clusterId] ?? "#888" }} />
                      <div>
                        <div className="text-xs font-medium text-white">{mem.title}</div>
                        <div className="text-[10px] text-[#71717a] font-mono">{mem.topic} · {mem.source}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredMemory && !selectedId && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-xl bg-[#121210]/95 backdrop-blur-md border border-white/[0.14] shadow-[0_12px_28px_rgba(0,0,0,0.7)] max-w-[260px] -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 14 }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="size-1.5 rounded-full" style={{ background: CLUSTER_COL_CSS[hoveredMemory.clusterId] ?? "#888" }} />
            <span className="font-mono text-[9px] uppercase tracking-wider font-semibold" style={{ color: CLUSTER_COL_CSS[hoveredMemory.clusterId] ?? "#888" }}>
              {hoveredMemory.topic}
            </span>
          </div>
          <div className="text-[12px] font-medium text-white leading-snug">{hoveredMemory.title}</div>
          <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">Click to explore →</div>
        </div>
      )}

      {/* Memory detail panel */}
      {selectedMemory && (
        <div className="absolute bottom-4 right-4 z-40 max-w-[390px] w-full p-4 rounded-2xl bg-[#141412]/95 backdrop-blur-xl border border-white/15 shadow-[0_20px_48px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: CLUSTER_COL_CSS[selectedMemory.clusterId] ?? "#888", boxShadow: `0 0 0 4px ${CLUSTER_COL_CSS[selectedMemory.clusterId] ?? "#888"}30` }} />
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: CLUSTER_COL_CSS[selectedMemory.clusterId] ?? "#888" }}>
                {selectedMemory.topic}
              </span>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-[#a1a1aa] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5">{selectedMemory.title}</h3>
          <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">{selectedMemory.description}</p>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] pb-3 border-b border-white/10 mb-3">
            <span className="truncate max-w-[200px]">{selectedMemory.source}</span>
            <span>{selectedMemory.timestamp}</span>
          </div>

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
                  onClick={() => handleSelectFromPanel(otherNode.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-[#f26522]/40 transition-all group flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium capitalize bg-[#f26522]/15 text-[#f26522] border border-[#f26522]/30">{edge.type}</span>
                    <ArrowRight className="size-3 text-[#71717a] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xs font-medium text-white group-hover:text-[#f26522] transition-colors leading-snug">{otherNode.title}</div>
                  <p className="text-[11px] text-[#a1a1aa] leading-tight line-clamp-2">{edge.reason}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      {selectedId && (
        <button
          onClick={() => setSelectedId(null)}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141412]/90 backdrop-blur-md border border-white/15 text-xs font-mono text-[#a1a1aa] hover:text-white transition-colors shadow-lg animate-in fade-in duration-150"
        >
          <RotateCcw className="size-3" />
          Back to full sphere
        </button>
      )}

      {/* Bottom hints */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#71717a] bg-[#141412]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Scroll to zoom</span>
        <span>•</span>
        <span>Click node to explore</span>
        <span>•</span>
        <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">/</kbd> to search</span>
      </div>
    </div>
  );
}

export default KnowledgeSphere;
