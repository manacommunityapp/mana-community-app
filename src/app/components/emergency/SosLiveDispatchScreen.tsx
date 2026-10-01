import React, { useState, useEffect } from "react";
import { sosService } from "../../../services/emergency/sosService";
import type { SosIncidentResponse, LockdownDirective } from "../../../services/emergency/sosService";
import { ShieldAlert, Phone, MapPin, CheckCircle2, UserCheck, Flame, HeartPulse, Lock, Unlock, Volume2, VolumeX, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

export const SosLiveDispatchScreen: React.FC = () => {
  const [incidents, setIncidents] = useState<SosIncidentResponse[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Resolve dialog
  const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<SosIncidentResponse | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [restoreGates, setRestoreGates] = useState<boolean>(true);

  const fetchActiveIncidents = async () => {
    setLoading(true);
    try {
      const active = await sosService.getActive();
      setIncidents(active || []);
    } catch (err) {
      console.error("Failed to load active SOS incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveIncidents();
    const interval = setInterval(fetchActiveIncidents, 4000); // Poll every 4s for emergency stream
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await sosService.acknowledge(id);
      fetchActiveIncidents();
    } catch (err) {
      console.error("Acknowledge failed:", err);
    }
  };

  const handleDispatch = async (id: number) => {
    try {
      await sosService.dispatch(id, "Guard unit dispatched immediately");
      fetchActiveIncidents();
    } catch (err) {
      console.error("Dispatch failed:", err);
    }
  };

  const handleMarkArrived = async (id: number) => {
    try {
      await sosService.markArrived(id, "On-site verified");
      fetchActiveIncidents();
    } catch (err) {
      console.error("Mark arrived failed:", err);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    try {
      await sosService.resolve(selectedIncident.id, {
        status: "RESOLVED",
        resolutionNotes,
        restoreGatesToNormal: restoreGates
      });
      setResolveModalOpen(false);
      fetchActiveIncidents();
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  const handleManualLockdown = async (directive: LockdownDirective, reason: string) => {
    if (!confirm(`Are you sure you want to execute ${directive}?`)) return;
    try {
      await sosService.executeLockdown({
        directive,
        affectedGates: "ALL_GATES",
        reason
      });
      alert(`Directive ${directive} executed across all smart barriers.`);
    } catch (err) {
      console.error("Lockdown execution failed:", err);
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case "FIRE":
      case "GAS_LEAK":
        return <Flame className="w-5 h-5 text-rose-600" />;
      case "MEDICAL":
        return <HeartPulse className="w-5 h-5 text-red-600" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Siren & Gate Lockdown Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-950 text-white p-4 rounded-xl border border-rose-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600 rounded-xl animate-pulse">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Security Command & Emergency Dispatch</h2>
            <p className="text-xs text-rose-300">
              {incidents.length} active emergency incident(s) requiring response
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-rose-700 bg-rose-900/50 text-white hover:bg-rose-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-1 text-emerald-400" /> : <VolumeX className="w-4 h-4 mr-1 text-rose-400" />}
            {soundEnabled ? "Siren ON" : "Muted"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleManualLockdown("LOCKDOWN_CLOSE_ALL", "Manual Security Lockdown by Guard")}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <Lock className="w-4 h-4 mr-1" /> Lock All Gates
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleManualLockdown("EVACUATION_OPEN_ALL", "Emergency Evacuation Directive")}
            className="border-amber-600 bg-amber-950/40 text-amber-200 hover:bg-amber-900"
          >
            <Unlock className="w-4 h-4 mr-1" /> Evacuate (Open All)
          </Button>
        </div>
      </div>

      {/* Incidents Feed */}
      {incidents.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 text-center py-12">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">All Clear — No Active SOS Incidents</h3>
            <p className="text-xs text-slate-400 mt-1">
              Guard response system is actively listening for resident panic broadcasts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => {
            const elapsed = Math.round(
              (new Date().getTime() - new Date(incident.triggeredAt).getTime()) / 1000
            );
            const remaining = Math.max(0, incident.slaTargetSeconds - elapsed);
            const isBreached = elapsed > incident.slaTargetSeconds && !incident.arrivedAt;

            return (
              <Card
                key={incident.id}
                className={`border-2 shadow-md transition-all ${
                  isBreached
                    ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                    : "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
                }`}
              >
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                      {getEmergencyIcon(incident.emergencyType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          SOS #{incident.id} — {incident.emergencyType.replace("_", " ")}
                        </span>
                        <Badge className={isBreached ? "bg-rose-600 text-white animate-bounce" : "bg-amber-500 text-white"}>
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Triggered at {new Date(incident.triggeredAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* SLA Response Countdown */}
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">SLA Target (3 min)</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isBreached ? "text-rose-600" : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isBreached ? `BREACHED (+${elapsed - incident.slaTargetSeconds}s)` : `${remaining}s remaining`}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">LOCATION</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {incident.buildingBlock || "Campus"} — Flat {incident.flatNumber || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">RESIDENT</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {incident.residentName} ({incident.residentPhone || "No Phone"})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">GATE BARRIER</span>
                        <span className="font-semibold text-rose-600">
                          {incident.lockdownInitiated ? "LOCKDOWN ACTIVE" : "NORMAL"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {incident.notes && (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 block mb-0.5">Notes from Resident:</span>
                      {incident.notes}
                    </div>
                  )}

                  {/* Guard Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {incident.status === "TRIGGERED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAcknowledge(incident.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Acknowledge Alert
                      </Button>
                    )}

                    {(incident.status === "TRIGGERED" || incident.status === "ACKNOWLEDGED") && (
                      <Button
                        size="sm"
                        onClick={() => handleDispatch(incident.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Dispatch Guard Unit
                      </Button>
                    )}

                    {incident.status === "DISPATCHED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkArrived(incident.id)}
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm On-Site Arrival
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setResolveModalOpen(true);
                      }}
                    >
                      Resolve Incident
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve SOS Incident #{selectedIncident?.id}</DialogTitle>
            <DialogDescription className="text-xs">
              Log resolution actions taken and restore smart barriers to normal operation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Resolution Summary</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Medical team attended; patient safe."
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="restoreGates"
                checked={restoreGates}
                onChange={(e) => setRestoreGates(e.target.checked)}
                className="rounded text-primary"
              />
              <label htmlFor="restoreGates" className="text-slate-700 dark:text-slate-300">
                Restore gate barriers to automated normal operation
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>Confirm Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};