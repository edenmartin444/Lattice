"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, X, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { DOMAIN_COLORS } from "@/types";

interface Suggestion {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  type: string;
  strength: number;
  reasoning?: string;
  from: { id: string; title: string; domain: string };
  to: { id: string; title: string; domain: string };
}

interface SuggestionFeedProps {
  suggestions: Suggestion[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function SuggestionFeed({ suggestions, onAccept, onReject }: SuggestionFeedProps) {
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  async function handleAction(id: string, action: "accept" | "reject") {
    setProcessing((prev) => new Set(prev).add(id));
    try {
      if (action === "accept") {
        await onAccept(id);
      } else {
        await onReject(id);
      }
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No pending suggestions. Click &quot;Discover&quot; to find new connections!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => {
        const fromColor = DOMAIN_COLORS[s.from.domain as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.other;
        const toColor = DOMAIN_COLORS[s.to.domain as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS.other;
        const isProcessing = processing.has(s.id);

        return (
          <Card key={s.id} className="p-4 space-y-3">
            {/* Concept pair */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fromColor }} />
                <span className="text-sm font-medium">{s.from.title}</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toColor }} />
                <span className="text-sm font-medium">{s.to.title}</span>
              </div>
            </div>

            {/* Label */}
            <p className="text-sm text-muted-foreground">{s.label}</p>

            {/* Reasoning */}
            {s.reasoning && (
              <p className="text-xs text-muted-foreground/70 italic">{s.reasoning}</p>
            )}

            {/* Metadata + actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {s.type.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.round(s.strength * 100)}%
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs text-red-500 hover:text-red-600"
                  onClick={() => handleAction(s.id, "reject")}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => handleAction(s.id, "accept")}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Accept
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
