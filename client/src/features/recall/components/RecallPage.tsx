import {
  Brain,
  Search,
  Loader,
  CheckCircle2,
  Award,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  HelpCircle,
  Eye,
  PenLine,
  Pencil,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import "../../chat/styles/markdown.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "../../chat/components/markdown/MarkdownComponents";
import { fixMalformedPlantUML } from "../../chat/components/MessageContent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/axios";
import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionModal } from "../../../components/common/ActionModal";
import { useUpdateQuestion } from "../hooks/useUpdateQuestion";
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
  question?: string;
  stage: "learning" | "review";
  chatId: string;
  stepIndex: number;
  repetitions: number;
  interval: number;
  easeFactor: number;
}

const LEARNING_STEPS = [1, 10, 30];

function previewNextInterval(
  card: Card,
  rating: number,
): { value: number; unit: "m" | "d" } {
  if (card.stage === "learning") {
    if (rating >= 3) {
      if (card.stepIndex < LEARNING_STEPS.length - 1) {
        return { value: LEARNING_STEPS[card.stepIndex + 1], unit: "m" };
      } else {
        return { value: 1, unit: "d" };
      }
    } else {
      return { value: LEARNING_STEPS[0], unit: "m" };
    }
  }

  if (rating === 1) {
    return { value: LEARNING_STEPS[0], unit: "m" };
  }

  if (rating === 2) {
    const halved = Math.max(1, Math.round(card.interval * 0.35));
    return { value: halved, unit: "d" };
  }

  let ef = card.easeFactor;
  if (rating === 3) ef = Math.max(1.3, ef - 0.14);
  else if (rating === 4) {
  } else if (rating === 5) ef = Math.min(3.0, ef + 0.15);

  let interval: number;
  const reps = card.repetitions;
  if (reps === 1) {
    interval = rating === 5 ? 4 : 1;
  } else if (reps === 2) {
    interval = rating === 5 ? 10 : 6;
  } else {
    if (rating === 3) {
      interval = Math.max(1, Math.round(card.interval * 0.75));
    } else {
      const base = Math.round(card.interval * ef);
      interval = rating === 5 ? Math.round(base * 1.3) : base;
    }
  }

  return { value: interval, unit: "d" };
}

function formatInterval(iv: { value: number; unit: "m" | "d" }): string {
  if (iv.unit === "m") return `${iv.value}m`;
  if (iv.value === 1) return "1d";
  return `${iv.value}d`;
}

interface RecallCardProps {
  card: Card;
  index: number;
  onReview: (cardId: string, rating: number) => void;
  onDelete: (cardId: string) => void;
  isReviewPending: boolean;
  onGoToChat: (chatId: string) => void;
}

