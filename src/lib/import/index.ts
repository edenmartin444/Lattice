import { parseMarkdown } from "./markdown";
import { parseText } from "./text";
import { parseHtmlToText, parseBookmarksHtml, type BookmarkEntry } from "./html";

export type ImportSource = "markdown" | "html" | "text" | "url" | "bookmarks";

export interface ParseResult {
  text: string;
  bookmarks?: BookmarkEntry[];
}

export function detectFileType(filename: string): ImportSource {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "md":
    case "markdown":
      return "markdown";
    case "html":
    case "htm":
      return "html";
    case "txt":
    default:
      return "text";
  }
}

export async function parseFileContent(
  content: string,
  source: ImportSource
): Promise<ParseResult> {
  switch (source) {
    case "markdown":
      return { text: await parseMarkdown(content) };
    case "html": {
      // Check if it looks like a bookmarks export
      const isBookmarks =
        content.includes("<!DOCTYPE NETSCAPE-Bookmark-file") ||
        content.includes("BOOKMARKS") ||
        (content.includes("<DL>") && content.includes("<DT>"));
      if (isBookmarks) {
        const bookmarks = parseBookmarksHtml(content);
        const text = bookmarks.map((b) => `${b.title}: ${b.url}`).join("\n");
        return { text, bookmarks };
      }
      return { text: parseHtmlToText(content) };
    }
    case "text":
    default:
      return { text: parseText(content) };
  }
}

export { type BookmarkEntry } from "./html";
