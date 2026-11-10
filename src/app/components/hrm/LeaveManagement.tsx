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
import type { LeaveRequest, LeaveType, HrHoliday, PageResponse } from "../../../types/hrm";
import { format } from "date-fns";

const APPROVAL_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
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

  const [addLeaveTypeOpen, setAddLeaveTypeOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({ leaveTypeName: "", defaultBalance: 12 });
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
      setLeaveTypes(await hrmService.getLeaveTypes(id));
    } catch { /* ignore */ }
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

  async function handleAddLeaveType() {
    if (!orgId || !newLeaveType.leaveTypeName.trim()) return;
    setSavingLeaveType(true);
    try {
      await hrmService.createLeaveType(orgId, newLeaveType);
      showSuccess("Leave type created");
      setAddLeaveTypeOpen(false);
      setNewLeaveType({ leaveTypeName: "", defaultBalance: 12 });
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
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

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
                              <div className="flex gap-1">
                                <Button size="sm" variant="default" onClick={() => setActionDialog({ id: r.id, action: "approve" })}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setActionDialog({ id: r.id, action: "reject" })}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
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
                              <Badge variant={APPROVAL_BADGE[r.approvalStatus] || "outline"}>{r.approvalStatus}</Badge>
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
                        <p className="text-xs text-muted-foreground">{lt.defaultBalance} days/year · {lt.isPaid ? "Paid" : "Unpaid"}</p>
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
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lt-name">Leave Type Name *</Label>
              <Input id="lt-name" value={newLeaveType.leaveTypeName} onChange={(e) => setNewLeaveType({ ...newLeaveType, leaveTypeName: e.target.value })} placeholder="e.g. Casual Leave" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lt-balance">Default Balance (days/year)</Label>
              <Input id="lt-balance" type="number" value={newLeaveType.defaultBalance} onChange={(e) => setNewLeaveType({ ...newLeaveType, defaultBalance: Number(e.target.value) })} />
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
