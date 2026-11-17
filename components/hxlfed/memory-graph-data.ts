export type RelationshipType =
  | 'Related to'
  | 'Mentioned in'
  | 'Derived from'
  | 'Updated by'
  | 'Part of'
  | 'Influenced by';

export type MemoryCategory =
  | 'Architecture'
  | 'Person'
  | 'Topic'
  | 'Decision'
  | 'Conversation'
  | 'Preference'
  | 'Security'
  | 'Contract';

export interface MemoryConnection {
  targetId: string;
  type: RelationshipType;
  explanation: string;
}

export interface AIMemoryNode {
  id: string;
  num: string;
  title: string;
  caps: string;
  category: MemoryCategory;
  summary: string;
  source: string;
  entities: string[];
  createdAt: string;
  updatedAt: string;
  orbitRadius: number; // Radial distance from celestial core
  baseAngle: number;   // Angular position (radians)
  orbitSpeed: number;  // Keplerian orbital drift rate
  tilt: number;        // Elevation offset in 3D
  connections: MemoryConnection[];
}

export const MEMORY_NODES: AIMemoryNode[] = [
  // --- CLUSTER 1: CORE ARCHITECTURE & SYSTEM DESIGN (Inner Orbit) ---
  {
    id: 'agent-harness',
    num: '01',
    title: 'Agent Harness Architecture',
    caps: 'ARCHITECTURE',
    category: 'Architecture',
    summary:
      'The execution harness is the real product: atomic tools remain permanently loaded, while availability per step is governed by constrained decoding logit masking rather than dynamic tool removal.',
    source: 'Doc: Agent Harness Spec v2.4 (Core Engineering)',
    entities: ['Manus', 'Dex Horthy', 'Maximem Core'],
    createdAt: '2026-09-14T03:15:00Z',
    updatedAt: '2026-10-24T18:40:00Z',
    orbitRadius: 1.85,
    baseAngle: 0.35,
    orbitSpeed: 0.14,
    tilt: 0.05,
    connections: [
      {
        targetId: 'logit-masking',
        type: 'Derived from',
        explanation: 'Dynamic tool definition injection invalidates KV-caches; logit masking preserves cache locality across steps.',
      },
      {
        targetId: 'action-space',
        type: 'Part of',
        explanation: 'Serves as Level 1 foundation in the three-tiered agent execution model.',
      },
      {
        targetId: 'memory-decay',
        type: 'Related to',
        explanation: 'The harness schedules autonomous memory pruning passes during low-inference idle cycles.',
      },
    ],
  },
  {
    id: 'logit-masking',
    num: '02',
    title: 'KV-Cache & Logit Masking',
    caps: 'LATENCY',
    category: 'Architecture',
    summary:
      'Constraining output token probabilities during sampling eliminates prompt prefix cache thrashing, achieving 4.2x faster tool dispatch latency under multi-turn autonomous loops.',
    source: 'Engineering Log #418: Inference Acceleration',
    entities: ['vLLM Engine', 'Attention Caching', 'Maximem Core'],
    createdAt: '2026-09-22T11:20:00Z',
    updatedAt: '2026-10-18T09:12:00Z',
    orbitRadius: 2.1,
    baseAngle: 1.45,
    orbitSpeed: 0.12,
    tilt: -0.06,
    connections: [
      {
        targetId: 'agent-harness',
        type: 'Part of',
        explanation: 'Enables permanent tool retention in the context window without KV-cache invalidation.',
      },
      {
        targetId: 'vector-indexing',
        type: 'Influenced by',
        explanation: 'Fast retrieval tokens must align with pre-warmed prompt prefixes to maintain memory speed.',
      },
    ],
  },
  {
    id: 'action-space',
    num: '03',
    title: 'Three-Tier Action Space',
    caps: 'HIERARCHY',
    category: 'Architecture',
    summary:
      'Level 1: ~20 atomic function tools. Level 2: Sandbox Bash utilities (grep, ffmpeg, MCP CLI). Level 3: Dynamically generated runtime scripts using pre-installed libraries.',
    source: 'Doc: Modular Execution Space RFC',
    entities: ['Bash Sandbox', 'MCP Protocol', 'Maximem Runner'],
    createdAt: '2026-09-28T16:05:00Z',
    updatedAt: '2026-10-21T14:30:00Z',
    orbitRadius: 2.3,
    baseAngle: 2.65,
    orbitSpeed: 0.11,
    tilt: 0.08,
    connections: [
      {
        targetId: 'agent-harness',
        type: 'Part of',
        explanation: 'Defines the dispatch layers managed by the harness controller.',
      },
      {
        targetId: 'sandbox-security',
        type: 'Updated by',
        explanation: 'Level 2 & Level 3 execution sandboxes are constrained by enterprise container isolations.',
      },
      {
        targetId: 'vity-integration',
        type: 'Related to',
        explanation: 'Vity web runtime interacts directly with Level 1 client UI tools.',
      },
    ],
  },

  // --- CLUSTER 2: FOUNDER VISION & PRODUCT PHILOSOPHY (Mid-Inner Orbit) ---
  {
    id: 'alex-chen',
    num: '04',
    title: 'Alex Chen (Founder & Lead)',
    caps: 'PERSON',
    category: 'Person',
    summary:
      'Primary architect of Maximem and creator of the tactile night aesthetic in Vity. Strongly advocates for zero-placeholder interfaces, calm astronomical density, and physical precision.',
    source: 'Founder Dialogue & Identity Profile',
    entities: ['Alex Chen', 'Maximem', 'Vity'],
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-10-29T21:40:00Z',
    orbitRadius: 2.65,
    baseAngle: 3.85,
    orbitSpeed: 0.095,
    tilt: -0.04,
    connections: [
      {
        targetId: 'product-philosophy',
        type: 'Influenced by',
        explanation: 'Formulated the design mantra: "Software should feel like physical paper and astronomical instruments."',
      },
      {
        targetId: 'vity-integration',
        type: 'Related to',
        explanation: 'Built the initial celestial design language in Vity and guided its transition to Maximem.',
      },
      {
        targetId: 'soundscape-decision',
        type: 'Mentioned in',
        explanation: 'Mandated procedural Web Audio API synthesis instead of heavy static audio files.',
      },
    ],
  },
  {
    id: 'product-philosophy',
    num: '05',
    title: 'Tactile Restraint & Paper Aesthetic',
    caps: 'PHILOSOPHY',
    category: 'Preference',
    summary:
      'Avoid loud, generic dashboard tropes. Use deep charcoal obsidian (#000000), sumi ink, warm parchment (#e8e6df), fine stardust particles, and precision drafting corner brackets.',
    source: 'Design Manifesto: The Architecture of Midnight',
    entities: ['Design System', 'Hxlfed Reference', 'Maximem UI'],
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-10-27T17:15:00Z',
    orbitRadius: 2.85,
    baseAngle: 4.95,
    orbitSpeed: 0.09,
    tilt: 0.06,
    connections: [
      {
        targetId: 'alex-chen',
        type: 'Derived from',
        explanation: 'Directly reflects Alex’s vision of quiet, non-intrusive computing for late-night focus.',
      },
      {
        targetId: 'soundscape-decision',
        type: 'Related to',
        explanation: 'Pairs monochrome typographic serenity with ambient sub-harmonic acoustic anchors.',
      },
      {
        targetId: 'accessibility-pref',
        type: 'Part of',
        explanation: 'Demands strict prefers-reduced-motion compliance without stripping semantic beauty.',
      },
    ],
  },
  {
    id: 'vity-integration',
    num: '06',
    title: 'Vity Celestial Platform',
    caps: 'ORIGIN',
    category: 'Topic',
    summary:
      'The original web engine where the hxlfed.com orbital concept was born. Provides the mathematical canvas shaders, Keplarian rings, and minimalist navigation taxonomy.',
    source: 'Repository Sync: Vity Web Experiments (2026)',
    entities: ['Vity', 'hxlfed.com', 'Three.js'],
    createdAt: '2026-08-20T14:00:00Z',
    updatedAt: '2026-10-29T21:50:00Z',
    orbitRadius: 3.1,
    baseAngle: 0.95,
    orbitSpeed: 0.082,
    tilt: -0.09,
    connections: [
      {
        targetId: 'alex-chen',
        type: 'Related to',
        explanation: 'Authored directly by Alex Chen as a signature digital exploration.',
      },
      {
        targetId: 'action-space',
        type: 'Related to',
        explanation: 'Integrates real-time client UI bridges with Maximem’s execution layers.',
      },
      {
        targetId: 'memory-decay',
        type: 'Updated by',
        explanation: 'Adapted the visual star field to visualize living neural memory synthesis.',
      },
    ],
  },

  // --- CLUSTER 3: MEMORY SYNTHESIS, TELEMETRY & KNOWLEDGE GRAPH (Mid-Outer Orbit) ---
  {
    id: 'memory-decay',
    num: '07',
    title: 'Memory Decay & Consolidation',
    caps: 'SYNAPSE',
    category: 'Decision',
    summary:
      'Human-like Ebbinghaus decay curve for working facts, while consolidated semantic insights undergo periodic crystallization into persistent cosmic knowledge tiers.',
    source: 'Architecture Decision Record #024: Cognitive Lifecycle',
    entities: ['Synap Engine', 'Memory Lifespan', 'Maximem Storage'],
    createdAt: '2026-09-02T19:45:00Z',
    updatedAt: '2026-10-26T15:20:00Z',
    orbitRadius: 3.35,
    baseAngle: 2.15,
    orbitSpeed: 0.075,
    tilt: 0.07,
    connections: [
      {
        targetId: 'agent-harness',
        type: 'Influenced by',
        explanation: 'Pruning passes are triggered by background harness workers to preserve KV token limits.',
      },
      {
        targetId: 'vector-indexing',
        type: 'Updated by',
        explanation: 'Decayed nodes are softly de-indexed from fast nearest-neighbor lookups.',
      },
      {
        targetId: 'semantic-tiers',
        type: 'Part of',
        explanation: 'Separates ephemeral working notes from immutable episodic milestones.',
      },
    ],
  },
  {
    id: 'vector-indexing',
    num: '08',
    title: 'Hybrid Embedding & Graph Indexing',
    caps: 'RETRIEVAL',
    category: 'Architecture',
    summary:
      'Dual-stream semantic retrieval combining dense HNSW vector similarity with explicit graph relationship edges. Prevents hallucinated leaps by verifying edge paths.',
    source: 'Technical RFC: Graph-RAG Dual Pass',
    entities: ['HNSW', 'Graph-RAG', 'Vector Embeddings'],
    createdAt: '2026-09-08T08:10:00Z',
    updatedAt: '2026-10-25T12:00:00Z',
    orbitRadius: 3.55,
    baseAngle: 3.35,
    orbitSpeed: 0.07,
    tilt: -0.05,
    connections: [
      {
        targetId: 'logit-masking',
        type: 'Related to',
        explanation: 'Retrieved chunk IDs are used to mask tool targets and memory context slots.',
      },
      {
        targetId: 'memory-decay',
        type: 'Mentioned in',
        explanation: 'Graph edge weights reflect recent retrieval frequency and recency boost.',
      },
      {
        targetId: 'semantic-tiers',
        type: 'Derived from',
        explanation: 'Constructed across all four cognitive tiers (Sensory, Working, Episodic, Semantic).',
      },
    ],
  },
  {
    id: 'semantic-tiers',
    num: '09',
    title: 'Four Cognitive Memory Tiers',
    caps: 'ONTOLOGY',
    category: 'Topic',
    summary:
      'Tier 1 (Sensory Buffer): raw stream ingestion. Tier 2 (Working Context): active session tokens. Tier 3 (Episodic Log): immutable chronological events. Tier 4 (Semantic Core): generalized truths.',
    source: 'Whitepaper: Maximem Unified Cognitive Architecture',
    entities: ['Memory Tiers', 'Sensory', 'Episodic', 'Semantic'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-10-22T16:00:00Z',
    orbitRadius: 3.75,
    baseAngle: 4.55,
    orbitSpeed: 0.065,
    tilt: 0.11,
    connections: [
      {
        targetId: 'memory-decay',
        type: 'Part of',
        explanation: 'Dictates the transition pipeline from Working Context down to Semantic Core.',
      },
      {
        targetId: 'vector-indexing',
        type: 'Related to',
        explanation: 'Each tier maintains dedicated vector indexing density and cache priority.',
      },
      {
        targetId: 'client-contract',
        type: 'Influenced by',
        explanation: 'Client contracts enforce strict retention caps on Tier 3 Episodic logs.',
      },
    ],
  },

  // --- CLUSTER 4: GOVERNANCE, CONTRACTS, AUDIO & AUDIT (Far Outer Orbit) ---
  {
    id: 'soundscape-decision',
    num: '10',
    title: 'Procedural Audio Synthesizer',
    caps: 'ACOUSTICS',
    category: 'Decision',
    summary:
      'Synthesizes deep sub-harmonic drones (45Hz - 110Hz), ethereal sine glides, and harmonic crystal chimes via Web Audio API. 0 KB audio assets loaded over the wire.',
    source: 'ADR #031: Web Audio Synthesis & Autoplay Policy',
    entities: ['Web Audio API', 'OscillatorNode', 'Space Soundscape'],
    createdAt: '2026-10-12T14:30:00Z',
    updatedAt: '2026-10-28T13:00:00Z',
    orbitRadius: 4.05,
    baseAngle: 5.45,
    orbitSpeed: 0.058,
    tilt: -0.12,
    connections: [
      {
        targetId: 'product-philosophy',
        type: 'Related to',
        explanation: 'Provides ambient acoustic presence that supports late-night focus without intrusive loops.',
      },
      {
        targetId: 'alex-chen',
        type: 'Influenced by',
        explanation: 'Personally tuned by Alex Chen to resonate with deep space telemetry.',
      },
    ],
  },
  {
    id: 'client-contract',
    num: '11',
    title: 'Enterprise Tenant Isolation Contract',
    caps: 'GOVERNANCE',
    category: 'Contract',
    summary:
      'Strict multi-tenant cryptographic isolation: memories belonging to Client Alpha can never cross-pollinate Client Beta embeddings under mathematical guarantee.',
    source: 'Master Service Agreement: Enterprise Tier #09',
    entities: ['SLA', 'Single-Tenant Storage', 'Zero Cross-Pollination'],
    createdAt: '2026-09-18T17:00:00Z',
    updatedAt: '2026-10-27T11:45:00Z',
    orbitRadius: 4.3,
    baseAngle: 0.65,
    orbitSpeed: 0.052,
    tilt: 0.08,
    connections: [
      {
        targetId: 'sandbox-security',
        type: 'Related to',
        explanation: 'Enforces cryptographically partitioned memory spaces at the host kernel level.',
      },
      {
        targetId: 'semantic-tiers',
        type: 'Updated by',
        explanation: 'Requires automated wiping of Tier 1 & Tier 2 buffers upon session termination.',
      },
    ],
  },
  {
    id: 'sandbox-security',
    num: '12',
    title: 'Kernel Sandbox & Tool Isolation',
    caps: 'SECURITY',
    category: 'Security',
    summary:
      'Seccomp-bpf filters, non-root user namespaces, and ephemeral container lifetimes ensure bash execution tools in Level 2/3 cannot leak host memory or network tokens.',
    source: 'Security Audit v3.0: Sandbox Hardening',
    entities: ['Seccomp', 'Namespaces', 'Defense-in-Depth'],
    createdAt: '2026-09-25T13:20:00Z',
    updatedAt: '2026-10-28T09:10:00Z',
    orbitRadius: 4.55,
    baseAngle: 2.95,
    orbitSpeed: 0.046,
    tilt: -0.06,
    connections: [
      {
        targetId: 'action-space',
        type: 'Influenced by',
        explanation: 'Bounds what shell binaries can be invoked by Level 2 MCP agents.',
      },
      {
        targetId: 'client-contract',
        type: 'Part of',
        explanation: 'Fulfills enterprise compliance mandates for isolated untrusted code execution.',
      },
    ],
  },
  {
    id: 'accessibility-pref',
    num: '13',
    title: 'Reduced Motion & Sensory Control',
    caps: 'A11Y',
    category: 'Preference',
    summary:
      'System-wide listener for prefers-reduced-motion; dampens particle drift, disables ripple cascades, and locks camera transitions to instant non-rotational easing.',
    source: 'User Settings & A11Y Guideline',
    entities: ['Accessibility', 'Motion Safety', 'CSS Media'],
    createdAt: '2026-10-04T12:00:00Z',
    updatedAt: '2026-10-26T14:00:00Z',
    orbitRadius: 4.75,
    baseAngle: 4.25,
    orbitSpeed: 0.042,
    tilt: 0.04,
    connections: [
      {
        targetId: 'product-philosophy',
        type: 'Part of',
        explanation: 'Ensures the quiet night experience remains accessible and comfortable for all users.',
      },
    ],
  },
];

export const GUIDED_TOUR_STOPS: string[] = [
  'alex-chen',
  'agent-harness',
  'logit-masking',
  'action-space',
  'sandbox-security',
  'client-contract',
  'semantic-tiers',
  'vector-indexing',
  'memory-decay',
  'vity-integration',
  'soundscape-engine',
  'product-philosophy',
  'accessibility-pref',
];

export function getAllCategories(): MemoryCategory[] {
  const cats = new Set<MemoryCategory>();
  MEMORY_NODES.forEach((n) => cats.add(n.category));
  return Array.from(cats);
}

// Bidirectional BFS Shortest Path Discovery between any 2 memory nodes
export function findShortestPath(startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId];

  // Adjacency map
  const adj = new Map<string, Set<string>>();
  MEMORY_NODES.forEach((node) => {
    if (!adj.has(node.id)) adj.set(node.id, new Set());
    node.connections.forEach((conn) => {
      adj.get(node.id)!.add(conn.targetId);
      if (!adj.has(conn.targetId)) adj.set(conn.targetId, new Set());
      adj.get(conn.targetId)!.add(node.id);
    });
  });

  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    const neighbors = adj.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

