import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Filter,
  Loader2,
  Eye,
  RefreshCw,
  XCircle,
  Calendar,
  IndianRupee,
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
import { vendorContractService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type { ContractResponse, ContractRequest, PaginatedResponse } from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  ACTIVE: { label: "Active", variant: "default" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  TERMINATED: { label: "Terminated", variant: "destructive" },
  RENEWED: { label: "Renewed", variant: "default" },
  PENDING_RENEWAL: { label: "Pending Renewal", variant: "secondary" },
};

const EMPTY_CONTRACT: ContractRequest = {
  title: "",
  vendorId: 0,
  startDate: "",
  endDate: "",
  value: 0,
  paymentTerms: "",
  scope: "",
  autoRenew: false,
  renewalPeriod: undefined,
};

export function ContractsManagement() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ContractRequest>({ ...EMPTY_CONTRACT });
  const [saving, setSaving] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ContractResponse | null>(null);

  // Renew dialog
  const [renewDialog, setRenewDialog] = useState<{ open: boolean; contract: ContractResponse | null }>({
    open: false, contract: null,
  });
  const [renewDate, setRenewDate] = useState("");
  const [renewing, setRenewing] = useState(false);

  // Terminate dialog
  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; contract: ContractResponse | null }>({
    open: false, contract: null,
  });
  const [terminateReason, setTerminateReason] = useState("");
  const [terminating, setTerminating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const result: PaginatedResponse<ContractResponse> =
        await vendorContractService.getContracts(params as any);
      setContracts(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate() {
    if (!form.title.trim() || !form.vendorId || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await vendorContractService.createContract(form);
      showSuccess("Contract created");
      setCreateOpen(false);
      setForm({ ...EMPTY_CONTRACT });
      loadData();
    } catch {
      showError("Failed to create contract");
    } finally {
      setSaving(false);
    }
  }

  async function handleRenew() {
    if (!renewDialog.contract || !renewDate) return;
    setRenewing(true);
    try {
      await vendorContractService.renewContract(renewDialog.contract.id, renewDate);
      showSuccess("Contract renewed");
      setRenewDialog({ open: false, contract: null });
      setRenewDate("");
      loadData();
    } catch {
      showError("Failed to renew contract");
    } finally {
      setRenewing(false);
    }
  }

  async function handleTerminate() {
    if (!terminateDialog.contract || !terminateReason.trim()) return;
    setTerminating(true);
    try {
      await vendorContractService.terminateContract(terminateDialog.contract.id, terminateReason);
      showSuccess("Contract terminated");
      setTerminateDialog({ open: false, contract: null });
      setTerminateReason("");
      loadData();
    } catch {
      showError("Failed to terminate contract");
    } finally {
      setTerminating(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  function daysUntilEnd(endDate: string): number {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendor contracts, renewals, and terminations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Contract
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="PENDING_RENEWAL">Pending Renewal</SelectItem>
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
          ) : contracts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No contracts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead className="hidden lg:table-cell">Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const badge = STATUS_BADGE[c.status] || { label: c.status, variant: "outline" as const };
                    const remaining = daysUntilEnd(c.endDate);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">#{c.contractNumber}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">{c.vendor?.businessName || "--"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {c.status === "ACTIVE" && remaining <= 30 && remaining > 0 && (
                            <span className="block text-[10px] text-amber-600 mt-0.5">{remaining}d left</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm font-medium text-foreground">{formatCurrency(c.value)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title="View" onClick={() => { setSelected(c); setDetailOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(c.status === "ACTIVE" || c.status === "PENDING_RENEWAL") && (
                              <Button variant="ghost" size="icon" title="Renew" onClick={() => setRenewDialog({ open: true, contract: c })}>
                                <RefreshCw className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {c.status === "ACTIVE" && (
                              <Button variant="ghost" size="icon" title="Terminate" onClick={() => setTerminateDialog({ open: true, contract: c })}>
                                <XCircle className="h-4 w-4 text-red-500" />
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
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setForm({ ...EMPTY_CONTRACT }); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>Set up a new vendor contract.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contract title" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Vendor ID *</label>
              <Input type="number" value={form.vendorId || ""} onChange={(e) => setForm({ ...form, vendorId: Number(e.target.value) })} placeholder="Vendor ID" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start Date *</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Date *</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Value *</label>
                <Input type="number" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Payment Terms</label>
                <Input value={form.paymentTerms || ""} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. NET 30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Scope</label>
              <Textarea value={form.scope || ""} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Scope of work..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setForm({ ...EMPTY_CONTRACT }); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim() || !form.vendorId || !form.startDate || !form.endDate}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew dialog */}
      <Dialog open={renewDialog.open} onOpenChange={(open) => { if (!open) { setRenewDialog({ open: false, contract: null }); setRenewDate(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Contract</DialogTitle>
            <DialogDescription>Extend "{renewDialog.contract?.title}" with a new end date.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium text-foreground">New End Date</label>
            <Input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenewDialog({ open: false, contract: null }); setRenewDate(""); }}>Cancel</Button>
            <Button onClick={handleRenew} disabled={renewing || !renewDate}>
              {renewing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate dialog */}
      <Dialog open={terminateDialog.open} onOpenChange={(open) => { if (!open) { setTerminateDialog({ open: false, contract: null }); setTerminateReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Contract</DialogTitle>
            <DialogDescription>Terminate "{terminateDialog.contract?.title}". This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for termination..." value={terminateReason} onChange={(e) => setTerminateReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTerminateDialog({ open: false, contract: null }); setTerminateReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={terminating || !terminateReason.trim()}>
              {terminating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Number</p><p className="font-medium text-foreground">#{selected.contractNumber}</p></div>
                <div><p className="text-muted-foreground">Title</p><p className="font-medium text-foreground">{selected.title}</p></div>
                <div><p className="text-muted-foreground">Vendor</p><p className="font-medium text-foreground">{selected.vendor?.businessName || "--"}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={STATUS_BADGE[selected.status]?.variant ?? "outline"}>{STATUS_BADGE[selected.status]?.label ?? selected.status}</Badge></div>
                <div><p className="text-muted-foreground">Start</p><p className="font-medium text-foreground">{new Date(selected.startDate).toLocaleDateString()}</p></div>
                <div><p className="text-muted-foreground">End</p><p className="font-medium text-foreground">{new Date(selected.endDate).toLocaleDateString()}</p></div>
                <div><p className="text-muted-foreground">Value</p><p className="font-medium text-foreground">{formatCurrency(selected.value)}</p></div>
                <div><p className="text-muted-foreground">Auto-Renew</p><p className="font-medium text-foreground">{selected.autoRenew ? "Yes" : "No"}</p></div>
              </div>
              {selected.scope && (
                <div><p className="text-muted-foreground">Scope</p><p className="text-foreground whitespace-pre-wrap">{selected.scope}</p></div>
              )}
              {selected.paymentTerms && (
                <div><p className="text-muted-foreground">Payment Terms</p><p className="text-foreground">{selected.paymentTerms}</p></div>
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
