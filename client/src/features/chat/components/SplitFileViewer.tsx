import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Download, ExternalLink, MessageCircle, Sparkles } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileViewer from 'react-file-viewer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const injectPdfSelectionStyles = () => {
  const id = 'split-file-viewer-pdf-selection-style';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .react-pdf__Page__textContent,
    .react-pdf__Page__textContent span,
    .textLayer,
    .textLayer span {
      user-select: text !important;
      -webkit-user-select: text !important;
      cursor: text !important;
    }

    .react-pdf__Page__textContent ::selection,
    .textLayer ::selection {
      background: rgba(139, 92, 246, 0.35) !important;
      color: inherit !important;
    }
  `;

  document.head.appendChild(style);
};

interface SplitFileViewerProps {
  fileUrl: string;
  fileName: string;
}

type SelectionAction = {
  type: 'ask' | 'quick';
  text: string;
  nonce: number;
  fileAttachment?: {
    fileUrl: string;
    fileName: string;
  };
};

type FileSelectionOverlay = {
  text: string;
  x: number;
  y: number;
  visible: boolean;
};

const SplitFileViewer: React.FC<SplitFileViewerProps> = ({ fileUrl, fileName }) => {
  const [dividerPosition, setDividerPosition] = useState(50);
  const [viewerKey, setViewerKey] = useState(0); // forces file viewer re-mount on resize
  const [isDragging, setIsDragging] = useState(false);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchingObject, setIsFetchingObject] = useState<boolean>(false);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [fileSelectionOverlay, setFileSelectionOverlay] = useState<FileSelectionOverlay | null>(null);
  const [chatSelectionAction, setChatSelectionAction] = useState<SelectionAction | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const dragPosRef = useRef(dividerPosition);

  useEffect(() => {
    injectPdfSelectionStyles();
  }, []);

  useEffect(() => {
    const hideOverlay = () => {
      setFileSelectionOverlay((prev) => (prev ? { ...prev, visible: false } : null));
    };

    window.addEventListener('scroll', hideOverlay, true);
    window.addEventListener('resize', hideOverlay);

    return () => {
      window.removeEventListener('scroll', hideOverlay, true);
      window.removeEventListener('resize', hideOverlay);
    };
  }, []);
  
  const fileExt = useMemo(() => fileName.toLowerCase().split('.').pop() || '', [fileName]);

  // Handle divider drag
  useEffect(() => { 
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !leftPaneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Constrain between 20% and 80%
      if (newPosition >= 20 && newPosition <= 80) {
        dragPosRef.current = newPosition;
        leftPaneRef.current.style.width = `${newPosition}%`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDividerPosition(dragPosRef.current);
      setViewerKey(prev => prev + 1); // force viewer to re-mount at new size
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Determine file type
  const getFileType = () => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (ext === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
      return 'viewer';
    }
    if (['txt', 'md', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return 'text';
    }
    if (['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'cpp', 'c', 'h', 'hpp', 'go', 'rs', 'php', 'rb', 'sh', 'sql', 'html', 'css', 'p5'].includes(ext)) {
      return 'code';
    }
    return 'unsupported';
  };

  const fileType = getFileType();

  // Fetch file content
  useEffect(() => {
    // Reset all state when file changes
    setTextContent(null);
    setFetchError(null);
    setIsFetchingObject(false);
    setPdfPageCount(0);
    
    if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localBlobUrl);
    }
    setLocalBlobUrl(null);

    if (!fileUrl) return;

    if (fileType === 'pdf' || fileType === 'viewer' || fileType === 'text' || fileType === 'code') {
      setIsFetchingObject(true);
      
      const fetchFile = async () => {
        try {
          const res = await fetch(fileUrl, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          
          if (fileType === 'pdf' || fileType === 'viewer') {
            const blob = await res.blob();
            const mimeMapping: Record<string, string> = {
              'pdf': 'application/pdf',
              'doc': 'application/msword',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'ppt': 'application/vnd.ms-powerpoint',
              'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'csv': 'text/csv',
            };
            const blobWithType = new Blob([blob], { type: mimeMapping[fileExt] || blob.type });
            const objectUrl = URL.createObjectURL(blobWithType);
            setLocalBlobUrl(objectUrl);
          } else {
            const text = await res.text();
            setTextContent(text);
          }
        } catch (err: any) {
          console.error('Failed to fetch file:', err);
          setFetchError(err.message || 'Failed to load file content');
          if (fileType === 'pdf' || fileType === 'viewer') setLocalBlobUrl(fileUrl);
        } finally {
          setIsFetchingObject(false);
        }
      };

      fetchFile();
    } else {
      setLocalBlobUrl(fileUrl);
    }
    
    return () => {
      // Cleanup happens on next run or unmount
    };
  }, [fileUrl, fileType, fileExt]);

  const getLanguage = () => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'jsx': return 'jsx';
      case 'py': return 'python';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'csv': return 'csv';
      default: return 'text';
    }
  };

  const clearNativeSelection = () => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
  };

  const handleFileTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
      setTimeout(() => {
        setFileSelectionOverlay((prev) => (prev ? { ...prev, visible: false } : null));
      }, 120);
      return;
    }

    if (!selection || selection.rangeCount === 0 || !leftPaneRef.current) return;

    const range = selection.getRangeAt(0);
    const rootNode = range.commonAncestorContainer;
    if (!leftPaneRef.current.contains(rootNode)) return;

    const rect = range.getBoundingClientRect();
    if (!rect) return;

    setFileSelectionOverlay({
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: Math.max(rect.top - 12, 70),
      visible: true,
    });
  };

  const triggerChatSelectionAction = (type: 'ask' | 'quick') => {
    if (!fileSelectionOverlay?.text) return;

    setChatSelectionAction({
      type,
      text: fileSelectionOverlay.text,
      nonce: Date.now(),
      fileAttachment:
        type === 'ask'
          ? {
              fileUrl,
              fileName,
            }
          : undefined,
    });

    setFileSelectionOverlay((prev) => (prev ? { ...prev, visible: false } : null));
    clearNativeSelection();
  };

  const renderFilePreview = () => {
    if (isFetchingObject) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-sm font-medium">Preparing document view...</p>
        </div>
      );
    }

    if (fetchError && fileType !== 'viewer' && fileType !== 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center bg-zinc-900">
          <div className="text-5xl mb-6 opacity-50">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Fetch Error</h3>
          <p className="text-sm text-zinc-500 mb-8 max-w-sm">{fetchError}</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all transform hover:scale-105"
          >
            <ExternalLink size={18} />
            Open Source File
          </a>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full h-full flex flex-col bg-zinc-900 overflow-auto custom-scrollbar">
            <div className="w-full min-h-full p-4">
              <Document
                key={`${viewerKey}-pdf`}
                file={localBlobUrl || fileUrl}
                onLoadSuccess={(pdf: { numPages: number }) => setPdfPageCount(pdf.numPages)}
                onLoadError={(error: Error) => {
                  console.error('PDF render error:', error);
                  setFetchError(error.message || 'Failed to render PDF');
                }}
                loading={
                  <div className="text-zinc-400 text-sm">Loading PDF...</div>
                }
              >
                {Array.from({ length: pdfPageCount }, (_, index) => (
                  <div key={`pdf-page-wrap-${index + 1}`} className="mb-4 last:mb-0 flex justify-center">
                    <Page
                      key={`pdf-page-${index + 1}`}
                      pageNumber={index + 1}
                      width={Math.max((leftPaneRef.current?.clientWidth || 900) - 40, 360)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        );

      case 'viewer':
        return (
          <div className="w-full h-full flex flex-col bg-zinc-900 overflow-auto custom-scrollbar">
            <div className="w-full h-full p-2">
              <FileViewer
                key={`${viewerKey}-${fileExt}`}
                fileType={fileExt}
                filePath={localBlobUrl || fileUrl}
                onError={(error: Error) => {
                  console.error('FileViewer render error:', error);
                  setFetchError(error.message || 'Failed to render file');
                }}
              />
            </div>
          </div>
        );
      
      case 'code':
      case 'text':
        return (
          <div className="w-full h-full flex flex-col bg-zinc-900 overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {textContent !== null ? (
                <div className="flex flex-col">
                  {/* Subtle info header inside the scrollable area */}
                  <div className="flex items-center justify-between px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono uppercase tracking-tighter">
                        {getLanguage()}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                         {textContent.length.toLocaleString()} chars
                      </span>
                    </div>
                  </div>
                  
                  <SyntaxHighlighter
                    language={getLanguage()}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.7',
                      backgroundColor: 'transparent',
                    }}
                    showLineNumbers={true}
                    wrapLongLines={true}
                    lineNumberStyle={{ color: '#3f3f46', minWidth: '2.5em' }}
                  >
                    {textContent || '// File is empty'}
                  </SyntaxHighlighter>
                  
                  <div className="h-20 flex items-center justify-center border-t border-zinc-800/20 bg-zinc-900/10">
                    <p className="text-[10px] text-zinc-600 italic tracking-widest uppercase">End of document</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <p className="text-xs">Processing content...</p>
                </div>
              )}
            </div>
          </div>
        );

      
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-semibold mb-2">{fileName}</p>
              <p className="text-sm text-zinc-500 mb-6">File type: .{fileType === 'unsupported' ? fileName.split('.').pop() : fileType}</p>
              <div className="flex gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  Open in New Tab
                </a>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleClose = () => {
    sessionStorage.removeItem('splitViewFile');
    navigate(-1);
  };

  return (
    <div
      ref={containerRef}
      id="split-container"
      className="flex h-screen w-full bg-(--theme-bg-base) text-gray-200 overflow-hidden relative"
    >
      {/* Left side - File Viewer */}
      <div
        ref={leftPaneRef}
        className={`flex flex-col border-r border-zinc-800 ${isDragging ? '' : 'transition-all duration-75'}`}
        style={{ width: `${dividerPosition}%` }}
      >
        {/* File Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0 overflow-x-auto no-scrollbar">
            <span className="text-sm font-medium text-zinc-400">📄</span>
            <span className="text-sm font-semibold text-white truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <a 
              href={fileUrl} 
              download={fileName}
              title="Download file"
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
            >
              <Download size={18} />
            </a>
            <button
              onClick={handleClose}
              title="Close split view"
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* File Preview Area */}
        <div className="flex-1 overflow-hidden" onMouseUp={handleFileTextSelection}>
          {renderFilePreview()}
        </div>
      </div>

      {/* Divider */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className={`w-1 bg-zinc-700 hover:bg-blue-500 cursor-col-resize transition-colors select-none relative group ${
          isDragging ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : ''
        }`}
      >
        {/* Divider label */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none text-xs text-zinc-500 group-hover:text-blue-400 transition-colors whitespace-nowrap">
          <div className="hidden group-hover:flex items-center justify-center">
            <span className="text-[10px] font-semibold tracking-widest">DRAG</span>
          </div>
        </div>
      </div>

      {/* Right side - Chat Window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          externalSelectionAction={chatSelectionAction}
          onExternalSelectionHandled={() => setChatSelectionAction(null)}
        />
      </div>

      {/* Resize Hint */}
      {!isDragging && (
        <div className="absolute left-1/2 bottom-4 transform -translate-x-1/2 text-xs text-zinc-600 pointer-events-none">
          Drag divider to resize
        </div>
      )}

      {fileSelectionOverlay && fileSelectionOverlay.visible && (
        <div
          className="fixed z-120 -translate-x-1/2 -translate-y-full mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ top: fileSelectionOverlay.y, left: fileSelectionOverlay.x }}
        >
          <button
            onClick={() => triggerChatSelectionAction('ask')}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2"
            title="Send selected text to main chat composer"
          >
            <MessageCircle size={14} />
            Ask in Chat
          </button>
          <button
            onClick={() => triggerChatSelectionAction('quick')}
            className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-violet-500 transition-all flex items-center gap-2"
            title="Open temporary quick chat for selected text"
          >
            <Sparkles size={14} />
            Quick Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default SplitFileViewer;