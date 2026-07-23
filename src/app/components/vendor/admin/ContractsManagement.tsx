import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Loader2,
  Plus,
  Calendar,
  Eye,
  DollarSign,
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
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { vendorContractService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  ContractResponse,
  ContractRequest,
  PaginatedResponse,
} from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  ACTIVE: { label: "Active", variant: "default" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  TERMINATED: { label: "Terminated", variant: "destructive" },
  RENEWED: { label: "Renewed", variant: "default" },
  PENDING_RENEWAL: { label: "Pending Renewal", variant: "secondary" },
};

const EMPTY_FORM: ContractRequest = {
  title: "",
  vendorId: 0,
  startDate: "",
  endDate: "",
  value: 0,
  paymentTerms: "",
  scope: "",
  termsAndConditions: "",
  autoRenew: false,
};

export function ContractsManagement() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState<ContractRequest>({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    contract: ContractResponse | null;
  }>({ open: false, contract: null });

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;

      const result: PaginatedResponse<ContractResponse> =
        await vendorContractService.getContracts(params as any);
      const filtered = search
        ? result.content.filter(
            (c) =>
              c.title.toLowerCase().includes(search.toLowerCase()) ||
              c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
              c.vendor.businessName.toLowerCase().includes(search.toLowerCase()),
          )
        : result.content;
      setContracts(filtered);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  async function handleCreate() {
    setFormLoading(true);
    try {
      await vendorContractService.createContract(formData);
      showSuccess("Contract created");
      setCreateDialog(false);
      setFormData({ ...EMPTY_FORM });
      loadContracts();
    } catch {
      showError("Failed to create contract");
    } finally {
      setFormLoading(false);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendor contracts and agreements
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Contract
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="RENEWED">Renewed</SelectItem>
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
                    <TableHead className="hidden lg:table-cell">Period</TableHead>
                    <TableHead className="hidden md:table-cell">Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const badge = STATUS_BADGE[c.status] || { label: c.status, variant: "outline" as const };
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground font-mono">
                              {c.contractNumber}
                            </p>
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {c.title}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">{c.vendor.businessName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(c.startDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(c.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatCurrency(c.value)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View details"
                            onClick={() => setDetailDialog({ open: true, contract: c })}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
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

      {/* Detail dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => {
          if (!open) setDetailDialog({ open: false, contract: null });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>
              {detailDialog.contract?.contractNumber}
            </DialogDescription>
          </DialogHeader>
          {detailDialog.contract && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{detailDialog.contract.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={STATUS_BADGE[detailDialog.contract.status]?.variant ?? "outline"}>
                    {STATUS_BADGE[detailDialog.contract.status]?.label ?? detailDialog.contract.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium text-foreground">{detailDialog.contract.vendor.businessName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-medium text-foreground">{formatCurrency(detailDialog.contract.value)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(detailDialog.contract.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(detailDialog.contract.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto Renew</p>
                  <p className="font-medium text-foreground">{detailDialog.contract.autoRenew ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signed</p>
                  <p className="font-medium text-foreground">
                    Admin: {detailDialog.contract.signedByAdmin ? "Yes" : "No"} |
                    Vendor: {detailDialog.contract.signedByVendor ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {detailDialog.contract.scope && (
                <div>
                  <p className="text-muted-foreground">Scope</p>
                  <p className="font-medium text-foreground">{detailDialog.contract.scope}</p>
                </div>
              )}
              {detailDialog.contract.paymentTerms && (
                <div>
                  <p className="text-muted-foreground">Payment Terms</p>
                  <p className="font-medium text-foreground">{detailDialog.contract.paymentTerms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, contract: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create contract dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => { if (!open) { setCreateDialog(false); setFormData({ ...EMPTY_FORM }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>Create a new vendor contract.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ct-title">Title</Label>
              <Input
                id="ct-title"
                placeholder="Contract title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-vendor">Vendor ID</Label>
              <Input
                id="ct-vendor"
                type="number"
                placeholder="Vendor ID"
                value={formData.vendorId || ""}
                onChange={(e) => setFormData({ ...formData, vendorId: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ct-start">Start Date</Label>
                <Input
                  id="ct-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ct-end">End Date</Label>
                <Input
                  id="ct-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-value">Contract Value</Label>
              <Input
                id="ct-value"
                type="number"
                placeholder="0.00"
                value={formData.value || ""}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-terms">Payment Terms</Label>
              <Input
                id="ct-terms"
                placeholder="e.g. Net 30"
                value={formData.paymentTerms ?? ""}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-scope">Scope</Label>
              <Textarea
                id="ct-scope"
                placeholder="Scope of work..."
                value={formData.scope ?? ""}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(false); setFormData({ ...EMPTY_FORM }); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={formLoading || !formData.title.trim() || !formData.vendorId || !formData.startDate || !formData.endDate}
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
