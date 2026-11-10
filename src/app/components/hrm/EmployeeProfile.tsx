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
import type { HrEmployee, AttendanceRecord, LeaveBalance, LeaveRequest, HrEmployeeDocument, EmploymentHistory, OnboardingTask, OffboardingTask } from "../../../types/hrm";
import { format, startOfMonth } from "date-fns";

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
  const [history, setHistory] = useState<EmploymentHistory[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [offboardingTasks, setOffboardingTasks] = useState<OffboardingTask[]>([]);

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
      // Use the org-level attendance report endpoint so we get the viewed employee's data, not the caller's
      const page = await hrmService.getAttendanceReport(orgId, { date: from, page: 0, size: 31 });
      const empId = Number(employeeId);
      setAttendance(page.content.filter((a) => a.employeeId === empId));
    } catch (err) {
      console.error("Failed to load attendance:", err);
    }
  }

  async function loadLeaveData() {
    try {
      // Note: getLeaveBalance and getMyLeaveRequests return the logged-in user's data.
      // For viewing another employee's leave, HR managers need a dedicated endpoint (future).
      const [balances, requests] = await Promise.all([
        hrmService.getLeaveBalance(orgId!),
        hrmService.getMyLeaveRequests(orgId!, { page: 0, size: 10 }),
      ]);
      setLeaveBalances(balances);
      setLeaveRequests(requests.content);
    } catch (err) {
      console.error("Failed to load leave data:", err);
    }
  }

  async function loadDocuments() {
    if (!orgId) return;
    try {
      const docs = await hrmService.getEmployeeDocuments(orgId, Number(employeeId));
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }

  async function loadHistory() {
    if (!orgId) return;
    try {
      const data = await hrmService.getEmploymentHistory(orgId, Number(employeeId));
      setHistory(data);
    } catch (err) {
      console.error("Failed to load employment history:", err);
    }
  }

  async function loadOnboarding() {
    if (!orgId) return;
    try {
      const data = await hrmService.getOnboardingTasks(orgId, Number(employeeId));
      setOnboardingTasks(data);
    } catch (err) {
      console.error("Failed to load onboarding tasks:", err);
    }
  }

  async function loadOffboarding() {
    if (!orgId) return;
    try {
      const data = await hrmService.getOffboardingTasks(orgId, Number(employeeId));
      setOffboardingTasks(data);
    } catch (err) {
      console.error("Failed to load offboarding tasks:", err);
    }
  }

  async function handleCompleteOnboarding(taskId: number) {
    if (!orgId) return;
    try {
      await hrmService.completeOnboardingTask(orgId, taskId);
      setOnboardingTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true } : t));
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  }

  async function handleCompleteOffboarding(taskId: number) {
    if (!orgId) return;
    try {
      await hrmService.completeOffboardingTask(orgId, taskId);
      setOffboardingTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true } : t));
    } catch (err) {
      console.error("Failed to complete task:", err);
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
          <TabsTrigger value="history" onClick={loadHistory}>History</TabsTrigger>
          <TabsTrigger value="onboarding" onClick={loadOnboarding}>Onboarding</TabsTrigger>
          <TabsTrigger value="offboarding" onClick={loadOffboarding}>Offboarding</TabsTrigger>
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

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Employment History</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No employment history recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-sm">{h.changeType.replace(/_/g, " ")}</span>
                          {h.newDesignation && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {h.previousDesignation && <span className="line-through text-red-400">{h.previousDesignation}</span>}
                              {h.previousDesignation && " → "}
                              <span className="text-green-600">{h.newDesignation}</span>
                            </p>
                          )}
                          {h.newDepartment && (
                            <p className="text-sm text-muted-foreground">
                              Dept: {h.previousDepartment && <span className="line-through text-red-400">{h.previousDepartment}</span>}
                              {h.previousDepartment && " → "}<span className="text-green-600">{h.newDepartment}</span>
                            </p>
                          )}
                          {h.newBranch && (
                            <p className="text-sm text-muted-foreground">
                              Branch: {h.previousBranch && <span className="line-through text-red-400">{h.previousBranch}</span>}
                              {h.previousBranch && " → "}<span className="text-green-600">{h.newBranch}</span>
                            </p>
                          )}
                          {h.reason && <p className="text-xs text-muted-foreground mt-1">{h.reason}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-4">
                          {format(new Date(h.effectiveDate), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Onboarding Checklist
                {onboardingTasks.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {onboardingTasks.filter(t => t.isCompleted).length}/{onboardingTasks.length} completed
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {onboardingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No onboarding tasks assigned.</p>
              ) : (
                <div className="space-y-2">
                  {onboardingTasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 border rounded-lg ${task.isCompleted ? "bg-green-50 border-green-200" : ""}`}>
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => !task.isCompleted && handleCompleteOnboarding(task.id)}
                        disabled={task.isCompleted}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>{task.taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{task.category}{task.dueDate ? ` · Due: ${format(new Date(task.dueDate), "dd MMM yyyy")}` : ""}</p>
                      </div>
                      {task.isCompleted && <span className="text-xs text-green-600">✓ Done</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offboarding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Offboarding Checklist
                {offboardingTasks.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {offboardingTasks.filter(t => t.isCompleted).length}/{offboardingTasks.length} completed
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offboardingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No offboarding tasks assigned.</p>
              ) : (
                <div className="space-y-2">
                  {offboardingTasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 border rounded-lg ${task.isCompleted ? "bg-green-50 border-green-200" : ""}`}>
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => !task.isCompleted && handleCompleteOffboarding(task.id)}
                        disabled={task.isCompleted}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>{task.taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{task.category}{task.dueDate ? ` · Due: ${format(new Date(task.dueDate), "dd MMM yyyy")}` : ""}</p>
                      </div>
                      {task.isCompleted && <span className="text-xs text-green-600">✓ Done</span>}
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
