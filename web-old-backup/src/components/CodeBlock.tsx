import { useCallback, useState } from "react";
import hljs from "highlight.js";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  lang?: string;
  caret?: React.ReactNode;
}

export default function CodeBlock({ code, lang, caret }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  let highlighted: string;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(code, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
  } catch {
    highlighted = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return (
    <div className="code-block group relative my-2">
      <div className="code-block-header">
        <span className="code-block-lang">{lang || "code"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="code-block-pre">
        <code
          className={`hljs${lang ? ` language-${lang}` : ""}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        {caret}
      </pre>
    </div>
  );
}
