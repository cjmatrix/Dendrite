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
  Folder,
  Home,
  ChevronRight,
  Brain,
  X,
  GitBranch,
  Square,
  Cpu,
  Key,
  Shield,
  Files,
  Lock,
  AlertCircle,
  Download,
  MessageSquareHeart,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import type { VirtuosoHandle } from "react-virtuoso";
import { isAxiosError } from "axios";
import { Virtuoso } from "react-virtuoso";
import "../styles/markdown.css";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import { setActiveSidebarRootId } from "../../explorer/store/explorerSlice";
import DendritesLogo from "../../../components/DendritesLogo";
import { QuickChatModal } from "./QuickChatModal.tsx";
import { DocumentBrowser } from "./DocumentBrowser";
import { SettingsModal } from "./SettingsModal";
import FileDisplay from "../../explorer/components/FileDisplay";
import { ShareLinkModal } from "../../explorer/components/ShareLinkModal";
import { ImportSharedModal } from "../../explorer/components/ImportSharedModal";
import { FeedbackModal } from "./FeedbackModal";
import toast from "react-hot-toast";
import { useResizable } from "../../../hooks/useResizable";

import { MessageBubble } from "./MessageBubble";
import { VirtuosoHeader } from "./VirtuosoHeader";
import { VirtuosoFooter } from "./VirtuosoFooter";

import { useChatDetails, useChatMessages } from "../hooks/useChatQueries";
import { useSendMessage } from "../hooks/useSendMessage";
import { useFileUpload } from "../hooks/useFileUpload";
import { useRecallActions } from "../hooks/useRecallActions";
import { useInheritContext } from "../hooks/useInheritContext";
import { useTextSelection } from "../hooks/useTextSelection";
import { useDocumentHistory } from "../hooks/useDocumentHistory";
import { useFlattenedMessages, useBreadcrumbs } from "../hooks/useChatHelpers";
import { DEFAULT_MODEL, MODEL_OPTIONS} from "../constants/models";
import { useQueryClient } from "@tanstack/react-query";
import { useSendAgentMessageMutation } from "../hooks/useAgentMutation.ts";

