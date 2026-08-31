import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Shield,
  Users,
  Search,
  UserPlus,
  ArrowLeft,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Check,
  Building,
  Mail,
  Phone,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  X,
  Key,
  ChevronRight,
  Lock,
  Unlock,
  MonitorPlay,
  Save,
  UserCog,
  Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { userService } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { communityService } from "../../../services/community/communityService";
import { PERMISSION_CATEGORIES, SPORTS_PERMISSION_MATRIX, EVENT_PERMISSION_MATRIX, MANAGE_COMMUNITIES as PERM_MANAGE_COMMUNITIES } from "../../../constants/permissions";
import type { SportsPermissionRow, EventPermissionRow } from "../../../constants/permissions";
import type { CommunityResponse, UserResponse } from "../../../types/api";
import { sortRoles, sortRoleStrings } from "../../../utils/roleUtils";


// --- TYPES ---
interface UserItem {
  id: number;
  name: string;
  email: string;
  contact: string;
  role: string;
  roles?: string[];
  status: "Active" | "Inactive";
  date: string;
  permissions?: string[];
}

interface PermissionCategory {
  id: string;
  title: string;
  permissions: string[];
}

// --- CONFIG ---
const permissionCategories = PERMISSION_CATEGORIES;

export function AdminRoleManagement() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, updateUser } = useAuth();

  const canManageCommunities = isSuperAdmin || (user?.permissions || []).includes(PERM_MANAGE_COMMUNITIES);

  // STATE MANAGEMENT
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<number | "">("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [currentView, setCurrentView] = useState<'list' | 'editRole'>('list');
  const [editingRole, setEditingRole] = useState<string>('Cashier');
  const [editingRoleName, setEditingRoleName] = useState<string>('Cashier');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [updatingUserRoles, setUpdatingUserRoles] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Custom Roles & Tab States
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("roleTab") as 'users' | 'roles') || 'users';
  const setActiveTab = (tab: 'users' | 'roles') => {
    setSearchParams((prev) => {
      prev.set("roleTab", tab);
      return prev;
    }, { replace: true });
  };
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [loadingEditPerms, setLoadingEditPerms] = useState(false);
  const [savedRoles, setSavedRoles] = useState<string[] | null>(null);

  // Edit User Details modal state
  const [editUserDetailsOpen, setEditUserDetailsOpen] = useState(false);
  const [editUserDetailsData, setEditUserDetailsData] = useState<{
    id: number;
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    block: string;
    tower: string;
    flatNo: string;
    residentType: string;
    occupancyStatus: string;
    employeeId: string;
    govtIdType: string;
    govtIdNumber: string;
  } | null>(null);
  const [savingUserDetails, setSavingUserDetails] = useState(false);

  const loadPermissions = async () => {
    try {
      const dbPerms = await userService.getRolePermissions();
      const mappedPerms: Record<string, Record<string, boolean>> = {};
      
      Object.entries(dbPerms).forEach(([role, perms]) => {
        const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        mappedPerms[normalizedRole] = {};
        perms.forEach((p) => {
          mappedPerms[normalizedRole][p] = true;
        });
      });
      
      setRolePermissions(mappedPerms);
    } catch (err) {
      toast.error("Failed to load role permissions from database");
    }
  };

  const loadRoles = async () => {
    try {
      const data = await userService.getRoles();
      const filtered = (data || []).filter(
        (r) => !["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r.name.toUpperCase())
      );
      setRoles(sortRoles(filtered));
    } catch (err) {
      toast.error("Failed to load security roles from database");
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      communityService.getCommunities().then(setCommunities).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadUsers(selectedCommId);
  }, [selectedCommId]);

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setIsCreatingRole(true);
    try {
      const created = await userService.createRole(newRoleName);
      setRoles((prev) => sortRoles([...prev, created]));
      
      const normalizedRole = created.name.charAt(0).toUpperCase() + created.name.slice(1).toLowerCase();
      // Initialize empty permissions map for this role
      setRolePermissions((prev) => ({
        ...prev,
        [normalizedRole]: {}
      }));
      
      toast.success(`Role "${created.name}" created successfully!`);
      setNewRoleName("");
      setIsCreateRoleOpen(false);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to create role";
      toast.error(errorMsg);
    } finally {
      setIsCreatingRole(false);
    }
  };

  const loadUsers = async (commId?: number | "") => {
    setLoading(true);
    try {
      const activeCommId = commId !== undefined ? commId : selectedCommId;
      const data = (isSuperAdmin && activeCommId) 
        ? await userService.getCommunityUsers(Number(activeCommId))
        : await userService.getAllUsers();
      
      let usersList: UserResponse[] = [];
      if (data) {
        if (Array.isArray(data)) {
          usersList = data;
        } else if (typeof data === "object" && Array.isArray((data as any).content)) {
          usersList = (data as any).content;
        }
      }

      const mapped = usersList.map((u) => {
        const rawRole = u.role || "USER";
        const rolesList = (u.roles && u.roles.length > 0
          ? u.roles.map((r) => r.trim().toUpperCase())
          : rawRole.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean)
        ).map((r) => ["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r) ? "ADMIN" : r);
        const displayRole = rawRole.split(",")
          .map((r) => r.trim().toUpperCase())
          .map((r) => ["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r) ? "ADMIN" : r)
          .join(", ");
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          contact: u.phone,
          role: displayRole,
          roles: rolesList,
          status: u.isActive ? ("Active" as const) : ("Inactive" as const),
          date: u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "Unknown",
          permissions: u.permissions,
        };
      });
      setUsers(mapped);
    } catch (err) {
      toast.error("Failed to load users from database");
    } finally {
      setLoading(false);
    }
  };

  // SEARCH AND FILTER
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.contact.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    inactive: users.filter((u) => u.status === 'Inactive').length,
    rolesCount: Array.from(new Set(users.map((u) => u.role))).length,
  };

  // HANDLERS
  const openUserDetails = (u: UserItem) => {
    setSelectedUser(u);
    const initialRoles = u.roles && u.roles.length > 0
      ? u.roles.map((r) => r.toUpperCase())
      : u.role.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean);
    // Ensure USER base role is always present
    if (!initialRoles.includes("USER")) initialRoles.push("USER");
    setSelectedUserRoles(initialRoles);
  };

  const toggleSelectedRole = (roleName: string) => {
    const normalized = roleName.toUpperCase();
    if (normalized === "USER") return; // USER is always assigned
    setSelectedUserRoles((prev) =>
      prev.includes(normalized)
        ? prev.filter((r) => r !== normalized)
        : [...prev, normalized]
    );
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    if (selectedUserRoles.length === 0) {
      toast.error("At least one role must be selected for the user");
      return;
    }
    setUpdatingUserRoles(true);
    try {
      // Every user always retains the USER base role
      const rolesToSend = selectedUserRoles.includes("USER")
        ? selectedUserRoles
        : [...selectedUserRoles, "USER"];

      // PUT /api/users/{id}/role — backend reads `roles` array, stores comma-joined,
      // creates combined permissions, and returns 200 with full UserResponse.
      const saved = await userService.updateUserRole(selectedUser.id, rolesToSend);

      // Backend returns 200 with role, roles[], and permissions[] populated.
      // Use response data when available; fall back to what we sent if not.
      const roleStr = saved?.role ?? rolesToSend.join(", ");
      const rolesArr = (saved?.roles && saved.roles.length > 0)
        ? saved.roles.map((r: string) => r.toUpperCase())
        : rolesToSend.map((r) => r.toUpperCase());
      const perms = saved?.permissions;

      toast.success(`Roles saved for ${selectedUser.name}: ${rolesArr.join(", ")}`);
      toast.info(`API response — role: "${saved?.role ?? "(none)"}" | roles: [${saved?.roles?.join(", ") ?? "(none)"}] | type: ${typeof saved}`, { duration: 8000 });

      // Update the users table immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, role: roleStr, roles: rolesArr, permissions: perms }
            : u
        )
      );

      // Update the open modal
      setSelectedUser((prev) =>
        prev ? { ...prev, role: roleStr, roles: rolesArr, permissions: perms } : null
      );

      setSavedRoles(rolesArr);

      // Delay the re-sync so the backend has time to persist the write.
      // The optimistic updates above already show correct data immediately.
      setTimeout(() => { loadUsers().catch(() => {}); }, 2000);

      // If we changed the logged-in user's own roles, refresh AuthContext so menus update
      if (user && String(selectedUser.id) === String(user.userId)) {
        userService.getMe().then((me) => {
          updateUser({
            role: me.role,
            roles: me.roles,
            permissions: me.permissions ?? [],
            enabledModules: me.enabledModules,
          });
        }).catch(() => {});
      }
    } catch (err: any) {
      let errorMsg = "Failed to update user roles";
      try {
        const parsed = JSON.parse(err?.message ?? "");
        errorMsg = parsed?.message ?? parsed?.error ?? errorMsg;
      } catch {
        if (err?.message) errorMsg = err.message;
      }
      toast.error(errorMsg);
    } finally {
      setUpdatingUserRoles(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      await userService.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
            toast.success(`Status of ${u.name} set to ${newStatus}`);
            return { ...u, status: newStatus };
          }
          return u;
        })
      );
    } catch (err) {
      toast.error("Failed to update status in database");
    }
  };

  const handleEditRole = async (roleName: string, userId?: number) => {
    setEditingRole(roleName);
    setEditingRoleName(roleName);
    setEditingUserId(userId || null);
    setCurrentView('editRole');
    setLoadingEditPerms(true);

    if (userId) {
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        const initialRoles = targetUser.roles && targetUser.roles.length > 0
          ? targetUser.roles.map((r) => r.toUpperCase())
          : targetUser.role.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean);
        setSelectedUserRoles(initialRoles);
      } else {
        setSelectedUserRoles([roleName.toUpperCase()]);
      }
    } else {
      setSelectedUserRoles([roleName.toUpperCase()]);
    }

    try {
      let permsArray: string[] = [];

      if (userId) {
        // Fetch fresh user-specific permissions from backend
        const freshUser = await userService.getUserById(userId);
        permsArray = freshUser.permissions ?? [];
      } else {
        // Use already-loaded role permissions from state (GET /api/roles/{role}/permissions not supported)
        const titleCase = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
        const loadedObj = rolePermissions[roleName] ?? rolePermissions[titleCase] ?? {};
        permsArray = Object.keys(loadedObj).filter(k => loadedObj[k]);
      }

      const permsObj: Record<string, boolean> = {};
      permsArray.forEach((p) => { permsObj[p] = true; });

      setRolePermissions((prev) => ({
        ...prev,
        [roleName]: permsObj,
      }));
    } catch {
      toast.error("Failed to load permissions from database");
      if (!rolePermissions[roleName]) {
        setRolePermissions((prev) => ({ ...prev, [roleName]: {} }));
      }
    } finally {
      setLoadingEditPerms(false);
    }
  };

  const toggleRoleOnEditView = async (roleKey: string) => {
    const norm = roleKey.toUpperCase();
    if (norm === "USER") return; // USER is always assigned
    const isCurrentlyActive = selectedUserRoles.includes(norm);
    const updatedRoles = isCurrentlyActive
      ? selectedUserRoles.filter((r) => r !== norm)
      : [...selectedUserRoles, norm];

    setSelectedUserRoles(updatedRoles);

    // If adding a role, merge its default permissions into active state from already-loaded data
    if (!isCurrentlyActive) {
      const titleCase = norm.charAt(0) + norm.slice(1).toLowerCase();
      const loadedObj = rolePermissions[norm] ?? rolePermissions[titleCase] ?? {};
      const rolePerms = Object.keys(loadedObj).filter(k => loadedObj[k]);
      if (rolePerms.length > 0) {
        setRolePermissions((prev) => {
          const currentObj = prev[editingRole] ? { ...prev[editingRole] } : {};
          rolePerms.forEach((p) => { currentObj[p] = true; });
          return { ...prev, [editingRole]: currentObj };
        });
        toast.info(`Merged permissions from ${norm} role`);
      }
    }
  };

  const handleTogglePermission = (role: string, permission: string) => {
    setRolePermissions((prev) => {
      const rolePerms = prev[role] ? { ...prev[role] } : {};
      rolePerms[permission] = !rolePerms[permission];
      return {
        ...prev,
        [role]: rolePerms
      };
    });
  };

  const handleSelectAllCategory = (role: string, categoryId: string, selectAll: boolean) => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return;

    setRolePermissions((prev) => {
      const rolePerms = prev[role] ? { ...prev[role] } : {};
      category.permissions.forEach((perm) => {
        rolePerms[perm] = selectAll;
      });
      return {
        ...prev,
        [role]: rolePerms
      };
    });
  };

  const handleUpdateRole = async () => {
    if (!editingRoleName.trim()) {
      toast.error("Role Name cannot be empty");
      return;
    }

    try {
      const rolePermsObj = rolePermissions[editingRole] || {};
      const checkedPerms = Object.keys(rolePermsObj).filter((k) => !!rolePermsObj[k]);

      if (editingUserId) {
        // Save user's multi-role assignment and custom permissions
        const rawRolesToSave = selectedUserRoles.length > 0 ? selectedUserRoles : [editingRoleName.toUpperCase()];
        const rolesToSave = rawRolesToSave.includes("USER") ? rawRolesToSave : [...rawRolesToSave, "USER"];
        const saved = await userService.updateUserRole(editingUserId, rolesToSave);
        await userService.updateRolePermissions(editingRoleName.toUpperCase(), checkedPerms, editingUserId);

        const roleStr = saved?.role ?? rolesToSave.join(", ");
        const rolesArr = (saved?.roles && saved.roles.length > 0)
          ? saved.roles.map((r: string) => r.toUpperCase())
          : rolesToSave.map((r) => r.toUpperCase());
        const perms = saved?.permissions;

        toast.success(`Saved assigned roles (${rolesArr.join(", ")}) and permissions for user`);

        // Optimistic update so the table shows new roles immediately
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUserId
              ? { ...u, role: roleStr, roles: rolesArr, permissions: perms }
              : u
          )
        );
      } else {
        // Save role-level permissions
        await userService.updateRolePermissions(editingRoleName.toUpperCase(), checkedPerms);
        toast.success(`Updated permissions for ${editingRoleName}`);
      }

      setRolePermissions((prev) => {
        const copy = { ...prev };
        if (editingRoleName !== editingRole) {
          copy[editingRoleName] = rolePermsObj;
          delete copy[editingRole];
        } else {
          copy[editingRoleName] = rolePermsObj;
        }
        return copy;
      });

      // Delay re-sync so the backend has time to persist
      setTimeout(() => { loadUsers().catch(() => {}); }, 2000);
      setCurrentView('list');
    } catch (err) {
      toast.error("Failed to update role permissions in database");
    }
  };

  const openEditUserDetails = (u: UserItem) => {
    setEditUserDetailsData({
      id: u.id,
      fullName: u.name,
      email: u.email,
      phone: u.contact,
      dateOfBirth: "",
      gender: "",
      block: "",
      tower: "",
      flatNo: "",
      residentType: "",
      occupancyStatus: "",
      employeeId: "",
      govtIdType: "",
      govtIdNumber: "",
    });
    // Fetch fresh data to populate all fields
    userService.getUserById(u.id).then((freshUser) => {
      setEditUserDetailsData({
        id: u.id,
        fullName: freshUser.fullName ?? u.name,
        email: freshUser.email ?? u.email,
        phone: freshUser.phone ?? u.contact,
        dateOfBirth: freshUser.dateOfBirth ?? "",
        gender: freshUser.gender ?? "",
        block: freshUser.block ?? "",
        tower: (freshUser as any).tower ?? "",
        flatNo: freshUser.flatNo ?? "",
        residentType: freshUser.residentType ?? "",
        occupancyStatus: freshUser.occupancyStatus ?? "",
        employeeId: (freshUser as any).employeeId ?? "",
        govtIdType: (freshUser as any).govtIdType ?? "",
        govtIdNumber: (freshUser as any).govtIdNumber ?? "",
      });
    }).catch(() => {});
    setEditUserDetailsOpen(true);
  };

  const handleSaveUserDetails = async () => {
    if (!editUserDetailsData) return;
    setSavingUserDetails(true);
    try {
      await userService.updateUser(editUserDetailsData.id, {
        fullName: editUserDetailsData.fullName,
        email: editUserDetailsData.email,
        phone: editUserDetailsData.phone,
        dateOfBirth: editUserDetailsData.dateOfBirth || undefined,
        gender: editUserDetailsData.gender || undefined,
        block: editUserDetailsData.block || undefined,
        tower: editUserDetailsData.tower || undefined,
        flatNo: editUserDetailsData.flatNo || undefined,
        residentType: editUserDetailsData.residentType || undefined,
        occupancyStatus: editUserDetailsData.occupancyStatus || undefined,
        employeeId: editUserDetailsData.employeeId || undefined,
        govtIdType: editUserDetailsData.govtIdType || undefined,
        govtIdNumber: editUserDetailsData.govtIdNumber || undefined,
      } as any);
      toast.success(`User details updated for ${editUserDetailsData.fullName}`);
      // Update local list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUserDetailsData.id
            ? { ...u, name: editUserDetailsData.fullName, email: editUserDetailsData.email, contact: editUserDetailsData.phone }
            : u
        )
      );
      setEditUserDetailsOpen(false);
      setEditUserDetailsData(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user details");
    } finally {
      setSavingUserDetails(false);
    }
  };

  const isCategoryAllSelected = (role: string, categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    const rolePerms = rolePermissions[role] || {};
    return category.permissions.every((perm) => !!rolePerms[perm]);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentView === 'editRole') {
                setCurrentView('list');
              } else {
                navigate("/admin");
              }
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-600 animate-pulse" />
              {currentView === 'list'
                ? "Community Users & Roles"
                : `Edit Role: ${editingRole}`}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {currentView === 'list'
                ? "Manage users, toggle access status, and configure role-based permissions"
                : "Assign granular action permissions to this security role"}
            </p>
          </div>
        </div>

        {currentView === 'list' && (
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <select
                value={selectedCommId}
                onChange={(e) => setSelectedCommId(e.target.value ? Number(e.target.value) : "")}
                className="px-4 py-2 bg-[#0c1220] border border-[#2a3a5c] rounded-lg text-[#f1f5f9] text-sm font-medium focus:border-[#f97316] outline-none active:scale-95 cursor-pointer shadow-sm"
              >
                <option value="" className="bg-[#0c1220]">All Communities</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0c1220]">
                    {c.name}
                  </option>
                ))}
              </select>
            )}
             <button
               onClick={() => setIsCreateRoleOpen(true)}
               className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 hover:shadow-lg active:scale-95 cursor-pointer"
             >
               <Shield className="w-4 h-4" />
               Create Role
             </button>
             <button
               onClick={() => navigate("/admin/create-user")}
               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
             >
               <UserPlus className="w-4 h-4" />
               Create User
             </button>
             <button
               onClick={() => navigate("/admin/bulk-upload")}
               className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
             >
               <FileText className="w-4 h-4" />
               Bulk Upload
             </button>
          </div>
        )}
      </div>

      {currentView === 'list' ? (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.total, color: "border-slate-200 bg-white text-slate-900", icon: Users, iconColor: "text-slate-600" },
              { label: "Active Status", val: stats.active, color: "border-green-200 bg-white text-green-700", icon: UserCheck, iconColor: "text-green-600" },
              { label: "Inactive Status", val: stats.inactive, color: "border-red-200 bg-white text-red-700", icon: UserX, iconColor: "text-red-600" },
              { label: "Security Roles", val: stats.rolesCount, color: "border-indigo-200 bg-white text-indigo-700", icon: Shield, iconColor: "text-indigo-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-center justify-between ${stat.color}`}>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">{stat.label}</span>
                  <span className="text-2xl font-bold mt-1 block">{stat.val}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            ))}
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-slate-200 gap-4 mt-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-colors ${
                activeTab === 'users'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-colors flex items-center gap-1.5 ${
                activeTab === 'roles'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Shield className="w-4 h-4" />
              Security Roles Directory
            </button>
          </div>

          {activeTab === 'users' ? (
            <>
              {/* SEARCH & FILTER BAR */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search user, email, contact, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                  {(['all', 'Active', 'Inactive'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                        statusFilter === filter
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {filter === 'all' ? 'All Users' : `${filter} Status`}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">User & Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Assigned Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-450 font-medium">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            Loading users from app_user database...
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* User & Name */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner">
                                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{user.name}</span>
                                  <span className="text-[11px] text-slate-400">Joined {user.date}</span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {user.email}
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {user.contact}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1 max-w-[240px]">
                                {(user.roles && user.roles.length > 0 ? user.roles : user.role.split(",")).map((r) => (
                                  <span key={r} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                                    <Shield className="w-3 h-3 text-indigo-500" />
                                    {r.trim().toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                title="Click to toggle status"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer select-none transition-all active:scale-95 ${
                                  user.status === 'Active'
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {user.status}
                              </button>
                            </td>

                            {/* Action buttons */}
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openUserDetails(user)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                  title="View User & Manage Assigned Roles"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditRole(user.role, user.id)}
                                  className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-100 text-xs font-semibold cursor-pointer"
                                  title="Edit Roles & Configure Permissions"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  Edit Roles
                                </button>
                                <button
                                  onClick={() => openEditUserDetails(user)}
                                  className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200 text-xs font-semibold cursor-pointer"
                                  title="Edit User Details"
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                  Edit Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                            No community users found matching filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mock Pagination */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Showing {filteredUsers.length} of {users.length} users</span>
                  <div className="flex items-center gap-1">
                    <button disabled className="px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">Previous</button>
                    <button className="px-2.5 py-1.5 bg-indigo-600 border border-indigo-600 text-white rounded font-medium">1</button>
                    <button className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">2</button>
                    <button className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">Next</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* SECURITY ROLES DIRECTORY GRID */
            <div className="space-y-6">
              {/* Stats Block for Roles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Security Profile & Template Directory</h4>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                      Configure base permission templates or define new operational roles to govern community access.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  Total Active System Roles: <span className="font-extrabold text-indigo-700">{roles.length}</span>
                </div>
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((role) => {
                  const assignedUsersCount = users.filter(u => u.role.toUpperCase() === role.name.toUpperCase()).length;
                  return (
                    <div
                      key={role.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between group relative animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                      
                      <div className="p-5 flex-grow">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="p-2.5 bg-indigo-50 text-indigo-750 rounded-xl border border-indigo-100 group-hover:scale-110 transition-transform">
                            <Shield className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            ID: {role.id}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
                          {role.name.replace("_", " ")}
                        </h4>
                        
                        <p className="text-slate-450 text-[11px] mt-1 font-semibold leading-relaxed">
                          Operational System Role Profile
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-450 block font-bold uppercase tracking-wider text-[10px]">Assigned Users:</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {assignedUsersCount} Users
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditRole(role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase())}
                          className="w-full py-2 bg-white hover:bg-indigo-55 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Configure Template
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Create Custom Role Card */}
                <button
                  onClick={() => setIsCreateRoleOpen(true)}
                  className="bg-slate-50/50 hover:bg-slate-50 border-2 border-dashed border-slate-250 hover:border-indigo-400 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group min-h-[220px]"
                >
                  <div className="p-3 bg-white text-slate-450 group-hover:text-indigo-600 border border-slate-200 group-hover:border-indigo-150 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Create Custom Role</h5>
                    <p className="text-slate-450 text-xs mt-1 max-w-[180px] font-semibold leading-relaxed">Add a new security role class to the database</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* EDIT ROLE PERMISSIONS VIEW */
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
          {/* Subheader — User profile card + Save */}
          <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {(() => {
                const targetUser = editingUserId ? users.find(u => u.id === editingUserId) : null;
                const initials = targetUser
                  ? targetUser.name.split(" ").map(n => n[0]).join("").toUpperCase()
                  : editingRoleName.slice(0, 2).toUpperCase();
                const displayName = targetUser ? targetUser.name : editingRoleName;
                return (
                  <>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{displayName}</h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        {editingRoleName} role
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              onClick={handleUpdateRole}
              disabled={loadingEditPerms}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save permissions
            </button>
          </div>

          {/* Loading overlay while fetching fresh permissions from backend */}
          {loadingEditPerms && (
            <div className="flex items-center justify-center gap-3 py-6 bg-indigo-50/60 border-b border-indigo-100">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-indigo-700">Loading permissions from database…</span>
            </div>
          )}

          {/* User Details display if we are editing a user's permissions */}
          {editingUserId && (
            (() => {
              const userBeingEdited = users.find(u => u.id === editingUserId);
              if (!userBeingEdited) return null;
              return (
                <div className="mx-6 mt-6 px-5 py-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {userBeingEdited.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                        Editing User-Specific Permissions: <span className="text-indigo-600 font-extrabold">{userBeingEdited.name}</span>
                      </h4>
                      <p className="text-indigo-800/80 text-xs mt-0.5 font-medium">
                        Email: {userBeingEdited.email} • Assigned Role: <span className="font-bold uppercase text-indigo-700">{userBeingEdited.role}</span>
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm self-start sm:self-center">
                    User-Specific Access Policy
                  </div>
                </div>
              );
            })()
          )}

          {/* MULTI-ROLE ASSIGNMENT BAR */}
          <div className="mx-6 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Assigned Module Access & Security Roles ({selectedUserRoles.length} Active)
                </h4>
                <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                  Toggle multiple roles (e.g. SPORTS_ADMIN + MEMBER + VENDOR) to combine module permissions for access across the community.
                </p>
              </div>
            </div>

            {/* Toggle Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {sortRoleStrings(Array.from(new Set([
                "ADMIN", "CASHIER", "EVENT_ADMIN", "MEMBER",
                "SPORTS_ADMIN", "STAFF", "USER", "VENDOR",
                ...roles.map((r) => r.name.toUpperCase())
              ])).filter((r) => !["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r.toUpperCase())))
              .map((roleKey) => {
                const isSelected = selectedUserRoles.includes(roleKey);
                const isLocked = roleKey === "USER";
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => toggleRoleOnEditView(roleKey)}
                    disabled={isLocked}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                      isLocked
                        ? "bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed opacity-70"
                        : isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 cursor-pointer"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      isSelected ? "bg-white text-indigo-600 border-white" : "border-slate-300 bg-slate-50"
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    {roleKey.replace(/_/g, " ")}{roleKey === "USER" ? " (auto)" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══════ SPORTS PERMISSION MATRIX ═══════ */}
          <div className={`p-6 space-y-8 bg-slate-50/50 ${loadingEditPerms ? "pointer-events-none opacity-50" : ""}`}>

            {/* ── SPORTS Matrix Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3.5 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  SPORTS Permission
                </h4>
                <label className="flex items-center gap-2 text-xs font-semibold text-indigo-100 hover:text-white cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={isCategoryAllSelected(editingRole, 'sports')}
                    onChange={(e) => handleSelectAllCategory(editingRole, 'sports', e.target.checked)}
                    className="rounded border-indigo-300 text-white focus:ring-white h-3.5 w-3.5 accent-white"
                  />
                  Select All
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">Module / Feature</th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-emerald-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><Eye className="w-3.5 h-3.5" />View</div>
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-amber-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><Edit className="w-3.5 h-3.5" />Create / Edit</div>
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-red-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><XCircle className="w-3.5 h-3.5" />Delete</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SPORTS_PERMISSION_MATRIX.map((row, idx) => {
                      const rolePerms = rolePermissions[editingRole] || {};

                      // ── Group Header (e.g. "Auction") — aggregate checkbox from children ──
                      if (row.isGroupHeader && row.childIndices) {
                        const children = row.childIndices.map(i => SPORTS_PERMISSION_MATRIX[i]);
                        const allChildViewKeys = children.map(c => c.view).filter(Boolean) as string[];
                        const allChildEditKeys = children.map(c => c.createEdit).filter(Boolean) as string[];
                        const allChildDeleteKeys = children.map(c => c.delete).filter(Boolean) as string[];

                        const allViewChecked = allChildViewKeys.length > 0 && allChildViewKeys.every(k => !!rolePerms[k]);
                        const allEditChecked = allChildEditKeys.length > 0 && allChildEditKeys.every(k => !!rolePerms[k]);
                        const allDeleteChecked = allChildDeleteKeys.length > 0 && allChildDeleteKeys.every(k => !!rolePerms[k]);

                        const toggleColumn = (keys: string[], allChecked: boolean) => {
                          setRolePermissions(prev => {
                            const rp = prev[editingRole] ? { ...prev[editingRole] } : {};
                            keys.forEach(k => { rp[k] = !allChecked; });
                            return { ...prev, [editingRole]: rp };
                          });
                        };

                        return (
                          <tr key={idx} className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                {row.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allViewChecked}
                                  onChange={() => toggleColumn(allChildViewKeys, allViewChecked)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allEditChecked}
                                  onChange={() => toggleColumn(allChildEditKeys, allEditChecked)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allDeleteChecked}
                                  onChange={() => toggleColumn(allChildDeleteKeys, allDeleteChecked)}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                          </tr>
                        );
                      }

                      // ── Normal row (feature with its own permissions) ──
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            row.isChild ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Feature Label */}
                          <td className="px-5 py-3">
                            <span
                              className={`text-sm font-semibold flex items-center gap-1.5 ${
                                row.isChild ? 'pl-5 text-slate-600' : 'text-slate-900'
                              }`}
                            >
                              {row.isChild && (
                                <span className="text-slate-300 text-xs">↳</span>
                              )}
                              {row.label}
                            </span>
                          </td>

                          {/* View */}
                          <td className="px-4 py-3 text-center">
                            {row.view ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.view]}
                                  onChange={() => handleTogglePermission(editingRole, row.view!)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Create / Edit */}
                          <td className="px-4 py-3 text-center">
                            {row.createEdit ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.createEdit]}
                                  onChange={() => handleTogglePermission(editingRole, row.createEdit!)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="px-4 py-3 text-center">
                            {row.delete ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.delete]}
                                  onChange={() => handleTogglePermission(editingRole, row.delete!)}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── EVENTS Matrix Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-5 py-3.5 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  EVENTS Permission Matrix
                </h4>
                <label className="flex items-center gap-2 text-xs font-semibold text-purple-100 hover:text-white cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={isCategoryAllSelected(editingRole, 'events')}
                    onChange={(e) => handleSelectAllCategory(editingRole, 'events', e.target.checked)}
                    className="rounded border-purple-300 text-white focus:ring-white h-3.5 w-3.5 accent-white"
                  />
                  Select All
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[40%]">Sub-Menu / Feature</th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-emerald-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><Eye className="w-3.5 h-3.5" />View</div>
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-amber-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><Edit className="w-3.5 h-3.5" />Create / Edit</div>
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-center text-red-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-0.5"><XCircle className="w-3.5 h-3.5" />Delete / Export</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {EVENT_PERMISSION_MATRIX.map((row, idx) => {
                      const rolePerms = rolePermissions[editingRole] || {};

                      if (row.isGroupHeader && row.childIndices) {
                        const children = row.childIndices.map(i => EVENT_PERMISSION_MATRIX[i]);
                        const allChildViewKeys = children.map(c => c.view).filter(Boolean) as string[];
                        const allChildEditKeys = children.map(c => c.createEdit).filter(Boolean) as string[];
                        const allChildDeleteKeys = children.map(c => c.delete).filter(Boolean) as string[];

                        const allViewChecked = allChildViewKeys.length > 0 && allChildViewKeys.every(k => !!rolePerms[k]);
                        const allEditChecked = allChildEditKeys.length > 0 && allChildEditKeys.every(k => !!rolePerms[k]);
                        const allDeleteChecked = allChildDeleteKeys.length > 0 && allChildDeleteKeys.every(k => !!rolePerms[k]);

                        const toggleColumn = (keys: string[], allChecked: boolean) => {
                          setRolePermissions(prev => {
                            const rp = prev[editingRole] ? { ...prev[editingRole] } : {};
                            keys.forEach(k => { rp[k] = !allChecked; });
                            return { ...prev, [editingRole]: rp };
                          });
                        };

                        return (
                          <tr key={idx} className="bg-purple-50/30 hover:bg-purple-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                {row.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allViewChecked}
                                  onChange={() => toggleColumn(allChildViewKeys, allViewChecked)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allEditChecked}
                                  onChange={() => toggleColumn(allChildEditKeys, allEditChecked)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input type="checkbox" checked={allDeleteChecked}
                                  onChange={() => toggleColumn(allChildDeleteKeys, allDeleteChecked)}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            row.isChild ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-5 py-3">
                            <span
                              className={`text-sm font-semibold flex items-center gap-1.5 ${
                                row.isChild ? 'pl-5 text-slate-600' : 'text-slate-900'
                              }`}
                            >
                              {row.isChild && (
                                <span className="text-slate-300 text-xs">↳</span>
                              )}
                              {row.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {row.view ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.view]}
                                  onChange={() => handleTogglePermission(editingRole, row.view!)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {row.createEdit ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.createEdit]}
                                  onChange={() => handleTogglePermission(editingRole, row.createEdit!)}
                                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {row.delete ? (
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!rolePerms[row.delete]}
                                  onChange={() => handleTogglePermission(editingRole, row.delete!)}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                />
                              </label>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── OTHER PERMISSION CATEGORIES ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {permissionCategories
                .filter((c) => c.id !== 'sports' && c.id !== 'events')
                .map((category) => {
                  const allChecked = isCategoryAllSelected(editingRole, category.id);
                  const rolePerms = rolePermissions[editingRole] || {};
                  return (
                    <div key={category.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-750 flex items-center gap-2">
                          <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                          {category.title}
                        </h4>
                        <label className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => handleSelectAllCategory(editingRole, category.id, e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          Select All
                        </label>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {category.permissions.map((perm) => (
                          <label
                            key={perm}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                              !!rolePerms[perm]
                                ? "bg-indigo-50/40 border-indigo-100 text-indigo-950 font-medium"
                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!rolePerms[perm]}
                              onChange={() => handleTogglePermission(editingRole, perm)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span>{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* ═══════ LIVE UI PREVIEW ═══════ */}
            {(() => {
              const rolePerms = rolePermissions[editingRole] || {};
              return (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3.5 flex items-center gap-2.5">
                    <MonitorPlay className="w-4 h-4 text-slate-300" />
                    <h4 className="text-sm font-bold text-white">UI Button Preview — What the user sees</h4>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {SPORTS_PERMISSION_MATRIX.map((row, idx) => {
                      const hasView = row.view ? !!rolePerms[row.view] : false;
                      const hasEdit = row.createEdit ? !!rolePerms[row.createEdit] : false;
                      const hasDelete = row.delete ? !!rolePerms[row.delete] : false;
                      const hasAny = hasView || hasEdit || hasDelete;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded-lg border px-4 py-2.5 transition-all ${
                            row.isChild ? 'ml-6' : ''
                          } ${
                            hasAny
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {row.isChild && (
                              <span className="text-slate-300 text-xs">↳</span>
                            )}
                            {hasAny ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className={`text-sm font-semibold ${
                              hasAny ? 'text-slate-800' : 'text-slate-500'
                            }`}>
                              {row.label}
                            </span>
                          </div>

                          {hasAny ? (
                            <div className="flex items-center gap-1.5">
                              {hasView && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                                  View
                                </span>
                              )}
                              {hasEdit && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">
                                  Create/Edit
                                </span>
                              )}
                              {hasDelete && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md border border-red-200">
                                  Delete
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 italic">No access</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white">
            <button
              onClick={() => setCurrentView('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRole}
              disabled={loadingEditPerms}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              {loadingEditPerms ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loadingEditPerms ? "Loading…" : "Save Permissions"}
            </button>
          </div>
        </div>
      )}

      {/* EDIT USER DETAILS MODAL */}
      {editUserDetailsOpen && editUserDetailsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setEditUserDetailsOpen(false); setEditUserDetailsData(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-250 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 shrink-0">
              <button
                onClick={() => { setEditUserDetailsOpen(false); setEditUserDetailsData(null); }}
                className="absolute top-4 right-4 p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {editUserDetailsData.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold">Edit User Details</h4>
                  <p className="text-emerald-100 text-xs mt-0.5 font-medium">Update app_user profile information</p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={editUserDetailsData.fullName}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="Full name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    value={editUserDetailsData.email}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Phone</label>
                  <input
                    type="tel"
                    value={editUserDetailsData.phone}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="+91 9999999999"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Date of Birth</label>
                  <input
                    type="date"
                    value={editUserDetailsData.dateOfBirth}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Gender</label>
                  <select
                    value={editUserDetailsData.gender}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Employee / Resident ID</label>
                  <input
                    type="text"
                    value={editUserDetailsData.employeeId}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. RES-9021"
                  />
                </div>

                {/* Block */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Block</label>
                  <input
                    type="text"
                    value={editUserDetailsData.block}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, block: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. A"
                  />
                </div>

                {/* Tower */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Tower</label>
                  <input
                    type="text"
                    value={editUserDetailsData.tower}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, tower: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. T1"
                  />
                </div>

                {/* Flat No */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Flat / Unit No</label>
                  <input
                    type="text"
                    value={editUserDetailsData.flatNo}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, flatNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. 304"
                  />
                </div>

                {/* Resident Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Resident Type</label>
                  <select
                    value={editUserDetailsData.residentType}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, residentType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="Resident">Resident</option>
                    <option value="Non-Resident">Non-Resident</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>

                {/* Occupancy Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Occupancy Status</label>
                  <select
                    value={editUserDetailsData.occupancyStatus}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, occupancyStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select status</option>
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                {/* Govt ID Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Govt ID Type</label>
                  <select
                    value={editUserDetailsData.govtIdType}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, govtIdType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select ID type</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="DRIVING_LICENCE">Driving Licence</option>
                  </select>
                </div>

                {/* Govt ID Number */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Govt ID Number</label>
                  <input
                    type="text"
                    value={editUserDetailsData.govtIdNumber}
                    onChange={(e) => setEditUserDetailsData({ ...editUserDetailsData, govtIdNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="Enter ID document number"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setEditUserDetailsOpen(false); setEditUserDetailsData(null); }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserDetails}
                disabled={savingUserDetails}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {savingUserDetails ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save User Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setSavedRoles(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-250" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-5">
              <button
                onClick={() => { setSelectedUser(null); setSavedRoles(null); }}
                className="absolute top-4 right-4 p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {selectedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold">{selectedUser.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedUser.roles && selectedUser.roles.length > 0
                      ? selectedUser.roles
                      : selectedUser.role.split(",").map((r) => r.trim())
                    ).filter(Boolean).map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-[11px] font-semibold tracking-wider uppercase text-white">
                        <Shield className="w-3 h-3" />
                        {r.trim().toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Email Address</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedUser.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Phone / Contact</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedUser.contact}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">User Status</span>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedUser.status === 'Active'
                        ? "bg-green-150 text-green-700"
                        : "bg-red-150 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-450 block font-medium">Date Registered</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.date}
                  </div>
                </div>

                <div className="space-y-2 col-span-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 block font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      Assigned Module Access &amp; Security Roles
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        savedRoles
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {(savedRoles ?? (
                          selectedUser.roles && selectedUser.roles.length > 0
                            ? selectedUser.roles
                            : selectedUser.role.split(",").map(r => r.trim()).filter(Boolean)
                        )).length} Active
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Select multiple roles to grant access across modules</span>
                  </div>

                  {/* Multi-role Toggle Grid */}
                  <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                    {sortRoleStrings(Array.from(new Set([
                      "USER", "MEMBER", "SPORTS_ADMIN",
                      "VENDOR", "CASHIER", "STAFF", "ADMIN",
                      ...roles.map((r) => r.name.toUpperCase())
                    ])).filter((r) => !["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r.toUpperCase())))
                    .map((roleKey) => {
                      const isSelected = selectedUserRoles.includes(roleKey);
                      const isLocked = roleKey === "USER";
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => toggleSelectedRole(roleKey)}
                          disabled={isLocked}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                            isLocked
                              ? "bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed opacity-70"
                              : isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 cursor-pointer"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isLocked
                              ? "bg-slate-400 text-white border-slate-400"
                              : isSelected ? "bg-white text-indigo-600 border-white" : "border-slate-300 bg-slate-50"
                          }`}>
                            {(isSelected || isLocked) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          {roleKey.replace(/_/g, " ")}{isLocked ? " (auto)" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveUserRoles}
                        disabled={updatingUserRoles}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {updatingUserRoles ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save Assigned Roles
                          </>
                        )}
                      </button>
                    </div>
                    {savedRoles && (
                      <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-emerald-700">Roles saved successfully</span>
                          <div className="flex flex-wrap gap-1">
                            {savedRoles.map((r) => (
                              <span key={r} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold">
                                <Shield className="w-2.5 h-2.5" />
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Permissions Tags */}
              <div className="border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Active Permissions ({selectedUser.permissions ? selectedUser.permissions.length : 0})
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                    selectedUser.permissions.map((perm) => (
                      <span key={perm} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 p-2 italic w-full text-center">No active permissions loaded.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setSelectedUser(null); setSavedRoles(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCreateRoleOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateRole}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-indigo-650 text-white px-6 py-5 flex items-center gap-3 relative">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="absolute top-4 right-4 p-1.5 text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Create Custom Security Role</h4>
                  <p className="text-emerald-100 text-xs mt-0.5 font-medium">Add a new access policy to govern the community</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Role Identity Name</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Coach, Auditor, Treasurer"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                  />
                  <span className="text-[10px] text-slate-450 block pt-0.5 leading-relaxed font-semibold">
                    Role names are normalized to uppercase (e.g. COACH) and saved as security identities in the active database.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {isCreatingRole ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Role
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
