import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Loader2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { vendorWorkOrderService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type { WorkOrderResponse, WorkOrderRequest, PaginatedResponse } from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  OPEN: { label: "Open", variant: "secondary" },
  ASSIGNED: { label: "Assigned", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CLOSED: { label: "Closed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-blue-50 text-blue-700 border-blue-200" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 border-amber-200" },
  HIGH: { label: "High", className: "bg-orange-50 text-orange-700 border-orange-200" },
  URGENT: { label: "Urgent", className: "bg-red-50 text-red-700 border-red-200" },
  CRITICAL: { label: "Critical", className: "bg-red-100 text-red-900 border-red-300" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["CLOSED"],
};

const EMPTY_WO: WorkOrderRequest = {
  title: "",
  description: "",
  priority: "MEDIUM",
  category: "",
  location: "",
  scheduledDate: "",
  estimatedCost: undefined,
};

export function WorkOrdersManagement() {
  const [workOrders, setWorkOrders] = useState<WorkOrderResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<WorkOrderRequest>({ ...EMPTY_WO });
  const [saving, setSaving] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<WorkOrderResponse | null>(null);

  // Status update
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; wo: WorkOrderResponse | null; newStatus: string }>({
    open: false, wo: null, newStatus: "",
  });
  const [statusComment, setStatusComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;

      const result: PaginatedResponse<WorkOrderResponse> =
        await vendorWorkOrderService.getWorkOrders(params as any);
      setWorkOrders(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await vendorWorkOrderService.createWorkOrder(form);
      showSuccess("Work order created");
      setCreateOpen(false);
      setForm({ ...EMPTY_WO });
      loadData();
    } catch {
      showError("Failed to create work order");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate() {
    if (!statusDialog.wo || !statusDialog.newStatus) return;
    setUpdatingStatus(true);
    try {
      await vendorWorkOrderService.updateWorkOrderStatus(
        statusDialog.wo.id,
        statusDialog.newStatus,
        statusComment || undefined,
      );
      showSuccess("Status updated");
      setStatusDialog({ open: false, wo: null, newStatus: "" });
      setStatusComment("");
      loadData();
    } catch {
      showError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const formatCurrency = (n?: number) =>
    n != null
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
      : "--";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage work orders for vendors
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Work Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No work orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => {
                    const sBadge = STATUS_BADGE[wo.status] || { label: wo.status, variant: "outline" as const };
                    const pBadge = PRIORITY_BADGE[wo.priority] || { label: wo.priority, className: "" };
                    const transitions = STATUS_TRANSITIONS[wo.status] || [];
                    return (
                      <TableRow key={wo.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{wo.title}</p>
                            <p className="text-xs text-muted-foreground">#{wo.workOrderNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">
                            {wo.vendor?.businessName || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${pBadge.className}`}>
                            {pBadge.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "--"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-foreground">
                            {formatCurrency(wo.actualCost ?? wo.estimatedCost)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Details"
                              onClick={() => { setSelected(wo); setDetailOpen(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transitions.length > 0 && (
                              <Select
                                value=""
                                onValueChange={(newStatus) => {
                                  setStatusDialog({ open: true, wo, newStatus });
                                }}
                              >
                                <SelectTrigger className="h-8 w-28 text-xs">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  {transitions.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {STATUS_BADGE[s]?.label ?? s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setForm({ ...EMPTY_WO }); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>Create a new work order for a vendor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Fix leaking pipe in Block A"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  value={form.category || ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Plumbing"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Location</label>
                <Input
                  value={form.location || ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Block A, Floor 3"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Due Date</label>
                <Input
                  type="date"
                  value={form.dueDate || ""}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Estimated Cost</label>
              <Input
                type="number"
                value={form.estimatedCost ?? ""}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setForm({ ...EMPTY_WO }); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status update dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => { if (!open) { setStatusDialog({ open: false, wo: null, newStatus: "" }); setStatusComment(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change "{statusDialog.wo?.title}" to {STATUS_BADGE[statusDialog.newStatus]?.label || statusDialog.newStatus}?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Comment (optional)..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusDialog({ open: false, wo: null, newStatus: "" }); setStatusComment(""); }}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updatingStatus}>
              {updatingStatus && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Work Order Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Number</p>
                  <p className="font-medium text-foreground">#{selected.workOrderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{selected.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGE[selected.status]?.variant ?? "outline"}>
                    {STATUS_BADGE[selected.status]?.label ?? selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[selected.priority]?.className || ""}`}>
                    {PRIORITY_BADGE[selected.priority]?.label ?? selected.priority}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium text-foreground">{selected.vendor?.businessName || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{selected.location || "--"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Cost</p>
                  <p className="font-medium text-foreground">{formatCurrency(selected.estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual Cost</p>
                  <p className="font-medium text-foreground">{formatCurrency(selected.actualCost)}</p>
                </div>
              </div>
              {selected.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="text-foreground whitespace-pre-wrap">{selected.description}</p>
                </div>
              )}
              {selected.timeline && selected.timeline.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">Timeline</p>
                  <div className="space-y-2 border-l-2 border-border pl-3">
                    {selected.timeline.map((entry) => (
                      <div key={entry.id} className="text-xs">
                        <p className="font-medium text-foreground">
                          {STATUS_BADGE[entry.status]?.label ?? entry.status}
                        </p>
                        {entry.comment && <p className="text-muted-foreground">{entry.comment}</p>}
                        <p className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
