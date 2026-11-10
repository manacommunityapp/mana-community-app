import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
import type { HrEmployee, AttendanceRecord, LeaveBalance, LeaveRequest, HrEmployeeDocument } from "../../../types/hrm";
import { format, startOfMonth, endOfMonth } from "date-fns";

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export function EmployeeProfile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<HrEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<number | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [documents, setDocuments] = useState<HrEmployeeDocument[]>([]);

  useEffect(() => {
    loadOrg();
  }, []);

  async function loadOrg() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) {
        setOrgId(orgs[0].id);
        await loadEmployee(orgs[0].id);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load");
      setLoading(false);
    }
  }

  async function loadEmployee(oid: number) {
    try {
      const emp = await hrmService.getEmployee(oid, Number(employeeId));
      setEmployee(emp);
    } catch (err: any) {
      showError(err.message || "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance() {
    if (!orgId) return;
    try {
      const now = new Date();
      const from = format(startOfMonth(now), "yyyy-MM-dd");
      const to = format(endOfMonth(now), "yyyy-MM-dd");
      const data = await hrmService.getMyAttendance(from, to);
      setAttendance(data);
    } catch {
      // silently fail
    }
  }

  async function loadLeaveData() {
    try {
      const [balances, requests] = await Promise.all([
        hrmService.getLeaveBalance(),
        hrmService.getMyLeaveRequests({ page: 0, size: 10 }),
      ]);
      setLeaveBalances(balances);
      setLeaveRequests(requests.content);
    } catch {
      // silently fail
    }
  }

  async function loadDocuments() {
    if (!orgId) return;
    try {
      const docs = await hrmService.getEmployeeDocuments(orgId, Number(employeeId));
      setDocuments(docs);
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/hrm/employees")}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACTIVE: "default",
    ON_NOTICE: "secondary",
    SUSPENDED: "destructive",
    TERMINATED: "destructive",
    RESIGNED: "outline",
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/hrm/employees")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{employee.firstName} {employee.lastName}</h1>
          <p className="text-sm text-muted-foreground">{employee.designationName || "—"} &middot; {employee.departmentName || "—"}</p>
        </div>
        <Badge variant={STATUS_COLORS[employee.employmentStatus] || "outline"} className="self-start sm:self-center">
          {employee.employmentStatus}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance" onClick={loadAttendance}>Attendance</TabsTrigger>
          <TabsTrigger value="leaves" onClick={loadLeaveData}>Leaves</TabsTrigger>
          <TabsTrigger value="documents" onClick={loadDocuments}>Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow icon={User} label="Employee Code" value={employee.employeeCode} />
                <InfoRow icon={Phone} label="Phone" value={employee.phone} />
                <InfoRow icon={Mail} label="Personal Email" value={employee.personalEmail} />
                <InfoRow icon={Mail} label="Work Email" value={employee.workEmail} />
                <InfoRow icon={Phone} label="Emergency Contact" value={employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone || "—"})` : undefined} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <InfoRow icon={Building2} label="Department" value={employee.departmentName} />
                <InfoRow icon={Building2} label="Designation" value={employee.designationName} />
                <InfoRow icon={Building2} label="Branch" value={employee.branchName} />
                <InfoRow icon={Calendar} label="Joining Date" value={employee.joiningDate ? format(new Date(employee.joiningDate), "dd MMM yyyy") : undefined} />
                <InfoRow icon={User} label="Employment Type" value={employee.employmentType} />
                <InfoRow icon={User} label="Reporting Manager" value={employee.reportingManagerName} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No attendance records this month</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{format(new Date(a.attendanceDate), "dd MMM")}</TableCell>
                          <TableCell>{a.firstCheckIn || "—"}</TableCell>
                          <TableCell>{a.lastCheckOut || "—"}</TableCell>
                          <TableCell>{a.totalWorkMinutes > 0 ? `${Math.floor(a.totalWorkMinutes / 60)}h ${a.totalWorkMinutes % 60}m` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={a.attendanceStatus === "PRESENT" ? "default" : a.attendanceStatus === "ABSENT" ? "destructive" : "secondary"}>
                              {a.attendanceStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaveBalances.map((lb) => (
              <Card key={lb.leaveTypeName}>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">{lb.leaveTypeName}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold">{lb.remainingBalance}</span>
                    <span className="text-xs text-muted-foreground">/ {lb.totalBalance} remaining</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{lb.usedBalance} used</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Leave History</CardTitle></CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No leave requests</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((lr) => (
                        <TableRow key={lr.id}>
                          <TableCell>{lr.leaveTypeName}</TableCell>
                          <TableCell>{format(new Date(lr.fromDate), "dd MMM")}</TableCell>
                          <TableCell>{format(new Date(lr.toDate), "dd MMM")}</TableCell>
                          <TableCell>{lr.totalDays}</TableCell>
                          <TableCell>
                            <Badge variant={lr.approvalStatus === "APPROVED" ? "default" : lr.approvalStatus === "REJECTED" ? "destructive" : "secondary"}>
                              {lr.approvalStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.documentName}</p>
                        <p className="text-xs text-muted-foreground">{doc.documentType}{doc.expiryDate ? ` · Expires: ${format(new Date(doc.expiryDate), "dd MMM yyyy")}` : ""}</p>
                      </div>
                      <Badge variant={doc.isVerified ? "default" : "outline"}>
                        {doc.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
