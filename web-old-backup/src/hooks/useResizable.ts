import { useState, useCallback, useRef } from "react";

interface ResizableState {
  width: number;
  isResizing: boolean;
}

export function useResizable(
  initialWidth: number,
  minWidth: number = 150,
  maxWidth: number = 600,
  storageKey?: string
) {
  const [state, setState] = useState<ResizableState>(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const width = parseInt(saved, 10);
        if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
          return { width, isResizing: false };
        }
      }
    }
    return { width: initialWidth, isResizing: false };
  });

  const startXRef = useRef(0);
  const startWidthRef = useRef(state.width);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = state.width;
      setState((s) => ({ ...s, isResizing: true }));

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, startWidthRef.current + delta)
        );
        setState({ width: newWidth, isResizing: true });
      };

      const handleMouseUp = () => {
        setState((s) => {
          if (storageKey && typeof window !== "undefined") {
            localStorage.setItem(storageKey, String(s.width));
          }
          return { ...s, isResizing: false };
        });
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [state.width, minWidth, maxWidth, storageKey]
  );

  return { width: state.width, isResizing: state.isResizing, startResizing };
}
