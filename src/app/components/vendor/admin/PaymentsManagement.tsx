import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Loader2,
  Calendar,
  DollarSign,
  CreditCard,
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
import { vendorPaymentService } from "../../../../services/vendorService";
import { showError } from "../../../../utils/ToastUtils";
import type {
  VendorPaymentResponse,
  PaginatedResponse,
} from "../../../../types/api";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "destructive" },
};

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  CHEQUE: "Cheque",
  CASH: "Cash",
  WALLET: "Wallet",
  CARD: "Card",
};

export function PaymentsManagement() {
  const [payments, setPayments] = useState<VendorPaymentResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;

      const result: PaginatedResponse<VendorPaymentResponse> =
        await vendorPaymentService.getPayments(params as any);
      let filtered = result.content;

      if (methodFilter !== "ALL") {
        filtered = filtered.filter((p) => p.method === methodFilter);
      }
      if (search) {
        filtered = filtered.filter(
          (p) =>
            p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
            p.vendor.businessName.toLowerCase().includes(search.toLowerCase()) ||
            p.invoiceNumber.toLowerCase().includes(search.toLowerCase()),
        );
      }

      setPayments(filtered);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, search]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

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
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track vendor payment transactions
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
                placeholder="Search payments..."
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-44">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
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
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden lg:table-cell">Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const badge = STATUS_BADGE[p.status] || { label: p.status, variant: "outline" as const };
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground font-mono">
                              {p.paymentNumber}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Invoice: {p.invoiceNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-foreground">{p.vendor.businessName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatCurrency(p.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {p.paidAt
                              ? new Date(p.paidAt).toLocaleDateString()
                              : new Date(p.createdAt).toLocaleDateString()}
                          </div>
                          {p.transactionId && (
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                              Txn: {p.transactionId}
                            </p>
                          )}
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
    </div>
  );
}
