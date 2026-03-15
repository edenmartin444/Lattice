import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createConceptSchema } from "@/types";

// GET /api/concepts — Liste avec filtres et pagination
export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId: user.id };

  if (domain) {
    where.domain = domain;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [concepts, total] = await Promise.all([
    prisma.concept.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            connectionsFrom: true,
            connectionsTo: true,
          },
        },
      },
    }),
    prisma.concept.count({ where }),
  ]);

  return NextResponse.json({
    concepts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/concepts — Creer un concept
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createConceptSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid input", parsed.error.flatten());
    }

    const concept = await prisma.concept.create({
      data: {
        ...parsed.data,
        source: parsed.data.source || null,
        userId: user.id,
      },
    });

    return NextResponse.json(concept, { status: 201 });
  } catch (error) {
    console.error("Create concept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
