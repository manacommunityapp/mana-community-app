import { useState, useEffect, useRef, useCallback } from "react";
import {
  systemLogService,
  type SystemStatsResponse,
  type SystemLogResponse,
  type LogType,
} from "../../../services/systemLogService";

/* ────────────────────────────── helpers ────────────────────────────── */

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function logLineColor(line: string): string {
  if (line.includes("ERROR")) return "#ef4444";
  if (line.includes("WARN")) return "#f59e0b";
  if (line.includes("DEBUG")) return "#6b7094";
  if (line.includes("INFO")) return "#93c5fd";
  return "#c7d2fe";
}

const LOG_TYPE_META: Record<string, { icon: string; title: string; label: string }> = {
  APPLICATION:  { icon: "⚙️",  title: "Application",   label: "Spring Boot / Backend" },
  ERROR:        { icon: "❌",  title: "Errors",         label: "Errors only (all modules)" },
  SECURITY:     { icon: "🔒",  title: "Security",       label: "Auth / audit trail" },
  AUDIT:        { icon: "📋",  title: "Audit",          label: "Business actions" },
  FRONTEND:     { icon: "🌐",  title: "Frontend",       label: "Browser errors" },
  SCHEDULER:    { icon: "⏱️",  title: "Scheduler",      label: "Cron / scheduled tasks" },
  AUCTION:      { icon: "🏏",  title: "Auction",        label: "Live auction events" },
  CHAT:         { icon: "💬",  title: "Chat",           label: "Messaging / STOMP" },
  NOTIFICATION: { icon: "🔔",  title: "Notifications",  label: "Email / push" },
};

