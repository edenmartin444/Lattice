import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { extractConceptsFromText } from "@/lib/ai/extraction";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const { text, provider } = await req.json();
    if (!text) return badRequest("text is required");

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const aiProvider = provider || settings?.aiProvider || "anthropic";

    const concepts = await extractConceptsFromText(text, aiProvider);

    return NextResponse.json({ concepts });
  } catch (error) {
    console.error("Extract error:", error);
    const message = error instanceof Error ? error.message : "Concept extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
