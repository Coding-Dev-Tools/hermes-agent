import { useState } from "react";
import { Check, X, FileCode } from "lucide-react";

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: { type: "context" | "add" | "remove"; text: string }[];
}

interface DiffFile {
  path: string;
  hunks: DiffHunk[];
}

function parseDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffText.split("\n");
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk);
        currentHunk = null;
      }
      if (line.startsWith("+++ ") && line !== "+++ /dev/null") {
        const path = line.slice(4).trim().replace(/^b\//, "");
        currentFile = { path, hunks: [] };
        files.push(currentFile);
      }
      continue;
    }
    if (line.startsWith("@@")) {
      if (currentHunk && currentFile) currentFile.hunks.push(currentHunk);
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match) {
        currentHunk = {
          oldStart: parseInt(match[1]),
          oldLines: parseInt(match[2] || "1"),
          newStart: parseInt(match[3]),
          newLines: parseInt(match[4] || "1"),
          lines: [],
        };
      }
      continue;
    }
    if (currentHunk) {
      if (line.startsWith("+")) {
        currentHunk.lines.push({ type: "add", text: line.slice(1) });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({ type: "remove", text: line.slice(1) });
      } else if (line.startsWith(" ")) {
        currentHunk.lines.push({ type: "context", text: line.slice(1) });
      } else if (line === "\\ No newline at end of file") {
        // skip
      } else {
        currentHunk.lines.push({ type: "context", text: line });
      }
    }
  }
  if (currentHunk && currentFile) currentFile.hunks.push(currentHunk);
  return files;
}

function DiffLine({ line }: { line: { type: "context" | "add" | "remove"; text: string } }) {
  const colorMap = {
    add: { bg: 'rgba(34, 197, 94, 0.08)', text: '#4ade80', prefix: '+' },
    remove: { bg: 'rgba(239, 68, 68, 0.08)', text: '#f87171', prefix: '-' },
    context: { bg: 'transparent', text: 'var(--text-muted)', prefix: ' ' },
  };
  const style = colorMap[line.type];

  return (
    <div
      className="flex text-[10px] font-mono leading-5"
      style={{ background: style.bg, color: style.text }}
    >
      <span className="shrink-0 w-5 text-center opacity-40 select-none">{style.prefix}</span>
      <span className="truncate">{line.text || " "}</span>
    </div>
  );
}

export default function DiffViewer({ diff, onAccept, onReject }: { diff: string; onAccept?: () => void; onReject?: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const files = parseDiff(diff);

  if (files.length === 0) {
    return (
      <pre
        className="text-[10px] font-mono whitespace-pre-wrap break-all rounded-xl p-3"
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {diff}
      </pre>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {files.length} file{files.length > 1 ? "s" : ""} changed
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAccept && (
            <button
              onClick={onAccept}
              className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all hover:scale-105"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
              }}
            >
              <Check className="h-3 w-3" /> Apply
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all hover:scale-105"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
              }}
            >
              <X className="h-3 w-3" /> Reject
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {expanded && files.map((file, fi) => (
        <div key={fi} style={{ borderTop: fi > 0 ? '1px solid var(--border-subtle)' : undefined }}>
          <div
            className="px-4 py-1.5 text-[10px] font-semibold font-mono"
            style={{
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
            }}
          >
            {file.path}
          </div>
          <div className="overflow-x-auto">
            {file.hunks.map((hunk, hi) => (
              <div key={hi} className="py-1">
                <div
                  className="px-4 py-0.5 text-[9px] font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                </div>
                {hunk.lines.map((line, li) => (
                  <DiffLine key={li} line={line} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