import type { Message } from "../types/Message";


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
  const { id, token } = useParams<{ id?: string, token?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tree, isShareMode } = useAppSelector((state) => state.explorer);
  const queryClient = useQueryClient();

  const { data: chat, isLoading: isChatLoading, error: chatError } = useChatDetails(id);

  useEffect(() => {
    if (chatError && isAxiosError(chatError)) {
      const status = chatError.response?.status;
      if (status === 404) {
        navigate("/");
      }
    }
  }, [chatError, navigate]);
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
  const [model, setModel] = useState("gemini-3-flash-preview");



  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [isQuickChatSplit, setIsQuickChatSplit] = useState(false);
  const quickChatContainerRef = useRef<HTMLDivElement>(null);

  const {
    width: quickChatWidth,
    isResizing: isResizingQuickChat,
    startResizing: startResizingQuickChat,
  } = useResizable({
    initialWidth: 450,
    minWidth: 300,
    maxWidth: 900,
    direction: "left",
    containerRef: quickChatContainerRef,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isSplitModeActive = isQuickChatSplit && !isMobile;

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
  const lastQueryRef = useRef("");
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
      }, 200);
    },
    [],
  );

  const { send, isStreaming, streamingText ,stopStreaming} = useSendMessage({
    chatId: id,
    mode,
    model,
    onStreamStart: () => scrollToBottom("smooth"),
    onStreamEnd: () => scrollToBottom("auto"),
  });
  const sendAgentMessage=useSendAgentMessageMutation();

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


  useEffect(() => {
    const handleInsertChatName = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string }>;
      setInput((prev) => (prev ? prev + " " + customEvent.detail.name : customEvent.detail.name));
      requestAnimationFrame(() => composerRef.current?.focus());
    };
    window.addEventListener("insert-chat-name", handleInsertChatName as EventListener);
    return () =>
      window.removeEventListener(
        "insert-chat-name",
        handleInsertChatName as EventListener,
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
    lastQueryRef.current = msg;
    setInput("");

    if (chat?.type === "agent") {
      sendAgentMessage.mutate({ chatId: id || "", message: msg });
    } else {
      send(msg, selectedImageUrl, effectiveSelectedFile);
    }

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
    chat?.type,
    id,
    sendAgentMessage,
  ]);

  const handleStop = useCallback(() => {
    stopStreaming();
    if (lastQueryRef.current) {
      setInput(lastQueryRef.current);
    }
  }, [stopStreaming]);

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


    const anchorMessageId = "__split_view_quick__";
    setExternalQuickSelection({
      text: selectedText,
      messageId: anchorMessageId,
      relativeY: 0,
    });
    setPinnedQuickChatSelection({
      text: selectedText,
      messageId: anchorMessageId,
      relativeY: 0,
      subChatId: null,
    });
    setIsQuickChatOpen(true);

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
      className="flex h-full w-full bg-neutral-900 text-gray-200 font-sans relative overflow-hidden"
      onMouseUp={handleTextSelection}
      onTouchEnd={handleTextSelection}
    >
      <div
        className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${
          chat?.type === "agent" ? "border border-amber-500/20" : ""
        }`}
      >
        {/* Animated Edge Tracer */}
        <div
          className={`violet-edge-tracer ${isTracerActive ? "active-tracer" : ""}`}
        ></div>

      {/* Top Header */}
      <div className="h-13 border-b border-white/5 flex items-center justify-between px-3 sm:px-6 bg-(--theme-bg-base)/80 backdrop-blur-xl shrink-0 z-20">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm font-medium gap-0.5 sm:gap-1 min-w-0 flex-1 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
          {/* Home button — always visible */}
          <button
            onClick={() => {
              dispatch(setActiveSidebarRootId(null));
              navigate("/");
            }}
            className="flex items-center p-2 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group hover:scale-105 active:scale-95 shrink-0"
          >
            <Home
              size={15}
              className="text-zinc-500 group-hover:text-amber-200/90 transition-colors"
            />
          </button>
          <ChevronRight size={14} className="text-zinc-700 mx-0.5 shrink-0" />

          {/* Folder crumbs */}
          {breadCrumbs.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {breadCrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <button
                    onClick={() => dispatch(setActiveSidebarRootId(crumb.id))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-800/80 rounded-lg transition-all cursor-pointer group whitespace-nowrap hover:scale-[1.02] active:scale-[0.98] shrink-0"
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
            </div>
          )}

          {/* Current chat title — always visible */}
          <div className="ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-[0_0_20px_-10px_rgba(245,158,11,0.4)] animate-in fade-in zoom-in duration-300 shrink-0">
            <span className="text-amber-200/90 font-bold tracking-tight text-[12px] sm:text-[13px] whitespace-nowrap block">
              {chat?.title || "New Chat"}
            </span>
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-1 sm:gap-2 text-zinc-400 shrink-0 ml-2 sm:ml-4">
          {!isShareMode ? (
            <>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="p-2 hover:bg-zinc-800/80 hover:text-emerald-400 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Send Feedback"
              >
                <MessageSquareHeart size={18} />
              </button>
              <button 
                onClick={() => setIsShareOpen(true)}
                className="p-2 hover:bg-zinc-800/80 hover:text-amber-200/90 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Share Chat"
              >
                <Share size={18} />
              </button>
              
            </>
          ) : (
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please sign in to import this shared content.");
                  return;
                }
                setIsDownloadModalOpen(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Import shared content to workspace"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Import Workspace</span>
              <span className="sm:hidden">Import</span>
            </button>
          )}
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
            <DendritesLogo size={80} className="mb-6 opacity-80 animate-pulse text-amber-400" />

            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              {chat?.type === "agent" ? "Agent Workspace Architect" : "Welcome to Nurons"}
            </h1>
            {chat?.type !== "agent" ? (
              <p className="text-zinc-500 text-lg mb-10 max-w-md mx-auto">
                How can I help with your research or development today?
              </p>
            ) : (
              <p className="text-zinc-400 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
                The Agent Workspace Architect dynamically designs and builds structured learning roadmaps directly inside your workspace directory tree. Tell the agent what you want to study, and it will analyze folder paths, resolve any structure duplicates, and automatically construct customized milestone folders and sub-chats.
              </p>
            )}

            <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] text-amber-500/80 font-bold uppercase tracking-[0.2em] px-1">
                  {chat?.type === "agent" ? "Agent Workspace Generation" : "Neural Flow"}
                </span>
                <p className="text-[15px] text-zinc-300 font-medium">
                  {chat?.type === "agent"
                    ? "Enter your learning goal below to programmatically design and build your milestones."
                    : "Type below to begin a fresh mapping"}
                </p>
              </div>

              {chat?.type !== "agent" && !isShareMode && (
                <>
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
                          chat?.contextParent
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-amber-200/90 hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]"
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition-colors ${
                           chat?.contextParent ? "bg-blue-500/20" : "bg-white/5"
                        }`}>
                          <GitBranch
                            size={18}
                            className={`${chat?.contextParent ? "animate-pulse" : ""}`}
                          />
                        </div>
                        <div className="flex flex-col items-start min-w-[120px]">
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                             {chat?.contextParent ? "Active Link" : "Context"}
                           </span>
                           <span className="text-[13px] font-bold truncate max-w-[160px]">
                            {chat?.contextParent
                              ? (chat.contextParent.title || "Linked Chat")
                              : "Inherit Branch"}
                          </span>
                        </div>
                      </button>

                      {/* Unlink Button */}
                      {chat?.contextParent && (
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
                </>
              )}
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            className="w-full h-full"
            data={messages}
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={
              messages.length > 0 ? messages.length - 1 + firstItemIndex : 0
            }
            computeItemKey={(index, item) => item._id || String(index)}
            followOutput={isStreaming ? "smooth" : false}
            increaseViewportBy={{ top: 3000, bottom: 3000 }}
            atBottomStateChange={(bottom) => setAtBottom(bottom)}
            context={{
              isFetchingNextPage,
              isStreaming,
              streamingText: streamingText,
            }}
            startReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            itemContent={(_, msg) => (
              <div className="max-w-4xl mx-auto w-full pl-12 pr-4 md:px-8 pb-0">
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
                index: messages.length - 1 + firstItemIndex,
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
          {isShareMode ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800/85 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-2 text-zinc-500 select-none">
                <Shield size={16} className="text-zinc-600 animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  This is a Read-Only Preview. Message input is disabled.
                </span>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to import this shared content.");
                    return;
                  }
                  setIsDownloadModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download size={15} />
                <span>Import Workspace</span>
              </button>
            </div>
          ) : (
            <>
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

          {/* Agent Response Card */}
          {chat?.type === "agent" && (
            <>
              {sendAgentMessage.isPending && (
                <div className="mb-4 bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="relative mb-4">
                      {/* Premium pulsing circle and orbit spinner */}
                      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                      <div className="absolute inset-0 w-10 h-10 rounded-full border border-amber-500/10 animate-ping"></div>
                    </div>
                    
                    <h4 className="text-amber-400 font-bold text-xs mb-1 tracking-wider uppercase">
                      Agent is generating workspace
                    </h4>
                    <p className="text-zinc-400 text-xs max-w-xs animate-pulse">
                      Analyzing existing folder layout, resolving conflicts, and building learning roadmap milestones...
                    </p>
                  </div>
                </div>
              )}

              {sendAgentMessage.data && !sendAgentMessage.isPending && sendAgentMessage.data.type === "clarification_needed" && (
                <div className="mb-4 bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h4 className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Action Required
                    </h4>
                    <p className="text-gray-300 text-sm mb-3">{sendAgentMessage.data.message}</p>
                    <div className="flex flex-col gap-2">
                      {sendAgentMessage.data.options?.map((opt: { id: string; path: string }) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                             sendAgentMessage.mutate({ chatId: id, message: opt.id });
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800 transition-colors"
                        >
                          <span className="block text-sm font-medium text-gray-200">{opt.path}</span>
                          <span className="block text-xs text-gray-500 font-mono mt-0.5">ID: {opt.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className={`flex items-center bg-(--theme-bg-elevated)/90 backdrop-blur-xl border rounded-2xl px-3 md:px-4 py-3 md:py-3.5 transition-all shadow-2xl ${
            chat?.type === "agent"
              ? "border-amber-500/40 focus-within:border-amber-500 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : mode === "visual"
                ? "border-violet-500/30 focus-within:border-violet-500/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus-within:bg-(--theme-bg-elevated)"
                : "border-white/10 focus-within:border-blue-500/50 focus-within:bg-(--theme-bg-elevated)"
          }`}>
            {chat?.type !== "agent" && (
              <>
                <div className="relative z-50">
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors group relative"
                    disabled={isUploading || isStreaming}
                    title="More actions"
                  >
                    <MoreVertical
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />
                    {documents.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        {documents.length}
                      </span>
                    )}
                  </button>

                  {isMoreMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMoreMenuOpen(false)}
                      ></div>
                      <div className="absolute bottom-full left-0 mb-3 w-56 bg-(--theme-bg-surface) border border-zinc-700 shadow-2xl rounded-xl overflow-hidden py-1.5 z-50">
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                          disabled={isUploading || isStreaming}
                        >
                          <Paperclip size={16} className="text-gray-400" />
                          <span>Upload Image or File</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsShowingBrowser(true);
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Files size={16} className="text-gray-400" />
                            <span>View Uploaded Files</span>
                          </div>
                          {documents.length > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                              {documents.length}
                            </span>
                          )}
                        </button>

                        <div className="h-px bg-zinc-700/50 my-1"></div>

                        <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Mode
                        </div>

                        <button
                          onClick={() => {
                            setMode("general");
                            setModel(localStorage.getItem("model")||"gemini-2.5-flash")
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
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
                            setModel("gemini-3-flash-preview");
                           
                              localStorage.setItem("model",model)  
                            setIsMoreMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
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

                {/* Model Selector */}
                <div className="relative z-50">
                  <button
                    onClick={() => setIsModelOpen(!isModelOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 shadow-sm max-w-[160px] truncate"
                  >
                    <Cpu size={14} className="text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline truncate">
                      {MODEL_OPTIONS.find((m) => m.id === model)?.label || "Model"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform shrink-0 ${isModelOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isModelOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsModelOpen(false)}
                      ></div>
                      <div className="absolute bottom-full left-0 mb-3 w-48 bg-(--theme-bg-surface) border border-zinc-700 shadow-2xl rounded-xl overflow-hidden py-1.5 z-50 max-h-[300px] overflow-y-auto no-scrollbar">
                        {(user?.tier === "byok"
                          ? MODEL_OPTIONS.filter((opt) => opt.id === "DEFAULT" || opt.id.startsWith("gemini"))
                          : MODEL_OPTIONS
                        ).map((opt) => {
                          const isLocked = opt.tier === "paid" && user?.tier === "free";
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                if (isLocked) {
                                  toast.error("This premium model is locked on the Free tier. Upgrade your plan to access it!");
                                  return;
                                }
                                setModel(opt.id);
                                setIsModelOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors ${
                                isLocked ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium text-left truncate max-w-[120px]">{opt.label}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{opt.tier}</span>
                              </div>
                              {isLocked ? (
                                <Lock size={14} className="text-zinc-500 shrink-0" />
                              ) : model === opt.id ? (
                                <Check size={16} className="text-emerald-400 shrink-0" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {user?.tier === "byok"&&user.byokKeysCount===0 && (
                  <button
                    onClick={() => setIsByokModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/20 shadow-sm whitespace-nowrap"
                    title="Manage BYOK API Keys"
                  >
                    <Key size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Keys</span>
                  </button>
                )}
              </>
            )}

            <textarea
              placeholder={mode==="general"?"Ask follow-up or research next steps...":"Create an interactive visualization of NGINX."}
              maxLength={32000}
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
              {chat?.type !== "agent" ? (
                <button
                  onClick={isStreaming ? handleStop : handleSend}
                  disabled={
                    isUploading ||
                    (!isStreaming && !input.trim() && !selectedImageUrl && !activeSelectedFile)
                  }
                  className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                    isStreaming
                      ? "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-500/20"
                      : (input.trim() || selectedImageUrl || activeSelectedFile) && !isUploading
                        ? mode === "visual"
                          ? "bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-500/20"
                          : "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
                        : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isStreaming ? (
                    <Square size={16} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <ArrowUp size={18} strokeWidth={2.5} />
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendAgentMessage.isPending}
                  className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                    input.trim() && !sendAgentMessage.isPending
                      ? "bg-amber-600 text-white hover:bg-amber-500 shadow-md shadow-amber-500/20"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {sendAgentMessage.isPending ? (
                    <Square size={16} fill="currentColor" strokeWidth={0} className="animate-pulse" />
                  ) : (
                    <ArrowUp size={18} strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      </div>


      {selection && selection.visible && (
        <div
          className="fixed z-[999] -translate-x-1/2 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ top: selection.bottomY + 8, left: selection.x }}
        >
          {!isShareMode && <button
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2"
            onClick={() => {
              setPinnedQuickChatSelection({
                text: selection.text,
                messageId: selection.messageId,
                relativeY: selection.relativeY ?? 0,
                subChatId: selection.subChatId,
              });
             
              setIsQuickChatOpen(true);
              clearSelection();
            }}
          >
            <Sparkles size={14} />
            {isQuickChatOpen ? "New Quick Chat" : "Quick Chat"}
          </button>}
          {!isShareMode && <button
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-purple-500 transition-all flex items-center gap-2"
            onClick={() =>
              handleCreateRecall(selection.markdown, selection.messageId)
            }
            disabled={isRecalling}
          >
            <Brain size={14} />
            {isRecalling ? "Saving..." : "Recall"}
          </button>}
        </div>
      )}

      {/* Quick Chat Container Wrapper */}
      <div
        ref={quickChatContainerRef}
        style={{
          width: isSplitModeActive && isQuickChatOpen && quickChatSelection ? `${quickChatWidth}px` : "0px",
        }}
        className={`shrink-0 h-full flex flex-row relative z-30 ${
          isResizingQuickChat ? "" : "transition-all duration-300"
        } ${
          isSplitModeActive && isQuickChatOpen && quickChatSelection
            ? "border-l border-white/10 bg-neutral-900"
            : "border-l-0 bg-transparent overflow-visible pointer-events-none"
        }`}
      >
        {isSplitModeActive && isQuickChatOpen && quickChatSelection && (
          <div
            onMouseDown={startResizingQuickChat}
            className={`absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500 transition-colors z-50 ${
              isResizingQuickChat ? "bg-blue-500" : ""
            }`}
            style={{ transform: "translateX(-50%)" }}
          />
        )}
        
        {isQuickChatOpen && quickChatSelection && (
          <div className="w-full h-full flex flex-col pointer-events-auto">
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
              initialModel={model}
              isSplit={isSplitModeActive}
              onToggleSplit={isMobile ? undefined : () => setIsQuickChatSplit(!isQuickChatSplit)}
            />
          </div>
        )}
      </div>

      {/* Document Browser Modal */}
      <DocumentBrowser
        isOpen={isShowingBrowser}
        onClose={() => setIsShowingBrowser(false)}
        documents={documents}
        onOpenSplitView={openSplitView}
        onRemoveDocument={removeDocument}
      />

      {/* Inherit Context Modal */}
      {isInheritModalOpen && !isShareMode && (
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

      <SettingsModal 
        isOpen={isByokModalOpen} 
        onClose={() => setIsByokModalOpen(false)} 
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {isShareOpen && id && (
        <ShareLinkModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          targetId={id}
          targetType="chat"
          targetName={chat?.title || "New Chat"}
        />
      )}

      {isShareMode && token && (
        <ImportSharedModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          token={token}
        />
      )}
    </div>
  );
};

export default ChatWindow;
