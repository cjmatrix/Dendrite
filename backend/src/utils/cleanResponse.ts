/**
 * Strips code-style formatting artifacts, custom blockquotes, 
 * and markdown layout wrappers from a raw LLM output string.
 */
export function cleanLLMResponse(rawInput: string): string {
  if (!rawInput) return "";

  let text = rawInput
    // 1. Remove string chunk prefixes like [0] or [1] at the start of lines
    .replace(/^\[\d+\]\s*/gm, "")
    // 2. Remove JavaScript string wrapper literals (' at start, ' + or ' at end of lines)
    .replace(/^['"`]/gm, "")
    .replace(/['"`]\s*\+\s*$/gm, "")
    .replace(/['"`]$/gm, "")
    // 3. Convert explicit escaped string newlines (\n) into actual line breaks
    .replace(/\\n/g, "\n")
    // 4. Clean out non-breaking space characters (\u00A0)
    .replace(/\u00A0/g, " ");

  // 5. Strip out custom alert blockquote tags (e.g., > [!IMPORTANT] or > [!TIP])
  text = text.replace(/^>\s*\[!(IMPORTANT|TIP|NOTE|WARNING|CAUTION)\]\s*$/gim, ">");

  // 6. Strip standard markdown formatting elements
  text = text
    // Remove headers (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+(.+)$/gm, "$1")
    // Remove bold/italic styling (**text**, __text__, *text*)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove inline code ticks (`code`)
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links but preserve the inner link text [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove horizontal rules (---, ***)
    .replace(/^([-*_])\1{2,}\s*$/gm, "");

  // 7. Squash excessive whitespace and multi-line gaps down to a single empty line
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
