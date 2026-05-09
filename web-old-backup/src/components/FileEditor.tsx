import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
import { api } from "@/lib/api";

const Editor = lazy(() => import("@monaco-editor/react").then(m => ({ default: m.default })));

interface FileEditorProps {
  path: string;
  content: string;
  onSave?: () => void;
  onClose?: () => void;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript",
    js: "javascript", jsx: "javascript",
    py: "python", rs: "rust", go: "go",
    java: "java", kt: "kotlin", scala: "scala",
    rb: "ruby", php: "php", cs: "csharp",
    cpp: "cpp", c: "c", h: "c",
    swift: "swift", objc: "objective-c",
    html: "html", css: "css", scss: "scss", less: "less",
    json: "json", yaml: "yaml", yml: "yaml",
    md: "markdown", xml: "xml", sql: "sql",
    sh: "shell", bash: "shell", zsh: "shell",
    ps1: "powershell", dockerfile: "dockerfile",
    toml: "toml", ini: "ini", cfg: "ini",
    lua: "lua", r: "r", jl: "julia",
    dart: "dart", ex: "elixir", exs: "elixir",
    elm: "elm", hs: "haskell", ml: "ocaml",
    fs: "fsharp", clj: "clojure", cljs: "clojure",
    coffee: "coffeescript", vb: "vb",
    pas: "pascal", pp: "pascal",
    sol: "solidity",
    move: "move",
  };
  return map[ext] || "plaintext";
}

export default function FileEditor({ path, content, onSave, onClose }: FileEditorProps) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setValue(content);
    setSaved(true);
    setError(null);
  }, [content, path]);

  const doSave = useCallback(async (newValue: string) => {
    setSaving(true);
    setAutoSaving(false);
    setError(null);
    try {
      await api.writeFile(path, newValue);
      setSaved(true);
      onSave?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }, [path, onSave]);

  const handleChange = useCallback((newValue: string | undefined) => {
    const val = newValue || "";
    setValue(val);
    const isSaved = val === content;
    setSaved(isSaved);

    if (!isSaved) {
      setAutoSaving(true);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        doSave(val);
      }, 2000);
    }
  }, [content, doSave]);

  const handleSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    doSave(value);
  }, [value, doSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saved) handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, saved]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const language = getLanguageFromPath(path);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 shrink-0"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {path.split("/").pop()}
          </span>
          {!saved && (
            <span className="text-[10px] shrink-0 animate-pulse" style={{ color: 'var(--accent)' }}>●</span>
          )}
          {autoSaving && (
            <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>autosaving...</span>
          )}
          {saved && !autoSaving && (
            <span className="text-[10px] shrink-0" style={{ color: 'var(--success)' }}>saved</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="xs"
            onClick={handleSave}
            disabled={saving || saved}
            className="text-[11px] normal-case h-7 px-2.5"
            style={{
              background: saving || saved ? undefined : 'var(--accent)',
              color: saving || saved ? undefined : '#fff',
            }}
          >
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            ghost
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="text-xs px-4 py-2 shrink-0"
          style={{
            color: 'var(--error)',
            background: 'rgba(239, 68, 68, 0.08)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Loading editor...
          </div>
        }>
          <Editor
            height="100%"
            language={language}
            value={value}
            onChange={handleChange}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
              fontLigatures: true,
              padding: { top: 12 },
            }}
            theme="vs-dark"
            loading={
              <div className="flex items-center justify-center h-full text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Loading editor...
              </div>
            }
          />
        </Suspense>
      </div>
    </div>
  );
}
