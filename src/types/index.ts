// Domain types matching DOMAIN_COLORS from spec
export const DOMAINS = [
  "science",
  "philosophy",
  "history",
  "economics",
  "psychology",
  "technology",
  "politics",
  "art",
  "mathematics",
  "other",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_COLORS: Record<Domain, string> = {
  science: "#3B82F6",
  philosophy: "#8B5CF6",
  history: "#F59E0B",
  economics: "#10B981",
  psychology: "#EC4899",
  technology: "#06B6D4",
  politics: "#EF4444",
  art: "#F97316",
  mathematics: "#6366F1",
  other: "#6B7280",
};

export const CONNECTION_TYPES = [
  "related",
  "causes",
  "contradicts",
  "extends",
  "example_of",
  "analogous_to",
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

// Zod schemas for API validation
import { z } from "zod";

export const createConceptSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  domain: z.enum(DOMAINS),
  tags: z.array(z.string()).default([]),
  source: z.string().url().optional().or(z.literal("")),
});

export const updateConceptSchema = createConceptSchema.partial();

export type CreateConceptInput = z.infer<typeof createConceptSchema>;
export type UpdateConceptInput = z.infer<typeof updateConceptSchema>;
