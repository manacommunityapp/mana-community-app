import { useState, useEffect, useCallback, useRef } from "react";
import { Trophy, Plus, Pencil, Trash2, RefreshCw, X, Save, ChevronDown, Medal, Search } from "lucide-react";
import { sportsRankingService } from "../../../../services/sports/sportsRankingService";
import { userService } from "../../../../services/common/userService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";
import type { SportsPlayerRanking, SportMeta, UserResponse } from "../../../../types/api";

interface Props {
  communityId?: number | null;
  sportsMeta: SportMeta[];
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

export function RankingsAdminTab({ communityId, sportsMeta }: Props) {
  const effectiveCommunityId = communityId ?? null;

  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState("CURRENT");
  const [rankings, setRankings] = useState<SportsPlayerRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RankingFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [communityUsers, setCommunityUsers] = useState<UserOption[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!effectiveCommunityId) return;
    userService.getCommunityUsers(effectiveCommunityId).then((users: UserResponse[]) => {
      setCommunityUsers(users.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, flatNo: u.flatNo })));
    }).catch(() => {});
  }, [effectiveCommunityId]);

  const filteredUsers = communityUsers.filter(u => {
    const q = form.userSearch.toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.flatNo || "").toLowerCase().includes(q)
    );
  }).slice(0, 10);

  function selectUser(u: UserOption) {
    setForm(f => ({ ...f, userId: String(u.id), userSearch: u.fullName }));
    setShowUserDropdown(false);
  }

  const seasons = ["CURRENT", "2025-26", "2024-25", "2023-24"];

  const load = useCallback(async () => {
    if (!selectedSportId || !effectiveCommunityId) return;
    setLoading(true);
    try {
      const data = await sportsRankingService.list(selectedSportId, effectiveCommunityId, selectedSeason);
      setRankings(data);
    } catch {
      showError("Failed to load rankings");
    } finally {
      setLoading(false);
    }
  }, [selectedSportId, effectiveCommunityId, selectedSeason]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      setRankings(prev => prev.filter(r => r.id !== id));
    } catch {
      showError("Failed to delete ranking");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedSport = sportsMeta.find(s => s.id === selectedSportId);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-slate-700 block mb-1">Sport</label>
            <div className="relative">
              <select
                value={selectedSportId ?? ""}
                onChange={e => setSelectedSportId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 appearance-none pr-8"
              >
                <option value="">Select sport…</option>
                {sportsMeta.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="min-w-[150px]">
            <label className="text-xs font-medium text-slate-700 block mb-1">Season</label>
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={e => setSelectedSeason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 appearance-none pr-8"
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s === "CURRENT" ? "Current" : s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={load}
            disabled={!selectedSportId}
            className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Load
          </button>

          <button
            onClick={openCreate}
            disabled={!selectedSportId || !effectiveCommunityId}
            className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 flex items-center gap-1.5 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ranking
          </button>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingId ? "Edit Ranking" : "Add Player Ranking"}
              {selectedSport && <span className="text-slate-400 font-normal"> — {selectedSport.name}</span>}
            </h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 relative" ref={dropdownRef}>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Player <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={userSearchRef}
                  value={form.userSearch}
                  onChange={e => {
                    setForm(f => ({ ...f, userSearch: e.target.value, userId: "" }));
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                  placeholder="Search by name, email or flat…"
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  autoComplete="off"
                />
                {form.userSearch && (
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, userSearch: "", userId: "" })); userSearchRef.current?.focus(); }}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {form.userId && (
                <p className="text-[10px] text-indigo-600 mt-0.5 font-medium">Selected user ID: {form.userId}</p>
              )}
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg overflow-y-auto max-h-52">
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={() => selectUser(u)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <div className="text-sm font-medium text-slate-800">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400">{u.email}{u.flatNo ? ` · Flat ${u.flatNo}` : ""}</div>
                    </button>
                  ))}
                </div>
              )}
              {showUserDropdown && form.userSearch && filteredUsers.length === 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg px-3 py-2 text-xs text-slate-400">
                  No community members found
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Rank <span className="text-slate-400 font-normal">(1 = best)</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.rank}
                onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                placeholder="e.g. 1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Rating <span className="text-slate-400 font-normal">(numeric score, higher = better)</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                placeholder="e.g. 1500"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Season</label>
              <select
                value={form.season}
                onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s === "CURRENT" ? "Current" : s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={closeForm}
              className="px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.userId}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Rankings table */}
      {!selectedSportId ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Select a sport to view rankings</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Rankings are used to seed players in tournament brackets. Select a sport above to manage them.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-indigo-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading rankings…</span>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Medal className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No rankings yet for {selectedSport?.name}</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Add player rankings manually. They will be used to seed matches when generating brackets.
          </p>
          <button
            onClick={openCreate}
            className="mt-1 px-4 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Ranking
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {selectedSport?.name} — {selectedSeason === "CURRENT" ? "Current Season" : selectedSeason}
            </span>
            <span className="text-xs text-slate-400">{rankings.length} players</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Rank</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Player</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Rating</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Source</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rankings.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {r.rank != null ? (
                        <div className="flex items-center gap-1.5">
                          {r.rank <= 3 && (
                            <span className={`text-base ${r.rank === 1 ? "text-amber-400" : r.rank === 2 ? "text-slate-400" : "text-amber-700"}`}>
                              {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          )}
                          <span className="font-semibold text-slate-700 tabular-nums">#{r.rank}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{r.player.fullName}</div>
                      <div className="text-xs text-slate-400">{r.player.email ?? ""}{r.player.flatNo ? ` · Flat ${r.player.flatNo}` : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.rating != null ? (
                        <span className="font-semibold text-indigo-700 tabular-nums">{r.rating}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        r.source === "COMPUTED"
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {r.source === "COMPUTED" ? "Auto" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                      {r.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Remove"
                        >
                          {deletingId === r.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-[10px] text-slate-400">
              Rankings are used to seed players in knockout and group-stage brackets. Rank 1 = top seed. When a seed is also set per-event registration, the event seed takes priority.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
