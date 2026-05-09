import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff, HardDrive, Zap, Activity } from "lucide-react";
import { api } from "@/lib/api";

interface StatusBarProps {
  fileCount?: number;
}

export default function StatusBar({ fileCount }: StatusBarProps) {
  const [time, setTime] = useState(new Date());
  const [modelName, setModelName] = useState<string | null>(null);
  const [isDashboardRunning, setDashboardRunning] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const measureLatency = useCallback(async () => {
    const start = performance.now();
    try {
      await api.getStatus();
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch {
      setLatency(null);
    }
  }, []);

  const pollStatus = async () => {
    try {
      await api.getStatus();
      const modelRes = await api.getModelInfo();
      if (modelRes) {
        const parts = [];
        if (modelRes.provider) parts.push(modelRes.provider);
        if (modelRes.model) parts.push(modelRes.model);
        setModelName(parts.length > 0 ? parts.join(" · ") : null);
      }
      setDashboardRunning(true);
      measureLatency();

      try {
        const analytics = await api.getAnalytics(7);
        setSessionCount(analytics.totals.total_sessions);
      } catch {
        setSessionCount(null);
      }
    } catch {
      setDashboardRunning(false);
      setLatency(null);
    }
  };

  useEffect(() => {
    pollStatus();
    pollIntervalRef.current = setInterval(pollStatus, 10000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const online = isDashboardRunning;

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-1.5 shrink-0 select-none"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={pollStatus}
          title="Click to refresh status"
        >
          {online ? (
            <>
              <Wifi className="h-3 w-3 status-dot-online" style={{ color: 'var(--color-status-online)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--color-status-online)' }}>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" style={{ color: 'var(--color-status-offline)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--color-status-offline)' }}>Offline</span>
            </>
          )}
        </div>

        <span style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        {latency !== null && (
          <div className="flex items-center gap-1.5" title="API latency">
            <Activity className="h-3 w-3" style={{ color: latency < 200 ? 'var(--success)' : latency < 500 ? 'var(--warning)' : 'var(--error)' }} />
            <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {latency}ms
            </span>
          </div>
        )}

        {modelName && (
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.location.hash = '/models'}
            title="Click to change model"
          >
            <Zap className="h-3 w-3" style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] truncate max-w-[180px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {modelName}
            </span>
          </div>
        )}

        {sessionCount !== null && sessionCount > 0 && (
          <>
            <span style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
            <div className="flex items-center gap-1.5" title="Sessions (7d)">
              <Activity className="h-3 w-3" style={{ color: 'var(--accent)' }} />
              <span className="text-[10px] font-medium">{sessionCount} sessions</span>
            </div>
          </>
        )}

        {fileCount !== undefined && fileCount > 0 && (
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3 w-3" />
            <span className="text-[10px] font-medium">{fileCount} files</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          Hermes Agent
        </span>
        <span className="text-[10px] font-mono">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
