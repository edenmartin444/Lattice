"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConceptCard, ConceptCardSkeleton } from "@/components/concepts/ConceptCard"
import { ConceptEditor } from "@/components/concepts/ConceptEditor"
import { useConcepts } from "@/hooks/useConcepts"
import { DOMAINS, type CreateConceptInput } from "@/types"

export default function ConceptsPage() {
  const [search, setSearch] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")
  const [editorOpen, setEditorOpen] = useState(false)

  const { concepts, loading, error, totalCount, createConcept } = useConcepts({
    search: search || undefined,
    domain: domainFilter !== "all" ? domainFilter : undefined,
  })

  // Client-side filtering as a complement (API also filters, but this gives instant UX)
  const filteredConcepts = useMemo(() => {
    let result = concepts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [concepts, search])

  const handleCreate = async (data: CreateConceptInput) => {
    await createConcept(data)
    toast.success("Concept created successfully")
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concepts</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${totalCount} concept${totalCount !== 1 ? "s" : ""} in your knowledge graph`}
          </p>
        </div>
        <Button onClick={() => setEditorOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Concept
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {DOMAINS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConceptCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredConcepts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No concepts yet</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground max-w-sm">
            {search || domainFilter !== "all"
              ? "No concepts match your current filters. Try adjusting your search or domain filter."
              : "Start building your knowledge graph by capturing your first concept."}
          </p>
          {!search && domainFilter === "all" && (
            <Button className="mt-4 gap-2" onClick={() => setEditorOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first concept
            </Button>
          )}
        </div>
      )}

      {/* Concepts grid */}
      {!loading && filteredConcepts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredConcepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      )}

      {/* Concept Editor Dialog */}
      <ConceptEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleCreate}
      />
    </div>
  )
}
