import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Lock,
  Columns,
  Image,
} from "lucide-react";

import Draggable from "react-draggable";
import { useQuickChat } from "../hooks/useQuickChat";
import { MessageContent } from "./MessageContent";
import { MODEL_OPTIONS } from "../constants/models";
import { AILoadingIndicator } from "../../../components/common/AILoadingIndicator";
import type { Message } from "../types/Message";
import { useAppSelector } from "../../../store/store";
import { StreamingContext } from "../../../providers/StreamingContext";
import toast from "react-hot-toast";
import { DeckPickerModal } from "../../recall/components/DeckPickerModal";

interface QuickChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  sourceMessageId: string;
  chatId: string | undefined;
  relativeY?: number;
  subChatId?: string;
  initialModel?: string;
  isSplit?: boolean;
  onToggleSplit?: () => void;
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
  isSplit = false,
  onToggleSplit,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const draggableNodeRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    isDeckPickerOpen,
    confirmRecall,
    cancelRecall,
    recallSelection,
    scrollRef,
    handleScroll,
    existingSubChat,
    model,
    setModel,
    mode,
    setMode,
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

  const isFromFileViewer = sourceMessageId === "__split_view_quick__";

  if (!isOpen) return null;

  const innerBodyContent = (
    <>
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
        onScroll={handleScroll}
        data-subchat-messages=""
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-6"
        onMouseUp={handleSubChatTextSelection}
        onTouchEnd={handleSubChatTextSelection}
      >
        {subMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
              <Sparkles size={24} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 max-w-[280px]">
              Dive deeper into this specific highlight. Your conversation here
              won't clutter the main chat.
            </p>
          </div>
        ) : (
          subMessages.map((msg: Message, idx: number) => (
            <div
              key={idx}
              data-subchat-msg-index={idx}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"} group/subchat-bubble relative`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed bg-blue-600/55 text-white/90 rounded-tr-sm shadow-lg shadow-blue-900/10">
                  {msg.content}
                </div>
              ) : (
                <div className="flex-1 min-w-0 relative pl-3 border-l border-white/10">
                  <MessageContent content={msg.content} compact />
                </div>
              )}

              {/* Recall Brain icon on AI messages */}
              {msg.role === "model" && (
                <div className="absolute top-1 right-2 opacity-0 group-hover/subchat-bubble:opacity-100 transition-opacity">
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
          <div className="flex w-full justify-start">
            <div className="flex-1 min-w-0 relative pl-3 border-l border-white/10">
              {streamingText ? (
                <div>
                  <StreamingContext.Provider value={true}>
                    <MessageContent content={streamingText} compact />
                  </StreamingContext.Provider>
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 rounded-sm streaming-cursor align-middle" />
                </div>
              ) : (
                <div className="w-full">
                  <AILoadingIndicator />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Recall Button */}
      {recallSelection && recallSelection.visible && (
        <div
          className="fixed z-[10001] -translate-x-1/2 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ top: recallSelection.bottomY + 8, left: recallSelection.x }}
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
      <div className="p-4 border-t border-white/10 bg-neutral-900">
        <div className={`flex flex-col bg-zinc-950/40 border rounded-2xl p-3 shadow-inner transition-all gap-2.5 relative ${
          streamChatMutation.isPending 
            ? "border-blue-500/40 animate-pulse" 
            : "border-white/10 focus-within:border-blue-500/30"
        }`}>
          <textarea
            placeholder={streamChatMutation.isPending ? "AI is typing..." : "Ask a clarifying question..."}
            maxLength={16000}
            className="w-full bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-500 resize-none max-h-32 py-1 overflow-y-auto no-scrollbar disabled:opacity-60"
            value={input}
            rows={1}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }
            }}
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

          <div className="flex items-center justify-between border-t border-white/5 pt-2.5 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
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
                      {(user?.tier === "byok"
                        ? MODEL_OPTIONS.filter((opt) => opt.id === "DEFAULT" || opt.id.startsWith("gemini"))
                        : MODEL_OPTIONS
                      ).map((opt) => {
                        const isLocked =
                          opt.tier === "paid" && user?.tier === "free";
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                toast.error(
                                  "This premium model is locked on the Free tier. Upgrade your plan to access it!",
                                );
                                return;
                              }
                              setModel(opt.id);
                              setIsModelOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                              isLocked
                                ? "opacity-50 cursor-not-allowed text-gray-500"
                                : model === opt.id
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{opt.label}</span>
                              {isLocked ? (
                                <Lock
                                  size={12}
                                  className="text-zinc-500 shrink-0"
                                />
                              ) : model === opt.id ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Visual Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (mode === "general") {
                    setMode("visual");
                    setModel("gemini-3.5-flash");
                  } else {
                    setMode("general");
                  }
                }}
                className={`quick-chat-mode-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm shrink-0 ${
                  mode === "visual"
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                }`}
                title={mode === "visual" ? "Switch to General Mode" : "Switch to Visual Mode"}
              >
                <Image size={13} className={mode === "visual" ? "text-purple-400" : "text-gray-500"} />
                <span>{mode === "visual" ? "Visual" : "General"}</span>
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={streamChatMutation.isPending || !input.trim()}
              className={`p-2 rounded-xl transition-all ${
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
    </>
  );

  if (isSplit) {
    return (
      <div className="w-full h-full flex flex-col bg-neutral-900 overflow-hidden relative">
        {/* Split Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-200">
              Quick Context Chat
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isFromFileViewer && (
              <button
                onClick={() =>
                  (!existingSubChat || !isPinned) && stickToChatMutation.mutate()
                }
                disabled={
                  stickToChatMutation.isPending || subMessages.length === 0 || streamChatMutation.isPending
                }
                className={`quick-chat-stick-btn flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                  existingSubChat
                    ? "text-blue-400 bg-blue-500/10 border-blue-500/30 cursor-default"
                    : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/30"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Pin
                  size={14}
                  className={existingSubChat ? "fill-blue-400" : ""}
                />
                {(existingSubChat && isPinned) || isPinned
                  ? "Pinned to Chat"
                  : "Stick to Chat"}
              </button>
            )}

            {onToggleSplit && (
              <button
                onClick={onToggleSplit}
                className="quick-chat-split-btn text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 rounded-md p-1 transition-all"
                title="Dock as Modal"
              >
                <Columns size={16} className="text-blue-400" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {innerBodyContent}
      </div>
    );
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[40] ${showBackgroundContent ? "bg-transparent pointer-events-none" : "bg-black/10 backdrop-blur-sm"}`}
        onClick={!showBackgroundContent ? onClose : undefined}
      />

      <div className="fixed inset-0 z-[50] flex items-center justify-center pointer-events-none">
        <Draggable
          nodeRef={draggableNodeRef}
          handle=".quickchat-drag-handle"
          cancel="button, select, input, textarea, a"
          disabled={isMobile}
        >
          <div
            ref={draggableNodeRef}
            className={`pointer-events-auto bg-neutral-900 border-white/10 shadow-2xl flex flex-col overflow-hidden ${
              isMobile
                ? "w-full h-full border-0 rounded-none animate-in slide-in-from-bottom duration-300"
                : `w-[95vw] border rounded-2xl animate-in fade-in zoom-in-95 ${
                    isExpanded ? "max-w-6xl h-[92vh]" : "max-w-2xl h-[70vh]"
                  }`
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900 shrink-0 ${isMobile ? "" : "quickchat-drag-handle cursor-move"}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-200">
                  Quick Context Chat
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setShowBackgroundContent(!showBackgroundContent)
                  }
                  className={`quick-chat-visual-btn flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
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
                 {!isFromFileViewer && (
                  <button
                    onClick={() =>
                      (!existingSubChat || !isPinned) &&
                      stickToChatMutation.mutate()
                    }
                    disabled={
                      stickToChatMutation.isPending || subMessages.length === 0 || streamChatMutation.isPending
                    }
                    className={`quick-chat-stick-btn flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                      existingSubChat
                        ? "text-blue-400 bg-blue-500/10 border-blue-500/30 cursor-default"
                        : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border-transparent hover:border-blue-500/30"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Pin
                      size={14}
                      className={existingSubChat ? "fill-blue-400" : ""}
                    />
                    {(existingSubChat && isPinned) || isPinned
                      ? "Pinned to Chat"
                      : "Stick to Chat"}
                  </button>
                 )}

                {onToggleSplit && (
                  <button
                    onClick={onToggleSplit}
                    className="quick-chat-split-btn text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 rounded-md p-1 transition-all"
                    title="Split View"
                  >
                    <Columns size={16} />
                  </button>
                )}

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden md:inline-flex text-gray-500 hover:text-gray-300 transition-colors p-1"
                  title={isExpanded ? "Shrink" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {innerBodyContent}
          </div>
        </Draggable>
      </div>

      <DeckPickerModal
        isOpen={isDeckPickerOpen}
        onSelect={confirmRecall}
        onCancel={cancelRecall}
        isLoading={isRecalling}
      />
    </>,
    document.body,
  );
};
