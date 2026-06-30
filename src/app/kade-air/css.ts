import type { CSSProperties } from "react";

/**
 * Parse a plain CSS declaration string into a React style object.
 *
 * The Kadé Air screens are ported verbatim from a hand-tuned HTML design, so it
 * is far safer to keep the original CSS strings (with template-literal holes for
 * dynamic colors) than to hand-convert hundreds of declarations to camelCase.
 *
 * Splits on `;` for declarations and the first `:` for prop/value, which is safe
 * here because the only values are gradients, shadows and transforms — none
 * contain a colon. Custom properties (`--dx`) are passed through untouched.
 */
export function s(css: string): CSSProperties {
  const out: CSSProperties = {};
  const bag = out as Record<string, string>;
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const rawKey = decl.slice(0, i).trim();
    if (!rawKey) continue;
    const val = decl.slice(i + 1).trim();
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    bag[key] = val;
  }
  return out;
}
