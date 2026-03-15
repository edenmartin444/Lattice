import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { suggestConnectionsForConcept } from "@/lib/ai/suggestions";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const { conceptId, provider } = await req.json();
    if (!conceptId) return badRequest("conceptId is required");

    const concept = await prisma.concept.findFirst({
      where: { id: conceptId, userId: user.id },
      select: { id: true, title: true, description: true, domain: true },
    });
    if (!concept) return badRequest("Concept not found");

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const aiProvider = provider || settings?.aiProvider || "anthropic";

    const suggestions = await suggestConnectionsForConcept(concept, user.id, aiProvider);

    // Save suggestions as unaccepted connections
    const saved = [];
    for (const s of suggestions) {
      // Verify both concepts exist and belong to user
      const from = await prisma.concept.findFirst({ where: { id: s.fromId, userId: user.id } });
      const to = await prisma.concept.findFirst({ where: { id: s.toId, userId: user.id } });
      if (!from || !to) continue;

      // Skip if connection already exists
      const exists = await prisma.connection.findFirst({
        where: { OR: [{ fromId: s.fromId, toId: s.toId }, { fromId: s.toId, toId: s.fromId }], userId: user.id },
      });
      if (exists) continue;

      const conn = await prisma.connection.create({
        data: {
          fromId: s.fromId,
          toId: s.toId,
          label: s.label,
          type: s.type,
          strength: Math.min(1, Math.max(0, s.strength)),
          aiGenerated: true,
          accepted: false,
          userId: user.id,
        },
        include: {
          from: { select: { id: true, title: true, domain: true } },
          to: { select: { id: true, title: true, domain: true } },
        },
      });
      saved.push({ ...conn, reasoning: s.reasoning });
    }

    return NextResponse.json({ suggestions: saved });
  } catch (error) {
    console.error("AI suggest error:", error);
    const message = error instanceof Error ? error.message : "AI suggestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
