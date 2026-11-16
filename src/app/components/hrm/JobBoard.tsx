import { useState, useEffect, useCallback } from "react";
import {
  Briefcase, MapPin, Globe, Search, Plus, ChevronDown, ChevronUp,
  Loader2, X, PauseCircle, XCircle, Users, DollarSign,
} from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
import type {
  MwJobListing,
  MwJobApplication,
  JobStatus,
  JobApplicationStatus,
  EmploymentType,
} from "../../../types/hrm";

// ── Status helpers ───────────────────────────────────────────────────

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  PAUSED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  CLOSED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const APP_STATUS_STYLES: Record<JobApplicationStatus, string> = {
  APPLIED:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  OFFERED:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  REJECTED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  WITHDRAWN:   "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const EMP_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME:  "Full-time",
  PART_TIME:  "Part-time",
  CONTRACT:   "Contract",
  INTERNSHIP: "Internship",
  GIG:        "Gig",
};

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

// ── Apply Modal ──────────────────────────────────────────────────────

function ApplyModal({ job, onClose, onSuccess }: { job: MwJobListing; onClose: () => void; onSuccess: () => void }) {
  const [coverNote, setCoverNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await workforce360Service.applyToJob(job.id, coverNote || undefined);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Apply: {job.title}</h2>
            <p className="text-xs text-muted-foreground">{job.location || "Remote"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Cover Note (optional)</label>
        <textarea
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          rows={4}
          placeholder="Tell the employer why you're a good fit..."
          className="mb-3 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Job Modal ───────────────────────────────────────────────────

function PostJobModal({ orgId, onClose, onSuccess }: { orgId: number; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", employmentType: "FULL_TIME" as EmploymentType,
    location: "", isRemote: false, salaryMin: "", salaryMax: "",
    requiredSkills: "", experienceYears: "", expiresAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setLoading(true); setError(null);
    try {
      await workforce360Service.createJobListing(orgId, {
        title: form.title.trim(),
        description: form.description || undefined,
        employmentType: form.employmentType,
        location: form.location || undefined,
        isRemote: form.isRemote,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        requiredSkills: form.requiredSkills || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Post a Job</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Job Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Senior React Developer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Employment Type</label>
              <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(EMP_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Experience (years)</label>
              <input type="number" min={0} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="City or leave blank" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isRemote" checked={form.isRemote} onChange={(e) => set("isRemote", e.target.checked)} className="rounded" />
            <label htmlFor="isRemote" className="text-sm text-foreground">Remote OK</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Salary Min (₹)</label>
              <input type="number" min={0} value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="300000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Salary Max (₹)</label>
              <input type="number" min={0} value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="600000" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Required Skills</label>
            <input value={form.requiredSkills} onChange={(e) => set("requiredSkills", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="React, TypeScript, Node.js" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Role overview, responsibilities..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Expires At</label>
            <input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Post Job
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Applicant Row ────────────────────────────────────────────────────

function ApplicantRow({ app, orgId, jobId, onUpdate }: { app: MwJobApplication; orgId: number; jobId: number; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const respond = async (status: string) => {
    setLoading(true);
    try { await workforce360Service.respondToJobApplication(orgId, jobId, app.id, status); onUpdate(); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">Applicant #{app.manaUserId}</p>
        {app.coverNote && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">"{app.coverNote}"</p>}
      </div>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${APP_STATUS_STYLES[app.status as JobApplicationStatus] || "bg-gray-100 text-gray-500"}`}>
        {app.status}
      </span>
      {app.status === 'APPLIED' && (
        <div className="flex gap-1">
          <button onClick={() => respond('SHORTLISTED')} disabled={loading} className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50">Shortlist</button>
          <button onClick={() => respond('OFFERED')} disabled={loading} className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50">Offer</button>
          <button onClick={() => respond('REJECTED')} disabled={loading} className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50">Reject</button>
        </div>
      )}
      {app.status === 'SHORTLISTED' && (
        <button onClick={() => respond('OFFERED')} disabled={loading} className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50">Offer</button>
      )}
    </div>
  );
}

// ── Employer Listing Card ────────────────────────────────────────────

function EmployerListingCard({ listing, orgId, onRefresh }: { listing: MwJobListing; orgId: number; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [apps, setApps] = useState<MwJobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const salary = fmtSalary(listing.salaryMin, listing.salaryMax);

  const loadApps = async () => {
    if (!expanded) {
      setLoadingApps(true);
      try { setApps(await workforce360Service.getJobApplications(orgId, listing.id)); }
      catch (e) { console.error(e); }
      finally { setLoadingApps(false); }
    }
    setExpanded((v) => !v);
  };

  const pause = async () => { try { await workforce360Service.pauseJobListing(orgId, listing.id); onRefresh(); } catch (e) { console.error(e); } };
  const close = async () => { try { await workforce360Service.closeJobListing(orgId, listing.id); onRefresh(); } catch (e) { console.error(e); } };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm text-foreground">{listing.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${JOB_STATUS_STYLES[listing.status]}`}>{listing.status}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{EMP_TYPE_LABELS[listing.employmentType] || listing.employmentType}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {listing.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</span>}
            {listing.isRemote && <span className="flex items-center gap-1 text-blue-500"><Globe className="h-3 w-3" />Remote OK</span>}
            {salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{salary}</span>}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {listing.status === 'ACTIVE' && (
            <>
              <button onClick={pause} title="Pause" className="rounded p-1.5 text-muted-foreground hover:bg-muted"><PauseCircle className="h-4 w-4" /></button>
              <button onClick={close} title="Close" className="rounded p-1.5 text-muted-foreground hover:bg-muted"><XCircle className="h-4 w-4" /></button>
            </>
          )}
          <button onClick={loadApps} className="rounded p-1.5 text-muted-foreground hover:bg-muted" title="View applicants">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Users className="h-3 w-3" /> Applicants
          </p>
          {loadingApps ? (
            <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : apps.length === 0 ? (
            <p className="text-xs text-muted-foreground">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {apps.map((a) => (
                <ApplicantRow key={a.id} app={a} orgId={orgId} jobId={listing.id} onUpdate={() => workforce360Service.getJobApplications(orgId, listing.id).then(setApps)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Community Job Card ───────────────────────────────────────────────

function CommunityJobCard({ job, appliedIds, onApply }: { job: MwJobListing; appliedIds: Set<number>; onApply: (j: MwJobListing) => void }) {
  const salary = fmtSalary(job.salaryMin, job.salaryMax);
  const applied = appliedIds.has(job.id);
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm text-foreground">{job.title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{EMP_TYPE_LABELS[job.employmentType] || job.employmentType}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
            {job.isRemote && <span className="flex items-center gap-1 text-blue-500"><Globe className="h-3 w-3" />Remote OK</span>}
            {salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{salary}</span>}
            {job.experienceYears !== undefined && <span>{job.experienceYears}+ yrs exp</span>}
          </div>
          {job.requiredSkills && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.requiredSkills.split(',').slice(0, 4).map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => !applied && onApply(job)}
          disabled={applied}
          className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${applied ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          {applied ? "Applied" : "Apply"}
        </button>
      </div>
      {job.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{job.description}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function JobBoard() {
  const { activeOrgId } = useHrmOrg();
  const [tab, setTab] = useState<"board" | "manage">("board");

  // Community board state
  const [jobs, setJobs] = useState<MwJobListing[]>([]);
  const [myApps, setMyApps] = useState<MwJobApplication[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [applyTarget, setApplyTarget] = useState<MwJobListing | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);

  // Employer state
  const [orgListings, setOrgListings] = useState<MwJobListing[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadBoard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const [j, a] = await Promise.all([
        workforce360Service.getCommunityJobs(debouncedSearch || undefined),
        workforce360Service.getMyJobApplications().catch(() => []),
      ]);
      setJobs(j);
      setMyApps(a);
    } catch (e) { console.error(e); }
    finally { setBoardLoading(false); }
  }, [debouncedSearch]);

  const loadManage = useCallback(async () => {
    if (!activeOrgId) return;
    setManageLoading(true);
    try { setOrgListings(await workforce360Service.getOrgJobListings(activeOrgId)); }
    catch (e) { console.error(e); }
    finally { setManageLoading(false); }
  }, [activeOrgId]);

  useEffect(() => { if (tab === "board") loadBoard(); }, [tab, loadBoard]);
  useEffect(() => { if (tab === "manage") loadManage(); }, [tab, loadManage]);

  const appliedJobIds = new Set(myApps.map((a) => a.jobId));

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Job Board</h1>
            <p className="text-xs text-muted-foreground">Browse community jobs or manage your org's listings</p>
          </div>
          {tab === "manage" && activeOrgId && (
            <button onClick={() => setShowPostModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Post Job
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          {(["board", "manage"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t === "board" ? "Community Board" : "Manage Listings"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Community Board */}
        {tab === "board" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title..."
                className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {boardLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No jobs found{search ? ` for "${search}"` : ""}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => (
                  <CommunityJobCard key={j.id} job={j} appliedIds={appliedJobIds} onApply={setApplyTarget} />
                ))}
              </div>
            )}
            {/* My Applications */}
            {myApps.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">My Applications</h2>
                <div className="space-y-2">
                  {myApps.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <span className="text-xs text-foreground">Job #{a.jobId}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APP_STATUS_STYLES[a.status as JobApplicationStatus] || "bg-gray-100 text-gray-500"}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Listings */}
        {tab === "manage" && (
          <div className="space-y-3">
            {!activeOrgId ? (
              <p className="text-sm text-muted-foreground">Select an organization to manage job listings.</p>
            ) : manageLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : orgListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No job listings yet.</p>
                <button onClick={() => setShowPostModal(true)}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Post First Job
                </button>
              </div>
            ) : (
              orgListings.map((l) => (
                <EmployerListingCard key={l.id} listing={l} orgId={activeOrgId} onRefresh={loadManage} />
              ))
            )}
          </div>
        )}
      </div>

      {applyTarget && (
        <ApplyModal job={applyTarget} onClose={() => setApplyTarget(null)} onSuccess={loadBoard} />
      )}
      {showPostModal && activeOrgId && (
        <PostJobModal orgId={activeOrgId} onClose={() => setShowPostModal(false)} onSuccess={loadManage} />
      )}
    </div>
  );
}
