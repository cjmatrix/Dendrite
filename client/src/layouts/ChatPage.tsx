import { Outlet, useParams } from "react-router-dom";
import FileExplorer from "../features/explorer/components/FileExplorer";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAppSelector } from "../store/store";
import FileDisplay from "../features/explorer/components/FileDisplay";

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { id } = useParams();
  const isExplorerModalOpen = useAppSelector((state) => state.explorer.isExplorerModalOpen);

  useEffect(() => {
    if (id && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [id]);

  return (
    <div className="flex h-screen relative">
     
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-(--theme-bg-surface) border border-zinc-800 rounded-lg text-gray-400 hover:text-white transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

   
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

   
      <div
        className={`
        fixed md:sticky md:top-0 md:h-screen md:self-start z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <FileExplorer />
      </div>

      
      {isExplorerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
           <div className="bg-(--theme-bg-surface) border border-zinc-800 w-full h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <FileDisplay isModal={true} currentFolderId={undefined} />
           </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto h-screen custom-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}

export default ChatPage;
