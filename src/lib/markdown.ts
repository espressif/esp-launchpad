import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Converts a markdown string to sanitized HTML for readme rendering. Readmes come
 * from external TOML configs (e.g. `flashConfigURL`), so the output is passed
 * through DOMPurify before it reaches `dangerouslySetInnerHTML`.
 */
export function mdToHtml(markdownContent: string): string {
  return DOMPurify.sanitize(marked.parse(markdownContent, { async: false }));
}

/** Fetches a markdown URL and returns rendered HTML, or empty string on failure. */
export async function fetchMarkdownAsHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    return mdToHtml(await response.text());
  } catch {
    return "";
  }
}
