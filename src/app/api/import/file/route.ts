import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized, badRequest } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { detectFileType, parseFileContent } from "@/lib/import";

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("No file provided");

    const filename = file.name;
    const content = await file.text();
    const source = detectFileType(filename);

    // Create import record
    const importRecord = await prisma.import.create({
      data: {
        userId: user.id,
        source,
        filename,
        status: "processing",
      },
    });

    try {
      const result = await parseFileContent(content, source);

      await prisma.import.update({
        where: { id: importRecord.id },
        data: { status: "done" },
      });

      return NextResponse.json({
        id: importRecord.id,
        text: result.text,
        bookmarks: result.bookmarks,
        source,
        filename,
      });
    } catch (parseError) {
      await prisma.import.update({
        where: { id: importRecord.id },
        data: { status: "error" },
      });
      throw parseError;
    }
  } catch (error) {
    console.error("File import error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
