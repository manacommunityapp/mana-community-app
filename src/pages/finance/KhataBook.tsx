import React, { useState, useEffect, useCallback } from "react";
import {
  khatabookService,
  type KhataParty,
  type KhataEntry,
  type KhataStats,
  type TransactionKind,
  type PartyType,
} from "../../services/finance/khatabookService";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  CUSTOMER: "Customer", SUPPLIER: "Supplier", FRIEND: "Friend", FAMILY: "Family",
};

// ── stat card ─────────────────────────────────────────────────────────────────

function StatBadge({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="flex-1 text-center">
      <div className={`text-xl font-extrabold ${colorClass}`}>{fmt(value)}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

// ── party card ────────────────────────────────────────────────────────────────

function PartyCard({ party, onClick }: { party: KhataParty; onClick: () => void }) {
  const isReceivable = party.balance > 0;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
        style={{ background: isReceivable ? "#00C29A" : "#EB5B5B" }}
      >
        {initials(party.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm truncate">{party.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{PARTY_TYPE_LABELS[party.partyType]}</div>
      </div>
      {party.balance !== 0 && (
        <div className="text-right flex-shrink-0">
          <div className={`font-extrabold text-sm ${isReceivable ? "text-emerald-600" : "text-red-500"}`}>
            {fmt(party.balance)}
          </div>
          <div className={`text-xs ${isReceivable ? "text-emerald-500" : "text-red-400"}`}>
            {isReceivable ? "will get" : "will give"}
          </div>
        </div>
      )}
      {party.balance === 0 && <div className="text-xs text-gray-300 flex-shrink-0">settled</div>}
    </button>
  );
}

// ── entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry, isPersonal }: { entry: KhataEntry; isPersonal: boolean }) {
  const isGave = entry.kind === "GAVE";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div
        className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isGave ? "bg-red-500" : "bg-emerald-500"}`}
      >
        {isGave ? "↑" : "↓"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700">{entry.note || (isGave ? "Payment given" : "Payment received")}</div>
        <div className="text-xs text-gray-400 mt-0.5">{entry.entryDate}</div>
      </div>
      <div className={`font-bold text-sm flex-shrink-0 ${isGave ? "text-red-500" : "text-emerald-600"}`}>
        {isGave ? "-" : "+"}{fmt(entry.amount)}
      </div>
    </div>
  );
}

// ── party detail modal ────────────────────────────────────────────────────────

function PartyDetail({
  party, isPersonal, onClose,
}: { party: KhataParty; isPersonal: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<TransactionKind>("GAVE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [localParty, setLocalParty] = useState(party);

  useEffect(() => {
    khatabookService.getEntries(party.id).then(e => { setEntries(e); setLoading(false); });
  }, [party.id]);

  async function handleAdd() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await khatabookService.addEntry(party.id, { kind, amount: amt, note });
      const updated = await khatabookService.getEntries(party.id);
      setEntries(updated);
      const delta = kind === "GAVE" ? amt : -amt;
      setLocalParty(p => ({
        ...p,
        balance: p.balance + delta,
        totalGave: kind === "GAVE" ? p.totalGave + amt : p.totalGave,
        totalGot: kind === "GOT" ? p.totalGot + amt : p.totalGot,
      }));
      setAmount(""); setNote(""); setShowAdd(false);
    } catch {
      // optimistic update on API error
      const delta = kind === "GAVE" ? amt : -amt;
      setLocalParty(p => ({ ...p, balance: p.balance + delta }));
      setEntries(e => [{ id: Date.now(), partyId: party.id, kind, amount: amt, note, entryDate: new Date().toISOString().split("T")[0], hasReceipt: false }, ...e]);
      setAmount(""); setNote(""); setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp() {
    if (!localParty.phone) return;
    const msg = localParty.balance > 0
      ? `Hi ${localParty.name}, you have an outstanding payment of ${fmt(localParty.balance)} with us. Please settle at your earliest convenience.`
      : `Hi ${localParty.name}, please confirm receipt of ${fmt(Math.abs(localParty.balance))}.`;
    window.open(`https://wa.me/91${localParty.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const isReceivable = localParty.balance > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* header */}
        <div className={`px-5 pt-5 pb-4 rounded-t-3xl sm:rounded-t-2xl ${isReceivable ? "bg-emerald-50" : localParty.balance < 0 ? "bg-red-50" : "bg-gray-50"}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: isReceivable ? "#00C29A" : "#EB5B5B" }}
              >
                {initials(localParty.name)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{localParty.name}</h2>
                <div className="text-xs text-gray-400">{PARTY_TYPE_LABELS[localParty.partyType]}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl mt-1">✕</button>
          </div>
          {localParty.balance !== 0 && (
            <div className="mt-3 text-center">
              <div className={`text-3xl font-extrabold ${isReceivable ? "text-emerald-600" : "text-red-500"}`}>
                {fmt(localParty.balance)}
              </div>
              <div className={`text-sm ${isReceivable ? "text-emerald-500" : "text-red-400"}`}>
                {isReceivable ? (isPersonal ? "they owe you" : "will get") : (isPersonal ? "you owe them" : "will give")}
              </div>
            </div>
          )}
          {localParty.balance === 0 && <div className="mt-3 text-center text-gray-400 text-sm font-medium">All settled ✓</div>}
        </div>

        {/* entries */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div>
          ) : (
            entries.map(e => <EntryRow key={e.id} entry={e} isPersonal={isPersonal} />)
          )}
        </div>

        {/* add entry */}
        {showAdd && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
            <div className="flex gap-2 mb-3">
              {(["GAVE", "GOT"] as TransactionKind[]).map(k => (
                <button key={k} onClick={() => setKind(k)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${kind === k ? (k === "GAVE" ? "bg-red-50 border-red-400 text-red-600" : "bg-emerald-50 border-emerald-400 text-emerald-600") : "bg-white border-gray-200 text-gray-500"}`}>
                  {isPersonal ? (k === "GAVE" ? "I Gave" : "I Got") : (k === "GAVE" ? "You Gave" : "You Got")}
                </button>
              ))}
            </div>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 h-12 gap-2 focus-within:border-emerald-400 mb-2 bg-white">
              <span className="text-gray-400 font-bold text-lg">₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="flex-1 outline-none font-bold text-lg text-gray-900 bg-transparent" />
            </div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 mb-3 bg-white" />
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500">Cancel</button>
              <button onClick={handleAdd} disabled={!amount || saving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-40">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* bottom actions */}
        {!showAdd && (
          <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-gray-100">
            {localParty.phone && (
              <button onClick={openWhatsApp} className="flex-1 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                <span>💬</span> Remind
              </button>
            )}
            <button onClick={() => { setKind("GAVE"); setShowAdd(true); }} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">
              {isPersonal ? "I Gave" : "You Gave"}
            </button>
            <button onClick={() => { setKind("GOT"); setShowAdd(true); }} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm">
              {isPersonal ? "I Got" : "You Got"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── add party modal ───────────────────────────────────────────────────────────

function AddPartyModal({
  isPersonal, onClose, onSaved,
}: { isPersonal: boolean; onClose: () => void; onSaved: (p: KhataParty) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partyType, setPartyType] = useState<PartyType>(isPersonal ? "FRIEND" : "CUSTOMER");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const fn = isPersonal ? khatabookService.addPersonalParty : khatabookService.addVendorParty;
      const party = await fn({ name: name.trim(), phone: phone.trim() || undefined, partyType, notes: notes.trim() || undefined });
      onSaved(party);
    } catch {
      onSaved({ id: Date.now(), name: name.trim(), phone: phone.trim() || undefined, khataType: isPersonal ? "PERSONAL" : "VENDOR", partyType, balance: 0, totalGave: 0, totalGot: 0 });
    } finally {
      setSaving(false);
    }
  }

  const partyTypes: PartyType[] = isPersonal ? ["FRIEND", "FAMILY"] : ["CUSTOMER", "SUPPLIER"];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Add {isPersonal ? "Person" : "Party"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-emerald-400" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (for WhatsApp reminders)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-emerald-400" maxLength={10} />
          <div className="flex gap-2">
            {partyTypes.map(t => (
              <button key={t} onClick={() => setPartyType(t)}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${partyType === t ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}`}>
                {PARTY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-emerald-400" />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-40">
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function KhataBook() {
  const [tab, setTab] = useState<"vendor" | "personal">("vendor");
  const [parties, setParties] = useState<KhataParty[]>([]);
  const [stats, setStats] = useState<KhataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<KhataParty | null>(null);
  const [showAddParty, setShowAddParty] = useState(false);
  const [filter, setFilter] = useState<"all" | "receivable" | "payable">("all");

  const isPersonal = tab === "personal";

  const load = useCallback(async () => {
    setLoading(true);
    const [p, s] = await Promise.all([
      isPersonal ? khatabookService.getPersonalParties() : khatabookService.getVendorParties(),
      isPersonal ? khatabookService.getPersonalStats() : khatabookService.getVendorStats(),
    ]);
    setParties(p);
    setStats(s);
    setLoading(false);
  }, [isPersonal]);

  useEffect(() => { load(); }, [load]);

  const filtered = parties
    .filter(p => filter === "all" || (filter === "receivable" && p.balance > 0) || (filter === "payable" && p.balance < 0))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-emerald-600 text-white px-4 py-5">
        <h1 className="text-xl font-extrabold mb-1">📒 Khatabook</h1>
        <p className="text-emerald-200 text-sm">Digital ledger for vendor credit & personal udhaar</p>
      </div>

      {/* tabs */}
      <div className="flex bg-white border-b sticky top-0 z-10">
        {(["vendor", "personal"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setFilter("all"); }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400"}`}>
            {t === "vendor" ? "📦 My Khata" : "🤝 Udhaar"}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* stats banner */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-2 divide-x divide-gray-100">
            <StatBadge label={isPersonal ? "They Owe" : "Will Get"} value={stats.totalReceivable} colorClass="text-emerald-600" />
            <StatBadge label={isPersonal ? "You Owe" : "Will Give"} value={stats.totalPayable} colorClass="text-red-500" />
            <StatBadge label="Net" value={stats.netBalance} colorClass={stats.netBalance >= 0 ? "text-emerald-600" : "text-red-500"} />
          </div>
        )}

        {/* filter pills */}
        <div className="flex gap-2">
          {(["all", "receivable", "payable"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200"}`}>
              {f === "all" ? "All" : f === "receivable" ? "Will Get" : "Will Give"}
            </button>
          ))}
          <button onClick={() => setShowAddParty(true)}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
            + Add
          </button>
        </div>

        {/* party list */}
        {loading ? (
          <div className="flex justify-center pt-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-16">
            <div className="text-5xl mb-4">📒</div>
            <h3 className="font-bold text-gray-900 mb-2">No entries yet</h3>
            <p className="text-gray-400 text-sm mb-4">Add your first party to start tracking</p>
            <button onClick={() => setShowAddParty(true)} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">+ Add Party</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <PartyCard key={p.id} party={p} onClick={() => setSelectedParty(p)} />
            ))}
          </div>
        )}
      </div>

      {selectedParty && (
        <PartyDetail
          party={selectedParty}
          isPersonal={isPersonal}
          onClose={() => setSelectedParty(null)}
        />
      )}

      {showAddParty && (
        <AddPartyModal
          isPersonal={isPersonal}
          onClose={() => setShowAddParty(false)}
          onSaved={p => { setParties(prev => [p, ...prev]); setShowAddParty(false); }}
        />
      )}
    </div>
  );
}
