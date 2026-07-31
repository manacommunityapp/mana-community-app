import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Loader2,
  Plus,
  Calendar,
  MapPin,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
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
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { vendorWorkOrderService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  WorkOrderResponse,
  WorkOrderRequest,
  WorkOrderPriority,
  PaginatedResponse,
} from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  OPEN: { label: "Open", variant: "secondary" },
  ASSIGNED: { label: "Assigned", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  CLOSED: { label: "Closed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const PRIORITY_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Low", variant: "outline" },
  MEDIUM: { label: "Medium", variant: "secondary" },
  HIGH: { label: "High", variant: "default" },
  URGENT: { label: "Urgent", variant: "destructive" },
  CRITICAL: { label: "Critical", variant: "destructive" },
};

const EMPTY_FORM: WorkOrderRequest = {
  title: "",
  description: "",
  priority: "MEDIUM",
  category: "",
  location: "",
  scheduledDate: "",
  dueDate: "",
  estimatedCost: undefined,
};

export function WorkOrdersManagement() {
  const [workOrders, setWorkOrders] = useState<WorkOrderResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState<WorkOrderRequest>({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    workOrder: WorkOrderResponse | null;
    newStatus: string;
  }>({ open: false, workOrder: null, newStatus: "" });
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;

      const result: PaginatedResponse<WorkOrderResponse> =
        await vendorWorkOrderService.getWorkOrders(params as any);
      const filtered = search
        ? result.content.filter(
            (w) =>
              w.title.toLowerCase().includes(search.toLowerCase()) ||
              w.workOrderNumber.toLowerCase().includes(search.toLowerCase()),
          )
        : result.content;
      setWorkOrders(filtered);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, search]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  async function handleCreate() {
    setFormLoading(true);
    try {
      await vendorWorkOrderService.createWorkOrder(formData);
      showSuccess("Work order created");
      setCreateDialog(false);
      setFormData({ ...EMPTY_FORM });
      loadWorkOrders();
    } catch {
      showError("Failed to create work order");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!statusDialog.workOrder) return;
    setStatusLoading(true);
    try {
      await vendorWorkOrderService.updateWorkOrderStatus(
        statusDialog.workOrder.id,
        statusDialog.newStatus,
        statusComment || undefined,
      );
      showSuccess("Status updated");
      setStatusDialog({ open: false, workOrder: null, newStatus: "" });
      setStatusComment("");
      loadWorkOrders();
    } catch {
      showError("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage maintenance work orders
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Work Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
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
              <p className="text-sm text-muted-foreground">No work orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor</TableHead>
                    <TableHead className="hidden lg:table-cell">Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((w) => {
                    const sBadge = STATUS_BADGE[w.status] || { label: w.status, variant: "outline" as const };
                    const pBadge = PRIORITY_BADGE[w.priority] || { label: w.priority, variant: "outline" as const };
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground font-mono">
                              {w.workOrderNumber}
                            </p>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {w.title}
                            </p>
                            {w.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3" /> {w.location}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">
                            {w.vendor?.businessName ?? "--"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {w.scheduledDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Scheduled: {new Date(w.scheduledDate).toLocaleDateString()}
                              </div>
                            )}
                            {w.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(w.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setStatusDialog({ open: true, workOrder: w, newStatus: w.status })
                            }
                          >
                            Update Status
                          </Button>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create work order dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setFormData({ ...EMPTY_FORM }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>Create a new maintenance work order.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wo-title">Title</Label>
              <Input
                id="wo-title"
                placeholder="Work order title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo-desc">Description</Label>
              <Textarea
                id="wo-desc"
                placeholder="Detailed description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as WorkOrderPriority })}
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
              <div className="space-y-2">
                <Label htmlFor="wo-category">Category</Label>
                <Input
                  id="wo-category"
                  placeholder="e.g. Plumbing"
                  value={formData.category ?? ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo-location">Location</Label>
              <Input
                id="wo-location"
                placeholder="Work location"
                value={formData.location ?? ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wo-scheduled">Scheduled Date</Label>
                <Input
                  id="wo-scheduled"
                  type="date"
                  value={formData.scheduledDate ?? ""}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wo-due">Due Date</Label>
                <Input
                  id="wo-due"
                  type="date"
                  value={formData.dueDate ?? ""}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo-cost">Estimated Cost</Label>
              <Input
                id="wo-cost"
                type="number"
                placeholder="0.00"
                value={formData.estimatedCost ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedCost: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(false); setFormData({ ...EMPTY_FORM }); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={formLoading || !formData.title.trim() || !formData.description.trim()}
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status update dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog({ open: false, workOrder: null, newStatus: "" });
            setStatusComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Work Order Status</DialogTitle>
            <DialogDescription>
              Change status for &quot;{statusDialog.workOrder?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={statusDialog.newStatus} onValueChange={(v) => setStatusDialog({ ...statusDialog, newStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-comment">Comment (optional)</Label>
              <Textarea
                id="status-comment"
                placeholder="Add a comment..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialog({ open: false, workOrder: null, newStatus: "" });
                setStatusComment("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={statusLoading || !statusDialog.newStatus}>
              {statusLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
