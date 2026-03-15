"use client";

import { Badge } from "@/components/ui/badge";
import { File, Globe, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ImportRecord {
  id: string;
  source: string;
  filename?: string | null;
  url?: string | null;
  status: string;
  createdAt: string;
}

interface ImportStatusProps {
  imports: ImportRecord[];
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-500", label: "Processing" },
  done: { icon: CheckCircle, color: "text-green-500", label: "Done" },
  error: { icon: XCircle, color: "text-red-500", label: "Error" },
};

export function ImportStatusList({ imports }: ImportStatusProps) {
  if (imports.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Recent imports</h3>
      <div className="space-y-2">
        {imports.map((imp) => {
          const config = statusConfig[imp.status] || statusConfig.pending;
          const Icon = config.icon;
          const isUrl = imp.source === "url";

          return (
            <div
              key={imp.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {isUrl ? (
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {imp.filename || imp.url || "Unknown source"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(imp.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className={`text-xs gap-1 ${config.color}`}>
                <Icon className={`h-3 w-3 ${imp.status === "processing" ? "animate-spin" : ""}`} />
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
