"use client";

import { X, ExternalLink, Link2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DOMAIN_COLORS, type Domain } from "@/types";
import type { GraphNode, GraphLink } from "@/lib/graph/layout";

// ---- Node detail panel (shown when a node is clicked) ----

interface NodePanelProps {
  node: GraphNode;
  links: GraphLink[];
  allNodes: GraphNode[];
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
  onSetDepthFilter: (nodeId: string) => void;
}

export function NodePanel({
  node,
  links,
  allNodes,
  onClose,
  onNodeClick,
  onSetDepthFilter,
}: NodePanelProps) {
  const color = DOMAIN_COLORS[node.domain as Domain] || DOMAIN_COLORS.other;

  // Find connections involving this node
  const connections = links.filter((l) => {
    const srcId =
      typeof l.source === "string"
        ? l.source
        : (l.source as unknown as GraphNode).id;
    const tgtId =
      typeof l.target === "string"
        ? l.target
        : (l.target as unknown as GraphNode).id;
    return srcId === node.id || tgtId === node.id;
  });

  const getOtherNode = (link: GraphLink): GraphNode | undefined => {
    const srcId =
      typeof link.source === "string"
        ? link.source
        : (link.source as unknown as GraphNode).id;
    const tgtId =
      typeof link.target === "string"
        ? link.target
        : (link.target as unknown as GraphNode).id;
    const otherId = srcId === node.id ? tgtId : srcId;
    return allNodes.find((n) => n.id === otherId);
  };

  return (
    <div className="absolute top-0 right-0 z-40 h-full w-80 border-l bg-card shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-base font-semibold truncate">{node.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Badge
          className="mt-2 capitalize text-[10px]"
          style={{
            backgroundColor: color + "20",
            color: color,
            borderColor: color + "40",
          }}
          variant="outline"
        >
          {node.domain}
        </Badge>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-1">
            Description
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1.5">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {node.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => onSetDepthFilter(node.id)}
          >
            <ExternalLink className="h-3 w-3" />
            Focus neighborhood
          </Button>
        </div>

        <Separator />

        {/* Connections list */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Connections ({connections.length})
          </h3>
          {connections.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No connections yet
            </p>
          ) : (
            <div className="space-y-2">
              {connections.map((link) => {
                const other = getOtherNode(link);
                if (!other) return null;
                const otherColor =
                  DOMAIN_COLORS[other.domain as Domain] || DOMAIN_COLORS.other;
                return (
                  <button
                    key={link.id}
                    className="w-full text-left rounded-lg border p-2.5 hover:bg-accent/50 transition-colors"
                    onClick={() => onNodeClick(other.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: otherColor }}
                      />
                      <span className="text-sm font-medium truncate">
                        {other.title}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {link.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 capitalize"
                      >
                        {link.type}
                      </Badge>
                      {link.aiGenerated && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 text-violet-400 border-violet-400/30"
                        >
                          AI
                        </Badge>
                      )}
                      {!link.accepted && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 text-amber-400 border-amber-400/30"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Link detail panel (shown when a link is clicked) ----

interface LinkPanelProps {
  link: GraphLink;
  allNodes: GraphNode[];
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export function LinkPanel({
  link,
  allNodes,
  onClose,
  onNodeClick,
}: LinkPanelProps) {
  const srcId =
    typeof link.source === "string"
      ? link.source
      : (link.source as unknown as GraphNode).id;
  const tgtId =
    typeof link.target === "string"
      ? link.target
      : (link.target as unknown as GraphNode).id;

  const fromNode = allNodes.find((n) => n.id === srcId);
  const toNode = allNodes.find((n) => n.id === tgtId);

  const fromColor = fromNode
    ? DOMAIN_COLORS[fromNode.domain as Domain] || DOMAIN_COLORS.other
    : DOMAIN_COLORS.other;
  const toColor = toNode
    ? DOMAIN_COLORS[toNode.domain as Domain] || DOMAIN_COLORS.other
    : DOMAIN_COLORS.other;

  return (
    <div className="absolute top-0 right-0 z-40 h-full w-80 border-l bg-card shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold">Connection</h2>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* From -> To */}
        <div className="flex items-center gap-2">
          {fromNode && (
            <button
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors"
              onClick={() => onNodeClick(fromNode.id)}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: fromColor }}
              />
              <span className="text-sm font-medium">{fromNode.title}</span>
            </button>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          {toNode && (
            <button
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 hover:bg-accent/50 transition-colors"
              onClick={() => onNodeClick(toNode.id)}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: toColor }}
              />
              <span className="text-sm font-medium">{toNode.title}</span>
            </button>
          )}
        </div>

        <Separator />

        {/* Label */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-1">
            Description
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            {link.label}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {link.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Strength: {Math.round(link.strength * 100)}%
          </Badge>
          {link.aiGenerated && (
            <Badge
              variant="outline"
              className="text-xs text-violet-400 border-violet-400/30"
            >
              AI Generated
            </Badge>
          )}
          {!link.accepted && (
            <Badge
              variant="outline"
              className="text-xs text-amber-400 border-amber-400/30"
            >
              Pending
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
