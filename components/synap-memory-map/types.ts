export type ScopeType = 'client' | 'customer' | 'user' | 'shared';

export type EntityCategory =
  | 'Person'
  | 'Channel'
  | 'Preference'
  | 'Topic'
  | 'Organization'
  | 'Product'
  | 'Place'
  | 'Event'
  | 'Security'
  | 'Contract';

export type MemoryStatus = 'Active' | 'Superseded' | 'Confirmed' | 'Inferred';

export type RelationshipType =
  | 'references'
  | 'supersedes'
  | 'informs'
  | 'derived_from'
  | 'cross_scope';

export interface MemoryRelationship {
  id: string;
  sourceMemoryId: string;
  targetMemoryId: string;
  type: RelationshipType;
  description: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  text: string;
  status: MemoryStatus;
  importance: number; // 1..5 for subtle size scaling
  scopeId: string;
  scopeType: ScopeType;
  ownerName: string;
  customerName: string;
  clientName: string;
  category: EntityCategory;
  confidence: number; // 0..1
  createdAt: string;
  supersededBy?: string;
  supersedesId?: string;
  documentRef?: string;
  connectedEntityIds: string[];
  relationships: MemoryRelationship[];
  // Spatial coordinates on canvas (computed or fixed within scope region)
  x?: number;
  y?: number;
}

export interface EntityNode {
  id: string;
  label: string;
  category: EntityCategory;
  scopeId: string;
  connectionsCount: number;
  isPrimaryUser?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface MemoryEdge {
  id: string;
  source: string; // memory or entity id
  target: string;
  label: string;
  type?: RelationshipType;
  strength: number; // 1..5
  status?: 'normal' | 'superseded' | 'active-flow';
}

export interface UserScope {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  memoryCount: number;
  entityCount: number;
  relationshipCount: number;
  entities: EntityNode[];
  edges: MemoryEdge[];
  memories: MemoryItem[];
  // Spatial bounding box on canvas
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CustomerScope {
  id: string;
  name: string;
  industry: string;
  memoryCount: number;
  userCount: number;
  users: UserScope[];
  customerLevelMemories: MemoryItem[];
  // Spatial bounding box on canvas
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ClientScopeData {
  id: string;
  name: string;
  totalMemories: number;
  totalScopes: number;
  totalRelationships: number;
  sharedMemoriesCount: number;
  clientLevelMemories: MemoryItem[];
  customers: CustomerScope[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ViewLevel = 'cosmic-client' | 'customer-cluster' | 'user-graph' | 'galaxy-macro';

export type FilterSortMode = 'most-connected' | 'recently-active' | 'strongest-memories';
