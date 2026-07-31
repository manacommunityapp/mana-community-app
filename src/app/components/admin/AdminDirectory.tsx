import { useEffect, useState, useCallback, useRef } from "react";
import {
  Shield, Plus, Pencil, Trash2, X, Search, Inbox, Loader2,
  Phone, Mail, ArrowUpDown, GripVertical, Users, UserCheck, ChevronDown,
} from "lucide-react";
import { communityDirectoryService } from "../../../services/communityDirectoryService";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { confirmAction } from "../../../utils/AlertUtils";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type { CommunityLeaderResponse, CommunityLeaderRequest, UserResponse } from "../../../types/api";

const DESIGNATIONS = [
  "President", "Vice President", "Secretary", "Joint Secretary", "Treasurer",
  "Sports Director", "Director", "Chairman", "Chairperson",
  "Cultural Head", "Maintenance Head", "Security Head", "Grievance Officer", "Member",
];

const emptyForm: CommunityLeaderRequest & { _userName?: string } = {
  userId: 0,
  designation: "",
  committee: "",
  contactPhone: "",
  contactEmail: "",
  displayOrder: 0,
};

export function AdminDirectory() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<CommunityLeaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<null | "create" | CommunityLeaderResponse>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // User search for the "Add Leader" picker
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResponse[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await communityDirectoryService.getDirectory();
      setLeaders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchForUsers = (q: string) => {
    setUserQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim() || !user?.communityId) {
      setUserResults([]);
      setShowUserDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await userService.searchUsers(user.communityId!, q.trim());
        setUserResults(Array.isArray(res) ? res : []);
        setShowUserDropdown(true);
      } catch {
        setUserResults([]);
      } finally {
        setUserSearching(false);
      }
    }, 300);
  };

  const selectUser = (u: UserResponse) => {
    setForm({
      ...form,
      userId: u.id,
      _userName: u.fullName,
      contactPhone: u.phone || form.contactPhone,
      contactEmail: u.email || form.contactEmail,
    });
    setUserQuery(u.fullName);
    setShowUserDropdown(false);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setUserQuery("");
    setModal("create");
  };

  const openEdit = (l: CommunityLeaderResponse) => {
    setForm({
      userId: l.userId,
      designation: l.designation,
      committee: l.committee || "",
      contactPhone: l.contactPhone || "",
      contactEmail: l.contactEmail || "",
      displayOrder: l.displayOrder,
      _userName: l.fullName,
    });
    setUserQuery(l.fullName);
    setModal(l);
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.designation.trim()) {
      showError("User and designation are required");
      return;
    }
    const req: CommunityLeaderRequest = {
      userId: form.userId,
      designation: form.designation.trim(),
      committee: form.committee?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactEmail: form.contactEmail?.trim() || undefined,
      displayOrder: form.displayOrder ?? 0,
    };
    setSaving(true);
    try {
      if (modal === "create") {
        await communityDirectoryService.addLeader(req);
        showSuccess("Leader added to directory");
      } else if (modal) {
        await communityDirectoryService.updateLeader(modal.id, req);
        showSuccess("Leader updated");
      }
      setModal(null);
      load();
    } catch (err: any) {
      showError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l: CommunityLeaderResponse) => {
    const ok = await confirmAction(
      "Remove Leader",
      `Remove "${l.fullName}" (${l.designation}) from the directory? They can be re-added later.`
    );
    if (!ok) return;
    setDeletingId(l.id);
    try {
      await communityDirectoryService.removeLeader(l.id);
      showSuccess(`${l.fullName} removed from directory`);
      setLeaders((prev) => prev.filter((x) => x.id !== l.id));
    } catch (err: any) {
      showError(err?.message || "Failed to remove");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = leaders.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.fullName?.toLowerCase().includes(q) ||
      l.designation?.toLowerCase().includes(q) ||
      l.committee?.toLowerCase().includes(q) ||
      l.contactEmail?.toLowerCase().includes(q)
    );
  });

  const getDesignationStyle = (desig: string) => {
    const d = desig.toLowerCase();
    if (d.includes("president") || d.includes("chairman") || d.includes("chairperson")) {
      return "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-500/20";
    }
    if (d.includes("treasurer") || d.includes("finance")) {
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    }
    if (d.includes("secretary")) {
      return "bg-violet-50 border-violet-200 text-violet-700";
    }
    if (d.includes("director") || d.includes("head") || d.includes("officer")) {
      return "bg-indigo-50 border-indigo-200 text-indigo-700";
    }
    return "bg-slate-50 border-slate-200 text-slate-600";
  };

  return (
    <div className="space-y-6 w-full pb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/50 backdrop-blur-md border border-slate-200/40 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md flex-shrink-0">
            <Shield className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              <span>Admin Hub</span>
              <span>/</span>
              <span>Community Directory</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              Community Directory
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Manage leaders, committee members and contact persons.</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shrink-0"
        >
          <Plus className="w-4.5 h-4.5" /> Add Leader
        </button>
      </div>

      {/* ── Search & Metrics ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, designation or committee..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of <span className="font-semibold text-slate-900">{leaders.length}</span> directory members
        </p>
      </div>

      {/* ── Body Card Grid/Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/50 border border-slate-200/50 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <span className="text-sm text-slate-500 font-medium">Loading directory from database...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white/50 border border-slate-200/50 rounded-2xl p-6">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={load} className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
            Retry Connection
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/50 border border-slate-200/50 rounded-2xl p-6">
          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-30 text-indigo-600" />
          <p className="text-slate-600 font-semibold">{search ? "No directory listings match your filters" : "No leaders added to this community yet"}</p>
          {!search && (
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Add your first leader
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Order</div>
                  </th>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4 hidden md:table-cell">Committee Group</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Contact Details</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Display Order */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-400">
                        <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{l.displayOrder}</span>
                      </div>
                    </td>

                    {/* Member Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {l.profilePicUrl ? (
                          <img src={l.profilePicUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner">
                            {l.fullName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{l.fullName}</div>
                          {(l.flatNo || l.block) && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {[l.flatNo && `Flat ${l.flatNo}`, l.block && `Block ${l.block}`].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Designation Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getDesignationStyle(l.designation)}`}>
                        {l.designation}
                      </span>
                    </td>

                    {/* Committee */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {l.committee ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {l.committee}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Contact details */}
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                        {l.contactPhone && (
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {l.contactPhone}</span>
                        )}
                        {l.contactEmail && (
                          <span className="flex items-center gap-1.5 truncate max-w-[200px]"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {l.contactEmail}</span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 bg-white transition-all cursor-pointer shadow-sm"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l)}
                          disabled={deletingId === l.id}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 bg-white transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                          title="Remove"
                        >
                          {deletingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal Redesign ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white z-10">
              <h3 className="text-base font-bold flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-200" />
                {modal === "create" ? "Add Directory Leader" : "Edit Directory Leader"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* User Selection */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Community Member *</label>
                {modal === "create" ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={userQuery}
                      onChange={(e) => searchForUsers(e.target.value)}
                      placeholder="Search member by name or email..."
                      className={`${inputCls} pl-10 focus:ring-2 focus:ring-indigo-500/20`}
                      autoComplete="off"
                    />
                    {userSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />}
                    {showUserDropdown && userResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-50">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectUser(u)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {u.fullName?.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-800 text-xs truncate">{u.fullName}</div>
                              <div className="text-[10px] text-slate-450 truncate">
                                {u.email} {u.flatNo ? `· Flat ${u.flatNo}` : ""} {u.block ? `Block ${u.block}` : ""}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    {form._userName || `User #${form.userId}`}
                  </div>
                )}
              </div>

              {/* Designation selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Designation *</label>
                <div className="relative">
                  <select
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className={`${inputCls} appearance-none cursor-pointer pr-10`}
                  >
                    <option value="">Select official role</option>
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 pointer-events-none" />
                </div>
              </div>

              {/* Committee Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Committee Group Designation</label>
                <input
                  value={form.committee || ""}
                  onChange={(e) => setForm({ ...form, committee: e.target.value })}
                  placeholder="e.g. Sports Committee, Cultural Committee"
                  className={inputCls}
                />
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Leave empty for executive roles (President, Secretary, etc.)</p>
              </div>

              {/* Contact Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Contact Phone</label>
                  <input
                    value={form.contactPhone || ""}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Contact Email</label>
                  <input
                    value={form.contactEmail || ""}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="leader@example.com"
                    className={inputCls}
                    type="email"
                  />
                </div>
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Display Position Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.displayOrder ?? 0}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className={`${inputCls} max-w-[120px]`}
                />
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Lower number values appear first in order (e.g. position 1 before 2)</p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 inline-flex items-center gap-2 min-w-[140px] justify-center cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-650 hover:to-violet-750"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (modal === "create" ? "Add Leader" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-semibold";
