import { useState, useCallback, useMemo } from "react";
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Edit3,
  FilePlus, FolderPlus, Search, X,
  FileCode, FileJson, FileText, FileImage,
  Braces, Hash, Terminal, Database, Globe, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/api";

interface FileTreeProps {
  tree: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string, type: "file" | "directory") => void;
  onCreate?: (path: string, isDirectory: boolean) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onRefresh?: () => void;
}

function getFileIcon(name: string, isDir: boolean) {
  if (isDir) return <Folder className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />;

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const iconClass = "h-3.5 w-3.5";

  switch (ext) {
    case "ts": case "tsx": case "js": case "jsx":
      return <FileCode className={iconClass} style={{ color: '#60a5fa' }} />;
    case "py":
      return <Braces className={iconClass} style={{ color: '#fbbf24' }} />;
    case "json":
      return <FileJson className={iconClass} style={{ color: '#fb923c' }} />;
    case "md": case "txt": case "rst":
      return <FileText className={iconClass} style={{ color: 'var(--text-muted)' }} />;
    case "css": case "scss": case "less": case "sass":
      return <Hash className={iconClass} style={{ color: '#f472b6' }} />;
    case "html": case "htm":
      return <Globe className={iconClass} style={{ color: '#fb923c' }} />;
    case "sql":
      return <Database className={iconClass} style={{ color: '#34d399' }} />;
    case "sh": case "bash": case "zsh": case "ps1":
      return <Terminal className={iconClass} style={{ color: '#4ade80' }} />;
    case "yaml": case "yml": case "toml": case "ini": case "cfg":
      return <Settings className={iconClass} style={{ color: 'var(--text-muted)' }} />;
    case "png": case "jpg": case "jpeg": case "gif": case "svg": case "webp":
      return <FileImage className={iconClass} style={{ color: '#a78bfa' }} />;
    case "rs": case "go": case "java": case "kt": case "cpp": case "c": case "h":
      return <FileCode className={iconClass} style={{ color: '#fca5a5' }} />;
    default:
      return <File className={iconClass} style={{ color: 'var(--text-muted)' }} />;
  }
}

