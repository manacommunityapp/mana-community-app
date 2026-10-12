import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../commons/ui/table";
import { Badge } from "../../commons/ui/badge";
import { Button } from "../../commons/ui/button";
import { Input } from "../../commons/ui/input";
import { Textarea } from "../../commons/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../commons/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../commons/ui/dialog";
import { Label } from "../../commons/ui/label";
import { useToast } from "../../commons/ui/use-toast";
import { apiClient } from "../../../../services/common/apiClient";

interface DisputeDto {
  id: number;
  disputeCode: string;
  orderId: number;
  orderNumber: string;
  userId: number;
  userName: string;
  reason: string;
  description: string;
  requestedResolution: string;
  claimAmount: number;
  status: string;
  vendorResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  resolution: string | null;
  adminNote: string | null;
  resolvedByName: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const RESOLUTION_OPTIONS = [
  { value: "REFUND", label: "Full Refund" },
  { value: "PARTIAL_REFUND", label: "Partial Refund" },
  { value: "REPLACEMENT", label: "Replacement" },
  { value: "ACKNOWLEDGED", label: "Acknowledged (No Action)" },
  { value: "REJECTED", label: "Reject Dispute" },
];

export default function DisputeManagement() {
  const [disputes, setDisputes] = useState<DisputeDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null);
  const [resolution, setResolution] = useState("ACKNOWLEDGED");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiClient.get<Page<DisputeDto>>(`/commerce/disputes/admin?${params}`);
      setDisputes(res.content);
      setTotalPages(res.totalPages);
    } catch {
      toast({ title: "Failed to load disputes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const openResolveDialog = (dispute: DisputeDto) => {
    setSelectedDispute(dispute);
    setResolution("ACKNOWLEDGED");
    setAdminNote("");
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/commerce/disputes/${selectedDispute.disputeCode}/resolve`, {
        resolution,
        adminNote,
      });
      toast({ title: "Dispute resolved successfully" });
      setResolveDialogOpen(false);
      fetchDisputes();
    } catch {
      toast({ title: "Failed to resolve dispute", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and resolve buyer disputes for your community
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Label className="text-sm font-medium">Status:</Label>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispute #</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Claim (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raised On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.disputeCode}</TableCell>
                  <TableCell className="font-mono text-xs">{d.orderNumber}</TableCell>
                  <TableCell>{d.userName}</TableCell>
                  <TableCell className="max-w-[160px] truncate" title={d.reason}>{d.reason}</TableCell>
                  <TableCell className="text-right">
                    {d.claimAmount > 0 ? `₹${Number(d.claimAmount).toLocaleString("en-IN")}` : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "—"}
                  </TableCell>
                  <TableCell>
                    {d.status !== "RESOLVED" && d.status !== "CLOSED" ? (
                      <Button size="sm" variant="outline" onClick={() => openResolveDialog(d)}>
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {d.resolution ?? "Resolved"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm self-center text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-md p-3 space-y-1 text-sm">
                <div><span className="font-medium">Dispute:</span> {selectedDispute.disputeCode}</div>
                <div><span className="font-medium">Order:</span> {selectedDispute.orderNumber}</div>
                <div><span className="font-medium">Buyer:</span> {selectedDispute.userName}</div>
                <div><span className="font-medium">Reason:</span> {selectedDispute.reason}</div>
                {selectedDispute.description && (
                  <div><span className="font-medium">Details:</span> {selectedDispute.description}</div>
                )}
                {selectedDispute.claimAmount > 0 && (
                  <div><span className="font-medium">Claim:</span> ₹{Number(selectedDispute.claimAmount).toLocaleString("en-IN")}</div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="resolution">Resolution Action</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger id="resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {resolution === "REFUND" && (
                  <p className="text-xs text-amber-600 mt-1">
                    A full refund will be triggered automatically for this order.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="adminNote">Admin Note (internal)</Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Notes for internal reference…"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={submitting}>
              {submitting ? "Resolving…" : "Confirm Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
