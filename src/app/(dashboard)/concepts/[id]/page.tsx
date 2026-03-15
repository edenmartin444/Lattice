"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Link2,
  Calendar,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConceptEditor } from "@/components/concepts/ConceptEditor"
import { useConcept } from "@/hooks/useConcepts"
import { DOMAIN_COLORS, type Domain, type CreateConceptInput } from "@/types"

export default function ConceptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { concept, loading, error, refetch } = useConcept(id)

  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUpdate = async (data: CreateConceptInput) => {
    const res = await fetch(`/api/concepts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to update concept")
    }
    await refetch()
    toast.success("Concept updated successfully")
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/concepts/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete concept")
      }
      toast.success("Concept deleted")
      router.push("/concepts")
    } catch {
      toast.error("Failed to delete concept")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !concept) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-lg font-semibold">Concept not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || "This concept does not exist or has been deleted."}
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => router.push("/concepts")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Concepts
          </Button>
        </div>
      </div>
    )
  }

  const domainColor =
    DOMAIN_COLORS[concept.domain as Domain] || DOMAIN_COLORS.other
  const connectionCount =
    (concept._count?.connectionsFrom || 0) + (concept._count?.connectionsTo || 0)
  const createdDate = new Date(concept.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const updatedDate = new Date(concept.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => router.push("/concepts")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Concepts
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge
              className="text-xs font-medium capitalize"
              style={{
                backgroundColor: `${domainColor}20`,
                color: domainColor,
                borderColor: `${domainColor}40`,
              }}
            >
              {concept.domain}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {concept.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditorOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive-foreground hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {concept.description}
          </p>
        </CardContent>
      </Card>

      {/* Tags */}
      {concept.tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {concept.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      {concept.source && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
          <a
            href={concept.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {concept.source}
          </a>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>Created {createdDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>Updated {updatedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link2 className="h-4 w-4" />
          <span>{connectionCount} connection{connectionCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <Separator />

      {/* Connections section (placeholder for Phase 2) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            Connections
            <Badge variant="secondary" className="text-xs">
              {connectionCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No connections yet. AI suggestions coming in Phase 3!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connection details will be displayed here in Phase 2.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ConceptEditor
        concept={concept}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Concept</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{concept.title}&rdquo;? This action
              cannot be undone and will also remove all connections to this
              concept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
