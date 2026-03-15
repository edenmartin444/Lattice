import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { updateConceptEmbedding } from "@/lib/ai/embeddings";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const { conceptId } = await req.json();
    if (!conceptId) return badRequest("conceptId is required");

    const concept = await prisma.concept.findFirst({
      where: { id: conceptId, userId: user.id },
      select: { id: true, title: true, description: true, domain: true },
    });
    if (!concept) return badRequest("Concept not found");

    await updateConceptEmbedding(concept.id, concept.title, concept.description, concept.domain);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Embed error:", error);
    const message = error instanceof Error ? error.message : "Embedding generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
