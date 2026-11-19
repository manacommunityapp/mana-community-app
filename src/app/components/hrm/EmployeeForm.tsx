import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type { HrDepartment, HrDesignation, HrBranch, CreateEmployeeRequest } from "../../../types/hrm";

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  orgId: number;
}

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
  { value: "TEMPORARY", label: "Temporary" },
  { value: "GIG", label: "Gig Worker" },
];

export function EmployeeForm({ open, onClose, onCreated, orgId }: EmployeeFormProps) {
  const [departments, setDepartments] = useState<HrDepartment[]>([]);
  const [designations, setDesignations] = useState<HrDesignation[]>([]);
  const [branches, setBranches] = useState<HrBranch[]>([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateEmployeeRequest>({
    defaultValues: { employmentType: "FULL_TIME" },
  });

  useEffect(() => {
    if (open && orgId) {
      loadFormData();
    }
  }, [open, orgId]);

  async function loadFormData() {
    try {
      const [depts, desigs, brs] = await Promise.all([
        hrmService.getDepartments(orgId),
        hrmService.getDesignations(orgId),
        hrmService.getBranches(orgId),
      ]);
      setDepartments(depts);
      setDesignations(desigs);
      setBranches(brs);
    } catch {
      // silently handle - selects will be empty
    }
  }

  async function onSubmit(data: CreateEmployeeRequest) {
    setSaving(true);
    try {
      await hrmService.createEmployee(orgId, data);
      showSuccess("Employee created successfully");
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      showError(err.message || "Failed to create employee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Employee</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="emp-manaUserId">Mana User ID *</Label>
            <Input
              id="emp-manaUserId"
              type="number"
              {...register("manaUserId", { required: "Mana User ID is required", valueAsNumber: true })}
              placeholder="Linked Mana account ID"
            />
            {errors.manaUserId && <p className="text-xs text-destructive">{errors.manaUserId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-firstName">First Name *</Label>
              <Input
                id="emp-firstName"
                {...register("firstName", { required: "First name is required" })}
                placeholder="First name"
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-lastName">Last Name *</Label>
              <Input
                id="emp-lastName"
                {...register("lastName", { required: "Last name is required" })}
                placeholder="Last name"
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-code">Employee Code</Label>
            <Input id="emp-code" {...register("employeeCode")} placeholder="Auto-generated if empty" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-phone">Phone</Label>
            <Input id="emp-phone" {...register("phone")} placeholder="Phone number" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-personalEmail">Personal Email</Label>
              <Input id="emp-personalEmail" type="email" {...register("personalEmail")} placeholder="Personal email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-workEmail">Work Email</Label>
              <Input id="emp-workEmail" type="email" {...register("workEmail")} placeholder="Work email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Employment Type *</Label>
            <Select defaultValue="FULL_TIME" onValueChange={(v) => setValue("employmentType", v)}>
              <SelectTrigger id="emp-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {departments.length > 0 && (
            <div className="space-y-2">
              <Label>Department</Label>
              <Select onValueChange={(v) => setValue("departmentId", Number(v))}>
                <SelectTrigger id="emp-dept">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.departmentName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {designations.length > 0 && (
            <div className="space-y-2">
              <Label>Designation</Label>
              <Select onValueChange={(v) => setValue("designationId", Number(v))}>
                <SelectTrigger id="emp-desig">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.designationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {branches.length > 0 && (
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select onValueChange={(v) => setValue("branchId", Number(v))}>
                <SelectTrigger id="emp-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.branchName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="emp-joining">Joining Date</Label>
            <Input id="emp-joining" type="date" {...register("joiningDate")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-ecName">Emergency Contact</Label>
              <Input id="emp-ecName" {...register("emergencyContactName")} placeholder="Contact name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-ecPhone">Emergency Phone</Label>
              <Input id="emp-ecPhone" {...register("emergencyContactPhone")} placeholder="Contact phone" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Employee
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
