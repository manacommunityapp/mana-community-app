import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Loader2,
  GitBranch,
  Briefcase,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { hrmService } from "../../../services/hrm/hrmService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type { HrOrganization, HrBranch, HrDepartment, HrDesignation, CreateOrganizationRequest } from "../../../types/hrm";

const ORG_TYPES = [
  "RESTAURANT", "GROCERY", "SUPERMARKET", "SALON", "SPORTS_ACADEMY",
  "APARTMENT_ASSOCIATION", "HOME_SERVICES", "CLINIC", "RETAIL_STORE",
  "LOGISTICS", "OTHER",
];

export function HrmSettings() {
  const [org, setOrg] = useState<HrOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<HrBranch[]>([]);
  const [departments, setDepartments] = useState<HrDepartment[]>([]);
  const [designations, setDesignations] = useState<HrDesignation[]>([]);

  const [orgForm, setOrgForm] = useState<CreateOrganizationRequest>({
    organizationName: "", organizationType: "OTHER",
  });
  const [savingOrg, setSavingOrg] = useState(false);

  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ branchName: "", branchCode: "", city: "" });
  const [savingBranch, setSavingBranch] = useState(false);

  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState({ departmentName: "", departmentCode: "" });
  const [savingDept, setSavingDept] = useState(false);

  const [addDesigOpen, setAddDesigOpen] = useState(false);
  const [newDesig, setNewDesig] = useState({ designationName: "", level: 1 });
  const [savingDesig, setSavingDesig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const orgs = await hrmService.getMyOrganizations();
      if (orgs.length > 0) {
        const o = orgs[0];
        setOrg(o);
        setOrgForm({
          organizationName: o.organizationName,
          organizationType: o.organizationType,
          gstNumber: o.gstNumber,
          registrationNumber: o.registrationNumber,
          contactEmail: o.contactEmail,
          contactPhone: o.contactPhone,
          address: o.address,
        });
        await loadOrgData(o.id);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgData(id: number) {
    const [brs, depts, desigs] = await Promise.all([
      hrmService.getBranches(id).catch(() => []),
      hrmService.getDepartments(id).catch(() => []),
      hrmService.getDesignations(id).catch(() => []),
    ]);
    setBranches(brs);
    setDepartments(depts);
    setDesignations(desigs);
  }

  async function saveOrg() {
    setSavingOrg(true);
    try {
      if (org) {
        const updated = await hrmService.updateOrganization(org.id, orgForm);
        setOrg(updated);
        showSuccess("Organization updated");
      } else {
        const created = await hrmService.createOrganization(orgForm);
        setOrg(created);
        showSuccess("Organization created");
      }
    } catch (err: any) {
      showError(err.message || "Failed to save organization");
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleAddBranch() {
    if (!org || !newBranch.branchName.trim()) return;
    setSavingBranch(true);
    try {
      await hrmService.createBranch(org.id, newBranch);
      showSuccess("Branch added");
      setAddBranchOpen(false);
      setNewBranch({ branchName: "", branchCode: "", city: "" });
      setBranches(await hrmService.getBranches(org.id));
    } catch (err: any) {
      showError(err.message || "Failed to add branch");
    } finally {
      setSavingBranch(false);
    }
  }

  async function handleAddDept() {
    if (!org || !newDept.departmentName.trim()) return;
    setSavingDept(true);
    try {
      await hrmService.createDepartment(org.id, newDept);
      showSuccess("Department added");
      setAddDeptOpen(false);
      setNewDept({ departmentName: "", departmentCode: "" });
      setDepartments(await hrmService.getDepartments(org.id));
    } catch (err: any) {
      showError(err.message || "Failed to add department");
    } finally {
      setSavingDept(false);
    }
  }

  async function handleAddDesig() {
    if (!org || !newDesig.designationName.trim()) return;
    setSavingDesig(true);
    try {
      await hrmService.createDesignation(org.id, newDesig);
      showSuccess("Designation added");
      setAddDesigOpen(false);
      setNewDesig({ designationName: "", level: 1 });
      setDesignations(await hrmService.getDesignations(org.id));
    } catch (err: any) {
      showError(err.message || "Failed to add designation");
    } finally {
      setSavingDesig(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">HR Settings</h1>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
        </TabsList>

        {/* Organization */}
        <TabsContent value="organization" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Organization Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input id="org-name" value={orgForm.organizationName} onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Organization Type *</Label>
                  <Select value={orgForm.organizationType} onValueChange={(v) => setOrgForm({ ...orgForm, organizationType: v })}>
                    <SelectTrigger id="org-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-gst">GST Number</Label>
                  <Input id="org-gst" value={orgForm.gstNumber || ""} onChange={(e) => setOrgForm({ ...orgForm, gstNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-reg">Registration Number</Label>
                  <Input id="org-reg" value={orgForm.registrationNumber || ""} onChange={(e) => setOrgForm({ ...orgForm, registrationNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Contact Email</Label>
                  <Input id="org-email" type="email" value={orgForm.contactEmail || ""} onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Contact Phone</Label>
                  <Input id="org-phone" value={orgForm.contactPhone || ""} onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address">Address</Label>
                <Input id="org-address" value={orgForm.address || ""} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} />
              </div>
              <Button onClick={saveOrg} disabled={savingOrg}>
                {savingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {org ? "Update Organization" : "Create Organization"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Branches</CardTitle>
              <Button size="sm" onClick={() => setAddBranchOpen(true)} disabled={!org}>
                <Plus className="mr-2 h-4 w-4" /> Add Branch
              </Button>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <GitBranch className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No branches added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {branches.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{b.branchName}</p>
                        <p className="text-xs text-muted-foreground">{[b.branchCode, b.city, b.state].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Departments</CardTitle>
              <Button size="sm" onClick={() => setAddDeptOpen(true)} disabled={!org}>
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No departments added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {departments.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{d.departmentName}</p>
                        {d.departmentCode && <p className="text-xs text-muted-foreground">{d.departmentCode}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designations */}
        <TabsContent value="designations" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Designations</CardTitle>
              <Button size="sm" onClick={() => setAddDesigOpen(true)} disabled={!org}>
                <Plus className="mr-2 h-4 w-4" /> Add Designation
              </Button>
            </CardHeader>
            <CardContent>
              {designations.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Award className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No designations added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {designations.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{d.designationName}</p>
                        {d.level !== undefined && <p className="text-xs text-muted-foreground">Level {d.level}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Branch Dialog */}
      <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name *</Label>
              <Input id="branch-name" value={newBranch.branchName} onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-code">Branch Code</Label>
              <Input id="branch-code" value={newBranch.branchCode} onChange={(e) => setNewBranch({ ...newBranch, branchCode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-city">City</Label>
              <Input id="branch-city" value={newBranch.city} onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBranchOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBranch} disabled={savingBranch}>
              {savingBranch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input id="dept-name" value={newDept.departmentName} onChange={(e) => setNewDept({ ...newDept, departmentName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code">Department Code</Label>
              <Input id="dept-code" value={newDept.departmentCode} onChange={(e) => setNewDept({ ...newDept, departmentCode: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeptOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDept} disabled={savingDept}>
              {savingDept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Designation Dialog */}
      <Dialog open={addDesigOpen} onOpenChange={setAddDesigOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Designation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="desig-name">Designation Name *</Label>
              <Input id="desig-name" value={newDesig.designationName} onChange={(e) => setNewDesig({ ...newDesig, designationName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desig-level">Level</Label>
              <Input id="desig-level" type="number" value={newDesig.level} onChange={(e) => setNewDesig({ ...newDesig, level: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDesigOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDesig} disabled={savingDesig}>
              {savingDesig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
