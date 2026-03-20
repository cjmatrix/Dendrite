import React, { useState, useRef, useMemo, useCallback } from "react";
import { Paperclip, Share, MoreVertical, ArrowUp, Image, Sparkles, ChevronDown, Check, StickyNote } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import api from "../api/axios";
import ReactMarkdown from "react-markdown";
import "../styles/markdown.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useAppSelector } from "../store/store";
import type { FileNode } from "../types/types";
import DendritesLogo from "./DendritesLogo";
import { markdownComponents } from "./markdown/MarkdownComponents";
import { StreamingContext } from "../contexts/StreamingContext";
import { QuickChatModal } from "./QuickChatModal.tsx";

interface Message {
  _id?: string;
  role: "user" | "model" | "system";
  content: string;
  hasSubChat?: boolean;
  subChats?: Array<{ subChatId: string; relY: number }>;
}

const API_URL = import.meta.env.VITE_API_URL;


const MessageBubble = React.memo(({ msg, onOpenSubChat }: { msg: Message, onOpenSubChat: (msgId: string,subChatId:string) => void }) => {
    const isUser = msg.role === "user";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        data-message-id={msg._id}
        className={` flex w-full message-bubble-container ${isUser ? "justify-end" : "justify-start"}`}
      >
        {isUser ? (
          <div className="flex flex-col items-end max-w-[85%] md:max-w-[70%] relative">
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-[12px] text-gray-500 font-medium">
                {time}
              </span>
              <span className="text-[13px] font-semibold text-gray-300">
                Researcher
              </span>
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-tr-sm bg-(--theme-bg-surface) border border-zinc-800 text-[16px] leading-relaxed whitespace-pre-wrap text-gray-200 shadow-sm">
              {msg.content}
            </div>

            {/* Sticky Notes for User Message */}
            {msg.hasSubChat && msg.subChats?.map((sc) => (
              <button 
                key={sc.subChatId}
                onClick={() => onOpenSubChat(msg._id!, sc.subChatId)}
                className="absolute left-full ml-4 p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group shadow-xl backdrop-blur-sm z-10"
                style={{ top: sc.relY }}
                title="View sticky deep-dive"
              >
                <StickyNote size={14} className="group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex w-full gap-4 max-w-[95%] md:max-w-[100%]">
            <DendritesLogo
            
              className="mt-1 hidden sm:flex shrink-0"
            />

            <div className="flex-1 flex flex-col min-w-0 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[13px] font-semibold text-gray-200">
                  AI ASSISTANT
                </span>
                <span className="text-[12px] text-gray-500 font-medium">
                  {time}
                </span>
              </div>
              <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              
              {/* Sticky Note Icons - Positioned horizontally to selection */}
              {msg.hasSubChat && msg.subChats?.map((sc) => (
                <button 
                  key={sc.subChatId}
                  onClick={() => onOpenSubChat(msg._id!, sc.subChatId)}
                  className="absolute right-full mr-4 p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group shadow-xl backdrop-blur-sm z-10"
                  style={{ top: sc.relY }}
                  title="View sticky deep-dive"
                >
                  <StickyNote size={14} className="group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

const VirtuosoHeader = ({ context }: any) => {
  const { isFetchingNextPage } = context;
  return (
    <div className="h-20 flex items-center justify-center">
      {isFetchingNextPage && (
        <div className="py-4 text-center text-sm font-medium text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
          Loading history...
        </div>
      )}
    </div>
  );
};

const VirtuosoFooter = ({ context }: any) => {
  const { isStreaming, streamingText } = context;
  return (
    <div className={` ${isStreaming ?"pb-[80vh]":"pb-32 "} ${isStreaming?"md:pb-[80vh]":"pb-32 "} max-w-4xl mx-auto w-full px-4 md:px-8`}>
      {/* Streaming response — grows in real time */}
      {streamingText && (
        <div className="flex w-full gap-4 max-w-[95%] md:max-w-[85%] streaming-bubble mt-6">
          <DendritesLogo
            isLoading={true}
            className="mt-1 hidden sm:flex shrink-0"
          />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[13px] font-semibold text-gray-200 uppercase tracking-wider">
                Dendrites AI
              </span>
            </div>
            <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-hidden">
              <StreamingContext.Provider value={true}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {streamingText}
                </ReactMarkdown>
              </StreamingContext.Provider>
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 rounded-sm streaming-cursor align-middle" />
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator before first chunk arrives */}
      {isStreaming && !streamingText && (
        <div className="flex w-full gap-4 max-w-[95%] md:max-w-[85%] streaming-bubble mt-6">
          <DendritesLogo
            isLoading={true}
            className="mt-1 hidden sm:flex shrink-0"
          />
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-bold text-gray-300 tracking-widest uppercase">
                Thinking
              </span>
              <span className="flex gap-1.5">
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium italic mt-0.5">
              Mapping neural pathways...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatWindow: React.FC = () => {
  const { id } = useParams();
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<"general" | "visual">("general");
  const [isModeOpen, setIsModeOpen] = useState(false);
  
  
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
    relativeY?: number;
    messageId: string;
    visible: boolean;
    subChatId:string | null
  } | null>(null);
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);

  const queryClient = useQueryClient();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const { tree } = useAppSelector((state) => state.explorer);

  const breadCrumbs = useMemo(() => {
    const path: string[] = [];

    function findPath(node: FileNode): boolean {
      if (node.type === "folder") {
        path.push(node.name);
      }

      if (node.id === id) {
        return true;
      }

      for (const child of node.children || []) {
        if (findPath(child)) return true;
      }

      if (node.type === "folder") {
        path.pop();
      }
      return false;
    }

    findPath(tree);
    return path;
  }, [tree, id]);

  const { data: chat, isLoading: isChatLoading } = useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useInfiniteQuery({
    queryKey: ["chatMessages", id],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam = null }) => {
      const res = await api.get(`/chats/${id}/messages`, {
        params: { cursor: pageParam, limit: 10 },
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { messages, firstItemIndex } = useMemo(() => {
    if (!messagesData) return { messages: [], firstItemIndex: 10000 };
    // pages is an array: [newestBatch, olderBatch, oldestBatch]
    // inside each batch, messages are chronological [old, new, newest]
    const allPagesReversed = [...messagesData.pages].reverse();
    const mergedMessages = allPagesReversed.flatMap((p: any) => p.messages);

    // Calculate how many items were fetched from older pages
    // pages[0] is the newest batch. pages[1...N] are the older batches.
    let prepended = 0;
    for (let i = 1; i < messagesData.pages.length; i++) {
      prepended += messagesData.pages[i].messages?.length || 0;
    }

    return {
      messages: mergedMessages,
      firstItemIndex: Math.max(0, 10000 - prepended),
    };
  }, [messagesData]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    
    // Explicitly snap user down to the bottom to see their sent message and the incoming stream
    // Using a slightly longer timeout (100ms) to ensure React has completely painted the DOM with the new message
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({
        index: "LAST",
        align: "start",
        behavior: "smooth",
      });
    }, 100);

    setIsStreaming(true);
    setStreamingText("");

    queryClient.setQueryData(["chatMessages", id], (old: any) => {
      if (!old || !old.pages || old.pages.length === 0) return old;
      
      const newPages = [...old.pages];
      // pages[0] is the newest fetch block. We append our new user message there chronologically.
      newPages[0] = {
        ...newPages[0],
        messages: [
          ...newPages[0].messages,
          { role: "user", content: userMessage, _id: `temp-${Date.now()}` },
        ],
      };
      
      return { ...old, pages: newPages };
    });

    try {
      const response = await fetch(`${API_URL}/chats/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, mode }),
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              fullReply += parsed.text;
              setStreamingText(fullReply);
              await new Promise((r) => setTimeout(r, 100));
            } catch {
             
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      // Because cursor pagination bounds violently break if we invalidate while infinite scrolling,
      // we must locally insert the completed AI response to perfectly preserve scroll boundaries!
      let finalAIResponse = streamingText;
      
      // Safety wrapper to ensure we capture the final state using the functional update
      setStreamingText((currentStream) => {
        finalAIResponse = currentStream;
        return currentStream;
      });

      queryClient.setQueryData(["chatMessages", id], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) return old;
        
        const newPages = [...old.pages];
        // Ensure we actually have a response string before appending blank blocks
        if (finalAIResponse.trim()) {
           newPages[0] = {
             ...newPages[0],
             messages: [
               ...newPages[0].messages,
               { role: "model", content: finalAIResponse, _id: `temp-ai-${Date.now()}` },
             ],
           };
        }
        
        return { ...old, pages: newPages };
      });
      
      setStreamingText("");
      setIsStreaming(false);

      
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior: "auto",
        });
      }, 100);
      
  
      queryClient.invalidateQueries({ queryKey: ["chatMessages", id] });
    }
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = sel?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();  

      console.log(sel)
      let messageId = "";
      let bubbleElement: HTMLElement | null = null;
      let curr: any = sel?.anchorNode;
      while (curr && curr !== document.body) {
        if (curr.dataset?.messageId) {
          messageId = curr.dataset.messageId;
          bubbleElement = curr;
          break;
        }
        curr = curr.parentElement;
      }
      console.log(messageId)
      if (rect && messageId && bubbleElement) {
        const bubbleRect = bubbleElement.getBoundingClientRect();
        const relativeY = rect.top - bubbleRect.top;

        setSelection({
          text: selectedText,
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          relativeY,
          messageId,
          visible: true,
          subChatId:null
        });
      }
    } else {
      // Small timeout to allow the button click to happen before it disappears
      setTimeout(() => setSelection(prev => prev ? { ...prev, visible: false } : null), 200);
    }
  };

  const handleOpenSubChat = useCallback((messageId: string,subChatId:string) => {
    console.log(messageId,subChatId)
    setSelection({
      text: "", // Modal will fetch it
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      messageId,
      visible: false,
      subChatId:subChatId
    });
    setIsQuickChatOpen(true);
  }, []);

  return (
    <div 
      className="flex flex-col h-screen bg-[var(--theme-bg-base)] text-gray-200 font-sans w-full relative overflow-hidden"
      onMouseUp={handleTextSelection}
    >
      {/* Top Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[var(--theme-bg-base)] shrink-0 z-10">
        <div className="flex items-center text-sm font-medium">
          {breadCrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              <span className="text-gray-500">{crumb}</span>
              <span className="mx-2 text-gray-600">/</span>
            </span>
          ))}
          <span className="text-gray-200">{chat?.title || "New Chat"}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-gray-200 transition-colors">
            <Share size={18} />
          </button>
          <button className="hover:text-gray-200 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area Full-Width Wrapper  */}
      <div className="flex-1 w-full relative">
        {isChatLoading || isMessagesLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="flex items-center gap-4 mt-8 px-8 max-w-4xl mx-auto w-full">
            <DendritesLogo className="shrink-0" />

            <h1 className="text-lg font-medium text-gray-200">
              Welcome to Dendrite. How can I help with your research today?
            </h1>
          </div>
        ) : (
          
          <Virtuoso
            ref={virtuosoRef}
            className="w-full h-full"
            data={messages}
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={messages.length > 0 ? messages.length - 2 : 0}
            computeItemKey={(index, item) => item._id || String(index)}
            followOutput={false}
            increaseViewportBy={{ top: 800, bottom: 800 }}
            context={{ isFetchingNextPage, isStreaming, streamingText }}
            startReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            itemContent={(_, msg) => (
              <div className={`max-w-4xl mx-auto w-full px-4 md:px-8 pb-0`}>
                <MessageBubble msg={msg} onOpenSubChat={handleOpenSubChat} />
              </div>
            )}
            components={{
              Header: VirtuosoHeader,
              Footer: VirtuosoFooter
            }}
          />
        )}
      </div>

      {/* Input Container - Floating with Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-[85vw] pt-20 pb-6 px-4 md:px-8 border-none pointer-events-none bg-linear-to-t from-(--theme-bg-base) via-(--theme-bg-base)/95 to-transparent">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          <div className="flex items-center bg-[var(--theme-bg-elevated)]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 md:px-4 py-3 md:py-3.5 focus-within:border-blue-500/50 focus-within:bg-[var(--theme-bg-elevated)] transition-all shadow-2xl">
            <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors hidden md:block group">
              <Paperclip
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
            </button>
            
            {/* Mode Selector */}
            <div className="relative z-50">
              <button 
                onClick={() => setIsModeOpen(!isModeOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 shadow-sm"
              >
                {mode === "general" ? <Sparkles size={14} className="text-blue-400" /> : <Image size={14} className="text-purple-400" />}
                <span className="hidden sm:inline">{mode === "general" ? "General" : "Visual"}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isModeOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isModeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModeOpen(false)}></div>
                  <div className="absolute bottom-full left-0 mb-3 w-48 bg-(--theme-bg-surface) border border-zinc-700 shadow-2xl rounded-xl overflow-hidden py-1.5 z-50">
                    <button 
                      onClick={() => { setMode("general"); setIsModeOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Sparkles size={16} className="text-blue-400" />
                        <span>General Mode</span>
                      </div>
                      {mode === "general" && <Check size={16} className="text-blue-400" />}
                    </button>
                    <button 
                      onClick={() => { setMode("visual"); setIsModeOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Image size={16} className="text-purple-400" />
                        <span>Visual Mode</span>
                      </div>
                      {mode === "visual" && <Check size={16} className="text-purple-400" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            <input
              type="text"
              placeholder="Ask follow-up or research next steps..."
              className="flex-1 bg-transparent border-none outline-none px-3 text-[16px] text-gray-200 placeholder:text-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
            />

            <div className="flex items-center gap-3 pl-2">
              <span className="text-[10px] font-medium text-gray-500 hidden md:block uppercase tracking-wider">
                Cmd + Enter
              </span>
              <button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  input.trim() && !isStreaming
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Chat Trigger */}
      {selection && selection.visible && (
        <button
          className="fixed z-99 -translate-x-1/2 -translate-y-full mb-4 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ top: selection.y - 10, left: selection.x }}
          onClick={() => setIsQuickChatOpen(true)}
        >
          <Sparkles size={14} />
          Quick Chat
        </button>
      )}

      {/* Quick Chat Modal */}
      {selection && (
        <QuickChatModal
          key={`${selection.messageId}-${selection.text}`}
          isOpen={isQuickChatOpen}
          onClose={() =>{ setIsQuickChatOpen(false)
                          setSelection(null)
          }}
          selectedText={selection.text}
          sourceMessageId={selection.messageId}
          chatId={id}
          relativeY={selection.relativeY}
          subChatId={selection?.subChatId ?? undefined}
        />
      )}
    </div>
  );
};

export default ChatWindow;
