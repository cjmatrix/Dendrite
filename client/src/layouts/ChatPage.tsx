import { Outlet, useParams, useNavigate } from "react-router-dom";
import FileExplorer from "../features/explorer/components/FileExplorer";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/store";
import FileDisplay from "../features/explorer/components/FileDisplay";
import { resolveSharedLink } from "../features/explorer/api/shareLinkApi";
import { setIsShareMode } from "../features/explorer/store/explorerSlice";
import { useQueryClient } from "@tanstack/react-query";
import DendritesLogo from "../components/DendritesLogo";

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { id, token } = useParams<{ id?: string, token?: string }>();
  const isExplorerModalOpen = useAppSelector((state) => state.explorer.isExplorerModalOpen);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isShareLoading, setIsShareLoading] = useState(!!token);

  useEffect(() => {
    if (id && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [id]);

  useEffect(() => {
    if (token) {
      dispatch(setIsShareMode(true));
      setIsShareLoading(true);
      resolveSharedLink(token, id).then((data) => {
        if (data.targetType === "folder") {
          queryClient.setQueryData(["folders"], data.folders);
          queryClient.setQueryData(["chats"], data.chats);
        } else {
          queryClient.setQueryData(["folders"], []);
          queryClient.setQueryData(["chats"], [data.chat]);
        }

        if (id || data.targetType === "chat") {
          const targetChat = data.chat;
          if (targetChat) {
            queryClient.setQueryData(["chat", targetChat._id], targetChat);
            queryClient.setQueryData(["chatMessages", targetChat._id], {
              pages: [{
                messages: data.messages || [],
                nextCursor: null,
                hasMore: false,
                total: data.messages?.length || 0
              }],
              pageParams: [null]
            });

            if (!id) {
              navigate(`/share/${token}/chat/${targetChat._id}`, { replace: true });
            }
          }
        }
        setIsShareLoading(false);
      }).catch(err => {
         console.error("Failed to load shared link:", err);
         setIsShareLoading(false);
      });
    } else {
      dispatch(setIsShareMode(false));
      setIsShareLoading(false);
    }
  }, [token, id, queryClient, dispatch, navigate]);

  if (isShareLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-gray-200 font-sans">
        <DendritesLogo size={60} className="mb-4 animate-pulse" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Resolving shared link...</span>
      </div>
    );
  }

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
           <div className="bg-(--theme-bg-surface) border border-zinc-800 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
