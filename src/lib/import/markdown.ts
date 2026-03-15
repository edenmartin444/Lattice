import { marked } from "marked";

export async function parseMarkdown(content: string): Promise<string> {
  // Convert markdown to HTML, then strip tags to get plain text
  const html = await marked(content);
  return stripHtmlTags(html);
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
