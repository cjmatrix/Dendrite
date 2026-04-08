import TurndownService from "turndown";
// @ts-ignore – turndown-plugin-gfm has no types
import { gfm } from "turndown-plugin-gfm";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

turndown.use(gfm);

// ── LINE BREAKS ──
turndown.addRule("lineBreak", {
  filter: "br",
  replacement: () => "\n",
});

// ── STANDARD <pre><code> ──
turndown.addRule("fencedCodeBlock", {
  filter: (node) =>
    node.nodeName === "PRE" &&
    node.firstChild !== null &&
    node.firstChild.nodeName === "CODE",
  replacement: (_content, node) => {
    const codeEl = node.firstChild as HTMLElement;
    const langMatch = /language-(\w+)/.exec(codeEl?.className || "");
    const lang = langMatch ? langMatch[1] : "";
    // Use innerText to respect line breaks in the code snippet
    const code = codeEl?.innerText || codeEl?.textContent || "";
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  },
});

// ── SYNTAX-HIGHLIGHTER <code class="language-xxx"> (PreTag="div", no <pre>) ──
turndown.addRule("syntaxHighlighterCode", {
  filter: (node) =>
    node.nodeName === "CODE" &&
    /language-/.test((node as HTMLElement).className || ""),
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const langMatch = /language-(\w+)/.exec(el.className || "");
    const lang = langMatch ? langMatch[1] : "";
    // Use innerText to respect line breaks in block elements produced by SyntaxHighlighter
    const code = el.innerText || el.textContent || "";
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  },
});

// ── KATEX BLOCK MATH  $$...$$ ──
// rehypeKatex renders block math as:
//   <span class="katex-display">
//     <span class="katex">
//       <span class="katex-mathml"><math><semantics>
//         <annotation encoding="application/x-tex">LATEX</annotation>
//       </semantics></math></span>
//       <span class="katex-html">... visual spans ...</span>
//     </span>
//   </span>
turndown.addRule("katexBlockMath", {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.classList.contains("katex-display"),
  replacement: (_content, node) => {
    const latex = extractLatex(node as HTMLElement);
    return latex ? `\n$$\n${latex}\n$$\n` : "";
  },
});

// ── KATEX INLINE MATH  $...$ ──
// rehypeKatex renders inline math as:
//   <span class="katex">
//     <span class="katex-mathml">...<annotation>LATEX</annotation>...</span>
//     <span class="katex-html">... visual spans ...</span>
//   </span>
turndown.addRule("katexInlineMath", {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.classList.contains("katex") &&
    !(node.parentElement?.classList.contains("katex-display")),
  replacement: (_content, node) => {
    const latex = extractLatex(node as HTMLElement);
    return latex ? `$${latex}$` : "";
  },
});

// ── CALLOUT BLOCKQUOTES  > [!NOTE] etc. ──
// MarkdownComponents renders these as <div data-callout-type="note|tip|...">
turndown.addRule("calloutBlockquote", {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.hasAttribute("data-callout-type"),
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const type = (el.getAttribute("data-callout-type") || "note").toUpperCase();

    // The callout div has two child divs:
    //   1. Title bar (icon + type label)  — skip
    //   2. Content area                  — extract
    const contentDiv = el.querySelector("[class*='opacity-90']") || el.lastElementChild;

    // Convert the inner HTML to markdown recursively
    let innerMd = "";
    if (contentDiv) {
      innerMd = turndown.turndown(contentDiv.innerHTML);
    } else {
      innerMd = el.textContent || "";
    }

    // Format as > [!TYPE]\n> content lines
    const lines = innerMd.split("\n");
    const quoted = lines.map((l) => `> ${l}`).join("\n");
    return `\n> [!${type}]\n${quoted}\n`;
  },
});

// ── KATEX INTERNAL SPANS — prevent Turndown from descending ──
// Without this, Turndown will try to process katex-html visual spans
// and produce garbled output like "E=mc2E = m c 2"
turndown.addRule("katexMathmlHide", {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.classList.contains("katex-mathml"),
  replacement: () => "", // handled by the parent katex/katex-display rule
});

turndown.addRule("katexHtmlHide", {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.classList.contains("katex-html"),
  replacement: () => "", // handled by the parent katex/katex-display rule
});




/**
 * Extracts the raw LaTeX source from a KaTeX-rendered element.
 * KaTeX embeds the original TeX in:
 *   <annotation encoding="application/x-tex">LATEX</annotation>
 */
function extractLatex(katexEl: HTMLElement): string {
  const annotation = katexEl.querySelector(
    'annotation[encoding="application/x-tex"]',
  );
  return annotation?.textContent?.trim() || "";
}

/**
 * Walks up from a DOM node to detect if it sits inside
 * a `<code class="language-xxx">` element (SyntaxHighlighter output).
 */
function getCodeBlockContext(startNode: Node): { language: string } | null {
  let node: Node | null = startNode;
  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      if (node.nodeName === "CODE" && /language-/.test(node.className)) {
        const langMatch = /language-(\w+)/.exec(node.className);
        return { language: langMatch ? langMatch[1] : "" };
      }
    }
    node = node.parentNode;
  }
  return null;
}

/**
 * Walks up from a DOM node to detect if it sits inside
 * a KaTeX-rendered math expression. Returns the full LaTeX
 * source and whether it's display (block) math.
 */
