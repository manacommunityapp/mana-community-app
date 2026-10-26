import React, { useState, useEffect } from "react";
import { anprService } from "../../../services/parking/anprService";
import type { AnprGateEventResponse, AnprGateSummaryResponse } from "../../../services/parking/anprService";
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Car, ArrowDownRight, ArrowUpRight, Search, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export const AnprGateLiveMonitor: React.FC = () => {
  const [events, setEvents] = useState<AnprGateEventResponse[]>([]);
  const [summary, setSummary] = useState<AnprGateSummaryResponse | null>(null);
  const [pendingAlerts, setPendingAlerts] = useState<AnprGateEventResponse[]>([]);
  const [selectedGate, setSelectedGate] = useState<string>("ALL");
  const [searchPlate, setSearchPlate] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const [eventsRes, summaryRes, alertsRes] = await Promise.all([
        anprService.getEvents(selectedGate === "ALL" ? undefined : selectedGate, 0, 20),
        anprService.getSummary(),
        anprService.getPendingAlerts()
      ]);
      setEvents(eventsRes.content || []);
      setSummary(summaryRes);
      setPendingAlerts(alertsRes || []);
    } catch (err) {
      console.error("Failed to load ANPR live data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000); // Poll every 5s for live feed
    return () => clearInterval(interval);
  }, [selectedGate]);

  const filteredEvents = events.filter((e) => {
    if (!searchPlate) return true;
    return e.plateNumber?.toLowerCase().includes(searchPlate.toLowerCase());
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "OPEN":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> BARRIER OPEN
          </Badge>
        );
      case "HOLD":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> HOLD / UNKNOWN
          </Badge>
        );
      case "DENY":
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> DENIED
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-500">Total Entries Today</CardTitle>
            <Car className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">{summary?.totalEventsToday ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Auto Allowed (Resident/Pass)</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary?.openCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Held / Unknown Checks</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary?.holdCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30 dark:bg-rose-950/10">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Pending Guard Alerts</CardTitle>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{pendingAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts Banner (if unknown vehicles waiting) */}
      {pendingAlerts.length > 0 && (
        <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 animate-bounce" />
              <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-200">
                Action Required: {pendingAlerts.length} Unknown Vehicle(s) at Gates
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-amber-800"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 mr-1" /> : <VolumeX className="w-4 h-4 mr-1" />}
              {soundEnabled ? "Alert Sound ON" : "Muted"}
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {pendingAlerts.map((alert) => (
                <div key={alert.id} className="bg-white dark:bg-slate-900 border border-amber-300 rounded-lg p-2.5 flex items-center gap-3 shadow-sm">
                  <div className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {alert.plateNumber || "UNREADABLE"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Gate: <span className="font-semibold text-slate-800 dark:text-slate-200">{alert.gateId}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.confidence ? (alert.confidence * 100).toFixed(0) : "0"}% Conf
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search plate (e.g. MH12...)"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            {["ALL", "GATE_MAIN_IN", "GATE_MAIN_OUT", "GATE_BASEMENT"].map((gate) => (
              <Button
                key={gate}
                variant={selectedGate === gate ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGate(gate)}
                className="text-xs"
              >
                {gate.replace("GATE_", "")}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLiveData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Stream / Gate Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Car className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No gate events detected yet for this selection.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {event.direction === "ENTRY" ? (
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{event.gateId}</span>
                    <p className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                {getActionBadge(event.barrierAction)}
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md tracking-wider border border-slate-300 dark:border-slate-700">
                    {event.plateNumber || "NO_PLATE"}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">AI Confidence</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {event.confidence ? `${(event.confidence * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  {event.matchedResidentName ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Match:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {event.matchedResidentName} (Resident)
                      </span>
                    </div>
                  ) : event.matchedVisitorPassId ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Match:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {event.matchedResidentName} (Visitor Pass)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold text-amber-600">Unregistered Visitor / Guest</span>
                    </div>
                  )}

                  {event.processingMs && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Recognition Time:</span>
                      <span>{event.processingMs.toFixed(0)} ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};