import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Paperclip,
  Share,
  MoreVertical,
  ArrowUp,
  Image,
  Sparkles,
  ChevronDown,
  Check,
  StickyNote,
  Folder,
  Home,
  ChevronRight,
  Brain,
  X,
  GitBranch,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import type { VirtuosoHandle } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import "../styles/markdown.css";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import { setActiveSidebarRootId, toggleRecallOverlay } from "../../explorer/store/explorerSlice";
import DendritesLogo from "../../../components/DendritesLogo";
import { MessageContent } from "./MessageContent";
import { StreamingContext } from "../../../providers/StreamingContext";
import { QuickChatModal } from "./QuickChatModal.tsx";
import { DocumentBrowser } from "./DocumentBrowser";
import FileDisplay from "../../explorer/components/FileDisplay";
import RecallPage from "../../recall/components/RecallPage";


import { useChatDetails, useChatMessages } from "../hooks/useChatQueries";
import { useSendMessage } from "../hooks/useSendMessage";
import { useFileUpload } from "../hooks/useFileUpload";
import { useRecallActions } from "../hooks/useRecallActions";
import { useInheritContext } from "../hooks/useInheritContext";
import { useTextSelection } from "../hooks/useTextSelection";
import { useDocumentHistory } from "../hooks/useDocumentHistory";
import { useFlattenedMessages, useBreadcrumbs } from "../hooks/useChatHelpers";
import { useDebouncedValue } from "../../../components/common/useDebouncedValue.ts";
import { useQueryClient } from "@tanstack/react-query";


import type { Message } from "../types/Message";


const clampText = (text: string, maxLines: number = 3) => {
  const lines = text.split("\n");
  const isClamped = lines.length > maxLines;
  const clampedLines = lines.slice(0, maxLines).join("\n");
  return { clampedLines, isClamped, fullText: text };
};

