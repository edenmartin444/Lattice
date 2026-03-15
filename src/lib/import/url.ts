import { parseHtmlToText } from "./html";

export async function scrapeUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Lattice/1.0; Knowledge Graph)",
      Accept: "text/html,application/xhtml+xml,text/plain",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (contentType.includes("text/plain")) {
    return body.trim();
  }

  return parseHtmlToText(body);
}
