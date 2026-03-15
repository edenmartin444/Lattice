import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { scrapeUrl } from "@/lib/import/url";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const { url } = await req.json();
    if (!url) return badRequest("url is required");

    // Validate URL
    try {
      new URL(url);
    } catch {
      return badRequest("Invalid URL");
    }

    const importRecord = await prisma.import.create({
      data: {
        userId: user.id,
        source: "url",
        url,
        status: "processing",
      },
    });

    try {
      const text = await scrapeUrl(url);

      await prisma.import.update({
        where: { id: importRecord.id },
        data: { status: "done" },
      });

      return NextResponse.json({
        id: importRecord.id,
        text,
        url,
      });
    } catch (scrapeError) {
      await prisma.import.update({
        where: { id: importRecord.id },
        data: { status: "error" },
      });
      throw scrapeError;
    }
  } catch (error) {
    console.error("URL import error:", error);
    const message = error instanceof Error ? error.message : "URL import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
