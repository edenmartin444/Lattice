"use client"

import { useState, useEffect, useCallback } from "react"
import type { CreateConceptInput, UpdateConceptInput } from "@/types"

export interface Concept {
  id: string
  title: string
  description: string
  domain: string
  tags: string[]
  source: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    connectionsFrom: number
    connectionsTo: number
  }
}

interface UseConceptsOptions {
  search?: string
  domain?: string
}

interface UseConceptsReturn {
  concepts: Concept[]
  loading: boolean
  error: string | null
  totalCount: number
  refetch: () => Promise<void>
  createConcept: (data: CreateConceptInput) => Promise<Concept>
  updateConcept: (id: string, data: UpdateConceptInput) => Promise<Concept>
  deleteConcept: (id: string) => Promise<void>
}

export function useConcepts(options: UseConceptsOptions = {}): UseConceptsReturn {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchConcepts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.search) params.set("search", options.search)
      if (options.domain && options.domain !== "all") params.set("domain", options.domain)
      params.set("limit", "100")

      const res = await fetch(`/api/concepts?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to fetch concepts")
      }
      const data = await res.json()
      setConcepts(data.concepts || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [options.search, options.domain])

  useEffect(() => {
    fetchConcepts()
  }, [fetchConcepts])

  const createConcept = async (data: CreateConceptInput): Promise<Concept> => {
    const res = await fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to create concept")
    }
    const concept = await res.json()
    await fetchConcepts()
    return concept
  }

  const updateConcept = async (
    id: string,
    data: UpdateConceptInput
  ): Promise<Concept> => {
    const res = await fetch(`/api/concepts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to update concept")
    }
    const concept = await res.json()
    await fetchConcepts()
    return concept
  }

  const deleteConcept = async (id: string): Promise<void> => {
    const res = await fetch(`/api/concepts/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Failed to delete concept")
    }
    await fetchConcepts()
  }

  return {
    concepts,
    loading,
    error,
    totalCount,
    refetch: fetchConcepts,
    createConcept,
    updateConcept,
    deleteConcept,
  }
}

// Hook to fetch a single concept by ID
export function useConcept(id: string) {
  const [concept, setConcept] = useState<Concept | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConcept = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/concepts/${id}`)
      if (!res.ok) {
        throw new Error("Failed to fetch concept")
      }
      const data = await res.json()
      setConcept(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchConcept()
  }, [id, fetchConcept])

  return { concept, loading, error, refetch: fetchConcept }
}
