import { useState, useEffect } from "react";
import {
  CalendarDays,
  Check,
  X,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { hrmService } from "../../../services/hrm/hrmService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type { LeaveRequest, LeaveType, HrHoliday, PageResponse, LeaveApprovalStatus, LeaveSession } from "../../../types/hrm";
import { format } from "date-fns";

const APPROVAL_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  L1_APPROVED: "secondary",
  L1_REJECTED: "destructive",
};

const APPROVAL_CLASS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  L1_APPROVED: "bg-blue-100 text-blue-800",
  L1_REJECTED: "bg-orange-100 text-orange-800",
};

export function LeaveManagement() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<HrHoliday[]>([]);

  const [pendingPage, setPendingPage] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);

  const [actionDialog, setActionDialog] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveTypeId: 0, fromDate: "", toDate: "", reason: "" });
  const [halfDay, setHalfDay] = useState(false);
  const [leaveSession, setLeaveSession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyLeaveTypes, setApplyLeaveTypes] = useState<LeaveType[]>([]);

  const [addLeaveTypeOpen, setAddLeaveTypeOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    leaveTypeName: "",
    defaultBalance: 12,
    isPaid: true,
    isCarryForward: false,
    approvalLevels: 1,
    requiresHrApproval: false,
    minNoticeDays: 0,
    maxConsecutiveDays: undefined as number | undefined,
    allowNegativeBalance: false,
  });
  const [savingLeaveType, setSavingLeaveType] = useState(false);

  const [addHolidayOpen, setAddHolidayOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ holidayName: "", holidayDate: "" });
  const [savingHoliday, setSavingHoliday] = useState(false);

  useEffect(() => {
    loadOrg();
  }, []);

  async function loadOrg() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) {
        setOrgId(orgs[0].id);
        await loadAll(orgs[0].id);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll(id: number) {
    await Promise.all([
      loadPending(id, 0),
      loadAllRequests(id, 0),
      loadLeaveTypes(id),
      loadHolidays(id),
    ]);
  }

  async function loadPending(id: number, p: number) {
    try {
      const res: PageResponse<LeaveRequest> = await hrmService.getOrgLeaveRequests(id, { status: "PENDING", page: p, size: 20 });
      setPendingRequests(res.content);
      setPendingTotalPages(res.totalPages);
    } catch { /* ignore */ }
  }

  async function loadAllRequests(id: number, p: number) {
    try {
      const res: PageResponse<LeaveRequest> = await hrmService.getOrgLeaveRequests(id, { page: p, size: 20 });
      setAllRequests(res.content);
      setAllTotalPages(res.totalPages);
    } catch { /* ignore */ }
  }

  async function loadLeaveTypes(id: number) {
    try {
      const types = await hrmService.getLeaveTypes(id);
      setLeaveTypes(types);
      setApplyLeaveTypes(types);
    } catch (err) { console.error('Failed to load leave types', err); }
  }

  async function loadHolidays(id: number) {
    try {
      setHolidays(await hrmService.getHolidays(id, new Date().getFullYear()));
    } catch { /* ignore */ }
  }

  async function handleAction() {
    if (!actionDialog || !orgId) return;
    setActionLoading(true);
    try {
      if (actionDialog.action === "approve") {
        await hrmService.approveLeave(actionDialog.id, orgId, remarks);
        showSuccess("Leave approved");
      } else {
        await hrmService.rejectLeave(actionDialog.id, orgId, remarks);
        showSuccess("Leave rejected");
      }
      setActionDialog(null);
      setRemarks("");
      await loadPending(orgId, pendingPage);
    } catch (err: any) {
      showError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApplyLeave() {
    if (!orgId || !applyForm.leaveTypeId || !applyForm.fromDate || !applyForm.toDate) return;
    setApplyLoading(true);
    try {
      const from = new Date(applyForm.fromDate);
      const to = new Date(applyForm.toDate);
      const days = halfDay ? 0.5 : Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
      await hrmService.applyLeave(orgId, {
        leaveTypeId: applyForm.leaveTypeId,
        fromDate: applyForm.fromDate,
        toDate: halfDay ? applyForm.fromDate : applyForm.toDate,
        totalDays: days,
        reason: applyForm.reason || undefined,
        halfDay: halfDay || undefined,
        leaveSession: halfDay ? leaveSession : undefined,
      });
      showSuccess("Leave request submitted");
      setApplyDialogOpen(false);
      setApplyForm({ leaveTypeId: 0, fromDate: "", toDate: "", reason: "" });
      setHalfDay(false);
      await loadAllRequests(orgId, 0);
    } catch (err: any) {
      showError(err.message || "Failed to submit leave");
    } finally {
      setApplyLoading(false);
    }
  }

  async function handleL2Approve(id: number) {
    if (!orgId) return;
    try {
      await hrmService.l2ApproveLeave(id, orgId);
      showSuccess("Leave approved (HR level)");
      await loadPending(orgId, pendingPage);
      await loadAllRequests(orgId, allPage);
    } catch (err: any) {
      showError(err.message || "HR approval failed");
    }
  }

  async function handleAddLeaveType() {
    if (!orgId || !newLeaveType.leaveTypeName.trim()) return;
    setSavingLeaveType(true);
    try {
      await hrmService.createLeaveType(orgId, newLeaveType);
      showSuccess("Leave type created");
      setAddLeaveTypeOpen(false);
      setNewLeaveType({
        leaveTypeName: "",
        defaultBalance: 12,
        isPaid: true,
        isCarryForward: false,
        approvalLevels: 1,
        requiresHrApproval: false,
        minNoticeDays: 0,
        maxConsecutiveDays: undefined,
        allowNegativeBalance: false,
      });
      await loadLeaveTypes(orgId);
    } catch (err: any) {
      showError(err.message || "Failed to create leave type");
    } finally {
      setSavingLeaveType(false);
    }
  }

  async function handleAddHoliday() {
    if (!orgId || !newHoliday.holidayName.trim() || !newHoliday.holidayDate) return;
    setSavingHoliday(true);
    try {
      await hrmService.createHoliday(orgId, newHoliday);
      showSuccess("Holiday added");
      setAddHolidayOpen(false);
      setNewHoliday({ holidayName: "", holidayDate: "" });
      await loadHolidays(orgId);
    } catch (err: any) {
      showError(err.message || "Failed to add holiday");
    } finally {
      setSavingHoliday(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>

      <Tabs defaultValue="pending">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="types">Leave Types</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setApplyDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Apply Leave
          </Button>
        </div>

        {/* Pending Approvals */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No pending leave requests</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead className="hidden md:table-cell">Reason</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employeeName || "—"}</TableCell>
                            <TableCell>{r.leaveTypeName}</TableCell>
                            <TableCell>{format(new Date(r.fromDate), "dd MMM")}</TableCell>
                            <TableCell>{format(new Date(r.toDate), "dd MMM")}</TableCell>
                            <TableCell>{r.totalDays}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[200px] truncate">{r.reason || "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {r.approvalStatus === 'PENDING' && <>
                                  <Button size="sm" variant="default" onClick={() => setActionDialog({ id: r.id, action: "approve" })}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => setActionDialog({ id: r.id, action: "reject" })}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>}
                                {r.approvalStatus === 'L1_APPROVED' && (
                                  <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => handleL2Approve(r.id)}>
                                    HR Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pendingTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {pendingPage + 1} of {pendingTotalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pendingPage === 0} onClick={() => { setPendingPage(pendingPage - 1); if (orgId) loadPending(orgId, pendingPage - 1); }}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={pendingPage >= pendingTotalPages - 1} onClick={() => { setPendingPage(pendingPage + 1); if (orgId) loadPending(orgId, pendingPage + 1); }}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Requests */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {allRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No leave requests</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employeeName || "—"}</TableCell>
                            <TableCell>{r.leaveTypeName}</TableCell>
                            <TableCell>{format(new Date(r.fromDate), "dd MMM")}</TableCell>
                            <TableCell>{format(new Date(r.toDate), "dd MMM")}</TableCell>
                            <TableCell>{r.totalDays}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${APPROVAL_CLASS[r.approvalStatus] || "bg-gray-100 text-gray-800"}`}>
                                {r.approvalStatus.replace(/_/g, " ")}
                                {r.halfDay && " (½)"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {allTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {allPage + 1} of {allTotalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={allPage === 0} onClick={() => { setAllPage(allPage - 1); if (orgId) loadAllRequests(orgId, allPage - 1); }}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={allPage >= allTotalPages - 1} onClick={() => { setAllPage(allPage + 1); if (orgId) loadAllRequests(orgId, allPage + 1); }}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Types */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Leave Types</CardTitle>
              <Button size="sm" onClick={() => setAddLeaveTypeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Type
              </Button>
            </CardHeader>
            <CardContent>
              {leaveTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No leave types configured</p>
              ) : (
                <div className="space-y-2">
                  {leaveTypes.map((lt) => (
                    <div key={lt.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{lt.leaveTypeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {lt.defaultBalance} days/year · {lt.isPaid ? "Paid" : "Unpaid"}
                          {lt.isCarryForward && " · Carry Forward"}
                          {lt.approvalLevels && lt.approvalLevels > 1 && " · 2-Level Approval"}
                          {lt.minNoticeDays ? ` · ${lt.minNoticeDays}d notice` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays */}
        <TabsContent value="holidays" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Holidays {new Date().getFullYear()}</CardTitle>
              <Button size="sm" onClick={() => setAddHolidayOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Holiday
              </Button>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No holidays configured</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <PartyPopper className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{h.holidayName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(h.holidayDate), "EEEE, dd MMMM yyyy")}</p>
                      </div>
                      {h.isOptional && <Badge variant="outline">Optional</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={applyForm.leaveTypeId}
                onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: Number(e.target.value) })}
              >
                <option value={0}>Select leave type</option>
                {applyLeaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.leaveTypeName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input type="date" value={applyForm.fromDate} onChange={(e) => {
                  setApplyForm({ ...applyForm, fromDate: e.target.value });
                  if (halfDay) setApplyForm(prev => ({ ...prev, fromDate: e.target.value, toDate: e.target.value }));
                }} />
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input type="date" value={halfDay ? applyForm.fromDate : applyForm.toDate}
                  disabled={halfDay}
                  onChange={(e) => setApplyForm({ ...applyForm, toDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="half-day-chk" checked={halfDay}
                onChange={(e) => {
                  setHalfDay(e.target.checked);
                  if (e.target.checked) setApplyForm(prev => ({ ...prev, toDate: prev.fromDate }));
                }} />
              <Label htmlFor="half-day-chk" className="cursor-pointer">Half Day</Label>
            </div>
            {halfDay && (
              <div className="flex gap-4 pl-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={leaveSession === 'FIRST_HALF'} onChange={() => setLeaveSession('FIRST_HALF')} />
                  First Half
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={leaveSession === 'SECOND_HALF'} onChange={() => setLeaveSession('SECOND_HALF')} />
                  Second Half
                </label>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} placeholder="Reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyLeave} disabled={applyLoading || !applyForm.leaveTypeId || !applyForm.fromDate}>
              {applyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRemarks(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.action === "approve" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="leave-remarks">Remarks (optional)</Label>
            <Textarea id="leave-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setRemarks(""); }}>Cancel</Button>
            <Button
              variant={actionDialog?.action === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leave Type Dialog */}
      <Dialog open={addLeaveTypeOpen} onOpenChange={setAddLeaveTypeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="lt-name">Leave Type Name *</Label>
              <Input id="lt-name" value={newLeaveType.leaveTypeName} onChange={(e) => setNewLeaveType({ ...newLeaveType, leaveTypeName: e.target.value })} placeholder="e.g. Casual Leave" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lt-balance">Default Balance (days/year)</Label>
              <Input id="lt-balance" type="number" value={newLeaveType.defaultBalance} onChange={(e) => setNewLeaveType({ ...newLeaveType, defaultBalance: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lt-min-notice">Min Notice Days</Label>
                <Input id="lt-min-notice" type="number" min={0} value={newLeaveType.minNoticeDays} onChange={(e) => setNewLeaveType({ ...newLeaveType, minNoticeDays: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lt-max-consec">Max Consecutive Days</Label>
                <Input id="lt-max-consec" type="number" min={1} value={newLeaveType.maxConsecutiveDays ?? ""} placeholder="Unlimited" onChange={(e) => setNewLeaveType({ ...newLeaveType, maxConsecutiveDays: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lt-approval-levels">Approval Levels</Label>
              <select id="lt-approval-levels" className="w-full border rounded-md px-3 py-2 text-sm" value={newLeaveType.approvalLevels} onChange={(e) => setNewLeaveType({ ...newLeaveType, approvalLevels: Number(e.target.value) })}>
                <option value={1}>1 Level (Manager)</option>
                <option value={2}>2 Levels (Manager + HR)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newLeaveType.isPaid} onChange={(e) => setNewLeaveType({ ...newLeaveType, isPaid: e.target.checked })} /> Paid Leave
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newLeaveType.isCarryForward} onChange={(e) => setNewLeaveType({ ...newLeaveType, isCarryForward: e.target.checked })} /> Allow Carry Forward
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newLeaveType.requiresHrApproval} onChange={(e) => setNewLeaveType({ ...newLeaveType, requiresHrApproval: e.target.checked })} /> Requires HR Approval
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newLeaveType.allowNegativeBalance} onChange={(e) => setNewLeaveType({ ...newLeaveType, allowNegativeBalance: e.target.checked })} /> Allow Negative Balance
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLeaveTypeOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLeaveType} disabled={savingLeaveType}>
              {savingLeaveType && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={addHolidayOpen} onOpenChange={setAddHolidayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="hol-name">Holiday Name *</Label>
              <Input id="hol-name" value={newHoliday.holidayName} onChange={(e) => setNewHoliday({ ...newHoliday, holidayName: e.target.value })} placeholder="e.g. Republic Day" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hol-date">Date *</Label>
              <Input id="hol-date" type="date" value={newHoliday.holidayDate} onChange={(e) => setNewHoliday({ ...newHoliday, holidayDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHolidayOpen(false)}>Cancel</Button>
            <Button onClick={handleAddHoliday} disabled={savingHoliday}>
              {savingHoliday && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
