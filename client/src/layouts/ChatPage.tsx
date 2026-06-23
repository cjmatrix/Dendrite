import { Outlet, useParams, useNavigate } from "react-router-dom";
import FileExplorer from "../features/explorer/components/FileExplorer";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/store";
import FileDisplay from "../features/explorer/components/FileDisplay";
import { resolveSharedLink } from "../features/explorer/api/shareLinkApi";
import { setIsShareMode, toggleRecallOverlay } from "../features/explorer/store/explorerSlice";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import DendritesLogo from "../components/DendritesLogo";
import RecallPage from "../features/recall/components/RecallPage";

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { id, token } = useParams<{ id?: string, token?: string }>();
  const isExplorerModalOpen = useAppSelector((state) => state.explorer.isExplorerModalOpen);
  const isRecallOverlayOpen = useAppSelector((state) => state.explorer.isRecallOverlayOpen);
  

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  
  const { data: sharedData, isLoading: isShareLoading, error: shareError } = useQuery({
    queryKey: ["sharedLinkData", token],
    queryFn: () => resolveSharedLink(token!),
    enabled: !!token,
    staleTime: Infinity,
  });


  useEffect(() => {
    dispatch(setIsShareMode(!!token));
  }, [token, dispatch]);

  
  useEffect(() => {
    if (!token || !sharedData) return;

    if (sharedData.targetType === "folder") {
     
      queryClient.setQueryData(["folders"], sharedData.folders || []);
      queryClient.setQueryData(["chats"], sharedData.chats || []);

     
      if (id) {
        const targetChat = sharedData.chats?.find((c: any) => (c._id || c.id) === id);
        if (targetChat) {
          queryClient.setQueryData(["chat", id], targetChat);

          const targetMessages = sharedData.messages?.filter((m: any) => m.chatId === id) || [];
          queryClient.setQueryData(["chatMessages", id], {
            pages: [{
              messages: targetMessages,
              nextCursor: null,
              hasMore: false,
              total: targetMessages.length
            }],
            pageParams: [null]
          });
        }
      }
    } else if (sharedData.targetType === "chat") {
    
      const targetChat = sharedData.chat;
      queryClient.setQueryData(["folders"], []);
      queryClient.setQueryData(["chats"], targetChat ? [targetChat] : []);

      if (targetChat) {
        const chatId = targetChat._id || targetChat.id;
        queryClient.setQueryData(["chat", chatId], targetChat);

        const targetMessages = sharedData.messages || [];
        queryClient.setQueryData(["chatMessages", chatId], {
          pages: [{
            messages: targetMessages,
            nextCursor: null,
            hasMore: false,
            total: targetMessages.length
          }],
          pageParams: [null]
        });

       
        if (!id) {
          navigate(`/share/${token}/chat/${chatId}`, { replace: true });
        }
      }
    }
  }, [token, sharedData, id, queryClient, navigate]);


  useEffect(() => {
    if (id && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [id]);

  if (token && isShareLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-gray-200 font-sans">
        <DendritesLogo size={60} className="mb-4 animate-pulse" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Resolving shared link...</span>
      </div>
    );
  }

  if (token && shareError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-red-400 font-sans p-6 text-center">
        <DendritesLogo size={60} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Failed to resolve shared link</h2>
        <p className="text-sm text-zinc-500 max-w-md">The shared link may have expired, or it is invalid.</p>
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
      {/* Recall Page Overlay */}
      {isRecallOverlayOpen && (
        <div className="fixed inset-0 z-[60] bg-(--theme-bg-base) animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden">
          <RecallPage onClose={() => dispatch(toggleRecallOverlay(false))} />
        </div>
      )}
    </div>
  );
}

export default ChatPage;