const MessageBubble = React.memo(
  ({
    msg,
    onOpenSubChat,
    onCreateRecall,
    fileAttachment,
    onOpenSplitView,
  }: {
    msg: Message;
    onOpenSubChat: (msgId: string, subChatId: string) => void;
    onCreateRecall: (msgId: string) => void;
    fileAttachment?: { fileUrl: string; fileName: string };
    onOpenSplitView: (fileUrl: string, fileName: string) => void;
  }) => {
    const isUser = msg.role === "user";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const { clampedLines, isClamped, fullText } = clampText(msg.content, 3);

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
                  style={{ top: sc.relY }}
                  title="View sticky deep-dive"
                >
                  <StickyNote
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
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
          <div className="flex w-full gap-4 max-w-[95%] md:max-w-full group/bubble relative">
            <DendritesLogo className="mt-1 hidden sm:flex shrink-0" />

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

              {/* Sticky Note Icons */}
              {msg.hasSubChat &&
                msg.subChats?.map((sc) => (
                  <button
                    key={sc.subChatId}
                    onClick={() => onOpenSubChat(msg._id!, sc.subChatId)}
                    className="absolute right-full mr-4 p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group shadow-xl backdrop-blur-sm z-10"
                    style={{ top: sc.relY }}
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
    <div
      className={` ${isStreaming ? "pb-[80vh]" : "pb-32 "} ${isStreaming ? "md:pb-[80vh]" : "pb-32 "} max-w-4xl mx-auto w-full px-4 md:px-8 `}
    >
      {/* Streaming response */}
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

      {/* Typing indicator */}
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

interface ExternalSelectionAction {
  type: "ask" | "quick";
  text: string;
  nonce: number;
  fileAttachment?: {
    fileUrl: string;
    fileName: string;
  };
}

interface ChatWindowProps {
  externalSelectionAction?: ExternalSelectionAction | null;
  onExternalSelectionHandled?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  externalSelectionAction,
  onExternalSelectionHandled,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tree, isRecallOverlayOpen } = useAppSelector((state) => state.explorer);
  const queryClient = useQueryClient();

  const { data: chat, isLoading: isChatLoading } = useChatDetails(id);
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useChatMessages(id);

  const { messages, firstItemIndex } = useFlattenedMessages(messagesData);
  const breadCrumbs = useBreadcrumbs(tree, id);
  const latestMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const messageId = messages[index]?._id;
      if (messageId) return messageId;
    }
    return "";
  }, [messages]);

  const [mode, setMode] = useState<"general" | "visual">("general");
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [externalSelectedFile, setExternalSelectedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [externalQuickSelection, setExternalQuickSelection] = useState<{
    text: string;
    messageId: string;
    relativeY: number;
  } | null>(null);
  const [pinnedQuickChatSelection, setPinnedQuickChatSelection] = useState<{
    text: string;
    messageId: string;
    relativeY: number;
    subChatId: string | null;
  } | null>(null);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastHandledExternalActionRef = useRef<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [isTracerActive, setIsTracerActive] = useState(false);

  const openSplitView = useCallback(
    (fileUrl: string, fileName: string) => {
      if (!id) return;
      sessionStorage.setItem(
        "splitViewFile",
        JSON.stringify({ url: fileUrl, name: fileName }),
      );
      navigate(`/${id}/view-file`);
    },
    [id, navigate],
  );

 
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior,
        });
      }, 100);
    },
    [],
  );

  const { send, isStreaming, streamingText } = useSendMessage({
    chatId: id,
    mode,
    onStreamStart: () => scrollToBottom("smooth"),
    onStreamEnd: () => scrollToBottom("auto"),
  });

  const {
    selectedImageUrl,
    selectedFile,
    isUploading,
    documentUpload,
    isDocumentProcessing,
    canOpenSplitView,
    fileInputRef,
    handleFileSelect,
    clearImage,
    clearFile,
  } = useFileUpload(id);

  const { isRecalling, saveRecallCard } = useRecallActions(id);
  const {
    isModalOpen: isInheritModalOpen,
    openModal: openInheritModal,
    closeModal: closeInheritModal,
    inheritFromChat,
    unlinkInheritance,
  } = useInheritContext(id);
  const {
    selection,
    handleTextSelection,
    clearSelection,
    openSubChatSelection,
  } = useTextSelection();

  const {
    documents,
    isShowingBrowser,
    setIsShowingBrowser,
    removeDocument,
  } = useDocumentHistory(id);

  const debouncedStreamingText = useDebouncedValue(streamingText, 50);

  
  useEffect(() => {
    if (
      documentUpload?.status === "completed" &&
      documentUpload.fileUrl &&
      documentUpload.documentId
    ) {
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
    }
  }, [documentUpload?.documentId, documentUpload?.status, queryClient, id]);




  useEffect(() => {
    if (selectedImageUrl && selectedFile) {
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
    }
  }, [selectedImageUrl, selectedFile, queryClient, id]);




  // Tracer animation on Firebase push notification
  useEffect(() => {
    const handleNotification = () => {
      setIsTracerActive(true);
      setTimeout(() => setIsTracerActive(false), 12500);
    };
    window.addEventListener("recall:notification-pushed", handleNotification);
    return () =>
      window.removeEventListener(
        "recall:notification-pushed",
        handleNotification,
      );
  }, []);




  const handleSend = useCallback(() => {
    const effectiveSelectedFile = selectedFile ?? externalSelectedFile;
    if (
      (!input.trim() && !selectedImageUrl && !effectiveSelectedFile) ||
      isStreaming ||
      isUploading
    )
      return;
    const msg = input.trim();
    setInput("");
    send(msg, selectedImageUrl, effectiveSelectedFile);
    clearImage();
    clearFile();
    setExternalSelectedFile(null);
  }, [
    input,
    selectedImageUrl,
    selectedFile,
    externalSelectedFile,
    isStreaming,
    isUploading,
    send,
    clearImage,
    clearFile,
  ]);

  const handleOpenSubChat = useCallback(
    (messageId: string, subChatId: string) => {
      setExternalQuickSelection(null);
      setPinnedQuickChatSelection({
        text: "",
        messageId,
        relativeY: 0,
        subChatId,
      });
      openSubChatSelection(messageId, subChatId);
      setIsQuickChatOpen(true);
    },
    [openSubChatSelection],
  );

  const handleCreateRecall = useCallback(
    (markdownContent: string | null, msgId: string) => {
      saveRecallCard(markdownContent, msgId);
      clearSelection();
    },
    [saveRecallCard, clearSelection],
  );

  useEffect(() => {
    if (!externalSelectionAction) return;
    if (lastHandledExternalActionRef.current === externalSelectionAction.nonce)
      return;

    lastHandledExternalActionRef.current = externalSelectionAction.nonce;
    const selectedText = externalSelectionAction.text.trim();

    if (!selectedText) {
      onExternalSelectionHandled?.();
      return;
    }

    if (externalSelectionAction.type === "ask") {
      setExternalSelectedFile(
        externalSelectionAction.fileAttachment
          ? {
              url: externalSelectionAction.fileAttachment.fileUrl,
              name: externalSelectionAction.fileAttachment.fileName,
            }
          : null,
      );
      setInput(
        `Based on this selected text:\n\"\"\"\n${selectedText}\n\"\"\"\n\n`,
      );
      requestAnimationFrame(() => composerRef.current?.focus());
      onExternalSelectionHandled?.();
      return;
    }

    if (latestMessageId) {
      setExternalQuickSelection({
        text: selectedText,
        messageId: latestMessageId,
        relativeY: 0,
      });
      setPinnedQuickChatSelection({
        text: selectedText,
        messageId: latestMessageId,
        relativeY: 0,
        subChatId: null,
      });
      setIsQuickChatOpen(true);
    } else {
      setInput(
        `Based on this selected text:\n\"\"\"\n${selectedText}\n\"\"\"\n\n`,
      );
      requestAnimationFrame(() => composerRef.current?.focus());
    }

    onExternalSelectionHandled?.();
  }, [externalSelectionAction, latestMessageId, onExternalSelectionHandled]);

  const quickChatSelection = externalQuickSelection
    ? {
        text: externalQuickSelection.text,
        messageId: externalQuickSelection.messageId,
        relativeY: externalQuickSelection.relativeY,
        subChatId: null,
      }
    : pinnedQuickChatSelection
      ? pinnedQuickChatSelection
      : selection;

  const getFileAttachmentForMessage = useCallback((msg: Message) => {
    if (!msg.fileUrl || !msg.fileName) return undefined;
    return { fileUrl: msg.fileUrl, fileName: msg.fileName };
  }, []);

  
  const activeSelectedFile = selectedFile ?? externalSelectedFile;
  const documentStageLabel =
    documentUpload?.status === "queued"
      ? "Queued"
      : documentUpload?.status === "uploading" || documentUpload?.status === "uploaded"
        ? "Uploading"
        : documentUpload?.status === "chunking"
          ? "Chunking"
          : documentUpload?.status === "failed"
            ? "Failed"
            : "Ready";

  const clearAttachedFile = useCallback(() => {
    clearFile();
    setExternalSelectedFile(null);
  }, [clearFile]);

  return (
    <div
      className="flex flex-col h-screen  bg-white/1 text-gray-200 font-sans w-full relative overflow-hidden"
      onMouseUp={handleTextSelection}
    >
      {/* Animated Edge Tracer */}
      <div
        className={`violet-edge-tracer ${isTracerActive ? "active-tracer" : ""}`}
      ></div>

      {/* Top Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-(--theme-bg-base)/80 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center text-sm font-medium gap-1 min-w-0 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              dispatch(setActiveSidebarRootId(null));
              navigate("/explorer");
            }}
            className="flex items-center p-2 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group hover:scale-105 active:scale-95"
          >
            <Home
              size={15}
              className="text-zinc-500 group-hover:text-amber-200/90 transition-colors"
            />
          </button>
          <ChevronRight size={14} className="text-zinc-700 mx-0.5 shrink-0" />

          {breadCrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <button
                onClick={() => dispatch(setActiveSidebarRootId(crumb.id))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
              >
                <Folder
                  size={14}
                  className="text-zinc-600 group-hover:text-amber-200/90 transition-colors"
                />
                <span className="text-zinc-500 group-hover:text-zinc-200 transition-colors font-semibold">
                  {crumb.name}
                </span>
              </button>
              <ChevronRight
                size={14}
                className="text-zinc-700 mx-0.5 shrink-0"
              />
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

      {/* Messages Area */}
      <div className="flex-1 w-full relative">
        {isDocumentProcessing && documentUpload && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
            <div className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-zinc-900/90 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-300 tracking-wide uppercase">
                  Preparing document for RAG
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  {documentUpload.progress}%
                </span>
              </div>

              <p className="text-sm text-zinc-300 mb-4 truncate" title={documentUpload.fileName}>
                {documentUpload.fileName}
              </p>

              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, documentUpload.progress))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold">Stage: {documentStageLabel}</span>
                <span>{documentUpload.message || "Processing document..."}</span>
              </div>

              <p className="text-[11px] text-zinc-500 mt-4">
                Split view unlocks once processing is complete.
              </p>
            </div>
          </div>
        )}

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

            <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-[0.2em] px-1">
                  Neural Flow
                </span>
                <p className="text-[15px] text-zinc-300 font-medium">
                  Type below to begin a fresh mapping
                </p>
              </div>

              {/* Sophisticated OR separator */}
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-linear-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">OR</span>
                <div className="h-px flex-1 bg-linear-to-r from-transparent via-zinc-800 to-transparent"></div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-[0.2em] px-1">
                  Inherit Experience
                </span>
                
                {/* Premium Branch Indicator */}
                <div className="relative group/inherit">
                  <button
                    onClick={openInheritModal}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 border backdrop-blur-xl hover:scale-105 active:scale-95 ${
                      chat && (chat as any).contextParent
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-amber-200/90 hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]"
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${
                       chat && (chat as any).contextParent ? "bg-blue-500/20" : "bg-white/5"
                    }`}>
                      <GitBranch
                        size={18}
                        className={`${chat && (chat as any).contextParent ? "animate-pulse" : ""}`}
                      />
                    </div>
                    <div className="flex flex-col items-start min-w-[120px]">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                         {chat && (chat as any).contextParent ? "Active Link" : "Context"}
                       </span>
                       <span className="text-[13px] font-bold truncate max-w-[160px]">
                        {chat && (chat as any).contextParent
                          ? (chat as any).contextParent.title
                          : "Inherit Branch"}
                      </span>
                    </div>
                  </button>

                  {/* Unlink Button */}
                  {chat && (chat as any).contextParent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Disconnect this chat from its parent?")) {
                          unlinkInheritance();
                        }
                      }}
                      className="absolute -top-2 -right-2 p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-400/50 transition-all opacity-0 group-hover/inherit:opacity-100 shadow-2xl scale-75 group-hover/inherit:scale-100"
                      title="Unlink inheritance"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="w-full h-full"
            data={messages}
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={
              messages.length > 0 ? messages.length - 2 : 0
            }
            computeItemKey={(index, item) => item._id || String(index)}
            followOutput={false}
            increaseViewportBy={{ top: 4000, bottom: 4000 }}
            atBottomStateChange={(bottom) => setAtBottom(bottom)}
            context={{
              isFetchingNextPage,
              isStreaming,
              streamingText: debouncedStreamingText,
            }}
            startReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            itemContent={(_, msg) => (
              <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pb-0">
                <MessageBubble
                  msg={msg}
                  onOpenSubChat={handleOpenSubChat}
                  onCreateRecall={(msgId) => handleCreateRecall(null, msgId)}
                  fileAttachment={getFileAttachmentForMessage(msg)}
                  onOpenSplitView={openSplitView}
                />
              </div>
            )}
            components={{
              Header: VirtuosoHeader,
              Footer: VirtuosoFooter,
            }}
          />
        )}

        {/* Scroll to Bottom Button */}
        {!atBottom && messages.length > 0 && (
          <button
            onClick={() =>
              virtuosoRef.current?.scrollToIndex({
                index: messages.length - 1,
                align: "end",
                behavior: "smooth",
              })
            }
            className="absolute bottom-24 right-8 z-30 p-2.5 rounded-full bg-zinc-800/90 border border-white/10 text-white shadow-2xl hover:bg-zinc-700 transition-all hover:scale-110 active:scale-95 group"
            title="Scroll to bottom"
          >
            <ChevronDown
              size={20}
              strokeWidth={2.5}
              className="group-hover:translate-y-0.5 transition-transform"
            />
          </button>
        )}
      </div>

      {/* Input Container */}
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
              <img
                src={selectedImageUrl}
                alt="Selected upload"
                className="h-12 w-12 rounded-lg object-cover"
              />
              <span className="text-xs text-zinc-300">Image attached</span>
              <button
                onClick={clearImage}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-300"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeSelectedFile && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 backdrop-blur-sm">
              <span className="text-xs text-zinc-300 font-medium">
                📎 {activeSelectedFile.name}
              </span>
              <button
                onClick={() =>
                  canOpenSplitView &&
                  openSplitView(activeSelectedFile.url, activeSelectedFile.name)
                }
                disabled={!canOpenSplitView}
                className={`text-xs font-semibold px-2 py-1 rounded transition-colors border ${
                  canOpenSplitView
                    ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-blue-500/30 hover:border-blue-400/50"
                    : "text-zinc-500 border-zinc-700 cursor-not-allowed"
                }`}
                title="Open file in split-screen view"
              >
                {canOpenSplitView ? "View Split" : "Locked"}
              </button>
              <a
                href={activeSelectedFile.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gray-400 hover:text-gray-300 font-medium"
              >
                Open
              </a>

              <button
                onClick={clearAttachedFile}
                className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-300 transition-colors"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center bg-(--theme-bg-elevated)/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 md:px-4 py-3 md:py-3.5 focus-within:border-blue-500/50 focus-within:bg-(--theme-bg-elevated) transition-all shadow-2xl">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors hidden md:block group"
              disabled={isUploading || isStreaming}
              title="Upload image or file"
            >
              <Paperclip
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
            </button>

            <button
              onClick={() => setIsShowingBrowser(true)}
              className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors hidden md:block group"
              disabled={isStreaming}
              title={`View uploaded files (${documents.length})`}
            >
              <Paperclip
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              {documents.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {documents.length}
                </span>
              )}
            </button>

            {/* Mode Selector */}
            <div className="relative z-50 ">
              <button
                onClick={() => setIsModeOpen(!isModeOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 shadow-sm"
              >
                {mode === "general" ? (
                  <Sparkles size={14} className="text-blue-400" />
                ) : (
                  <Image size={14} className="text-purple-400" />
                )}
                <span className="hidden sm:inline">
                  {mode === "general" ? "General" : "Visual"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-500 transition-transform ${isModeOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isModeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsModeOpen(false)}
                  ></div>
                  <div className="absolute bottom-full left-0 mb-3 w-48 bg-(--theme-bg-surface) border border-zinc-700 shadow-2xl rounded-xl overflow-hidden py-1.5 z-50">
                    <button
                      onClick={() => {
                        setMode("general");
                        setIsModeOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Sparkles size={16} className="text-blue-400" />
                        <span>General Mode</span>
                      </div>
                      {mode === "general" && (
                        <Check size={16} className="text-blue-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMode("visual");
                        setIsModeOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 font-medium">
                        <Image size={16} className="text-purple-400" />
                        <span>Visual Mode</span>
                      </div>
                      {mode === "visual" && (
                        <Check size={16} className="text-purple-400" />
                      )}
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
                composerRef.current = el;
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
                disabled={
                  isStreaming ||
                  isUploading ||
                  (!input.trim() && !selectedImageUrl && !activeSelectedFile)
                }
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  (input.trim() || selectedImageUrl || activeSelectedFile) &&
                  !isStreaming &&
                  !isUploading
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
      {selection && selection.visible &&!isQuickChatOpen && (
        <div
          className="fixed z-99 -translate-x-1/2 -translate-y-full mb-4 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ top: selection.y - 10, left: selection.x }}
        >
          <button
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2"
            onClick={() => {
              setPinnedQuickChatSelection({
                text: selection.text,
                messageId: selection.messageId,
                relativeY: selection.relativeY ?? 0,
                subChatId: selection.subChatId,
              });
              setIsQuickChatOpen(true);
            }}
          >
            <Sparkles size={14} />
            Quick Chat
          </button>
          <button
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-purple-500 transition-all flex items-center gap-2"
            onClick={() =>
              handleCreateRecall(selection.markdown, selection.messageId)
            }
            disabled={isRecalling}
          >
            <Brain size={14} />
            {isRecalling ? "Saving..." : "Recall"}
          </button>
        </div>
      )}

      {/* Quick Chat Modal */}
      {quickChatSelection && (
        <QuickChatModal
          key={`${quickChatSelection.messageId}-${quickChatSelection.text}`}
          isOpen={isQuickChatOpen}
          onClose={() => {
            setIsQuickChatOpen(false);
            clearSelection();
            setExternalQuickSelection(null);
            setPinnedQuickChatSelection(null);
          }}
          selectedText={quickChatSelection.text}
          sourceMessageId={quickChatSelection.messageId}
          chatId={id}
          relativeY={quickChatSelection.relativeY}
          subChatId={quickChatSelection?.subChatId ?? undefined}
        />
      )}

      {/* Document Browser Modal */}
      <DocumentBrowser
        isOpen={isShowingBrowser}
        onClose={() => setIsShowingBrowser(false)}
        documents={documents}
        onOpenSplitView={openSplitView}
        onRemoveDocument={removeDocument}
      />

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
                  <h2 className="text-xl font-bold text-white leading-tight">
                    Choose Parent Experience
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Select a chat to inherit its context and history
                  </p>
                </div>
              </div>
              <button
                onClick={closeInheritModal}
                className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden relative">
              <FileDisplay
                isModal={true}
                onSelect={inheritFromChat}
                currentFolderId={chat?.folderId}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex justify-end items-center gap-4">
              <span className="text-xs text-zinc-600 font-medium italic">
                Click any chat item above to instantly link it as the parent
              </span>
              <button
                onClick={closeInheritModal}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recall Page Overlay */}
      {isRecallOverlayOpen && (
        <div className="fixed inset-0 z-[60] bg-(--theme-bg-base) animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden">
          <RecallPage onClose={() => dispatch(toggleRecallOverlay(false))} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
