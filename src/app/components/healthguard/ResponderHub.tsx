import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Wifi, WifiOff, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { healthGuardService } from "@/services/healthguard/healthGuardService";

type Availability = "AVAILABLE" | "BUSY" | "OFFLINE";

interface ResponderProfile {
  id: number;
  userId: number;
  isActive: boolean;
  availabilityStatus: Availability;
  skills: string;
  certifications: string;
  phoneNumber: string;
  totalResponseCount: number;
  registeredAt: string;
  lastPingAt: string;
}

const STATUS_CONFIG: Record<Availability, { label: string; color: string; icon: React.ReactNode }> = {
  AVAILABLE: { label: "Available", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <Wifi className="w-3 h-3" /> },
  BUSY: { label: "Busy", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: <AlertCircle className="w-3 h-3" /> },
  OFFLINE: { label: "Offline", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", icon: <WifiOff className="w-3 h-3" /> },
};

export default function ResponderHub() {
  const [profile, setProfile] = useState<ResponderProfile | null>(null);
  const [communityCount, setCommunityCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ skills: "", certifications: "", phoneNumber: "" });
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    Promise.all([
      healthGuardService.getMyResponderProfile().then(r => r.status !== 204 ? r.data : null).catch(() => null),
      healthGuardService.getAvailableRespondersCount().then(r => r.data?.count ?? 0).catch(() => 0),
    ]).then(([p, count]) => {
      setProfile(p);
      setCommunityCount(count);
      if (p) setForm({ skills: p.skills ?? "", certifications: p.certifications ?? "", phoneNumber: p.phoneNumber ?? "" });
    }).finally(() => setLoading(false));
  }, []);

  const handleRegister = async () => {
    setSaving(true);
    try {
      const r = await healthGuardService.registerAsResponder(form);
      setProfile(r.data);
      setShowRegister(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: Availability) => {
    if (!profile) return;
    setSaving(true);
    try {
      const r = await healthGuardService.updateResponderStatus(status);
      setProfile(r.data);
      if (status === "AVAILABLE") setCommunityCount(c => c + 1);
      else if (profile.availabilityStatus === "AVAILABLE") setCommunityCount(c => Math.max(0, c - 1));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading responder hub...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Community Responder Hub</h1>
          <p className="text-sm text-muted-foreground">Help your neighbors in emergencies</p>
        </div>
      </div>

      {/* Community stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{communityCount}</p>
              <p className="text-sm text-muted-foreground">Responders available in your community</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile ? (
        <>
          {/* Current status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Responder Status</span>
                <Badge className={`flex items-center gap-1 ${STATUS_CONFIG[profile.availabilityStatus].color}`}>
                  {STATUS_CONFIG[profile.availabilityStatus].icon}
                  {STATUS_CONFIG[profile.availabilityStatus].label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div><span className="font-medium">Total responses:</span> {profile.totalResponseCount}</div>
                {profile.skills && <div><span className="font-medium">Skills:</span> {profile.skills}</div>}
                {profile.certifications && <div><span className="font-medium">Certifications:</span> {profile.certifications}</div>}
                {profile.phoneNumber && <div><span className="font-medium">Phone:</span> {profile.phoneNumber}</div>}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant={profile.availabilityStatus === "AVAILABLE" ? "default" : "outline"}
                  className="flex items-center gap-1"
                  onClick={() => handleStatusChange("AVAILABLE")}
                  disabled={saving || profile.availabilityStatus === "AVAILABLE"}
                >
                  <Wifi className="w-3 h-3" /> Available
                </Button>
                <Button
                  size="sm"
                  variant={profile.availabilityStatus === "BUSY" ? "default" : "outline"}
                  onClick={() => handleStatusChange("BUSY")}
                  disabled={saving || profile.availabilityStatus === "BUSY"}
                >
                  Busy
                </Button>
                <Button
                  size="sm"
                  variant={profile.availabilityStatus === "OFFLINE" ? "destructive" : "outline"}
                  className="flex items-center gap-1"
                  onClick={() => handleStatusChange("OFFLINE")}
                  disabled={saving || profile.availabilityStatus === "OFFLINE"}
                >
                  <WifiOff className="w-3 h-3" /> Go Offline
                </Button>
              </div>

              {saved && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Status updated
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update profile */}
          <Card>
            <CardHeader>
              <CardTitle>Update Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Skills</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                  rows={2}
                  placeholder="e.g. First Aid, CPR, Firefighting"
                  value={form.skills}
                  onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Certifications</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                  rows={2}
                  placeholder="e.g. BLS Certified, NDRF Trained"
                  value={form.certifications}
                  onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border rounded-md p-2 text-sm bg-background"
                  placeholder="+91 98765 43210"
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
              <Button onClick={handleRegister} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Become a Community Responder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Register as a community responder to help your neighbors during emergencies. Your availability status will be visible to others when an SOS is triggered.
            </p>

            {showRegister ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Skills</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                    rows={2}
                    placeholder="e.g. First Aid, CPR, Firefighting"
                    value={form.skills}
                    onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Certifications (optional)</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                    rows={2}
                    placeholder="e.g. BLS Certified, NDRF Trained"
                    value={form.certifications}
                    onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full border rounded-md p-2 text-sm bg-background"
                    placeholder="+91 98765 43210"
                    value={form.phoneNumber}
                    onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRegister} disabled={saving} className="flex-1">
                    {saving ? "Registering..." : "Register as Responder"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowRegister(true)} className="w-full">
                <Shield className="w-4 h-4 mr-2" /> Register as Responder
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
