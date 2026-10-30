import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, X, Loader2, Ban } from "lucide-react";
import {
  accessCardService,
  vehicleBlacklistService,
  type AccessCard,
  type IssueAccessCardRequest,
  type VehicleBlacklistEntry,
  type AddVehicleBlacklistRequest,
} from "../../../services/security/securityService";
import { getStoredUser } from "../../../services/common/apiClient";

type TabKey = "cards" | "vehicle-blacklist";

const cardStatusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  INACTIVE: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  LOST: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
  EXPIRED: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
};

export function AccessCardsManagement() {
  const [tab, setTab] = useState<TabKey>("cards");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" /> Access Management
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">RFID access cards and vehicle blacklist management</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: "cards" as TabKey, label: "Access Cards", icon: <CreditCard className="w-4 h-4" /> },
          { key: "vehicle-blacklist" as TabKey, label: "Vehicle Blacklist", icon: <Ban className="w-4 h-4" /> },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "cards" && <AccessCardsTab />}
      {tab === "vehicle-blacklist" && <VehicleBlacklistTab />}
    </div>
  );
}

// ── Access Cards ──────────────────────────────────────────────────────────────

function AccessCardsTab() {
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<IssueAccessCardRequest>>({ holderType: "RESIDENT" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCards(await accessCardService.getCards()); } catch { setCards([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const issue = async () => {
    if (!form.cardNumber || !form.holderName) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await accessCardService.issueCard({
        communityId: user?.communityId ?? 0,
        cardNumber: form.cardNumber,
        holderName: form.holderName,
        holderType: form.holderType ?? "RESIDENT",
        flatNumber: form.flatNumber,
        expiresAt: form.expiresAt,
        notes: form.notes,
      });
      setForm({ holderType: "RESIDENT" });
      setShowForm(false);
      load();
    } catch { alert("Failed to issue card."); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    try { await accessCardService.updateCardStatus(id, status); load(); } catch { alert("Failed."); }
  };

  const deactivate = async (id: number) => {
    if (!confirm("Deactivate this card?")) return;
    try { await accessCardService.deactivateCard(id); load(); } catch { alert("Failed."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Issue Card
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Issue Access Card</h4>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-200">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Card Number *</label>
              <input value={form.cardNumber ?? ""} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                placeholder="e.g. RFID-001, A-0012345"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Holder Name *</label>
              <input value={form.holderName ?? ""} onChange={(e) => setForm({ ...form, holderName: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Holder Type</label>
              <select value={form.holderType} onChange={(e) => setForm({ ...form, holderType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="RESIDENT">Resident</option>
                <option value="STAFF">Staff</option>
                <option value="SECURITY">Security</option>
                <option value="VISITOR">Visitor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Flat Number</label>
              <input value={form.flatNumber ?? ""} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                placeholder="e.g. A-101"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expires At</label>
              <input type="date" value={form.expiresAt ?? ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={issue} disabled={saving || !form.cardNumber || !form.holderName}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Issue Card"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : cards.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No access cards issued</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Card #", "Holder", "Type", "Flat", "Issued", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cards.map((c) => {
                const s = cardStatusColors[c.status] ?? { bg: "bg-slate-50", text: "text-slate-600" };
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-slate-800 text-xs">{c.cardNumber}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{c.holderName}</td>
                    <td className="px-3 py-3 text-slate-600">{c.holderType}</td>
                    <td className="px-3 py-3 text-slate-500">{c.flatNumber ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-500">{new Date(c.issuedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-slate-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {c.status === "ACTIVE" && (
                          <button onClick={() => updateStatus(c.id, "INACTIVE")} className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50">Block</button>
                        )}
                        {c.status === "INACTIVE" && (
                          <button onClick={() => updateStatus(c.id, "ACTIVE")} className="text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50">Activate</button>
                        )}
                        <button onClick={() => deactivate(c.id)} className="p-1 rounded hover:bg-red-50">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Vehicle Blacklist ──────────────────────────────────────────────────────────

function VehicleBlacklistTab() {
  const [entries, setEntries] = useState<VehicleBlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AddVehicleBlacklistRequest>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setEntries(await vehicleBlacklistService.getBlacklist()); } catch { setEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.vehicleNumber || !form.reason) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await vehicleBlacklistService.addEntry({
        communityId: user?.communityId ?? 0,
        vehicleNumber: form.vehicleNumber,
        ownerName: form.ownerName,
        reason: form.reason,
        expiresAt: form.expiresAt,
      });
      setForm({});
      setShowForm(false);
      load();
    } catch { alert("Failed to add entry."); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove from blacklist?")) return;
    try { await vehicleBlacklistService.removeEntry(id); load(); } catch { alert("Failed."); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
          <Plus className="w-4 h-4" /> Blacklist Vehicle
        </button>
      </div>

      {showForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-red-900">Add to Vehicle Blacklist</h4>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-red-100">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Vehicle Number *</label>
              <input value={form.vehicleNumber ?? ""} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                placeholder="e.g. MH 01 AB 1234"
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Owner Name</label>
              <input value={form.ownerName ?? ""} onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Known owner"
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-red-800 mb-1">Reason *</label>
              <input value={form.reason ?? ""} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason for blacklisting"
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-800 mb-1">Expires At</label>
              <input type="date" value={form.expiresAt ?? ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-100">Cancel</button>
            <button onClick={add} disabled={saving || !form.vehicleNumber || !form.reason}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Blacklist"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Ban className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No vehicles blacklisted</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Vehicle Number", "Owner", "Reason", "Added On", "Expires", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 font-mono">{e.vehicleNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{e.ownerName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{e.reason}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500">{e.expiresAt ? new Date(e.expiresAt).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      e.active ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>{e.active ? "Blacklisted" : "Removed"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {e.active && (
                      <button onClick={() => remove(e.id)} className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
