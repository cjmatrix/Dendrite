import React, { useState, useCallback, useRef } from "react";
import {
  ArrowUp,
  Brain,
  FolderPlus,
  MessageSquare,
  Image,
  Bot,
  ChevronDown,
  Cpu,
  Lock,
  Check,
  Paperclip,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DendritesLogo from "../../../components/DendritesLogo";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { useExplorerMutations } from "../../explorer/hooks/useFileExplorer";
import { toggleRecallOverlay, expandFolderTemporarily } from "../../explorer/store/explorerSlice";
import { MODEL_OPTIONS,} from "../constants/models";
import { uploadImage, uploadFile, streamDocumentProgress } from "../api/chatApi";
import toast from "react-hot-toast";

interface SuggestionCard {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  prompt: string;
  badge: string;
  mode: "general" | "agent" | "visual";
}

const STARTER_SUGGESTIONS: SuggestionCard[] = [
  {
    icon: MessageSquare,
    title: "Full-Stack Architecture",
    desc: "Design a scalable React, TypeScript & microservices system",
    prompt: "Help me design a modern full-stack web application architecture with React, TypeScript, and Tailwind CSS.",
    badge: "General",
    mode: "general",
  },
  {
    icon: MessageSquare,
    title: "Quantum Physics 101",
    desc: "Explain Superposition and Entanglement with real analogies",
    prompt: "Explain the fundamentals of Quantum Computing, Superposition, and Entanglement with real-world analogies.",
    badge: "General",
    mode: "general",
  },
  {
    icon: Bot,
    title: "System Design Roadmap",
    desc: "Construct structured milestone folders and topic chats",
    prompt: "Create an interactive learning roadmap to master System Design and Microservice Architecture.",
    badge: "AI Agent",
    mode: "agent",
  },
  {
    icon: Image,
    title: "Architecture Diagrams",
    desc: "Generate interactive visual flow diagrams for NGINX & Redis",
    prompt: "Generate an interactive visual diagram explaining how NGINX load balances requests to microservices.",
    badge: "Visual Mode",
    mode: "visual",
  },
];

export default function EmptyChatState() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const systemChatsFolderId = useAppSelector((state) => state.explorer.systemChatsFolderId);
  const { createChatAsync } = useExplorerMutations();

  const [prompt, setPrompt] = useState("");
  const [chatMode, setChatMode] = useState<"general" | "agent" | "visual">("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    () => "gemini-3-flash-preview",
  );
  const [isModelOpen, setIsModelOpen] = useState(false);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    stage: string;
    progress: number;
    status: string;
  } | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ url: string; name: string } | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSubmitting || isUploadingFile) return;

    setIsUploadingFile(true);
    setUploadProgress({
      fileName: file.name,
      stage: "upload",
      progress: 5,
      status: "Initializing chat workspace...",
    });

    try {
      let chatId = activeChatId;
      if (!chatId) {
        const now = new Date();
        const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const baseTitle = file.name.length > 30 ? file.name.substring(0, 30) + "..." : file.name;
        const uniqueTitle = `${baseTitle} (${dateStr} ${timeStr})`;

        if (systemChatsFolderId) {
          dispatch(expandFolderTemporarily(systemChatsFolderId));
        }

        const newChat = await createChatAsync({
          title: uniqueTitle,
          folderId: systemChatsFolderId,
          type: chatMode === "agent" ? "agent" : "normal",
        });

        if (!newChat || !newChat._id) {
          throw new Error("Failed to initialize chat session.");
        }

        chatId = newChat._id;
        setActiveChatId(chatId);
      }

      const isImage = file.type.startsWith("image/");

      if (isImage) {
        setUploadProgress({
          fileName: file.name,
          stage: "upload",
          progress: 50,
          status: "Uploading image...",
        });

        const imgRes = await uploadImage(file, chatId);
        setAttachedImage({ url: imgRes.url, name: file.name });
        setAttachedFile(null);
        sessionStorage.setItem("initialImageUrl", imgRes.url);
        toast.success(`Image attached: ${file.name}`);
        setIsUploadingFile(false);
        setUploadProgress(null);
      } else {
        setUploadProgress({
          fileName: file.name,
          stage: "upload",
          progress: 15,
          status: "Uploading document...",
        });

        const docRes = await uploadFile(file, chatId, file.name);

        setUploadProgress({
          fileName: file.name,
          stage: docRes.status === "chunking" ? "chunk" : "upload",
          progress: 35,
          status: "Processing document vectors...",
        });

        // SSE real-time progress stream
        const cleanup = streamDocumentProgress(
          chatId,
          docRes.documentId,
          (event) => {
            setUploadProgress({
              fileName: event.fileName,
              stage: event.stage,
              progress: event.progress,
              status: event.message || (event.stage === "chunk" ? "Generating vector chunks..." : "Processing file..."),
            });

            if (event.status === "completed") {
              const fileUrl = event.cloudinaryUrl || docRes.fileName || file.name;
              setAttachedFile({ name: file.name, url: fileUrl });
              setAttachedImage(null);
              sessionStorage.setItem(
                "initialFile",
                JSON.stringify({ name: file.name, url: fileUrl })
              );
              setIsUploadingFile(false);
              setUploadProgress(null);
              toast.success(`Document ready: ${file.name}`);
              cleanup();
            } else if (event.status === "failed") {
              setIsUploadingFile(false);
              setUploadProgress(null);
              toast.error(event.message || `Failed to process ${file.name}`);
              cleanup();
            }
          },
          () => {
            setIsUploadingFile(false);
            setUploadProgress(null);
            toast.error("Document progress connection interrupted");
          }
        );
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      toast.error(err?.message || `Failed to attach ${file.name}`);
      setIsUploadingFile(false);
      setUploadProgress(null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleStartChat = useCallback(
    async (overrideText?: string, modeOverride?: "general" | "agent" | "visual") => {
      const activeMode = modeOverride || chatMode;
      const query = (overrideText || prompt).trim();
      if ((!query && !attachedImage && !attachedFile) || isSubmitting || isUploadingFile) return;

      setIsSubmitting(true);
      try {
        const chatType = activeMode === "agent" ? "agent" : "normal";

        sessionStorage.setItem("initialPrompt", query);
        sessionStorage.setItem("initialModel", selectedModel);

        if (activeMode === "visual") {
          sessionStorage.setItem("initialChatMode", "visual");
        }

        let targetChatId = activeChatId;

        if (!targetChatId) {
          if (systemChatsFolderId) {
            dispatch(expandFolderTemporarily(systemChatsFolderId));
          }

          const now = new Date();
          const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const baseTitle = query.length > 35 ? query.substring(0, 35) + "..." : query;
          const uniqueTitle = `${baseTitle} (${dateStr} ${timeStr})`;

          const newChat = await createChatAsync({
            title: uniqueTitle,
            folderId: systemChatsFolderId,
            type: chatType,
          });

          if (newChat && newChat._id) {
            targetChatId = newChat._id;
          }
        }

        if (targetChatId) {
          navigate(`/${targetChatId}`);
        } else {
          toast.error("Failed to create chat. Please try again.");
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("Error starting chat:", err);
        toast.error("Could not start chat. Please try again.");
        setIsSubmitting(false);
      }
    },
    [
      prompt,
      chatMode,
      attachedImage,
      attachedFile,
      isSubmitting,
      isUploadingFile,
      selectedModel,
      activeChatId,
      systemChatsFolderId,
      dispatch,
      createChatAsync,
      navigate,
    ],
  );

  const handleQuickFolderCreate = useCallback(() => {
    window.dispatchEvent(new CustomEvent("root-folder-creation"));
  }, []);

  const displayName = user?.globalProfileName || user?.name;
  const firstName = displayName ? displayName.split(" ")[0] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-[#0b0c10] text-gray-100 min-h-screen w-full relative overflow-y-auto no-scrollbar px-4 py-12 md:px-8 selection:bg-blue-500/30">
      
      {/* Soft Center Radial Glow (Gemini-style Aura) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[800px] h-[500px] rounded-full bg-gradient-to-tr from-blue-950/30 via-indigo-900/20 to-purple-950/15 blur-[120px] opacity-70" />
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center my-auto">
        
        {/* Sleek Greeting Header */}
        <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div
            className="mb-6 cursor-pointer p-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl hover:border-white/20 transition-all shadow-xl group"
            onClick={() => navigate("/")}
          >
            <DendritesLogo size={32} className="text-blue-400 group-hover:scale-105 transition-transform" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white/90 mb-3 font-sans">
            {firstName ? `Hi ${firstName}, let's get started` : "Hi, let's get started"}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400/90 font-light max-w-md">
            What would you like to explore, build, or solve today?
          </p>
        </div>

        {/* Premium Gemini-style Prompt Pill Bar */}
        <div className="w-full mb-8 animate-in fade-in zoom-in-95 duration-500">
          <div
            className={`flex flex-col bg-[#121318] border rounded-[28px] p-3 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 ${
              isSubmitting
                ? "border-blue-500/50 ring-1 ring-blue-500/30 animate-pulse"
                : chatMode === "agent"
                  ? "border-amber-500/40 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30"
                  : chatMode === "visual"
                    ? "border-violet-500/40 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30"
                    : "border-white/10 focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/20"
            }`}
          >
            {/* Top Toolbar: Mode Switcher Pills & Model Selector */}
            <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/5 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setChatMode("general")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    chatMode === "general"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode("agent")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    chatMode === "agent"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <Bot size={13} />
                  <span>Agent Roadmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode("visual")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    chatMode === "visual"
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <Image size={13} />
                  <span>Visual Mode</span>
                </button>
              </div>

              {/* Model Selector Dropdown */}
              <div className="relative z-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModelOpen(!isModelOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 transition-all cursor-pointer max-w-[170px] truncate"
                  title="Select AI Model"
                >
                  <Cpu size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label || "Model"}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-zinc-400 transition-transform shrink-0 ${isModelOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isModelOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsModelOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#181920] border border-zinc-700 shadow-2xl rounded-2xl overflow-hidden py-1.5 z-50 max-h-[280px] overflow-y-auto no-scrollbar">
                      {(user?.tier === "byok"
                        ? MODEL_OPTIONS.filter((opt) => opt.id === "DEFAULT" || opt.id.startsWith("gemini"))
                        : MODEL_OPTIONS
                      ).map((opt) => {
                        const isLocked = opt.tier === "paid" && user?.tier === "free";
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                toast.error("This premium model is locked on the Free tier. Upgrade your plan to access it!");
                                return;
                              }
                              setSelectedModel(opt.id);
                            
                              setIsModelOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors ${
                              isLocked ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-medium text-left truncate max-w-[130px]">{opt.label}</span>
                              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{opt.tier}</span>
                            </div>
                            {isLocked ? (
                              <Lock size={13} className="text-zinc-500 shrink-0" />
                            ) : selectedModel === opt.id ? (
                              <Check size={14} className="text-emerald-400 shrink-0" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Non-blocking SSE Upload Progress Bar */}
            {uploadProgress && (
              <div className="flex flex-col gap-1.5 p-3 mb-2 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 backdrop-blur-xl animate-in fade-in duration-300 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin text-blue-400 shrink-0" />
                    <span className="font-semibold text-white truncate max-w-[200px]">{uploadProgress.fileName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-300 font-bold">{uploadProgress.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, uploadProgress.progress)}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 text-left">{uploadProgress.status}</span>
              </div>
            )}

            {/* Attached File / Image Chips */}
            {(attachedImage || attachedFile) && !uploadProgress && (
              <div className="flex items-center gap-2 mb-2 px-2 flex-wrap">
                {attachedImage && (
                  <div className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
                    <img src={attachedImage.url} alt="Preview" className="w-5 h-5 object-cover rounded" />
                    <span className="max-w-[180px] truncate">{attachedImage.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {attachedFile && (
                  <div className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200">
                    <FileText size={14} className="text-purple-400" />
                    <span className="max-w-[180px] truncate">{attachedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Main Prompt Textarea */}
            <textarea
              id="empty-chat-textarea"
              placeholder={
                chatMode === "agent"
                  ? "Describe the topic or roadmap you want the AI Agent to build..."
                  : chatMode === "visual"
                    ? "Describe the concept or architecture you want visually generated..."
                    : "Ask anything, start a study plan, or describe a problem..."
              }
              maxLength={16000}
              className="w-full bg-transparent border-none outline-none text-base text-white/90 placeholder:text-zinc-500 resize-none min-h-[72px] max-h-40 py-1 px-2 overflow-y-auto no-scrollbar disabled:opacity-60 font-sans"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStartChat();
                }
              }}
              disabled={isSubmitting}
              autoFocus
            />

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between px-1 pt-2 border-t border-white/5 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.pdf,.txt,.md,.js,.ts,.py,.json,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploadingFile}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Attach PDF or Image"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleQuickFolderCreate}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Create folder"
                >
                  <FolderPlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(toggleRecallOverlay(true))}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Open Active Recall"
                >
                  <Brain size={16} />
                </button>
              </div>

              {/* Gemini-style Round Send Button */}
              <button
                type="button"
                onClick={() => handleStartChat()}
                disabled={(!prompt.trim() && !attachedImage && !attachedFile) || isSubmitting || isUploadingFile}
                className={`p-2.5 rounded-full transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                  (prompt.trim() || attachedImage || attachedFile) && !isSubmitting && !isUploadingFile
                    ? chatMode === "agent"
                      ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-95"
                      : chatMode === "visual"
                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20 active:scale-95"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95"
                    : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
                }`}
                title="Send message"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Pills Row */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-10">
          <button
            onClick={() => {
              setChatMode("general");
              const el = document.getElementById("empty-chat-textarea");
              if (el) el.focus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer ${
              chatMode === "general"
                ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                : "bg-[#16171d]/80 hover:bg-[#1d1e26] border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <MessageSquare size={14} className="text-blue-400" />
            <span>General Chat</span>
          </button>

          <button
            onClick={() => {
              setChatMode("agent");
              const el = document.getElementById("empty-chat-textarea");
              if (el) el.focus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer ${
              chatMode === "agent"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                : "bg-[#16171d]/80 hover:bg-[#1d1e26] border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <Bot size={14} className="text-amber-400" />
            <span>Agent Workspace</span>
          </button>

          <button
            onClick={() => {
              setChatMode("visual");
              const el = document.getElementById("empty-chat-textarea");
              if (el) el.focus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer ${
              chatMode === "visual"
                ? "bg-violet-500/20 border-violet-500/40 text-violet-200"
                : "bg-[#16171d]/80 hover:bg-[#1d1e26] border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <Image size={14} className="text-violet-400" />
            <span>Visual Mode</span>
          </button>

          <button
            onClick={handleQuickFolderCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#16171d]/80 hover:bg-[#1d1e26] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <FolderPlus size={14} className="text-blue-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => dispatch(toggleRecallOverlay(true))}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#16171d]/80 hover:bg-[#1d1e26] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Brain size={14} className="text-purple-400" />
            <span>Active Recall</span>
          </button>
        </div>

        {/* Starter Suggestions Grid */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Suggested Topics
            </h2>
            <span className="text-[11px] text-zinc-600">Select to load prompt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {STARTER_SUGGESTIONS.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setPrompt(s.prompt);
                    setChatMode(s.mode);
                    const el = document.getElementById("empty-chat-textarea");
                    if (el) el.focus();
                  }}
                  className="group p-4 rounded-2xl bg-[#14151b]/70 border border-white/5 hover:border-white/15 hover:bg-[#1a1b23] cursor-pointer transition-all duration-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                        <IconComp size={15} />
                      </div>
                      <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {s.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400/90 font-light leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workspace Organization Tip Card */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-[#13141b]/90 border border-blue-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <FolderPlus size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Organize Your Workspace
                </h3>
                <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Tip
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Create custom folders in the left sidebar to group your research, agent roadmaps, and chats into structured workspace trees.
              </p>
            </div>
          </div>

          <button
            onClick={handleQuickFolderCreate}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap self-end sm:self-auto"
          >
            <FolderPlus size={14} />
            <span>Create Folder</span>
          </button>
        </div>

      </div>
    </div>
  );
}