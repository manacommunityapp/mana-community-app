import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
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
  ScanFace,
  ShieldAlert,
  ListOrdered,
  FileSpreadsheet,
  Download,
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
import { AiTimeGuardDashboard } from "./AiTimeGuardDashboard";

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
  const navigate = useNavigate();
  const { activeOrgId: orgId } = useHrmOrg();
  const [viewTab, setViewTab] = useState<"roster" | "timeguard">("roster");
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
    if (orgId) loadData();
  }, [orgId, date, page]);

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

  const downloadBlob = (content: string, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
    a.download = filename;
    a.click();
  };

  const handleExportPayroll = (formatType: string) => {
    if (rows.length === 0) {
      showError("No attendance rows to export for selected date.");
      return;
    }
    if (formatType === "KEKA") {
      const headers = "Employee Code,Attendance Date,First In,Last Out,Total Hours,Shift Code";
      const csvRows = rows.map((r) =>
        `"${r.employeeCode || r.employeeId}","${r.attendanceDate}","${r.firstCheckIn || ""}","${r.lastCheckOut || ""}","${(r.totalWorkMinutes / 60).toFixed(2)}","GEN"`
      );
      downloadBlob([headers, ...csvRows].join("\n"), `keka_attendance_${date}.csv`);
      showSuccess("Exported Keka-formatted attendance CSV.");
    } else if (formatType === "GREYTHR") {
      const headers = "Emp_No,Swipe_Date,Swipe_Time,Direction,Door_Name";
      const csvRows: string[] = [];
      rows.forEach((r) => {
        if (r.firstCheckIn) {
          csvRows.push(`"${r.employeeCode || r.employeeId}","${r.attendanceDate}","${r.firstCheckIn}","IN","Main Gate Turnstile"`);
        }
        if (r.lastCheckOut) {
          csvRows.push(`"${r.employeeCode || r.employeeId}","${r.attendanceDate}","${r.lastCheckOut}","OUT","Main Gate Turnstile"`);
        }
      });
      downloadBlob([headers, ...csvRows].join("\n"), `greythr_swipes_${date}.csv`);
      showSuccess("Exported greytHR swipe format CSV.");
    } else if (formatType === "TALLY") {
      const headers = "EmpId,AttendanceDate,PresentStatus,PayableHours,OvertimeMinutes";
      const csvRows = rows.map((r) =>
        `"${r.employeeCode || r.employeeId}","${r.attendanceDate}","${r.attendanceStatus}","${(r.totalWorkMinutes / 60).toFixed(2)}","${r.overtimeMinutes || 0}"`
      );
      downloadBlob([headers, ...csvRows].join("\n"), `tally_payroll_${date}.csv`);
      showSuccess("Exported Tally/Darwinbox payroll CSV.");
    } else if (formatType === "MUSTER_ROLL") {
      const headers = "Sl No,Employee Code,Employee Name,Designation,Shift,In Time,Out Time,Total Hours,Overtime Hours,Status,Statutory Compliance";
      const csvRows = rows.map((r, idx) =>
        `"${idx + 1}","${r.employeeCode || r.employeeId}","${r.employeeName || 'Staff Member'}","${r.department || 'Operations'}","General (09:00-18:00)","${r.firstCheckIn || '-'}","${r.lastCheckOut || '-'}","${(r.totalWorkMinutes / 60).toFixed(2)}","${((r.overtimeMinutes || 0) / 60).toFixed(2)}","${r.attendanceStatus}","COMPLIANT"`
      );
      downloadBlob([headers, ...csvRows].join("\n"), `indian_muster_roll_form_d_${date}.csv`);
      showSuccess("Exported Indian Statutory Muster Roll (Form D) CSV.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-foreground">Attendance & TimeGuard</h1>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
              AI Face Kiosk Integrated
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Daily attendance logs, shift timings, and AI TimeGuard anomaly detection</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => navigate("/access/kiosk")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ScanFace className="w-4 h-4 mr-1.5" />
            Launch Face Kiosk Mode
          </Button>

          {viewTab === "roster" && (
            <>
              <Input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(0); }}
                className="w-auto h-9"
              />
              <Select onValueChange={handleExportPayroll}>
                <SelectTrigger className="w-44 h-9 text-xs bg-background">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <SelectValue placeholder="Export Payroll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KEKA">Keka Format (.csv)</SelectItem>
                  <SelectItem value="GREYTHR">greytHR Swipes (.csv)</SelectItem>
                  <SelectItem value="TALLY">Tally / Darwinbox (.csv)</SelectItem>
                  <SelectItem value="MUSTER_ROLL">Govt Form D Muster Roll (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b space-x-4 text-sm font-medium">
        <button
          onClick={() => setViewTab("roster")}
          className={`pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
            viewTab === "roster"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Attendance Roster</span>
        </button>

        <button
          onClick={() => setViewTab("timeguard")}
          className={`pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
            viewTab === "timeguard"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          <span>AI TimeGuard (Fraud & Anomalies)</span>
        </button>
      </div>

      {viewTab === "timeguard" ? (
        <AiTimeGuardDashboard />
      ) : (
        <>
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
      </>
      )}

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
