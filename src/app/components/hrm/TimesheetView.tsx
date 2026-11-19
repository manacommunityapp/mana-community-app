import { useState, useEffect } from "react";
import { Loader2, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { hrmService } from "../../../services/hrm/hrmService";
import { showError, showSuccess } from "../../../utils/ToastUtils";
import type { Timesheet } from "../../../types/hrm";

interface Props {
  orgId: number;
  isManager?: boolean;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function TimesheetView({ orgId, isManager }: Props) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const mine = await hrmService.getMyTimesheets(orgId);
      setTimesheets(mine);
      if (isManager) {
        const pending = await hrmService.getPendingTimesheets(orgId);
        setPendingTimesheets(pending.content || []);
      }
    } catch (err) {
      console.error("Failed to load timesheets:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [orgId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await hrmService.generateTimesheet(orgId);
      showSuccess("Timesheet generated");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to generate timesheet");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(id: number) {
    try {
      await hrmService.submitTimesheet(orgId, id);
      showSuccess("Timesheet submitted for approval");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to submit");
    }
  }

  async function handleApprove(id: number) {
    try {
      await hrmService.approveTimesheet(orgId, id);
      showSuccess("Timesheet approved");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to approve");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Timesheets</h2>
          <p className="text-sm text-muted-foreground">Weekly work hour summaries</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate This Week
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {timesheets.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <FileCheck className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No timesheets yet. Click "Generate This Week" to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timesheets.map((ts) => (
                <div key={ts.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(ts.weekStartDate).toLocaleDateString()} – {new Date(ts.weekEndDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Work: {formatHours(ts.totalMinutes)}
                      {ts.totalOvertimeMinutes > 0 && ` · OT: ${formatHours(ts.totalOvertimeMinutes)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[ts.status] || "outline"}>{ts.status}</Badge>
                    {ts.status === "DRAFT" && (
                      <Button size="sm" variant="outline" onClick={() => handleSubmit(ts.id)}>Submit</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isManager && pendingTimesheets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Approvals ({pendingTimesheets.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTimesheets.map((ts) => (
                <div key={ts.id} className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <div>
                    <p className="text-sm font-medium">{ts.weekStartDate} – {ts.weekEndDate}</p>
                    <p className="text-xs text-muted-foreground">{formatHours(ts.totalMinutes)} worked</p>
                  </div>
                  <Button size="sm" onClick={() => handleApprove(ts.id)}>Approve</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
