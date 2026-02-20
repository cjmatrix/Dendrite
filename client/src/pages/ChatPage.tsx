import ChatWindow from "../components/ChatWindow"
import FileExplorer from "../components/FileExplorer"
function ChatPage() {
  return (
    <div className=" flex">
        <FileExplorer></FileExplorer>
        <ChatWindow></ChatWindow>
    </div>
  )
}

export default ChatPage