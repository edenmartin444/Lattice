import type { Domain } from "@/types";
import { DOMAIN_COLORS } from "@/types";

// ---- Types for the graph data model ----

export interface GraphNode {
  id: string;
  title: string;
  description: string;
  domain: Domain;
  tags: string[];
  color: string;
  // react-force-graph adds x, y, vx, vy at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
  type: string;
  aiGenerated: boolean;
  accepted: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ---- Raw API response types ----

export interface RawConcept {
  id: string;
  title: string;
  description: string;
  domain: string;
  tags: string[];
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  strength: number;
  type: string;
  aiGenerated: boolean;
  accepted: boolean;
  from: { id: string; title: string; domain: string; description: string };
  to: { id: string; title: string; domain: string; description: string };
}

// ---- Transform API data into graph-compatible format ----

export function buildGraphData(
  concepts: RawConcept[],
  connections: RawConnection[]
): GraphData {
  const nodeIds = new Set(concepts.map((c) => c.id));

  const nodes: GraphNode[] = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    domain: c.domain as Domain,
    tags: c.tags,
    color: DOMAIN_COLORS[c.domain as Domain] || DOMAIN_COLORS.other,
  }));

  // Only include links where both endpoints exist in the node set
  const links: GraphLink[] = connections
    .filter((conn) => nodeIds.has(conn.fromId) && nodeIds.has(conn.toId))
    .map((conn) => ({
      id: conn.id,
      source: conn.fromId,
      target: conn.toId,
      label: conn.label,
      strength: conn.strength,
      type: conn.type,
      aiGenerated: conn.aiGenerated,
      accepted: conn.accepted,
    }));

  return { nodes, links };
}

// ---- Compute neighbors within N hops of a given node ----

export function getNeighborsAtDepth(
  graphData: GraphData,
  nodeId: string,
  depth: number
): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = [
    { id: nodeId, level: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.level >= depth) continue;

    // Find all connected nodes
    for (const link of graphData.links) {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : (link.source as unknown as GraphNode).id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : (link.target as unknown as GraphNode).id;

      if (sourceId === current.id && !visited.has(targetId)) {
        queue.push({ id: targetId, level: current.level + 1 });
      }
      if (targetId === current.id && !visited.has(sourceId)) {
        queue.push({ id: sourceId, level: current.level + 1 });
      }
    }
  }

  return visited;
}

// ---- Node size based on connection count ----

export function getNodeSize(
  nodeId: string,
  links: GraphLink[]
): number {
  let count = 0;
  for (const link of links) {
    const sourceId =
      typeof link.source === "string"
        ? link.source
        : (link.source as unknown as GraphNode).id;
    const targetId =
      typeof link.target === "string"
        ? link.target
        : (link.target as unknown as GraphNode).id;
    if (sourceId === nodeId || targetId === nodeId) count++;
  }
  // Base size 6, +2 per connection, max 20
  return Math.min(6 + count * 2, 20);
}

// ---- Link width based on strength ----

export function getLinkWidth(strength: number): number {
  // Min 1, max 5, proportional to strength
  return 1 + strength * 4;
}
