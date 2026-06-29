import { useState, useEffect, useCallback } from "react";

interface UseResizableProps {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  direction?: "left" | "right"; // "left": panel is on the right (handle on left), "right": panel is on the left (handle on right)
  containerRef?: React.RefObject<HTMLElement | null>;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export function useResizable({
  initialWidth,
  minWidth = 150,
  maxWidth = 800,
  direction = "right",
  containerRef,
  onResizeStart,
  onResizeEnd,
}: UseResizableProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    onResizeStart?.();
  }, [onResizeStart]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth = width;
      if (direction === "right") {
        if (containerRef?.current) {
          const rect = containerRef.current.getBoundingClientRect();
          newWidth = e.clientX - rect.left;
        } else {
          newWidth = e.clientX;
        }
      } else {
        newWidth = window.innerWidth - e.clientX;
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    },
    [isResizing, direction, minWidth, maxWidth, containerRef]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return {
    width,
    isResizing,
    startResizing,
  };
}
