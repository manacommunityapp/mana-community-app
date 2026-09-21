import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  ChevronDown,
  Medal,
  Search,
  Download,
  Upload,
  ArrowUpDown,
  Sparkles,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { sportsRankingService } from "../../../../services/sports/sportsRankingService";
import { sportsMetaService } from "../../../../services/sports/sportsMetaService";
import { userService } from "../../../../services/common/userService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";
import type { SportsPlayerRanking, SportMeta, UserResponse } from "../../../../types/api";

interface Props {
  communityId?: number | null;
  sportsMeta?: SportMeta[];
}

interface RankingFormState {
  userId: string;
  userSearch: string;
  rank: string;
  rating: string;
  season: string;
  notes: string;
}

const EMPTY_FORM: RankingFormState = {
  userId: "",
  userSearch: "",
  rank: "",
  rating: "",
  season: "CURRENT",
  notes: "",
};

interface UserOption {
  id: number;
  fullName: string;
  email: string;
  flatNo?: string;
}

interface CsvParsedRow {
  userId?: number;
  userSearch?: string;
  matchedUser?: UserOption;
  rank?: number | null;
  rating?: number | null;
  notes?: string;
  error?: string;
}

function getRatingTier(rating?: number | null): { name: string; color: string } {
  if (rating == null || rating <= 0) {
    return { name: "Unrated", color: "bg-slate-100 text-slate-500 border-slate-200" };
  }
  if (rating >= 1800) {
    return { name: "Elite", color: "bg-purple-100 text-purple-700 border-purple-200" };
  }
  if (rating >= 1500) {
    return { name: "Diamond", color: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  if (rating >= 1200) {
    return { name: "Gold", color: "bg-amber-100 text-amber-800 border-amber-300" };
  }
  return { name: "Silver", color: "bg-slate-200 text-slate-700 border-slate-300" };
}

export function RankingsAdminTab({ communityId, sportsMeta }: Props) {
  const effectiveCommunityId = communityId ?? null;

  const [sports, setSports] = useState<SportMeta[]>(sportsMeta || []);
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState("CURRENT");
  const [rankings, setRankings] = useState<SportsPlayerRanking[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync / fetch sports meta
  useEffect(() => {
    if (sportsMeta && sportsMeta.length > 0) {
      setSports(sportsMeta);
    } else {
      sportsMetaService
        .getSportsMeta()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setSports(res);
          }
        })
        .catch(() => {});
    }
  }, [sportsMeta]);

  // Auto-select first sport when sports are available and none is selected
  useEffect(() => {
    if (selectedSportId == null && sports.length > 0) {
      setSelectedSportId(sports[0].id);
    }
  }, [sports, selectedSportId]);

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "COMPUTED" | "MANUAL">("ALL");
  const [sortBy, setSortBy] = useState<"RANK_ASC" | "RANK_DESC" | "RATING_DESC" | "RATING_ASC" | "NAME_ASC">("RANK_ASC");

  // Add / Edit Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RankingFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Deleting & Re-ranking states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resequencing, setResequencing] = useState(false);

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Community Users for autocomplete & CSV mapping
  const [communityUsers, setCommunityUsers] = useState<UserOption[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!effectiveCommunityId) return;
    userService
      .getCommunityUsers(effectiveCommunityId)
      .then((users: UserResponse[]) => {
        setCommunityUsers(
          users.map((u) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            flatNo: u.flatNo,
          }))
        );
      })
      .catch(() => {});
  }, [effectiveCommunityId]);

  const filteredUsers = useMemo(() => {
    const q = form.userSearch.toLowerCase().trim();
    if (!q) return communityUsers.slice(0, 10);
    return communityUsers
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.flatNo || "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [communityUsers, form.userSearch]);

  function selectUser(u: UserOption) {
    setForm((f) => ({ ...f, userId: String(u.id), userSearch: u.fullName }));
    setShowUserDropdown(false);
  }

  const seasons = ["CURRENT", "2025-26", "2024-25", "2023-24"];

  const load = useCallback(async () => {
    if (!selectedSportId || !effectiveCommunityId) return;
    setLoading(true);
    try {
      const data = await sportsRankingService.getBySportAndCommunity(
        selectedSportId,
        effectiveCommunityId,
        selectedSeason
      );
      setRankings(Array.isArray(data) ? data : []);
    } catch {
      showError("Failed to load rankings");
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSportId, effectiveCommunityId, selectedSeason]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, season: selectedSeason });
    setShowForm(true);
  }

  function openEdit(r: SportsPlayerRanking) {
    setEditingId(r.id);
    setForm({
      userId: String(r.player.id),
      userSearch: r.player.fullName,
      rank: r.rank != null ? String(r.rank) : "",
      rating: r.rating != null ? String(r.rating) : "",
      season: r.season,
      notes: r.notes ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.userId || !selectedSportId || !effectiveCommunityId) {
      showError("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await sportsRankingService.upsert({
        userId: Number(form.userId),
        sportId: selectedSportId,
        communityId: effectiveCommunityId,
        rank: form.rank ? Number(form.rank) : null,
        rating: form.rating ? Number(form.rating) : null,
        season: form.season || "CURRENT",
        notes: form.notes || null,
      });
      showSuccess(editingId ? "Ranking updated" : "Ranking saved");
      closeForm();
      load();
    } catch {
      showError("Failed to save ranking");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await sportsRankingService.delete(id);
      showSuccess("Ranking removed");
      setRankings((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showError("Failed to delete ranking");
    } finally {
      setDeletingId(null);
    }
  }

  // Auto Re-Sequence Ranks 1..N based on Rating score (High to Low)
  async function handleAutoResequence() {
    if (!selectedSportId || !effectiveCommunityId || rankings.length === 0) return;
    if (!window.confirm("Auto-resequence ranks 1 through " + rankings.length + " sorted strictly by player ratings descending?")) {
      return;
    }
    setResequencing(true);
    try {
      const sorted = [...rankings].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        await sportsRankingService.upsert({
          userId: item.player.id,
          sportId: selectedSportId,
          communityId: effectiveCommunityId,
          rank: i + 1,
          rating: item.rating ?? null,
          season: selectedSeason,
          notes: item.notes ?? null,
        });
      }
      showSuccess("Ranks successfully updated!");
      load();
    } catch {
      showError("Failed to auto-resequence rankings");
    } finally {
      setResequencing(false);
    }
  }

  // CSV Export
  function handleExportCsv() {
    setShowExportMenu(false);
    if (rankings.length === 0 || !selectedSport) {
      showError("No rankings to export for this sport.");
      return;
    }
    const headers = ["Rank", "Player ID", "Player Name", "Email", "Flat", "Rating", "Source", "Season", "Notes"];
    const rows = rankings.map((r) => [
      r.rank ?? "",
      r.player.id,
      `"${(r.player.fullName || "").replace(/"/g, '""')}"`,
      `"${(r.player.email || "").replace(/"/g, '""')}"`,
      `"${(r.player.flatNo || "").replace(/"/g, '""')}"`,
      r.rating ?? "",
      r.source,
      r.season,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedSport.name.toLowerCase().replace(/\s+/g, "_")}_${selectedSeason}_rankings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Rankings CSV exported successfully");
  }

  // Download Sample CSV Template
  function handleDownloadTemplate() {
    setShowExportMenu(false);
    const sportName = selectedSport?.name || "Sport";
    const headers = ["Rank", "Player Email or ID", "Player Name", "Rating", "Notes"];

    // Sample rows — using real community members if available, or sample defaults
    const sampleRows: string[][] = [];
    if (communityUsers.length > 0) {
      const samples = communityUsers.slice(0, 3);
      samples.forEach((u, idx) => {
        const sampleRating = 1800 - idx * 100;
        const note = idx === 0 ? "Top Seed / Club Champion" : idx === 1 ? "Singles Runner-Up" : "Semifinalist";
        sampleRows.push([
          String(idx + 1),
          `"${u.email || u.id}"`,
          `"${(u.fullName || "").replace(/"/g, '""')}"`,
          String(sampleRating),
          `"${note}"`,
        ]);
      });
    } else {
      sampleRows.push(
        ["1", "player1@example.com", "Alex Morgan", "1850", "Club Champion 2024"],
        ["2", "player2@example.com", "Jordan Smith", "1720", "Singles Finalist"],
        ["3", "player3@example.com", "Taylor Swift", "1600", "Top 4 Semi-Finalist"]
      );
    }

    const csvLines = [
      headers.join(","),
      ...sampleRows.map((row) => row.join(",")),
    ];

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sportName.toLowerCase().replace(/\s+/g, "_")}_rankings_sample_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Sample rankings template downloaded");
  }

  // CSV File Parse
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        showError("CSV file is empty");
        return;
      }

      // Helper to parse a CSV line respecting quotes
      const parseCsvLine = (line: string): string[] => {
        const cols: string[] = [];
        let cur = "";
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            cols.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());
        return cols;
      };

      const firstLineCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
      const hasHeader = firstLineCols.some((c) =>
        c.includes("rank") || c.includes("player") || c.includes("email") || c.includes("rating") || c.includes("id")
      );

      let colIndexRank = -1;
      let colIndexEmail = -1;
      let colIndexName = -1;
      let colIndexId = -1;
      let colIndexRating = -1;
      let colIndexNotes = -1;

      if (hasHeader) {
        firstLineCols.forEach((col, idx) => {
          if (col.includes("rank")) colIndexRank = idx;
          else if (col.includes("email")) colIndexEmail = idx;
          else if (col.includes("player id") || col === "id" || col.includes("user id")) colIndexId = idx;
          else if (col.includes("name") || col.includes("player")) colIndexName = idx;
          else if (col.includes("rating") || col.includes("score") || col.includes("points")) colIndexRating = idx;
          else if (col.includes("note") || col.includes("comment") || col.includes("achievement")) colIndexNotes = idx;
        });
      }

      const dataLines = hasHeader ? lines.slice(1) : lines;
      const parsed: CsvParsedRow[] = [];

      dataLines.forEach((line) => {
        const parts = parseCsvLine(line);
        if (parts.length === 0 || parts.every((p) => !p)) return;

        let rankVal: number | null = null;
        let ratingVal: number | null = null;
        let userIdentifier = "";
        let notesVal = "";

        if (hasHeader) {
          if (colIndexRank >= 0 && parts[colIndexRank] && !isNaN(Number(parts[colIndexRank]))) {
            rankVal = Number(parts[colIndexRank]);
          }
          if (colIndexRating >= 0 && parts[colIndexRating] && !isNaN(Number(parts[colIndexRating]))) {
            ratingVal = Number(parts[colIndexRating]);
          }
          if (colIndexNotes >= 0 && parts[colIndexNotes]) {
            notesVal = parts[colIndexNotes];
          }

          if (colIndexEmail >= 0 && parts[colIndexEmail]) {
            userIdentifier = parts[colIndexEmail];
          } else if (colIndexId >= 0 && parts[colIndexId]) {
            userIdentifier = parts[colIndexId];
          } else if (colIndexName >= 0 && parts[colIndexName]) {
            userIdentifier = parts[colIndexName];
          } else {
            userIdentifier = parts[0] || "";
          }
        } else {
          // Fallback positional
          if (!isNaN(Number(parts[0])) && parts.length >= 3) {
            rankVal = Number(parts[0]);
            userIdentifier = parts[1] || parts[2];
            ratingVal = !isNaN(Number(parts[3])) ? Number(parts[3]) : (!isNaN(Number(parts[5])) ? Number(parts[5]) : null);
            notesVal = parts[4] || parts[8] || "";
          } else {
            userIdentifier = parts[0];
            rankVal = parts[1] && !isNaN(Number(parts[1])) ? Number(parts[1]) : null;
            ratingVal = parts[2] && !isNaN(Number(parts[2])) ? Number(parts[2]) : null;
            notesVal = parts[3] || "";
          }
        }

        // Match against community users
        const cleanQuery = userIdentifier.trim().toLowerCase();
        const matched = communityUsers.find(
          (u) =>
            String(u.id) === userIdentifier.trim() ||
            (u.email && u.email.toLowerCase() === cleanQuery) ||
            (u.fullName && u.fullName.toLowerCase() === cleanQuery)
        );

        parsed.push({
          userId: matched?.id,
          userSearch: userIdentifier,
          matchedUser: matched,
          rank: rankVal,
          rating: ratingVal,
          notes: notesVal,
          error: !matched ? "User not found in community" : undefined,
        });
      });

      if (parsed.length === 0) {
        showError("No data rows found in CSV file");
        return;
      }

      setCsvRows(parsed);
      setShowImportModal(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  }

  // Execute CSV batch import
  async function handleExecuteImport() {
    const validRows = csvRows.filter((r) => r.matchedUser && r.matchedUser.id);
    if (validRows.length === 0 || !selectedSportId || !effectiveCommunityId) {
      showError("No valid player rows to import");
      return;
    }

    setImporting(true);
    let successCount = 0;
    try {
      for (const row of validRows) {
        await sportsRankingService.upsert({
          userId: row.matchedUser!.id,
          sportId: selectedSportId,
          communityId: effectiveCommunityId,
          rank: row.rank ?? null,
          rating: row.rating ?? null,
          season: selectedSeason,
          notes: row.notes || null,
        });
        successCount++;
      }
      showSuccess(`Successfully imported ${successCount} player rankings!`);
      setShowImportModal(false);
      setCsvRows([]);
      load();
    } catch {
      showError("Error occurred during bulk import");
    } finally {
      setImporting(false);
    }
  }

  const selectedSport = sports.find((s) => s.id === selectedSportId);

  // Processed and Filtered rankings for the table
  const displayedRankings = useMemo(() => {
    let list = [...rankings];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.player.fullName.toLowerCase().includes(q) ||
          (r.player.email || "").toLowerCase().includes(q) ||
          (r.player.flatNo || "").toLowerCase().includes(q) ||
          (r.notes || "").toLowerCase().includes(q)
      );
    }

    // Source filter
    if (sourceFilter !== "ALL") {
      list = list.filter((r) => r.source === sourceFilter);
    }

    // Sort order
    list.sort((a, b) => {
      switch (sortBy) {
        case "RANK_ASC":
          return (a.rank ?? 99999) - (b.rank ?? 99999);
        case "RANK_DESC":
          return (b.rank ?? -1) - (a.rank ?? -1);
        case "RATING_DESC":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "RATING_ASC":
          return (a.rating ?? 0) - (b.rating ?? 0);
        case "NAME_ASC":
          return a.player.fullName.localeCompare(b.player.fullName);
        default:
          return 0;
      }
    });

    return list;
  }, [rankings, searchQuery, sourceFilter, sortBy]);

  // Top 3 Podium players
  const topPodium = useMemo(() => {
    const sorted = [...rankings].filter((r) => r.rank != null && r.rank > 0).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    return {
      first: sorted.find((r) => r.rank === 1),
      second: sorted.find((r) => r.rank === 2),
      third: sorted.find((r) => r.rank === 3),
    };
  }, [rankings]);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = rankings.length;
    const rated = rankings.filter((r) => r.rating != null && r.rating > 0);
    const avgRating = rated.length > 0 ? Math.round(rated.reduce((acc, curr) => acc + (curr.rating || 0), 0) / rated.length) : 0;
    const maxRating = rated.length > 0 ? Math.max(...rated.map((r) => r.rating || 0)) : 0;
    const autoCount = rankings.filter((r) => r.source === "COMPUTED").length;
    const manualCount = rankings.filter((r) => r.source === "MANUAL").length;
    return { total, avgRating, maxRating, autoCount, manualCount };
  }, [rankings]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sport and Season Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="min-w-[200px] flex-1 sm:flex-initial">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Sport</label>
              <div className="relative">
                <select
                  value={selectedSportId ?? ""}
                  onChange={(e) => setSelectedSportId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-9 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <option value="">Select sport…</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Season</label>
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-9 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>
                      {s === "CURRENT" ? "Current Season" : s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="self-end">
              <button
                onClick={load}
                disabled={!selectedSportId || loading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 flex items-center gap-1.5 transition-all shadow-xs"
                title="Refresh Rankings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Action Buttons: Import, Export, Auto-Resequence, Add */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Hidden CSV file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => {
                if (csvRows.length > 0) {
                  setShowImportModal(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={!selectedSportId || !effectiveCommunityId}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Import rankings from CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Import CSV
            </button>

            {/* Export Dropdown Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                disabled={!selectedSportId}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Export rankings or download template"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={rankings.length === 0}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <div>
                      <div className="font-semibold">Export Current Rankings</div>
                      <div className="text-[10px] text-slate-400">Download {rankings.length} players (.csv)</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Download Sample Template</div>
                      <div className="text-[10px] text-slate-400">Ready-to-fill CSV with sample columns</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAutoResequence}
              disabled={!selectedSportId || rankings.length === 0 || resequencing}
              className="px-3 py-2 rounded-xl text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sort players by rating and assign sequential ranks 1..N"
            >
              <Sparkles className={`w-3.5 h-3.5 ${resequencing ? "animate-spin" : ""}`} />
              Auto-Rank
            </button>

            <button
              onClick={openCreate}
              disabled={!selectedSportId || !effectiveCommunityId}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 flex items-center gap-1.5 transition-all shadow-xs shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Player
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-500/20 shadow-md p-5 transition-all animate-in fade-in">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Player Ranking" : "Add Player Ranking"}
                {selectedSport && <span className="text-indigo-600 font-medium"> — {selectedSport.name}</span>}
              </h3>
            </div>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Player Search Selection */}
            <div className="sm:col-span-2 md:col-span-3 relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Community Player <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  ref={userSearchRef}
                  value={form.userSearch}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, userSearch: e.target.value, userId: "" }));
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  placeholder="Search player by name, email or flat number…"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  autoComplete="off"
                />
                {form.userSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, userSearch: "", userId: "" }));
                      userSearchRef.current?.focus();
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {form.userId && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-indigo-600 font-medium bg-indigo-50/60 px-2.5 py-1 rounded-md w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  Player selected (ID: {form.userId})
                </div>
              )}

              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={() => selectUser(u)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/70 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{u.fullName}</div>
                        <div className="text-xs text-slate-400">
                          {u.email}
                          {u.flatNo ? ` · Flat ${u.flatNo}` : ""}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showUserDropdown && form.userSearch && filteredUsers.length === 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-3 text-xs text-slate-500">
                  No community residents matching "{form.userSearch}"
                </div>
              )}
            </div>

            {/* Rank Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Rank Position <span className="text-slate-400 font-normal">(1 = top seed)</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.rank}
                onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
                placeholder="e.g. 1"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Rating Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Rating Score <span className="text-slate-400 font-normal">(e.g. 1200 - 2000)</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                placeholder="e.g. 1500"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Season Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Season</label>
              <div className="relative">
                <select
                  value={form.season}
                  onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-9 bg-white cursor-pointer shadow-2xs"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>
                      {s === "CURRENT" ? "Current Season" : s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Player Achievements</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. 2024 Club Champion, Singles Gold Medalist"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-2.5 mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={closeForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.userId}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-xs shadow-indigo-200 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingId ? "Update Ranking" : "Save Ranking"}
            </button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">CSV Bulk Import</h3>
                  <p className="text-xs text-slate-400">
                    Import player rankings for {selectedSport?.name} ({selectedSeason})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvRows([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Sample Template Download Callout */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-indigo-950">Need a CSV template?</div>
                    <div className="text-[11px] text-indigo-700/80">
                      Download our pre-filled template with sample columns (Rank, Email/ID, Name, Rating, Notes).
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50/80 rounded-lg shrink-0 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download Sample Template
                </button>
              </div>

              {/* Upload Drop Zone / Change File */}
              {csvRows.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2.5 bg-slate-50/30 hover:bg-indigo-50/20 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Click to upload your filled CSV file</div>
                  <div className="text-[11px] text-slate-400 max-w-xs">
                    Supports columns: Rank, Player Email/ID, Player Name, Rating, Notes
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <div>
                      Found <strong>{csvRows.length}</strong> rows:{" "}
                      <span className="text-emerald-600 font-semibold">
                        {csvRows.filter((r) => !r.error).length} ready
                      </span>
                      {csvRows.some((r) => r.error) && (
                        <span className="text-rose-600 font-semibold">
                          , {csvRows.filter((r) => r.error).length} errors
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                    >
                      Choose Different File
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <th className="p-2">Rank</th>
                          <th className="p-2">Parsed Query</th>
                          <th className="p-2">Matched Player</th>
                          <th className="p-2">Rating</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvRows.map((r, i) => (
                          <tr key={i} className={r.error ? "bg-rose-50/40" : "hover:bg-slate-50/50"}>
                            <td className="p-2 font-semibold text-slate-700">#{r.rank ?? "—"}</td>
                            <td className="p-2 text-slate-600 font-mono text-[11px]">{r.userSearch}</td>
                            <td className="p-2">
                              {r.matchedUser ? (
                                <div>
                                  <div className="font-semibold text-slate-800">{r.matchedUser.fullName}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {r.matchedUser.email}
                                    {r.matchedUser.flatNo ? ` · Flat ${r.matchedUser.flatNo}` : ""}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-rose-500 font-medium">Unresolved</span>
                              )}
                            </td>
                            <td className="p-2 font-semibold text-indigo-600">{r.rating ?? "—"}</td>
                            <td className="p-2">
                              {r.error ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                  <AlertCircle className="w-3 h-3" /> {r.error}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvRows([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing || csvRows.filter((r) => !r.error).length === 0}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs shadow-indigo-200 cursor-pointer"
              >
                {importing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Import {csvRows.filter((r) => !r.error).length} Players
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!selectedSportId ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Select a Sport</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Choose a sport from the dropdown above to view leaderboards, manage seeds, and analyze player performance ratings.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-indigo-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading rankings…</span>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Medal className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No rankings yet for {selectedSport?.name}</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Add resident rankings manually or import via CSV to initialize tournament seeding.
          </p>
          <button
            onClick={openCreate}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Player
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Ranked</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Rating</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">{stats.maxRating || "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg. Rating</div>
              <div className="text-xl font-bold text-slate-700 mt-1">{stats.avgRating || "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Source Breakdown</div>
              <div className="text-xs font-semibold text-slate-600 mt-1.5 flex items-center gap-2">
                <span className="text-emerald-600">{stats.autoCount} Auto</span>
                <span className="text-slate-300">·</span>
                <span className="text-blue-600">{stats.manualCount} Manual</span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium Showcase */}
          {(topPodium.first || topPodium.second || topPodium.third) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Rank 1 - Gold */}
              {topPodium.first && (
                <div className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white rounded-2xl border-2 border-amber-300/80 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 right-3 text-2xl font-black text-amber-500/30">#1</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🥇</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                        Gold Champion
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{topPodium.first.player.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {topPodium.first.player.flatNo ? `Flat ${topPodium.first.player.flatNo} · ` : ""}
                      {topPodium.first.player.email}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
                      <span className="text-base font-extrabold text-amber-800 tabular-nums">
                        {topPodium.first.rating ?? "—"}
                      </span>
                    </div>
                    {topPodium.first.rating && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          getRatingTier(topPodium.first.rating).color
                        }`}
                      >
                        {getRatingTier(topPodium.first.rating).name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Rank 2 - Silver */}
              {topPodium.second && (
                <div className="bg-gradient-to-b from-slate-200/50 via-slate-100/20 to-white rounded-2xl border border-slate-300/80 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 right-3 text-2xl font-black text-slate-400/30">#2</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🥈</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                        Silver Runner-Up
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{topPodium.second.player.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {topPodium.second.player.flatNo ? `Flat ${topPodium.second.player.flatNo} · ` : ""}
                      {topPodium.second.player.email}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
                      <span className="text-base font-extrabold text-slate-800 tabular-nums">
                        {topPodium.second.rating ?? "—"}
                      </span>
                    </div>
                    {topPodium.second.rating && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          getRatingTier(topPodium.second.rating).color
                        }`}
                      >
                        {getRatingTier(topPodium.second.rating).name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Rank 3 - Bronze */}
              {topPodium.third && (
                <div className="bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-white rounded-2xl border border-amber-600/30 p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 right-3 text-2xl font-black text-amber-700/20">#3</div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🥉</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        Bronze 3rd Place
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-base">{topPodium.third.player.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {topPodium.third.player.flatNo ? `Flat ${topPodium.third.player.flatNo} · ` : ""}
                      {topPodium.third.player.email}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rating</span>
                      <span className="text-base font-extrabold text-amber-900 tabular-nums">
                        {topPodium.third.rating ?? "—"}
                      </span>
                    </div>
                    {topPodium.third.rating && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          getRatingTier(topPodium.third.rating).color
                        }`}
                      >
                        {getRatingTier(topPodium.third.rating).name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search, Filter & Table View */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, flat, email or notes…"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8.5 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Source Filter and Sort */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                  <button
                    onClick={() => setSourceFilter("ALL")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      sourceFilter === "ALL" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({rankings.length})
                  </button>
                  <button
                    onClick={() => setSourceFilter("COMPUTED")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      sourceFilter === "COMPUTED" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Auto ({stats.autoCount})
                  </button>
                  <button
                    onClick={() => setSourceFilter("MANUAL")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      sourceFilter === "MANUAL" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Manual ({stats.manualCount})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500/20 appearance-none pr-7 cursor-pointer shadow-2xs"
                  >
                    <option value="RANK_ASC">Sort: Rank (Low→High)</option>
                    <option value="RANK_DESC">Sort: Rank (High→Low)</option>
                    <option value="RATING_DESC">Sort: Rating (Highest)</option>
                    <option value="RATING_ASC">Sort: Rating (Lowest)</option>
                    <option value="NAME_ASC">Sort: Player Name (A-Z)</option>
                  </select>
                  <ArrowUpDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left w-20">Rank</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-left w-32">Rating & Tier</th>
                    <th className="px-4 py-3 text-left w-24">Source</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRankings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">
                        No rankings matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    displayedRankings.map((r) => {
                      const tier = getRatingTier(r.rating);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            {r.rank != null ? (
                              <div className="flex items-center gap-1.5">
                                {r.rank === 1 ? (
                                  <span className="text-base">🥇</span>
                                ) : r.rank === 2 ? (
                                  <span className="text-base">🥈</span>
                                ) : r.rank === 3 ? (
                                  <span className="text-base">🥉</span>
                                ) : null}
                                <span className="font-bold text-slate-700 tabular-nums">#{r.rank}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs font-mono">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {r.player.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{r.player.fullName}</div>
                                <div className="text-xs text-slate-400">
                                  {r.player.email ?? ""}
                                  {r.player.flatNo ? ` · Flat ${r.player.flatNo}` : ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 tabular-nums text-sm">
                                {r.rating != null ? r.rating : <span className="text-slate-300 font-normal">—</span>}
                              </span>
                              {r.rating != null && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tier.color}`}
                                >
                                  {tier.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.source === "COMPUTED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {r.source === "COMPUTED" ? "Auto" : "Manual"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px] truncate">
                            {r.notes || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(r)}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Edit Ranking"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                                title="Delete Ranking"
                              >
                                {deletingId === r.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Helper Note */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div>
                Showing <strong>{displayedRankings.length}</strong> of <strong>{rankings.length}</strong> players
              </div>
              <div className="text-slate-400">
                Rank 1 indicates the top seed. Rankings are referenced during tournament bracket scheduling.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
