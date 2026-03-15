"use client";

import type { GraphNode } from "@/lib/graph/layout";
import { DOMAIN_COLORS, type Domain } from "@/types";

interface NodeTooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
}

export function NodeTooltip({ node, position }: NodeTooltipProps) {
  if (!node || !position) return null;

  const color = DOMAIN_COLORS[node.domain as Domain] || DOMAIN_COLORS.other;
  const truncatedDesc =
    node.description.length > 120
      ? node.description.slice(0, 120) + "..."
      : node.description;

  return (
    <div
      className="pointer-events-none absolute z-50 max-w-xs rounded-lg border bg-popover p-3 shadow-lg"
      style={{
        left: position.x + 12,
        top: position.y - 10,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-sm text-popover-foreground truncate">
          {node.title}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {truncatedDesc}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
          style={{
            backgroundColor: color + "20",
            color: color,
          }}
        >
          {node.domain}
        </span>
        {node.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
