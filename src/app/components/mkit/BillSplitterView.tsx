import { useState } from "react";
import { Users, Receipt, Copy, Check, Share2, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { calculateBillSplit } from "../../../utils/mkitCalculators";
import { useNavigate } from "react-router";

export function BillSplitterView() {
  const navigate = useNavigate();
  const [billAmount, setBillAmount] = useState<number>(3600);
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [taxPercent, setTaxPercent] = useState<number>(5);
  const [peopleCount, setPeopleCount] = useState<number>(4);
  const [roundUp, setRoundUp] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Custom Split Members
  const [isCustomSplit, setIsCustomSplit] = useState<boolean>(false);
  const [members, setMembers] = useState<{ id: string; name: string; customShare: number }[]>([
    { id: "1", name: "You", customShare: 1200 },
    { id: "2", name: "Rahul", customShare: 800 },
    { id: "3", name: "Priya", customShare: 800 },
    { id: "4", name: "Ankit", customShare: 800 },
  ]);

  const splitResult = calculateBillSplit({
    billAmount,
    tipPercent,
    taxPercent,
    passengersOrPeopleCount: peopleCount,
    roundUp,
    customMembers: isCustomSplit ? members : undefined,
  });

  const tipOptions = [0, 5, 10, 15, 20];
  const taxOptions = [0, 5, 12, 18];

  const handleCopy = () => {
    navigator.clipboard.writeText(splitResult.shareableSummary);
    setCopied(true);
    toast.success("Bill breakdown copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(splitResult.shareableSummary)}`;
    window.open(url, "_blank");
  };

  const addMember = () => {
    const newId = String(Date.now());
    setMembers([...members, { id: newId, name: `Member ${members.length + 1}`, customShare: 0 }]);
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, field: "name" | "customShare", value: string | number) => {
    setMembers(
      members.map((m) => {
        if (m.id !== id) return m;
        return { ...m, [field]: value };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Bill & Gratuity Details
            </h3>

            {/* Equal vs Custom Split Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setIsCustomSplit(false)}
                className={`px-3 py-1.5 rounded-md transition ${
                  !isCustomSplit ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Equal Split
              </button>
              <button
                onClick={() => setIsCustomSplit(true)}
                className={`px-3 py-1.5 rounded-md transition ${
                  isCustomSplit ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Custom Split
              </button>
            </div>
          </div>

          {/* Bill Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">Total Bill Subtotal (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                value={billAmount}
                onChange={(e) => setBillAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tip Chips */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-600">Tip / Gratuity</span>
              <span className="text-indigo-600 font-semibold">{tipPercent}% (₹{splitResult.tipAmount})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tipOptions.map((tip) => (
                <button
                  key={tip}
                  onClick={() => setTipPercent(tip)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    tipPercent === tip
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tip === 0 ? "No Tip" : `${tip}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Tax / GST Chips */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-600">Tax / GST</span>
              <span className="text-indigo-600 font-semibold">{taxPercent}% (₹{splitResult.taxAmount})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {taxOptions.map((tax) => (
                <button
                  key={tax}
                  onClick={() => setTaxPercent(tax)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    taxPercent === tax
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tax === 0 ? "No Tax" : `${tax}% GST`}
                </button>
              ))}
            </div>
          </div>

          {!isCustomSplit ? (
            /* Equal Split People Counter */
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Number of People</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                  {peopleCount} People
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1</span>
                <span>12</span>
                <span>25</span>
              </div>
            </div>
          ) : (
            /* Custom Member Itemized Inputs */
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Custom Group Members</span>
                <button
                  onClick={addMember}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMember(m.id, "name", e.target.value)}
                      placeholder="Name"
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={m.customShare || ""}
                        onChange={(e) => updateMember(m.id, "customShare", Number(e.target.value))}
                        placeholder="Share"
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round Up Toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600">Round up to nearest whole rupee</span>
          </label>
        </div>

        {/* Right Breakdown & Share Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Grand Total Payable</p>
              <h2 className="text-4xl font-extrabold text-white mt-1">
                ₹{splitResult.grandTotal}
              </h2>
              <div className="flex gap-3 text-xs text-indigo-300 mt-1">
                <span>Base: ₹{splitResult.baseAmount}</span>
                {splitResult.tipAmount > 0 && <span>• Tip: ₹{splitResult.tipAmount}</span>}
                {splitResult.taxAmount > 0 && <span>• Tax: ₹{splitResult.taxAmount}</span>}
              </div>
            </div>

            {/* Split Highlight Card */}
            {!isCustomSplit ? (
              <div className="bg-indigo-600/30 border border-indigo-400/30 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-indigo-200">Equal Share Per Person</p>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="text-3xl font-black text-white">
                    ₹{splitResult.equalSplitPerPerson}
                  </h3>
                  <span className="text-xs text-indigo-200 font-medium">
                    for {peopleCount} people
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-1">Itemized Shares</p>
                {splitResult.members.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-200">{m.name}</span>
                    <span className="font-bold text-amber-300">₹{m.amount}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Receipt"}
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp Share
              </button>
            </div>
          </div>

          {/* Mana Circle Link */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => navigate("/social")}
              className="w-full text-xs text-indigo-200 hover:text-white flex items-center justify-between group transition"
            >
              <span>Split directly in a Mana Circle group?</span>
              <span className="font-semibold text-white flex items-center gap-1 group-hover:underline">
                Go to Circles <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
