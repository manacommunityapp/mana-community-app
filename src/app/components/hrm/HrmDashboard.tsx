import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Clock,
  CalendarOff,
  UserX,
  ClipboardList,
  UserPlus,
  PartyPopper,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { hrmService } from "../../../services/hrm/hrmService";
import { showError } from "../../../utils/ToastUtils";
import type { HrDashboardData } from "../../../types/hrm";
import { useNavigate } from "react-router";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
              </div>
              <div className="h-7 w-16 rounded bg-muted mb-1" />
              <div className="h-3 w-24 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HrmDashboard() {
  const [data, setData] = useState<HrDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrg();
  }, []);

  async function loadOrg() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) {
        setOrgId(orgs[0].id);
        await loadDashboard(orgs[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load organizations");
      setLoading(false);
    }
  }

  async function loadDashboard(id: number) {
    setLoading(true);
    try {
      const dashData = await hrmService.getDashboard(id);
      setData(dashData);
    } catch (err: any) {
      showError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">No HR Organization Found</h2>
        <p className="text-muted-foreground mb-4">Set up your organization in HR Settings to get started.</p>
        <Button onClick={() => navigate("/hrm/settings")}>
          Go to Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const stats = data || {
    totalEmployees: 0, activeEmployees: 0, presentToday: 0,
    onLeaveToday: 0, absentToday: 0, pendingLeaveApprovals: 0,
    newJoinersThisMonth: 0, upcomingHolidays: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your workforce</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}          label="Total Employees"       value={stats.totalEmployees}       color="#6366f1" bg="#eef2ff" />
        <StatCard icon={UserCheck}      label="Active Employees"      value={stats.activeEmployees}      color="#22c55e" bg="#f0fdf4" />
        <StatCard icon={Clock}          label="Present Today"         value={stats.presentToday}         color="#3b82f6" bg="#eff6ff" />
        <StatCard icon={CalendarOff}    label="On Leave Today"        value={stats.onLeaveToday}         color="#f59e0b" bg="#fffbeb" />
        <StatCard icon={UserX}          label="Absent Today"          value={stats.absentToday}          color="#ef4444" bg="#fef2f2" />
        <StatCard icon={ClipboardList}  label="Pending Leave Approvals" value={stats.pendingLeaveApprovals} color="#8b5cf6" bg="#f5f3ff" />
        <StatCard icon={UserPlus}       label="New Joiners (Month)"   value={stats.newJoinersThisMonth}  color="#06b6d4" bg="#ecfeff" />
        <StatCard icon={PartyPopper}    label="Upcoming Holidays"     value={stats.upcomingHolidays}     color="#ec4899" bg="#fdf2f8" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/hrm/employees")}>
              <Users className="mr-2 h-4 w-4" /> View Employees
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/hrm/attendance")}>
              <Clock className="mr-2 h-4 w-4" /> Attendance Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/hrm/leaves")}>
              <ClipboardList className="mr-2 h-4 w-4" /> Leave Requests
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/hrm/shifts")}>
              <CalendarOff className="mr-2 h-4 w-4" /> Shift Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{stats.presentToday}</span>
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-500">{stats.absentToday}</span>
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-amber-500">{stats.onLeaveToday}</span>
                <span className="text-xs text-muted-foreground">On Leave</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
