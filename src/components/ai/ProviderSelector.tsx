"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProviderSelectorProps {
  value: string;
  onChange: (provider: string) => void;
}

const providers = [
  { id: "anthropic", label: "Claude", color: "#D97706" },
  { id: "openai", label: "GPT-4o", color: "#10B981" },
];

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">AI Provider:</span>
      {providers.map((p) => (
        <Button
          key={p.id}
          variant={value === p.id ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => onChange(p.id)}
        >
          <Badge
            className="h-2 w-2 rounded-full p-0"
            style={{ backgroundColor: p.color }}
          />
          {p.label}
        </Button>
      ))}
    </div>
  );
}
