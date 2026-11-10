import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Briefcase, Users, ChevronRight, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { hrmService } from "@/services/hrm/hrmService";
import type { JobPosting, Applicant } from "@/types/hrm";

const APPLICANT_STAGES: Applicant["status"][] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

const STAGE_COLORS: Record<Applicant["status"], string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  SCREENING: "bg-yellow-100 text-yellow-800",
  INTERVIEW: "bg-purple-100 text-purple-800",
  OFFER: "bg-orange-100 text-orange-800",
  HIRED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

interface Props {
  orgId: number;
}

export function RecruitmentBoard({ orgId }: Props) {
  const qc = useQueryClient();
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [showNewPosting, setShowNewPosting] = useState(false);
  const [newPosting, setNewPosting] = useState({ title: "", openings: 1, employmentType: "FULL_TIME", location: "", description: "" });

  const { data: postingsData } = useQuery({
    queryKey: ["hrm-job-postings", orgId],
    queryFn: () => hrmService.getJobPostings(orgId),
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ["hrm-applicants", orgId, selectedPosting?.id],
    queryFn: () =>
      selectedPosting
        ? hrmService.getApplicants(orgId, selectedPosting.id).then(r => r.content)
        : Promise.resolve([]),
    enabled: !!selectedPosting,
  });

  const createPosting = useMutation({
    mutationFn: (data: Partial<JobPosting>) => hrmService.createJobPosting(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hrm-job-postings", orgId] });
      setShowNewPosting(false);
      setNewPosting({ title: "", openings: 1, employmentType: "FULL_TIME", location: "", description: "" });
    },
  });

  const moveApplicant = useMutation({
    mutationFn: ({ applicantId, status }: { applicantId: number; status: string }) =>
      hrmService.updateApplicantStatus(orgId, applicantId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hrm-applicants", orgId, selectedPosting?.id] }),
  });

  const updatePostingStatus = useMutation({
    mutationFn: ({ postingId, status }: { postingId: number; status: string }) =>
      hrmService.updatePostingStatus(orgId, postingId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hrm-job-postings", orgId] }),
  });

  const postings = postingsData?.content ?? [];

  const applicantsByStage = APPLICANT_STAGES.reduce<Record<string, Applicant[]>>((acc, stage) => {
    acc[stage] = applicants.filter(a => a.status === stage);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recruitment</h2>
        <Button onClick={() => setShowNewPosting(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Job Posting
        </Button>
      </div>

      {/* Job Postings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {postings.map(p => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-shadow hover:shadow-md ${selectedPosting?.id === p.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedPosting(p)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <Badge variant={p.status === "OPEN" ? "default" : "secondary"} className="ml-2 shrink-0">
                  {p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{p.employmentType ?? "—"}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.openings} opening{p.openings !== 1 ? "s" : ""}</span>
              </div>
              {p.location && <div>{p.location}</div>}
              <div className="flex gap-2 pt-2">
                {p.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updatePostingStatus.mutate({ postingId: p.id, status: "OPEN" }); }}>
                    Publish
                  </Button>
                )}
                {p.status === "OPEN" && (
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updatePostingStatus.mutate({ postingId: p.id, status: "CLOSED" }); }}>
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {postings.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No job postings yet. Create one to start hiring.
          </div>
        )}
      </div>

      {/* Applicant Kanban */}
      {selectedPosting && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">{selectedPosting.title}</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Applicants ({applicants.length})</span>
            <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSelectedPosting(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {APPLICANT_STAGES.map(stage => (
              <div key={stage} className="min-w-[200px] flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</span>
                  <Badge variant="secondary" className="text-xs">{applicantsByStage[stage].length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px] bg-muted/30 rounded-lg p-2">
                  {applicantsByStage[stage].map(a => (
                    <Card key={a.id} className="p-3 text-sm shadow-sm">
                      <div className="font-medium">{a.firstName} {a.lastName}</div>
                      <div className="text-xs text-muted-foreground mt-1">{a.email}</div>
                      {a.experienceYears !== undefined && (
                        <div className="text-xs text-muted-foreground">{a.experienceYears}y exp</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {APPLICANT_STAGES.filter(s => s !== stage && s !== "REJECTED").map(next => (
                          <button
                            key={next}
                            className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[next]} opacity-80 hover:opacity-100`}
                            onClick={() => moveApplicant.mutate({ applicantId: a.id, status: next })}
                          >
                            → {next}
                          </button>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Posting Dialog */}
      <Dialog open={showNewPosting} onOpenChange={setShowNewPosting}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Title *</Label>
              <Input value={newPosting.title} onChange={e => setNewPosting(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Openings</Label>
                <Input type="number" min={1} value={newPosting.openings} onChange={e => setNewPosting(p => ({ ...p, openings: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={newPosting.employmentType} onValueChange={v => setNewPosting(p => ({ ...p, employmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={newPosting.location} onChange={e => setNewPosting(p => ({ ...p, location: e.target.value }))} placeholder="City or Remote" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newPosting.description} onChange={e => setNewPosting(p => ({ ...p, description: e.target.value }))} rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPosting(false)}>Cancel</Button>
              <Button disabled={!newPosting.title || createPosting.isPending} onClick={() => createPosting.mutate(newPosting)}>
                {createPosting.isPending ? "Creating…" : "Create Posting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
