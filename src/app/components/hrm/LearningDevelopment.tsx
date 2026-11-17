import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Award, Compass, Heart, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { hrmService } from "@/services/hrm/hrmService";
import type { TrainingProgram, Recognition } from "@/types/hrm";

interface Props {
  orgId: number;
  employeeId: number;
}

function TrainingTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();

  const { data: programsData } = useQuery({
    queryKey: ["hrm-training-programs", orgId],
    queryFn: () => hrmService.getTrainingPrograms(orgId),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["hrm-enrollments", employeeId],
    queryFn: () => hrmService.getMyEnrollments(employeeId),
  });

  const enroll = useMutation({
    mutationFn: (programId: number) => hrmService.enrollInTraining(orgId, employeeId, programId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hrm-enrollments", employeeId] }),
  });

  const programs = programsData?.content ?? [];
  const enrolledIds = new Set(enrollments.map(e => e.trainingProgram.id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((p: TrainingProgram) => {
          const enrolled = enrolledIds.has(p.id);
          const myEnrollment = enrollments.find(e => e.trainingProgram.id === p.id);
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <div className="flex gap-1">
                    {p.isMandatory && <Badge variant="destructive" className="text-xs">Mandatory</Badge>}
                    <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {p.provider && <span>Provider: {p.provider}</span>}
                  {p.durationHours && <span>{p.durationHours}h</span>}
                  {p.trainingType && <span>{p.trainingType}</span>}
                </div>
                {enrolled ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{myEnrollment?.status}</span>
                    {myEnrollment?.completionDate && <span>· Completed {myEnrollment.completionDate}</span>}
                  </div>
                ) : (
                  <Button size="sm" onClick={() => enroll.mutate(p.id)} disabled={enroll.isPending}>
                    Enroll
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {programs.length === 0 && <div className="col-span-2 text-center py-12 text-muted-foreground">No training programs available.</div>}
      </div>
    </div>
  );
}

function CertificationsTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", issuingBody: "", credentialId: "", issuedDate: "", expiryDate: "", certificateUrl: "" });

  const { data: certs = [] } = useQuery({
    queryKey: ["hrm-certifications", employeeId],
    queryFn: () => hrmService.getMyCertifications(employeeId),
  });

  const addCert = useMutation({
    mutationFn: () => hrmService.addCertification(orgId, employeeId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-certifications", employeeId] }); setShowNew(false); setForm({ name: "", issuingBody: "", credentialId: "", issuedDate: "", expiryDate: "", certificateUrl: "" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-2" />Add Certification</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certs.map(c => (
          <Card key={c.id}>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-start justify-between">
                <div className="font-medium">{c.name}</div>
                {c.isVerified && <Badge className="text-xs bg-green-100 text-green-800">Verified</Badge>}
              </div>
              {c.issuingBody && <div className="text-sm text-muted-foreground">{c.issuingBody}</div>}
              {c.credentialId && <div className="text-xs text-muted-foreground">ID: {c.credentialId}</div>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {c.issuedDate && <span>Issued: {c.issuedDate}</span>}
                {c.expiryDate && <span>Expires: {c.expiryDate}</span>}
              </div>
              {c.certificateUrl && (
                <a href={c.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Certificate</a>
              )}
            </CardContent>
          </Card>
        ))}
        {certs.length === 0 && <div className="col-span-2 text-center py-12 text-muted-foreground">No certifications added yet.</div>}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Certification</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Solutions Architect" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Issuing Body</Label><Input value={form.issuingBody} onChange={e => setForm(f => ({ ...f, issuingBody: e.target.value }))} /></div>
              <div><Label>Credential ID</Label><Input value={form.credentialId} onChange={e => setForm(f => ({ ...f, credentialId: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Issued Date</Label><Input type="date" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
            </div>
            <div><Label>Certificate URL</Label><Input value={form.certificateUrl} onChange={e => setForm(f => ({ ...f, certificateUrl: e.target.value }))} placeholder="https://…" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button disabled={!form.name || addCert.isPending} onClick={() => addCert.mutate()}>
                {addCert.isPending ? "Saving…" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CareerPathTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ currentRole: "", targetRole: "", targetDate: "", skillsToDevelop: "", developmentActivities: "" });

  const { data: careerPath } = useQuery({
    queryKey: ["hrm-career-path", employeeId],
    queryFn: () => hrmService.getCareerPath(employeeId),
  });

  const save = useMutation({
    mutationFn: () => hrmService.saveCareerPath(orgId, employeeId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-career-path", employeeId] }); setEditing(false); },
  });

  if (!editing && careerPath) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">Career Development Plan</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setForm({ currentRole: careerPath.currentRole ?? "", targetRole: careerPath.targetRole ?? "", targetDate: careerPath.targetDate ?? "", skillsToDevelop: careerPath.skillsToDevelop ?? "", developmentActivities: careerPath.developmentActivities ?? "" }); setEditing(true); }}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center p-4 bg-muted rounded-lg flex-1">
              <div className="text-xs text-muted-foreground mb-1">Current Role</div>
              <div className="font-semibold">{careerPath.currentRole ?? "—"}</div>
            </div>
            <Compass className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="text-center p-4 bg-primary/10 rounded-lg flex-1">
              <div className="text-xs text-muted-foreground mb-1">Target Role</div>
              <div className="font-semibold">{careerPath.targetRole ?? "—"}</div>
            </div>
          </div>
          {careerPath.targetDate && <div className="text-sm text-muted-foreground">Target by: {careerPath.targetDate}</div>}
          {careerPath.skillsToDevelop && (
            <div>
              <div className="text-sm font-medium mb-1">Skills to Develop</div>
              <p className="text-sm text-muted-foreground">{careerPath.skillsToDevelop}</p>
            </div>
          )}
          {careerPath.developmentActivities && (
            <div>
              <div className="text-sm font-medium mb-1">Development Activities</div>
              <p className="text-sm text-muted-foreground">{careerPath.developmentActivities}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!editing && <div className="text-center py-8 text-muted-foreground">No career path set up yet.</div>}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Role</Label><Input value={form.currentRole} onChange={e => setForm(f => ({ ...f, currentRole: e.target.value }))} /></div>
            <div><Label>Target Role</Label><Input value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} /></div>
          </div>
          <div><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} /></div>
          <div><Label>Skills to Develop</Label><Textarea value={form.skillsToDevelop} onChange={e => setForm(f => ({ ...f, skillsToDevelop: e.target.value }))} rows={3} /></div>
          <div><Label>Development Activities</Label><Textarea value={form.developmentActivities} onChange={e => setForm(f => ({ ...f, developmentActivities: e.target.value }))} rows={3} /></div>
          <div className="flex justify-end gap-2">
            {editing && <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Career Plan"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecognitionTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ receiverEmployeeId: 0, recognitionType: "KUDOS", message: "", points: 10, isPublic: true, category: "" });

  const { data: recognitionsData } = useQuery({
    queryKey: ["hrm-recognitions", orgId],
    queryFn: () => hrmService.getPublicRecognitions(orgId),
  });

  const give = useMutation({
    mutationFn: () => hrmService.giveRecognition(orgId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-recognitions", orgId] }); setShowNew(false); setForm({ receiverEmployeeId: 0, recognitionType: "KUDOS", message: "", points: 10, isPublic: true, category: "" }); },
  });

  const recognitions = recognitionsData?.content ?? [];

  const typeColors: Record<Recognition["recognitionType"], string> = {
    KUDOS: "bg-blue-100 text-blue-800",
    AWARD: "bg-yellow-100 text-yellow-800",
    MILESTONE: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)}><Heart className="w-4 h-4 mr-2" />Give Recognition</Button>
      </div>
      <div className="space-y-3">
        {recognitions.map((r: Recognition) => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="pt-4 flex gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback>{r.giverEmployee.firstName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.giverEmployee.firstName} {r.giverEmployee.lastName}</span>
                  <span className="text-muted-foreground text-sm">recognized</span>
                  <span className="font-medium">{r.receiverEmployee.firstName} {r.receiverEmployee.lastName}</span>
                  <Badge className={`text-xs ${typeColors[r.recognitionType]}`}>{r.recognitionType}</Badge>
                  {r.points > 0 && <span className="text-xs text-muted-foreground">+{r.points} pts</span>}
                </div>
                <p className="text-sm mt-1">{r.message}</p>
                {r.category && <div className="text-xs text-muted-foreground mt-1">#{r.category}</div>}
                <div className="text-xs text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {recognitions.length === 0 && <div className="text-center py-12 text-muted-foreground">Be the first to recognize a colleague!</div>}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Give Recognition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee ID to Recognize *</Label><Input type="number" value={form.receiverEmployeeId || ""} onChange={e => setForm(f => ({ ...f, receiverEmployeeId: Number(e.target.value) }))} placeholder="Enter employee ID" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.recognitionType} onValueChange={v => setForm(f => ({ ...f, recognitionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["KUDOS", "AWARD", "MILESTONE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Points</Label><Input type="number" min={0} value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Category (optional)</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. teamwork, innovation" /></div>
            <div><Label>Message *</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} placeholder="What did they do that impressed you?" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} />
              Post publicly to recognition wall
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button disabled={!form.message || !form.receiverEmployeeId || give.isPending} onClick={() => give.mutate()}>
                {give.isPending ? "Sending…" : "Give Recognition"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LearningDevelopment({ orgId, employeeId }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Learning & Development</h2>
      <Tabs defaultValue="training">
        <TabsList className="mb-6">
          <TabsTrigger value="training"><BookOpen className="w-4 h-4 mr-2" />Training</TabsTrigger>
          <TabsTrigger value="certifications"><Award className="w-4 h-4 mr-2" />Certifications</TabsTrigger>
          <TabsTrigger value="career"><Compass className="w-4 h-4 mr-2" />Career Path</TabsTrigger>
          <TabsTrigger value="recognition"><Heart className="w-4 h-4 mr-2" />Recognition</TabsTrigger>
        </TabsList>
        <TabsContent value="training"><TrainingTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="certifications"><CertificationsTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="career"><CareerPathTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="recognition"><RecognitionTab orgId={orgId} employeeId={employeeId} /></TabsContent>
      </Tabs>
    </div>
  );
}
