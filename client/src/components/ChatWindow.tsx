import React, { useState, useRef, useEffect, useMemo } from "react";
import { Paperclip, Bot, Share, MoreVertical, ArrowUp } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/markdown.css";
import remarkGfm from "remark-gfm";
import { useAppSelector } from "../store/store";
import type { FileNode } from "../types/types";

interface Message {
  _id?: string;
  role: "user" | "model" | "system";
  content: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const markdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    return match ? (
      <div className="my-5 rounded-xl overflow-hidden border border-white/5 bg-[var(--theme-bg-surface)] shadow-lg">
        {/* Language header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--theme-bg-elevated)] border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            <span>{match[1].toUpperCase()}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded hover:bg-white/5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        {/* Code block */}
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            background: "transparent",
            fontSize: "14.5px",
            lineHeight: "1.6",
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-[var(--theme-bg-surface)] px-1.5 py-0.5 rounded-md text-blue-300 text-[14.5px] border border-white/5"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }: any) {
    return <>{children}</>;
  },
};

const MessageBubble = React.memo(({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex w-full message-enter ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isUser ? (
        <div className="flex flex-col items-end max-w-[85%] md:max-w-[70%]">
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[12px] text-gray-500 font-medium">
              {time}
            </span>
            <span className="text-[13px] font-semibold text-gray-300">
              Researcher
            </span>
          </div>
          <div className="px-5 py-3.5 rounded-2xl rounded-tr-sm bg-[var(--theme-bg-surface)] border border-zinc-800 text-[16px] leading-relaxed whitespace-pre-wrap text-gray-200 shadow-sm">
            {msg.content}
          </div>
        </div>
      ) : (
        <div className="flex w-full gap-4 max-w-[95%] md:max-w-[100%]">
          <div className="w-8 h-8 rounded bg-[var(--theme-bg-surface)] border border-blue-500/20 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-blue-500/10 hidden sm:flex">
            <Bot size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
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
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const ChatWindow: React.FC = () => {
  const { id } = useParams();
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { data: chat, isLoading } = useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      const res = await api.get(`/chats/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const messages: Message[] = chat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    queryClient.setQueryData(["chat", id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          { role: "user", content: userMessage, _id: `temp-${Date.now()}` },
        ],
      };
    });

    try {
      const response = await fetch(`${API_URL}/chats/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
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
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["chat", id] });
      setStreamingText("");
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-bg-base)] text-gray-200 font-sans w-full relative overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[var(--theme-bg-base)] shrink-0">
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
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 md:pb-40 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading messages...
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="flex items-center gap-4 mt-4">
              <div className="bg-[var(--theme-bg-surface)] p-2 rounded-lg border border-zinc-800">
                <Bot size={24} className="text-gray-400" />
              </div>
              <h1 className="text-lg font-medium text-gray-200">
                Welcome to Dendrite. How can I help with your research today?
              </h1>
            </div>
          ) : (
            <div
              className={`flex flex-col gap-6 ${isStreaming ? "pb-[40vh]" : ""}`}
            >
              {messages.map((msg, i) => (
                <MessageBubble key={msg._id || i} msg={msg} />
              ))}

              {/* Streaming response — grows in real time */}
              {streamingText && (
                <div className="flex w-full gap-4 max-w-[95%] md:max-w-[85%] streaming-bubble">
                  <div className="w-8 h-8 rounded bg-[var(--theme-bg-surface)] border border-blue-500/20 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-blue-500/10 hidden sm:flex">
                    <Bot size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-semibold text-gray-200">
                        AI ASSISTANT
                      </span>
                      <span className="text-[12px] text-gray-500 font-medium">
                        typing...
                      </span>
                    </div>
                    <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-hidden">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {streamingText}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-blue-400 ml-1 rounded-sm streaming-cursor align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator before first chunk arrives */}
              {isStreaming && !streamingText && (
                <div className="flex w-full gap-4 max-w-[95%] md:max-w-[85%] streaming-bubble">
                  <div className="w-8 h-8 rounded bg-[var(--theme-bg-surface)] border border-blue-500/20 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-blue-500/10 hidden sm:flex">
                    <Bot size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-semibold text-gray-200">
                        AI ASSISTANT
                      </span>
                    </div>
                    <div className="flex gap-1.5 py-2">
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Container - Floating with Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-[85vw] pt-20 pb-6 px-4 md:px-8 border-none pointer-events-none bg-linear-to-t from-[var(--theme-bg-base)] via-[calc(var(--theme-bg-base)/95)] to-transparent">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          <div className="flex items-center bg-[var(--theme-bg-elevated)]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 md:px-4 py-3 md:py-3.5 focus-within:border-blue-500/50 focus-within:bg-[var(--theme-bg-elevated)] transition-all shadow-2xl">
            <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors hidden md:block group">
              <Paperclip
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
            </button>

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
    </div>
  );
};

export default ChatWindow;
