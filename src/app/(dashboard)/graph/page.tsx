"use client";

import { useEffect, useState, useMemo } from "react";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import {
  buildGraphData,
  type RawConcept,
  type RawConnection,
} from "@/lib/graph/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GraphPage() {
  const [concepts, setConcepts] = useState<RawConcept[]>([]);
  const [connections, setConnections] = useState<RawConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [conceptsRes, connectionsRes] = await Promise.all([
          fetch("/api/concepts?limit=500"),
          fetch("/api/connections"),
        ]);

        if (!conceptsRes.ok) throw new Error("Failed to fetch concepts");
        if (!connectionsRes.ok) throw new Error("Failed to fetch connections");

        const conceptsData = await conceptsRes.json();
        const connectionsData = await connectionsRes.json();

        setConcepts(conceptsData.concepts || []);
        setConnections(connectionsData.connections || []);
      } catch (err) {
        console.error("Failed to load graph data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const graphData = useMemo(
    () => buildGraphData(concepts, connections),
    [concepts, connections]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <p className="text-sm text-muted-foreground">
            Loading your knowledge graph...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Network className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No concepts yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Your knowledge graph will appear here once you create some concepts.
            Go to the Concepts page to add your first one.
          </p>
          <Link href="/concepts">
            <Button variant="outline" size="sm">
              Go to Concepts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] w-full overflow-hidden rounded-lg border bg-background">
      <GraphCanvas graphData={graphData} />
    </div>
  );
}
