import React, { useState, useEffect } from "react";
import { evChargingService } from "../../../services/parking/evChargingService";
import type { EvChargerResponse, EvChargingSessionResponse } from "../../../services/parking/evChargingService";
import { Zap, BatteryCharging, Power, History, AlertCircle, CheckCircle2, Clock, Wallet, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

export const EvChargingManagement: React.FC = () => {
  const [chargers, setChargers] = useState<EvChargerResponse[]>([]);
  const [sessions, setSessions] = useState<EvChargingSessionResponse[]>([]);
  const [activeSession, setActiveSession] = useState<EvChargingSessionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Start dialog
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);
  const [selectedCharger, setSelectedCharger] = useState<EvChargerResponse | null>(null);
  const [initialMeter, setInitialMeter] = useState<string>("100.0");

  // Stop dialog
  const [stopModalOpen, setStopModalOpen] = useState<boolean>(false);
  const [finalMeter, setFinalMeter] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chargersRes, sessionsRes] = await Promise.all([
        evChargingService.getChargers(),
        evChargingService.getMySessions()
      ]);
      setChargers(chargersRes || []);
      setSessions(sessionsRes || []);
      const active = (sessionsRes || []).find((s) => s.status === "ACTIVE");
      setActiveSession(active || null);
      if (active) {
        setFinalMeter((active.startMeterKwh + 15.0).toFixed(1));
      }
    } catch (err) {
      console.error("Failed to load EV charging data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartSession = async () => {
    if (!selectedCharger) return;
    try {
      await evChargingService.startSession({
        chargerId: selectedCharger.id,
        currentMeterReading: parseFloat(initialMeter) || 0.0
      });
      setStartModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to start charging session:", err);
      alert("Failed to start session. Check your CFBOS wallet balance.");
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await evChargingService.stopSession(activeSession.id, {
        finalMeterReading: parseFloat(finalMeter) || activeSession.startMeterKwh,
        stopReason: "USER_COMPLETED"
      });
      setStopModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to stop charging session:", err);
      alert("Failed to complete charging session.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">AVAILABLE</Badge>;
      case "CHARGING":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white animate-pulse">CHARGING</Badge>;
      case "FAULT":
      case "OFFLINE":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Charging Session Banner */}
      {activeSession ? (
        <Card className="border-amber-400 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2">
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md animate-pulse">
                <BatteryCharging className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-200">
                  Active EV Charging Session #{activeSession.id}
                </CardTitle>
                <CardDescription className="text-xs text-amber-800 dark:text-amber-400">
                  Charger {activeSession.chargerDeviceId} (Slot {activeSession.slotNumber || "N/A"}) • Started at{" "}
                  {new Date(activeSession.startedAt).toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setStopModalOpen(true)}
              className="shadow-sm"
            >
              <Power className="w-4 h-4 mr-1.5" /> Stop & Settle Wallet
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs">
              <div>
                <span className="text-slate-400 block">Initial Meter:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {activeSession.startMeterKwh} kWh
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeSession.vehicleNumber || "Registered EV"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Billing Mode:</span>
                <span className="font-semibold text-emerald-600">CFBOS Auto-Debit</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <Badge className="bg-amber-500 text-white text-[10px]">IN PROGRESS</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Chargers Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Community EV Charging Stations</h3>
            <p className="text-xs text-slate-500">Real-time charger availability and slot mapping.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chargers.map((chg) => (
            <Card key={chg.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{chg.deviceId}</span>
                    <p className="text-xs text-slate-400">Slot: {chg.slotNumber || "General"}</p>
                  </div>
                </div>
                {getStatusBadge(chg.status)}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Connector:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{chg.connectorType}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Power Rating:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{chg.maxKwRating} kW</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={chg.status !== "AVAILABLE" || activeSession !== null}
                    onClick={() => {
                      setSelectedCharger(chg);
                      setStartModalOpen(true);
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    {chg.status === "AVAILABLE"
                      ? activeSession
                        ? "Session in progress"
                        : "Plug In & Start"
                      : "Charger In Use"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charging History */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> My EV Charging History
          </CardTitle>
          <CardDescription className="text-xs">
            Past sessions with energy consumption breakdown and CFBOS wallet deduction receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No charging sessions recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => (
                <div key={sess.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Session #{sess.id} — {sess.chargerDeviceId} (Slot {sess.slotNumber || "N/A"})
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {new Date(sess.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ENERGY</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {sess.totalKwh ? `${sess.totalKwh} kWh` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">AMOUNT</span>
                      <span className="font-bold text-emerald-600">
                        {sess.totalCost ? `₹${sess.totalCost.toFixed(2)}` : "—"}
                      </span>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px]">
                        {sess.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Dialog */}
      <Dialog open={startModalOpen} onOpenChange={setStartModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Start Charging at {selectedCharger?.deviceId}
            </DialogTitle>
            <DialogDescription className="text-xs">
              A ₹20 minimum balance hold is verified on your CFBOS wallet before activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Current Charger Meter Reading (kWh)</label>
              <Input
                type="number"
                step="0.1"
                value={initialMeter}
                onChange={(e) => setInitialMeter(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSession}>Confirm & Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Dialog */}
      <Dialog open={stopModalOpen} onOpenChange={setStopModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Power className="w-5 h-5" /> Stop EV Charging Session
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the final meter reading on the charging station screen to calculate energy and settle payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Final Meter Reading (kWh)</label>
              <Input
                type="number"
                step="0.1"
                value={finalMeter}
                onChange={(e) => setFinalMeter(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleStopSession}>
              Settle & Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};