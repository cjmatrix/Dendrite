import React, { useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { markdownComponents, compactMarkdownComponents } from "./markdown/MarkdownComponents";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MessageContentProps {
  content: string;
  compact?: boolean;
}


export function stripGlobalMemory(text: string): string {
  if (!text) return text;
  return text.replace(/\s*<global_memory>[\s\S]*?(?:<\/global_memory>|$)\s*/gi, "");
}

export function fixMalformedPlantUML(text: string): string {
  if (!text || (!text.includes("@startuml") && !text.includes("plantuml"))) return text;

  return text.replace(
    /(^|\n)\s*(?:`{1,3}\s*(?:plantuml)?\s*)?(@startuml[\s\S]*?@enduml)(?:\s*`{1,3})?(?=\s*(?:\n|$))/gi,
    (_match, prefix, body) => {
      return `${prefix}\n\`\`\`plantuml\n${body.trim()}\n\`\`\`\n`;
    }
  );
}

export function fixMalformedCodeBlocks(text: string): string {
  if (!text) return text;
  
  ``
  const langRegex = /(^|\s)`(bash|json|javascript|js|typescript|ts|html|css|python|py|java|cpp|c|go|rust|sql|sh|yaml|yml|tsx|jsx|xml|markdown|md|shell)\s+((?:(?!`|\n\n(?:[#*>-]|\*\*|`|\[!|\d+\.|[a-zA-Z]\.|\w+\)))[\s\S])+?)(`|\n\n(?=[#*>-]|\*\*|`|\[!|\d+\.|[a-zA-Z]\.|\w+\))|$)/gi;
  
  return text.replace(langRegex, (_match, prefix, lang, code) => {
    return `${prefix}\n\`\`\`${lang.toLowerCase()}\n${code.trim()}\n\`\`\`\n\n`;
  });
}

export const MessageContent = React.memo(
  ({ content, compact = false }: MessageContentProps) => {
    const processedContent = useMemo(() => {
      let cleaned = stripGlobalMemory(content);
      const fixedBlocks = fixMalformedCodeBlocks(cleaned);
      return fixMalformedPlantUML(fixedBlocks);
    }, [content]);

    const hasTriggeredMemoryRef = useRef(false);
    useEffect(() => {
      if (content.includes("<global_memory>") && !hasTriggeredMemoryRef.current) {
        hasTriggeredMemoryRef.current = true;
        window.dispatchEvent(new CustomEvent("memory-updated"));
      }
    }, [content]);

    const renderedMarkdown = useMemo(
      () => (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={compact ? compactMarkdownComponents : markdownComponents}
        >
          {processedContent}
        </ReactMarkdown>
      ),
      [processedContent, compact],
    );

    return (
      <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-visible">
        {renderedMarkdown}
      </div>
    );
  },
  (prev, next) => prev.content === next.content,
);

MessageContent.displayName = "MessageContent";
