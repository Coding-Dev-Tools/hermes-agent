import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { ToastEntry, ToastType } from "@/hooks/useToast";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  error: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
  info: <Info className="h-3.5 w-3.5 shrink-0" />,
};

const STYLES: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
    text: "var(--success)",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    text: "var(--error)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
    text: "var(--warning)",
  },
  info: {
    bg: "rgba(99, 102, 241, 0.12)",
    border: "rgba(99, 102, 241, 0.25)",
    text: "var(--accent)",
  },
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: "var(--success)",
  error: "var(--error)",
  warning: "var(--warning)",
  info: "var(--accent)",
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-14 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const style = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex flex-col items-stretch gap-0 pl-3 pr-2.5 py-2.5 rounded-lg backdrop-blur-sm overflow-hidden"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.text,
              animation: "toast-in 200ms ease-out forwards",
              minWidth: "240px",
              maxWidth: "400px",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ color: style.text }}>{ICONS[toast.type]}</span>
              <span className="flex-1 text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                {toast.message}
              </span>
              {toast.persistent && (
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="shrink-0 p-0.5 rounded transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {!toast.persistent && (
              <div
                className="h-0.5 mt-2 rounded-full"
                style={{
                  background: PROGRESS_COLORS[toast.type],
                  animation: `toast-progress ${toast.durationMs}ms linear forwards`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

export function Toast({ toast }: { toast: { message: string; type: ToastType } | null }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(toast);

  useEffect(() => {
    if (toast) {
      setCurrent(toast);
      setVisible(true);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setCurrent(null), 200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!current) return null;

  const style = STYLES[current.type];

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 right-4 z-[200] flex items-center gap-2.5 pl-3 pr-2.5 py-2.5 rounded-lg backdrop-blur-sm"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        animation: visible ? "toast-in 200ms ease-out forwards" : "toast-out 200ms ease-in forwards",
        minWidth: "240px",
        maxWidth: "400px",
      }}
    >
      <span style={{ color: style.text }}>{ICONS[current.type]}</span>
      <span className="flex-1 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
        {current.message}
      </span>
    </div>,
    document.body,
  );
}
