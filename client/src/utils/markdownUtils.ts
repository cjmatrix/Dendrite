/**
 * Strips markdown formatting characters from a string to get plain text.
 */
export const stripMarkdown = (markdown: string): string => {
  return markdown
    .replace(/^#+\s+/gm, "") // Headers
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // Bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // Italic
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // Code blocks
    .replace(/^\s*[-*+]\s+/gm, "") // List items
    .replace(/^\s*>\s+/gm, "") // Blockquotes
    .replace(/\n\s*\n/g, "\n") // Double newlines
    .trim();
};

/**
 * Robustly finds the Raw Markdown fragment from a rendered Plaintext selection.
 * This version uses a context-aware approach to handle repeated words and code snippets.
 */
export const getMarkdownFromSelection = (rawMarkdown: string, selectedPlainText: string): string => {
  if (!selectedPlainText || !rawMarkdown) return "";

  // 1. Direct Match (Simplest case)
  const directIndex = rawMarkdown.indexOf(selectedPlainText);
  if (directIndex !== -1) {
    return wrapIfInCodeBlock(rawMarkdown, directIndex, directIndex + selectedPlainText.length);
  }

  // 2. Fuzzy Match: Find the words but ignore formatting characters in between
  // This handles searching for "Hello world" inside "**Hello** world"
  try {
    const escapedText = selectedPlainText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const words = escapedText.split(/\s+/).filter((w) => w.length > 1);

    if (words.length > 0) {
      // Create a fuzzy regex that allows any characters (markdown symbols) between words
      const fuzzyRegex = new RegExp(words.join("[\\s\\S]*?"), "g");
      const matches = [...rawMarkdown.matchAll(fuzzyRegex)];

      if (matches.length === 1) {
        // Only one match exists! This is high confidence.
        const start = matches[0].index!;
        const end = start + matches[0][0].length;
        return wrapIfInCodeBlock(rawMarkdown, start, end);
      }
    }
  } catch (e) {
    console.warn("Fuzzy regex match failed", e);
  }

  return selectedPlainText;
};

/**
 * Checks if a range in the raw markdown is inside triple backticks and wraps it if so.
 */
const wrapIfInCodeBlock = (rawMarkdown: string, start: number, end: number): string => {
  const segment = rawMarkdown.slice(start, end);
  
  // Look backwards for a triple backtick
  const textBefore = rawMarkdown.slice(0, start);
  const backtickCount = (textBefore.match(/```/g) || []).length;

  // If backtick count is odd, we are currently "inside" a code block
  if (backtickCount % 2 !== 0) {
    // Try to find the language tag just after the previous ```
    const lastBackticks = textBefore.lastIndexOf("```");
    const afterBackticks = textBefore.slice(lastBackticks + 3, lastBackticks + 20);
    const langMatch = afterBackticks.match(/^([a-z0-9-]+)/i);
    const lang = langMatch ? langMatch[1] : "";

    return "```" + lang + "\n" + segment + "\n```";
  }

  return segment;
};

