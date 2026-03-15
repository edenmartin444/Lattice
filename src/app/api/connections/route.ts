import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  badRequest,
} from "@/lib/api-utils";
import { z } from "zod";
import { CONNECTION_TYPES } from "@/types";

// Validation schema for creating a connection
const createConnectionSchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
  label: z.string().min(1).max(500),
  strength: z.number().min(0).max(1).default(0.5),
  type: z.enum(CONNECTION_TYPES).default("related"),
  aiGenerated: z.boolean().default(false),
  accepted: z.boolean().default(true),
});

// GET /api/connections -- List connections with optional filters
export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const conceptId = searchParams.get("conceptId");
  const type = searchParams.get("type");
  const accepted = searchParams.get("accepted");

  const where: Record<string, unknown> = { userId: user.id };

  // Filter by concept (either side of the connection)
  if (conceptId) {
    where.OR = [{ fromId: conceptId }, { toId: conceptId }];
  }

  if (type) {
    where.type = type;
  }

  if (accepted !== null && accepted !== undefined) {
    where.accepted = accepted === "true";
  }

  const connections = await prisma.connection.findMany({
    where,
    include: {
      from: {
        select: { id: true, title: true, domain: true, description: true },
      },
      to: {
        select: { id: true, title: true, domain: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ connections });
}

// POST /api/connections -- Create a new connection
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const { fromId, toId, label, strength, type, aiGenerated, accepted } =
      parsed.data;

    // Prevent self-connections
    if (fromId === toId) {
      return badRequest("Cannot connect a concept to itself");
    }

    // Verify both concepts belong to the user
    const [fromConcept, toConcept] = await Promise.all([
      prisma.concept.findFirst({ where: { id: fromId, userId: user.id } }),
      prisma.concept.findFirst({ where: { id: toId, userId: user.id } }),
    ]);

    if (!fromConcept) {
      return badRequest("Source concept not found or not owned by user");
    }
    if (!toConcept) {
      return badRequest("Target concept not found or not owned by user");
    }

    // Check for duplicate connection (either direction)
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromId, toId },
          { fromId: toId, toId: fromId },
        ],
        userId: user.id,
      },
    });

    if (existing) {
      return badRequest("A connection between these concepts already exists");
    }

    const connection = await prisma.connection.create({
      data: {
        fromId,
        toId,
        label,
        strength,
        type,
        aiGenerated,
        accepted,
        userId: user.id,
      },
      include: {
        from: {
          select: { id: true, title: true, domain: true, description: true },
        },
        to: {
          select: { id: true, title: true, domain: true, description: true },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Create connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
