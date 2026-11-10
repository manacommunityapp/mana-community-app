import { useState, useEffect } from "react";
import {
  Timer,
  Plus,
  Loader2,
  Calendar,
  ArrowLeftRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
import type { HrShift, ShiftAssignment, HrEmployeeListItem, ShiftSwapRequest } from "../../../types/hrm";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

export function ShiftManagement() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<HrShift[]>([]);
  const [schedule, setSchedule] = useState<ShiftAssignment[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [addShiftOpen, setAddShiftOpen] = useState(false);
  const [newShift, setNewShift] = useState({ shiftName: "", startTime: "09:00", endTime: "18:00", breakMinutes: 30 });
  const [savingShift, setSavingShift] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignData, setAssignData] = useState({ employeeId: "", shiftId: "", shiftDate: format(new Date(), "yyyy-MM-dd") });
  const [savingAssign, setSavingAssign] = useState(false);

  const [employees, setEmployees] = useState<HrEmployeeListItem[]>([]);

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapData, setSwapData] = useState({ targetEmployeeId: "", requesterShiftDate: format(new Date(), "yyyy-MM-dd"), targetShiftDate: format(new Date(), "yyyy-MM-dd"), reason: "" });
  const [savingSwap, setSavingSwap] = useState(false);
  const [mySwaps, setMySwaps] = useState<ShiftSwapRequest[]>([]);
  const [incomingSwaps, setIncomingSwaps] = useState<ShiftSwapRequest[]>([]);

  useEffect(() => {
    loadOrg();
  }, []);

  useEffect(() => {
    if (orgId) loadSchedule();
  }, [orgId, weekStart]);

  async function loadOrg() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) {
        setOrgId(orgs[0].id);
        await Promise.all([
          loadShifts(orgs[0].id),
          loadEmployeeList(orgs[0].id),
          loadSwaps(orgs[0].id),
        ]);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadShifts(id: number) {
    try {
      setShifts(await hrmService.getShifts(id));
    } catch (err) {
      console.error("Failed to load shifts:", err);
    }
  }

  async function loadSchedule() {
    if (!orgId) return;
    try {
      const we = endOfWeek(weekStart, { weekStartsOn: 1 });
      const data = await hrmService.getShiftSchedule(orgId, format(weekStart, "yyyy-MM-dd"), format(we, "yyyy-MM-dd"));
      setSchedule(data);
    } catch (err) {
      console.error("Failed to load schedule:", err);
    }
  }

  async function loadEmployeeList(id: number) {
    try {
      const res = await hrmService.getEmployees(id, { page: 0, size: 100, status: "ACTIVE" });
      setEmployees(res.content);
    } catch (err) {
      console.error("Failed to load employee list:", err);
    }
  }

  async function loadSwaps(id: number) {
    try {
      const [mine, incoming] = await Promise.all([
        hrmService.getMySwapRequests(id),
        hrmService.getIncomingSwapRequests(id),
      ]);
      setMySwaps(mine);
      setIncomingSwaps(incoming);
    } catch (err) {
      console.error("Failed to load swap requests:", err);
    }
  }

  async function handleRequestSwap() {
    if (!orgId || !swapData.targetEmployeeId) return;
    setSavingSwap(true);
    try {
      await hrmService.requestShiftSwap(orgId, {
        targetEmployeeId: Number(swapData.targetEmployeeId),
        requesterShiftDate: swapData.requesterShiftDate,
        targetShiftDate: swapData.targetShiftDate,
        reason: swapData.reason || undefined,
      });
      showSuccess("Swap request sent");
      setSwapOpen(false);
      await loadSwaps(orgId);
    } catch (err: any) {
      showError(err.message || "Failed to send swap request");
    } finally {
      setSavingSwap(false);
    }
  }

  async function handleRespondSwap(swapId: number, accepted: boolean) {
    if (!orgId) return;
    try {
      await hrmService.respondToSwap(orgId, swapId, accepted);
      showSuccess(accepted ? "Swap accepted" : "Swap declined");
      await loadSwaps(orgId);
    } catch (err: any) {
      showError(err.message || "Failed to respond");
    }
  }

  async function handleAddShift() {
    if (!orgId || !newShift.shiftName.trim()) return;
    setSavingShift(true);
    try {
      await hrmService.createShift(orgId, newShift);
      showSuccess("Shift created");
      setAddShiftOpen(false);
      setNewShift({ shiftName: "", startTime: "09:00", endTime: "18:00", breakMinutes: 30 });
      await loadShifts(orgId);
    } catch (err: any) {
      showError(err.message || "Failed to create shift");
    } finally {
      setSavingShift(false);
    }
  }

  async function handleAssignShift() {
    if (!orgId || !assignData.employeeId || !assignData.shiftId || !assignData.shiftDate) return;
    setSavingAssign(true);
    try {
      await hrmService.assignShift(orgId, {
        employeeId: Number(assignData.employeeId),
        shiftId: Number(assignData.shiftId),
        shiftDate: assignData.shiftDate,
      });
      showSuccess("Shift assigned");
      setAssignOpen(false);
      setAssignData({ employeeId: "", shiftId: "", shiftDate: format(new Date(), "yyyy-MM-dd") });
      await loadSchedule();
    } catch (err: any) {
      showError(err.message || "Failed to assign shift");
    } finally {
      setSavingAssign(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
          <p className="text-sm text-muted-foreground">Configure shifts and schedules</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setAddShiftOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Shift
          </Button>
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" /> Assign Shift
          </Button>
          <Button onClick={() => setSwapOpen(true)}>
            <ArrowLeftRight className="mr-2 h-4 w-4" /> Request Swap
          </Button>
        </div>
      </div>

      {/* Shift Definitions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Shift Definitions</CardTitle></CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Timer className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No shifts configured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shifts.map((s) => (
                <div key={s.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{s.shiftName}</p>
                    <Badge variant={s.isActive ? "default" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {s.startTime} — {s.endTime}
                  </p>
                  {s.breakMinutes > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{s.breakMinutes} min break</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              Prev
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, "dd MMM")} — {format(addDays(weekStart, 6), "dd MMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No shift assignments for this week</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    {weekDays.map((d) => (
                      <TableHead key={d.toISOString()} className="text-center min-w-[80px]">
                        {format(d, "EEE dd")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const byEmployee = new Map<string, ShiftAssignment[]>();
                    schedule.forEach((s) => {
                      const key = s.employeeName || String(s.employeeId);
                      if (!byEmployee.has(key)) byEmployee.set(key, []);
                      byEmployee.get(key)!.push(s);
                    });
                    return Array.from(byEmployee.entries()).map(([name, assignments]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium whitespace-nowrap">{name}</TableCell>
                        {weekDays.map((d) => {
                          const dateStr = format(d, "yyyy-MM-dd");
                          const assignment = assignments.find((a) => a.shiftDate === dateStr);
                          return (
                            <TableCell key={dateStr} className="text-center">
                              {assignment ? (
                                <Badge variant="secondary" className="text-xs">
                                  {assignment.shiftName || "Assigned"}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming Swap Requests */}
      {incomingSwaps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Incoming Swap Requests ({incomingSwaps.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingSwaps.map((sw) => (
                <div key={sw.id} className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <div>
                    <p className="text-sm font-medium">From: {sw.requesterEmployee.firstName} {sw.requesterEmployee.lastName}</p>
                    <p className="text-xs text-muted-foreground">
                      Their date: {sw.requesterShiftDate} ↔ Your date: {sw.targetShiftDate}
                    </p>
                    {sw.reason && <p className="text-xs text-muted-foreground">Reason: {sw.reason}</p>}
                  </div>
                  {sw.status === "PENDING_COLLEAGUE" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespondSwap(sw.id, true)}>Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRespondSwap(sw.id, false)}>Decline</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Swap Requests */}
      {mySwaps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">My Swap Requests</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mySwaps.map((sw) => (
                <div key={sw.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">With: {sw.targetEmployee.firstName} {sw.targetEmployee.lastName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sw.requesterShiftDate} ↔ {sw.targetShiftDate}
                    </p>
                  </div>
                  <Badge variant={sw.status === "APPROVED" ? "default" : sw.status === "REJECTED" ? "destructive" : "secondary"}>
                    {sw.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Swap Dialog */}
      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Shift Swap</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Swap With *</Label>
              <Select value={swapData.targetEmployeeId} onValueChange={(v) => setSwapData({ ...swapData, targetEmployeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select colleague" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="swap-my-date">My Shift Date *</Label>
                <Input id="swap-my-date" type="date" value={swapData.requesterShiftDate} onChange={(e) => setSwapData({ ...swapData, requesterShiftDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swap-their-date">Their Shift Date *</Label>
                <Input id="swap-their-date" type="date" value={swapData.targetShiftDate} onChange={(e) => setSwapData({ ...swapData, targetShiftDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="swap-reason">Reason</Label>
              <Textarea id="swap-reason" value={swapData.reason} onChange={(e) => setSwapData({ ...swapData, reason: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestSwap} disabled={savingSwap || !swapData.targetEmployeeId}>
              {savingSwap && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shift Dialog */}
      <Dialog open={addShiftOpen} onOpenChange={setAddShiftOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="shift-name">Shift Name *</Label>
              <Input id="shift-name" value={newShift.shiftName} onChange={(e) => setNewShift({ ...newShift, shiftName: e.target.value })} placeholder="e.g. Morning Shift" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Start Time</Label>
                <Input id="shift-start" type="time" value={newShift.startTime} onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">End Time</Label>
                <Input id="shift-end" type="time" value={newShift.endTime} onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-break">Break (minutes)</Label>
              <Input id="shift-break" type="number" value={newShift.breakMinutes} onChange={(e) => setNewShift({ ...newShift, breakMinutes: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddShiftOpen(false)}>Cancel</Button>
            <Button onClick={handleAddShift} disabled={savingShift}>
              {savingShift && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={assignData.employeeId} onValueChange={(v) => setAssignData({ ...assignData, employeeId: v })}>
                <SelectTrigger id="assign-emp">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift *</Label>
              <Select value={assignData.shiftId} onValueChange={(v) => setAssignData({ ...assignData, shiftId: v })}>
                <SelectTrigger id="assign-shift">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.shiftName} ({s.startTime}–{s.endTime})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-date">Date *</Label>
              <Input id="assign-date" type="date" value={assignData.shiftDate} onChange={(e) => setAssignData({ ...assignData, shiftDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignShift} disabled={savingAssign}>
              {savingAssign && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
