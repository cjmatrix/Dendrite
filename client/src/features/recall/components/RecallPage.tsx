import { Brain, Search, Loader, CheckCircle2, Award, Clock, Trash2, PenLine, ChevronDown, ChevronUp, X, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "../../chat/styles/markdown.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "../../chat/components/markdown/MarkdownComponents";
import { fixMalformedPlantUML } from "../../chat/components/MessageContent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionModal } from "../../../components/common/ActionModal";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism-tomorrow.css";

interface Card {
  _id: string;
  content: string;
  stage: string;
  chatId: string;
}

interface RecallCardProps {
  card: Card;
  index: number;
  onReview: (cardId: string, rating: number) => void;
  onDelete: (cardId: string) => void;
  isReviewPending: boolean;
  onGoToChat: (chatId: string) => void;
}

const RecallCard: React.FC<RecallCardProps> = ({ card, index, onReview, onDelete, isReviewPending, onGoToChat }) => {
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const detectedLang = React.useMemo(() => {
    const match = card.content.match(/```(\w+)/);
    return match ? match[1] : null;
  }, [card.content]);

  const handleTogglePractice = () => {
    const nextState = !isPracticeOpen;
    setIsPracticeOpen(nextState);
  };

  return (
    <div className="w-full relative rounded-2xl sm:rounded-[32px] border border-white/10 bg-neutral-900 shadow-2xl flex flex-col mb-8 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Search size={14}/> Card {index + 1}
          </div>
          {card.stage === "learning" ? (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-500 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Clock size={12}/> LEARNING
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-500 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Award size={12}/> SPACED REVIEW
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {card.chatId && (
            <button
              onClick={() => onGoToChat(card.chatId)}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/10 hover:border-white/10 transition-all"
              title="Go to original chat"
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">GO TO CHAT</span>
              <span className="sm:hidden">CHAT</span>
            </button>
          )}

          <button
            onClick={handleTogglePractice}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border transition-all ${
              isPracticeOpen 
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300" 
                : "bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
            }`}
          >
            <PenLine size={14} />
            <span className="hidden sm:inline">PRACTICE BY WRITING</span>
            <span className="sm:hidden">PRACTICE</span>
            {isPracticeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <button 
            onClick={() => onDelete(card._id)}
            className="p-1.5 sm:p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg sm:rounded-xl transition-all"
            title="Delete Card"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Practice Area */}
      {isPracticeOpen && (
        <div className="w-full p-4 sm:p-6 bg-purple-900/10 border-b border-purple-500/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <label className="block text-[10px] sm:text-[11px] font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-1.5">
              
              {detectedLang ? `Practice by typing here (${detectedLang})` : "Interactive Editor"}
            </label>
            {detectedLang && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 uppercase tracking-wider">
                Code Mode
              </span>
            )}
          </div>
          
          <div className="w-full bg-neutral-950/80 border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl relative">
            <Editor
              value={practiceText}
              onValueChange={setPracticeText}
              highlight={(code) => Prism.highlight(
                code, 
                (detectedLang && Prism.languages[detectedLang]) ? Prism.languages[detectedLang] : (Prism.languages.markdown || Prism.languages.plain), 
                (detectedLang && Prism.languages[detectedLang]) ? detectedLang : 'markdown'
              )}
              padding={16}
              placeholder={detectedLang ? `Write your ${detectedLang} code here...` : "Type your recall here to test your memory..."}
              className={`bg-neutral-900 w-full min-h-[128px] text-gray-200 resize-none leading-relaxed transition-colors ${
                detectedLang ? "text-xs sm:text-sm" : "text-sm sm:text-base font-sans"
              }`}
              style={{
                fontFamily: detectedLang ? '"Fira code", "Fira Mono", monospace' : 'inherit',
              }}
              textareaClassName="focus:outline-none"
            />
          </div>

          <div className="mt-2 text-[10px] text-zinc-500 flex justify-between items-center">
            <span>TIP: You are typing in a live preview editor.</span>
            <span>{practiceText.length} characters</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={`w-full p-5 sm:p-8 md:p-12 flex flex-col items-start transition-all duration-300 ${isPracticeOpen ? "opacity-30 blur-[2px] select-none" : ""}`}>
        <div className="markdown-body w-full text-[15px] sm:text-[17px] leading-relaxed text-gray-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {fixMalformedPlantUML(card.content)}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="w-full p-4 sm:p-6 md:p-8 border-t border-white/5 bg-black/20">
        <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-4 text-center">Evaluate your recall accuracy</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 w-full max-w-4xl mx-auto">
          {[
            { label: "Very Hard", val: 1, color: "rose" },
            { label: "Hard", val: 2, color: "orange" },
            { label: "Medium", val: 3, color: "amber" },
            { label: "Good", val: 4, color: "emerald" },
            { label: "Easy", val: 5, color: "cyan" }
          ].map((btn, i) => (
            <button 
              key={btn.val}
              disabled={isReviewPending}
              onClick={() => onReview(card._id, btn.val)}
              className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-bold bg-${btn.color}-500/10 text-${btn.color}-400 border border-${btn.color}-500/20 hover:bg-${btn.color}-500 hover:text-white transition-all transform active:scale-95 text-[10px] sm:text-[11px] uppercase tracking-wider shadow-lg disabled:opacity-50 flex items-center justify-center text-center ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface RecallPageProps {
  onClose?: () => void;
}

export default function RecallPage({ onClose }: RecallPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["dueCards"],
    queryFn: async () => {
      const res = await api.get("/recall");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const handleGoToChat = (chatId: string) => {
    if (onClose) onClose();
    if (token) {
      navigate(`/share/${token}/chat/${chatId}`);
    } else {
      navigate(`/${chatId}`);
    }
  };

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: string; rating: number }) => {
      await api.post(`/recall/update/${cardId}`, { rating });
      return queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/recall/${cardId}`);
      return queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
       await api.delete("/recall/clear");
       return queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const handleReview = (cardId: string, rating: number) => {
    reviewMutation.mutate({ cardId, rating });
  };

  const handleDelete = (cardId: string) => {
    setDeleteTargetId(cardId);
  };

  const handleClearAll = () => {
    setIsClearAllModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full text-zinc-400 bg-neutral-900">
        <Loader className="animate-spin mb-4" size={32} />
        <p>Syncing your memory graph...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="w-full min-h-screen bg-neutral-900 text-gray-200 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-10 z-50 p-2 sm:p-3 bg-zinc-900/80 border border-white/10 rounded-full sm:rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md"
          >
            <X size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center max-w-5xl mx-auto">
          <CheckCircle2 className="mb-4 text-emerald-500" size={48} />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-2">You're all caught up!</h2>
          <p className="text-sm sm:text-base">You have reviewed all due Active Recall cards for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-gray-200">
      <div className="flex flex-col min-h-screen px-4 sm:px-6 py-8 md:p-10 w-full max-w-5xl mx-auto animate-in fade-in duration-500 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-10 z-50 p-2 sm:p-3 bg-zinc-900/80 border border-white/10 rounded-full sm:rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md"
          >
            <X size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12 shrink-0 pt-8 sm:pt-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400">
              <Brain size={24} className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Active Recall</h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {cards.length} cards pending in your queue
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending}
            className="self-start sm:self-center text-[10px] sm:text-[11px] font-bold text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 group/clear disabled:opacity-50 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2 rounded-lg"
          >
            <div className="w-1.5 h-1.5 bg-rose-500/40 rounded-full group-hover/clear:bg-rose-500 transition-colors" />
            {clearAllMutation.isPending ? "Clearing..." : "Clear Queue"}
          </button>
        </div>

        <div className="flex flex-col gap-8 sm:gap-12 pb-24">
          {cards.map((card: Card, index: number) => (
            <RecallCard 
              key={card._id}
              card={card}
              index={index}
              onReview={handleReview}
              onDelete={handleDelete}
              isReviewPending={reviewMutation.isPending}
              onGoToChat={handleGoToChat}
            />
          ))}
        </div>
      </div>

      <ActionModal
        isOpen={deleteTargetId !== null}
        title="Delete Recall Card"
        description="Are you sure you want to delete this recall card permanently? This action cannot be undone."
        variant="warning"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMutation.mutate(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ActionModal
        isOpen={isClearAllModalOpen}
        title="Clear Recall Queue"
        description="Are you sure you want to clear your entire recall queue? This cannot be undone."
        variant="warning"
        confirmLabel="Clear Queue"
        onConfirm={() => {
          clearAllMutation.mutate();
          setIsClearAllModalOpen(false);
        }}
        onCancel={() => setIsClearAllModalOpen(false)}
      />
    </div>
  );
}
