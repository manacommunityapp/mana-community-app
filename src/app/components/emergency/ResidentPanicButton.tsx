import React, { useState } from "react";
import { sosService } from "../../../services/emergency/sosService";
import type { EmergencyType, SosIncidentResponse } from "../../../services/emergency/sosService";
import { AlertCircle, Flame, HeartPulse, ShieldAlert, Zap, PhoneCall, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

export const ResidentPanicButton: React.FC = () => {
  const [activeSos, setActiveSos] = useState<SosIncidentResponse | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<EmergencyType>("MEDICAL");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const emergencyOptions: Array<{ type: EmergencyType; label: string; icon: React.ReactNode; color: string }> = [
    { type: "MEDICAL", label: "Medical Emergency", icon: <HeartPulse className="w-5 h-5" />, color: "bg-red-500 hover:bg-red-600" },
    { type: "FIRE", label: "Fire / Gas Leak", icon: <Flame className="w-5 h-5" />, color: "bg-amber-600 hover:bg-amber-700" },
    { type: "SECURITY_INTRUDER", label: "Intruder / Security Threat", icon: <ShieldAlert className="w-5 h-5" />, color: "bg-rose-600 hover:bg-rose-700" },
    { type: "LIFT_STUCK", label: "Lift Trapped / Power", icon: <Zap className="w-5 h-5" />, color: "bg-blue-600 hover:bg-blue-700" }
  ];

  const handleTriggerPanic = async () => {
    setLoading(true);
    try {
      const res = await sosService.trigger({
        emergencyType: selectedType,
        severity: "CRITICAL",
        notes,
        triggerGateLockdown: selectedType === "SECURITY_INTRUDER"
      });
      setActiveSos(res);
      setConfirmModalOpen(false);
    } catch (err) {
      console.error("SOS trigger failed:", err);
      alert("Failed to send SOS. Please call security directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {activeSos ? (
        <Card className="border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 border-2 text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-rose-900 dark:text-rose-200">SOS DISPATCH ACTIVATED</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
              Guard post notified for {activeSos.emergencyType.replace("_", " ")} emergency.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Incident Reference:</span>
              <span className="font-bold font-mono">#{activeSos.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Response Status:</span>
              <span className="font-bold text-amber-600">{activeSos.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SLA Target:</span>
              <span className="font-bold text-emerald-600">&lt; 3 Minutes</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Security guards have received your location and contact details. Stay in a safe position.
          </p>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Emergency SOS Assistance
            </CardTitle>
            <CardDescription className="text-xs">
              Instant priority panic broadcast to the security gate team and first responders.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Quick Emergency Category Buttons */}
            <div className="grid grid-cols-1 gap-2.5">
              {emergencyOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setSelectedType(opt.type);
                    setConfirmModalOpen(true);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-all ${opt.color}`}
                >
                  <div className="flex items-center gap-3">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-80" />
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                In severe medical or life-threatening situations, also dial 112 / 108 immediately.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Confirm Emergency Broadcast
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to trigger a {selectedType.replace("_", " ")} emergency? Guards will be dispatched immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            <label className="block text-slate-500">Add any quick notes (optional):</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In living room, chest pain"
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleTriggerPanic}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {loading ? "Broadcasting..." : "Confirm & Send SOS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};