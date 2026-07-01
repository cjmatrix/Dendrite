import { useState, useMemo } from "react";
import { useAdminFeedback, useUpdateFeedbackStatus } from "./hooks/useAdminFeedback";
import { Table, type Column } from "../../../components/common/Table";
import { Search, Filter, MessageSquareHeart, Star } from "lucide-react";
import { useDebouncedValue } from "../../../components/common/useDebouncedValue";
import type { IFeedback } from "./api/adminFeedbackApi";

export default function FeedbackManagementPage() {
  const { data: feedbacks, isLoading, error } = useAdminFeedback();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateFeedbackStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  const filteredData = useMemo(() => {
    if (!feedbacks) return [];
    
    return feedbacks.filter((fb) => {
      const matchesSearch = 
        fb.content.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        fb.userId?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        fb.userId?.username?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus = statusFilter ? fb.status === statusFilter : true;
      
      return matchesSearch && matchesStatus;
    });
  }, [feedbacks, debouncedSearch, statusFilter]);

  const columns: Column<IFeedback>[] = [
    {
      header: "User",
      key: "user",
      render: (fb) => (
        <>
          <div className="font-medium text-white">{fb.userId?.username || "Unknown"}</div>
          <div className="text-xs text-zinc-400">{fb.userId?.email || "No email"}</div>
        </>
      ),
    },
    {
      header: "Feedback",
      key: "content",
      render: (fb) => (
        <div className="max-w-xs md:max-w-sm truncate text-zinc-300" title={fb.content}>
          {fb.content}
        </div>
      ),
    },
    {
      header: "Rating",
      key: "rating",
      render: (fb) => (
        fb.rating ? (
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-semibold">{fb.rating}/5</span>
          </div>
        ) : <span className="text-zinc-500 text-sm">N/A</span>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (fb) => (
        <select
          value={fb.status}
          onChange={(e) => updateStatus({ id: fb._id, status: e.target.value as "new" | "reviewed" | "resolved" })}
          disabled={isUpdating}
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize appearance-none cursor-pointer outline-none border transition-colors ${
            fb.status === "new"
              ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
              : fb.status === "reviewed"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          <option value="new" className="bg-zinc-900 text-white">New</option>
          <option value="reviewed" className="bg-zinc-900 text-white">Reviewed</option>
          <option value="resolved" className="bg-zinc-900 text-white">Resolved</option>
        </select>
      ),
    },
    {
      header: "Date",
      key: "createdAt",
      render: (fb) => (
        <span className="text-zinc-400 text-sm">
          {new Date(fb.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (error) {
    return <div className="p-8 text-rose-500 text-sm">Error loading feedback...</div>;
  }

  return (
    <div className="p-4 md:p-8 text-white h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <MessageSquareHeart size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Feedback Management</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Review and respond to user feedback and feature requests.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by keyword, name, or email..."
            className="w-full bg-zinc-900/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            className="bg-zinc-900/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <Table
          columns={columns}
          data={filteredData}
          keyExtractor={(fb) => fb._id}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
