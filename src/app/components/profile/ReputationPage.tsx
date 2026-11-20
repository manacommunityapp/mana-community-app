import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Award, Copy, CheckCircle2, Clock, Shield, TrendingUp, Users, ChevronLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { portabilityService, type ReputationScore, type PortabilityToken } from "../../../services/portabilityService";

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 71 ? "#22c55e" : score >= 41 ? "#f59e0b" : "#ef4444";
  const label = score >= 71 ? "Excellent" : score >= 41 ? "Good" : "Fair";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="70" y="64" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill={color}>{score}</text>
        <text x="70" y="86" textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#6b7280">{label}</text>
      </svg>
    </div>
  );
}

const BADGE_ICONS: Record<string, string> = {
  FOUNDING_RESIDENT: "🏛️",
  CONSISTENT_PAYER: "💳",
  EVENT_ORGANISER: "🎪",
  COMMUNITY_HELPER: "🤝",
  SPORTS_CHAMPION: "🏆",
  ACADEMY_INSTRUCTOR: "🎓",
  LONG_TENURE: "⭐",
};

export default function ReputationPage() {
  const navigate = useNavigate();
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [token, setToken] = useState<PortabilityToken | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([
        portabilityService.getMyScore(),
        portabilityService.getMyToken(),
      ]);
      setScore(s);
      setToken(t);
    } catch {
      setError("Could not load reputation data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setShowConfirm(false);
    try {
      const t = await portabilityService.generateToken();
      setToken(t);
      toast.success("Portability token generated — valid for 30 days");
    } catch {
      toast.error("Failed to generate token");
    } finally {
      setGenerating(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token.tokenHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Token copied to clipboard");
    });
  }

  function daysLeft(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={loadAll} className="btn-secondary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Reputation & Portability</h1>
          <p className="text-sm text-muted-foreground">Your community trust score and verified profile</p>
        </div>
      </div>

      {/* Score card */}
      {score && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreGauge score={score.score} />
            <div className="flex-1 space-y-4 w-full">
              <h2 className="font-semibold text-lg text-center sm:text-left">Community Score</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-xs text-muted-foreground">Payments</div>
                  <div className="font-bold text-sm">{score.paymentScore ?? "—"}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-xs text-muted-foreground">Participation</div>
                  <div className="font-bold text-sm">{score.participation ?? "—"}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <div className="text-xs text-muted-foreground">Tenure</div>
                  <div className="font-bold text-sm">{score.tenureMonths}mo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {score.badges.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                {score.badges.map((b) => (
                  <div key={b.type} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                    <span>{BADGE_ICONS[b.type] ?? "🏅"}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portability section */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Portable Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate a one-time token to carry your verified identity and reputation when you move to a new Mana community.
        </p>

        {token === null && (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Generate portability token
          </button>
        )}

        {token && !token.claimedAt && daysLeft(token.expiresAt) > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Active token — {daysLeft(token.expiresAt)} days remaining
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 truncate">
                {token.tokenHash}
              </code>
              <button
                onClick={copyToken}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                title="Copy token"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Share this token with the new community's FM to verify your profile.</p>
          </div>
        )}

        {token && token.claimedAt && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Profile successfully imported on {new Date(token.claimedAt).toLocaleDateString("en-IN")}
          </div>
        )}

        {token && !token.claimedAt && daysLeft(token.expiresAt) === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-red-500">Your previous token has expired.</p>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Generate new token
            </button>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg">Generate portability token?</h3>
            <p className="text-sm text-muted-foreground">
              This creates a 30-day pass to bring your verified profile to a new community. Any existing unused token will be replaced.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={generating} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
