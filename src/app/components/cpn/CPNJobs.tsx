import { useState } from "react";
import {
  Search, SlidersHorizontal, Briefcase, MapPin, Clock, DollarSign,
  Building2, Bookmark, BookmarkCheck, Zap,
  Star, Users, CheckCircle, Share2,
  ChevronRight, ExternalLink, FileText, Send, Award, TrendingUp
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  skills: string[];
  postedBy: string;
  postedAt: string;
  isReferral: boolean;
  isCommunity: boolean;
  isEasyApply: boolean;
  isHot: boolean;
  applicants: number;
  matchScore: number;
  saved: boolean;
  applied: boolean;
  description: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: 1, title: "Senior React Developer", company: "TechNova India", logo: "TN",
    location: "Hybrid · Bangalore", type: "Full-Time", salary: "₹22L – ₹32L",
    experience: "4–7 yrs", skills: ["React", "TypeScript", "Node.js", "AWS"],
    postedBy: "Vikram Rao · Villa 8", postedAt: "2 days ago",
    isReferral: true, isCommunity: true, isEasyApply: true, isHot: true,
    applicants: 34, matchScore: 91, saved: false, applied: false,
    description: "We're looking for a Senior React Developer to join our fast-growing product team. You'll architect scalable front-end systems and mentor junior developers.",
  },
  {
    id: 2, title: "Product Marketing Manager", company: "GrowthX", logo: "GX",
    location: "Remote", type: "Full-Time", salary: "₹18L – ₹24L",
    experience: "3–6 yrs", skills: ["Product Marketing", "GTM", "SaaS", "Analytics"],
    postedBy: "Neha Singh · A-201", postedAt: "4 days ago",
    isReferral: true, isCommunity: true, isEasyApply: false, isHot: false,
    applicants: 19, matchScore: 74, saved: true, applied: false,
    description: "Lead product marketing strategy for our B2B SaaS platform. Own GTM execution, competitor analysis, and work closely with sales.",
  },
  {
    id: 3, title: "Data Scientist", company: "Flipkart", logo: "FK",
    location: "On-site · Bangalore", type: "Full-Time", salary: "₹30L – ₹45L",
    experience: "2–5 yrs", skills: ["Python", "ML", "TensorFlow", "SQL"],
    postedBy: "Community Admin", postedAt: "1 week ago",
    isReferral: false, isCommunity: false, isEasyApply: true, isHot: true,
    applicants: 127, matchScore: 62, saved: false, applied: true,
    description: "Join Flipkart's data science team to build recommendation systems that serve 300M+ customers across India.",
  },
  {
    id: 4, title: "UI/UX Designer", company: "Razorpay", logo: "RP",
    location: "Hybrid · Bangalore", type: "Full-Time", salary: "₹15L – ₹22L",
    experience: "2–4 yrs", skills: ["Figma", "User Research", "Design Systems", "Prototyping"],
    postedBy: "Ananya K · B-102", postedAt: "3 days ago",
    isReferral: true, isCommunity: true, isEasyApply: true, isHot: false,
    applicants: 52, matchScore: 55, saved: false, applied: false,
    description: "Shape the future of fintech payments with beautiful, intuitive designs.",
  },
];

function MatchBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
    : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
    : "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      ✨ {score}% match
    </span>
  );
}

