import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Loader2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Star,
  Phone,
  Mail,
  MapPin,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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
import { vendorService, vendorCategoryService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  VendorResponse,
  VendorCategoryResponse,
  PaginatedResponse,
  VendorStatus,
} from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  INACTIVE: { label: "Inactive", variant: "outline" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  BLACKLISTED: { label: "Blacklisted", variant: "destructive" },
};

export function VendorDirectory() {
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | "suspend" | "reactivate";
    vendor: VendorResponse | null;
  }>({ open: false, type: "approve", vendor: null });
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.status = statusFilter as VendorStatus;
      if (categoryFilter !== "ALL") params.categoryId = Number(categoryFilter);

      const result: PaginatedResponse<VendorResponse> = await vendorService.getVendors(params as any);
      setVendors(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    vendorCategoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  async function handleAction() {
    if (!actionDialog.vendor) return;
    setActionLoading(true);
    try {
      const id = actionDialog.vendor.id;
      switch (actionDialog.type) {
        case "approve":
          await vendorService.approveVendor(id);
          showSuccess("Vendor approved");
          break;
        case "reject":
          await vendorService.rejectVendor(id, actionReason);
          showSuccess("Vendor rejected");
          break;
        case "suspend":
          await vendorService.suspendVendor(id, actionReason);
          showSuccess("Vendor suspended");
          break;
        case "reactivate":
          await vendorService.reactivateVendor(id);
          showSuccess("Vendor reactivated");
          break;
      }
      setActionDialog({ open: false, type: "approve", vendor: null });
      setActionReason("");
      loadVendors();
    } catch {
      showError(`Failed to ${actionDialog.type} vendor`);
    } finally {
      setActionLoading(false);
    }
  }

  const needsReason = actionDialog.type === "reject" || actionDialog.type === "suspend";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendor Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered vendors
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
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
          ) : vendors.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => {
                    const badge = STATUS_BADGE[v.status] || { label: v.status, variant: "outline" as const };
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {v.logoUrl ? (
                              <img
                                src={v.logoUrl}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {v.businessName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                                {v.businessName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {v.city && v.state ? `${v.city}, ${v.state}` : v.address}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">{v.category?.name ?? "--"}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {v.email || "--"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {v.phone || "--"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{v.avgRating?.toFixed(1) ?? "--"}</span>
                            <span className="text-xs text-muted-foreground">({v.totalRatings})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {v.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Approve"
                                  onClick={() =>
                                    setActionDialog({ open: true, type: "approve", vendor: v })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reject"
                                  onClick={() =>
                                    setActionDialog({ open: true, type: "reject", vendor: v })
                                  }
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            {v.status === "ACTIVE" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Suspend"
                                onClick={() =>
                                  setActionDialog({ open: true, type: "suspend", vendor: v })
                                }
                              >
                                <Ban className="h-4 w-4 text-orange-500" />
                              </Button>
                            )}
                            {(v.status === "SUSPENDED" || v.status === "INACTIVE") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reactivate"
                                onClick={() =>
                                  setActionDialog({ open: true, type: "reactivate", vendor: v })
                                }
                              >
                                <RotateCcw className="h-4 w-4 text-blue-500" />
                              </Button>
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

      {/* Action dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, type: "approve", vendor: null });
            setActionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionDialog.type} Vendor</DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" && `Approve "${actionDialog.vendor?.businessName}" as an active vendor?`}
              {actionDialog.type === "reject" && `Reject "${actionDialog.vendor?.businessName}"? Please provide a reason.`}
              {actionDialog.type === "suspend" && `Suspend "${actionDialog.vendor?.businessName}"? Please provide a reason.`}
              {actionDialog.type === "reactivate" && `Reactivate "${actionDialog.vendor?.businessName}"?`}
            </DialogDescription>
          </DialogHeader>

          {needsReason && (
            <Textarea
              placeholder="Reason..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, type: "approve", vendor: null });
                setActionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || (needsReason && !actionReason.trim())}
              variant={actionDialog.type === "reject" || actionDialog.type === "suspend" ? "destructive" : "default"}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
