import { Navigate } from "react-router";
import { useAuth } from "../../../../contexts/AuthContext";
import { ShieldAlert, PackageX } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Single permission — user must have this exact key */
  permission?: string;
  /** OR-based check — user must have at least one of these keys */
  anyPermissions?: string[];
  /** Restrict strictly to the SUPER_ADMIN role (no permission grants this) */
  superAdminOnly?: boolean;
  /** Community module key required (e.g. "SPORTS", "MARKETPLACE"). Blocked if module is disabled for the user's community. */
  requiredModule?: string;
}

export function PermissionGuard({ children, permission, anyPermissions, superAdminOnly, requiredModule }: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // SUPER_ADMIN role bypasses all permission constraints
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // ── Community module gate ──────────────────────────────────────────
  // If a required module is specified, check the user's enabledModules
  // list (populated from the community_module table via /users/me).
  const enabledModules = user.enabledModules || [];
  if (requiredModule && enabledModules.length > 0 && !enabledModules.includes(requiredModule)) {
    return renderModuleDisabled(requiredModule);
  }

  const userPerms = user.permissions || [];
  // superAdminOnly views are never accessible to non-super-admins, regardless of permissions
  if (superAdminOnly) {
    return renderAccessDenied();
  }
  let hasAccess = false;
  if (permission) {
    hasAccess = userPerms.includes(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = anyPermissions.some(p => userPerms.includes(p));
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return renderAccessDenied();
  }

  return <>{children}</>;
}

function renderModuleDisabled(moduleKey: string) {
  const label = MODULE_LABELS[moduleKey] || moduleKey;
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
      <div className="p-4 bg-amber-50 text-amber-600 rounded-full border border-amber-100 mb-5">
        <PackageX className="w-10 h-10 text-amber-600" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Module Not Available</h2>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
        The <strong>{label}</strong> module is not enabled for your community.
        Please contact your community administrator to enable it.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
}

function renderAccessDenied() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
      <div className="p-4 bg-red-50 text-red-600 rounded-full border border-red-100 mb-5 animate-bounce">
        <ShieldAlert className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
        Your active security role profile does not grant you permissions to access this view.
        Please contact your community administrator if you believe this is an error.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
}

/** Friendly display labels for community module keys */
const MODULE_LABELS: Record<string, string> = {
  COMMUNITY_FEED: "Community Feed",
  SPORTS: "Sports",
  MARKETPLACE: "Marketplace",
  VISITORS: "Visitors",
  NOTICES: "Notices",
  BOOKINGS: "Bookings",
  HELPDESK: "Helpdesk",
  POLLS: "Polls",
  JOBS: "Jobs & Referrals",
  EVENTS: "Events",
  COMMUNITY_MGMT: "Community Management",
  FINANCE_MGMT: "Finance Management",
  ADMIN_HUB: "Admin Hub",
};

