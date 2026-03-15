import type { Domain } from "@/types";
import type { GraphData, GraphNode, GraphLink } from "./layout";
import { getNeighborsAtDepth } from "./layout";

export interface GraphFilters {
  /** Set of enabled domains. If empty, all domains are shown. */
  enabledDomains: Set<Domain>;
  /** If set, only show nodes within this depth of the selected node */
  depthFilter: {
    nodeId: string;
    depth: number;
  } | null;
  /** Search query to highlight matching nodes */
  searchQuery: string;
}

export const defaultFilters: GraphFilters = {
  enabledDomains: new Set(),
  depthFilter: null,
  searchQuery: "",
};

/**
 * Apply domain and depth filters to graph data.
 * Returns a new GraphData with only matching nodes and their interconnecting links.
 */
export function applyFilters(
  data: GraphData,
  filters: GraphFilters
): GraphData {
  let filteredNodeIds = new Set(data.nodes.map((n) => n.id));

  // Apply domain filter
  if (filters.enabledDomains.size > 0) {
    filteredNodeIds = new Set(
      data.nodes
        .filter((n) => filters.enabledDomains.has(n.domain))
        .map((n) => n.id)
    );
  }

  // Apply depth filter (intersection with domain filter)
  if (filters.depthFilter) {
    const depthNodes = getNeighborsAtDepth(
      data,
      filters.depthFilter.nodeId,
      filters.depthFilter.depth
    );
    // Intersect with domain filter
    const intersection = new Set<string>();
    for (const id of filteredNodeIds) {
      if (depthNodes.has(id)) {
        intersection.add(id);
      }
    }
    // Always include the center node
    intersection.add(filters.depthFilter.nodeId);
    filteredNodeIds = intersection;
  }

  const filteredNodes: GraphNode[] = data.nodes.filter((n) =>
    filteredNodeIds.has(n.id)
  );

  const filteredLinks: GraphLink[] = data.links.filter((l) => {
    const sourceId =
      typeof l.source === "string"
        ? l.source
        : (l.source as unknown as GraphNode).id;
    const targetId =
      typeof l.target === "string"
        ? l.target
        : (l.target as unknown as GraphNode).id;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });

  return { nodes: filteredNodes, links: filteredLinks };
}

/**
 * Find node IDs matching a search query (case-insensitive, matches title or tags).
 */
export function findMatchingNodes(
  nodes: GraphNode[],
  query: string
): Set<string> {
  if (!query.trim()) return new Set();
  const q = query.toLowerCase().trim();
  return new Set(
    nodes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
      .map((n) => n.id)
  );
}
