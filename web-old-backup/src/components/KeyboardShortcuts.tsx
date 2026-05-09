import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { category: "General", items: [
    { keys: ["Ctrl", "K"], description: "Open command palette" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Esc"], description: "Close modal / menu" },
  ]},
  { category: "Chat", items: [
    { keys: ["Enter"], description: "Send message" },
    { keys: ["Shift", "Enter"], description: "New line" },
    { keys: ["Ctrl", "L"], description: "New chat" },
    { keys: ["/"], description: "Show slash commands" },
  ]},
  { category: "Editor", items: [
    { keys: ["Ctrl", "S"], description: "Save file" },
    { keys: ["Ctrl", "W"], description: "Close tab" },
  ]},
  { category: "Navigation", items: [
    { keys: ["Ctrl", "1"], description: "Go to Chat" },
    { keys: ["Ctrl", "2"], description: "Go to Sessions" },
    { keys: ["Ctrl", "3"], description: "Go to Analytics" },
  ]},
];

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3
                className="text-[10px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <kbd
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono"
                            style={{
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {key}
                          </kbd>
                          {ki < shortcut.keys.length - 1 && (
                            <span style={{ color: 'var(--text-muted)' }}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
