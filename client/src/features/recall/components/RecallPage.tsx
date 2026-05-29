import { Brain, Search, Loader, CheckCircle2, Award, Clock, Trash2, PenLine, ChevronDown, ChevronUp, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "../../chat/styles/markdown.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "../../chat/components/markdown/MarkdownComponents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";
import React, { useState } from "react";

interface RecallCardProps {
  card: any;
  index: number;
  onReview: (cardId: string, rating: number) => void;
  onDelete: (cardId: string) => void;
  isReviewPending: boolean;
}

const RecallCard: React.FC<RecallCardProps> = ({ card, index, onReview, onDelete, isReviewPending }) => {
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceText, setPracticeText] = useState("");

  return (
    <div 
      className="w-full relative rounded-none sm:rounded-[32px] border-x-0 sm:border-x border-y border-zinc-800 bg-(--theme-bg-surface) shadow-2xl flex flex-col items-center pt-20 pb-10 px-4 md:px-12 animate-in slide-in-from-bottom-4 duration-500"
    >
      {/* Metadata Badges */}
      <div className="absolute top-8 left-8 flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
           <Search size={14}/> CARD {index + 1}
        </div>
        <button 
          onClick={() => onDelete(card._id)}
          className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Delete Card"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-3">
        <button
          onClick={() => setIsPracticeOpen(!isPracticeOpen)}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border transition-all backdrop-blur-md ${
            isPracticeOpen 
              ? "bg-purple-500/20 border-purple-500/40 text-purple-400" 
              : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
          }`}
        >
          <PenLine size={14} />
          <span>PRACTICE BY WRITING</span>
          {isPracticeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {card.stage === "learning" ? (
           <div className="flex items-center gap-2 text-xs font-bold text-amber-500 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
             <Clock size={14}/> LEARNING PHASE
           </div>
        ) : (
           <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
             <Award size={14}/> SPACED REVIEW
           </div>
        )}
      </div>

      {/* Practice Area */}
      <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${isPracticeOpen ? "max-h-[500px] mb-8 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="w-full p-6 rounded-2xl bg-zinc-900/50 border border-purple-500/20 shadow-inner">
          <label className="block text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-3">Recall and write here</label>
          <textarea
            value={practiceText}
            onChange={(e) => setPracticeText(e.target.value)}
            placeholder="Type your recall here to test your memory..."
            className="w-full h-40 bg-transparent border-none outline-none text-gray-200 placeholder:text-zinc-700 resize-none text-lg leading-relaxed"
          />
          <div className="mt-2 text-[10px] text-zinc-600 flex justify-between items-center">
            <span>TIP: Writing helps reinforce neural connections.</span>
            <span>{practiceText.length} characters</span>
          </div>
        </div>
      </div>

      {/* Content Area - Full Expansion */}
      <div className={`w-full bg-white/1 rounded-xl sm:rounded-[24px] p-5 md:p-10 border border-white/5 shadow-inner mb-10 flex flex-col items-start transition-all duration-500 ${isPracticeOpen ? "filter blur-sm opacity-20 pointer-events-none scale-95" : ""}`}>
          <div className="markdown-body w-full text-[17px] leading-relaxed text-gray-300/95">
             <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {card.content}
              </ReactMarkdown>
          </div>
      </div>

      <h3 className="text-zinc-500 font-bold tracking-[0.3em] uppercase text-[10px] mb-8 opacity-40">Evaluate your recall accuracy</h3>
      
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
        {[
          { label: "Very Hard", val: 1, color: "rose" },
          { label: "Hard", val: 2, color: "orange" },
          { label: "Medium", val: 3, color: "amber" },
          { label: "Good", val: 4, color: "emerald" },
          { label: "Easy", val: 5, color: "cyan" }
        ].map((btn) => (
          <button 
            key={btn.val}
            disabled={isReviewPending}
            onClick={() => onReview(card._id, btn.val)}
            className={`flex-1 min-w-[125px] py-4 px-6 rounded-2xl font-bold bg-${btn.color}-500/10 text-${btn.color}-400 border border-${btn.color}-500/20 hover:bg-${btn.color}-500 hover:text-white transition-all transform active:scale-95 text-[11px] uppercase tracking-wider shadow-lg disabled:opacity-50`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface RecallPageProps {
  onClose?: () => void;
}

export default function RecallPage({ onClose }: RecallPageProps) {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["dueCards"],
    queryFn: async () => {
      const res = await api.get("/recall");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: string; rating: number }) => {
      await api.post(`/recall/update/${cardId}`, { rating });
      return  queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/recall/${cardId}`);
      return  queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
       await api.delete("/recall/clear");
       return  queryClient.invalidateQueries({queryKey:["recallCount"]})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const handleReview = (cardId: string, rating: number) => {
    reviewMutation.mutate({ cardId, rating });
  };

  const handleDelete = (cardId: string) => {
    if (!window.confirm("Delete this recall card permanently?")) return;
    deleteMutation.mutate(cardId);
  };

  const handleClearAll = () => {
    if (!window.confirm("Clear your entire recall queue? This cannot be undone.")) return;
    clearAllMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full text-zinc-400 bg-(--theme-bg-base)">
        <Loader className="animate-spin mb-4" size={32} />
        <p>Syncing your memory graph...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div>
         {onClose && (
        <button
          onClick={onClose}
          className="fixed top-6 right-10 z-50 p-3 bg-zinc-900/50 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md"
        >
          <X size={24} />
        </button>
      )}
      <div className="flex flex-col items-center justify-center h-screen w-full text-zinc-400 bg-(--theme-bg-base)">
        <CheckCircle2 className="mb-4 text-emerald-500" size={48} />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">You're all caught up!</h2>
        <p>You have reviewed all due Active Recall cards for today.</p>
      </div>
      </div>
      
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-(--theme-bg-base) text-gray-200 px-0 sm:px-4 py-6 md:p-10 w-full max-w-6xl mx-auto animate-in fade-in duration-500 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-6 right-10 z-50 p-3 bg-zinc-900/50 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl backdrop-blur-md"
        >
          <X size={24} />
        </button>
      )}
      
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-10 shrink-0">
        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
          <Brain size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Recall Review</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-zinc-400">
              {cards.length} cards pending in your queue
            </p>
            <button 
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              className="text-[11px] font-bold text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 group/clear disabled:opacity-50"
            >
              <div className="w-1 h-1 bg-rose-500/40 rounded-full group-hover/clear:bg-rose-500 transition-colors" />
              {clearAllMutation.isPending ? "Clearing..." : "Clear Queue"}
            </button>
          </div>
        </div>
      </div>

   
      <div className="flex flex-col gap-10 pb-20">
        {cards.map((card: any, index: number) => (
          <RecallCard 
            key={card._id}
            card={card}
            index={index}
            onReview={handleReview}
            onDelete={handleDelete}
            isReviewPending={reviewMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
