import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, notFound } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const importRecord = await prisma.import.findFirst({
    where: { id, userId: user.id },
    include: {
      concepts: {
        select: { id: true, title: true, domain: true },
      },
    },
  });

  if (!importRecord) return notFound("Import not found");

  return NextResponse.json(importRecord);
}
