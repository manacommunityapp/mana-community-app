import { useState } from "react";
import {
  FolderLock, FileText, Download, ShieldCheck,
  Search, Filter, Calendar, ExternalLink, Hash, CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";

interface VaultDoc {
  id: string;
  title: string;
  category: "MINUTES" | "BUDGET_REPORT" | "BYE_LAW" | "RESOLUTION" | "POLICY";
  year: string;
  date: string;
  size: string;
  hash: string;
  uploader: string;
}

const MOCK_DOCS: VaultDoc[] = [
  {
    id: "1",
    title: "Annual Audited Financial Accounts & Balance Sheet (FY 2025-26)",
    category: "BUDGET_REPORT",
    year: "2026",
    date: "10 Aug 2026",
    size: "2.4 MB",
    hash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    uploader: "Treasurer / Priya M.",
  },
  {
    id: "2",
    title: "Official Minutes of the Annual General Body Meeting (AGM 2025)",
    category: "MINUTES",
    year: "2025",
    date: "25 Oct 2025",
    size: "1.2 MB",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    uploader: "Secretary / Rahul V.",
  },
  {
    id: "3",
    title: "Community Registered Bye-Laws & Code of Conduct (Amended 2025)",
    category: "BYE_LAW",
    year: "2025",
    date: "15 Jan 2025",
    size: "3.1 MB",
    hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    uploader: "President / Sandeep K.",
  },
  {
    id: "4",
    title: "Resolution RES-2026-0042: EV Fast-Charging Infrastructure Charter",
    category: "RESOLUTION",
    year: "2026",
    date: "15 Oct 2026",
    size: "640 KB",
    hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    uploader: "President / Sandeep K.",
  },
];

export function DigitalVault() {
  const [docs] = useState<VaultDoc[]>(MOCK_DOCS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filtered = docs.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || d.hash.toLowerCase().includes(q);
    const matchCat = selectedCategory === "ALL" || d.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleDownload = (doc: VaultDoc) => {
    toast.success(`Downloading verified official document: ${doc.title}`);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-indigo-600" /> Digital Records & Institutional Vault
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable repository of all verified community minutes, bye-laws, financial audits, and signed resolutions.
          </p>
        </div>
      </div>

      {/* ── Search & Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title or SHA-256 hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {["ALL", "MINUTES", "BUDGET_REPORT", "BYE_LAW", "RESOLUTION"].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {c.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Documents Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg">
                  {doc.category.replace(/_/g, " ")} · {doc.year}
                </span>
                <span className="text-[10px] text-slate-400">{doc.date}</span>
              </div>

              <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug">{doc.title}</h3>
              <p className="text-[11px] text-slate-500">Uploaded by: {doc.uploader} · Size: {doc.size}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-slate-50 dark:bg-[#262644] rounded-xl text-[10px] flex items-center justify-between font-mono text-slate-500">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-indigo-500" /> {doc.hash.substring(0, 20)}...</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Verified</span>
              </div>

              <button
                onClick={() => handleDownload(doc)}
                className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Verified Record
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
