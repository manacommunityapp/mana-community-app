import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, TrendingUp, Star, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { hrmService } from "@/services/hrm/hrmService";
import type { Goal, Okr, OkrKeyResult } from "@/types/hrm";

interface Props {
  orgId: number;
  employeeId: number;
}

function GoalsTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", isKra: false, weightage: 10, targetValue: "", dueDate: "" });

  const { data: goals = [] } = useQuery({
    queryKey: ["hrm-goals", employeeId],
    queryFn: () => hrmService.getGoals(employeeId),
  });

  const createGoal = useMutation({
    mutationFn: (data: Partial<Goal>) => hrmService.createGoal(orgId, employeeId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-goals", employeeId] }); setShowNew(false); },
  });

  const updateProgress = useMutation({
    mutationFn: ({ goalId, pct }: { goalId: number; pct: number }) =>
      hrmService.updateGoalProgress(goalId, pct),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hrm-goals", employeeId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-2" />Add Goal / KRA</Button>
      </div>
      {goals.map(g => (
        <Card key={g.id}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {g.title}
                  {g.isKra && <Badge variant="outline" className="text-xs">KRA</Badge>}
                </div>
                {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
              </div>
              <Badge variant={g.status === "COMPLETED" ? "default" : "secondary"}>{g.status}</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{g.achievementPercent}%</span>
              </div>
              <Progress value={g.achievementPercent} className="h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Weightage: {g.weightage}%</span>
              {g.dueDate && <span>Due: {g.dueDate}</span>}
            </div>
            <div className="flex gap-1">
              {[25, 50, 75, 100].map(pct => (
                <Button key={pct} size="sm" variant="outline" className="text-xs"
                  onClick={() => updateProgress.mutate({ goalId: g.id, pct })}>
                  {pct}%
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {goals.length === 0 && <div className="text-center py-12 text-muted-foreground">No goals set yet.</div>}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Goal / KRA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Weightage (%)</Label><Input type="number" min={1} max={100} value={form.weightage} onChange={e => setForm(f => ({ ...f, weightage: Number(e.target.value) }))} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
            <div><Label>Target Value</Label><Input value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} placeholder="e.g. 100 units, 95% score" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isKra} onChange={e => setForm(f => ({ ...f, isKra: e.target.checked }))} />
              Mark as KRA (Key Result Area)
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button disabled={!form.title || createGoal.isPending} onClick={() => createGoal.mutate(form)}>
                {createGoal.isPending ? "Saving…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OkrTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [objective, setObjective] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [krTitles, setKrTitles] = useState(["", "", ""]);

  const { data: okrs = [] } = useQuery({
    queryKey: ["hrm-okrs", employeeId],
    queryFn: () => hrmService.getOkrs(employeeId),
  });

  const createOkr = useMutation({
    mutationFn: (data: Parameters<typeof hrmService.createOkr>[1]) => hrmService.createOkr(orgId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-okrs", employeeId] }); setShowNew(false); setObjective(""); setKrTitles(["", "", ""]); },
  });

  const updateKr = useMutation({
    mutationFn: ({ krId, pct }: { krId: number; pct: number }) => hrmService.updateKeyResult(krId, pct),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hrm-okrs", employeeId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-2" />Add OKR</Button>
      </div>
      {okrs.map(okr => (
        <Card key={okr.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{okr.objective}</CardTitle>
              <div className="flex items-center gap-2">
                {okr.quarter && <Badge variant="outline">{okr.quarter} {okr.year}</Badge>}
                <span className="text-sm font-semibold">{okr.overallProgress}%</span>
              </div>
            </div>
            <Progress value={okr.overallProgress} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {(okr.keyResults ?? []).map((kr: OkrKeyResult) => (
              <div key={kr.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{kr.title}</span>
                  <span className="text-muted-foreground">{kr.progressPercent}%</span>
                </div>
                <Progress value={kr.progressPercent} className="h-1" />
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map(pct => (
                    <Button key={pct} size="sm" variant="ghost" className="text-xs h-6 px-1"
                      onClick={() => updateKr.mutate({ krId: kr.id, pct })}>
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {okrs.length === 0 && <div className="text-center py-12 text-muted-foreground">No OKRs set yet.</div>}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New OKR</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Objective *</Label><Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. Improve customer satisfaction" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quarter</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Q1","Q2","Q3","Q4"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Key Results</Label>
              {krTitles.map((t, i) => (
                <Input key={i} value={t} onChange={e => { const a = [...krTitles]; a[i] = e.target.value; setKrTitles(a); }} placeholder={`Key Result ${i + 1}`} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button disabled={!objective || createOkr.isPending}
                onClick={() => createOkr.mutate({ objective, quarter, year, keyResults: krTitles.filter(Boolean).map(title => ({ title })) })}>
                {createOkr.isPending ? "Saving…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppraisalTab({ orgId, employeeId }: Props) {
  const qc = useQueryClient();
  const [selfRating, setSelfRating] = useState(3);
  const [selfComments, setSelfComments] = useState("");
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);

  const { data: cycles = [] } = useQuery({
    queryKey: ["hrm-cycles", orgId],
    queryFn: () => hrmService.getAppraisalCycles(orgId),
  });

  const activeCycles = cycles.filter(c => c.status === "ACTIVE");

  const submitSelf = useMutation({
    mutationFn: () => hrmService.submitSelfAppraisal(employeeId, activeCycleId!, selfRating, selfComments),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrm-cycles-forms", orgId] }); setSelfComments(""); },
  });

  return (
    <div className="space-y-4">
      {activeCycles.length > 0 ? (
        activeCycles.map(cycle => (
          <Card key={cycle.id}>
            <CardHeader>
              <CardTitle className="text-base">{cycle.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{cycle.periodStart} → {cycle.periodEnd}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Self Rating (1–5)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r}
                      className={`w-9 h-9 rounded-full border-2 font-semibold transition-colors ${selfRating === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                      onClick={() => { setSelfRating(r); setActiveCycleId(cycle.id); }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Comments</Label>
                <Textarea value={selfComments} onChange={e => setSelfComments(e.target.value)} rows={4} placeholder="Describe your achievements this cycle…" />
              </div>
              <Button onClick={() => { setActiveCycleId(cycle.id); submitSelf.mutate(); }} disabled={submitSelf.isPending}>
                {submitSelf.isPending ? "Submitting…" : "Submit Self Appraisal"}
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">No active appraisal cycles.</div>
      )}
      {cycles.filter(c => c.status !== "ACTIVE").length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-muted-foreground">Past Cycles</h4>
          <div className="space-y-2">
            {cycles.filter(c => c.status !== "ACTIVE").map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-muted-foreground">{c.periodStart} → {c.periodEnd}</div>
                </div>
                <Badge variant={c.status === "CLOSED" ? "secondary" : "outline"}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackTab({ orgId, employeeId }: Props) {
  return (
    <div className="text-center py-12 text-muted-foreground space-y-2">
      <MessageSquare className="w-12 h-12 mx-auto opacity-30" />
      <div className="font-medium">360-Degree Feedback</div>
      <p className="text-sm max-w-sm mx-auto">Managers can initiate feedback rounds. Respondents will be notified by email.</p>
    </div>
  );
}

export function PerformanceManagement({ orgId, employeeId }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Performance Management</h2>
      <Tabs defaultValue="goals">
        <TabsList className="mb-6">
          <TabsTrigger value="goals"><Target className="w-4 h-4 mr-2" />Goals & KRAs</TabsTrigger>
          <TabsTrigger value="okrs"><TrendingUp className="w-4 h-4 mr-2" />OKRs</TabsTrigger>
          <TabsTrigger value="appraisal"><Star className="w-4 h-4 mr-2" />Appraisal</TabsTrigger>
          <TabsTrigger value="feedback"><MessageSquare className="w-4 h-4 mr-2" />360 Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="goals"><GoalsTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="okrs"><OkrTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="appraisal"><AppraisalTab orgId={orgId} employeeId={employeeId} /></TabsContent>
        <TabsContent value="feedback"><FeedbackTab orgId={orgId} employeeId={employeeId} /></TabsContent>
      </Tabs>
    </div>
  );
}
