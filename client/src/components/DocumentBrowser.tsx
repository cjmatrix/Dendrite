import React from "react";
import { X, File, Image, Eye } from "lucide-react";
import type { UploadedDocument } from "../hooks/useDocumentHistory";

interface DocumentBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  documents: UploadedDocument[];
  onOpenSplitView: (fileUrl: string, fileName: string) => void;
  onRemoveDocument: (fileUrl: string) => Promise<void>;
}

export const DocumentBrowser: React.FC<DocumentBrowserProps> = ({
  isOpen,
  onClose,
  documents,
  onOpenSplitView,
  onRemoveDocument,
}) => {
  if (!isOpen) return null;
    console.log(documents)
  const documentFiles = documents.length>0?documents.filter((doc) => doc.fileType === "document"):[];
  const imageFiles = documents.length>0?documents.filter((doc) => doc.fileType === "image"):[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
      <div className="bg-(--theme-bg-surface) border border-zinc-800 w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <div>
            <h2 className="text-xl font-bold text-white">Uploaded Files</h2>
            <p className="text-sm text-zinc-400">
              {documents.length} file{documents.length !== 1 ? "s" : ""} uploaded
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <File size={32} className="text-gray-600 mb-4" />
              <p className="text-gray-400">No files uploaded yet</p>
            </div>
          ) : (
            <>
              {/* Documents Section */}
              {documentFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <File size={16} />
                    Documents ({documentFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {documentFiles.map((doc) => (
                      <div
                        key={doc.fileUrl}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.extension.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() =>
                              onOpenSplitView(doc.fileUrl, doc.filename)
                            }
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-all flex items-center gap-1.5"
                          >
                            <Eye size={12} />
                            Split View
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await onRemoveDocument(doc.fileUrl);
                              } catch (error) {
                                console.error('Failed to remove document:', error);
                                // Could show a toast or alert here
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images Section */}
              {imageFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <Image size={16} />
                    Images ({imageFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {imageFiles.map((img) => (
                      <div
                        key={img.fileUrl}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {img.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {img.extension.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={img.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-500 transition-all flex items-center gap-1.5"
                          >
                            <Eye size={12} />
                            View
                          </a>
                          <button
                            onClick={() => onRemoveDocument(img.fileUrl)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