/* ────────────────────────────── styles ─────────────────────────────── */

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a23 0%, #101038 50%, #0d0d2b 100%)",
    padding: "32px 28px 48px",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: "#e0e7ff",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "28px",
  } as React.CSSProperties,

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    boxShadow: "0 0 24px rgba(99,102,241,.35)",
  } as React.CSSProperties,

  h1: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    background: "linear-gradient(90deg, #c7d2fe, #a5b4fc, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,

  subtitle: {
    fontSize: 13,
    color: "#6b7094",
    margin: 0,
    fontWeight: 400,
  } as React.CSSProperties,

  /* ── gauge section ── */
  gaugeRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  } as React.CSSProperties,

  gaugeCard: {
    background: "#16163a",
    borderRadius: 16,
    border: "1px solid rgba(99,102,241,.18)",
    padding: "24px 16px 20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "6px",
    transition: "transform .2s, box-shadow .2s",
    cursor: "default",
  } as React.CSSProperties,

  gaugeRing: (pct: number, color: string) =>
    ({
      width: 110,
      height: 110,
      borderRadius: "50%",
      background: `conic-gradient(${color} ${pct * 3.6}deg, #1e1e4a ${pct * 3.6}deg)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 20px ${color}33`,
      transition: "background .6s ease",
    }) as React.CSSProperties,

  gaugeInner: {
    width: 82,
    height: 82,
    borderRadius: "50%",
    background: "#16163a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
  } as React.CSSProperties,

  gaugePct: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "-0.03em",
  } as React.CSSProperties,

  gaugeUnit: {
    fontSize: 11,
    color: "#6b7094",
    marginTop: 2,
  } as React.CSSProperties,

  gaugeLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    marginTop: 4,
  } as React.CSSProperties,

  gaugeSub: {
    fontSize: 11,
    color: "#6b7094",
    marginTop: 0,
  } as React.CSSProperties,

  /* ── stats bar ── */
  statsRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "14px",
    marginBottom: "22px",
  } as React.CSSProperties,

  statCard: {
    background: "rgba(22,22,58,.85)",
    border: "1px solid rgba(99,102,241,.12)",
    borderRadius: 12,
    padding: "14px 22px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    minWidth: 140,
    flex: 1,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 11,
    color: "#6b7094",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 500,
  } as React.CSSProperties,

  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#e0e7ff",
  } as React.CSSProperties,

  /* ── filter bar ── */
  filterRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    alignItems: "center",
    background: "rgba(22,22,58,.7)",
    border: "1px solid rgba(99,102,241,.12)",
    borderRadius: 14,
    padding: "14px 20px",
    marginBottom: "18px",
  } as React.CSSProperties,

  select: {
    background: "#0d0d2b",
    border: "1px solid rgba(99,102,241,.22)",
    borderRadius: 8,
    padding: "8px 14px",
    color: "#c7d2fe",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
    minWidth: 100,
  } as React.CSSProperties,

  input: {
    background: "#0d0d2b",
    border: "1px solid rgba(99,102,241,.22)",
    borderRadius: 8,
    padding: "8px 14px",
    color: "#c7d2fe",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    flex: 1,
    minWidth: 160,
  } as React.CSSProperties,

  btn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "opacity .2s, transform .15s",
    boxShadow: "0 2px 12px rgba(99,102,241,.25)",
  } as React.CSSProperties,

  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: 13,
    color: "#a5b4fc",
    cursor: "pointer",
    userSelect: "none" as const,
  } as React.CSSProperties,

  /* ── terminal ── */
  terminalWrap: {
    background: "#0d0d1f",
    border: "1px solid rgba(99,102,241,.14)",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 4px 32px rgba(0,0,0,.45)",
  } as React.CSSProperties,

  terminalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 18px",
    background: "rgba(22,22,58,.6)",
    borderBottom: "1px solid rgba(99,102,241,.1)",
  } as React.CSSProperties,

  terminalDot: (color: string) =>
    ({
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: color,
    }) as React.CSSProperties,

  terminalTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7094",
    marginLeft: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  terminalBody: {
    maxHeight: 500,
    overflowY: "auto" as const,
    padding: "16px 20px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  } as React.CSSProperties,

  logLine: (color: string) =>
    ({
      color,
      padding: "1px 0",
      display: "block",
      borderLeft: `2px solid ${color}22`,
      paddingLeft: 10,
      marginBottom: 1,
      transition: "background .15s",
    }) as React.CSSProperties,

  /* ── log type tabs ── */
  tabRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "22px",
    background: "rgba(22,22,58,.55)",
    border: "1px solid rgba(99,102,241,.12)",
    borderRadius: 14,
    padding: "6px",
  } as React.CSSProperties,

  tab: (active: boolean) =>
    ({
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 18px",
      borderRadius: 10,
      border: "none",
      background: active
        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
        : "transparent",
      color: active ? "#fff" : "#6b7094",
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      fontFamily: "inherit",
      cursor: "pointer",
      transition: "all .25s ease",
      boxShadow: active ? "0 4px 20px rgba(99,102,241,.3)" : "none",
      letterSpacing: "0.01em",
    }) as React.CSSProperties,

  tabIcon: {
    fontSize: 16,
    lineHeight: 1,
  } as React.CSSProperties,

  tabLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 400,
    marginTop: 1,
  } as React.CSSProperties,

  /* ── misc ── */
  spinner: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 0",
    gap: "12px",
    color: "#6b7094",
    fontSize: 14,
  } as React.CSSProperties,

  errorBanner: {
    background: "rgba(239,68,68,.12)",
    border: "1px solid rgba(239,68,68,.35)",
    borderRadius: 12,
    padding: "14px 20px",
    color: "#fca5a5",
    fontSize: 13,
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as React.CSSProperties,
};

/* ──────────────────────── CSS keyframes (injected once) ───────────── */

