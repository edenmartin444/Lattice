import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import { updateConceptSchema } from "@/types";

// GET /api/concepts/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const concept = await prisma.concept.findFirst({
    where: { id, userId: user.id },
    include: {
      connectionsFrom: {
        include: { to: { select: { id: true, title: true, domain: true } } },
      },
      connectionsTo: {
        include: { from: { select: { id: true, title: true, domain: true } } },
      },
    },
  });

  if (!concept) return notFound("Concept not found");

  return NextResponse.json(concept);
}

// PUT /api/concepts/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.concept.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Concept not found");

  try {
    const body = await req.json();
    const parsed = updateConceptSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const concept = await prisma.concept.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(concept);
  } catch (error) {
    console.error("Update concept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/concepts/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.concept.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Concept not found");

  await prisma.concept.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
