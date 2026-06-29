import DendritesLogo from "../../../components/DendritesLogo";
import { MessageContent } from "./MessageContent";
import { StreamingContext } from "../../../providers/StreamingContext";
import { AILoadingIndicator } from "../../../components/common/AILoadingIndicator";

interface VirtuosoFooterProps {
  context: {
    isStreaming: boolean;
    streamingText: string;
  };
}

export const VirtuosoFooter = ({ context }: VirtuosoFooterProps) => {
  const { isStreaming, streamingText } = context;
  return (
    <div
      className={` ${isStreaming ? "pb-[80vh]" : "pb-32 "} ${isStreaming ? "md:pb-[80vh]" : "pb-32 "} max-w-4xl mx-auto w-full pl-12 pr-4 md:px-8 `}
    >
      {/* Streaming response */}
      {streamingText && (
        <div className="flex w-full gap-4 max-w-full streaming-bubble mt-6">
          <DendritesLogo
            isLoading={true}
            className="mt-1 hidden sm:flex shrink-0"
          />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[13px] font-semibold text-gray-200 uppercase tracking-wider">
                Nurons AI
              </span>
            </div>
            <div className="markdown-body text-[16px] leading-relaxed text-gray-300 w-full overflow-hidden">
              <StreamingContext.Provider value={true}>
                <MessageContent content={streamingText} />
              </StreamingContext.Provider>
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 rounded-sm streaming-cursor align-middle" />
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {isStreaming && !streamingText && <AILoadingIndicator />}
    </div>
  );
};

VirtuosoFooter.displayName = "VirtuosoFooter";