const KEYFRAMES_ID = "__logs-dash-keyframes__";
function ensureKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes _ldSpin { to { transform: rotate(360deg); } }
    @keyframes _ldPulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
  `;
  document.head.appendChild(style);
}

/* ──────────────────────── component ───────────────────────────────── */

export function LogsDashboard() {
  /* state */
  const [stats, setStats] = useState<SystemStatsResponse | null>(null);
  const [logData, setLogData] = useState<SystemLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState("ALL");
  const [search, setSearch] = useState("");
  const [lineCount, setLineCount] = useState(200);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logType, setLogType] = useState<LogType>("APPLICATION");
  const [availableLogTypes, setAvailableLogTypes] = useState<string[]>(["APPLICATION", "FRONTEND"]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* inject keyframes */
  useEffect(() => ensureKeyframes(), []);

  /* fetch available log types once */
  useEffect(() => {
    systemLogService.getLogTypes().then(setAvailableLogTypes).catch(() => {});
  }, []);

  /* fetcher */
  const fetchData = useCallback(async () => {
    try {
      const lvl = level === "ALL" ? undefined : level;
      const srch = search.trim() || undefined;
      const [logsRes, statsRes] = await Promise.all([
        systemLogService.getLogs(lineCount, lvl, srch, logType),
        systemLogService.getSystemStats(),
      ]);
      setLogData(logsRes);
      setStats(statsRes);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [level, search, lineCount, logType]);

  const downloadFullLog = async () => {
    try {
      const lvl = level === "ALL" ? undefined : level;
      const srch = search.trim() || undefined;
      const res = await systemLogService.getLogs(-1, lvl, srch, logType);
      
      const content = res.lines.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${logType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download logs");
    }
  };

  /* initial + filter-change fetch */
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  /* auto-refresh */
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  /* auto-scroll */
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logData]);

  /* ── gauge data ── */
  const gauges: { label: string; pct: number; color: string; detail: string }[] = stats
    ? [
        {
          label: "CPU Load",
          pct: Math.round(stats.cpuLoad),
          color: "#6366f1",
          detail: `${stats.cpuLoad.toFixed(1)}%`,
        },
        {
          label: "RAM Usage",
          pct: Math.round(stats.memoryUsagePercent),
          color: "#10b981",
          detail: `${stats.usedMemoryMb.toLocaleString()} / ${stats.totalMemoryMb.toLocaleString()} MB`,
        },
        {
          label: "Disk Usage",
          pct: Math.round(stats.diskUsagePercent),
          color: "#f59e0b",
          detail: `${stats.usedDiskGb.toFixed(1)} / ${stats.totalDiskGb.toFixed(1)} GB`,
        },
        {
          label: "JVM Heap",
          pct: Math.round(stats.jvmUsagePercent),
          color: "#8b5cf6",
          detail: `${stats.jvmTotalMemoryMb.toFixed(0)} / ${stats.jvmMaxMemoryMb.toFixed(0)} MB`,
        },
      ]
    : [];

  /* ── loading state ── */
  if (loading && !logData) {
    return (
      <div style={S.page}>
        <div style={S.spinner}>
          <span
            style={{
              width: 22,
              height: 22,
              border: "2.5px solid #6366f1",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "_ldSpin .7s linear infinite",
            }}
          />
          Loading system data…
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* ── header ── */}
      <div style={S.header}>
        <div style={S.headerIcon}>🖥</div>
        <div>
          <h1 style={S.h1}>System Logs &amp; Monitoring</h1>
          <p style={S.subtitle}>Real-time server health &amp; application logs</p>
        </div>
        {autoRefresh && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#10b981",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              animation: "_ldPulse 1.5s ease-in-out infinite",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            LIVE
          </span>
        )}
      </div>

      {/* ── log type tabs ── */}
      <div style={{ ...S.tabRow, flexWrap: "wrap" }}>
        {availableLogTypes.map((t) => {
          const meta = LOG_TYPE_META[t] ?? { icon: "📄", title: t.charAt(0) + t.slice(1).toLowerCase(), label: t.toLowerCase() + ".log" };
          const active = logType === t;
          return (
            <button
              key={t}
              style={S.tab(active)}
              onClick={() => { setLogType(t as LogType); setLoading(true); }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,.12)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#6b7094";
                }
              }}
            >
              <span style={S.tabIcon}>{meta.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span>{meta.title}</span>
                <span style={S.tabLabel}>{meta.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── error banner ── */}
      {error && (
        <div style={S.errorBanner}>
          <span style={{ fontSize: 18 }}>⚠</span>
          {error}
        </div>
      )}

      {/* ── gauge widgets ── */}
      {stats && (
        <div style={S.gaugeRow}>
          {gauges.map((g) => (
            <div
              key={g.label}
              style={S.gaugeCard}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px ${g.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}
            >
              <div style={S.gaugeRing(g.pct, g.color)}>
                <div style={S.gaugeInner}>
                  <span style={{ ...S.gaugePct, color: g.color }}>{g.pct}</span>
                  <span style={S.gaugeUnit}>%</span>
                </div>
              </div>
              <span style={{ ...S.gaugeLabel, color: g.color }}>{g.label}</span>
              <span style={S.gaugeSub}>{g.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── stats bar ── */}
      {stats && (
        <div style={S.statsRow}>
          <div style={S.statCard}>
            <span style={S.statLabel}>Uptime</span>
            <span style={S.statValue}>{formatUptime(stats.uptimeSeconds)}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>Active Threads</span>
            <span style={S.statValue}>{stats.activeThreads}</span>
          </div>
          {logData && (
            <>
              <div style={S.statCard}>
                <span style={S.statLabel}>Log File Size</span>
                <span style={S.statValue}>{logData.fileSizeKb.toLocaleString()} KB</span>
              </div>
              <div style={S.statCard}>
                <span style={S.statLabel}>Total Lines</span>
                <span style={S.statValue}>{logData.totalLinesReturned.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── filter bar ── */}
      <div style={S.filterRow}>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={S.select}
          aria-label="Log level filter"
        >
          <option value="ALL">ALL</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        <input
          type="text"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={S.input}
          aria-label="Search logs"
        />

        <select
          value={lineCount}
          onChange={(e) => setLineCount(Number(e.target.value))}
          style={{ ...S.select, minWidth: 120 }}
          aria-label="Line count"
        >
          <option value={100}>100 Lines</option>
          <option value={200}>200 Lines</option>
          <option value={500}>500 Lines</option>
          <option value={-1}>Complete Log</option>
        </select>

        <button
          onClick={() => fetchData()}
          style={S.btn}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          ↻ Refresh
        </button>

        <button
          onClick={downloadFullLog}
          style={{ ...S.btn, background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 12px rgba(16,185,129,.25)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          📥 Download Full Log
        </button>

        <label style={S.checkLabel}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ accentColor: "#6366f1" }}
          />
          Auto-refresh (5 s)
        </label>
      </div>

      {/* ── terminal viewer ── */}
      {logData && (
        <div style={S.terminalWrap}>
          <div style={S.terminalHeader}>
            <span style={S.terminalDot("#ef4444")} />
            <span style={S.terminalDot("#f59e0b")} />
            <span style={S.terminalDot("#10b981")} />
            <span style={S.terminalTitle}>
              {logData.logType && (
                <span style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: logType === "APPLICATION" ? "rgba(99,102,241,.2)"
                    : logType === "FRONTEND" ? "rgba(16,185,129,.2)"
                    : "rgba(245,158,11,.2)",
                  color: logType === "APPLICATION" ? "#a5b4fc"
                    : logType === "FRONTEND" ? "#6ee7b7"
                    : "#fcd34d",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  marginRight: 10,
                  textTransform: "uppercase" as const,
                }}>
                  {logData.logType}
                </span>
              )}
              {logData.logFilePath || "application.log"}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#4b5069",
              }}
            >
              {logData.totalLinesReturned} lines
            </span>
          </div>

          <div ref={terminalRef} style={S.terminalBody}>
            {logData.lines.length === 0 ? (
              <span style={{ color: "#4b5069", fontStyle: "italic" }}>
                No log entries match the current filters.
              </span>
            ) : (
              logData.lines.map((line, i) => (
                <span key={i} style={S.logLine(logLineColor(line))}>
                  {line}
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
