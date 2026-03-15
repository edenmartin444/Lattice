"use client";

import { useState } from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DOMAINS, DOMAIN_COLORS, type Domain } from "@/types";
import type { GraphFilters } from "@/lib/graph/filters";

interface GraphControlsProps {
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  onResetView: () => void;
  nodeCount: number;
  linkCount: number;
}

export function GraphControls({
  filters,
  onFiltersChange,
  onResetView,
  nodeCount,
  linkCount,
}: GraphControlsProps) {
  const [showDomainFilters, setShowDomainFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const toggleDomain = (domain: Domain) => {
    const next = new Set(filters.enabledDomains);
    if (next.has(domain)) {
      next.delete(domain);
    } else {
      next.add(domain);
    }
    onFiltersChange({ ...filters, enabledDomains: next });
  };

  const clearDomainFilters = () => {
    onFiltersChange({ ...filters, enabledDomains: new Set() });
  };

  const handleDepthChange = (depth: number) => {
    if (filters.depthFilter) {
      onFiltersChange({
        ...filters,
        depthFilter: { ...filters.depthFilter, depth },
      });
    }
  };

  const clearDepthFilter = () => {
    onFiltersChange({ ...filters, depthFilter: null });
  };

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 max-w-xs">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-card/95 backdrop-blur-sm border-border/50 shadow-md"
        />
      </div>

      {/* Filter toggle + stats */}
      <div className="flex items-center gap-2">
        <Button
          variant={showDomainFilters ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5 bg-card/95 backdrop-blur-sm shadow-md"
          onClick={() => setShowDomainFilters(!showDomainFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          Domains
          {filters.enabledDomains.size > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {filters.enabledDomains.size}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-card/95 backdrop-blur-sm shadow-md"
          onClick={onResetView}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <span className="text-xs text-muted-foreground bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-md">
          {nodeCount} nodes, {linkCount} links
        </span>
      </div>

      {/* Domain filter chips */}
      {showDomainFilters && (
        <div className="rounded-lg border bg-card/95 backdrop-blur-sm p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              Filter by domain
            </span>
            {filters.enabledDomains.size > 0 && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={clearDomainFilters}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map((domain) => {
              const isActive =
                filters.enabledDomains.size === 0 ||
                filters.enabledDomains.has(domain);
              const color = DOMAIN_COLORS[domain];
              return (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-all"
                  style={{
                    backgroundColor: isActive ? color + "25" : "transparent",
                    color: isActive ? color : "var(--muted-foreground)",
                    border: `1px solid ${isActive ? color + "50" : "var(--border)"}`,
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {domain}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Depth filter controls (shown when a depth filter is active) */}
      {filters.depthFilter && (
        <div className="rounded-lg border bg-card/95 backdrop-blur-sm p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              Depth around selected
            </span>
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={clearDepthFilter}
            >
              Show all
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => handleDepthChange(d)}
                className="h-7 w-7 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filters.depthFilter?.depth === d
                      ? "var(--primary)"
                      : "var(--muted)",
                  color:
                    filters.depthFilter?.depth === d
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
