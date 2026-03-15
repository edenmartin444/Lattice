import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { discoverConnections } from "@/lib/ai/suggestions";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const provider = body.provider;

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const aiProvider = provider || settings?.aiProvider || "anthropic";

    const suggestions = await discoverConnections(user.id, aiProvider);

    // Save as unaccepted connections
    const saved = [];
    for (const s of suggestions) {
      const from = await prisma.concept.findFirst({ where: { id: s.fromId, userId: user.id } });
      const to = await prisma.concept.findFirst({ where: { id: s.toId, userId: user.id } });
      if (!from || !to) continue;

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
    console.error("AI discover error:", error);
    const message = error instanceof Error ? error.message : "AI discovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
