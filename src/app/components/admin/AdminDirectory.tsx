import { useEffect, useState, useCallback, useRef } from "react";
import {
  Shield, Plus, Pencil, Trash2, X, Search, Inbox, Loader2,
  Phone, Mail, ArrowUpDown, GripVertical, Users,
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            Community Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage leaders, committee members and contact persons.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          <Plus className="w-4 h-4" /> Add Leader
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, designation or committee..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading directory...
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive font-medium mb-3">{error}</p>
          <button onClick={load} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{search ? "No leaders match your search." : "No leaders added yet."}</p>
          {!search && (
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Add your first leader
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  <div className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Order</div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Designation</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Committee</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GripVertical className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono">{l.displayOrder}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {l.profilePicUrl ? (
                        <img src={l.profilePicUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {l.fullName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{l.fullName}</div>
                        {(l.flatNo || l.block) && (
                          <div className="text-[10px] text-muted-foreground">
                            {[l.flatNo && `Flat ${l.flatNo}`, l.block && `Block ${l.block}`].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {l.designation}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {l.committee ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" /> {l.committee}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {l.contactPhone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {l.contactPhone}</span>
                      )}
                      {l.contactEmail && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail className="w-3 h-3 flex-shrink-0" /> {l.contactEmail}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(l)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
                        disabled={deletingId === l.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Remove"
                      >
                        {deletingId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                {modal === "create" ? "Add Leader" : "Edit Leader"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* User Picker */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-xs font-semibold text-muted-foreground ml-0.5">Community Member *</label>
                {modal === "create" ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={userQuery}
                      onChange={(e) => searchForUsers(e.target.value)}
                      placeholder="Search by name or email..."
                      className={`${inputCls} pl-10`}
                      autoComplete="off"
                    />
                    {userSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                    {showUserDropdown && userResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectUser(u)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors text-sm cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {u.fullName?.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground text-xs truncate">{u.fullName}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {u.email} {u.flatNo ? `· Flat ${u.flatNo}` : ""} {u.block ? `Block ${u.block}` : ""}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground">
                    {form._userName || `User #${form.userId}`}
                  </div>
                )}
                {form.userId > 0 && modal === "create" && (
                  <p className="text-[10px] text-emerald-600 ml-0.5">Selected: {form._userName}</p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-0.5">Designation *</label>
                <select
                  value={DESIGNATIONS.includes(form.designation) ? form.designation : "__custom"}
                  onChange={(e) => {
                    if (e.target.value === "__custom") {
                      setForm({ ...form, designation: "" });
                    } else {
                      setForm({ ...form, designation: e.target.value });
                    }
                  }}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="" disabled>Select designation...</option>
                  {DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="__custom">Custom...</option>
                </select>
                {(!DESIGNATIONS.includes(form.designation) && form.designation !== "") && (
                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Enter custom designation..."
                    className={inputCls}
                  />
                )}
                {!DESIGNATIONS.includes(form.designation) && form.designation === "" && (
                  <input
                    value=""
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Enter custom designation..."
                    className={inputCls}
                    autoFocus
                  />
                )}
              </div>

              {/* Committee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-0.5">Committee</label>
                <input
                  value={form.committee || ""}
                  onChange={(e) => setForm({ ...form, committee: e.target.value })}
                  placeholder="e.g. Sports Committee, Cultural Committee"
                  className={inputCls}
                />
                <p className="text-[10px] text-muted-foreground/70 ml-0.5">Leave empty for executive roles (President, Secretary, etc.)</p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-0.5">Phone</label>
                  <input
                    value={form.contactPhone || ""}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-0.5">Email</label>
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
                <label className="text-xs font-semibold text-muted-foreground ml-0.5">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.displayOrder ?? 0}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  className={`${inputCls} max-w-[120px]`}
                />
                <p className="text-[10px] text-muted-foreground/70 ml-0.5">Lower numbers appear first</p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60 inline-flex items-center gap-2 min-w-[140px] justify-center cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
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
  "w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-indigo-500 transition-colors";
