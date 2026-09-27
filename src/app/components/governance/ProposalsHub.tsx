import { useState } from "react";
import {
  FileCheck, Plus, ThumbsUp, Sparkles, Filter,
  Building2, Shield, Wrench, IndianRupee, Trees,
  CheckCircle2, Clock, AlertCircle, X, Check
} from "lucide-react";
import { toast } from "react-toastify";

interface Proposal {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedCost: string;
  fundingSource: string;
  submittedBy: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED_FOR_AGENDA" | "VOTING" | "RESOLVED";
  upvotes: number;
  hasUpvoted: boolean;
  notes?: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "1",
    title: "Install 12 Dedicated EV Fast-Charging Points in Basement Parking",
    category: "INFRASTRUCTURE",
    description: "Installation of 12 shared AC/DC fast chargers across Basements 1 & 2 with smart load balancing, RFID tag access, and automated billing integrated into monthly maintenance accounts.",
    estimatedCost: "₹8,50,000",
    fundingSource: "Community Sinking Fund (70%) + Vendor Subsidy (30%)",
    submittedBy: "Sandeep Kumar · B-402",
    status: "APPROVED_FOR_AGENDA",
    upvotes: 142,
    hasUpvoted: true,
    notes: "Feasibility verified with BESCOM load approval. Placed on AGM 2026 agenda for voting.",
  },
  {
    id: "2",
    title: "Complete Solar Rooftop Photovoltaic Grid (100 kWp)",
    category: "ENVIRONMENT",
    description: "Install rooftop solar panels across Towers A, B, and C to offset 65% of common area lighting, lifts, and water pumping energy costs with estimated 3.2 year payback period.",
    estimatedCost: "₹14,00,000",
    fundingSource: "Special Green Assessment & State Subsidy",
    submittedBy: "Dr. Anita Sen · A-701",
    status: "UNDER_REVIEW",
    upvotes: 89,
    hasUpvoted: false,
    notes: "Technical evaluation under review with Tata Solar and Loom Solar.",
  },
  {
    id: "3",
    title: "Clubhouse Gym Equipment Upgrade & Acoustic Flooring",
    category: "AMENITIES",
    description: "Replace aging multi-gym station, add 2 commercial treadmills, and install rubber acoustic tiles to prevent noise transfer to ground floor apartments.",
    estimatedCost: "₹3,20,000",
    fundingSource: "Amenity Maintenance Reserve",
    submittedBy: "Arjun Mehta · C-104",
    status: "SUBMITTED",
    upvotes: 54,
    hasUpvoted: false,
  },
];

export function ProposalsHub() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("INFRASTRUCTURE");
  const [newDescription, setNewDescription] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newFunding, setNewFunding] = useState("Community Sinking Fund");

  const filtered = proposals.filter(p => activeCategory === "ALL" || p.category === activeCategory);

  const handleUpvote = (id: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        const nextUpvoted = !p.hasUpvoted;
        return {
          ...p,
          hasUpvoted: nextUpvoted,
          upvotes: nextUpvoted ? p.upvotes + 1 : p.upvotes - 1,
        };
      }
      return p;
    }));
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newProp: Proposal = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      description: newDescription,
      estimatedCost: newCost ? `₹${Number(newCost).toLocaleString("en-IN")}` : "TBD",
      fundingSource: newFunding,
      submittedBy: "Sandeep Kumar · B-402",
      status: "SUBMITTED",
      upvotes: 1,
      hasUpvoted: true,
    };

    setProposals([newProp, ...proposals]);
    setModalOpen(false);
    setNewTitle("");
    setNewDescription("");
    setNewCost("");
    toast.success("Community proposal submitted successfully for committee review!");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" /> Community Proposal Submissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified residents can propose community improvements, gather neighbor upvotes, and table items for AGM voting.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Submit New Proposal
        </button>
      </div>

      {/* ── Categories Filter Pills ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          { key: "ALL", label: "All Proposals" },
          { key: "INFRASTRUCTURE", label: "🏗️ Infrastructure" },
          { key: "ENVIRONMENT", label: "🌿 Solar & Green" },
          { key: "AMENITIES", label: "🏊 Amenities & Sports" },
          { key: "SECURITY", label: "🛡️ Security & Access" },
          { key: "FINANCE", label: "💰 Budget & Tariff" },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.key
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Proposals List ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filtered.map((prop) => (
          <div
            key={prop.id}
            className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-lg transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {prop.category}
                  </span>
                  <span className="text-[11px] text-slate-400">Submitted by: <strong>{prop.submittedBy}</strong></span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{prop.title}</h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                  prop.status === "APPROVED_FOR_AGENDA"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                    : prop.status === "UNDER_REVIEW"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200"
                }`}>
                  {prop.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{prop.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Estimated Cost:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{prop.estimatedCost}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Funding Source:</span>
                <strong className="text-slate-900 dark:text-white text-xs">{prop.fundingSource}</strong>
              </div>
            </div>

            {prop.notes && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span><strong>Committee Note:</strong> {prop.notes}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleUpvote(prop.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  prop.hasUpvoted
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> {prop.upvotes} Neighbor Upvotes
              </button>

              <span className="text-[10px] text-slate-400">Requires 50+ upvotes for mandatory committee review</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Submit Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" /> Submit Community Proposal
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Install CCTV in Tower C Stairwells"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="INFRASTRUCTURE">🏗️ Infrastructure</option>
                    <option value="ENVIRONMENT">🌿 Environment / Solar</option>
                    <option value="AMENITIES">🏊 Amenities & Sports</option>
                    <option value="SECURITY">🛡️ Security & Access</option>
                    <option value="FINANCE">💰 Finance & Tariffs</option>
                    <option value="POLICY">📜 Community Policy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Funding Recommendation</label>
                <select
                  value={newFunding}
                  onChange={(e) => setNewFunding(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="Community Sinking Fund">Community Sinking Fund</option>
                  <option value="Amenity Maintenance Reserve">Amenity Maintenance Reserve</option>
                  <option value="Special One-Time Assessment">Special One-Time Assessment</option>
                  <option value="Vendor Sponsored / CSR">Vendor Sponsored / CSR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description & Benefits</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this proposal is needed, how it benefits residents, and operational details..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
