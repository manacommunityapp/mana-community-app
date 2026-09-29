import { useState, useEffect } from "react";
import { AlertTriangle, Phone, Radio, ClipboardList, MapPin, ShieldAlert, Flame, Zap, Droplets, Wind, Baby, CloudLightning, HelpCircle, TrendingUp, Plus, CheckCircle, ChevronRight, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import {
  emergencyService,
  type EmergencyIncident,
  type EmergencyContact,
  type EmergencyCategory,
  type EmergencyStatus,
} from "../../../services/emergency/emergencyService";
import { useAuth } from "../../../contexts/AuthContext";

const CATEGORY_CONFIG: Record<EmergencyCategory, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  MEDICAL: { label: "Medical", icon: TrendingUp, color: "text-red-600", bg: "bg-red-50 border-red-200 hover:bg-red-100" },
  FIRE: { label: "Fire", icon: Flame, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  LIFT: { label: "Lift Stuck", icon: ChevronRight, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
  SECURITY: { label: "Security", icon: ShieldAlert, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  GAS_LEAK: { label: "Gas Leak", icon: Wind, color: "text-green-700", bg: "bg-green-50 border-green-200 hover:bg-green-100" },
  FLOOD: { label: "Flood", icon: Droplets, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100" },
  POWER: { label: "Power Failure", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
  CHILD_SAFETY: { label: "Child Safety", icon: Baby, color: "text-pink-600", bg: "bg-pink-50 border-pink-200 hover:bg-pink-100" },
  NATURAL_DISASTER: { label: "Natural Disaster", icon: CloudLightning, color: "text-purple-600", bg: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  OTHER: { label: "Other", icon: HelpCircle, color: "text-gray-600", bg: "bg-gray-50 border-gray-200 hover:bg-gray-100" },
};

const STATUS_STEPS: EmergencyStatus[] = ["TRIGGERED", "ASSIGNED", "RESPONDING", "RESOLVED"];
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-green-100 text-green-800 border-green-300",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export function EmergencyCenter() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [sosCategory, setSosCategory] = useState<EmergencyCategory | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosForm, setSosForm] = useState({ tower: "", flat: "", description: "" });
  const [updateNote, setUpdateNote] = useState("");

  useEffect(() => {
    setIncidents(emergencyService.getIncidents());
    setContacts(emergencyService.getContacts());
  }, []);

  function handleTriggerSOS() {
    if (!sosCategory || !sosForm.tower || !sosForm.flat) return;
    const incident = emergencyService.triggerSOS({
      category: sosCategory,
      tower: sosForm.tower,
      flatNumber: sosForm.flat,
      description: sosForm.description || "SOS triggered",
      reportedBy: user?.fullName || "Resident",
      reportedByPhone: "+91 00000 00000",
    });
    setIncidents(emergencyService.getIncidents());
    setSosOpen(false);
    setSosForm({ tower: "", flat: "", description: "" });
    setSosCategory(null);
    setSelectedIncident(incident);
  }

  function handleAddUpdate() {
    if (!selectedIncident || !updateNote.trim()) return;
    emergencyService.updateIncidentStatus(selectedIncident.id, selectedIncident.status, updateNote, user?.fullName || "Resident");
    const updated = emergencyService.getIncidents();
    setIncidents(updated);
    setSelectedIncident(updated.find(i => i.id === selectedIncident.id) || null);
    setUpdateNote("");
  }

  const activeCount = incidents.filter(i => !["RESOLVED", "CLOSED"].includes(i.status)).length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency Center</h1>
            <p className="text-sm text-gray-500">24x7 Community Emergency Response</p>
          </div>
        </div>
        {activeCount > 0 && (
          <Badge className="bg-red-600 text-white animate-pulse px-3 py-1">
            {activeCount} Active Incident{activeCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="sos">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="sos">SOS Quick Triggers</TabsTrigger>
          <TabsTrigger value="incidents">Live Incidents</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="evacuation">Evacuation & Safety</TabsTrigger>
        </TabsList>

        {/* ── SOS Quick Triggers ─────────────────────── */}
        <TabsContent value="sos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.entries(CATEGORY_CONFIG) as [EmergencyCategory, typeof CATEGORY_CONFIG[EmergencyCategory]][]).map(([cat, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => { setSosCategory(cat); setSosOpen(true); }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${cfg.bg} ${cfg.color} cursor-pointer`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-center leading-tight">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex gap-3 items-start">
                <TrendingUp className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Medical Response SLA</p>
                  <p className="text-xs text-red-700 mt-1">Paramedic on-site within <strong>5 minutes</strong>. Ambulance liaison within 10 minutes.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex gap-3 items-start">
                <ChevronRight className="h-5 w-5 text-yellow-700 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">Lift Rescue SLA</p>
                  <p className="text-xs text-yellow-700 mt-1">Lift technician responds within <strong>15 minutes</strong>. Senior citizens prioritized.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex gap-3 items-start">
                <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">Tower Marshals</p>
                  <p className="text-xs text-blue-700 mt-1">Each tower has a trained marshal for fire & evacuation guidance, available 6 AM–10 PM.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Live Incidents ─────────────────────────── */}
        <TabsContent value="incidents" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Incident list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Active & Recent ({incidents.length})</h3>
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-2">
                  {incidents.map(inc => {
                    const cfg = CATEGORY_CONFIG[inc.category];
                    const Icon = cfg.icon;
                    return (
                      <Card
                        key={inc.id}
                        className={`cursor-pointer border-2 transition-all ${selectedIncident?.id === inc.id ? "border-blue-400 bg-blue-50" : "hover:border-gray-300"}`}
                        onClick={() => setSelectedIncident(inc)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Icon className={`h-5 w-5 mt-0.5 ${cfg.color}`} />
                              <div>
                                <p className="font-semibold text-sm">{inc.title}</p>
                                <p className="text-xs text-gray-500">{inc.incidentNumber} • {timeAgo(inc.reportedAt)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`text-xs ${SEVERITY_COLORS[inc.severity]} border`}>{inc.severity}</Badge>
                              <Badge variant="outline" className="text-xs">{inc.status.replace("_", " ")}</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {inc.location}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Incident detail */}
            <div>
              {selectedIncident ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{selectedIncident.title}</CardTitle>
                    <CardDescription>{selectedIncident.incidentNumber} • Tower {selectedIncident.tower}, Flat {selectedIncident.flatNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status Stepper */}
                    <div className="flex items-center gap-0">
                      {STATUS_STEPS.map((step, idx) => {
                        const stepIdx = STATUS_STEPS.indexOf(selectedIncident.status);
                        const isPast = idx <= stepIdx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`flex flex-col items-center flex-1`}>
                              <div className={`h-3 w-3 rounded-full border-2 ${isPast ? "bg-green-500 border-green-500" : "bg-white border-gray-300"}`} />
                              <span className={`text-[10px] mt-1 text-center ${isPast ? "text-green-700 font-medium" : "text-gray-400"}`}>{step.replace("_", " ")}</span>
                            </div>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className={`h-0.5 flex-1 mt-[-12px] ${idx < stepIdx ? "bg-green-500" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Responder Info */}
                    {selectedIncident.assignedResponder && (
                      <div className="bg-blue-50 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-blue-800">Assigned Responder</p>
                        <p className="text-blue-700">{selectedIncident.assignedResponder} ({selectedIncident.responderRole})</p>
                        <a href={`tel:${selectedIncident.responderPhone}`} className="text-blue-600 flex items-center gap-1 text-xs mt-1">
                          <Phone className="h-3 w-3" /> {selectedIncident.responderPhone}
                        </a>
                        {selectedIncident.etaMinutes && (
                          <p className="text-xs text-blue-600 mt-1"><Clock className="h-3 w-3 inline mr-1" />ETA: {selectedIncident.etaMinutes} min</p>
                        )}
                      </div>
                    )}

                    {/* Timeline */}
                    <div>
                      <p className="font-semibold text-xs text-gray-500 mb-2 uppercase tracking-wide">Timeline</p>
                      <div className="space-y-2">
                        {selectedIncident.updates.map(u => (
                          <div key={u.id} className="flex gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            <div>
                              <span className="font-medium">{u.author}:</span> {u.note}
                              <span className="text-gray-400 ml-1">({timeAgo(u.timestamp)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Update */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add update note..."
                        value={updateNote}
                        onChange={e => setUpdateNote(e.target.value)}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={handleAddUpdate}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-xl p-12">
                  <div className="text-center">
                    <Radio className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>Select an incident to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Emergency Contacts ─────────────────────── */}
        <TabsContent value="contacts" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {contacts.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    {c.available24x7 && <Badge className="bg-green-100 text-green-800 text-xs">24x7</Badge>}
                  </div>
                  <p className="font-semibold text-sm mt-2">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.role}</p>
                  {c.coversTower && <p className="text-xs text-gray-400">Tower {c.coversTower}</p>}
                  <a
                    href={`tel:${c.phone}`}
                    className="mt-3 flex items-center justify-center gap-1 w-full bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="h-3 w-3" /> Call Now — {c.phone}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Evacuation & Safety ────────────────────── */}
        <TabsContent value="evacuation" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Flame className="h-5 w-5 text-orange-500" /> Fire Evacuation</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {["Activate nearest fire alarm pull station", "Alert all residents via intercom", "Do NOT use elevators — use staircases only", "Proceed to assembly point: Main Lawn (Gate 1 side)", "Assist elderly & children first", "Call Fire Control Room: 101", "Do not re-enter until cleared by Fire Marshal"].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-shrink-0 font-bold text-orange-600 w-4">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><ChevronRight className="h-5 w-5 text-yellow-600" /> Lift Trapped Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {["Stay calm, do NOT force open doors", "Press and hold the Alarm button inside lift", "Use intercom to contact Control Room", "If intercom fails, call Lift Helpline: +91 90011 22334", "Control Room will dispatch technician within 15 min", "Do NOT attempt to exit until technician arrives"].map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-shrink-0 font-bold text-yellow-700 w-4">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-5 w-5 text-green-600" /> Assembly Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { tower: "Tower A", point: "Main Lawn — Gate 1", capacity: "200 people" },
                  { tower: "Tower B", point: "Clubhouse Parking — Zone B", capacity: "150 people" },
                  { tower: "Tower C", point: "Basketball Court Area", capacity: "180 people" },
                  { tower: "All Towers", point: "Outer Road (Emergency)", capacity: "Unlimited" },
                ].map((ap, i) => (
                  <div key={i} className="flex gap-2 items-start p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{ap.tower}</p>
                      <p className="text-gray-600 text-xs">{ap.point} • Capacity: {ap.capacity}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* SOS Modal */}
      <Dialog open={sosOpen} onOpenChange={setSosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {sosCategory ? `Trigger ${CATEGORY_CONFIG[sosCategory].label} SOS` : "Trigger SOS"}
            </DialogTitle>
            <DialogDescription>This will immediately alert the control room and relevant responders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Emergency Type</label>
              <Select value={sosCategory || ""} onValueChange={v => setSosCategory(v as EmergencyCategory)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CONFIG) as EmergencyCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Tower</label>
                <Input placeholder="e.g. A" value={sosForm.tower} onChange={e => setSosForm(f => ({ ...f, tower: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Flat No.</label>
                <Input placeholder="e.g. 302" value={sosForm.flat} onChange={e => setSosForm(f => ({ ...f, flat: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea placeholder="Briefly describe the emergency..." value={sosForm.description} onChange={e => setSosForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSosOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleTriggerSOS}>
              <AlertTriangle className="h-4 w-4 mr-2" /> Confirm SOS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
