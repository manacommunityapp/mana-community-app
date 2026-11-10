import { useState, useEffect } from "react";
import {
  Clock,
  UserCheck,
  UserX,
  CalendarOff,
  Timer,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { hrmService } from "../../../services/hrm/hrmService";
import { showError, showSuccess } from "../../../utils/ToastUtils";
import type { AttendanceSummary, AttendanceCorrectionRequest } from "../../../types/hrm";
import { format } from "date-fns";

interface AttendanceRow {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  attendanceDate: string;
  firstCheckIn?: string;
  lastCheckOut?: string;
  totalWorkMinutes: number;
  attendanceStatus: string;
  overtimeMinutes?: number;
  overtimeApproved?: boolean;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PRESENT: "default",
  ABSENT: "destructive",
  HALF_DAY: "secondary",
  ON_LEAVE: "outline",
  HOLIDAY: "outline",
  WEEK_OFF: "outline",
};

export function AttendanceManagement() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctingId, setCorrectingId] = useState<number | null>(null);
  const [correction, setCorrection] = useState<AttendanceCorrectionRequest>({ reason: "" });
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    loadOrg();
  }, []);

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId, date, page]);

  async function loadOrg() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) setOrgId(orgs[0].id);
      else setLoading(false);
    } catch (err: any) {
      showError(err.message || "Failed to load organization");
      setLoading(false);
    }
  }

  async function loadData() {
    if (!orgId) return;
    setLoading(true);
    try {
      const [summaryData, reportData] = await Promise.all([
        hrmService.getAttendanceSummary(orgId, date),
        hrmService.getAttendanceReport(orgId, { date, page, size: 20 }),
      ]);
      setSummary(summaryData);
      setRows(reportData.content);
      setTotalPages(reportData.totalPages);
    } catch (err: any) {
      showError(err.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  function openCorrect(id: number) {
    setCorrectingId(id);
    setCorrection({ reason: "" });
    setCorrectOpen(true);
  }

  async function handleCorrect() {
    if (!orgId || !correctingId || !correction.reason.trim()) return;
    setSavingCorrection(true);
    try {
      await hrmService.correctAttendance(orgId, correctingId, correction);
      showSuccess("Attendance corrected");
      setCorrectOpen(false);
      await loadData();
    } catch (err: any) {
      showError(err.message || "Failed to correct attendance");
    } finally {
      setSavingCorrection(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Daily attendance report</p>
        </div>
        <Input
          id="attendance-date"
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(0); }}
          className="w-auto"
        />
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.totalPresent}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.totalAbsent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <CalendarOff className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.totalLeave}</p>
                <p className="text-xs text-muted-foreground">On Leave</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.totalHalfDay}</p>
                <p className="text-xs text-muted-foreground">Half Day</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No attendance records for this date</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Work Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>OT</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{r.employeeName || "—"}</p>
                            <p className="text-xs text-muted-foreground">{r.employeeCode || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>{r.firstCheckIn || "—"}</TableCell>
                        <TableCell>{r.lastCheckOut || "—"}</TableCell>
                        <TableCell>
                          {r.totalWorkMinutes > 0
                            ? `${Math.floor(r.totalWorkMinutes / 60)}h ${r.totalWorkMinutes % 60}m`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[r.attendanceStatus] || "outline"}>
                            {r.attendanceStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(r.overtimeMinutes ?? 0) > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                OT: {r.overtimeMinutes}m
                              </span>
                              {!r.overtimeApproved && orgId && (
                                <button
                                  onClick={() => hrmService.approveOvertime(orgId, r.id).then(() => { showSuccess("Overtime approved"); loadData(); }).catch((e: any) => showError(e.message))}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Approve
                                </button>
                              )}
                              {r.overtimeApproved && (
                                <span className="text-xs text-green-600">✓</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openCorrect(r.id)} title="Correct attendance">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Correct Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="corr-cin">Check-In Time</Label>
                <Input id="corr-cin" type="time" value={correction.correctedCheckIn || ""} onChange={(e) => setCorrection({ ...correction, correctedCheckIn: e.target.value || undefined })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corr-cout">Check-Out Time</Label>
                <Input id="corr-cout" type="time" value={correction.correctedCheckOut || ""} onChange={(e) => setCorrection({ ...correction, correctedCheckOut: e.target.value || undefined })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Override Status</Label>
              <Select value={correction.correctedStatus || ""} onValueChange={(v) => setCorrection({ ...correction, correctedStatus: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Keep existing" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="corr-reason">Reason *</Label>
              <Textarea id="corr-reason" value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} placeholder="Explain the correction..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectOpen(false)}>Cancel</Button>
            <Button onClick={handleCorrect} disabled={savingCorrection || !correction.reason.trim()}>
              {savingCorrection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
