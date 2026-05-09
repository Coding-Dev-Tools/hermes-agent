import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Terminal, BarChart3, Cpu, FileText, Package,
  Puzzle, Settings, KeyRound, BookOpen, Clock, Users, FolderTree,
  Command, Keyboard, X,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  section: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onOpenShortcuts: () => void;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold" style={{ color: 'var(--accent)' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette({ onClose, onOpenShortcuts }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: "chat", label: "Go to Chat", icon: <MessageSquare className="h-4 w-4" />, action: () => { navigate("/chat"); onClose(); }, section: "Navigation" },
    { id: "sessions", label: "Go to Sessions", icon: <Terminal className="h-4 w-4" />, action: () => { navigate("/sessions"); onClose(); }, section: "Navigation" },
    { id: "analytics", label: "Go to Analytics", icon: <BarChart3 className="h-4 w-4" />, action: () => { navigate("/analytics"); onClose(); }, section: "Navigation" },
    { id: "models", label: "Go to Models", icon: <Cpu className="h-4 w-4" />, action: () => { navigate("/models"); onClose(); }, section: "Navigation" },
    { id: "logs", label: "Go to Logs", icon: <FileText className="h-4 w-4" />, action: () => { navigate("/logs"); onClose(); }, section: "Navigation" },
    { id: "skills", label: "Go to Skills", icon: <Package className="h-4 w-4" />, action: () => { navigate("/skills"); onClose(); }, section: "Navigation" },
    { id: "plugins", label: "Go to Plugins", icon: <Puzzle className="h-4 w-4" />, action: () => { navigate("/plugins"); onClose(); }, section: "Navigation" },
    { id: "config", label: "Go to Config", icon: <Settings className="h-4 w-4" />, action: () => { navigate("/config"); onClose(); }, section: "Settings" },
    { id: "env", label: "Go to API Keys", icon: <KeyRound className="h-4 w-4" />, action: () => { navigate("/env"); onClose(); }, section: "Settings" },
    { id: "cron", label: "Go to Cron Jobs", icon: <Clock className="h-4 w-4" />, action: () => { navigate("/cron"); onClose(); }, section: "Settings" },
    { id: "profiles", label: "Go to Profiles", icon: <Users className="h-4 w-4" />, action: () => { navigate("/profiles"); onClose(); }, section: "Settings" },
    { id: "docs", label: "Go to Documentation", icon: <BookOpen className="h-4 w-4" />, action: () => { navigate("/docs"); onClose(); }, section: "Settings" },
    { id: "files", label: "Toggle File Explorer", icon: <FolderTree className="h-4 w-4" />, action: () => { onClose(); }, shortcut: "⌘E", section: "Actions" },
    { id: "shortcuts", label: "Keyboard Shortcuts", description: "View all keyboard shortcuts", icon: <Keyboard className="h-4 w-4" />, action: () => { onClose(); onOpenShortcuts(); }, shortcut: "?", section: "Actions" },
    { id: "palette", label: "Command Palette", description: "Open command palette", icon: <Command className="h-4 w-4" />, action: () => { onClose(); }, shortcut: "⌘K", section: "Actions" },
  ];

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((cmd) => {
      if (!groups[cmd.section]) groups[cmd.section] = [];
      groups[cmd.section].push(cmd);
    });
    return groups;
  }, [filtered]);

  const flatOrder = useMemo(() => filtered.map((c) => c.id), [filtered]);

  const handleSelect = useCallback(
    (id: string) => {
      const cmd = filtered.find((c) => c.id === id);
      if (cmd) cmd.action();
    },
    [filtered]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex].id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[18vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-[dialog-in_0.15s_ease-out]"
        style={{
          background: 'var(--glass-bg-elevated)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Command className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md px-1 -mx-1"
            style={{ color: 'var(--text-primary)' }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No commands found
            </div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section} className="mb-1 last:mb-0">
                <div className="px-4 py-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {section}
                </div>
                {items.map((cmd) => {
                  const idx = flatOrder.indexOf(cmd.id);
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors duration-100 btn-tactile focus-visible:outline-none rounded-lg"
                      style={{
                        background: isSelected ? 'var(--bg-hover)' : undefined,
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {highlightMatch(cmd.label, query)}
                        </div>
                        {cmd.description && (
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd
                          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="flex items-center gap-4 px-4 py-2 text-[10px]"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[9px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>↑↓</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[9px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>↵</kbd>
            <span>select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded text-[9px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>⌘K</kbd>
            <span>open</span>
          </span>
        </div>
      </div>
    </div>
  );
}
