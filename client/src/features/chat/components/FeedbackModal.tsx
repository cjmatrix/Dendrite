import React, { useState } from "react";
import { X, Send, MessageSquareHeart, Star } from "lucide-react";
import { submitFeedback } from "../api/feedbackApi";
import { toast } from "react-hot-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({ content, rating: rating > 0 ? rating : undefined });
      toast.success("Thank you for your feedback!");
      setContent("");
      setRating(0);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <MessageSquareHeart size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-200">Send Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-sm text-zinc-400">
            We'd love to hear your thoughts, suggestions, or any issues you're facing.
          </p>

          {/* Rating */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 transition-transform hover:scale-110 active:scale-95 ${
                  star <= rating ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-zinc-600 hover:text-zinc-500"
                }`}
              >
                <Star size={32} fill={star <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full h-32 bg-zinc-950/50 border border-white/10 rounded-xl p-3 text-sm text-gray-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none transition-all"
            required
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Send size={16} />
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
