import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, StickyNote, Brain, Pencil } from "lucide-react";
import DendritesLogo from "../../../components/DendritesLogo";
import { MessageContent } from "./MessageContent";
import type { Message } from "../types/Message";

const clampText = (text: string, maxLines: number = 3) => {
  const lines = text.split("\n");
  const isClamped = lines.length > maxLines;
  const clampedLines = lines.slice(0, maxLines).join("\n");
  return { clampedLines, isClamped, fullText: text };
};

function getRelativeYOfText(
  container: HTMLElement,
  searchText: string,
): number | null {
  if (!searchText) return null;
  const normalizedSearch = searchText.replace(/\s+/g, "").toLowerCase();
  if (!normalizedSearch) return null;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  interface CharMap {
    node: Text;
    offset: number;
    char: string;
  }

  const chars: CharMap[] = [];
  let textNode = walker.nextNode() as Text | null;
  while (textNode) {
    const text = textNode.nodeValue || "";
    for (let i = 0; i < text.length; i++) {
      if (!/\s/.test(text[i])) {
        chars.push({ node: textNode, offset: i, char: text[i].toLowerCase() });
      }
    }
    textNode = walker.nextNode() as Text | null;
  }

  const combinedString = chars.map((c) => c.char).join("");
  const matchIdx = combinedString.indexOf(normalizedSearch);

  if (matchIdx !== -1) {
    const startTarget = chars[matchIdx];
    try {
      const range = document.createRange();
      range.setStart(startTarget.node, startTarget.offset);
      range.setEnd(
        startTarget.node,
        Math.min(startTarget.offset + 1, startTarget.node.nodeValue!.length),
      );

      const rangeRect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (rangeRect.height > 0 || rangeRect.width > 0) {
        return rangeRect.top - containerRect.top;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

interface MessageBubbleProps {
  msg: Message;
  onOpenSubChat: (msgId: string, subChatId: string) => void;
  onCreateRecall: (msgId: string) => void;
  fileAttachment?: { fileUrl: string; fileName: string };
  onOpenSplitView: (fileUrl: string, fileName: string) => void;
  isLastUserMessage?: boolean;
  onEdit?: (msgId: string, content: string) => void;
  isEditing?: boolean;
}

export const MessageBubble = React.memo(
  ({
    msg,
    onOpenSubChat,
    onCreateRecall,
    fileAttachment,
    onOpenSplitView,
    isLastUserMessage,
    onEdit,
    isEditing,
  }: MessageBubbleProps) => {
    const isUser = msg.role === "user";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const { clampedLines, isClamped, fullText } = clampText(msg.content, 3);
    const containerRef = useRef<HTMLDivElement>(null);

    const [resolvedYOffsets, setResolvedYOffsets] = useState<
      Record<string, number>
    >({});

    useEffect(() => {
      if (!containerRef.current || !msg.subChats || msg.subChats.length === 0) return;

      const updateOffsets = () => {
        if (!containerRef.current) return;
        const newOffsets: Record<string, number> = {};
        for (const sc of msg.subChats!) {
          const calculatedY = getRelativeYOfText(
            containerRef.current,
            sc.highlightedText || "",
          );
        
          newOffsets[sc.subChatId] = calculatedY !== null ? calculatedY : sc.relY;
        }
        setResolvedYOffsets(newOffsets);
      };

      updateOffsets();

      const observer = new ResizeObserver(updateOffsets);
      observer.observe(containerRef.current);

      window.addEventListener("resize", updateOffsets);

      const handleTransitionEnd = (e: TransitionEvent) => {
        if (
          e.propertyName === "width" ||
          e.propertyName === "max-width" ||
          e.propertyName === "all"
        ) {
          updateOffsets();
        }
      };
      containerRef.current.addEventListener("transitionend", handleTransitionEnd);
      
      const timer = setTimeout(updateOffsets, 300);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateOffsets);
        if (containerRef.current) {
          containerRef.current.removeEventListener("transitionend", handleTransitionEnd);
        }
        clearTimeout(timer);
      };
    }, [msg.subChats, isExpanded, msg.content]);

    return (
      <div
        data-message-id={msg._id}
        className={` flex w-full message-bubble-container group/bubble relative ${isUser ? "justify-end" : "justify-start"}`}
      >
        {isUser ? (
          <div
            ref={containerRef}
            className="flex flex-col items-end max-w-[85%] md:max-w-[70%] relative"
          >
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-[12px] text-gray-500 font-medium">
                {time}
              </span>
              <span className="text-[13px] font-semibold text-gray-300">
                Researcher {isEditing && <span className="text-amber-500 ml-1 text-[11px] animate-pulse">(Editing...)</span>}
              </span>
            </div>
            <div className={`px-5 py-3.5 rounded-2xl rounded-tr-sm bg-(--theme-bg-surface) border ${isEditing ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/50" : "border-zinc-800"} text-[16px] leading-relaxed whitespace-pre-wrap text-gray-200 shadow-sm transition-all duration-300`}>
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="mb-3 rounded-xl border border-zinc-700 max-h-72 object-contain"
                />
              )}
              <div className="relative">
                {isExpanded ? fullText : clampedLines}
                {isClamped && !isExpanded && (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            {isClamped && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 p-1.5 rounded-lg bg-zinc-800/50 text-gray-400 hover:bg-zinc-700 hover:text-gray-200 transition-colors"
                title={isExpanded ? "Collapse message" : "Expand message"}
              >
                <ArrowUp
                  size={16}
                  className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}

            {fileAttachment && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 backdrop-blur-sm">
                <span className="text-xs text-zinc-300 font-medium">
                  📎 File uploaded: {fileAttachment.fileName}
                </span>
                <button
                  onClick={() =>
                    onOpenSplitView(
                      fileAttachment.fileUrl,
                      fileAttachment.fileName,
                    )
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1 hover:bg-blue-500/10 rounded transition-colors border border-blue-500/30 hover:border-blue-400/50"
                  title="Open file in split-screen view"
                >
                  View Split
                </button>
                <a
                  href={fileAttachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-300 font-medium"
                >
                  Open
                </a>
              </div>
            )}

            {/* Sticky Notes for User Message */}
            {msg.hasSubChat &&
              msg.subChats?.map((sc) => (
                <button
                  key={sc.subChatId}
                  onClick={() => onOpenSubChat(msg._id!, sc.subChatId)}
                  className="absolute left-full ml-4 p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group shadow-xl backdrop-blur-sm z-10"
                  style={{ top: resolvedYOffsets[sc.subChatId] ?? sc.relY }}
                  title="View sticky deep-dive"
                >
                  <StickyNote
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            {/* Recall Button for User Message */}
            <div className="absolute top-0 right-full mr-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex flex-col gap-2">
              <button
                onClick={() => onCreateRecall(msg._id!)}
                className="p-1.5 rounded-lg bg-zinc-800 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                title="Save as Recall Card"
              >
                <Brain size={14} />
              </button>
              {isLastUserMessage && onEdit && (
                <button
                  onClick={() => onEdit(msg._id!, msg.content)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 hover:bg-amber-600 hover:text-white transition-colors"
                  title="Edit and Retry"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-full gap-4 max-w-full group/bubble relative">
            <DendritesLogo className="mt-1 hidden sm:flex shrink-0" />

            <div
              ref={containerRef}
              className="flex-1 flex flex-col min-w-0 relative"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[13px] font-semibold text-gray-200">
                  AI ASSISTANT
                </span>
                <span className="text-[12px] text-gray-500 font-medium">
                  {time}
                </span>
              </div>
              <MessageContent content={msg.content} />

              {/* Sticky Note Icons */}
              {msg.hasSubChat &&
                msg.subChats?.map((sc) => (
                  <button
                    key={sc.subChatId}
                    onClick={() => onOpenSubChat(msg._id!, sc.subChatId)}
                    className="absolute right-full mr-4 p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group shadow-xl backdrop-blur-sm z-10"
                    style={{ top: resolvedYOffsets[sc.subChatId] ?? sc.relY }}
                    title="View sticky deep-dive"
                  >
                    <StickyNote
                      size={14}
                      className="group-hover:scale-110 transition-transform"
                    />
                  </button>
                ))}

              {/* Recall Button for AI Message */}
              <div className="absolute top-0 left-full ml-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                <button
                  onClick={() => onCreateRecall(msg._id!)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors shadow-md"
                  title="Save as Recall Card"
                >
                  <Brain size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

MessageBubble.displayName = "MessageBubble";
