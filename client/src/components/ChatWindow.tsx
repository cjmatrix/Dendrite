import React, { useState } from 'react';
import { Paperclip, Send, Bot } from 'lucide-react';

const ChatWindow: React.FC = () => {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-screen bg-[#0d0d12] text-slate-200 font-sans w-full">
      {/* 1. Header Area / Welcome Message */}
      <div className="flex-1 flex flex-col items-start p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-4 mt-4">
          <div className="bg-[#1e1e26] p-2 rounded-lg border border-slate-700">
            <Bot size={24} className="text-slate-400" />
          </div>
          <h1 className="text-lg font-medium">
            Welcome to Dendrite. How can I help with your research today?
          </h1>
        </div>
      </div>

      {/* 2. Input Container Fixed at Bottom */}
      <div className="p-6 border-t border-slate-800/50 bg-[#0d0d12]">
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-center bg-[#16161e] border border-slate-700/50 rounded-2xl px-4 py-3 focus-within:border-slate-500 transition-all shadow-xl">
            {/* Attachment Button */}
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
              <Paperclip size={20} />
            </button>

            {/* Main Input */}
            <input
              type="text"
              placeholder="Ask research questions..."
              className="flex-1 bg-transparent border-none outline-none px-3 text-slate-200 placeholder:text-slate-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {/* Send Button */}
            <button 
              className={`p-2 rounded-xl transition-all ${
                input.trim() ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;