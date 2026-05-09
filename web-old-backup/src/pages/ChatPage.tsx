import { Button } from "@nous-research/ui/ui/components/button";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { cn } from "@/lib/utils";
import {
  Send, Trash2, ChevronDown, ChevronRight, Wrench, FileEdit, Globe, Terminal,
  Copy, Check, Edit3, Plus, Command, Sparkles, Code, Bug, FileSearch, Lightbulb,
  Paperclip,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { SessionMessage, ModelInfoResponse } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import DiffViewer from "@/components/DiffViewer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  timestamp: number;
  isEditing?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
  status: "running" | "done" | "error";
}

const SUGGESTED_PROMPTS = [
  { icon: <Code className="h-3.5 w-3.5" />, text: "Write a Python function to parse JSON", category: "Code" },
  { icon: <Bug className="h-3.5 w-3.5" />, text: "Debug this error: TypeError: cannot read property", category: "Debug" },
  { icon: <FileSearch className="h-3.5 w-3.5" />, text: "Explain the code in src/App.tsx", category: "Analyze" },
  { icon: <Lightbulb className="h-3.5 w-3.5" />, text: "Suggest improvements for my project", category: "Review" },
  { icon: <FileEdit className="h-3.5 w-3.5" />, text: "Create a new TypeScript utility file", category: "Create" },
  { icon: <Wrench className="h-3.5 w-3.5" />, text: "Refactor this function to use async/await", category: "Refactor" },
];

