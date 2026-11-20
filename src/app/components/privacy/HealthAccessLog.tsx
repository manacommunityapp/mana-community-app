import { useState, useEffect } from 'react';
import { Activity, ChevronLeft, ChevronRight, Loader2, Eye, Download, Share2, Heart } from 'lucide-react';
import { privacyService, type HealthAccessEntry } from '../../../services/privacy/privacyService';

const ACCESS_ICONS: Record<string, React.ReactNode> = {
  VIEW: <Eye className="w-3.5 h-3.5" />,
  EXPORT: <Download className="w-3.5 h-3.5" />,
  SHARE: <Share2 className="w-3.5 h-3.5" />,
  CAREGIVER: <Heart className="w-3.5 h-3.5" />,
};

const ACCESS_COLORS: Record<string, string> = {
  VIEW: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  EXPORT: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  SHARE: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  CAREGIVER: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
};

export function HealthAccessLog() {
  const [entries, setEntries] = useState<HealthAccessEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchPage = async (p: number) => {
    setLoading(true);
    try {
      const result = await privacyService.getHealthAccessLog(p, pageSize);
      setEntries(result.items);
      setTotal(result.totalElements);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(page); }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" />
          Health Data Access Log
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          A complete audit trail of who accessed your health records and when.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No health data access events recorded.
        </div>
      ) : (
        <>
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3.5 bg-card hover:bg-accent/20 transition-colors">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 ${ACCESS_COLORS[e.accessType] ?? 'bg-muted text-muted-foreground'}`}>
                  {ACCESS_ICONS[e.accessType]}
                  <span>{e.accessType}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{e.accessedBy}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.dataCategory}
                    {e.justification && ` · ${e.justification}`}
                  </p>
                </div>
                <time className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                  {new Date(e.accessedAt).toLocaleString()}
                </time>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground disabled:opacity-40 cursor-pointer bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground disabled:opacity-40 cursor-pointer bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
