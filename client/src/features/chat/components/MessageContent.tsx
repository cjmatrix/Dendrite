import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdown/MarkdownComponents";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";


interface MessageContentProps {
  content: string;
}

export const MessageContent = React.memo(
  ({ content }: MessageContentProps) => {
   
    const renderedMarkdown = useMemo(
      () => (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      ),
      [content]
    );

    return (
      <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-visible">
        {renderedMarkdown}
      </div>
    );
  },
  (prev, next) => prev.content === next.content
);

MessageContent.displayName = "MessageContent";
