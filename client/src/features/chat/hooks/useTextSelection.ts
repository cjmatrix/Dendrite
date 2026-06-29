import { useState, useCallback, useEffect, useRef } from "react";
import { getMarkdownFromDOMSelection } from "../../../utils/markdownUtils";

export interface TextSelection {
  text: string;
  markdown: string;
  x: number;
  y: number;
  bottomY: number;
  relativeY?: number;
  messageId: string;
  visible: boolean;
  subChatId: string | null;
}


function processSelection(): TextSelection | null {
  const sel = window.getSelection();
  const selectedText = sel?.toString().trim();

  if (!selectedText || selectedText.length === 0) return null;

  let range;
  try {
    range = sel?.getRangeAt(0);
  } catch {
    return null;
  }
  const rect = range?.getBoundingClientRect();

  let messageId = "";
  let bubbleElement: HTMLElement | null = null;
  let curr: HTMLElement | null = sel?.anchorNode?.parentElement || null;
  while (curr && curr !== document.body) {
    if (curr.dataset?.messageId) {
      messageId = curr.dataset.messageId;
      bubbleElement = curr;
      break;
    }
    curr = curr.parentElement;
  }

  if (rect && rect.width > 0 && messageId && bubbleElement) {
    const bubbleRect = bubbleElement.getBoundingClientRect();
    const relativeY = rect.top - bubbleRect.top;
    const capturedMarkdown = getMarkdownFromDOMSelection() || selectedText;

    return {
      text: selectedText,
      markdown: capturedMarkdown,
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY,
      bottomY: rect.bottom + window.scrollY,
      relativeY,
      messageId,
      visible: true,
      subChatId: null,
    };
  }

  return null;
}

export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const selectionChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 
  const handleTextSelection = useCallback(() => {
    setTimeout(() => {
      const result = processSelection();
      if (result) {
        setSelection(result);
      } else {
        setTimeout(
          () => setSelection((prev) => (prev ? { ...prev, visible: false } : null)),
          200,
        );
      }
    }, 80);
  }, []);

 
  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const handleSelectionChange = () => {
   
      if (selectionChangeTimerRef.current) {
        clearTimeout(selectionChangeTimerRef.current);
      }
      selectionChangeTimerRef.current = setTimeout(() => {
        const result = processSelection();
        if (result) {
          setSelection(result);
        } else {
          setSelection((prev) => (prev ? { ...prev, visible: false } : null));
        }
      }, 300);
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionChangeTimerRef.current) {
        clearTimeout(selectionChangeTimerRef.current);
      }
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    try {
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openSubChatSelection = useCallback((messageId: string, subChatId: string) => {
    setSelection({
      text: "",
      markdown: "",
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      bottomY: window.innerHeight / 2,
      messageId,
      visible: false,
      subChatId,
    });
  }, []);

  return { selection, handleTextSelection, clearSelection, openSubChatSelection };
}
