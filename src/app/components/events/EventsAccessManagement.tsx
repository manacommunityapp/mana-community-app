import { useState } from "react";
import {
  Shield, Users, Eye, Pencil, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, Info, LayoutDashboard, CalendarDays, Ticket,
  HandHeart, UtensilsCrossed, ImageIcon, Bell, UserCheck, Lock,
  Unlock, RotateCcw, Save, Loader2, Crown,
  Briefcase, Banknote, Wrench, Camera, ClipboardList,
  CalendarClock, HeartHandshake, ScanLine, DollarSign, Flame,
  Plus, Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import {
  EVENT_PERMISSION_MATRIX,
  EVENT_ROLE_DEFAULTS,
  type EventPermissionRow,
} from "../../../constants/permissions";

/* ─── Types ─── */
interface RoleConfig {
  name: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  permissions: Set<string>;
  isDefault?: boolean;
  /** Suggested custom role — not a system role, must be created in Admin Hub */
  suggested?: boolean;
}

const MENU_ICONS: Record<string, any> = {
  "Dashboard": LayoutDashboard,
  "Events & Schedule": CalendarDays,
  "Registration": Ticket,
  "People & Volunteers": Users,
  "Fundraising": HandHeart,
  "Operations": UtensilsCrossed,
  "Media & Reports": ImageIcon,
  "Gallery": Camera,
  "Reports": ImageIcon,
  "Notifications": Bell,
  "Forms (Categories)": ClipboardList,
  "Events Module": Shield,
};

const ACTION_LABELS = {
  view: "View",
  createEdit: "Manage / Edit",
  delete: "Delete / Export",
};

const ACTION_ICONS = {
  view: Eye,
  createEdit: Pencil,
  delete: Trash2,
};

/* ─── Role Presets ─── */
function buildRoles(): RoleConfig[] {
  return [
    // ── System roles ───────────────────────────────────────────────────────
    {
      name: "ADMIN", label: "Admin", icon: Crown, color: "#4f46e5",
      description: "Full access to all event features — create, manage, export, notify, manage forms",
      permissions: new Set(EVENT_ROLE_DEFAULTS.ADMIN),
    },
    {
      name: "COMMUNITY_ADMIN", label: "Community Admin", icon: Shield, color: "#7c3aed",
      description: "Full event management within the community scope, same as Admin",
      permissions: new Set(EVENT_ROLE_DEFAULTS.COMMUNITY_ADMIN),
    },
    {
      name: "SPORTS_ADMIN", label: "Sports Admin", icon: Briefcase, color: "#0891b2",
      description: "View events, registrations and people; send notifications; view forms",
      permissions: new Set(EVENT_ROLE_DEFAULTS.SPORTS_ADMIN),
    },
    {
      name: "MEMBER", label: "Member", icon: UserCheck, color: "#059669",
      description: "Browse events, register, view schedules, media, and forms",
      permissions: new Set(EVENT_ROLE_DEFAULTS.MEMBER),
    },
    {
      name: "VENDOR", label: "Vendor", icon: Banknote, color: "#d97706",
      description: "View events and register; view forms relevant to vendor stalls",
      permissions: new Set(EVENT_ROLE_DEFAULTS.VENDOR),
    },
    {
      name: "CASHIER", label: "Cashier", icon: Banknote, color: "#be185d",
      description: "View dashboard, schedules, registration data, and forms for on-ground use",
      permissions: new Set(EVENT_ROLE_DEFAULTS.CASHIER),
    },
    {
      name: "STAFF", label: "Staff", icon: Wrench, color: "#64748b",
      description: "Operational support — registrations, people, operations, media, forms",
      permissions: new Set(EVENT_ROLE_DEFAULTS.STAFF),
    },
    {
      name: "USER", label: "User", icon: Users, color: "#8b5cf6",
      description: "Basic access — dashboard, gallery, register for events, view forms",
      permissions: new Set(EVENT_ROLE_DEFAULTS.USER),
    },

    // ── Suggested event-specific custom roles ──────────────────────────────
    {
      name: "EVENT_COORDINATOR", label: "Event Coordinator", icon: CalendarClock, color: "#0ea5e9",
      description: "Plans and runs events end-to-end — create, schedule, manage registrations, forms, operations, media",
      permissions: new Set(EVENT_ROLE_DEFAULTS.EVENT_COORDINATOR),
      suggested: true,
    },
    {
      name: "EVENT_VOLUNTEER", label: "Volunteer", icon: HeartHandshake, color: "#10b981",
      description: "On-ground helper — check-ins, people management, operations, form viewing",
      permissions: new Set(EVENT_ROLE_DEFAULTS.EVENT_VOLUNTEER),
      suggested: true,
    },
    {
      name: "PRIEST", label: "Priest / Purohit", icon: Flame, color: "#f97316",
      description: "Manages pooja schedule and sacred forms (archana, sankalpam, homam)",
      permissions: new Set(EVENT_ROLE_DEFAULTS.PRIEST),
      suggested: true,
    },
    {
      name: "TICKET_CHECKER", label: "Ticket Checker", icon: ScanLine, color: "#64748b",
      description: "Entry gate role — scans passes, verifies registrations at the door",
      permissions: new Set(EVENT_ROLE_DEFAULTS.TICKET_CHECKER),
      suggested: true,
    },
    {
      name: "FUNDRAISING_MANAGER", label: "Fundraising Manager", icon: DollarSign, color: "#059669",
      description: "Oversees donations, sponsors and financial goals; views fundraising reports",
      permissions: new Set(EVENT_ROLE_DEFAULTS.FUNDRAISING_MANAGER),
      suggested: true,
    },
    {
      name: "MEDIA_TEAM", label: "Media Team", icon: Camera, color: "#8b5cf6",
      description: "Uploads photos and videos, manages gallery and generates event reports",
      permissions: new Set(EVENT_ROLE_DEFAULTS.MEDIA_TEAM),
      suggested: true,
    },
  ];
}

/* ─── Access Matrix Table ─── */
function AccessMatrixTable({
  roles, matrix, onToggle,
}: {
  roles: RoleConfig[];
  matrix: EventPermissionRow[];
  onToggle: (roleName: string, permKey: string) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[200px] sticky left-0 bg-slate-50 z-10">
              Sub-Menu / Feature
            </th>
            <th className="text-center px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[70px]">
              Action
            </th>
            {roles.map(r => (
              <th key={r.name} className="text-center px-2 py-3 min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${r.color}15` }}>
                    <r.icon className="w-3.5 h-3.5" style={{ color: r.color }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">{r.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {matrix.map((row, idx) => {
            if (row.isGroupHeader) {
              const expanded = expandedGroups.has(idx);
              return (
                <tr key={idx} className="bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer" onClick={() => toggleGroup(idx)}>
                  <td colSpan={2 + roles.length} className="px-4 py-2.5 sticky left-0">
                    <div className="flex items-center gap-2">
                      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700">{row.label}</span>
                      {row.childIndices && (
                        <Badge variant="outline" className="text-[8px] ml-1">{row.childIndices.length} features</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }

            const parentGroupIdx = matrix.findIndex((m, i) => i < idx && m.isGroupHeader && m.childIndices?.includes(idx));
            if (parentGroupIdx >= 0 && !expandedGroups.has(parentGroupIdx)) return null;

            const Icon = MENU_ICONS[row.label] || Shield;
            const actions: { key: "view" | "createEdit" | "delete"; perm?: string }[] = [
              { key: "view", perm: row.view },
              { key: "createEdit", perm: row.createEdit },
              { key: "delete", perm: row.delete },
            ].filter((a): a is { key: "view" | "createEdit" | "delete"; perm: string } => Boolean(a.perm));

            return actions.map((action, ai) => (
              <tr key={`${idx}-${action.key}`} className="hover:bg-slate-50/60 transition-colors">
                {ai === 0 && (
                  <td className="px-4 py-2 sticky left-0 bg-white z-10" rowSpan={actions.length}>
                    <div className={cn("flex items-center gap-2", row.isChild && "ml-4")}>
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">{row.label}</span>
                    </div>
                  </td>
                )}
                <td className="text-center px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    {(() => {
                      const AIcon = ACTION_ICONS[action.key];
                      return <AIcon className="w-3 h-3 text-slate-400" />;
                    })()}
                    <span className="text-[9px] text-slate-500">{ACTION_LABELS[action.key]}</span>
                  </div>
                </td>
                {roles.map(r => {
                  const has = action.perm ? r.permissions.has(action.perm) : false;
                  return (
                    <td key={r.name} className="text-center px-2 py-2">
                      <button
                        onClick={() => action.perm && onToggle(r.name, action.perm)}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all",
                          has
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400"
                        )}
                      >
                        {has ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Role Card ─── */
function RoleCard({ role, onSelect, selected }: {
  role: RoleConfig; onSelect: () => void; selected: boolean;
}) {
  const permCount = role.permissions.size;
  const totalPossible = EVENT_ROLE_DEFAULTS.ADMIN.length;
  const percentage = Math.round((permCount / totalPossible) * 100);

  return (
    <button onClick={onSelect}
      className={cn(
        "text-left p-3 sm:p-4 rounded-xl border-2 transition-all w-full",
        selected
          ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm"
          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm"
      )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${role.color}15` }}>
          <role.icon className="w-4 h-4" style={{ color: role.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-slate-800">{role.label}</p>
            {role.suggested && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                <Sparkles className="w-2 h-2" /> Suggested
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-400 uppercase">{role.name}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mb-2 line-clamp-2">{role.description}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[9px] gap-1">
          <Unlock className="w-2.5 h-2.5" /> {permCount} permissions
        </Badge>
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, background: role.color }} />
          </div>
          <span className="text-[9px] text-slate-400">{percentage}%</span>
        </div>
      </div>
    </button>
  );
}

/* ─── Role Detail Panel ─── */
function RoleDetailPanel({ role, matrix, onToggle, onReset }: {
  role: RoleConfig;
  matrix: EventPermissionRow[];
  onToggle: (permKey: string) => void;
  onReset: () => void;
}) {
  const allPerms = matrix
    .filter(r => !r.isGroupHeader)
    .flatMap(r => [r.view, r.createEdit, r.delete].filter(Boolean) as string[]);
  const grantedCount = allPerms.filter(p => role.permissions.has(p)).length;
  const allGranted = grantedCount === allPerms.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}15` }}>
            <role.icon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{role.label}</h4>
            <p className="text-xs text-slate-400">{role.description}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={onReset}>
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-emerald-700">{grantedCount}</p>
          <p className="text-[9px] text-emerald-500 uppercase font-bold">Granted</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-slate-500">{allPerms.length - grantedCount}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold">Denied</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-indigo-700">{allPerms.length}</p>
          <p className="text-[9px] text-indigo-400 uppercase font-bold">Total</p>
        </div>
      </div>

      {/* Per-feature toggles */}
      <div className="space-y-1">
        {matrix.filter(r => !r.isGroupHeader).map((row, idx) => {
          const Icon = MENU_ICONS[row.label] || Shield;
          const perms = [
            { key: "view", perm: row.view, label: "View", icon: Eye },
            { key: "createEdit", perm: row.createEdit, label: "Manage", icon: Pencil },
            { key: "delete", perm: row.delete, label: "Delete/Export", icon: Trash2 },
          ].filter(p => p.perm);

          return (
            <div key={idx} className="bg-white rounded-lg border border-slate-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">{row.label}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {perms.map(p => {
                  const has = role.permissions.has(p.perm!);
                  return (
                    <label key={p.key} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Switch checked={has} onCheckedChange={() => onToggle(p.perm!)}
                        className="scale-75" />
                      <div className="flex items-center gap-1">
                        <p.icon className={cn("w-3 h-3", has ? "text-emerald-500" : "text-slate-300")} />
                        <span className={cn("text-[10px] font-medium", has ? "text-slate-700" : "text-slate-400")}>{p.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Suggested Access Info ─── */
function AccessSuggestions() {
  const systemRoles = [
    {
      role: "Admin / Community Admin", icon: Crown, color: "#4f46e5",
      access: "Full access — create, edit, delete events, manage registrations, export, notify, manage all forms and fundraising.",
      menus: ["Dashboard", "Events & Schedule", "Registration", "People", "Fundraising", "Operations", "Media", "Reports", "Forms"],
    },
    {
      role: "Sports Admin", icon: Briefcase, color: "#0891b2",
      access: "View-only for most event features. Can view registrations, people, and send notifications for cross-sport events.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "People (view)", "Media", "Forms (view)"],
    },
    {
      role: "Staff", icon: Wrench, color: "#64748b",
      access: "Operational support — assist with registrations, people, operations, media, and view forms.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "People", "Operations", "Media", "Forms (view)"],
    },
    {
      role: "Member", icon: UserCheck, color: "#059669",
      access: "Browse events, register for events, view schedules, access gallery, and view forms.",
      menus: ["Dashboard", "Events & Schedule", "Media", "Forms (view)"],
    },
    {
      role: "Cashier", icon: Banknote, color: "#be185d",
      access: "On-ground financial access — view dashboard, schedules, registration data, and forms.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "Forms (view)"],
    },
    {
      role: "Vendor", icon: Banknote, color: "#d97706",
      access: "View and register for relevant events (stalls, services); access forms for bookings.",
      menus: ["Dashboard", "Events & Schedule", "Forms (view)"],
    },
    {
      role: "User", icon: Users, color: "#8b5cf6",
      access: "Minimal access — view dashboard and gallery, register for events, view forms.",
      menus: ["Dashboard (view)", "Gallery (view)", "Forms (view)"],
    },
  ];

  const suggestedRoles = [
    {
      role: "Event Coordinator", icon: CalendarClock, color: "#0ea5e9",
      access: "Dedicated event planner with end-to-end control — create events, manage registrations and forms, handle operations and media.",
      menus: ["Dashboard", "Events & Schedule", "Registration (manage)", "People (manage)", "Operations (manage)", "Media", "Forms (manage)"],
      why: "Separate from Admin so coordinators can run events without touching admin settings or user management.",
    },
    {
      role: "Volunteer", icon: HeartHandshake, color: "#10b981",
      access: "On-ground helper for check-ins, crowd management, and operational support.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "People (manage)", "Operations", "Gallery", "Forms (view)"],
      why: "Restricts financial and notification access while enabling all ground-level tasks.",
    },
    {
      role: "Priest / Purohit", icon: Flame, color: "#f97316",
      access: "Manages pooja schedule and sacred forms — archana requests, sankalpam, homam sign-ups.",
      menus: ["Dashboard", "Events & Schedule", "Forms (manage — Pooja only)", "Notifications (send)"],
      why: "Purpose-built role for religious event coordinators with no access to financials or registrations.",
    },
    {
      role: "Ticket Checker", icon: ScanLine, color: "#64748b",
      access: "Entry gate role — scans QR passes and verifies attendee registrations at the door.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "Forms (view)"],
      why: "Minimal read-only access tailored for on-ground entry verification without any management capability.",
    },
    {
      role: "Fundraising Manager", icon: DollarSign, color: "#059669",
      access: "Manages donations, sponsors, and financial goals; views fundraising reports and donation forms.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "Fundraising (manage)", "Reports (view)", "Forms (view)"],
      why: "Gives financial ownership without event creation or people management access.",
    },
    {
      role: "Media Team", icon: Camera, color: "#8b5cf6",
      access: "Uploads photos/videos, manages gallery, generates event reports.",
      menus: ["Dashboard", "Events & Schedule", "Media (manage)", "Gallery (manage)", "Reports (manage)", "Forms (view)"],
      why: "Scoped to content and reporting — no access to registrations, people, or financials.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* System roles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-bold text-slate-700">System Roles — Event Access</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {systemRoles.map(s => (
            <div key={s.role} className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-bold text-slate-800">{s.role}</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">{s.access}</p>
              <div className="flex flex-wrap gap-1">
                {s.menus.map(m => (
                  <Badge key={m} variant="outline" className="text-[8px] py-0">{m}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested custom roles */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-bold text-slate-700">Suggested Custom Roles for Events</h4>
          <span className="text-[10px] text-slate-400">— create these in Admin Hub → Roles</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          These roles don't exist as system defaults. Create them as custom roles in Admin Hub and assign the permissions shown in "By Role" view above.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestedRoles.map(s => (
            <div key={s.role} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}20` }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{s.role}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full">NEW</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 mb-1.5">{s.access}</p>
              <p className="text-[9px] text-amber-700 italic mb-2">💡 {s.why}</p>
              <div className="flex flex-wrap gap-1">
                {s.menus.map(m => (
                  <Badge key={m} className="text-[8px] py-0 bg-amber-100 text-amber-800 border-amber-200">{m}</Badge>
                ))}
              </div>
              <button className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 transition-colors">
                <Plus className="w-3 h-3" /> Create this role in Admin Hub
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function EventsAccessManagement() {
  const [roles, setRoles] = useState<RoleConfig[]>(buildRoles);
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [viewMode, setViewMode] = useState<"matrix" | "role" | "suggestions">("role");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeRole = roles.find(r => r.name === selectedRole)!;
  const systemRoles = roles.filter(r => !r.suggested);
  const suggestedRoles = roles.filter(r => r.suggested);

  const handleToggle = (roleName: string, permKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r.name !== roleName) return r;
      const next = new Set(r.permissions);
      if (next.has(permKey)) next.delete(permKey); else next.add(permKey);
      return { ...r, permissions: next };
    }));
    setSaved(false);
  };

  const handleReset = (roleName: string) => {
    const defaults = EVENT_ROLE_DEFAULTS[roleName];
    if (!defaults) return;
    setRoles(prev => prev.map(r =>
      r.name === roleName ? { ...r, permissions: new Set(defaults) } : r
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Event Access & Roles</h2>
            <p className="text-xs text-slate-400">
              Admin Hub only — configure per-role event permissions and review suggested custom roles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-100 shadow-sm w-fit">
        {([
          { id: "role" as const, label: "By Role", icon: Users },
          { id: "matrix" as const, label: "Access Matrix", icon: Shield },
          { id: "suggestions" as const, label: "Suggestions", icon: Sparkles },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setViewMode(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              viewMode === tab.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100"
            )}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "matrix" && (
        <AccessMatrixTable
          roles={roles}
          matrix={EVENT_PERMISSION_MATRIX}
          onToggle={handleToggle}
        />
      )}

      {viewMode === "role" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Role list — split into system + suggested */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> System Roles ({systemRoles.length})
              </p>
              {systemRoles.map(r => (
                <RoleCard key={r.name} role={r} selected={selectedRole === r.name}
                  onSelect={() => setSelectedRole(r.name)} />
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Suggested Custom Roles ({suggestedRoles.length})
              </p>
              {suggestedRoles.map(r => (
                <RoleCard key={r.name} role={r} selected={selectedRole === r.name}
                  onSelect={() => setSelectedRole(r.name)} />
              ))}
            </div>
          </div>
          {/* Detail panel */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {activeRole?.suggested && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>This is a <strong>suggested custom role</strong>. Create it in <strong>Admin Hub → Roles</strong> and assign the permissions below to activate it.</span>
                </div>
              )}
              <RoleDetailPanel
                role={activeRole}
                matrix={EVENT_PERMISSION_MATRIX}
                onToggle={(perm) => handleToggle(selectedRole, perm)}
                onReset={() => handleReset(selectedRole)}
              />
            </div>
          </div>
        </div>
      )}

      {viewMode === "suggestions" && <AccessSuggestions />}

      {/* End-User vs Admin Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 sm:p-5 border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> Admin vs End-User Access Guide
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Admin Access
            </p>
            <ul className="space-y-1 text-[10px] text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Create & manage events (create, edit, delete)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Manage registrations (confirm, reject, export)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Send & schedule notifications to attendees</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Manage people, volunteers, committees</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Handle fundraising, sponsors, donations</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Configure operations, logistics, vendors</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Upload media, generate reports</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Print passes, export registrant lists</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> End-User (Member) Access
            </p>
            <ul className="space-y-1 text-[10px] text-slate-600">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> View event dashboard & upcoming events</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Browse event schedules & day programs</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Register for events (public registration)</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> View & download their event pass</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Browse event gallery & media</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-rose-400 shrink-0" /> Cannot create or edit events</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-rose-400 shrink-0" /> Cannot manage other registrations</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-rose-400 shrink-0" /> Cannot access fundraising or operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
