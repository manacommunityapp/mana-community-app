import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  BookOpen,
  Users,
  ClipboardList,
  Hammer,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MANAGE_SERVICE_CATALOG,
  MANAGE_SERVICE_PROVIDERS,
  MANAGE_SERVICE_REQUESTS,
  MANAGE_WORK_ORDERS,
} from "../../../constants/permissions";
import {
  serviceCatalogService,
  serviceAdminService,
} from "../../../services/servicePlatformService";
import type {
  ServiceDomainResponse,
  ServiceCategoryResponse,
  ServiceProviderResponse,
  ServiceRequestResponse,
  CspWorkOrderResponse,
  CreateServiceDomainRequest,
  CreateServiceCategoryRequest,
} from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminServices() {
  const { hasPermission } = useAuth();

  return (
    <Tabs defaultValue="catalog" className="space-y-4">
      <TabsList>
        {hasPermission(MANAGE_SERVICE_CATALOG) && (
          <TabsTrigger value="catalog" className="gap-1.5">
            <BookOpen className="w-4 h-4" /> Catalog
          </TabsTrigger>
        )}
        {hasPermission(MANAGE_SERVICE_PROVIDERS) && (
          <TabsTrigger value="providers" className="gap-1.5">
            <Users className="w-4 h-4" /> Providers
          </TabsTrigger>
        )}
        {hasPermission(MANAGE_SERVICE_REQUESTS) && (
          <TabsTrigger value="requests" className="gap-1.5">
            <ClipboardList className="w-4 h-4" /> Requests
          </TabsTrigger>
        )}
        {hasPermission(MANAGE_WORK_ORDERS) && (
          <TabsTrigger value="work-orders" className="gap-1.5">
            <Hammer className="w-4 h-4" /> Work Orders
          </TabsTrigger>
        )}
      </TabsList>

      {hasPermission(MANAGE_SERVICE_CATALOG) && (
        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>
      )}
      {hasPermission(MANAGE_SERVICE_PROVIDERS) && (
        <TabsContent value="providers">
          <ProvidersTab />
        </TabsContent>
      )}
      {hasPermission(MANAGE_SERVICE_REQUESTS) && (
        <TabsContent value="requests">
          <RequestsTab />
        </TabsContent>
      )}
      {hasPermission(MANAGE_WORK_ORDERS) && (
        <TabsContent value="work-orders">
          <WorkOrdersTab />
        </TabsContent>
      )}
    </Tabs>
  );
}

// ── Catalog Tab ──

