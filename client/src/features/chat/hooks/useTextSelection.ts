import { useState, useCallback } from "react";
import { getMarkdownFromDOMSelection } from "../../../utils/markdownUtils";

export interface TextSelection {
  text: string;
  markdown: string;
  x: number;
  y: number;
  relativeY?: number;
  messageId: string;
  visible: boolean;
  subChatId: string | null;
}

export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = sel?.getRangeAt(0);
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

      if (rect && messageId && bubbleElement) {
        const bubbleRect = bubbleElement.getBoundingClientRect();
        const relativeY = rect.top - bubbleRect.top;
        const capturedMarkdown = getMarkdownFromDOMSelection() || selectedText;

        setSelection({
          text: selectedText,
          markdown: capturedMarkdown,
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          relativeY,
          messageId,
          visible: true,
          subChatId: null,
        });
      }
    } else {
      setTimeout(
        () => setSelection((prev) => (prev ? { ...prev, visible: false } : null)),
        200,
      );
    }
  }, []);

  const clearSelection = useCallback(() => setSelection(null), []);

  const openSubChatSelection = useCallback((messageId: string, subChatId: string) => {
    setSelection({
      text: "",
      markdown: "",
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      messageId,
      visible: false,
      subChatId,
    });
  }, []);

  return { selection, handleTextSelection, clearSelection, openSubChatSelection };
}
