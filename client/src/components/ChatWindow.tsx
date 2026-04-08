import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Paperclip, Share, MoreVertical, ArrowUp, Image, Sparkles, ChevronDown, Check, StickyNote, Folder, Home, ChevronRight, Brain, X, GitBranch } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import api from "../api/axios";
import "../styles/markdown.css";
import { useAppSelector, useAppDispatch } from "../store/store";
import type { FileNode } from "../types/types";
import { setActiveSidebarRootId } from "../store/explorerSlice";
import DendritesLogo from "./DendritesLogo";
import { MessageContent } from "./MessageContent";
import { StreamingContext } from "../contexts/StreamingContext";
import { QuickChatModal } from "./QuickChatModal.tsx";
import { streamingFetch } from "../api/streamingFetch";
import { requestFirebaseNotificationPermission } from "../firebase";
import { getMarkdownFromDOMSelection } from "../utils/markdownUtils";
import FileDisplay from "./FileDisplay";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface Message {
  _id?: string;
  role: "user" | "model" | "system";
  content: string;
  imageUrl?: string;
  hasSubChat?: boolean;
  subChats?: Array<{ subChatId: string; relY: number }>
}

const API_URL = import.meta.env.VITE_API_URL;


const MessageBubble = React.memo(({ msg, onOpenSubChat, onCreateRecall }: { msg: Message, onOpenSubChat: (msgId: string,subChatId:string) => void, onCreateRecall: (msgId: string) => void }) => {
    const isUser = msg.role === "user";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        data-message-id={msg._id}
        className={` flex w-full message-bubble-container group/bubble relative ${isUser ? "justify-end" : "justify-start"}`}
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
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="mb-3 rounded-xl border border-zinc-700 max-h-72 object-contain"
                />
              )}
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
            {/* Recall Button for User Message */}
            <div className="absolute top-0 right-full mr-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button
                onClick={() => onCreateRecall(msg._id!)}
                className="p-1.5 rounded-lg bg-zinc-800 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                title="Save as Recall Card"
              >
                <Brain size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full gap-4 max-w-[95%] md:max-w-[100%] group/bubble relative">
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
              <MessageContent content={msg.content} />
              
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
    <div className={` ${isStreaming ?"pb-[80vh]":"pb-32 "} ${isStreaming?"md:pb-[80vh]":"pb-32 "} max-w-4xl mx-auto w-full px-4 md:px-8 `}>
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
                <MessageContent content={streamingText} />
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
  
  console.log("rendering chatwinodw")
  const [selection, setSelection] = useState<{
    text: string;
    markdown: string;
    x: number;
    y: number;
    relativeY?: number;
    messageId: string;
    visible: boolean;
    subChatId:string | null
  } | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);

  const queryClient = useQueryClient();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [isTracerActive, setIsTracerActive] = useState(false);
  const [isInheritModalOpen, setIsInheritModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounce streaming text to reduce markdown re-renders during streaming
  const debouncedStreamingText = useDebouncedValue(streamingText, 50);
  // Trigger animation ONLY on Firebase push notification
  useEffect(() => {
    const handleNotification = () => {
      setIsTracerActive(true);
      setTimeout(() => setIsTracerActive(false), 12500); // 3 loops
    };
    window.addEventListener('recall:notification-pushed', handleNotification);
    return () => window.removeEventListener('recall:notification-pushed', handleNotification);
  }, []);

  const { tree } = useAppSelector((state) => state.explorer);

  const breadCrumbs = useMemo(() => {
    const path: { id: string; name: string }[] = [];

    function findPath(node: FileNode): boolean {
      if (node.type === "folder" && node.id !== "root") {
        path.push({ id: node.id, name: node.name });
      }

      if (node.id === id) {
        return true;
      }

      for (const child of node.children || []) {
        if (findPath(child)) return true;
      }

      if (node.type === "folder" && node.id !== "root") {
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
    
    const allPagesReversed = [...messagesData.pages].reverse();
    const mergedMessages = allPagesReversed.flatMap((p: any) => p.messages);
    let prepended = 0;
    for (let i = 1; i < messagesData.pages.length; i++) {
      prepended += messagesData.pages[i].messages?.length || 0;
    }

    return {
      messages: mergedMessages,
      firstItemIndex: Math.max(0, 10000 - prepended),
    };
  }, [messagesData]);

  const allowedDocumentMimeTypes = new Set([
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/xml",
    "text/xml",
    "application/yaml",
    "text/yaml",
    "application/x-yaml",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "application/octet-stream",
  ]);

  const allowedDocumentExtensions = new Set([
    ".pdf",
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".rtf",
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".sh",
    ".sql",
    ".html",
    ".css",
  ]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const ext = file.name.includes(".")
      ? `.${file.name.split(".").pop()?.toLowerCase()}`
      : "";
    const isDocument =
      allowedDocumentMimeTypes.has(file.type) || allowedDocumentExtensions.has(ext);

    if (!isImage && !isDocument) {
      alert("Please choose a valid image or supported document/code file.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append(isImage ? "image" : "file", file);

      const endpoint = isImage ? "/chats/upload-image" : "/chats/upload-file";
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res?.data?.data?.url;
      if (!uploadedUrl) {
        throw new Error("No URL returned from upload API");
      }
      if (isImage) {
        setSelectedImageUrl(uploadedUrl);
        setSelectedFile(null);
      } else {
        setSelectedFile({ name: file.name, url: uploadedUrl });
        setSelectedImageUrl(null);
      }
    } catch (error) {
      console.error("File upload failed", error);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImageUrl) || isStreaming || isUploadingImage) return;

    const userMessage = input.trim();
    const currentImageUrl = selectedImageUrl;
    setInput("");
    setSelectedImageUrl(null);
    
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

    const userTempId = `temp-${Date.now()}`;

    queryClient.setQueryData(["chatMessages", id], (old: any) => {
      console.log(old)
      if (!old || !old.pages || old.pages.length === 0) return old;
      
      const newPages = [...old.pages];
      // pages[0] is the newest fetch block. We append our new user message there chronologically.
      newPages[0] = {
        ...newPages[0],
        messages: [
          ...newPages[0].messages,
          {
            role: "user",
            content: userMessage || "Analyze this image",
            imageUrl: currentImageUrl || undefined,
            _id: userTempId,
          },
        ],
      };
      
      return { ...old, pages: newPages };
    });

    try {
      const response = await streamingFetch(`${API_URL}/chats/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, mode, imageUrl: currentImageUrl }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      let metadataIds: { userMessageId?: string; modelMessageId?: string } | null = null;
      
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

                // Check for metadata event containing the real database IDs
                if (parsed.type === "metadata") {
                  metadataIds = parsed;
                  continue;
                }

                fullReply += parsed.text;
                setStreamingText(fullReply);
                // await new Promise((r) => setTimeout(r, 100));
              } catch {
               // ignore partial json limits
              }
            }
          }
        }

        // Store metadata securely onto a dataset for the finally block
        (window as any)._latestChatMetadata = metadataIds;
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
        
        const metadataIds = (window as any)._latestChatMetadata;
        (window as any)._latestChatMetadata = null; // cleanup
        
        const newPages = [...old.pages];
        let newMessages = [...newPages[0].messages];
        
       
        if (finalAIResponse.trim()) {
           newMessages.push({ 
             role: "model", 
             content: finalAIResponse, 
             _id: metadataIds?.modelMessageId || `temp-ai-${Date.now()}` 
           });
        }
        
        //  update the temporary user message with its real DB ID
        if (metadataIds?.userMessageId) {
           newMessages = newMessages.map(m => 
             m._id === userTempId ? { ...m, _id: metadataIds.userMessageId } : m
           );
        }
        
        newPages[0] = { ...newPages[0], messages: newMessages };
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
    }
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = sel?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();  
      
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

      if (rect && messageId && bubbleElement) {
        const bubbleRect = bubbleElement.getBoundingClientRect();
        const relativeY = rect.top - bubbleRect.top;

       
        const capturedMarkdown = getMarkdownFromDOMSelection() || selectedText;

        setSelection({
          text: selectedText,
          markdown: capturedMarkdown,
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

  const handleOpenSubChat = useCallback((messageId: string, subChatId: string) => {
    console.log(messageId, subChatId);
    setSelection({
      text: "", // Modal will fetch it
      markdown: "",
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      messageId,
      visible: false,
      subChatId: subChatId,
    });
    setIsQuickChatOpen(true);
  }, []);

  const handleCreateRecall = useCallback(
    async (markdownContent: string | null, msgId: string) => {
      try {
        if (isRecalling) return;
        setIsRecalling(true);

      
        await requestFirebaseNotificationPermission();

        await api.post(`/recall/save`, {
         
          content: markdownContent || null,
          chatId: id,
          msgId: msgId,
        });
        // Invalidate queries so the badge count at least updates background data
        queryClient.invalidateQueries({ queryKey: ["recallCount"] });

        setSelection(null);
      } catch (error) {
        console.error("Failed to save recall card", error);
      } finally {
        setIsRecalling(false);
      }
    },
    [id, queryClient, isRecalling]
  );

  return (
    <div 
      className="flex flex-col h-screen bg-[var(--theme-bg-base)] text-gray-200 font-sans w-full relative overflow-hidden"
      onMouseUp={handleTextSelection}
    >
      {/* Animated Edge Tracer - Only active when notification (recall save) comes */}
      <div className={`violet-edge-tracer ${isTracerActive ? 'active-tracer' : ''}`}></div>

      {/* Top Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-(--theme-bg-base)/80 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center text-sm font-medium gap-1 min-w-0 overflow-x-auto no-scrollbar py-1">
          <button 
            onClick={() => {
              dispatch(setActiveSidebarRootId(null));
              navigate("/explorer"); 
            }}
            className="flex items-center p-2 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group hover:scale-105 active:scale-95"
          >
             <Home size={15} className="text-zinc-500 group-hover:text-amber-200/90 transition-colors" />
          </button>
          <ChevronRight size={14} className="text-zinc-700 mx-0.5 shrink-0" />
          
          {breadCrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <button 
                onClick={() => {
                  dispatch(setActiveSidebarRootId(crumb.id));
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
              >
                <Folder size={14} className="text-zinc-600 group-hover:text-amber-200/90 transition-colors" />
                <span className="text-zinc-500 group-hover:text-zinc-200 transition-colors font-semibold">{crumb.name}</span>
              </button>
              <ChevronRight size={14} className="text-zinc-700 mx-0.5 shrink-0" />
            </React.Fragment>
          ))}
          
          <div className="ml-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-[0_0_20px_-10px_rgba(245,158,11,0.4)] animate-in fade-in zoom-in duration-300">
            <span className="text-amber-200/90 font-bold tracking-tight text-[13px]">
              {chat?.title || "New Chat"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 shrink-0 ml-4">
          <button className="p-2 hover:bg-zinc-800/80 hover:text-amber-200/90 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95">
            <Share size={18} />
          </button>
          <button className="p-2 hover:bg-zinc-800/80 hover:text-amber-200/90 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95">
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
          <div className="flex flex-col items-center mt-20 px-8 max-w-4xl mx-auto w-full text-center">
            <DendritesLogo size={80} className="mb-6 opacity-80" />

            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Welcome to Dendrites
            </h1>
            <p className="text-zinc-500 text-lg mb-10 max-w-md mx-auto">
              How can I help with your research or development today?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setIsInheritModalOpen(true)}
                className="group flex items-center gap-3 px-6 py-3.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_-10px_rgba(245,158,11,0.5)]"
              >
                <div className="p-2 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/40 transition-colors">
                  <GitBranch size={18} className="text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-bold text-amber-200/90 leading-tight">Inherit Experience</div>
                  <div className="text-[11px] text-amber-500/70 font-medium">Link this chat to a parent context</div>
                </div>
              </button>

              <div className="hidden sm:block h-10 w-px bg-zinc-800 mx-2"></div>
              
              <div className="flex flex-col items-start gap-1">
                 <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest px-1">Quick Start</span>
                 <p className="text-[13px] text-zinc-500 italic px-1">Just type below to start a fresh thread</p>
              </div>
            </div>
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
            increaseViewportBy={{ top: 4000, bottom: 4000 }}
            atBottomStateChange={(bottom) => setAtBottom(bottom)}
            context={{ isFetchingNextPage, isStreaming, streamingText: debouncedStreamingText }}
            startReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            itemContent={(_, msg) => (
              <div className={`max-w-4xl mx-auto w-full px-4 md:px-8 pb-0`}>
                <MessageBubble msg={msg} onOpenSubChat={handleOpenSubChat} onCreateRecall={(msgId) => handleCreateRecall(null, msgId)} />
              </div>
            )}
            components={{
              Header: VirtuosoHeader,
              Footer: VirtuosoFooter
            }}
          />
        )}

        {/* Scroll to Bottom Button */}
        {!atBottom && messages.length > 0 && (
          <button
            onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' })}
            className="absolute bottom-24 right-8 z-30 p-2.5 rounded-full bg-zinc-800/90 border border-white/10 text-white shadow-2xl hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95 group"
            title="Scroll to bottom"
          >
            <ChevronDown size={20} strokeWidth={2.5} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Input Container - Floating with Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 pt-20 pb-6 px-4 md:px-8 border-none pointer-events-none bg-linear-to-t from-(--theme-bg-base) via-(--theme-bg-base)/95 to-transparent">
        <div className="max-w-4xl mx-auto relative pointer-events-auto ">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.md,.csv,.json,.xml,.yaml,.yml,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.py,.js,.ts,.tsx,.jsx,.java,.c,.cpp,.h,.hpp,.go,.rs,.php,.rb,.sh,.sql,.html,.css"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />

          {selectedImageUrl && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-2 py-2">
              <img src={selectedImageUrl} alt="Selected upload" className="h-12 w-12 rounded-lg object-cover" />
              <span className="text-xs text-zinc-300">Image attached</span>
              <button
                onClick={() => setSelectedImageUrl(null)}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-300"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {selectedFile && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-2 py-2">
              <span className="text-xs text-zinc-300">File attached: {selectedFile.name}</span>
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                View
              </a>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-300"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center bg-[var(--theme-bg-elevated)]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 md:px-4 py-3 md:py-3.5 focus-within:border-blue-500/50 focus-within:bg-[var(--theme-bg-elevated)] transition-all shadow-2xl">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors hidden md:block group"
              disabled={isUploadingImage || isStreaming}
              title="Upload image or file"
            >
              <Paperclip
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
            </button>
            
            {/* Mode Selector */}
            <div className="relative z-50 ">
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

            <textarea
              placeholder="Ask follow-up or research next steps..."
              className="flex-1  bg-transparent border-none outline-none px-3 text-[16px] text-gray-200 placeholder:text-gray-500 resize-none max-h-48 py-1 overflow-y-auto no-scrollbar"
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
                disabled={isStreaming || isUploadingImage || (!input.trim() && !selectedImageUrl)}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  (input.trim() || selectedImageUrl) && !isStreaming && !isUploadingImage
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

      {/* Floating Actions Trigger */}
      {selection && selection.visible && (
        <div 
          className="fixed z-99 -translate-x-1/2 -translate-y-full mb-4 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ top: selection.y - 10, left: selection.x }}
        >
          <button
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2"
            onClick={() => setIsQuickChatOpen(true)}
          >
            <Sparkles size={14} />
            Quick Chat
          </button>
          <button
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-purple-500 transition-all flex items-center gap-2"
            onClick={() => handleCreateRecall(selection.markdown, selection.messageId)}
            disabled={isRecalling}
          >
            <Brain size={14} />
            {isRecalling ? "Saving..." : "Recall"}
          </button>
        </div>
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

      {/* Inherit Context Modal */}
      {isInheritModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
          <div className="bg-(--theme-bg-surface) border border-zinc-800 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <GitBranch size={24} className="text-amber-400" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white leading-tight">Choose Parent Experience</h2>
                   <p className="text-sm text-zinc-500">Select a chat to inherit its context and history</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInheritModalOpen(false)}
                className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - The File Explorer */}
            <div className="flex-1 overflow-hidden relative">
               <FileDisplay 
                 isModal={true} 
                 onSelect={async (node) => {
                    if (node.type === 'chat') {
                       try {
                        console.log(node)
                         await api.patch(`/branch/inherit/${id}`, { contextParentId: node.id });
                         queryClient.invalidateQueries({ queryKey: ["chat", id] });
                         setIsInheritModalOpen(false);
                         // Trigger a toast or local feedback here if available
                       } catch (err) {
                         console.error("Failed to link context:", err);
                       }
                    }
                 }} 
               />
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex justify-end items-center gap-4">
              <span className="text-xs text-zinc-600 font-medium italic">Click any chat item above to instantly link it as the parent</span>
              <button 
                onClick={() => setIsInheritModalOpen(false)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