function getKatexContext(
  startNode: Node,
): { latex: string; display: boolean } | null {
  let node: Node | null = startNode;
  let isDisplay = false;

  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      if (node.classList.contains("katex-display")) {
        isDisplay = true;
      }
      if (node.classList.contains("katex")) {
        const latex = extractLatex(node);
        if (latex) {
          return { latex, display: isDisplay };
        }
      }
    }
    node = node.parentNode;
  }
  return null;
}

/**
 * Remove non-content elements from a cloned fragment before Turndown
 * processes it. Strips language header bars, copy buttons, SVG icons.
 */
function preprocessFragment(container: HTMLElement): void {
  // Remove code-block language header divs (the bar with "JAVASCRIPT" + Copy button)
  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    const parent = btn.parentElement;
    if (parent && parent !== container) {
      const sibling =
        parent.nextElementSibling || parent.previousElementSibling;
      if (sibling) {
        const codeEl = sibling.querySelector("code[class*='language-']");
        if (codeEl) {
          parent.remove();
          return;
        }
      }
    }
  });

  // Remove standalone SVGs (copy icons, callout icons etc.)
  const svgs = container.querySelectorAll("svg");
  svgs.forEach((svg) => svg.remove());
}


/**
 * Extracts the HTML fragment from the current browser selection,
 * converts it cleanly to Markdown via Turndown.
 *
 * Handles every markdown type rendered in ChatWindow:
 *   ✅  Bold / Italic / Strikethrough
 *   ✅  Headers (h1–h6)
 *   ✅  Links / Images
 *   ✅  Ordered & unordered lists / Task lists
 *   ✅  Tables (GFM)
 *   ✅  Code blocks (SyntaxHighlighter) + inline code
 *   ✅  Math formulas — inline $...$ and block $$...$$ (KaTeX)
 *   ✅  Blockquotes + GitHub-style callouts [!NOTE] etc.
 *   ✅  Horizontal rules
 *
 * Returns null if there is no usable selection.
 */
export function getMarkdownFromDOMSelection(): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;

  // ── FAST PATH: selection is entirely inside a CODE BLOCK ──
  const codeCtx = getCodeBlockContext(ancestor);
  if (codeCtx) {
    // We use a custom approach to get the text because sel.toString() 
    // can be inconsistent if the code block isn't a <pre> tag.
    // However, after changing PreTag="pre", sel.toString() should be better.
    const selectedCode = sel.toString();
    if (selectedCode.trim()) {
      return `\`\`\`${codeCtx.language}\n${selectedCode}\n\`\`\``;
    }
  }

  // ── FAST PATH: selection is entirely inside a MATH formula ──
  // sel.toString() on KaTeX gives rendered symbols (E = mc²),
  // not the LaTeX source. We must dig into the annotation element.
  const katexCtx = getKatexContext(ancestor);
  if (katexCtx) {
    return katexCtx.display
      ? `$$\n${katexCtx.latex}\n$$`
      : `$${katexCtx.latex}$`;
  }

  // ── GENERAL PATH: clone fragment and convert via Turndown ──
  const fragment = range.cloneContents();
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(fragment);

  // Clean up non-content elements
  preprocessFragment(tempDiv);

  const html = tempDiv.innerHTML.trim();
  if (!html) return null;

  // Convert HTML → Markdown
  let md = turndown.turndown(html);

  // Collapse 3+ consecutive newlines → 2
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md || null;
}

/**
 * Legacy API – kept for backward compatibility.
 */
export const getMarkdownFromSelection = (
  rawMarkdown: string,
  selectedPlainText: string,
): string => {
  const domMarkdown = getMarkdownFromDOMSelection();
  if (domMarkdown && domMarkdown.length > 0) return domMarkdown;

  if (!selectedPlainText || !rawMarkdown) return "";

  const directIndex = rawMarkdown.indexOf(selectedPlainText);
  if (directIndex !== -1) {
    return wrapIfInCodeBlock(
      rawMarkdown,
      directIndex,
      directIndex + selectedPlainText.length,
    );
  }

  try {
    const escapedText = selectedPlainText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const words = escapedText.split(/\s+/).filter((w) => w.length > 1);

    if (words.length > 0) {
      const fuzzyRegex = new RegExp(words.join("[\\s\\S]*?"), "g");
      const matches = [...rawMarkdown.matchAll(fuzzyRegex)];

      if (matches.length === 1) {
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
 * Strips markdown formatting to get plain text.
 */
export const stripMarkdown = (markdown: string): string => {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
};

const wrapIfInCodeBlock = (
  rawMarkdown: string,
  start: number,
  end: number,
): string => {
  const segment = rawMarkdown.slice(start, end);
  const textBefore = rawMarkdown.slice(0, start);
  const backtickCount = (textBefore.match(/```/g) || []).length;

  if (backtickCount % 2 !== 0) {
    const lastBackticks = textBefore.lastIndexOf("```");
    const afterBackticks = textBefore.slice(
      lastBackticks + 3,
      lastBackticks + 20,
    );
    const langMatch = afterBackticks.match(/^([a-z0-9-]+)/i);
    const lang = langMatch ? langMatch[1] : "";
    return "```" + lang + "\n" + segment + "\n```";
  }

  return segment;
};
