"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/import/FileUpload";
import { UrlImport } from "@/components/import/UrlImport";
import { ImportStatusList } from "@/components/import/ImportStatus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportRecord {
  id: string;
  source: string;
  filename?: string | null;
  url?: string | null;
  status: string;
  createdAt: string;
}

export default function ImportPage() {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [extracting, setExtracting] = useState(false);

  // Load recent imports (simple approach: just track in-session)
  useEffect(() => {
    // We could fetch from an API, but for now we track locally
  }, []);

  function handleUploadResult(result: { id: string; text: string; filename: string }) {
    setExtractedText(result.text);
    setImportId(result.id);
    setImports((prev) => [
      { id: result.id, source: "file", filename: result.filename, status: "done", createdAt: new Date().toISOString() },
      ...prev,
    ]);
    toast.success(`File "${result.filename}" imported successfully`);
  }

  function handleUrlResult(result: { id: string; text: string; url: string }) {
    setExtractedText(result.text);
    setImportId(result.id);
    setImports((prev) => [
      { id: result.id, source: "url", url: result.url, status: "done", createdAt: new Date().toISOString() },
      ...prev,
    ]);
    toast.success("URL imported successfully");
  }

  function handleError(error: string) {
    toast.error(error);
  }

  async function handleExtractConcepts() {
    if (!extractedText) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      if (data.concepts?.length > 0) {
        // Create concepts from extracted data
        let created = 0;
        for (const concept of data.concepts) {
          const createRes = await fetch("/api/concepts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: concept.title,
              description: concept.description,
              domain: concept.domain,
              tags: concept.tags || [],
            }),
          });
          if (createRes.ok) created++;
        }

        toast.success(`Created ${created} concepts from imported text!`);
        setExtractedText(null);
        setImportId(null);
      } else {
        toast.info("No concepts could be extracted from this text.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Import
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import notes, articles, or bookmarks to extract concepts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: import sources */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-medium">Upload a file</h2>
            <FileUpload onUpload={handleUploadResult} onError={handleError} />
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-medium">Import from URL</h2>
            <UrlImport onImport={handleUrlResult} onError={handleError} />
          </Card>

          <ImportStatusList imports={imports} />
        </div>

        {/* Right column: extracted text preview */}
        <div>
          {extractedText ? (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Extracted text preview</h2>
                <Button
                  onClick={handleExtractConcepts}
                  disabled={extracting}
                  size="sm"
                  className="gap-2"
                >
                  {extracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Extract Concepts
                </Button>
              </div>
              <Separator />
              <div className="max-h-[500px] overflow-y-auto rounded-md bg-muted p-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {extractedText.length > 3000
                    ? extractedText.slice(0, 3000) + "..."
                    : extractedText}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {extractedText.length} characters extracted
                {importId && ` (Import ID: ${importId})`}
              </p>
            </Card>
          ) : (
            <Card className="flex h-64 items-center justify-center p-6">
              <p className="text-sm text-muted-foreground text-center">
                Upload a file or import a URL to see extracted text here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
