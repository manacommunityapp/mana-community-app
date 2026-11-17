import { useEffect, useState } from "react";
import {
  Calendar, Clock, MapPin, Users, DollarSign, Briefcase, Plus,
  CheckCircle2, XCircle, ChevronRight, AlertCircle, Loader2, X,
} from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
import type {
  MwPoolListing,
  MwPoolApplication,
  PoolListingStatus,
  PoolApplicationStatus,
} from "../../../types/hrm";

// ── Status helpers ───────────────────────────────────────────────────

const LISTING_STATUS_STYLES: Record<PoolListingStatus, string> = {
  OPEN:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  FILLED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CLOSED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const APP_STATUS_STYLES: Record<PoolApplicationStatus, string> = {
  APPLIED:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  ACCEPTED:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  REJECTED:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  WITHDRAWN: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Listing Card ─────────────────────────────────────────────────────

function ListingCard({
  listing,
  onViewApplicants,
  onClose,
  showManage,
}: {
  listing: MwPoolListing;
  onViewApplicants?: () => void;
  onClose?: () => void;
  showManage: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{listing.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${LISTING_STATUS_STYLES[listing.status]}`}>
              {listing.status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {fmt(listing.shiftDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {listing.shiftStart} – {listing.shiftEnd}
            </span>
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location}
              </span>
            )}
            {listing.payRate && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                ₹{listing.payRate}/{listing.payType === 'HOURLY' ? 'hr' : listing.payType === 'DAILY' ? 'day' : 'fixed'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            <Users className="h-3 w-3" />
            {listing.acceptedCount}/{listing.maxWorkers}
          </span>
        </div>
      </div>

      {showManage && (
        <div className="mt-3 flex gap-2">
          {onViewApplicants && (
            <button
              onClick={onViewApplicants}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Applicants
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>
          )}
          {onClose && listing.status !== 'CLOSED' && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Applicant Drawer ─────────────────────────────────────────────────

function ApplicantDrawer({
  orgId,
  listing,
  onClose,
  onUpdated,
}: {
  orgId: number;
  listing: MwPoolListing;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [applications, setApplications] = useState<MwPoolApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    workforce360Service.getListingApplications(orgId, listing.id)
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [orgId, listing.id]);

  async function respond(appId: number, action: 'accept' | 'reject') {
    setBusy(appId);
    try {
      await workforce360Service.respondToPoolApplication(orgId, listing.id, appId, action);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : a));
      onUpdated();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="font-semibold text-foreground">{listing.title}</h3>
            <p className="text-xs text-muted-foreground">Applicants</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No applications yet</div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {app.manaUserId}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Worker #{app.manaUserId}</p>
                  {app.workerNote && <p className="text-xs text-muted-foreground truncate">{app.workerNote}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {app.status === 'APPLIED' ? (
                    <>
                      <button
                        onClick={() => respond(app.id, 'accept')}
                        disabled={busy === app.id}
                        className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {busy === app.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => respond(app.id, 'reject')}
                        disabled={busy === app.id}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${APP_STATUS_STYLES[app.status as PoolApplicationStatus]}`}>
                      {app.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Shift Form ──────────────────────────────────────────────────

function PostShiftForm({ orgId, onCreated }: { orgId: number; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', shiftDate: '', shiftStart: '09:00', shiftEnd: '17:00',
    location: '', payRate: '', payType: 'HOURLY', maxWorkers: '1',
    requiredSkills: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.shiftDate) { setError('Title and shift date are required'); return; }
    setSaving(true);
    setError('');
    try {
      await workforce360Service.createPoolListing(orgId, {
        title: form.title, shiftDate: form.shiftDate, shiftStart: form.shiftStart, shiftEnd: form.shiftEnd,
        location: form.location || undefined, payRate: form.payRate ? Number(form.payRate) : undefined,
        payType: form.payType as 'HOURLY' | 'DAILY' | 'FIXED', maxWorkers: Number(form.maxWorkers),
        requiredSkills: form.requiredSkills || undefined, description: form.description || undefined,
      });
      onCreated();
      setForm({ title: '', shiftDate: '', shiftStart: '09:00', shiftEnd: '17:00', location: '', payRate: '', payType: 'HOURLY', maxWorkers: '1', requiredSkills: '', description: '' });
    } catch {
      setError('Failed to create listing. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";
  const label = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className={label}>Shift Title *</label>
        <input className={field} placeholder="e.g. Weekend Security Guard" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={label}>Shift Date *</label>
          <input type="date" className={field} value={form.shiftDate}
            onChange={e => setForm(p => ({ ...p, shiftDate: e.target.value }))} />
        </div>
        <div>
          <label className={label}>Start Time</label>
          <input type="time" className={field} value={form.shiftStart}
            onChange={e => setForm(p => ({ ...p, shiftStart: e.target.value }))} />
        </div>
        <div>
          <label className={label}>End Time</label>
          <input type="time" className={field} value={form.shiftEnd}
            onChange={e => setForm(p => ({ ...p, shiftEnd: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Location</label>
          <input className={field} placeholder="e.g. Chennai HQ, Block A" value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        </div>
        <div>
          <label className={label}>Max Workers</label>
          <input type="number" min={1} className={field} value={form.maxWorkers}
            onChange={e => setForm(p => ({ ...p, maxWorkers: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Pay Rate (₹)</label>
          <input type="number" min={0} className={field} placeholder="0" value={form.payRate}
            onChange={e => setForm(p => ({ ...p, payRate: e.target.value }))} />
        </div>
        <div>
          <label className={label}>Pay Type</label>
          <select className={field} value={form.payType}
            onChange={e => setForm(p => ({ ...p, payType: e.target.value }))}>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="FIXED">Fixed</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Required Skills</label>
        <textarea className={`${field} resize-none`} rows={2} placeholder="e.g. First Aid, Security Licence"
          value={form.requiredSkills} onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))} />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea className={`${field} resize-none`} rows={3} placeholder="Describe the shift duties..."
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {saving ? 'Posting...' : 'Post Shift'}
      </button>
    </form>
  );
}

// ── Open Shifts Tab (employer) ───────────────────────────────────────

function OpenShiftsTab({ orgId }: { orgId: number }) {
  const [listings, setListings] = useState<MwPoolListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MwPoolListing | null>(null);

  function load() {
    workforce360Service.getPoolListings(orgId)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [orgId]);

  async function handleClose(listingId: number) {
    await workforce360Service.closePoolListing(orgId, listingId);
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'CLOSED' } : l));
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <>
      {listings.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No shift listings yet. Use the "Post Shift" tab to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <ListingCard
              key={l.id}
              listing={l}
              showManage
              onViewApplicants={() => setSelected(l)}
              onClose={() => handleClose(l.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <ApplicantDrawer
          orgId={orgId}
          listing={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </>
  );
}

// ── My Board Tab (worker) ────────────────────────────────────────────

function MyBoardTab() {
  const [browse, setBrowse] = useState<MwPoolListing[]>([]);
  const [myApps, setMyApps] = useState<MwPoolApplication[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [consenting, setConsenting] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<'browse' | 'applications'>('browse');
  const [applyNote, setApplyNote] = useState('');
  const [applyTarget, setApplyTarget] = useState<number | null>(null);

  useEffect(() => {
    workforce360Service.getOpenPoolListings()
      .then(setBrowse).catch(() => setBrowse([]))
      .finally(() => setLoadingBrowse(false));
    workforce360Service.getMyPoolApplications()
      .then(setMyApps).catch(() => setMyApps([]))
      .finally(() => setLoadingApps(false));
  }, []);

  const appliedIds = new Set(myApps.map(a => a.listingId));

  async function apply(listingId: number) {
    setApplying(listingId);
    try {
      const app = await workforce360Service.applyToPoolListing(listingId, applyNote || undefined);
      setMyApps(prev => [...prev, app]);
      setApplyTarget(null);
      setApplyNote('');
    } finally {
      setApplying(null);
    }
  }

  async function consent(appId: number) {
    setConsenting(appId);
    try {
      await workforce360Service.consentToContract(appId);
      setMyApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'ACCEPTED' } : a));
    } finally {
      setConsenting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['browse', 'applications'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all capitalize ${
              subTab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'browse' ? 'Browse Shifts' : `My Applications (${myApps.length})`}
          </button>
        ))}
      </div>

      {subTab === 'browse' && (
        loadingBrowse ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : browse.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No open shifts available right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {browse.map(l => (
              <div key={l.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <ListingCard listing={l} showManage={false} />
                <div className="mt-3">
                  {appliedIds.has(l.id) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                    </span>
                  ) : applyTarget === l.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={2}
                        placeholder="Add a note (optional)..."
                        value={applyNote}
                        onChange={e => setApplyNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => apply(l.id)}
                          disabled={applying === l.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {applying === l.id ? 'Applying...' : 'Confirm Apply'}
                        </button>
                        <button onClick={() => setApplyTarget(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setApplyTarget(l.id)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {subTab === 'applications' && (
        loadingApps ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : myApps.length === 0 ? (
          <div className="text-center py-16">
            <XCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">You haven't applied to any shifts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myApps.map(app => (
              <div key={app.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Listing #{app.listingId}</p>
                  <p className="text-xs text-muted-foreground">Applied {fmt(app.appliedAt)}</p>
                  {app.employerNote && (
                    <p className="mt-1 text-xs italic text-muted-foreground">"{app.employerNote}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${APP_STATUS_STYLES[app.status as PoolApplicationStatus]}`}>
                    {app.status}
                  </span>
                  {app.status === 'ACCEPTED' && (
                    <button
                      onClick={() => consent(app.id)}
                      disabled={consenting === app.id}
                      className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {consenting === app.id ? '...' : 'Consent'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

type Tab = 'shifts' | 'post' | 'board';
const TABS: { id: Tab; label: string }[] = [
  { id: 'shifts', label: 'Open Shifts' },
  { id: 'post',   label: 'Post Shift' },
  { id: 'board',  label: 'My Board' },
];

export default function WorkforcePool() {
  const { activeOrgId: orgId } = useHrmOrg();
  const [activeTab, setActiveTab] = useState<Tab>('shifts');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Workforce Pool</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Post gig shifts, manage applicants, and find work</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center rounded-md py-2 text-xs font-semibold transition-all ${
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'shifts' && orgId && <OpenShiftsTab key={refreshKey} orgId={orgId} />}
        {activeTab === 'post' && orgId && (
          <PostShiftForm
            orgId={orgId}
            onCreated={() => { setActiveTab('shifts'); setRefreshKey(k => k + 1); }}
          />
        )}
        {activeTab === 'board' && <MyBoardTab />}
        {!orgId && (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select an organization to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
