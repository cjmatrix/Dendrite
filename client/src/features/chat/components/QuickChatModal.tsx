import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowUp,
  Sparkles,
  Pin,
  Maximize2,
  Minimize2,
  Brain,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";

import Draggable from "react-draggable";
import { useQuickChat } from "../hooks/useQuickChat";
import { MessageContent } from "./MessageContent";
import { MODEL_OPTIONS } from "../constants/models";

interface QuickChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  sourceMessageId: string;
  chatId: string | undefined;
  relativeY?: number;
  subChatId?: string;
  initialModel?: string;
}

export const QuickChatModal: React.FC<QuickChatModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  sourceMessageId,
  chatId,
  relativeY,
  subChatId,
  initialModel,
}) => {
  const draggableNodeRef = useRef<HTMLDivElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("quickChatExpanded") === "true";
  });

  const [showBackgroundContent, setShowBackgroundContent] = useState(() => {
    return localStorage.getItem("quickChatShowBackground") === "true";
  });

  useEffect(() => {
    localStorage.setItem("quickChatExpanded", String(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "quickChatShowBackground",
      String(showBackgroundContent),
    );
  }, [showBackgroundContent]);

  const [isModelOpen, setIsModelOpen] = useState(false);

  const {
    input,
    setInput,
    subMessages,
    streamingText,
    isPinned,
    setIsPinned,
    isRecalling,
    recallSelection,
    scrollRef,
    existingSubChat,
    model,
    setModel,
    stickToChatMutation,
    streamChatMutation,
    handleSend,
    handleSubChatTextSelection,
    handleCreateRecall,
  } = useQuickChat({
    chatId,
    sourceMessageId,
    selectedText,
    subChatId,
    relativeY,
    isOpen,
    initialModel,
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-100 ${showBackgroundContent ? "bg-transparent pointer-events-none" : "bg-black/10 backdrop-blur-sm"}`}
        onClick={!showBackgroundContent ? onClose : undefined}
      />

      <div className="fixed inset-0 z-101 flex items-center justify-center pointer-events-none">
        <Draggable nodeRef={draggableNodeRef} handle=".quickchat-drag-handle">
          <div
            ref={draggableNodeRef}
            className={`w-[95vw] pointer-events-auto bg-[var(--theme-bg-base)] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 ${
              isExpanded ? "max-w-6xl h-[92vh]" : "max-w-2xl h-[70vh]"
            }`}
          >
          {/* Header */}
          <div className="quickchat-drag-handle flex items-center justify-between px-4 py-3 border-b border-white/10 bg-(--theme-bg-base) cursor-move">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-200">
                Quick Context Chat
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBackgroundContent(!showBackgroundContent)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                  showBackgroundContent
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                    : "text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/30"
                }`}
                title={
                  showBackgroundContent
                    ? "Hide background (disable blur)"
                    : "Show background (enable blur)"
                }
              >
                {showBackgroundContent ? (
                  <Eye size={14} />
                ) : (
                  <EyeOff size={14} />
                )}
                {showBackgroundContent ? "Background On" : "Background Off"}
              </button>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                  existingSubChat
                    ? "text-blue-400 bg-blue-500/10 border-blue-500/30 cursor-default"
                    : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/30"
                }`}
                onClick={() =>
                  (!existingSubChat || !isPinned) &&
                  stickToChatMutation.mutate()
                }
                disabled={
                  stickToChatMutation.isPending || subMessages.length === 0
                }
              >
                <Pin
                  size={14}
                  className={existingSubChat ? "fill-blue-400" : ""}
                />
                {(existingSubChat && isPinned) || isPinned
                  ? "Pinned to Chat"
                  : "Stick to Chat"}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                title={isExpanded ? "Shrink" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Selected Text Reference */}

          {(selectedText || existingSubChat?.highlightedText) && (
            <div className="px-4 py-3 bg-blue-500/5 border-b border-white/5 shrink-0">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">
                Referencing Selection
              </p>
              <div className="text-sm text-gray-300 italic border-l-2 border-blue-500/50 pl-3 line-clamp-2">
                "{selectedText || existingSubChat?.highlightedText}"
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div
            ref={scrollRef}
            data-subchat-messages=""
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-6"
            onMouseUp={handleSubChatTextSelection}
          >
            {subMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                  <Sparkles size={24} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 max-w-[280px]">
                  Dive deeper into this specific highlight. Your conversation
                  here won't clutter the main chat.
                </p>
              </div>
            ) : (
              subMessages.map((msg: any, idx: number) => (
                <div
                  key={idx}
                  data-subchat-msg-index={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group/subchat-bubble relative`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-900/20"
                        : "bg-white/4 text-gray-200 rounded-tl-sm border border-white/5 w-[100vw]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="markdown-body">
                        <MessageContent content={msg.content}></MessageContent>
                      </div>
                    )}
                  </div>

                  {/* Recall Brain icon on AI messages */}
                  {msg.role === "model" && (
                    <div className="absolute top-1 left-full ml-1.5 opacity-0 group-hover/subchat-bubble:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCreateRecall(null, idx)}
                        className="p-1 rounded-lg bg-zinc-800 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors shadow-md"
                        title="Save as Recall Card"
                      >
                        <Brain size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Streaming Bubble */}
            {(streamChatMutation.isPending || streamingText) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed bg-white/5 text-gray-200 rounded-tl-sm border border-white/5">
                  {streamingText ? (
                    <div className="markdown-body">
                       <MessageContent content={streamingText}></MessageContent>
                    </div>
                  ) : (
                    <span className="flex gap-1.5 items-center h-6">
                      <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce delay-200"></span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Floating Recall Button */}
          {recallSelection && recallSelection.visible && (
            <div
              className="fixed z-[200] -translate-x-1/2 -translate-y-full flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ top: recallSelection.y - 10, left: recallSelection.x }}
            >
              <button
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-purple-500 transition-all flex items-center gap-2"
                onClick={() =>
                  handleCreateRecall(
                    recallSelection.markdown,
                    recallSelection.msgIndex,
                  )
                }
                disabled={isRecalling}
              >
                <Brain size={14} />
                {isRecalling ? "Saving..." : "Recall"}
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-(--theme-bg-base)">
            <div className="flex items-center bg-(--theme-bg-elevated) border border-white/10 rounded-2xl px-4 py-3 shadow-inner focus-within:border-blue-500/30 transition-all gap-2 relative">
              {/* Dropup Model Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModelOpen(!isModelOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs text-gray-300 font-medium transition-all shadow-sm"
                >
                  <Sparkles size={13} className="text-blue-400" />
                  <span>
                    {MODEL_OPTIONS.find((m) => m.id === model)?.label || "Model"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-gray-500 transition-transform shrink-0 ${isModelOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isModelOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 pointer-events-auto"
                      onClick={() => setIsModelOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-0.5 z-50 pointer-events-auto">
                      {MODEL_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setModel(opt.id);
                            setIsModelOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            model === opt.id
                              ? "bg-blue-600 text-white font-semibold"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {model === opt.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <input
                type="text"
                placeholder="Ask a clarifying question..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setIsPinned(false);
                    handleSend();
                  }
                }}
                disabled={streamChatMutation.isPending}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={streamChatMutation.isPending || !input.trim()}
                className={`p-2 rounded-xl ml-2 transition-all ${
                  input.trim() && !streamChatMutation.isPending
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                    : "bg-white/5 text-gray-600 cursor-not-allowed"
                }`}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </Draggable>
      </div>
    </>
  );
};
