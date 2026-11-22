import { Navigate } from "react-router";
import { useAuth } from "../../../../contexts/AuthContext";
import { ShieldAlert, PackageX, Loader2 } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Single permission — user must have this exact key */
  permission?: string;
  /** OR-based check — user must have at least one of these keys */
  anyPermissions?: string[];
  /** Restrict strictly to the SUPER_ADMIN role (no permission grants this) */
  superAdminOnly?: boolean;
  /** Restrict strictly to admin roles (ADMIN, COMMUNITY_ADMIN, SUPER_ADMIN) */
  adminOnly?: boolean;
  /** Restrict strictly to admin or sports admin roles (SPORTS_ADMIN, ADMIN, COMMUNITY_ADMIN, SUPER_ADMIN) */
  sportsAdminOnly?: boolean;
  /** Restrict strictly to vendor roles (VENDOR, SPORTS_VENDOR, VENDOR_ADMIN, or admin override) */
  vendorOnly?: boolean;
  /** Community module key required (e.g. "SPORTS", "MARKETPLACE"). Blocked if module is disabled for the user's community. */
  requiredModule?: string;
  /** OR-based module check — community must have at least one of these enabled (e.g. ["FINANCE_MGMT", "PAYMENTS"]) */
  anyModules?: string[];
}

export function PermissionGuard({ children, permission, anyPermissions, superAdminOnly, adminOnly, sportsAdminOnly, vendorOnly, requiredModule, anyModules }: PermissionGuardProps) {
  const { user, isSuperAdmin, isAdmin, isSportsAdmin, authSyncStatus } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // SUPER_ADMIN role bypasses all permission & module constraints
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // ── Community module gate ──────────────────────────────────────────
  // The module list is populated from the community_module table via
  // /users/me. `undefined` means "not loaded yet" — it must NEVER be read as
  // "allowed", or every module gate is open in the window right after login.
  // An *array* (including an empty one) means the server answered and the list
  // is authoritative, so a missing module is a real denial.
  const modulesLoaded = Array.isArray(user.enabledModules);
  const enabledModules = user.enabledModules ?? [];
  const needsModuleCheck = !!requiredModule || (!!anyModules && anyModules.length > 0);

  if (needsModuleCheck && !modulesLoaded) {
    if (authSyncStatus === "error") {
      // /users/me failed: we cannot prove access, so deny rather than guess.
      return renderPermissionsUnavailable();
    }
    return renderLoadingGate();
  }
  if (requiredModule && !enabledModules.includes(requiredModule)) {
    return renderModuleDisabled(requiredModule);
  }
  if (anyModules && anyModules.length > 0 && !anyModules.some((m) => enabledModules.includes(m))) {
    return renderModuleDisabled(anyModules[0]);
  }

  const userPerms = user.permissions || [];
  // Role/permission data is still arriving from /users/me while authSyncStatus is
  // "loading". Denying is always safe, but showing the loading state avoids an
  // "Access Denied" flash for users who do in fact have the role. Either way the
  // protected children are never rendered.
  const denyOrWait = () =>
    authSyncStatus === "loading" ? renderLoadingGate() : renderAccessDenied();

  // superAdminOnly views are never accessible to non-super-admins, regardless of permissions
  if (superAdminOnly) {
    return denyOrWait();
  }
  // adminOnly views are restricted strictly to users with admin roles
  if (adminOnly && !isAdmin) {
    return denyOrWait();
  }
  // sportsAdminOnly views are restricted strictly to admin or sports admin roles
  if (sportsAdminOnly && !isAdmin && !isSportsAdmin) {
    return denyOrWait();
  }
  // vendorOnly views are restricted strictly to vendors or managing admins
  if (vendorOnly) {
    const userRoles = [
      ...(user.roles || []),
      ...(user.role ? user.role.split(",").map((r) => r.trim()) : []),
    ].map((r) => r.toUpperCase());
    const isVendorRole =
      userRoles.includes("VENDOR") ||
      userRoles.includes("SPORTS_VENDOR") ||
      userRoles.includes("VENDOR_ADMIN");
    if (!isVendorRole && !isAdmin && !isSuperAdmin) {
      return denyOrWait();
    }
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
    // Permissions also arrive with /users/me. While that is in flight we show
    // the loading state instead of a misleading "Access Denied" flash — but we
    // still render nothing of the protected view, so this never fails open.
    return denyOrWait();
  }

  return <>{children}</>;
}

function renderLoadingGate() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-500 text-xs font-semibold">Verifying your access…</p>
    </div>
  );
}

function renderPermissionsUnavailable() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
      <div className="p-4 bg-amber-50 text-amber-600 rounded-full border border-amber-100 mb-5">
        <ShieldAlert className="w-10 h-10 text-amber-600" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Could Not Be Verified</h2>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mb-6 leading-relaxed font-semibold">
        We could not load your permissions from the server, so this view stays locked.
        Please check your connection and reload.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
      >
        Reload
      </button>
    </div>
  );
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
  SERVICE_PLATFORM: "Service Platform",
  COMMERCE: "Community Commerce",
  SAFETY: "Safety & Security",
  PAYMENTS: "Mana Pay",
  MANA_PAY: "Mana Pay",
  ENTERTAINMENT: "Entertainment & Movies",
  MOVIES: "Entertainment & Movies",
  FOOD_OS: "Food & Lifestyle",
  VENDOR_MANAGEMENT: "Vendor Management",
  GROUP_BUYING: "Group Buying",
  EMERGENCY: "Emergency & SOS",
  TRIPS: "Community Trips",
  DISCOVER: "Discover",
  MAINTENANCE: "Maintenance",
  INSURANCE: "Insurance Hub",
  ACADEMY: "Academy Hub",
};