function TreeItem({
  node,
  selectedPath,
  onSelect,
  onDelete,
  onRename,
  depth = 0,
}: {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string, type: "file" | "directory") => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const isSelected = selectedPath === node.path;
  const isDir = node.type === "directory";

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDir) setExpanded((v) => !v);
    },
    [isDir]
  );

  const select = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node.path, node.type);
    },
    [node.path, node.type, onSelect]
  );

  const handleRenameSubmit = useCallback(() => {
    if (renameValue && renameValue !== node.name && onRename) {
      const parent = node.path.substring(0, node.path.length - node.name.length);
      onRename(node.path, parent + renameValue);
    }
    setRenaming(false);
  }, [renameValue, node.name, node.path, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") { setRenaming(false); setRenameValue(node.name); }
  }, [handleRenameSubmit, node.name]);

  return (
    <div>
      <div
        className={cn(
          "group flex w-full items-center gap-1.5 px-2 py-[5px] text-[12px] transition-all duration-150 rounded-md cursor-pointer btn-tactile focus-visible:outline-none",
          isSelected
            ? "font-medium"
            : ""
        )}
        style={{
          paddingLeft: `${10 + depth * 14}px`,
          background: isSelected ? 'var(--bg-active)' : undefined,
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
        onClick={select}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e as unknown as React.MouseEvent); } }}
      >
        {isDir ? (
          <span
            className="shrink-0 transition-transform duration-150 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            onClick={toggle}
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="shrink-0 w-3" />
        )}
        <span className="shrink-0">
          {isDir && expanded
            ? <FolderOpen className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            : getFileIcon(node.name, isDir)
          }
        </span>
        {renaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRenameSubmit}
            autoFocus
            className="flex-1 min-w-0 bg-transparent border rounded px-1 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={cn("truncate", isSelected && "text-[var(--text-primary)]")} title={node.path}>
            {node.name}
          </span>
        )}

        {!renaming && (
          <div className="flex items-center gap-0.5 shrink-0 ml-auto">
            {node.type === "file" && node.size != null && (
              <span className="text-[10px] tabular-nums mr-0.5" style={{ color: 'var(--text-muted)' }}>
                {node.size < 1024 ? `${node.size}B` : node.size < 1048576 ? `${(node.size / 1024).toFixed(0)}KB` : `${(node.size / 1048576).toFixed(1)}MB`}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
              className="p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              style={{ color: 'var(--text-muted)' }}
              title="Rename"
              tabIndex={0}
            >
              <Edit3 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(node.path); }}
              className="p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              style={{ color: 'var(--text-muted)' }}
              title="Delete"
              tabIndex={0}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {isDir && expanded && node.children && (
        <div className="tree-children-enter">
          {node.children.map((child: TreeNode) => (
            <TreeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Breadcrumbs({ path, onNavigate }: { path: string; onNavigate?: (path: string) => void }) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return null;

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
      }}
    >
      <button onClick={() => onNavigate?.(".")} className="hover:text-[var(--text-secondary)] transition-colors shrink-0 text-[10px]">
        root
      </button>
      {parts.slice(0, -1).map((part, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0 text-[10px]">
          <span>/</span>
          <button
            onClick={() => onNavigate?.(parts.slice(0, i + 1).join("/"))}
            className="hover:text-[var(--text-secondary)] transition-colors truncate max-w-[80px]"
          >
            {part}
          </button>
        </span>
      ))}
      <span className="shrink-0 text-[10px]">/</span>
      <span className="text-[var(--text-secondary)] truncate max-w-[100px] text-[10px]">{parts[parts.length - 1]}</span>
    </div>
  );
}

export default function FileTree({
  tree,
  selectedPath,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onRefresh,
}: FileTreeProps) {
  const [filter, setFilter] = useState("");
  const [showNewMenu, setShowNewMenu] = useState(false);

  const filteredTree = useMemo(() => {
    if (!filter.trim()) return tree;
    const query = filter.toLowerCase();
    function filterNode(node: TreeNode): TreeNode | null {
      const matches = node.name.toLowerCase().includes(query);
      if (node.type === "file") return matches ? node : null;
      const filteredChildren = node.children?.map(filterNode).filter(Boolean) as TreeNode[] | undefined;
      if (matches || (filteredChildren && filteredChildren.length > 0)) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }
    return filterNode(tree) || tree;
  }, [tree, filter]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files..."
            className="w-full rounded-lg pl-7 pr-6 py-1 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-all"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={0}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNewMenu((v) => !v)}
            className="p-1.5 rounded-lg transition-all hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            style={{ color: 'var(--text-muted)' }}
            title="New"
            tabIndex={0}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {showNewMenu && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl shadow-xl py-1"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              <button
                onClick={() => { setShowNewMenu(false); const name = prompt("File name:"); if (name && onCreate) onCreate(name, false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md mx-1"
                style={{ color: 'var(--text-secondary)' }}
                tabIndex={0}
              >
                <FilePlus className="h-3 w-3" /> New File
              </button>
              <button
                onClick={() => { setShowNewMenu(false); const name = prompt("Folder name:"); if (name && onCreate) onCreate(name, true); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md mx-1"
                style={{ color: 'var(--text-secondary)' }}
                tabIndex={0}
              >
                <FolderPlus className="h-3 w-3" /> New Folder
              </button>
              <div className="my-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <button
                onClick={() => { setShowNewMenu(false); onRefresh?.(); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md mx-1"
                style={{ color: 'var(--text-secondary)' }}
                tabIndex={0}
              >
                <Search className="h-3 w-3" /> Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedPath && (
        <Breadcrumbs path={selectedPath} onNavigate={(path) => onSelect(path, "directory")} />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        <TreeItem
          node={filteredTree}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
        />
      </div>
    </div>
  );
}
