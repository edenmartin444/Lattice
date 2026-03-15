"use client"

import { useState, useCallback } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DOMAINS, createConceptSchema, type CreateConceptInput } from "@/types"
import type { Concept } from "@/hooks/useConcepts"

interface ConceptEditorProps {
  concept?: Concept | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateConceptInput) => Promise<void>
}

export function ConceptEditor({
  concept,
  open,
  onOpenChange,
  onSave,
}: ConceptEditorProps) {
  const isEditing = !!concept

  const [title, setTitle] = useState(concept?.title || "")
  const [description, setDescription] = useState(concept?.description || "")
  const [domain, setDomain] = useState(concept?.domain || "other")
  const [tags, setTags] = useState<string[]>(concept?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [source, setSource] = useState(concept?.source || "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Reset form when concept changes or dialog opens
  const resetForm = useCallback(() => {
    setTitle(concept?.title || "")
    setDescription(concept?.description || "")
    setDomain(concept?.domain || "other")
    setTags(concept?.tags || [])
    setTagInput("")
    setSource(concept?.source || "")
    setErrors({})
    setSaving(false)
  }, [concept])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const data: CreateConceptInput = {
      title: title.trim(),
      description: description.trim(),
      domain: domain as CreateConceptInput["domain"],
      tags,
      source: source.trim() || undefined,
    }

    const result = createConceptSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      const flat = result.error.flatten()
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        if (msgs && msgs.length > 0) {
          fieldErrors[key] = msgs[0]
        }
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      await onSave(result.data)
      onOpenChange(false)
    } catch (err) {
      setErrors({
        _form: err instanceof Error ? err.message : "Failed to save concept",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Concept" : "New Concept"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this concept."
              : "Capture a new concept for your knowledge graph."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Second Law of Thermodynamics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive-foreground">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Explain this concept in your own words..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            {errors.description && (
              <p className="text-xs text-destructive-foreground">
                {errors.description}
              </p>
            )}
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.domain && (
              <p className="text-xs text-destructive-foreground">{errors.domain}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-background/50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (optional)</Label>
            <Input
              id="source"
              type="url"
              placeholder="https://..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            {errors.source && (
              <p className="text-xs text-destructive-foreground">{errors.source}</p>
            )}
          </div>

          {/* Form error */}
          {errors._form && (
            <p className="text-sm text-destructive-foreground">{errors._form}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
