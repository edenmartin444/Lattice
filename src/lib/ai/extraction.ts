import { getProvider, type ExtractedConcept } from "./providers";

const EXTRACTION_PROMPT = `Analyse le texte suivant et extrais les concepts clés qui méritent d'être dans un graphe de connaissances personnel.

Pour chaque concept, retourne :
- title: nom concis du concept
- description: explication en 2-3 phrases
- domain: le domaine principal parmi [science, philosophy, history, economics, psychology, technology, politics, art, mathematics, other]
- tags: 1-3 tags pertinents

Texte :
<text>
{text}
</text>

Retourne un tableau JSON. Ne retourne que des concepts substantiels, pas des détails mineurs.`;

export async function extractConceptsFromText(
  text: string,
  provider: string = "anthropic"
): Promise<ExtractedConcept[]> {
  // Truncate very long text to avoid token limits
  const truncated = text.length > 10000 ? text.slice(0, 10000) + "..." : text;

  const prompt = EXTRACTION_PROMPT.replace("{text}", truncated);
  const ai = getProvider(provider);
  return ai.extractConcepts(prompt);
}
