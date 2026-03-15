"use client";

import { useState, useEffect, useCallback } from "react";
import { SuggestionFeed } from "@/components/ai/SuggestionFeed";
import { ProviderSelector } from "@/components/ai/ProviderSelector";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  type: string;
  strength: number;
  reasoning?: string;
  accepted: boolean;
  from: { id: string; title: string; domain: string };
  to: { id: string; title: string; domain: string };
}

export default function ExplorePage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [provider, setProvider] = useState("anthropic");
  const [discovering, setDiscovering] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load pending suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/connections?accepted=false");
      const data = await res.json();
      setSuggestions(
        (data.connections || []).filter(
          (c: Suggestion) => c.accepted === false
        )
      );
    } catch {
      console.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function handleDiscover() {
    setDiscovering(true);
    try {
      const res = await fetch("/api/ai/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");

      if (data.suggestions?.length > 0) {
        toast.success(`Found ${data.suggestions.length} new connections!`);
        await loadSuggestions();
      } else {
        toast.info("No new connections found. Try adding more concepts!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Connection accepted!");
    } catch {
      toast.error("Failed to accept connection");
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reject");
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Connection rejected");
    } catch {
      toast.error("Failed to reject connection");
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Explore
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover hidden connections between your concepts using AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProviderSelector value={provider} onChange={setProvider} />
          <Button
            onClick={handleDiscover}
            disabled={discovering}
            className="gap-2"
          >
            {discovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Discover
          </Button>
        </div>
      </div>

      {/* Suggestions feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SuggestionFeed
          suggestions={suggestions}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
