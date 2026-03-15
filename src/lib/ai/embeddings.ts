import OpenAI from "openai";
import { prisma } from "@/lib/db";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured for embeddings");

  const client = new OpenAI({ apiKey: key });
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

export async function updateConceptEmbedding(
  conceptId: string,
  title: string,
  description: string,
  domain: string
): Promise<void> {
  const text = `${title}. ${description}. Domain: ${domain}`;
  const embedding = await generateEmbedding(text);
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$queryRawUnsafe(
    `UPDATE "Concept" SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    conceptId
  );
}

export interface SemanticNeighbor {
  id: string;
  title: string;
  description: string;
  domain: string;
  tags: string[];
  distance: number;
}

export async function findSemanticNeighbors(
  conceptId: string,
  userId: string,
  limit: number = 10
): Promise<SemanticNeighbor[]> {
  const results = await prisma.$queryRawUnsafe<SemanticNeighbor[]>(
    `SELECT c.id, c.title, c.description, c.domain, c.tags,
            c.embedding <=> (SELECT embedding FROM "Concept" WHERE id = $1) as distance
     FROM "Concept" c
     WHERE c."userId" = $2
       AND c.id != $1
       AND c.embedding IS NOT NULL
     ORDER BY distance ASC
     LIMIT $3`,
    conceptId,
    userId,
    limit
  );
  return results;
}
