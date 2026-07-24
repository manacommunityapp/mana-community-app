import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  User,
  Package,
  ClipboardList,
  Hammer,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
import {
  serviceProviderService,
  serviceCatalogService,
} from "../../../services/servicePlatformService";
import type {
  ServiceProviderResponse,
  ServiceOfferingResponse,
  ServiceRequestResponse,
  CspWorkOrderResponse,
  ServiceDomainResponse,
  ServiceCategoryResponse,
  RegisterProviderRequest,
  CreateOfferingRequest,
  CspWorkOrderStatus,
} from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VERIFICATION_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  VERIFIED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUSPENDED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const WORK_ORDER_NEXT_STATUS: Record<string, CspWorkOrderStatus> = {
  CREATED: "SCHEDULED",
  SCHEDULED: "EN_ROUTE",
  EN_ROUTE: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

export function ProviderDashboard() {
  const [provider, setProvider] = useState<ServiceProviderResponse | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceProviderService
      .getMyProfile()
      .then(setProvider)
      .catch((err) => {
        if (err?.status === 404 || err?.message?.includes("404")) {
          setNotRegistered(true);
        } else {
          toast.error("Failed to load provider profile");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRegistered = (p: ServiceProviderResponse) => {
    setProvider(p);
    setNotRegistered(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (notRegistered) {
    return <RegistrationCard onRegistered={handleRegistered} />;
  }

  if (!provider) return null;

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="w-4 h-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="offerings" className="gap-1.5">
          <Package className="w-4 h-4" /> My Offerings
        </TabsTrigger>
        <TabsTrigger value="requests" className="gap-1.5">
          <ClipboardList className="w-4 h-4" /> Assigned Requests
        </TabsTrigger>
        <TabsTrigger value="work-orders" className="gap-1.5">
          <Hammer className="w-4 h-4" /> Work Orders
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab provider={provider} onUpdated={setProvider} />
      </TabsContent>
      <TabsContent value="offerings">
        <OfferingsTab />
      </TabsContent>
      <TabsContent value="requests">
        <AssignedRequestsTab />
      </TabsContent>
      <TabsContent value="work-orders">
        <WorkOrdersTab />
      </TabsContent>
    </Tabs>
  );
}

// ── Registration Card ──

function RegistrationCard({ onRegistered }: { onRegistered: (p: ServiceProviderResponse) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RegisterProviderRequest>({
    providerType: "INDIVIDUAL",
    businessName: "",
    phone: "",
    email: "",
    bio: "",
    serviceAreas: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.providerType) {
      toast.error("Provider type is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await serviceProviderService.register(form);
      toast.success("Registered as a service provider!");
      setOpen(false);
      onRegistered(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
          <Hammer className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Become a Service Provider
        </h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Register to offer your services to the community. Once verified by an admin, you can manage offerings and accept service requests.
        </p>
        <Button onClick={() => setOpen(true)}>Register as Provider</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Provider Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Provider Type</Label>
              <Select value={form.providerType} onValueChange={(v) => setForm({ ...form, providerType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Business Name</Label>
              <Input value={form.businessName ?? ""} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input placeholder="Phone number" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input placeholder="Email address" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Bio</Label>
              <Textarea rows={3} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Service Areas</Label>
              <Input placeholder="e.g. Block A, Block B" value={form.serviceAreas ?? ""} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Certifications (optional)</Label>
              <Input value={form.certifications ?? ""} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Registering..." : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Profile Tab ──

function ProfileTab({
  provider,
  onUpdated,
}: {
  provider: ServiceProviderResponse;
  onUpdated: (p: ServiceProviderResponse) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<RegisterProviderRequest>({
    providerType: provider.providerType,
    businessName: provider.businessName,
    phone: provider.phone ?? undefined,
    email: provider.email ?? undefined,
    bio: provider.bio ?? undefined,
    serviceAreas: provider.serviceAreas ?? undefined,
    certifications: provider.certifications ?? undefined,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await serviceProviderService.updateMyProfile(form);
      onUpdated(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Provider Profile</h3>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", VERIFICATION_STYLES[provider.verificationStatus])}>
            {provider.verificationStatus}
          </span>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Provider Type</Label>
            <Select value={form.providerType} onValueChange={(v) => setForm({ ...form, providerType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Business Name</Label>
            <Input value={form.businessName ?? ""} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Service Areas</Label>
            <Input value={form.serviceAreas ?? ""} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Certifications</Label>
            <Input value={form.certifications ?? ""} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500">Business Name</span>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.businessName}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Type</span>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.providerType}</p>
          </div>
          {provider.bio && (
            <div className="col-span-2">
              <span className="text-xs text-slate-500">Bio</span>
              <p className="text-slate-700 dark:text-slate-300">{provider.bio}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-500">Phone</span>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.phone ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Email</span>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.email ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Service Areas</span>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.serviceAreas ?? "—"}</p>
          </div>
          {provider.certifications && (
            <div>
              <span className="text-xs text-slate-500">Certifications</span>
              <p className="text-slate-700 dark:text-slate-300">{provider.certifications}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Offerings Tab ──

function OfferingsTab() {
  const [offerings, setOfferings] = useState<ServiceOfferingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<ServiceOfferingResponse | null>(null);

  // Category selection state
  const [domains, setDomains] = useState<ServiceDomainResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateOfferingRequest>({
    categoryId: 0,
    title: "",
    description: "",
    basePrice: 0,
    pricingUnit: "FLAT",
  });
  const [saving, setSaving] = useState(false);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      setOfferings(await serviceProviderService.listMyOfferings());
    } catch {
      toast.error("Failed to load offerings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const loadDomains = async () => {
    if (domains.length > 0) return;
    try {
      setDomains(await serviceCatalogService.listDomains());
    } catch {
      toast.error("Failed to load domains");
    }
  };

  const handleDomainChange = async (domainId: string) => {
    const id = Number(domainId);
    setSelectedDomainId(id);
    try {
      setCategories(await serviceCatalogService.listCategories(id));
    } catch {
      toast.error("Failed to load categories");
    }
  };

  const openCreate = async () => {
    setEditingOffering(null);
    setForm({ categoryId: 0, title: "", description: "", basePrice: 0, pricingUnit: "FLAT" });
    setSelectedDomainId(null);
    setCategories([]);
    await loadDomains();
    setDialogOpen(true);
  };

  const openEdit = async (o: ServiceOfferingResponse) => {
    setEditingOffering(o);
    setForm({
      categoryId: o.categoryId,
      title: o.title,
      description: o.description ?? "",
      basePrice: o.basePrice,
      pricingUnit: o.pricingUnit,
      customFieldValues: o.customFieldValues ?? undefined,
    });
    await loadDomains();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.categoryId || !form.title.trim()) {
      toast.error("Category and title are required");
      return;
    }
    setSaving(true);
    try {
      if (editingOffering) {
        await serviceProviderService.updateOffering(editingOffering.id, form);
        toast.success("Offering updated");
      } else {
        await serviceProviderService.createOffering(form);
        toast.success("Offering created");
      }
      setDialogOpen(false);
      loadOfferings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save offering");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this offering?")) return;
    try {
      await serviceProviderService.deleteOffering(id);
      toast.success("Offering deleted");
      loadOfferings();
    } catch {
      toast.error("Failed to delete offering");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Offerings</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Offering
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {offerings.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{o.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{o.categoryName} · {o.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-emerald-600">${o.basePrice} {o.pricingUnit.toLowerCase()}</span>
                  <Badge variant={o.available ? "default" : "secondary"} className="text-xs">
                    {o.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(o)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(o.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {offerings.length === 0 && (
            <p className="text-center text-slate-400 py-8">No offerings yet. Add your first one!</p>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOffering ? "Edit Offering" : "Add Offering"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingOffering && (
              <>
                <div className="space-y-1">
                  <Label>Domain</Label>
                  <Select value={selectedDomainId ? String(selectedDomainId) : ""} onValueChange={handleDomainChange}>
                    <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={form.categoryId ? String(form.categoryId) : ""} onValueChange={(v) => setForm({ ...form, categoryId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Base Price</Label>
                <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Pricing Unit</Label>
                <Select value={form.pricingUnit} onValueChange={(v) => setForm({ ...form, pricingUnit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="PER_UNIT">Per Unit</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingOffering ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Assigned Requests Tab ──

function AssignedRequestsTab() {
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceProviderService.listMyRequests();
      setRequests(result.content);
    } catch {
      toast.error("Failed to load assigned requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try {
      await serviceProviderService.acceptRequest(id);
      toast.success("Request accepted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: number) => {
    setActionLoading(id);
    try {
      await serviceProviderService.declineRequest(id);
      toast.success("Request declined");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Requests</h3>
      {requests.map((req) => (
        <div
          key={req.id}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{req.categoryName} · {req.urgency}</p>
              <p className="text-xs text-slate-500 mt-0.5">From: {req.requesterName}</p>
            </div>
            {req.status === "ASSIGNED" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(req.id)}
                  disabled={actionLoading === req.id}
                >
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(req.id)}
                  disabled={actionLoading === req.id}
                >
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      {requests.length === 0 && (
        <p className="text-center text-slate-400 py-8">No assigned requests</p>
      )}
    </div>
  );
}

// ── Work Orders Tab ──

function WorkOrdersTab() {
  const [workOrders, setWorkOrders] = useState<CspWorkOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceProviderService.listMyWorkOrders();
      setWorkOrders(result.content);
    } catch {
      toast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advanceStatus = async (wo: CspWorkOrderResponse) => {
    const nextStatus = WORK_ORDER_NEXT_STATUS[wo.status];
    if (!nextStatus) return;
    setActionLoading(wo.id);
    try {
      await serviceProviderService.updateWorkOrderStatus(wo.id, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus.replace("_", " ")}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Work Orders</h3>
      {workOrders.map((wo) => {
        const nextStatus = WORK_ORDER_NEXT_STATUS[wo.status];
        return (
          <div
            key={wo.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Work Order #{wo.id}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Status: {wo.status.replace("_", " ")}</p>
                {wo.scheduledStart && (
                  <p className="text-xs text-slate-500">Scheduled: {new Date(wo.scheduledStart).toLocaleString()}</p>
                )}
              </div>
              {nextStatus && (
                <Button
                  size="sm"
                  onClick={() => advanceStatus(wo)}
                  disabled={actionLoading === wo.id}
                >
                  {actionLoading === wo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Mark {nextStatus.replace("_", " ")}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {workOrders.length === 0 && (
        <p className="text-center text-slate-400 py-8">No work orders</p>
      )}
    </div>
  );
}
