import { Outlet, useParams } from "react-router-dom";
import FileExplorer from "../components/FileExplorer";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (id && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [id]);

  return (
    <div className="flex h-screen relative">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-[var(--theme-bg-surface)] border border-zinc-800 rounded-lg text-gray-400 hover:text-white transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:sticky md:top-0 md:h-screen md:self-start z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <FileExplorer />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto h-screen custom-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}

export default ChatPage;
