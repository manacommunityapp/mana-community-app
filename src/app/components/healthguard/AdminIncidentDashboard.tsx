import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, Users, RefreshCw, Ambulance, Watch } from "lucide-react";
import { healthGuardService } from "../../../services/healthguard/healthGuardService";
import { apiClient } from "../../../services/common/apiClient";

interface IncidentRow {
  id: number;
  incidentUuid: string;
  userId: number;
  severity: string;
  status: string;
  description: string;
  locationAddress: string;
  triggerType: string;
  alertsSent: number;
  triggeredAt: string;
  acknowledgedAt: string;
  resolvedAt: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  LEVEL_1_NOTICE: "bg-blue-100 text-blue-700",
  LEVEL_2_ATTENTION: "bg-yellow-100 text-yellow-700",
  LEVEL_3_POSSIBLE_EMERGENCY: "bg-orange-100 text-orange-700",
  LEVEL_4_CONFIRMED: "bg-red-100 text-red-700",
};
const SEVERITY_LABEL: Record<string, string> = {
  LEVEL_1_NOTICE: "Notice",
  LEVEL_2_ATTENTION: "Attention",
  LEVEL_3_POSSIBLE_EMERGENCY: "Possible Emergency",
  LEVEL_4_CONFIRMED: "Confirmed Emergency",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  ACTIVE: <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />,
  ACKNOWLEDGED: <Clock className="w-4 h-4 text-yellow-500" />,
  ESCALATED: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  RESOLVED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  CANCELLED: <CheckCircle2 className="w-4 h-4 text-gray-400" />,
};

export default function AdminIncidentDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    apiClient.get<IncidentRow[]>("/api/healthguard/admin/incidents")
      .then(r => setIncidents(r.data ?? []))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (id: number, action: "acknowledge" | "resolve" | "escalate") => {
    setActionId(id);
    try {
      await apiClient.put(`/api/healthguard/incidents/${id}/${action}`, {});
      load();
    } finally {
      setActionId(null);
    }
  };

  const activeCount = incidents.filter(i => i.status === "ACTIVE").length;
  const ackCount = incidents.filter(i => i.status === "ACKNOWLEDGED").length;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Emergency Incident Dashboard</h1>
            <p className="text-sm text-muted-foreground">Admin view — all active community incidents</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Active SOS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-yellow-600">{ackCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Acknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-blue-600">{incidents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Open</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigate("/healthguard/ambulance-dispatch")}>
          <CardContent className="pt-4 pb-4 flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold">Ambulance</p>
              <p className="text-xs text-muted-foreground">Dispatch</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => navigate("/healthguard/admin/wearable-alerts")}>
          <CardContent className="pt-4 pb-4 flex items-center gap-2">
            <Watch className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Wearables</p>
              <p className="text-xs text-muted-foreground">Health Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-green-700 dark:text-green-400">All clear — no active incidents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => (
            <Card key={inc.id} className={inc.status === "ACTIVE" ? "border-red-200 dark:border-red-800" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {STATUS_ICON[inc.status] ?? STATUS_ICON.RESOLVED}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">User #{inc.userId}</span>
                        <Badge className={`text-xs ${SEVERITY_COLOR[inc.severity] ?? "bg-gray-100 text-gray-600"}`}>
                          {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{inc.status}</Badge>
                      </div>
                      {inc.description && <p className="text-sm text-muted-foreground mt-1 truncate">{inc.description}</p>}
                      {inc.locationAddress && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {inc.locationAddress}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(inc.triggeredAt).toLocaleString("en-IN")}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{inc.alertsSent} alerted
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap shrink-0">
                    {inc.status === "ACTIVE" && (
                      <Button size="sm" variant="outline" onClick={() => act(inc.id, "acknowledge")}
                        disabled={actionId === inc.id} className="text-yellow-700 border-yellow-300">
                        Acknowledge
                      </Button>
                    )}
                    {(inc.status === "ACTIVE" || inc.status === "ACKNOWLEDGED") && (
                      <Button size="sm" variant="outline" onClick={() => act(inc.id, "escalate")}
                        disabled={actionId === inc.id} className="text-orange-700 border-orange-300">
                        Escalate
                      </Button>
                    )}
                    {inc.status !== "RESOLVED" && inc.status !== "CANCELLED" && (
                      <Button size="sm" onClick={() => act(inc.id, "resolve")}
                        disabled={actionId === inc.id} className="bg-green-600 hover:bg-green-700">
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
