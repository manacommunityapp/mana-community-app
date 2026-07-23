import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
  User,
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
import { vendorRegistrationService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  VendorRegistrationResponse,
  PaginatedResponse,
} from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  INCOMPLETE: { label: "Incomplete", variant: "outline" },
};

export function VendorRegistrations() {
  const [registrations, setRegistrations] = useState<VendorRegistrationResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "approve" | "reject";
    registration: VendorRegistrationResponse | null;
  }>({ open: false, type: "approve", registration: null });
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    registration: VendorRegistrationResponse | null;
  }>({ open: false, registration: null });

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter !== "ALL" ? statusFilter : undefined;
      const result: PaginatedResponse<VendorRegistrationResponse> =
        await vendorRegistrationService.getRegistrations(status, page, 10);
      const filtered = search
        ? result.content.filter(
            (r) =>
              r.businessName.toLowerCase().includes(search.toLowerCase()) ||
              r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
              r.ownerEmail.toLowerCase().includes(search.toLowerCase()),
          )
        : result.content;
      setRegistrations(filtered);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleAction() {
    if (!actionDialog.registration) return;
    setActionLoading(true);
    try {
      const id = actionDialog.registration.id;
      if (actionDialog.type === "approve") {
        await vendorRegistrationService.approveRegistration(id, actionReason || undefined);
        showSuccess("Registration approved");
      } else {
        await vendorRegistrationService.rejectRegistration(id, actionReason);
        showSuccess("Registration rejected");
      }
      setActionDialog({ open: false, type: "approve", registration: null });
      setActionReason("");
      loadRegistrations();
    } catch {
      showError(`Failed to ${actionDialog.type} registration`);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendor Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage vendor registration applications
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
                placeholder="Search by business or owner..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
          ) : registrations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No registrations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead className="hidden md:table-cell">Owner</TableHead>
                    <TableHead className="hidden lg:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((r) => {
                    const badge = STATUS_BADGE[r.status] || { label: r.status, variant: "outline" as const };
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {r.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.ownerEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-sm text-foreground">
                              <User className="h-3 w-3 text-muted-foreground" /> {r.ownerName}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {r.ownerPhone || "--"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-foreground">{r.categoryName || "--"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(r.submittedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View details"
                              onClick={() => setDetailDialog({ open: true, registration: r })}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {(r.status === "PENDING" || r.status === "UNDER_REVIEW") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Approve"
                                  onClick={() =>
                                    setActionDialog({ open: true, type: "approve", registration: r })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reject"
                                  onClick={() =>
                                    setActionDialog({ open: true, type: "reject", registration: r })
                                  }
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
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

      {/* Detail dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => {
          if (!open) setDetailDialog({ open: false, registration: null });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              {detailDialog.registration?.businessName}
            </DialogDescription>
          </DialogHeader>
          {detailDialog.registration && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Owner</p>
                  <p className="font-medium text-foreground">{detailDialog.registration.ownerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGE[detailDialog.registration.status]?.variant ?? "outline"}>
                    {STATUS_BADGE[detailDialog.registration.status]?.label ?? detailDialog.registration.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-foreground">{detailDialog.registration.ownerEmail}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-foreground">{detailDialog.registration.ownerPhone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{detailDialog.registration.categoryName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium text-foreground">
                    {new Date(detailDialog.registration.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {detailDialog.registration.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium text-foreground">{detailDialog.registration.description}</p>
                </div>
              )}
              {detailDialog.registration.address && (
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">{detailDialog.registration.address}</p>
                </div>
              )}
              {detailDialog.registration.rejectionReason && (
                <div>
                  <p className="text-muted-foreground">Rejection Reason</p>
                  <p className="font-medium text-destructive">{detailDialog.registration.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, registration: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, type: "approve", registration: null });
            setActionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionDialog.type} Registration</DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" &&
                `Approve "${actionDialog.registration?.businessName}" registration? You may add optional notes.`}
              {actionDialog.type === "reject" &&
                `Reject "${actionDialog.registration?.businessName}"? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder={actionDialog.type === "approve" ? "Notes (optional)..." : "Reason for rejection..."}
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            className="min-h-[80px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, type: "approve", registration: null });
                setActionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || (actionDialog.type === "reject" && !actionReason.trim())}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
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
