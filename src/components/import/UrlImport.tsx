"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";

interface UrlImportProps {
  onImport: (result: { id: string; text: string; url: string }) => void;
  onError: (error: string) => void;
}

export function UrlImport({ onImport, onError }: UrlImportProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      onImport({ id: data.id, text: data.text, url: data.url });
      setUrl("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "URL import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-9"
          type="url"
        />
      </div>
      <Button type="submit" disabled={loading || !url.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
      </Button>
    </form>
  );
}
