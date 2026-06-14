import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdown/MarkdownComponents";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MessageContentProps {
  content: string;
}


function fixMalformedPlantUML(text: string): string {
  if (!text || !text.includes("plantuml")) return text;

 
  return text.replace(
    /(?<!`)(`)(plantuml\s+@startuml[\s\S]*?@enduml)\1(?!`)/g,
    (_match, _tick, body) => {
      return "\n```" + body.trim() + "\n```\n";
    }
  );
}

export const MessageContent = React.memo(
  ({ content }: MessageContentProps) => {
    const processedContent = useMemo(() => fixMalformedPlantUML(content), [content]);

    const renderedMarkdown = useMemo(
      () => (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {processedContent}
        </ReactMarkdown>
      ),
      [processedContent],
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
