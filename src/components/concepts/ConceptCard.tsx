"use client"

import Link from "next/link"
import { Link2, Calendar } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DOMAIN_COLORS, type Domain } from "@/types"
import type { Concept } from "@/hooks/useConcepts"

interface ConceptCardProps {
  concept: Concept
}

export function ConceptCard({ concept }: ConceptCardProps) {
  const domainColor = DOMAIN_COLORS[concept.domain as Domain] || DOMAIN_COLORS.other
  const connectionCount =
    (concept._count?.connectionsFrom || 0) + (concept._count?.connectionsTo || 0)

  const createdDate = new Date(concept.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={`/concepts/${concept.id}`}>
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
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
          <h3 className="mt-2 text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {concept.title}
          </h3>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {concept.description}
          </p>
          {concept.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {concept.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0 font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {concept.tags.length > 4 && (
                <Badge
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0 font-normal"
                >
                  +{concept.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              <span>{connectionCount}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

export function ConceptCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="h-5 w-20 animate-pulse rounded-md bg-primary/10" />
        <div className="mt-2 h-5 w-3/4 animate-pulse rounded-md bg-primary/10" />
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-primary/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-primary/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-primary/10" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-8 animate-pulse rounded bg-primary/10" />
        </div>
      </CardFooter>
    </Card>
  )
}
