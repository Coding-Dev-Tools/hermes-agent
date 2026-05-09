import { useCallback, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastEntry {
  id: string;
  message: string;
  type: ToastType;
  persistent: boolean;
  durationMs: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType, options?: { duration?: number }) => {
      const id = `toast-${++counterRef.current}`;
      const persistent = type === "error";
      const durationMs = options?.duration ?? 3000;
      const entry: ToastEntry = { id, message, type, persistent, durationMs };
      setToasts((prev) => [...prev, entry]);

      if (!persistent) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, durationMs);
      }
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

  return { toasts, toast, showToast, dismissToast };
}
