import {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
  type ComponentType,
} from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  MessageSquare,
  FolderTree,
  Settings,
  Terminal,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Cpu,
  FileText,
  Package,
  Puzzle,
  KeyRound,
  BookOpen,
  Clock,
  Users,
  Command,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeaderProvider } from "@/contexts/PageHeaderProvider";
import { PageSkeleton } from "@/components/Skeleton";
import ConfigPage from "@/pages/ConfigPage";
import EnvPage from "@/pages/EnvPage";
import SessionsPage from "@/pages/SessionsPage";
import LogsPage from "@/pages/LogsPage";
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ModelsPage = lazy(() => import("@/pages/ModelsPage"));
const SkillsPage = lazy(() => import("@/pages/SkillsPage"));
const PluginsPage = lazy(() => import("@/pages/PluginsPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const DocsPage = lazy(() => import("@/pages/DocsPage"));
const CronPage = lazy(() => import("@/pages/CronPage"));
const ProfilesPage = lazy(() => import("@/pages/ProfilesPage"));
import FileTree from "@/components/FileTree";
import FileEditor from "@/components/FileEditor";
import CommandPalette from "@/components/CommandPalette";
import StatusBar from "@/components/StatusBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { api } from "@/lib/api";
import type { TreeNode } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useResizable } from "@/hooks/useResizable";

function RootRedirect() {
  return <Navigate to="/chat" replace />;
}

const BUILTIN_ROUTES: Record<string, ComponentType> = {
  "/": RootRedirect,
  "/chat": ChatPage,
  "/sessions": SessionsPage,
  "/analytics": AnalyticsPage,
  "/models": ModelsPage,
  "/logs": LogsPage,
  "/skills": SkillsPage,
  "/plugins": PluginsPage,
  "/config": ConfigPage,
  "/env": EnvPage,
  "/docs": DocsPage,
  "/cron": CronPage,
  "/profiles": ProfilesPage,
};

const NAV_GROUPS = {
  Core: [
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/sessions", label: "Sessions", icon: Terminal },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  Data: [
    { path: "/models", label: "Models", icon: Cpu },
    { path: "/logs", label: "Logs", icon: FileText },
    { path: "/skills", label: "Skills", icon: Package },
    { path: "/plugins", label: "Plugins", icon: Puzzle },
  ],
  Settings: [
    { path: "/config", label: "Config", icon: Settings },
    { path: "/env", label: "Keys", icon: KeyRound },
    { path: "/cron", label: "Cron", icon: Clock },
    { path: "/profiles", label: "Profiles", icon: Users },
    { path: "/docs", label: "Docs", icon: BookOpen },
  ],
};

function Resizer({ onMouseDown, className }: { onMouseDown: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "relative shrink-0 z-10 flex items-center justify-center cursor-col-resize group",
        className
      )}
      style={{ width: 4 }}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-[var(--accent)] transition-colors duration-200" />
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isChatRoute = pathname === "/chat" || pathname === "/chat/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [fileTree, setFileTree] = useState<TreeNode | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [showExplorer, setShowExplorer] = useState(true);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const sidebarWidth = sidebarCollapsed ? 56 : 208;
  const {
    width: explorerWidth,
    isResizing: explorerResizing,
    startResizing: startExplorerResize,
  } = useResizable(280, 200, 500, "hermes-explorer-width");
  const {
    width: editorWidth,
    isResizing: editorResizing,
    startResizing: startEditorResize,
  } = useResizable(480, 350, 900, "hermes-editor-width");

  useEffect(() => {
    api.fileTree(".").then(setFileTree).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setFileContent("");
      return;
    }
    setFileLoading(true);
    api.readFile(selectedFile)
      .then((res) => setFileContent(res.content))
      .catch(() => setFileContent(""))
      .finally(() => setFileLoading(false));
  }, [selectedFile]);

  const handleFileSelect = useCallback((path: string, type: "file" | "directory") => {
    if (type === "file") {
      setSelectedFile(path);
      setActiveFile(path);
      setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]));
    }
  }, []);

  const handleFileSave = useCallback(() => {
    if (selectedFile) {
      api.readFile(selectedFile)
        .then((res) => setFileContent(res.content))
        .catch(() => {});
    }
  }, [selectedFile]);

  const handleCloseFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((p) => p !== path);
      if (activeFile === path) {
        setActiveFile(next.length > 0 ? next[next.length - 1] : null);
        setSelectedFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeFile]);

  const handleFileCreate = useCallback(async (name: string, isDirectory: boolean) => {
    const dir = selectedFile
      ? selectedFile.replace(/\\/g, "/").split("/").slice(0, -1).join("/")
      : ".";
    const path = dir + "/" + name;
    try {
      await api.createFile(path, isDirectory);
      showToast(`${isDirectory ? "Folder" : "File"} created`, "success");
      const tree = await api.fileTree(".");
      setFileTree(tree);
    } catch (e) {
      showToast(String(e), "error");
    }
  }, [selectedFile, showToast]);

  const handleFileDelete = useCallback(async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    try {
      await api.deleteFile(path);
      showToast("File deleted", "success");
      if (selectedFile === path) {
        setSelectedFile(null);
        handleCloseFile(path);
      }
      const tree = await api.fileTree(".");
      setFileTree(tree);
    } catch (e) {
      showToast(String(e), "error");
    }
  }, [selectedFile, showToast, handleCloseFile]);

  const handleFileRename = useCallback(async (oldPath: string, newPath: string) => {
    try {
      await api.renameFile(oldPath, newPath);
      showToast("File renamed", "success");
      if (selectedFile === oldPath) {
        setSelectedFile(newPath);
        setActiveFile(newPath);
      }
      setOpenFiles((prev) =>
        prev.map((p) => (p === oldPath ? newPath : p))
      );
      const tree = await api.fileTree(".");
      setFileTree(tree);
    } catch (e) {
      showToast(String(e), "error");
    }
  }, [selectedFile, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fileCount = fileTree
    ? (function countFiles(node: TreeNode): number {
        if (node.type === "file") return 1;
        return (node.children || []).reduce((sum, child) => sum + countFiles(child), 0);
      })(fileTree)
    : 0;

  return (
    <div
      className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden antialiased relative"
      style={{
        fontFamily: 'var(--theme-font-sans)',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="ambient-gradient" />
      <div className="ambient-orb" />
      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          onOpenShortcuts={() => setShowShortcuts(true)}
        />
      )}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-12 flex items-center gap-3 px-4"
        style={{
          background: 'rgba(10, 10, 15, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="font-semibold text-sm tracking-tight">Hermes</span>
        <button
          onClick={() => setShowPalette(true)}
          className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Command className="h-4 w-4" />
        </button>
      </header>

      {mobileOpen && (
        <button
          onClick={closeMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-12 lg:pt-0">
        <div className="flex min-h-0 min-w-0 flex-1">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed top-0 left-0 z-50 flex h-dvh max-h-dvh flex-col transition-all duration-200 ease-out overscroll-contain",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
              "lg:sticky lg:top-0 lg:translate-x-0 lg:shrink-0"
            )}
            style={{
              width: sidebarWidth,
              background: 'rgba(17, 17, 24, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRight: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex h-12 shrink-0 items-center justify-between gap-2 px-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              {!sidebarCollapsed && (
                <span className="font-semibold text-sm tracking-tight pl-1">Hermes</span>
              )}
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="hidden lg:flex p-1 rounded-lg hover:bg-[var(--bg-hover)] ml-auto"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={closeMobile}
                className="lg:hidden p-1 rounded-lg hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
              {Object.entries(NAV_GROUPS).map(([group, items]) => (
                <div key={group} className="mb-3 last:mb-0">
                  {!sidebarCollapsed && (
                    <div className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {group}
                    </div>
                  )}
                  <ul className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            end={item.path === "/sessions"}
                            onClick={closeMobile}
                            data-tooltip={sidebarCollapsed ? item.label : undefined}
                            className={({ isActive }) =>
                              cn(
                                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 btn-tactile",
                                "hover:bg-[var(--bg-hover)] focus-visible:outline-none relative",
                                sidebarCollapsed && "nav-tooltip justify-center",
                                isActive
                                  ? "bg-[var(--bg-active)] text-[var(--text-primary)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-[var(--accent)] before:rounded-r-full"
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              )
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {!sidebarCollapsed && (
              <div
                className="shrink-0 px-2 py-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Shortcuts</span>
                  <kbd
                    className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    ?
                  </kbd>
                </button>
              </div>
            )}
          </aside>

          <PageHeaderProvider pluginTabs={[]}>
            <div className="relative z-2 flex min-w-0 min-h-0 flex-1 flex-col">
              <ToastContainer toasts={toasts} onDismiss={dismissToast} />

              <ErrorBoundary>

              {isChatRoute && (
                <div
                  className="flex items-center gap-2 px-4 py-2 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <button
                    onClick={() => setShowExplorer((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-all",
                      showExplorer
                        ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    <span>Files</span>
                  </button>
                  {openFiles.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto overflow-x-auto scrollbar-none">
                      {openFiles.map((file) => (
                        <button
                          key={file}
                          onClick={() => {
                            setSelectedFile(file);
                            setActiveFile(file);
                          }}
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg max-w-[160px] transition-all",
                            activeFile === file
                              ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                              : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                          )}
                        >
                          <span className="truncate">{file.split("/").pop()}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseFile(file);
                            }}
                            className="hover:text-[var(--text-primary)] shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)]"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={cn("flex min-h-0 min-w-0 flex-1", (explorerResizing || editorResizing) && "select-none")}>
                {isChatRoute && showExplorer && (
                  <>
                    <div
                      className="hidden lg:flex flex-col shrink-0"
                      style={{
                        width: explorerWidth,
                        background: 'rgba(17, 17, 24, 0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRight: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between px-3 py-2.5 shrink-0"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Explorer
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setShowPalette(true)}
                            className="p-1 rounded-md hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Command palette"
                          >
                            <Command className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setShowExplorer(false)}
                            className="p-1 rounded-md hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-auto py-1">
                        {fileTree ? (
                          <FileTree
                            tree={fileTree}
                            selectedPath={selectedFile}
                            onSelect={handleFileSelect}
                            onCreate={handleFileCreate}
                            onDelete={handleFileDelete}
                            onRename={handleFileRename}
                            onRefresh={() => api.fileTree(".").then(setFileTree)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: 'var(--text-muted)' }}>
                            <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
                            <span className="text-[11px] font-medium">Loading files...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Resizer onMouseDown={startExplorerResize} />
                  </>
                )}

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <Suspense fallback={<PageSkeleton />}>
                    <div key={pathname} className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                      <Routes>
                        {Object.entries(BUILTIN_ROUTES).map(([path, Component]) => (
                          <Route key={path} path={path} element={<Component />} />
                        ))}
                        <Route path="*" element={<Navigate to="/chat" replace />} />
                      </Routes>
                    </div>
                  </Suspense>
                </div>

                {isChatRoute && activeFile && (
                  <>
                    <Resizer onMouseDown={startEditorResize} />
                    <div
                      className="hidden lg:flex flex-col shrink-0"
                      style={{
                        width: editorWidth,
                        background: 'var(--bg-primary)',
                        borderLeft: '1px solid var(--border-subtle)',
                      }}
                    >
                      {fileLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
                          <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" />
                          <span className="text-[11px] font-medium">Loading file...</span>
                        </div>
                      ) : (
                        <FileEditor
                          path={activeFile}
                          content={fileContent}
                          onSave={handleFileSave}
                          onClose={() => handleCloseFile(activeFile)}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              </ErrorBoundary>

              <StatusBar fileCount={fileCount} />
            </div>
          </PageHeaderProvider>
        </div>
      </div>
    </div>
  );
}
