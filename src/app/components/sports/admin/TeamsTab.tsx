import { Clock, X, Check, Search, Edit2, Trash2, Trophy } from "lucide-react";
import { showSuccess, showError, showInfo } from "../../../../utils/ToastUtils";
import { Activity, Target } from "lucide-react";

const toast = {
  success: (msg: string) => showSuccess(msg),
  error: (msg: string) => showError(msg),
  info: (msg: string) => showInfo(msg),
};

const BasketballIcon = ({ size = 24, className, ...props }: React.ComponentPropsWithoutRef<"svg"> & { size?: number | string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M4.93 4.93a10 10 0 0 1 0 14.14" />
    <path d="M19.07 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const sportIconMap: Record<string, React.ElementType> = {
  Basketball: BasketballIcon,
  Soccer: Target,
  Volleyball: Activity,
};

const sportColorMap: Record<string, string> = {
  Basketball: "#f59e0b",
  Soccer: "#10b981",
  Volleyball: "#6366f1",
};

interface PendingReg {
  id: number;
  teamName: string;
  sport: string;
  captain: string;
  email: string;
  members: number;
  date: string;
}

interface Team {
  id: number;
  name: string;
  sport: string;
  division: string;
  captain: string;
  members: number;
  status: string;
  record: string;
}

interface TeamsTabProps {
  pendingList: PendingReg[];
  setPendingList: React.Dispatch<React.SetStateAction<PendingReg[]>>;
  teamsList: Team[];
  setTeamsList: React.Dispatch<React.SetStateAction<Team[]>>;
  adminSearchQuery: string;
  setAdminSearchQuery: (q: string) => void;
  approveTeam: (id: number) => void;
}

export function TeamsTab({
  pendingList,
  setPendingList,
  teamsList,
  setTeamsList,
  adminSearchQuery,
  setAdminSearchQuery,
  approveTeam,
}: TeamsTabProps) {
  return (
    <div className="space-y-4">
      {/* Pending approvals */}
      {pendingList.length > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: "white", border: "1px solid rgba(245,158,11,0.25)", boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-left" style={{ color: "#0d0d2b" }}>
            <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />
            Pending Approvals
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              {pendingList.length}
            </span>
          </h3>
          <div className="space-y-3">
            {pendingList.map((reg) => {
              const Icon = sportIconMap[reg.sport] ?? Trophy;
              const color = sportColorMap[reg.sport] ?? "#4f46e5";
              return (
                <div key={reg.id} className="flex items-center gap-3 p-3 rounded-xl text-left"
                  style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#0d0d2b" }}>{reg.teamName}</p>
                    <p className="text-xs" style={{ color: "#6b7094" }}>{reg.sport} · {reg.captain} · {reg.members} members · {reg.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPendingList(prev => prev.filter(p => p.id !== reg.id))}
                      className="p-2 rounded-lg transition-colors cursor-pointer"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={() => approveTeam(reg.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All teams */}
      <div className="rounded-2xl p-5 text-left"
        style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold flex-1" style={{ color: "#0d0d2b" }}>All Teams</h3>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <Search className="h-3.5 w-3.5" style={{ color: "#6366f1" }} />
            <input
              type="text"
              placeholder="Search teams..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
              style={{ color: "#0d0d2b", width: "140px" }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {teamsList
            .filter((t) =>
              t.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
              t.sport.toLowerCase().includes(adminSearchQuery.toLowerCase())
            )
            .map((team) => {
              const Icon = sportIconMap[team.sport] ?? Trophy;
              const color = sportColorMap[team.sport] ?? "#4f46e5";
              return (
                <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl group"
                  style={{ background: "rgba(99,102,241,0.02)" }}>
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "#0d0d2b" }}>{team.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${team.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {team.status}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#6b7094" }}>{team.sport} · {team.division} · Captain: {team.captain}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#0d0d2b" }}>{team.record}</p>
                      <p className="text-xs" style={{ color: "#6b7094" }}>Record</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#0d0d2b" }}>{team.members}</p>
                      <p className="text-xs" style={{ color: "#6b7094" }}>Members</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg cursor-pointer" style={{ color: "#4f46e5" }}
                        onClick={() => toast.info(`Editing team ${team.name}`)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg cursor-pointer" style={{ color: "#ef4444" }}
                        onClick={() => {
                          setTeamsList(prev => prev.filter(t => t.id !== team.id));
                          toast.error(`Team "${team.name}" deleted`);
                        }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
