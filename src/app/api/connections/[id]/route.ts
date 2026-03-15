import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  notFound,
  badRequest,
} from "@/lib/api-utils";
import { z } from "zod";
import { CONNECTION_TYPES } from "@/types";

// Validation schema for updating a connection
const updateConnectionSchema = z.object({
  label: z.string().min(1).max(500).optional(),
  strength: z.number().min(0).max(1).optional(),
  type: z.enum(CONNECTION_TYPES).optional(),
  accepted: z.boolean().optional(),
});

// GET /api/connections/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const connection = await prisma.connection.findFirst({
    where: { id, userId: user.id },
    include: {
      from: {
        select: { id: true, title: true, domain: true, description: true },
      },
      to: {
        select: { id: true, title: true, domain: true, description: true },
      },
    },
  });

  if (!connection) return notFound("Connection not found");

  return NextResponse.json(connection);
}

// PUT /api/connections/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.connection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Connection not found");

  try {
    const body = await req.json();
    const parsed = updateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const connection = await prisma.connection.update({
      where: { id },
      data: parsed.data,
      include: {
        from: {
          select: { id: true, title: true, domain: true, description: true },
        },
        to: {
          select: { id: true, title: true, domain: true, description: true },
        },
      },
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error("Update connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/connections/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.connection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return notFound("Connection not found");

  await prisma.connection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
