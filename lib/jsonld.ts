// Serialise schema.org JSON-LD safely for a <script> tag (escapes "<" to avoid XSS).
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