const CAPABILITIES = [
  { icon: <Code className="h-4 w-4" />, title: "Write Code", prompt: "Write a Python function to parse JSON from an API response" },
  { icon: <Bug className="h-4 w-4" />, title: "Debug Errors", prompt: "Debug this error: TypeError: Cannot read properties of undefined (reading 'map')" },
  { icon: <FileSearch className="h-4 w-4" />, title: "Analyze Files", prompt: "Explain the code in src/App.tsx" },
  { icon: <Terminal className="h-4 w-4" />, title: "Run Commands", prompt: "Run a bash command to list all files in the current directory" },
  { icon: <Globe className="h-4 w-4" />, title: "Web Fetch", prompt: "Fetch the latest news from Hacker News and summarize it" },
  { icon: <FileEdit className="h-4 w-4" />, title: "Edit Files", prompt: "Create a new TypeScript utility file with helper functions" },
];

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ToolCallCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(true);
  const iconMap: Record<string, React.ReactNode> = {
    edit: <FileEdit className="h-3 w-3" />,
    read: <FileEdit className="h-3 w-3" />,
    bash: <Terminal className="h-3 w-3" />,
    webfetch: <Globe className="h-3 w-3" />,
    web: <Globe className="h-3 w-3" />,
  };
  const Icon = iconMap[tool.name] || <Wrench className="h-3 w-3" />;
  let args = tool.arguments;
  try { args = JSON.stringify(JSON.parse(args), null, 2); } catch { /* keep as-is */ }
  const statusColor =
    tool.status === "running" ? "text-sky-400 border-sky-400/20 bg-sky-400/5"
    : tool.status === "error" ? "text-red-400 border-red-400/20 bg-red-400/5"
    : "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";
  return (
    <div className={cn("border rounded-lg text-xs", statusColor)}>
      <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2 w-full px-2.5 py-1.5 hover:opacity-80">
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        {Icon}
        <span className="font-medium">{tool.name}</span>
        {tool.status === "running" && <Spinner className="h-2.5 w-2.5" />}
        <span className="ml-auto text-[10px] opacity-60">{tool.status === "running" ? "running..." : tool.status}</span>
      </button>
      {expanded && (
        <div className="border-t border-current/10 px-2.5 py-2 space-y-1.5">
          <div>
            <span className="text-[10px] opacity-50 uppercase tracking-wider">Arguments</span>
            <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all font-mono opacity-80">{args}</pre>
          </div>
          {tool.result && (
            <div>
              <span className="text-[10px] opacity-50 uppercase tracking-wider">Result</span>
              <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all font-mono opacity-80">{tool.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts: { type: "markdown" | "diff"; text: string }[] = [];
  const diffRegex = /```diff\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = diffRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "markdown", text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "diff", text: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "markdown", text: content.slice(lastIndex) });
  }
  if (parts.length === 0) {
    parts.push({ type: "markdown", text: content });
  }

  return (
    <div className="space-y-3">
      {parts.map((part, i) =>
        part.type === "diff" ? (
          <DiffViewer key={i} diff={part.text} />
        ) : (
          <Markdown key={i} content={part.text} />
        )
      )}
    </div>
  );
}

function MessageBubble({
  msg, onCopy, copiedId, onEdit, onResend, modelInfo,
}: {
  msg: ChatMessage;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
  onEdit: (id: string) => void;
  onResend: (content: string) => void;
  modelInfo?: ModelInfoResponse | null;
}) {
  const isUser = msg.role === "user";
  const [hovered, setHovered] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);

  const handleEditSubmit = useCallback(() => {
    onResend(editValue);
  }, [editValue, onResend]);

  return (
    <div
      className={cn("group flex gap-2 px-4 py-1.5", isUser ? "justify-end" : "justify-start")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isUser && (
        <div
          className={cn(
            "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold mt-0.5",
            msg.isStreaming && "avatar-streaming"
          )}
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          H
        </div>
      )}
      <div className={cn("flex flex-col gap-0.5 max-w-[92%] min-w-0", isUser ? "items-end" : "items-start")}>
        <span
          className="text-[8px] px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: 'var(--text-muted)' }}
        >
          {formatTime(msg.timestamp)}
          {!isUser && modelInfo && (
            <span className="ml-1.5 font-mono text-[7px] px-1 py-0.5 rounded" style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}>
              {modelInfo.provider} · {modelInfo.model}
            </span>
          )}
        </span>

        <div
          className={cn(
            "rounded-xl px-3 py-2 text-sm leading-relaxed w-full",
            isUser
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-primary)]"
          )}
          style={{
            background: isUser ? 'var(--accent-muted)' : 'var(--bg-elevated)',
            border: `1px solid ${isUser ? 'rgba(99, 102, 241, 0.15)' : 'var(--border-subtle)'}`,
          }}
        >
          {msg.isEditing ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-transparent border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-1.5">
                <Button size="xs" onClick={handleEditSubmit} className="h-6 text-[10px]">Resend</Button>
                <Button size="xs" ghost onClick={() => onEdit("")} className="h-6 text-[10px]">Cancel</Button>
              </div>
            </div>
          ) : msg.isStreaming && !msg.content ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] font-medium text-shimmer">Hermes is thinking...</span>
            </div>
          ) : (
            <div className={cn(msg.isStreaming && "typing-cursor")}>
              <MessageContent content={msg.content} />
            </div>
          )}
        </div>

        {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="w-full space-y-1">
            {msg.toolCalls.map((tc) => <ToolCallCard key={tc.id} tool={tc} />)}
          </div>
        )}

        <div className={cn(
          "flex items-center gap-0.5 transition-opacity duration-200",
          hovered && !msg.isEditing ? "opacity-100" : "opacity-0"
        )}>
          {!isUser && (
            <>
              <button
                onClick={() => onCopy(msg.id, msg.content)}
                className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md transition-all hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {copiedId === msg.id ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                {copiedId === msg.id ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => onEdit(msg.id)}
                className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md transition-all hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Edit3 className="h-2.5 w-2.5" /> Edit
              </button>
            </>
          )}
          {isUser && (
            <button
              onClick={() => onEdit(msg.id)}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md transition-all hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <Edit3 className="h-2.5 w-2.5" /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SLASH_COMMANDS = [
  { command: "/clear", description: "Clear the conversation" },
  { command: "/model", description: "Switch model" },
  { command: "/sessions", description: "View sessions" },
  { command: "/help", description: "Show available commands" },
];

export default function ChatPage({ isActive = true }: { isActive?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const resumeId = searchParams.get("resume");
    if (resumeId && !sessionId) {
      api.getSessionMessages(resumeId)
        .then((res) => {
          const loaded: ChatMessage[] = res.messages.map((m: SessionMessage, i: number) => ({
            id: `${resumeId}-${i}`,
            role: m.role === "user" || m.role === "assistant" ? m.role : "assistant",
            content: m.content || "",
            timestamp: m.timestamp || Date.now(),
          }));
          setMessages(loaded);
          setSessionId(resumeId);
        })
        .catch(() => {
          setError("Failed to load session");
        });
    } else if (!resumeId) {
      // No URL param, check localStorage for last active session
      const savedSessionId = localStorage.getItem('hermes-session-id');
      if (savedSessionId && !sessionId) {
        api.getSessionMessages(savedSessionId)
          .then((res) => {
            const loaded: ChatMessage[] = res.messages.map((m: SessionMessage, i: number) => ({
              id: `${savedSessionId}-${i}`,
              role: m.role === "user" || m.role === "assistant" ? m.role : "assistant",
              content: m.content || "",
              timestamp: m.timestamp || Date.now(),
            }));
            setMessages(loaded);
            setSessionId(savedSessionId);
          })
          .catch(() => {
            // Session no longer exists, clear localStorage
            localStorage.removeItem('hermes-session-id');
          });
      }
    }
  }, [searchParams, sessionId]);

  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  useEffect(() => {
    api.getModelInfo().then(setModelInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      setAutoScroll(nearBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  }, []);

  const handleEdit = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => ({ ...m, isEditing: m.id === id })));
  }, []);

  const handleResend = useCallback((content: string) => {
    setMessages((prev) => prev.filter((m) => !m.isEditing));
    setInput(content);
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    abortRef.current = false;
    setShowSlashMenu(false);
    setAutoScroll(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID?.() || String(Date.now()),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID?.() || String(Date.now() + 1),
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const result = await api.chat(text, sessionId || undefined);
      if (abortRef.current) return;
      
      // If this is a new session, save the session_id to URL and localStorage
      if (!sessionId && result.session_id) {
        setSessionId(result.session_id);
        setSearchParams({ resume: result.session_id });
        localStorage.setItem('hermes-session-id', result.session_id);
      }
      
      const chars = result.response.split("");
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        currentIndex += 3;
        if (currentIndex >= chars.length) {
          clearInterval(streamInterval);
          setMessages((prev) =>
            prev.map((m) => m.id === assistantMsg.id ? { ...m, content: result.response, isStreaming: false } : m)
          );
          setLoading(false);
        } else {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantMsg.id ? { ...m, content: chars.slice(0, currentIndex).join("") } : m)
          );
        }
      }, 8);
    } catch (e) {
      if (abortRef.current) return;
      setError(String(e));
      setMessages((prev) =>
        prev.map((m) => m.id === assistantMsg.id ? { ...m, content: `Error: ${e}`, isStreaming: false } : m)
      );
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      newChat();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSlashMenu(val.startsWith("/") && !val.includes(" "));
  };

  const executeSlashCommand = (cmd: string) => {
    setShowSlashMenu(false);
    setInput("");
    switch (cmd) {
      case "/clear":
        setMessages([]);
        setSessionId(null);
        break;
      case "/model":
        navigate("/models");
        break;
      case "/sessions":
        navigate("/sessions");
        break;
      case "/help":
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID?.() || String(Date.now()),
          role: "assistant",
          content: "**Available commands:**\n\n" + SLASH_COMMANDS.map(c => `- \`${c.command}\` — ${c.description}`).join("\n"),
          timestamp: Date.now(),
        }]);
        break;
      default:
        break;
    }
  };

  const newChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setSessionId(null);
    setSearchParams({});
    localStorage.removeItem('hermes-session-id');
    inputRef.current?.focus();
  }, [setSearchParams]);

  return (
    <div className="flex flex-1 flex-col min-h-0" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <h2 className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {sessionId ? `Session ${sessionId.slice(0, 8)}...` : "New Chat"}
          </h2>
          {loading && (
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: "200ms" }} />
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: "400ms" }} />
            </div>
          )}
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Plus className="h-3 w-3" /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
        {messages.length === 0 && !loading ? (
            <div className="flex flex-col">
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <div className="text-center space-y-1 shrink-0">
                <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  How can I help you today?
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ask me to write code, analyze files, debug errors, or explain concepts.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-2xl shrink-0">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt.text);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-2 text-left px-3 py-2 rounded-lg border transition-all text-xs font-medium hover:shadow-sm btn-tactile glass-panel"
                    style={{
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: 'var(--accent)' }}>{prompt.icon}</span>
                    <span className="truncate flex-1">{prompt.text}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded shrink-0" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {prompt.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="text-center mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Capabilities
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-w-2xl mx-auto">
                  {CAPABILITIES.map((cap, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(cap.prompt);
                        inputRef.current?.focus();
                      }}
                      className="flex flex-col items-center text-center gap-1 p-2 rounded-lg border transition-all hover:shadow-sm btn-tactile"
                      style={{
                        background: 'var(--glass-bg)',
                        borderColor: 'var(--glass-border)',
                      }}
                    >
                      <div className="p-1 rounded-md" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                        {cap.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cap.title}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 mt-4 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-0.5">
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>⌘K</kbd>
                    Commands
                  </span>
                  <span className="flex items-center gap-0.5">
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>?</kbd>
                    Shortcuts
                  </span>
                  <span className="flex items-center gap-0.5">
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>⌘L</kbd>
                    New Chat
                  </span>
                </div>
              </div>
            </div>
          ) : (
          <>
            <div className="flex flex-col gap-0.5 py-1">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                  onEdit={handleEdit}
                  onResend={handleResend}
                  modelInfo={modelInfo}
                />
              ))}
              {error && (
                <div className="flex justify-center px-3 py-1">
                  <div
                    className="text-[11px] rounded-lg px-2 py-1.5 flex items-center gap-1.5"
                    style={{
                      color: 'var(--error)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--error)' }} />
                    {error}
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom */}
      {!autoScroll && messages.length > 0 && (
        <button
      onClick={() => {
        setAutoScroll(true);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
        }
      }}
          className="absolute bottom-20 right-4 z-10 p-1.5 rounded-full shadow-lg transition-all hover:scale-105"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Input */}
      <div
        className="shrink-0 px-3 py-1.5 relative"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {showSlashMenu && (
          <div
            className="absolute bottom-full left-3 right-3 mb-1.5 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            {SLASH_COMMANDS.filter(c => c.command.startsWith(input)).map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => executeSlashCommand(cmd.command)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-left transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Command className="h-3 w-3" />
                <span className="font-mono text-[var(--accent)]">{cmd.command}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{cmd.description}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-0">
            <div className="flex-1 relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md transition-all hover:bg-[var(--bg-hover)] z-10"
                style={{ color: 'var(--text-tertiary)' }}
                title="Attach files"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Hermes anything..."
                rows={1}
                disabled={loading}
                className="w-full min-h-[36px] max-h-[100px] resize-none rounded-xl pl-8 pr-9 py-2 text-sm outline-none disabled:opacity-50 transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                className="absolute right-1.5 bottom-1.5 h-7 w-7 text-white disabled:opacity-30 shadow-md transition-all hover:scale-105"
                style={{ background: 'var(--accent)' }}
              >
                <Send className="h-3 w-3" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setInput((prev) => `${prev} [Attached: ${Array.from(files).map(f => f.name).join(', ')}]`);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {loading ? "Hermes is working..." : "Shift+Enter for new line · ⌘K for commands"}
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); }}
                className="flex items-center gap-1 text-[9px] font-medium transition-colors hover:text-[var(--error)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="h-2.5 w-2.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
