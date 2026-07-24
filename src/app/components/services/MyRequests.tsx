import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { serviceRequestService, serviceProviderService } from "../../../services/servicePlatformService";
import type {
  ServiceRequestResponse,
  ServiceRequestStatus,
  CspWorkOrderStatus,
} from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MATCHING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ASSIGNED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DISPUTED: "bg-red-50 text-red-600 border border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};

const URGENCY_STYLES: Record<string, string> = {
  NORMAL: "bg-slate-100 text-slate-600",
  URGENT: "bg-yellow-100 text-yellow-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

const WORK_ORDER_STEPS: CspWorkOrderStatus[] = [
  "CREATED",
  "SCHEDULED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
];

export function MyRequests() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (id) {
    return <RequestDetail id={Number(id)} />;
  }
  return <RequestList />;
}

function RequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const result = await serviceRequestService.listMine(
        p,
        20,
        statusFilter === "ALL" ? undefined : statusFilter
      );
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

  const filtered = requests;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Service Requests</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="MATCHING">Matching</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filtered.map((req) => (
            <button
              key={req.id}
              onClick={() => navigate(`/services/requests/${req.id}`)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{req.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{req.categoryName}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_STYLES[req.status])}>
                    {req.status.replace("_", " ")}
                  </span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", URGENCY_STYLES[req.urgency])}>
                    {req.urgency}
                  </span>
                  {req.assignedProviderName && (
                    <span className="text-xs text-slate-500">
                      Provider: {req.assignedProviderName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-8">No service requests found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function RequestDetail({ id }: { id: number }) {
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequest(await serviceRequestService.getById(id));
    } catch {
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      setRequest(await serviceRequestService.submit(request.id));
      toast.success("Request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      setRequest(await serviceRequestService.cancel(request.id, cancelReason || undefined));
      setCancelDialogOpen(false);
      setCancelReason("");
      toast.success("Request cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignoff = async () => {
    if (!request?.workOrder) return;
    setActionLoading(true);
    try {
      const workOrder = await serviceProviderService.signoffWorkOrder(request.workOrder.id);
      setRequest({ ...request, workOrder });
      toast.success("Work order signed off");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign off");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-center text-slate-400 py-12">Request not found</p>;
  }

  const canSubmit = request.status === "DRAFT";
  const canCancel = ["SUBMITTED", "MATCHING", "ASSIGNED"].includes(request.status);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/services/requests")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </button>

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{request.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{request.categoryName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_STYLES[request.status])}>
              {request.status.replace("_", " ")}
            </span>
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", URGENCY_STYLES[request.urgency])}>
              {request.urgency}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300">{request.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {request.preferredDate && (
            <div>
              <span className="text-xs text-slate-500">Preferred Date</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {request.preferredDate}
                {request.preferredTimeSlot && ` · ${request.preferredTimeSlot}`}
              </p>
            </div>
          )}
          {request.address && (
            <div>
              <span className="text-xs text-slate-500">Address</span>
              <p className="font-semibold text-slate-900 dark:text-white">{request.address}</p>
            </div>
          )}
          {request.estimatedCost != null && (
            <div>
              <span className="text-xs text-slate-500">Estimated Cost</span>
              <p className="font-semibold text-slate-900 dark:text-white">${request.estimatedCost}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-500">Created</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          {request.assignedProviderName && (
            <div>
              <span className="text-xs text-slate-500">Assigned Provider</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {request.assignedProviderName}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? "Submitting..." : "Submit Request"}
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setCancelDialogOpen(true)} disabled={actionLoading}>
              Cancel Request
            </Button>
          )}
        </div>
      </div>

      {/* Work Order Progress */}
      {request.workOrder && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Work Order #{request.workOrder.id}</h3>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {WORK_ORDER_STEPS.map((step, i) => {
              const currentIdx = WORK_ORDER_STEPS.indexOf(request.workOrder!.status as CspWorkOrderStatus);
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className="flex items-center gap-1 flex-1">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0",
                    isDone ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500",
                    isCurrent && "ring-2 ring-emerald-400"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < WORK_ORDER_STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1", isDone ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700")} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            {WORK_ORDER_STEPS.map((step) => (
              <span key={step} className="text-center flex-1">{step.replace("_", " ")}</span>
            ))}
          </div>

          {/* Work order details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {request.workOrder.scheduledStart && (
              <div>
                <span className="text-xs text-slate-500">Scheduled Start</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(request.workOrder.scheduledStart).toLocaleString()}
                </p>
              </div>
            )}
            {request.workOrder.actualEnd && (
              <div>
                <span className="text-xs text-slate-500">Completed</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(request.workOrder.actualEnd).toLocaleString()}
                </p>
              </div>
            )}
            {request.workOrder.providerName && (
              <div>
                <span className="text-xs text-slate-500">Provider</span>
                <p className="font-semibold text-slate-900 dark:text-white">{request.workOrder.providerName}</p>
              </div>
            )}
          </div>

          {/* Sign Off */}
          {request.workOrder.status === "COMPLETED" && !request.workOrder.residentSignoff && (
            <Button onClick={handleSignoff} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading ? "Signing off..." : "Sign Off on Work"}
            </Button>
          )}
          {request.workOrder.residentSignoff && (
            <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Signed off on {new Date(request.workOrder.residentSignoffAt!).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Service Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Request
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
