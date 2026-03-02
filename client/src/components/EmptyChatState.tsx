import { MessageSquare } from "lucide-react";

export default function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--theme-bg-base)] text-gray-400 h-screen w-full">
      <div className="bg-[var(--theme-bg-surface)] p-6 rounded-2xl border border-zinc-800 flex flex-col items-center max-w-sm text-center shadow-xl">
        <div className="bg-[var(--theme-bg-elevated)] p-4 rounded-xl mb-4 border border-zinc-800">
          <MessageSquare size={32} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Select a Chat
        </h2>
        <p className="text-sm text-gray-500">
          Choose an existing chat from the sidebar or start a new one to
          continue your research.
        </p>
      </div>
    </div>
  );
}
