import * as cheerio from "cheerio";

export interface BookmarkEntry {
  title: string;
  url: string;
}

export function parseBookmarksHtml(html: string): BookmarkEntry[] {
  const $ = cheerio.load(html);
  const bookmarks: BookmarkEntry[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim();
    if (href && title && href.startsWith("http")) {
      bookmarks.push({ title, url: href });
    }
  });

  return bookmarks;
}

export function parseHtmlToText(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside, [role='navigation'], [role='banner']").remove();

  // Try to get main content
  const main = $("main, article, [role='main'], .content, .post, .article").first();
  const text = main.length > 0 ? main.text() : $("body").text();

  return text.replace(/\s+/g, " ").trim();
}
