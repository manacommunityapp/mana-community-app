import {
  Briefcase, Building2, MapPin, DollarSign, Clock, Users, Plus, X,
  Loader2, Search, ChevronDown, ArrowUpRight, CheckCircle, Send
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { jobService, type JobResponse, type JobRequest } from "../../../services/jobService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const jobTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"];
const jobTypeLabels: Record<string, string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract",
  FREELANCE: "Freelance", INTERNSHIP: "Internship",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function Jobs() {
  const [tab, setTab] = useState<"active" | "all" | "mine">("active");
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchJobs = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      let data: JobResponse[];
      if (tab === "mine") data = await jobService.getMyJobs();
      else if (tab === "all") data = await jobService.getAllJobs();
      else data = await jobService.getActiveJobs(q);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchJobs(val), 400);
  };

  const handleCreate = async (data: JobRequest) => {
    try {
      await jobService.create(data);
      setShowCreate(false);
      fetchJobs();
    } catch { /* ignore */ }
  };

  const handleApply = async (id: number) => {
    try {
      const updated = await jobService.apply(id);
      if (selectedJob?.id === id) setSelectedJob(updated);
      fetchJobs();
    } catch { /* ignore */ }
  };

  const handleClose = async (id: number) => {
    try {
      await jobService.closeJob(id);
      setSelectedJob(null);
      fetchJobs();
    } catch { /* ignore */ }
  };

  const activeCount = jobs.filter(j => j.status === "ACTIVE").length;
  const referralCount = jobs.filter(j => j.referral).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            Jobs & Referrals
          </h1>
          <p className="text-sm text-slate-500 mt-1">Leverage your community network for career growth</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Post a Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Openings", value: activeCount, color: "from-blue-500 to-blue-600", icon: Briefcase },
          { label: "Referral Listings", value: referralCount, color: "from-violet-500 to-violet-600", icon: Users },
          { label: "Total Posted", value: jobs.length, color: "from-emerald-500 to-emerald-600", icon: Building2 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1 bg-gradient-to-r bg-clip-text text-transparent", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {([["active", "Active"], ["all", "All Jobs"], ["mine", "My Posts"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(""); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "active" && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search jobs..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-60 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <p className="text-slate-400 text-sm mt-1">Post a job to help your community</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    {job.referral && (
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold uppercase rounded-full border border-violet-200">
                        Referral
                      </span>
                    )}
                    {job.status === "CLOSED" && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-full border border-slate-200">
                        Closed
                      </span>
                    )}
                  </div>
                  {job.company && <p className="text-sm font-semibold text-slate-600 mb-2">{job.company}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {jobTypeLabels[job.jobType] || job.jobType}</span>
                    {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}</span>
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}

      {/* Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          onCloseJob={handleClose}
        />
      )}
    </div>
  );
}

function JobDetailModal({ job, onClose, onApply, onCloseJob }: {
  job: JobResponse; onClose: () => void; onApply: (id: number) => void; onCloseJob: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-800">{job.title}</h2>
              {job.referral && (
                <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold uppercase rounded-full border border-violet-200">Referral</span>
              )}
            </div>
            {job.company && <p className="text-sm font-semibold text-slate-600">{job.company}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {job.location && <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg"><MapPin className="w-3 h-3" /> {job.location}</span>}
          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg"><Clock className="w-3 h-3" /> {jobTypeLabels[job.jobType] || job.jobType}</span>
          {job.salary && <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg"><DollarSign className="w-3 h-3" /> {job.salary}</span>}
        </div>

        {job.description && (
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{job.description}</div>
        )}

        <div className="text-xs text-slate-400 space-y-1">
          <p>Posted by <span className="font-medium text-slate-600">{job.postedByName}</span> {timeAgo(job.createdAt)}</p>
          {job.contactEmail && <p>Contact: <span className="text-indigo-600">{job.contactEmail}</span></p>}
          <p>{job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex gap-2 pt-2">
          {job.status === "ACTIVE" && !job.hasApplied && (
            <button
              onClick={() => onApply(job.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="w-4 h-4" /> {job.referral ? "Ask for Referral" : "Apply Now"}
            </button>
          )}
          {job.hasApplied && (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Applied
            </div>
          )}
          {job.status === "ACTIVE" && (
            <button
              onClick={() => onCloseJob(job.id)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateJobModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: JobRequest) => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [salary, setSalary] = useState("");
  const [referral, setReferral] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      company: company.trim() || undefined,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      jobType,
      salary: salary.trim() || undefined,
      referral,
      contactEmail: contactEmail.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Post a Job</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, Bangalore"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
            <div className="relative">
              <select value={jobType} onChange={e => setJobType(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                {jobTypes.map(t => <option key={t} value={t}>{jobTypeLabels[t]}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Salary</label>
            <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. ₹20L - ₹30L"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Job description, requirements..."
            rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Email</label>
          <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hiring@company.com" type="email"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={referral} onChange={e => setReferral(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          This is a referral opportunity
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all">Post Job</button>
        </div>
      </form>
    </div>
  );
}
