import React, { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { splitBillService, type SplitBill, type SplitType } from "../../services/finance/splitBillService";
import { showSuccess, showError } from "../../utils/ToastUtils";

const CATEGORY_ICONS: Record<string, string> = { MAINTENANCE: "🏠", EVENT: "🎉", UTILITY: "⚡", FOOD: "🍽️", OTHER: "💸" };
const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  PARTIALLY_SETTLED: "bg-amber-50 text-amber-700",
  SETTLED: "bg-green-50 text-green-700",
};
const MEMBER_STYLE: Record<string, string> = {
  PAID: "bg-green-50 text-green-700", PENDING: "bg-amber-50 text-amber-700", DECLINED: "bg-red-50 text-red-600",
};

export function SplitBillPortal() {
  const [tab, setTab] = useState<"my-splits" | "create">("my-splits");
  const [splits, setSplits] = useState<SplitBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmt, setTotalAmt] = useState("");
  const [members, setMembers] = useState([{ name: "", flat: "", share: "" }, { name: "", flat: "", share: "" }]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadSplits(); }, []);

  async function loadSplits() {
    setLoading(true);
    try { setSplits(await splitBillService.getSplits()); } finally { setLoading(false); }
  }

  function handleAutoSplit() {
    const total = parseFloat(totalAmt);
    if (!total || members.length === 0) return;
    const per = Math.round((total / members.length) * 100) / 100;
    setMembers(prev => prev.map(m => ({ ...m, share: String(per) })));
  }

  async function handleCreate() {
    if (!title.trim()) { showError("Enter a title."); return; }
    const total = parseFloat(totalAmt);
    if (!total || total <= 0) { showError("Enter total amount."); return; }
    const valid = members.filter(m => m.name.trim() && parseFloat(m.share) > 0);
    if (valid.length < 2) { showError("Add at least 2 members with amounts."); return; }
    const shareSum = valid.reduce((s, m) => s + parseFloat(m.share), 0);
    if (Math.abs(shareSum - total) > 1) { showError(`Shares (₹${shareSum}) don't add up to total (₹${total}). Use Split Equally.`); return; }
    setCreating(true);
    try {
      await splitBillService.createSplit({ title: title.trim(), total_amount: total, split_type: "CUSTOM", members: valid.map((m, i) => ({ user_id: `m-${i}`, name: m.name.trim(), flat: m.flat.trim() || undefined, share_amount: parseFloat(m.share) })), category: "OTHER" });
      showSuccess("Split created!"); setTab("my-splits"); setTitle(""); setTotalAmt(""); setMembers([{ name: "", flat: "", share: "" }, { name: "", flat: "", share: "" }]); loadSplits();
    } catch { showError("Could not create split."); } finally { setCreating(false); }
  }

  async function handleSettle(split: SplitBill, member: SplitBill["members"][0]) {
    if (!window.confirm(`Pay ₹${member.share_amount.toLocaleString()} to settle ${member.name}'s share?`)) return;
    try {
      const result = await splitBillService.settle(split.id, member.user_id, member.share_amount, member.name);
      window.open(result.phone_pe_url, "_blank");
      showSuccess("Payment opened in UPI app.");
      loadSplits();
    } catch { showError("Payment initiation failed."); }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-[#44475B]">Split Bill</h1><p className="text-xs text-[#7C7E8C]">Split expenses among residents · UPI settlement</p></div>
        <button onClick={loadSplits} className="p-2 rounded-lg border border-[#E8E9F0] hover:bg-[#F5F5F7]"><RefreshCw size={14} className={loading ? "animate-spin text-[#7C7E8C]" : "text-[#7C7E8C]"} /></button>
      </div>

      <div className="flex border-b border-[#E8E9F0]">
        <button onClick={() => setTab("my-splits")} className={`flex-1 py-2.5 text-sm font-semibold ${tab === "my-splits" ? "border-b-2 border-green-600 text-green-700" : "text-[#7C7E8C]"}`}>My Splits</button>
        <button onClick={() => setTab("create")} className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1 ${tab === "create" ? "border-b-2 border-green-600 text-green-700" : "text-[#7C7E8C]"}`}><Plus size={13} /> Create Split</button>
      </div>

      {tab === "my-splits" && (
        loading ? <div className="text-center py-12 text-[#7C7E8C] text-sm">Loading splits…</div> :
        splits.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <p className="text-4xl">💸</p>
            <p className="font-bold text-[#44475B]">No splits yet</p>
            <p className="text-sm text-[#7C7E8C]">Create a split to share expenses with other residents.</p>
            <button onClick={() => setTab("create")} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700">Create Split</button>
          </div>
        ) : (
          <div className="space-y-4">
            {splits.map(split => (
              <div key={split.id} className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[split.category] ?? "💸"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#44475B]">{split.title}</p>
                    <p className="text-xs text-[#7C7E8C] mt-0.5">by {split.created_by_name} · {new Date(split.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[split.status]}`}>{split.status.replace("_", " ")}</span>
                </div>
                <div className="grid grid-cols-3 bg-[#F5F5F7] rounded-xl p-3">
                  {[["Total", `₹${split.total_amount.toLocaleString()}`], ["Settled", `₹${split.settled_amount.toLocaleString()}`], ["Pending", `₹${split.pending_amount.toLocaleString()}`]].map(([l, v], i) => (
                    <div key={l as string} className="text-center"><p className="text-[10px] text-[#7C7E8C]">{l as string}</p><p className={`text-sm font-bold mt-0.5 ${i === 1 ? "text-green-700" : i === 2 ? "text-red-600" : "text-[#44475B]"}`}>{v as string}</p></div>
                  ))}
                </div>
                <div className="divide-y divide-[#F0F0F5]">
                  {split.members.map(m => (
                    <div key={m.user_id} className="flex items-center gap-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">{m.name[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#44475B] truncate">{m.name}{m.flat ? ` (${m.flat})` : ""}</p>
                      </div>
                      <p className="text-xs font-bold text-[#44475B]">₹{m.share_amount.toLocaleString()}</p>
                      {m.status === "PENDING"
                        ? <button onClick={() => handleSettle(split, m)} className="px-2.5 py-1 rounded-lg bg-green-600 text-[10px] font-bold text-white hover:bg-green-700 flex-shrink-0">Pay</button>
                        : <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${MEMBER_STYLE[m.status]}`}>{m.status}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "create" && (
        <div className="bg-white border border-[#E8E9F0] rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-[#44475B]">New Split</p>
          <div>
            <p className="text-xs font-semibold text-[#7C7E8C] mb-1.5">Title</p>
            <input className="w-full border border-[#E8E9F0] rounded-xl px-3 h-11 text-sm text-[#44475B] outline-none focus:border-green-400" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Day Decoration" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#7C7E8C] mb-1.5">Total Amount (₹)</p>
            <div className="flex items-center border border-[#E8E9F0] rounded-xl px-3 h-11 gap-2">
              <span className="text-[#7C7E8C] font-semibold">₹</span>
              <input type="number" className="flex-1 text-base font-bold text-[#44475B] outline-none bg-transparent" value={totalAmt} onChange={e => setTotalAmt(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#7C7E8C]">Members</p>
              <button onClick={handleAutoSplit} className="text-xs font-bold text-green-600 hover:text-green-700">Split Equally</button>
            </div>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                  <input className="border border-[#E8E9F0] rounded-lg px-2.5 h-9 text-xs text-[#44475B] outline-none focus:border-green-400" value={m.name} placeholder="Name" onChange={e => setMembers(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input className="border border-[#E8E9F0] rounded-lg px-2.5 h-9 text-xs text-[#44475B] outline-none focus:border-green-400" value={m.flat} placeholder="Flat" onChange={e => setMembers(p => p.map((x, j) => j === i ? { ...x, flat: e.target.value } : x))} />
                  <div className="flex items-center border border-[#E8E9F0] rounded-lg px-2 h-9 gap-1">
                    <span className="text-[#7C7E8C] text-xs">₹</span>
                    <input type="number" className="flex-1 text-xs font-bold text-[#44475B] outline-none bg-transparent" value={m.share} placeholder="Share" onChange={e => setMembers(p => p.map((x, j) => j === i ? { ...x, share: e.target.value } : x))} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setMembers(p => [...p, { name: "", flat: "", share: "" }])} className="flex items-center gap-1.5 mt-2 text-xs font-bold text-green-600 hover:text-green-700">
              <Plus size={13} /> Add Member
            </button>
          </div>
          <button onClick={handleCreate} disabled={creating || !title.trim() || !totalAmt}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-green-700 transition-colors">
            {creating ? "Creating…" : `Create Split · ₹${totalAmt || "0"}`}
          </button>
        </div>
      )}
    </div>
  );
}
