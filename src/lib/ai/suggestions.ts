import { getProvider, type SuggestedConnection } from "./providers";
import { findSemanticNeighbors } from "./embeddings";
import { prisma } from "@/lib/db";

interface ConceptSummary {
  id: string;
  title: string;
  description: string;
  domain: string;
}

const SUGGESTION_PROMPT = `Tu es un expert en pensée interdisciplinaire.

Voici un nouveau concept ajouté par l'utilisateur :
<new_concept>
Titre : {title}
Description : {description}
Domaine : {domain}
</new_concept>

Voici des concepts existants qui pourraient être liés :
<existing_concepts>
{concepts}
</existing_concepts>

Pour chaque connexion pertinente que tu identifies, retourne un objet JSON avec :
- fromId: l'ID du concept existant
- toId: l'ID du nouveau concept
- label: une explication concise du lien (1-2 phrases)
- type: "causes" | "contradicts" | "extends" | "example_of" | "analogous_to" | "related"
- strength: un score de 0 à 1 reflétant la force du lien
- reasoning: pourquoi cette connexion est intellectuellement intéressante

Privilégie les connexions TRANSVERSALES entre domaines différents.
Ne retourne que les connexions non triviales et intellectuellement stimulantes.

Retourne un tableau JSON, rien d'autre.`;

const DISCOVER_PROMPT = `Tu es un expert en pensée interdisciplinaire et en connexion de concepts.

Voici des concepts issus du graphe de connaissances d'un utilisateur :
<concepts>
{concepts}
</concepts>

Trouve des connexions NON ÉVIDENTES et intellectuellement stimulantes entre ces concepts, surtout entre domaines différents.

Pour chaque connexion, retourne un objet JSON avec :
- fromId: l'ID du premier concept
- toId: l'ID du second concept
- label: une explication concise du lien (1-2 phrases)
- type: "causes" | "contradicts" | "extends" | "example_of" | "analogous_to" | "related"
- strength: un score de 0 à 1 reflétant la force du lien
- reasoning: pourquoi cette connexion est intellectuellement intéressante

Retourne un tableau JSON, rien d'autre.`;

function formatConcepts(concepts: ConceptSummary[]): string {
  return concepts
    .map((c) => `- [${c.id}] ${c.title} (${c.domain}): ${c.description}`)
    .join("\n");
}

export async function suggestConnectionsForConcept(
  concept: ConceptSummary,
  userId: string,
  provider: string = "anthropic"
): Promise<SuggestedConnection[]> {
  // Find semantic neighbors
  const neighbors = await findSemanticNeighbors(concept.id, userId, 10);

  if (neighbors.length === 0) {
    // Fallback: get recent concepts from different domains
    const fallback = await prisma.concept.findMany({
      where: {
        userId,
        id: { not: concept.id },
        domain: { not: concept.domain },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, domain: true },
    });
    if (fallback.length === 0) return [];

    const prompt = SUGGESTION_PROMPT
      .replace("{title}", concept.title)
      .replace("{description}", concept.description)
      .replace("{domain}", concept.domain)
      .replace("{concepts}", formatConcepts(fallback));

    const ai = getProvider(provider);
    return ai.generateSuggestions(prompt);
  }

  const prompt = SUGGESTION_PROMPT
    .replace("{title}", concept.title)
    .replace("{description}", concept.description)
    .replace("{domain}", concept.domain)
    .replace("{concepts}", formatConcepts(neighbors));

  const ai = getProvider(provider);
  return ai.generateSuggestions(prompt);
}

export async function discoverConnections(
  userId: string,
  provider: string = "anthropic",
  count: number = 8
): Promise<SuggestedConnection[]> {
  // Pick random concepts from different domains
  const concepts = await prisma.$queryRawUnsafe<ConceptSummary[]>(
    `SELECT id, title, description, domain
     FROM "Concept"
     WHERE "userId" = $1
     ORDER BY RANDOM()
     LIMIT $2`,
    userId,
    count
  );

  if (concepts.length < 2) return [];

  const prompt = DISCOVER_PROMPT.replace(
    "{concepts}",
    formatConcepts(concepts)
  );

  const ai = getProvider(provider);
  return ai.generateSuggestions(prompt);
}
