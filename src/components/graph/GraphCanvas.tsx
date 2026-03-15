"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GraphNode, GraphLink, GraphData } from "@/lib/graph/layout";
import { getNodeSize, getLinkWidth } from "@/lib/graph/layout";
import {
  applyFilters,
  findMatchingNodes,
  defaultFilters,
  type GraphFilters,
} from "@/lib/graph/filters";
import { DOMAIN_COLORS, type Domain } from "@/types";
import { NodeTooltip } from "./NodeTooltip";
import { GraphControls } from "./GraphControls";
import { NodePanel, LinkPanel } from "./ConnectionPanel";

// Dynamic import: react-force-graph-2d is a client-only library using Canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphCanvasProps {
  graphData: GraphData;
}

interface FGRef {
  centerAt: (x: number, y: number, ms: number) => void;
  zoom: (z: number, ms: number) => void;
  zoomToFit: (ms: number, padding: number) => void;
}

export function GraphCanvas({ graphData }: GraphCanvasProps) {
  const graphRef = useRef<FGRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [filters, setFilters] = useState<GraphFilters>(defaultFilters);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Apply filters to graph data
  const filteredData = useMemo(
    () => applyFilters(graphData, filters),
    [graphData, filters]
  );

  // Highlighted nodes from search
  const highlightedNodes = useMemo(
    () => findMatchingNodes(filteredData.nodes, filters.searchQuery),
    [filteredData.nodes, filters.searchQuery]
  );

  // Zoom to first highlighted node when search matches
  useEffect(() => {
    if (highlightedNodes.size > 0 && graphRef.current) {
      const firstId = Array.from(highlightedNodes)[0];
      const node = filteredData.nodes.find((n) => n.id === firstId);
      if (node && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 500);
        graphRef.current.zoom(3, 500);
      }
    }
  }, [highlightedNodes, filteredData.nodes]);

  // ---- Event handlers ----

  const handleNodeHover = useCallback(
    (node: GraphNode | null, _prev?: GraphNode | null) => {
      setHoveredNode(node);
      // We use a fixed offset from the node position for tooltip placement
      // since the mouse event is not always available through the library callback
      if (node && node.x !== undefined && node.y !== undefined) {
        // Use approximate screen position -- tooltip will follow mouse via CSS
        setTooltipPos({ x: (node.x ?? 0) + 200, y: (node.y ?? 0) + 200 });
      } else {
        setTooltipPos(null);
      }
      // Change cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = node ? "pointer" : "default";
      }
    },
    []
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedLink(null);
      setSelectedNode(node);
      // Center view on the clicked node
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 500);
      }
    },
    []
  );

  const handleLinkClick = useCallback((link: GraphLink) => {
    setSelectedNode(null);
    setSelectedLink(link);
  }, []);

  const handlePanelNodeClick = useCallback(
    (nodeId: string) => {
      const node = filteredData.nodes.find((n) => n.id === nodeId);
      if (node) {
        handleNodeClick(node);
      }
    },
    [filteredData.nodes, handleNodeClick]
  );

  const handleSetDepthFilter = useCallback(
    (nodeId: string) => {
      setFilters((prev) => ({
        ...prev,
        depthFilter: { nodeId, depth: 2 },
      }));
    },
    []
  );

  const handleResetView = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedNode(null);
    setSelectedLink(null);
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 40);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    setSelectedLink(null);
  }, []);

  // ---- Custom rendering ----

  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D) => {
      const size = getNodeSize(node.id, filteredData.links);
      const color =
        DOMAIN_COLORS[node.domain as Domain] || DOMAIN_COLORS.other;
      const isHighlighted =
        highlightedNodes.size > 0 && highlightedNodes.has(node.id);
      const isDimmed =
        highlightedNodes.size > 0 && !highlightedNodes.has(node.id);
      const isSelected = selectedNode?.id === node.id;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Glow effect for highlighted/selected nodes
      if (isHighlighted || isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(255, 255, 100, 0.3)";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = isDimmed
        ? color + "30"
        : color;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected
        ? "#ffffff"
        : isHighlighted
          ? "#fbbf24"
          : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isSelected || isHighlighted ? 2 : 0.5;
      ctx.stroke();

      // Label (always draw; dimmed if not highlighted)
      const label = node.title;
      const fontSize = Math.max(3, size * 0.7);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isDimmed
        ? "rgba(255,255,255,0.2)"
        : "rgba(255,255,255,0.85)";
      ctx.fillText(label, x, y + size + 2, 80);
    },
    [filteredData.links, highlightedNodes, selectedNode]
  );

  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D) => {
      const source = link.source as unknown as GraphNode;
      const target = link.target as unknown as GraphNode;
      if (
        source.x === undefined ||
        source.y === undefined ||
        target.x === undefined ||
        target.y === undefined
      )
        return;

      const width = getLinkWidth(link.strength);
      const isSelected = selectedLink?.id === link.id;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      // Dashed line for unaccepted AI suggestions
      if (!link.accepted) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = isSelected
        ? "rgba(255, 255, 255, 0.8)"
        : link.aiGenerated
          ? "rgba(139, 92, 246, 0.4)"
          : "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = isSelected ? width + 1 : width;
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [selectedLink]
  );

  // Determine effective width (subtract panel width if shown)
  const panelOpen = selectedNode !== null || selectedLink !== null;
  const graphWidth = panelOpen
    ? Math.max(dimensions.width - 320, 400)
    : dimensions.width;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* Graph controls */}
      <GraphControls
        filters={filters}
        onFiltersChange={setFilters}
        onResetView={handleResetView}
        nodeCount={filteredData.nodes.length}
        linkCount={filteredData.links.length}
      />

      {/* Tooltip */}
      <NodeTooltip node={hoveredNode} position={tooltipPos} />

      {/* Force graph */}
      <ForceGraph2D
        ref={graphRef as never}
        width={graphWidth}
        height={dimensions.height}
        graphData={filteredData}
        nodeId="id"
        nodeCanvasObject={paintNode as never}
        nodePointerAreaPaint={((
          node: GraphNode,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const size = getNodeSize(node.id, filteredData.links);
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }) as never}
        linkCanvasObject={paintLink as never}
        linkPointerAreaPaint={((
          link: GraphLink,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const source = link.source as unknown as GraphNode;
          const target = link.target as unknown as GraphNode;
          if (
            source.x === undefined ||
            source.y === undefined ||
            target.x === undefined ||
            target.y === undefined
          )
            return;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 8;
          ctx.stroke();
        }) as never}
        onNodeHover={handleNodeHover as never}
        onNodeClick={handleNodeClick as never}
        onLinkClick={handleLinkClick as never}
        backgroundColor="transparent"
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />

      {/* Side panels */}
      {selectedNode && (
        <NodePanel
          node={selectedNode}
          links={filteredData.links}
          allNodes={filteredData.nodes}
          onClose={handleClosePanel}
          onNodeClick={handlePanelNodeClick}
          onSetDepthFilter={handleSetDepthFilter}
        />
      )}
      {selectedLink && (
        <LinkPanel
          link={selectedLink}
          allNodes={filteredData.nodes}
          onClose={handleClosePanel}
          onNodeClick={handlePanelNodeClick}
        />
      )}
    </div>
  );
}
