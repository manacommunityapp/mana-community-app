import { useState } from "react";
import {
  Shield, Users, Eye, Pencil, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, Info, LayoutDashboard, CalendarDays, Ticket,
  HandHeart, UtensilsCrossed, ImageIcon, Bell, UserCheck, Lock,
  Unlock, Copy, RotateCcw, Save, AlertCircle, Loader2, Crown,
  Briefcase, Banknote, Wrench, Camera,
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
    {
      name: "ADMIN", label: "Admin", icon: Crown, color: "#4f46e5",
      description: "Full access to all event features including creation, management, and notifications",
      permissions: new Set(EVENT_ROLE_DEFAULTS.ADMIN),
    },
    {
      name: "COMMUNITY_ADMIN", label: "Community Admin", icon: Shield, color: "#7c3aed",
      description: "Full event management within the community scope",
      permissions: new Set(EVENT_ROLE_DEFAULTS.COMMUNITY_ADMIN),
    },
    {
      name: "SPORTS_ADMIN", label: "Sports Admin", icon: Briefcase, color: "#0891b2",
      description: "View events, manage registrations, send notifications",
      permissions: new Set(EVENT_ROLE_DEFAULTS.SPORTS_ADMIN),
    },
    {
      name: "MEMBER", label: "Member", icon: UserCheck, color: "#059669",
      description: "View events and schedules, register for events, view media",
      permissions: new Set(EVENT_ROLE_DEFAULTS.MEMBER),
    },
    {
      name: "VENDOR", label: "Vendor", icon: Banknote, color: "#d97706",
      description: "View and register for events relevant to vendor operations",
      permissions: new Set(EVENT_ROLE_DEFAULTS.VENDOR),
    },
    {
      name: "CASHIER", label: "Cashier", icon: Banknote, color: "#be185d",
      description: "View dashboard, schedules, and registration data",
      permissions: new Set(EVENT_ROLE_DEFAULTS.CASHIER),
    },
    {
      name: "STAFF", label: "Staff", icon: Wrench, color: "#64748b",
      description: "View and support event operations, people, and media",
      permissions: new Set(EVENT_ROLE_DEFAULTS.STAFF),
    },
    {
      name: "USER", label: "User", icon: Users, color: "#8b5cf6",
      description: "View-only access to dashboard and gallery, can register for events",
      permissions: new Set(EVENT_ROLE_DEFAULTS.USER),
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
        "text-left p-3 sm:p-4 rounded-xl border-2 transition-all",
        selected
          ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm"
          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm"
      )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${role.color}15` }}>
          <role.icon className="w-4 h-4" style={{ color: role.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{role.label}</p>
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
  const suggestions = [
    {
      role: "Admin / Community Admin", icon: Crown, color: "#4f46e5",
      access: "Full access to all event sub-menus. Can create, edit, delete events, manage registrations, export data, send notifications, manage fundraising and operations.",
      menus: ["Dashboard", "Events & Schedule", "Registration", "People", "Fundraising", "Operations", "Media & Reports"],
    },
    {
      role: "Sports Admin", icon: Briefcase, color: "#0891b2",
      access: "View-only for most event features. Can view registrations, people, and send notifications for cross-sport events.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "People (view)", "Media & Reports"],
    },
    {
      role: "Staff", icon: Wrench, color: "#64748b",
      access: "Operational support. Can view and help with registrations, people management, operations tasks, and media.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)", "People", "Operations", "Media & Reports"],
    },
    {
      role: "Member", icon: UserCheck, color: "#059669",
      access: "End-user access. Can browse events, register, view schedules, and access media/gallery.",
      menus: ["Dashboard", "Events & Schedule", "Registration (register only)", "Media & Reports"],
    },
    {
      role: "Vendor", icon: Banknote, color: "#d97706",
      access: "Limited access. Can view events and register for relevant ones (stalls, services).",
      menus: ["Dashboard", "Events & Schedule"],
    },
    {
      role: "Cashier", icon: Banknote, color: "#be185d",
      access: "Financial/check-in access. Can view dashboard stats, schedules, and registration data for on-ground operations.",
      menus: ["Dashboard", "Events & Schedule", "Registration (view)"],
    },
    {
      role: "User", icon: Users, color: "#8b5cf6",
      access: "Basic end-user access. Can view the dashboard and gallery in view-only mode, and register for events. No access to reports.",
      menus: ["Dashboard (view)", "Gallery (view only)", "Registration (register only)"],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Info className="w-4 h-4 text-indigo-500" />
        <h4 className="text-sm font-bold text-slate-700">Suggested Access by Role</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map(s => (
          <div key={s.role} className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-sm font-bold text-slate-800">{s.role}</span>
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
            <h2 className="text-lg font-bold text-slate-800">Event Access Management</h2>
            <p className="text-xs text-slate-400">Configure which roles can access each event sub-menu</p>
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
          { id: "suggestions" as const, label: "Suggestions", icon: Info },
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
          {/* Role list */}
          <div className="lg:col-span-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Roles ({roles.length})</p>
            <div className="space-y-2">
              {roles.map(r => (
                <RoleCard key={r.name} role={r} selected={selectedRole === r.name}
                  onSelect={() => setSelectedRole(r.name)} />
              ))}
            </div>
          </div>
          {/* Detail panel */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
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
