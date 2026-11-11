import { useEffect, useState } from "react";
import {
  BadgeCheck, Briefcase, GraduationCap, MapPin, Plus, Trash2,
  User, Globe, Lock, Award, Calendar, ExternalLink,
} from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import type {
  MwSkillPassport,
  MwPassportSkill,
  MwPassportCertification,
  MwPassportWorkHistory,
} from "../../../types/hrm";

const AVAILABILITY_STYLES: Record<string, string> = {
  FULL_TIME:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  PART_TIME:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  GIG:         "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  UNAVAILABLE: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const PROFICIENCY_STYLES: Record<string, string> = {
  BEGINNER:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  INTERMEDIATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  EXPERT:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
}

// ── Profile Tab ───────────────────────────────────────────────────────
function ProfileTab({ passport, onUpdate }: { passport: MwSkillPassport; onUpdate: (p: MwSkillPassport) => void }) {
  const [form, setForm] = useState({
    bio: passport.bio ?? "",
    location: passport.location ?? "",
    preferredRoles: passport.preferredRoles ?? "",
    availability: passport.availability,
    isPublic: passport.isPublic,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await workforce360Service.updatePassport(form);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent — backend not live yet
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Public toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {form.isPublic ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-foreground">Public Profile</p>
            <p className="text-xs text-muted-foreground">Allow employers to discover your Skill Passport</p>
          </div>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isPublic ? "bg-green-500" : "bg-muted"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.isPublic ? "translate-x-4" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Availability */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Availability</label>
        <div className="flex flex-wrap gap-2">
          {(['FULL_TIME', 'PART_TIME', 'GIG', 'UNAVAILABLE'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setForm(f => ({ ...f, availability: opt }))}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border-2 ${
                form.availability === opt
                  ? `${AVAILABILITY_STYLES[opt]} border-current`
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          rows={3}
          placeholder="Tell employers about yourself..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Location */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="City, State"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Preferred Roles */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferred Roles</label>
        <input
          value={form.preferredRoles}
          onChange={e => setForm(f => ({ ...f, preferredRoles: e.target.value }))}
          placeholder="e.g. Delivery Executive, Warehouse Staff"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-opacity"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save Profile"}
      </button>
    </div>
  );
}

// ── Skills & Certs Tab ────────────────────────────────────────────────
function SkillsCertsTab({ passport, onUpdate }: { passport: MwSkillPassport; onUpdate: (p: MwSkillPassport) => void }) {
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({ skillName: "", category: "", proficiency: "INTERMEDIATE", yearsExp: "" });
  const [addingCert, setAddingCert] = useState(false);
  const [certForm, setCertForm] = useState({ name: "", issuingBody: "", issueDate: "", expiryDate: "", credentialUrl: "" });

  async function handleAddSkill() {
    if (!skillForm.skillName.trim()) return;
    try {
      const newSkill = await workforce360Service.addSkill({
        skillName: skillForm.skillName,
        category: skillForm.category || undefined,
        proficiency: skillForm.proficiency,
        yearsExp: skillForm.yearsExp ? Number(skillForm.yearsExp) : undefined,
      });
      onUpdate({ ...passport, skills: [...passport.skills, newSkill] });
      setSkillForm({ skillName: "", category: "", proficiency: "INTERMEDIATE", yearsExp: "" });
      setAddingSkill(false);
    } catch { /* backend not live */ }
  }

  async function handleRemoveSkill(id: number) {
    try {
      await workforce360Service.removeSkill(id);
      onUpdate({ ...passport, skills: passport.skills.filter(s => s.id !== id) });
    } catch { /* backend not live */ }
  }

  async function handleAddCert() {
    if (!certForm.name.trim()) return;
    try {
      const newCert = await workforce360Service.addCertification({
        name: certForm.name,
        issuingBody: certForm.issuingBody || undefined,
        issueDate: certForm.issueDate || undefined,
        expiryDate: certForm.expiryDate || undefined,
        credentialUrl: certForm.credentialUrl || undefined,
      });
      onUpdate({ ...passport, certifications: [...passport.certifications, newCert] });
      setCertForm({ name: "", issuingBody: "", issueDate: "", expiryDate: "", credentialUrl: "" });
      setAddingCert(false);
    } catch { /* backend not live */ }
  }

  async function handleRemoveCert(id: number) {
    try {
      await workforce360Service.removeCertification(id);
      onUpdate({ ...passport, certifications: passport.certifications.filter(c => c.id !== id) });
    } catch { /* backend not live */ }
  }

  return (
    <div className="space-y-6">
      {/* Skills */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Award className="h-4 w-4 text-primary" /> Skills
          </h3>
          <button onClick={() => setAddingSkill(v => !v)} className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Skill
          </button>
        </div>

        {addingSkill && (
          <div className="mb-3 rounded-lg border border-border bg-card p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input value={skillForm.skillName} onChange={e => setSkillForm(f => ({ ...f, skillName: e.target.value }))} placeholder="Skill name *" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={skillForm.proficiency} onChange={e => setSkillForm(f => ({ ...f, proficiency: e.target.value }))} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
              <input type="number" value={skillForm.yearsExp} onChange={e => setSkillForm(f => ({ ...f, yearsExp: e.target.value }))} placeholder="Years exp." min="0" max="50" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddSkill} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Add</button>
              <button onClick={() => setAddingSkill(false)} className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80">Cancel</button>
            </div>
          </div>
        )}

        {passport.skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">No skills added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passport.skills.map(skill => (
              <div key={skill.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                {skill.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-green-500" />}
                <span className="text-sm font-medium text-foreground">{skill.skillName}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PROFICIENCY_STYLES[skill.proficiency]}`}>{skill.proficiency}</span>
                {skill.yearsExp && <span className="text-[10px] text-muted-foreground">{skill.yearsExp}y</span>}
                <button onClick={() => handleRemoveSkill(skill.id)} className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-border" />

      {/* Certifications */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <GraduationCap className="h-4 w-4 text-primary" /> Certifications
          </h3>
          <button onClick={() => setAddingCert(v => !v)} className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Cert
          </button>
        </div>

        {addingCert && (
          <div className="mb-3 rounded-lg border border-border bg-card p-3 space-y-2.5">
            <input value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} placeholder="Certification name *" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input value={certForm.issuingBody} onChange={e => setCertForm(f => ({ ...f, issuingBody: e.target.value }))} placeholder="Issuing body" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={certForm.credentialUrl} onChange={e => setCertForm(f => ({ ...f, credentialUrl: e.target.value }))} placeholder="Credential URL" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="mb-0.5 block text-[10px] text-muted-foreground">Issue date</label><input type="date" value={certForm.issueDate} onChange={e => setCertForm(f => ({ ...f, issueDate: e.target.value }))} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
              <div><label className="mb-0.5 block text-[10px] text-muted-foreground">Expiry date</label><input type="date" value={certForm.expiryDate} onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddCert} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Add</button>
              <button onClick={() => setAddingCert(false)} className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80">Cancel</button>
            </div>
          </div>
        )}

        {passport.certifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">No certifications added yet.</p>
        ) : (
          <div className="space-y-2">
            {passport.certifications.map(cert => {
              const days = daysUntilExpiry(cert.expiryDate);
              const expiryClass = days === null ? "" : days < 0 ? "text-red-600 dark:text-red-400" : days <= 30 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
              return (
                <div key={cert.id} className="flex items-start justify-between rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {cert.isVerified && <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />}
                      <span className="text-sm font-semibold text-foreground">{cert.name}</span>
                    </div>
                    {cert.issuingBody && <p className="mt-0.5 text-xs text-muted-foreground">{cert.issuingBody}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px]">
                      {cert.issueDate && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" />{cert.issueDate}</span>}
                      {cert.expiryDate && <span className={`flex items-center gap-1 ${expiryClass}`}><Calendar className="h-3 w-3" />Exp: {cert.expiryDate}{days !== null && days <= 30 && ` (${days < 0 ? "Expired" : `${days}d left`})`}</span>}
                      {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />View</a>}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveCert(cert.id)} className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Work History Tab ──────────────────────────────────────────────────
function WorkHistoryTab({ passport, onUpdate }: { passport: MwSkillPassport; onUpdate: (p: MwSkillPassport) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ employerName: "", role: "", startDate: "", endDate: "", isCurrent: false });

  const sorted = [...passport.workHistory].sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return (b.startDate ?? "").localeCompare(a.startDate ?? "");
  });

  async function handleAdd() {
    if (!form.employerName.trim()) return;
    try {
      const entry = await workforce360Service.addWorkHistory({
        employerName: form.employerName,
        role: form.role || undefined,
        startDate: form.startDate || undefined,
        endDate: form.isCurrent ? undefined : (form.endDate || undefined),
        isCurrent: form.isCurrent,
      });
      onUpdate({ ...passport, workHistory: [...passport.workHistory, entry] });
      setForm({ employerName: "", role: "", startDate: "", endDate: "", isCurrent: false });
      setAdding(false);
    } catch { /* backend not live */ }
  }

  async function handleRemove(id: number) {
    try {
      await workforce360Service.removeWorkHistory(id);
      onUpdate({ ...passport, workHistory: passport.workHistory.filter(w => w.id !== id) });
    } catch { /* backend not live */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Briefcase className="h-4 w-4 text-primary" /> Work History
        </h3>
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Position
        </button>
      </div>

      {adding && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.employerName} onChange={e => setForm(f => ({ ...f, employerName: e.target.value }))} placeholder="Employer name *" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Role / Title" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="mb-0.5 block text-[10px] text-muted-foreground">Start date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            {!form.isCurrent && <div><label className="mb-0.5 block text-[10px] text-muted-foreground">End date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /></div>}
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(f => ({ ...f, isCurrent: e.target.checked }))} className="h-3.5 w-3.5 rounded accent-primary" />
            Currently working here
          </label>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Add</button>
            <button onClick={() => setAdding(false)} className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80">Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">No work history added yet.</p>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {sorted.map(entry => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-[13px] top-3 h-2 w-2 rounded-full border-2 border-primary bg-background" />
                <div className="rounded-lg border border-border bg-card p-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{entry.role || entry.employerName}</span>
                      {entry.isManaVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <BadgeCheck className="h-3 w-3" /> Mana Verified
                        </span>
                      )}
                      {entry.isCurrent && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Current</span>
                      )}
                    </div>
                    {entry.role && <p className="mt-0.5 text-xs text-muted-foreground">{entry.employerName}</p>}
                    {(entry.startDate || entry.endDate) && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {entry.startDate ?? "—"} → {entry.isCurrent ? "Present" : (entry.endDate ?? "—")}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleRemove(entry.id)} className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
const TABS = [
  { id: "profile" as const, label: "Profile", Icon: User },
  { id: "skills" as const, label: "Skills & Certs", Icon: Award },
  { id: "history" as const, label: "Work History", Icon: Briefcase },
];

export default function SkillPassport() {
  const [passport, setPassport] = useState<MwSkillPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "skills" | "history">("profile");

  useEffect(() => {
    workforce360Service.getMyPassport()
      .then(setPassport)
      .catch(() => {
        // Backend not yet live — show empty passport for UI dev
        setPassport({
          id: 0, manaUserId: 0, isPublic: false, availability: 'FULL_TIME',
          skills: [], certifications: [], workHistory: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Skill Passport</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your portable professional profile across the Mana ecosystem</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {passport && (
        <div>
          {activeTab === "profile" && <ProfileTab passport={passport} onUpdate={setPassport} />}
          {activeTab === "skills" && <SkillsCertsTab passport={passport} onUpdate={setPassport} />}
          {activeTab === "history" && <WorkHistoryTab passport={passport} onUpdate={setPassport} />}
        </div>
      )}
    </div>
  );
}
