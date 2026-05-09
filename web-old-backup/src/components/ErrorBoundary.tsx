import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  stackOpen: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, stackOpen: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, stackOpen: false, copied: false });
  };

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = [
      error?.message || "An unexpected error occurred",
      "",
      "Stack trace:",
      errorInfo?.componentStack || "",
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, stackOpen, copied } = this.state;

    return (
      <div
        className="flex items-center justify-center p-8 animate-[dialog-in_0.2s_ease-out]"
        style={{ minHeight: "300px" }}
      >
        <div
          className="flex flex-col items-center gap-4 max-w-lg text-center glass-elevated rounded-xl"
          style={{
            border: "1px solid rgba(239, 68, 68, 0.2)",
            padding: "32px",
            boxShadow: "0 0 0 1px rgba(239, 68, 68, 0.1), 0 8px 32px rgba(239, 68, 68, 0.1)",
          }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={{ background: "rgba(239, 68, 68, 0.1)" }}
          >
            <AlertTriangle className="h-6 w-6" style={{ color: "var(--error)" }} />
          </div>

          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Something went wrong
          </h3>

          <p
            className="text-xs font-mono leading-relaxed break-all"
            style={{ color: "var(--error)" }}
          >
            {error?.message || "An unexpected error occurred"}
          </p>

          {errorInfo?.componentStack && (
            <div className="w-full text-left">
              <button
                onClick={() => this.setState((s) => ({ stackOpen: !s.stackOpen }))}
                className="flex items-center gap-1.5 text-[10px] font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transition: "transform 150ms ease",
                    transform: stackOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                {stackOpen ? "Hide" : "Show"} stack trace
              </button>
              {stackOpen && (
                <pre
                  className="mt-2 text-[10px] font-mono leading-relaxed overflow-auto max-h-[200px] p-3 rounded-lg"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              <RotateCcw className="h-3 w-3" /> Reload Page
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--bg-tertiary)",
                color: copied ? "var(--success)" : "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