function JobCard({ job, isSelected, onClick, onSave, onApply }: { job: Job; isSelected: boolean; onClick: (job: Job) => void; onSave: (id: number) => void; onApply: (id: number) => void }) {
  return (
    <div
      onClick={() => onClick(job)}
      className={`bg-white dark:bg-[#1E1E36] border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-indigo-500 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-900" : "border-slate-200 dark:border-slate-800 hover:border-slate-350"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {job.logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{job.title}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{job.company}
                {job.isCommunity && <span className="ml-1 text-indigo-600 dark:text-indigo-400">✓</span>}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
              className={job.saved ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}
            >
              {job.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-2">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-500" />{job.location}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" />{job.salary}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" />{job.postedAt}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              job.type === "Full-Time" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}>{job.type}</span>
            {job.isReferral && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 font-bold">Referral</span>}
            {job.isCommunity && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 font-bold">Community</span>}
            {job.isEasyApply && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-bold flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Easy Apply</span>}
            {job.isHot && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 font-bold">🔥 Hot</span>}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <MatchBadge score={job.matchScore} />
            <span className="text-[10px] text-slate-400">{job.applicants} applicants</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobDetailPanel({ job, onClose, onApply, onSave }: { job: Job | null; onClose: () => void; onApply: (id: number) => void; onSave: (id: number) => void }) {
  if (!job) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
        <Briefcase className="w-12 h-12 text-slate-350 mb-3" />
        <p className="text-slate-600 dark:text-slate-400 font-bold text-xs">Select a job to view details</p>
        <p className="text-slate-450 text-[10px] mt-1">Click any job card from the list to display details</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden h-full flex flex-col shadow-xs">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-[#262644] dark:to-[#2e2e54] p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
            {job.logo}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">{job.title}</h2>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-xs">{job.company}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-500" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" />{job.postedAt}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSave(job.id)} className={job.saved ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}>
              {job.saved ? <BookmarkCheck className="w-5 h-5 text-indigo-600" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button className="text-slate-400 hover:text-slate-600"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Salary", value: job.salary, icon: DollarSign },
            { label: "Experience", value: job.experience, icon: Star },
            { label: "Applicants", value: job.applicants, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-[#1E1E36] rounded-xl p-2.5 text-center border border-slate-100 dark:border-slate-800">
              <Icon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <div className="text-xs font-black text-slate-900 dark:text-white">{value}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 rounded-xl">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <span>AI Match Score</span>
              <span>{job.matchScore}%</span>
            </div>
            <div className="h-1.5 bg-emerald-200 dark:bg-emerald-950/60 rounded-full mt-1.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${job.matchScore}%` }}
              />
            </div>
          </div>
        </div>

        {job.isCommunity && job.postedBy && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Posted by community neighbor: <strong>{job.postedBy}</strong></span>
          </div>
        )}

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">About the Role</h4>
          <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed">{job.description}</p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200/60 dark:border-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
        {job.applied ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-450 rounded-xl text-xs font-bold">
            <CheckCircle className="w-4 h-4" /> Applied
          </div>
        ) : (
          <>
            {job.isEasyApply ? (
              <button
                onClick={() => onApply(job.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Easy Apply
              </button>
            ) : (
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                <ExternalLink className="w-4 h-4" /> Apply on Site
              </button>
            )}
            {job.isReferral && (
              <button className="flex items-center gap-2 px-4 py-2.5 border border-violet-300 dark:border-violet-800 text-violet-750 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl text-xs font-bold transition-all cursor-pointer">
                <Send className="w-4 h-4" /> Ask Referral
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function CPNJobs() {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { key: "all", label: "All Jobs", count: jobs.length },
    { key: "community", label: "Community Jobs", count: jobs.filter(j => j.isCommunity).length },
    { key: "referral", label: "Referrals", count: jobs.filter(j => j.isReferral).length },
    { key: "saved", label: "Saved", count: jobs.filter(j => j.saved).length },
    { key: "applied", label: "Applied", count: jobs.filter(j => j.applied).length },
  ];

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q));
    const matchesTab = activeTab === "all" || (activeTab === "community" && j.isCommunity) || (activeTab === "referral" && j.isReferral) || (activeTab === "saved" && j.saved) || (activeTab === "applied" && j.applied);
    return matchesSearch && matchesTab;
  });

  const handleSave = (id: number) => setJobs(prev => prev.map(j => j.id === id ? { ...j, saved: !j.saved } : j));
  const handleApply = (id: number) => setJobs(prev => prev.map(j => j.id === id ? { ...j, applied: true } : j));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Briefcase, value: "42", label: "Active Jobs", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
          { icon: Share2,    value: "18", label: "Referrals",   color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" },
          { icon: Building2, value: "156", label: "Companies",  color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-950 dark:text-white placeholder-slate-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300"}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white border border-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer">
          <FileText className="w-4 h-4" />
          Post Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#262644] p-1 rounded-xl overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key ? "bg-white dark:bg-[#1E1E36] text-indigo-700 dark:text-indigo-400 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: 500 }}>
        {/* Left: Job List */}
        <div className="lg:col-span-2 space-y-3 overflow-y-auto" style={{ maxHeight: 680 }}>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No jobs match your search</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id} job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={setSelectedJob}
                onSave={handleSave}
                onApply={handleApply}
              />
            ))
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-3" style={{ minHeight: 400 }}>
          <JobDetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onSave={handleSave}
            onApply={handleApply}
          />
        </div>
      </div>
    </div>
  );
}
