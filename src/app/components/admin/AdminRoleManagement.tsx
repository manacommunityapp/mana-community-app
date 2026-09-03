import { useState, useEffect, useMemo } from "react";
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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
  MonitorPlay,
  Save,
  UserCog,
  Loader2,
  Trash2,
  Home,
  BadgeCheck,
  CreditCard,
  Briefcase,
  Hash,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { userService } from "../../../services/common/userService";
import type { UserStatsResponse } from "../../../services/common/userService";
import { useAuth } from "../../../contexts/AuthContext";
import { communityService } from "../../../services/community/communityService";
import { confirmAction } from "../../../utils/AlertUtils";
import { DatePicker } from "../ui/date-picker";
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
  block?: string;
  flatNo?: string;
  tower?: string;
  residentType?: string;
  occupancyStatus?: string;
  employeeId?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  kycStatus?: string;
  communityId?: number;
  profilePicUrl?: string;
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
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [currentView, setCurrentView] = useState<'list' | 'editRole'>('list');
  const [editingRole, setEditingRole] = useState<string>('Cashier');
  const [editingRoleName, setEditingRoleName] = useState<string>('Cashier');
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [updatingUserRoles, setUpdatingUserRoles] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

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

  const loadUsers = async (
    page: number = currentPage,
    size: number = pageSize,
    commId: number | "" = selectedCommId,
    searchStr: string = searchQuery,
    status: 'all' | 'Active' | 'Inactive' = statusFilter
  ) => {
    setLoading(true);
    try {
      const activeCommId = commId !== "" ? commId : selectedCommId;
      const commIdToQuery = (isSuperAdmin && activeCommId)
        ? Number(activeCommId)
        : (user?.communityId ?? undefined);

      const [pagedRes, statsRes] = await Promise.all([
        userService.getUsersPaged({
          page: Math.max(0, page - 1),
          size,
          communityId: isSuperAdmin ? (activeCommId ? Number(activeCommId) : undefined) : commIdToQuery,
          search: searchStr,
          status: status === 'all' ? undefined : status.toUpperCase(),
        }),
        userService.getUserStats(commIdToQuery).catch(() => null),
      ]);

      if (statsRes) {
        setUserStats(statsRes);
      }

      setTotalElements(pagedRes.totalElements);
      setTotalPages(Math.max(1, pagedRes.totalPages));

      const mapped = pagedRes.content.map((u) => {
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
          name: u.fullName || "",
          email: u.email || "",
          contact: u.phone || "",
          role: displayRole,
          roles: rolesList,
          status: u.isActive ? ("Active" as const) : ("Inactive" as const),
          date: u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "Unknown",
          permissions: u.permissions,
          block: u.block || "",
          flatNo: u.flatNo || "",
          tower: u.tower || "",
          residentType: u.residentType || "",
          occupancyStatus: u.occupancyStatus || "",
          employeeId: u.employeeId || "",
          govtIdType: u.govtIdType || "",
          govtIdNumber: u.govtIdNumber || "",
          gender: u.gender || "",
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth) : "",
          kycStatus: u.kycStatus || "PENDING",
          communityId: u.communityId,
          profilePicUrl: u.profilePicUrl,
        };
      });
      setUsers(mapped);
    } catch (err) {
      toast.error("Failed to load users from database");
    } finally {
      setLoading(false);
    }
  };

  // Debounced database search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(currentPage, pageSize, selectedCommId, searchQuery, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchQuery, statusFilter, selectedCommId]);

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

  const filteredUsers = users;
  const paginatedUsers = users;

  const stats = {
    total: userStats?.totalUsers ?? totalElements,
    active: userStats?.activeUsers ?? users.filter((u) => u.status === 'Active').length,
    inactive: userStats != null
      ? (userStats.totalUsers - userStats.activeUsers)
      : users.filter((u) => u.status === 'Inactive').length,
    rolesCount: userStats?.roleBreakdown && Object.keys(userStats.roleBreakdown).length > 0
      ? Object.keys(userStats.roleBreakdown).length
      : Array.from(new Set(users.map((u) => u.role))).length,
  };

  // HANDLERS
  const openUserDetails = async (u: UserItem) => {
    setSelectedUser(u);
    setSavedRoles(null);
    const initialRoles = u.roles && u.roles.length > 0
      ? u.roles.map((r) => r.toUpperCase())
      : u.role.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean);
    // Ensure USER base role is always present
    if (!initialRoles.includes("USER")) initialRoles.push("USER");
    setSelectedUserRoles(initialRoles);

    // Fetch fresh and complete database profile for the user
    try {
      const fresh = await userService.getUserById(u.id);
      if (fresh) {
        setSelectedUser((prev) => {
          if (!prev || prev.id !== u.id) return prev;
          const rawRole = fresh.role || prev.role || "USER";
          const rolesList = (fresh.roles && fresh.roles.length > 0
            ? fresh.roles.map((r) => r.trim().toUpperCase())
            : rawRole.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean)
          ).map((r) => ["SUPER_ADMIN", "SUPERADMIN", "SUPER_ADMINISTRATOR", "COMMUNITY_ADMIN", "COMMUNITYADMIN", "COMMUNITY_ADMINISTRATOR", "COMMUNITY ADMIN"].includes(r) ? "ADMIN" : r);

          return {
            ...prev,
            name: fresh.fullName || prev.name,
            email: fresh.email || prev.email,
            contact: fresh.phone || prev.contact,
            dateOfBirth: fresh.dateOfBirth || prev.dateOfBirth,
            gender: fresh.gender || prev.gender,
            block: fresh.block || prev.block,
            tower: fresh.tower || prev.tower,
            flatNo: fresh.flatNo || prev.flatNo,
            residentType: fresh.residentType || prev.residentType,
            occupancyStatus: fresh.occupancyStatus || prev.occupancyStatus,
            employeeId: fresh.employeeId || prev.employeeId,
            govtIdType: fresh.govtIdType || prev.govtIdType,
            govtIdNumber: fresh.govtIdNumber || prev.govtIdNumber,
            kycStatus: fresh.kycStatus || prev.kycStatus,
            communityId: fresh.communityId || prev.communityId,
            status: fresh.isActive !== undefined ? (fresh.isActive ? "Active" : "Inactive") : prev.status,
            permissions: fresh.permissions || prev.permissions,
            roles: rolesList,
          };
        });
      }
    } catch {}
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

  const handleDeleteUser = async (u: UserItem) => {
    const confirmed = await confirmAction({
      title: "Delete / Deactivate User?",
      text: `Are you sure you want to deactivate ${u.name || "this user"} (ID: #${u.id})? Their status will be set to Inactive in the database.`,
      confirmButtonText: "Yes, Deactivate",
      cancelButtonText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmed) return;

    setDeletingUserId(u.id);
    try {
      if (u.status === "Active") {
        await userService.toggleUserStatus(u.id);
      } else {
        await userService.updateUser(u.id, { isActive: false });
      }
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: "Inactive" as const } : item))
      );
      toast.success(`User "${u.name}" has been deactivated successfully`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user status in database");
    } finally {
      setDeletingUserId(null);
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
  };  return (
    <div className="space-y-3.5 sm:space-y-4 w-full pb-6">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (currentView === 'editRole') {
                setCurrentView('list');
              } else {
                navigate("/admin");
              }
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-indigo-600" />
              {currentView === 'list'
                ? "Community Users & Roles"
                : `Edit Role: ${editingRole}`}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {currentView === 'list'
                ? "Manage users, toggle access status, and configure role-based permissions"
                : "Assign granular action permissions to this security role"}
            </p>
          </div>
        </div>

        {currentView === 'list' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSuperAdmin && (
              <select
                value={selectedCommId}
                onChange={(e) => {
                  setSelectedCommId(e.target.value ? Number(e.target.value) : "");
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[#0c1220] border border-[#2a3a5c] rounded-lg text-[#f1f5f9] text-xs font-medium focus:border-[#f97316] outline-none active:scale-95 cursor-pointer shadow-2xs"
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
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Create Role
            </button>
            <button
              onClick={() => navigate("/admin/create-user")}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create User
            </button>
            <button
              onClick={() => navigate("/admin/bulk-upload")}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Bulk Upload
            </button>
          </div>
        )}
      </div>

      {currentView === 'list' ? (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
            {[
              { label: "Total Users", val: stats.total, color: "border-slate-200 bg-white text-slate-900", icon: Users, iconColor: "text-slate-600" },
              { label: "Active Status", val: stats.active, color: "border-green-200 bg-white text-green-700", icon: UserCheck, iconColor: "text-green-600" },
              { label: "Inactive Status", val: stats.inactive, color: "border-red-200 bg-white text-red-700", icon: UserX, iconColor: "text-red-600" },
              { label: "Security Roles", val: stats.rolesCount, color: "border-indigo-200 bg-white text-indigo-700", icon: Shield, iconColor: "text-indigo-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-2.5 sm:p-3 rounded-xl border shadow-2xs transition-all hover:shadow-xs flex items-center justify-between ${stat.color}`}>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">{stat.label}</span>
                  <span className="text-lg sm:text-xl font-black mt-0.5 block leading-none">{stat.val}</span>
                </div>
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
            ))}
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-slate-200 gap-3 mt-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 text-xs sm:text-sm font-bold border-b-2 px-1 transition-colors ${
                activeTab === 'users'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-2 text-xs sm:text-sm font-bold border-b-2 px-1 transition-colors flex items-center gap-1 ${
                activeTab === 'roles'
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Security Roles Directory
            </button>
          </div>

          {activeTab === 'users' ? (
            <>
              {/* SEARCH & FILTER BAR */}
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs flex flex-col md:flex-row gap-2.5 justify-between items-center">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearchQuery(searchInput.trim());
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1.5 w-full md:w-auto flex-1 max-w-md"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone, role, unit..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-xs sm:text-sm transition-all"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </form>

                <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
                  {(['all', 'Active', 'Inactive'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setStatusFilter(filter);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                        statusFilter === filter
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {filter === 'all' ? 'All Users' : `${filter} Status`}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-3.5 sm:px-4 py-2.5">User</th>
                        <th className="px-3.5 sm:px-4 py-2.5">Email</th>
                        <th className="px-3.5 sm:px-4 py-2.5">Contact</th>
                        <th className="px-3.5 sm:px-4 py-2.5">Assigned Roles</th>
                        <th className="px-3.5 sm:px-4 py-2.5">Status</th>
                        <th className="px-3.5 sm:px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                              <span className="text-xs">Loading users from database...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                            {/* User details */}
                            <td className="px-3.5 sm:px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[11px] flex items-center justify-center shadow-2xs shrink-0">
                                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight">{user.name}</div>
                                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span>#{user.id}</span>
                                    {user.block && <span>• {user.block}-{user.flatNo}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-3.5 sm:px-4 py-2 text-slate-500 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{user.email || "—"}</span>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-3.5 sm:px-4 py-2 text-slate-500 whitespace-nowrap text-xs">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{user.contact || "—"}</span>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-3.5 sm:px-4 py-2 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {(user.roles && user.roles.length > 0 ? user.roles : user.role.split(",")).map((r) => (
                                  <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                                    <Shield className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                    {r.trim().toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-3.5 sm:px-4 py-2 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                title="Click to toggle status"
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border cursor-pointer select-none transition-all active:scale-95 ${
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
                            <td className="px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openUserDetails(user)}
                                  className="p-1 sm:p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors border border-slate-200 cursor-pointer"
                                  title="View User & Manage Assigned Roles"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEditRole(user.role, user.id)}
                                  className="flex items-center gap-1 px-1.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors border border-indigo-100 text-xs font-semibold cursor-pointer"
                                  title="Edit Roles & Configure Permissions"
                                >
                                  <Key className="w-3 h-3" />
                                  <span>Roles</span>
                                </button>
                                <button
                                  onClick={() => openEditUserDetails(user)}
                                  className="flex items-center gap-1 px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors border border-emerald-200 text-xs font-semibold cursor-pointer"
                                  title="Edit User Details"
                                >
                                  <UserCog className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={deletingUserId === user.id}
                                  className="flex items-center gap-1 px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition-colors border border-rose-200 text-xs font-semibold cursor-pointer disabled:opacity-50"
                                  title="Delete User (Set Inactive in Database)"
                                >
                                  {deletingUserId === user.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                  )}
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            <Users className="w-8 h-8 mx-auto opacity-30 mb-1.5" />
                            <span className="text-xs">No community users found matching search or filter.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Interactive Pagination Bar */}
                <div className="px-3.5 sm:px-4 py-2 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
                    <span>
                      Showing <strong className="text-slate-800 font-bold">{totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, totalElements)}</strong> of <strong className="text-slate-800 font-bold">{totalElements}</strong> {searchQuery || statusFilter !== 'all' ? `matching users (out of ${userStats?.totalUsers ?? totalElements} total)` : "users"}
                    </span>
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <span className="text-slate-400">Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage <= 1}
                      className="p-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="First Page"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-xs"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1 px-0.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center">
                            {idx > 0 && p - arr[idx - 1] > 1 && (
                              <span className="px-1 text-slate-400 select-none text-xs">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`min-w-[26px] h-[26px] rounded-md text-xs font-bold transition-all cursor-pointer ${
                                currentPage === p
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages || paginatedUsers.length === 0}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-xs"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage >= totalPages || paginatedUsers.length === 0}
                      className="p-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Last Page"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* SECURITY ROLES TAB VIEW */
            <div className="space-y-3.5 sm:space-y-4">
              {/* Stats Block for Roles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Security Profile & Template Directory</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Configure base permission templates or define new operational roles to govern community access.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-indigo-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs shrink-0">
                  Active Roles: <span className="font-extrabold text-indigo-700">{roles.length}</span>
                </div>
              </div>

              {/* Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {roles.map((role) => {
                  const assignedUsersCount = users.filter(u => u.role.toUpperCase() === role.name.toUpperCase()).length;
                  return (
                    <div
                      key={role.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group relative"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                      
                      <div className="p-3 flex-grow">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                            <Shield className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                            ID: {role.id}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
                          {role.name.replace(/_/g, " ")}
                        </h4>
                        
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 block font-semibold text-[10.5px]">Assigned:</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {assignedUsersCount}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-100">
                        <button
                          onClick={() => handleEditRole(role.name.charAt(0).toUpperCase() + role.name.slice(1).toLowerCase())}
                          className="w-full py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
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
                  <DatePicker
                    value={editUserDetailsData.dateOfBirth}
                    onChange={(val) => setEditUserDetailsData({ ...editUserDetailsData, dateOfBirth: val })}
                    max={new Date().toISOString().split("T")[0]}
                    placeholder="Select date of birth..."
                    className="w-full"
                    presets={false}
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

      {/* VIEW USER DETAILS MODAL — COMPLETE USER INFORMATION */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => { setSelectedUser(null); setSavedRoles(null); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-650 to-indigo-800 text-white px-4 py-3 sm:px-5 sm:py-3.5 shrink-0">
              <button
                onClick={() => { setSelectedUser(null); setSavedRoles(null); }}
                className="absolute top-3 right-3 p-1 text-indigo-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0">
                  {selectedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-black text-white truncate tracking-tight">{selectedUser.name}</h3>
                    <span className="px-1.5 py-0.2 rounded bg-white/15 text-indigo-100 text-[10px] font-mono font-bold tracking-wider">
                      #{selectedUser.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedUser.status === 'Active'
                        ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                        : "bg-rose-500/20 text-rose-200 border border-rose-400/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {selectedUser.status}
                    </span>

                    {/* KYC Badge */}
                    {selectedUser.kycStatus && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        selectedUser.kycStatus === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                          : selectedUser.kycStatus === "PENDING"
                          ? "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                          : "bg-slate-500/20 text-slate-200 border border-slate-400/30"
                      }`}>
                        <BadgeCheck className="w-3 h-3" />
                        KYC: {selectedUser.kycStatus}
                      </span>
                    )}

                    {/* Primary Role Tag */}
                    {(selectedUser.roles && selectedUser.roles.length > 0
                      ? selectedUser.roles
                      : selectedUser.role.split(",").map((r) => r.trim())
                    ).filter(Boolean).map((r) => (
                      <span key={r} className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/20 text-[9.5px] font-bold uppercase tracking-wider text-white">
                        <Shield className="w-2.5 h-2.5" />
                        {r.trim().toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-slate-700 divide-y divide-slate-100">
              {/* Section 1: Contact & Personal Details */}
              <div>
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Personal &amp; Contact Details
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Email Address</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold break-all mt-0.5">
                      <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate text-xs">{selectedUser.email || "Not Provided"}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Contact Number</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="text-xs">{selectedUser.contact || "Not Provided"}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Date of Birth</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold mt-0.5">
                      <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-xs">
                        {selectedUser.dateOfBirth
                          ? new Date(selectedUser.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "Not Provided"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Gender</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold mt-0.5">
                      <UserCheck className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="text-xs">{selectedUser.gender || "Not Specified"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Residence & Community Unit Details */}
              <div className="pt-3">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  Residence &amp; Community Unit Details
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Tower</span>
                    <div className="flex items-center gap-1 text-slate-800 font-bold mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{selectedUser.tower || "—"}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Block</span>
                    <div className="flex items-center gap-1 text-slate-800 font-bold mt-0.5">
                      <Home className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{selectedUser.block || "—"}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Flat No</span>
                    <div className="flex items-center gap-1 text-slate-800 font-bold mt-0.5">
                      <Hash className="w-3 h-3 text-indigo-500" />
                      <span className="truncate">{selectedUser.flatNo || "—"}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Resident Type</span>
                    <span className="text-slate-800 font-bold block mt-0.5 truncate">{selectedUser.residentType || "Resident"}</span>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Occupancy</span>
                    <span className="text-slate-800 font-bold block mt-0.5 truncate">{selectedUser.occupancyStatus || "Owner"}</span>
                  </div>

                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
                    <span className="text-slate-400 block font-semibold text-[10px] leading-tight">Joined</span>
                    <span className="text-slate-800 font-bold block mt-0.5 truncate">{selectedUser.date}</span>
                  </div>
                </div>
              </div>



              {/* Section 4: Assigned Security Roles & Module Access */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    Assigned Security Roles &amp; Module Access
                    <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                      savedRoles ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {selectedUserRoles.length} Active
                    </span>
                  </h5>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Click role to toggle</span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
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
                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border active:scale-95 ${
                          isLocked
                            ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                            : isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs cursor-pointer"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
                        }`}
                      >
                        <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                          isLocked
                            ? "bg-slate-400 text-white border-slate-400"
                            : isSelected ? "bg-white text-indigo-600 border-white" : "border-slate-300 bg-slate-50"
                        }`}>
                          {(isSelected || isLocked) && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                        {roleKey.replace(/_/g, " ")}{isLocked ? " (auto)" : ""}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveUserRoles}
                      disabled={updatingUserRoles}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {updatingUserRoles ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving Roles...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          Save Assigned Roles
                        </>
                      )}
                    </button>
                  </div>
                  {savedRoles && (
                    <div className="flex items-start gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-700 text-xs">Roles saved successfully in database</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {savedRoles.map((r) => (
                            <span key={r} className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-[9.5px]">
                              <Shield className="w-2 h-2" />
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Active Permissions */}
              <div className="pt-3">
                <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Active Permissions ({selectedUser.permissions ? selectedUser.permissions.length : 0})
                </h5>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                    selectedUser.permissions.map((perm) => (
                      <span key={perm} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic w-full text-center py-1">No active permissions loaded.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetUser = selectedUser;
                  setSelectedUser(null);
                  setSavedRoles(null);
                  if (targetUser) openEditUserDetails(targetUser);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>Edit Full Profile</span>
              </button>

              <button
                onClick={() => { setSelectedUser(null); setSavedRoles(null); }}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Close
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