function CatalogTab() {
  const [view, setView] = useState<"domains" | "categories">("domains");
  const [domains, setDomains] = useState<ServiceDomainResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Domain dialog
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<ServiceDomainResponse | null>(null);
  const [domainForm, setDomainForm] = useState<CreateServiceDomainRequest>({ name: "", slug: "", description: "" });
  const [domainSaving, setDomainSaving] = useState(false);

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryResponse | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateServiceCategoryRequest>({ name: "", slug: "", domainId: 0 });
  const [categorySaving, setCategorySaving] = useState(false);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      setDomains(await serviceCatalogService.listDomains());
    } catch {
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const loadCategories = useCallback(async (domainId: number) => {
    setLoading(true);
    try {
      setCategories(await serviceCatalogService.listCategories(domainId));
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomainId && view === "categories") {
      loadCategories(selectedDomainId);
    }
  }, [selectedDomainId, view, loadCategories]);

  // Domain CRUD
  const openDomainCreate = () => {
    setEditingDomain(null);
    setDomainForm({ name: "", slug: "", description: "" });
    setDomainDialogOpen(true);
  };

  const openDomainEdit = (d: ServiceDomainResponse) => {
    setEditingDomain(d);
    setDomainForm({ name: d.name, slug: d.slug, icon: d.icon ?? undefined, description: d.description ?? undefined });
    setDomainDialogOpen(true);
  };

  const saveDomain = async () => {
    if (!domainForm.name.trim()) { toast.error("Name is required"); return; }
    setDomainSaving(true);
    try {
      if (editingDomain) {
        await serviceCatalogService.updateDomain(editingDomain.id, domainForm);
        toast.success("Domain updated");
      } else {
        await serviceCatalogService.createDomain(domainForm);
        toast.success("Domain created");
      }
      setDomainDialogOpen(false);
      loadDomains();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const deleteDomain = async (id: number) => {
    if (!confirm("Delete this domain? All its categories will also be removed.")) return;
    try {
      await serviceCatalogService.deleteDomain(id);
      toast.success("Domain deleted");
      loadDomains();
    } catch {
      toast.error("Failed to delete domain");
    }
  };

  // Category CRUD
  const openCategoryCreate = () => {
    if (!selectedDomainId) { toast.error("Select a domain first"); return; }
    setEditingCategory(null);
    setCategoryForm({ name: "", slug: "", domainId: selectedDomainId });
    setCategoryDialogOpen(true);
  };

  const openCategoryEdit = (c: ServiceCategoryResponse) => {
    setEditingCategory(c);
    setCategoryForm({
      name: c.name,
      slug: c.slug,
      domainId: c.domainId,
      description: c.description ?? undefined,
      icon: c.icon ?? undefined,
      requiredCertifications: c.requiredCertifications ?? undefined,
      customFields: c.customFields ?? undefined,
      displayOrder: c.displayOrder ?? undefined,
    });
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) { toast.error("Name is required"); return; }
    setCategorySaving(true);
    try {
      if (editingCategory) {
        await serviceCatalogService.updateCategory(editingCategory.id, categoryForm);
        toast.success("Category updated");
      } else {
        await serviceCatalogService.createCategory(categoryForm);
        toast.success("Category created");
      }
      setCategoryDialogOpen(false);
      if (selectedDomainId) loadCategories(selectedDomainId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await serviceCatalogService.deleteCategory(id);
      toast.success("Category deleted");
      if (selectedDomainId) loadCategories(selectedDomainId);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === "domains" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("domains")}
        >
          Domains
        </Button>
        <Button
          variant={view === "categories" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("categories")}
        >
          Categories
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Domains View */}
      {!loading && view === "domains" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openDomainCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Domain
            </Button>
          </div>
          {domains.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{d.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openDomainEdit(d)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteDomain(d.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {domains.length === 0 && <p className="text-center text-slate-400 py-8">No domains yet</p>}
        </div>
      )}

      {/* Categories View */}
      {!loading && view === "categories" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={selectedDomainId ? String(selectedDomainId) : ""} onValueChange={(v) => setSelectedDomainId(Number(v))}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Select domain" /></SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openCategoryCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </Button>
          </div>
          {selectedDomainId ? (
            categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openCategoryEdit(c)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCategory(c.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">Select a domain to view categories</p>
          )}
          {selectedDomainId && categories.length === 0 && (
            <p className="text-center text-slate-400 py-8">No categories in this domain</p>
          )}
        </div>
      )}

      {/* Domain Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDomain ? "Edit Domain" : "Add Domain"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={domainForm.name} onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input placeholder="e.g. home-services" value={domainForm.slug} onChange={(e) => setDomainForm({ ...domainForm, slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={domainForm.description ?? ""} onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Icon (optional)</Label>
              <Input value={domainForm.icon ?? ""} onChange={(e) => setDomainForm({ ...domainForm, icon: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveDomain} disabled={domainSaving}>
              {domainSaving ? "Saving..." : editingDomain ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input placeholder="e.g. plumbing" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={categoryForm.description ?? ""} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Custom Fields (JSON, optional)</Label>
              <Textarea
                rows={3}
                placeholder='e.g. [{"name":"area_sqft","type":"number"}]'
                value={categoryForm.customFields ?? ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, customFields: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={categorySaving}>
              {categorySaving ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Providers Tab ──

function ProvidersTab() {
  const [providers, setProviders] = useState<ServiceProviderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const result = await serviceAdminService.listProviders({ status: statusFilter || undefined, page: p });
      setProviders(result.content);
      setTotalPages(result.totalPages);
      setPage(p);
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (id: number, action: string) => {
    setActionLoading(id);
    try {
      await serviceAdminService.verifyProvider(id, action);
      toast.success(`Provider ${action.toLowerCase()}d`);
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const verificationStyles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    VERIFIED: "bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    SUSPENDED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Service Providers</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.businessName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{p.providerType} · {p.serviceAreas}</p>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block", verificationStyles[p.verificationStatus])}>
                  {p.verificationStatus}
                </span>
              </div>
              <div className="flex gap-1">
                {p.verificationStatus !== "VERIFIED" && (
                  <Button size="sm" variant="outline" onClick={() => handleVerify(p.id, "VERIFY")} disabled={actionLoading === p.id}>
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> Verify
                  </Button>
                )}
                {p.verificationStatus !== "REJECTED" && (
                  <Button size="sm" variant="outline" onClick={() => handleVerify(p.id, "REJECT")} disabled={actionLoading === p.id}>
                    <XCircle className="w-4 h-4 mr-1 text-red-500" /> Reject
                  </Button>
                )}
                {p.verificationStatus === "VERIFIED" && (
                  <Button size="sm" variant="outline" onClick={() => handleVerify(p.id, "SUSPEND")} disabled={actionLoading === p.id}>
                    <Ban className="w-4 h-4 mr-1 text-slate-500" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
          {providers.length === 0 && <p className="text-center text-slate-400 py-8">No providers found</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
          <span className="flex items-center text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

// ── Requests Tab ──

function RequestsTab() {
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignRequestId, setAssignRequestId] = useState<number | null>(null);
  const [assignProviderId, setAssignProviderId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const result = await serviceAdminService.listAllRequests({ status: statusFilter || undefined, page: p });
      setRequests(result.content);
      setTotalPages(result.totalPages);
      setPage(p);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAssign = (requestId: number) => {
    setAssignRequestId(requestId);
    setAssignProviderId("");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!assignRequestId || !assignProviderId) {
      toast.error("Provider ID is required");
      return;
    }
    setAssigning(true);
    try {
      await serviceAdminService.assignProvider(assignRequestId, { providerId: Number(assignProviderId) });
      toast.success("Provider assigned");
      setAssignDialogOpen(false);
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign provider");
    } finally {
      setAssigning(false);
    }
  };

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    MATCHING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    ASSIGNED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    DISPUTED: "bg-red-50 text-red-600 border border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Service Requests</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="MATCHING">Matching</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {req.requesterName} · {req.categoryName} · {req.urgency}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusStyles[req.status])}>
                    {req.status.replace("_", " ")}
                  </span>
                  {req.assignedProviderName && (
                    <span className="text-xs text-slate-500">→ {req.assignedProviderName}</span>
                  )}
                </div>
              </div>
              {["SUBMITTED", "MATCHING"].includes(req.status) && (
                <Button size="sm" variant="outline" onClick={() => openAssign(req.id)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Assign
                </Button>
              )}
            </div>
          ))}
          {requests.length === 0 && <p className="text-center text-slate-400 py-8">No requests found</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
          <span className="flex items-center text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Provider ID</Label>
            <Input
              type="number"
              placeholder="Enter provider ID"
              value={assignProviderId}
              onChange={(e) => setAssignProviderId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Work Orders Tab ──

function WorkOrdersTab() {
  const [workOrders, setWorkOrders] = useState<CspWorkOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const result = await serviceAdminService.listAllWorkOrders({ status: statusFilter || undefined, page: p });
      setWorkOrders(result.content);
      setTotalPages(result.totalPages);
      setPage(p);
    } catch {
      toast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Work Orders</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {workOrders.map((wo) => (
            <div key={wo.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Work Order #{wo.id}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Provider: {wo.providerName} · Status: {wo.status.replace("_", " ")}
              </p>
              {wo.scheduledStart && (
                <p className="text-xs text-slate-500">Scheduled: {new Date(wo.scheduledStart).toLocaleString()}</p>
              )}
              {wo.actualEnd && (
                <p className="text-xs text-slate-500">Completed: {new Date(wo.actualEnd).toLocaleString()}</p>
              )}
            </div>
          ))}
          {workOrders.length === 0 && <p className="text-center text-slate-400 py-8">No work orders found</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
          <span className="flex items-center text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
