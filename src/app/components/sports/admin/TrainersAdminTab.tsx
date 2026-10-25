import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Dumbbell, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { academyApi } from "../../../../services/academy/academyApi";
import type { AcademyInstructor } from "../../../../types/academy";

export function TrainersAdminTab() {
  const [trainers, setTrainers] = useState<AcademyInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    academyApi.getSportsTrainers()
      .then(setTrainers)
      .catch(() => toast.error("Could not load trainers"))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(id);
    try {
      await academyApi.updateInstructorStatus(id, status);
      setTrainers((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      toast.success(`Trainer ${status === "APPROVED" ? "approved" : "rejected"}`);
    } catch {
      toast.error("Could not update status");
    } finally {
      setProcessing(null);
    }
  }

  const pending = trainers.filter((t) => t.status === "APPLIED" || t.status === "COMMUNITY_VERIFIED");
  const approved = trainers.filter((t) => t.status === "APPROVED");
  const rejected = trainers.filter((t) => t.status === "REJECTED");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading trainers…
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Pending */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{pending.length}</span>
          Pending Approval
        </h3>
        {pending.length === 0 ? (
          <p className="text-xs text-slate-400">No pending applications</p>
        ) : (
          <div className="space-y-3">
            {pending.map((t) => (
              <TrainerRow
                key={t.id}
                trainer={t}
                expanded={expanded === t.id}
                onToggle={() => setExpanded((p) => (p === t.id ? null : t.id))}
                onApprove={() => updateStatus(t.id, "APPROVED")}
                onReject={() => updateStatus(t.id, "REJECTED")}
                processing={processing === t.id}
                showActions
              />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      {approved.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approved Trainers
          </h3>
          <div className="space-y-2">
            {approved.map((t) => (
              <TrainerRow
                key={t.id}
                trainer={t}
                expanded={expanded === t.id}
                onToggle={() => setExpanded((p) => (p === t.id ? null : t.id))}
                processing={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" /> Rejected
          </h3>
          <div className="space-y-2">
            {rejected.map((t) => (
              <TrainerRow
                key={t.id}
                trainer={t}
                expanded={expanded === t.id}
                onToggle={() => setExpanded((p) => (p === t.id ? null : t.id))}
                processing={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type TrainerRowProps = {
  trainer: AcademyInstructor;
  expanded: boolean;
  onToggle: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  processing: boolean;
  showActions?: boolean;
};

function TrainerRow({ trainer, expanded, onToggle, onApprove, onReject, processing, showActions }: TrainerRowProps) {
  const spec = trainer.sportSpecializations?.[0];
  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
    APPLIED: "bg-amber-50 text-amber-700 border-amber-200",
    COMMUNITY_VERIFIED: "bg-blue-50 text-blue-700 border-blue-200",
    SUSPENDED: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-3 cursor-pointer" onClick={onToggle}>
        {trainer.profilePicUrl ? (
          <img src={trainer.profilePicUrl} alt={trainer.fullName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-indigo-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{trainer.fullName}</p>
          <p className="text-[10px] text-slate-500">{spec?.sport ?? "—"}{trainer.experienceYears ? ` · ${trainer.experienceYears}y exp` : ""}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[trainer.status] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {trainer.status}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-50 space-y-2">
          {trainer.bio && <p className="text-[11px] text-slate-600">{trainer.bio}</p>}
          {spec && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
              {spec.certificationBody && <span>Cert: {spec.certificationBody}</span>}
              {spec.certificationNumber && <span>No: {spec.certificationNumber}</span>}
              {spec.certifiedYear && <span>Year: {spec.certifiedYear}</span>}
              {spec.ageGroupsCoached && <span>Groups: {spec.ageGroupsCoached}</span>}
            </div>
          )}
          {trainer.email && <p className="text-[10px] text-slate-400">{trainer.email}{trainer.phone ? ` · ${trainer.phone}` : ""}</p>}
          {showActions && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={onApprove}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-60"
              >
                {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold disabled:opacity-60"
              >
                {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
