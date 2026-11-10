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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { hrmService } from "../../../services/hrm/hrmService";
import { showError } from "../../../utils/ToastUtils";
import type { AttendanceSummary } from "../../../types/hrm";
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
    </div>
  );
}