const RecallCard: React.FC<RecallCardProps> = ({
  card,
  index,
  onReview,
  onDelete,
  isReviewPending,
  onGoToChat,
}) => {
  const [isCardRevealed, setIsCardRevealed] = useState(!card.question);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestionText, setEditedQuestionText] = useState(
    card.question || "",
  );

  const updateQuestionMutation = useUpdateQuestion();

  const intervalPreviews = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((rating) =>
        formatInterval(previewNextInterval(card, rating)),
      ),
    [
      card.stage,
      card.stepIndex,
      card.repetitions,
      card.interval,
      card.easeFactor,
    ],
  );

  const handleSaveQuestion = () => {
    if (!editedQuestionText.trim()) return;
    updateQuestionMutation.mutate(
      { cardId: card._id, question: editedQuestionText.trim() },
      {
        onSuccess: () => {
          setIsEditingQuestion(false);
        },
      },
    );
  };

  const detectedLang = React.useMemo(() => {
    const match = card.content.match(/```(\w+)/);
    return match ? match[1] : null;
  }, [card.content]);

  const handleReveal = () => {
    setIsCardRevealed(true);
  };

  return (
    <div className="w-full relative rounded-2xl sm:rounded-[32px] border border-white/10 bg-neutral-900 shadow-2xl flex flex-col mb-8 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Search size={14} /> Card {index + 1}
          </div>
          {card.stage === "learning" ? (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-500 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Clock size={12} /> LEARNING
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-500 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Award size={12} /> SPACED REVIEW
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditedQuestionText(card.question || "");
              setIsEditingQuestion((v) => !v);
            }}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border transition-all ${
              isEditingQuestion
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
            }`}
            title="Edit Question"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">EDIT QUESTION</span>
            <span className="sm:hidden">EDIT</span>
          </button>

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
            onClick={() => setIsPracticeOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border transition-all ${
              isPracticeOpen
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
            }`}
          >
            <PenLine size={14} />
            <span className="hidden sm:inline">PRACTICE BY WRITING</span>
            <span className="sm:hidden">PRACTICE</span>
            {isPracticeOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
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
              {detectedLang
                ? `Practice by typing here (${detectedLang})`
                : "Interactive Editor"}
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
              highlight={(code) =>
                Prism.highlight(
                  code,
                  detectedLang && Prism.languages[detectedLang]
                    ? Prism.languages[detectedLang]
                    : Prism.languages.markdown || Prism.languages.plain,
                  detectedLang && Prism.languages[detectedLang]
                    ? detectedLang
                    : "markdown",
                )
              }
              padding={16}
              placeholder={
                detectedLang
                  ? `Write your ${detectedLang} code here...`
                  : "Type your recall here to test your memory..."
              }
              className={`bg-neutral-900 w-full min-h-[128px] text-gray-200 resize-none leading-relaxed transition-colors ${
                detectedLang
                  ? "text-xs sm:text-sm"
                  : "text-sm sm:text-base font-sans"
              }`}
              style={{
                fontFamily: detectedLang
                  ? '"Fira code", "Fira Mono", monospace'
                  : "inherit",
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

      {/* ── EDIT QUESTION PHASE OR REGULAR QUESTION PHASE ── */}
      {isEditingQuestion ? (
        <div className="w-full p-6 sm:p-10 flex flex-col items-center text-center bg-purple-500/[0.03] border-b border-purple-500/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30">
              <Pencil size={20} />
            </div>
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
              Editing Recall Question
            </span>
          </div>

          <div className="w-full max-w-2xl flex flex-col items-center gap-3">
            <textarea
              autoFocus
              value={editedQuestionText}
              onChange={(e) => setEditedQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSaveQuestion();
                } else if (e.key === "Escape") {
                  setIsEditingQuestion(false);
                }
              }}
              placeholder="Type your custom recall question..."
              rows={Math.max(2, Math.ceil(editedQuestionText.length / 45))}
              className="w-full bg-neutral-950/80 border border-purple-500/30 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 rounded-2xl p-4 sm:p-5 text-lg sm:text-xl md:text-2xl font-semibold text-gray-100 text-left leading-snug placeholder-zinc-600 resize-none transition-all duration-200 shadow-2xl"
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => setIsEditingQuestion(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                Cancel{" "}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">
                  (Esc)
                </span>
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={
                  updateQuestionMutation.isPending || !editedQuestionText.trim()
                }
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/25 active:scale-95"
              >
                {updateQuestionMutation.isPending ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Save Question{" "}
                <span className="text-[10px] text-purple-200 font-normal ml-0.5">
                  (Ctrl+Enter)
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        card.question && (
          <div className="w-full p-6 sm:p-10 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <HelpCircle size={20} />
              </div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                Recall Challenge
              </span>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-100 leading-snug max-w-2xl">
              {card.question}
            </p>

            {/* Hint toggle */}
            {!isCardRevealed && (
              <button
                onClick={() => setIsHintOpen((v) => !v)}
                className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {isHintOpen ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
                {isHintOpen ? "Hide hint" : "Show a hint"}
              </button>
            )}

            {/* Hint — shows first ~120 chars blurred */}
            {isHintOpen && !isCardRevealed && (
              <div className="mt-3 max-w-xl w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 blur-[3px] hover:blur-none transition-all duration-300 select-none cursor-pointer text-left">
                {card.content.slice(0, 240)}…
              </div>
            )}
          </div>
        )
      )}

      {/* ── REVEAL BUTTON — only shown when question exists and card not yet revealed ── */}
      {card.question && !isCardRevealed && (
        <div className="px-6 pb-8 flex justify-center">
          <button
            onClick={handleReveal}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 hover:border-purple-400 hover:text-white transition-all shadow-lg"
          >
            <Eye size={16} />
            Show Card
          </button>
        </div>
      )}

      {isCardRevealed && (
        <>
          {/* Revealed card content */}
          <div className="w-full px-3.5 sm:px-8 md:px-12 pb-6 sm:pb-8 flex flex-col items-start border-t border-white/5 pt-4 sm:pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
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

          {/* Rating buttons */}
          <div className="w-full p-4 sm:p-6 md:p-8 border-t border-white/5 bg-black/20">
            <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-4 text-center">
              Evaluate your recall accuracy
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 w-full max-w-4xl mx-auto">
              {[
                { label: "Very Hard", val: 1, color: "rose" },
                { label: "Hard", val: 2, color: "orange" },
                { label: "Medium", val: 3, color: "amber" },
                { label: "Good", val: 4, color: "emerald" },
                { label: "Easy", val: 5, color: "cyan" },
              ].map((btn, i) => (
                <button
                  key={btn.val}
                  disabled={isReviewPending}
                  onClick={() => onReview(card._id, btn.val)}
                  className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-bold bg-${btn.color}-500/10 text-${btn.color}-400 border border-${btn.color}-500/20 hover:bg-${btn.color}-500 hover:text-white transition-all transform active:scale-95 text-[10px] sm:text-[11px] uppercase tracking-wider shadow-lg disabled:opacity-50 flex flex-col items-center justify-center text-center gap-1 ${
                    i === 4 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  <span>{btn.label}</span>
                  <span className="text-[9px] sm:text-[10px] opacity-60 font-semibold normal-case tracking-normal">
                    {intervalPreviews[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
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
    mutationFn: async ({
      cardId,
      rating,
    }: {
      cardId: string;
      rating: number;
    }) => {
      await api.post(`/recall/update/${cardId}`, { rating });
      return queryClient.invalidateQueries({ queryKey: ["recallCount"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/recall/${cardId}`);
      return queryClient.invalidateQueries({ queryKey: ["recallCount"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/recall/clear");
      return queryClient.invalidateQueries({ queryKey: ["recallCount"] });
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
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-2">
            You're all caught up!
          </h2>
          <p className="text-sm sm:text-base">
            You have reviewed all due Active Recall cards for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-gray-200">
      <div className="flex flex-col min-h-screen px-2 sm:px-6 py-6 md:p-10 w-full max-w-5xl mx-auto animate-in fade-in duration-500 relative">
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Active Recall
              </h1>
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
