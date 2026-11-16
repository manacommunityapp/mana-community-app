import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrmService } from "../../../services/hrm/hrmService";
import type { PayrollRun, Payslip } from "../../../types/hrm";

interface Props {
  orgId: number;
  isHrAdmin?: boolean;
}

export default function PayrollManagement({ orgId, isHrAdmin }: Props) {
  const qc = useQueryClient();
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [createMonth, setCreateMonth] = useState(new Date().getMonth() + 1);
  const [createYear, setCreateYear] = useState(new Date().getFullYear());
  const [showPayslips, setShowPayslips] = useState(false);
  const [activeTab, setActiveTab] = useState<"runs" | "my-payslips">("runs");

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["payroll-runs", orgId],
    queryFn: () => hrmService.getPayrollRuns(orgId),
    enabled: !!orgId && isHrAdmin,
  });

  const { data: myPayslips = [] } = useQuery({
    queryKey: ["my-payslips", orgId],
    queryFn: () => hrmService.getMyPayslips(orgId),
    enabled: !!orgId,
  });

  const { data: runPayslips = [] } = useQuery({
    queryKey: ["run-payslips", orgId, selectedRun?.id],
    queryFn: () => hrmService.getRunPayslips(orgId, selectedRun!.id),
    enabled: !!selectedRun && showPayslips,
  });

  const createMutation = useMutation({
    mutationFn: () => hrmService.createPayrollRun(orgId, createMonth, createYear),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] }),
  });

  const processMutation = useMutation({
    mutationFn: (runId: number) => hrmService.processPayrollRun(orgId, runId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] }),
  });

  const approveMutation = useMutation({
    mutationFn: (runId: number) => hrmService.approvePayrollRun(orgId, runId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] }),
  });

  const publishMutation = useMutation({
    mutationFn: (runId: number) => hrmService.publishPayslips(orgId, runId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-runs", orgId] }),
  });

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PROCESSED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
  };

  const renderPayslip = (ps: Payslip) => (
    <div key={ps.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{ps.employee.firstName} {ps.employee.lastName}</div>
          <div className="text-sm text-gray-500">{ps.employee.employeeCode}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">₹{ps.netSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-gray-500">Net Pay</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-green-50 rounded p-2 text-center">
          <div className="font-medium text-green-700">₹{ps.grossSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-gray-500 text-xs">Gross</div>
        </div>
        <div className="bg-red-50 rounded p-2 text-center">
          <div className="font-medium text-red-700">₹{ps.totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-gray-500 text-xs">Deductions</div>
        </div>
        <div className="bg-blue-50 rounded p-2 text-center">
          <div className="font-medium text-blue-700">{ps.paidDays}/{ps.workingDays}</div>
          <div className="text-gray-500 text-xs">Days Paid</div>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600">View breakdown</summary>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          <span className="text-gray-500">Basic:</span><span>₹{ps.basicSalary.toFixed(0)}</span>
          <span className="text-gray-500">HRA:</span><span>₹{ps.hra.toFixed(0)}</span>
          <span className="text-gray-500">Special Allowance:</span><span>₹{ps.specialAllowance.toFixed(0)}</span>
          <span className="text-gray-500">PF (Employee):</span><span>₹{ps.pfEmployee.toFixed(0)}</span>
          <span className="text-gray-500">ESI (Employee):</span><span>₹{ps.esiEmployee.toFixed(0)}</span>
          <span className="text-gray-500">Professional Tax:</span><span>₹{ps.professionalTax.toFixed(0)}</span>
          <span className="text-gray-500">TDS:</span><span>₹{ps.tds.toFixed(0)}</span>
        </div>
      </details>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setActiveTab("runs")} className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === "runs" ? "bg-white border border-b-white text-blue-600" : "text-gray-500"}`}>
          {isHrAdmin ? "Payroll Runs" : "Payroll"}
        </button>
        <button onClick={() => setActiveTab("my-payslips")} className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === "my-payslips" ? "bg-white border border-b-white text-blue-600" : "text-gray-500"}`}>
          My Payslips
        </button>
      </div>

      {activeTab === "my-payslips" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">My Payslips</h3>
          {myPayslips.length === 0 ? (
            <p className="text-gray-400 text-sm">No payslips available yet.</p>
          ) : (
            myPayslips.map(renderPayslip)
          )}
        </div>
      )}

      {activeTab === "runs" && isHrAdmin && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Month</label>
              <select value={createMonth} onChange={e => setCreateMonth(+e.target.value)} className="border rounded px-2 py-1 text-sm">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input type="number" value={createYear} onChange={e => setCreateYear(+e.target.value)} className="border rounded px-2 py-1 text-sm w-20" />
            </div>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-1 rounded text-sm disabled:opacity-50">
              Create Run
            </button>
          </div>

          {isLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
            <div className="space-y-3">
              {runs.map(run => (
                <div key={run.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{months[run.payrollMonth - 1]} {run.payrollYear}</div>
                      <div className="text-sm text-gray-500">{run.employeeCount} employees</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[run.status]}`}>{run.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div className="text-center">
                      <div className="font-medium">₹{(run.totalGross / 100000).toFixed(1)}L</div>
                      <div className="text-gray-400 text-xs">Gross</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">₹{(run.totalDeductions / 100000).toFixed(1)}L</div>
                      <div className="text-gray-400 text-xs">Deductions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">₹{(run.totalNet / 100000).toFixed(1)}L</div>
                      <div className="text-gray-400 text-xs">Net</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {run.status === "DRAFT" && (
                      <button onClick={() => processMutation.mutate(run.id)} disabled={processMutation.isPending} className="bg-blue-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50">Process</button>
                    )}
                    {run.status === "PROCESSED" && (
                      <button onClick={() => approveMutation.mutate(run.id)} disabled={approveMutation.isPending} className="bg-yellow-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50">Approve</button>
                    )}
                    {run.status === "APPROVED" && (
                      <button onClick={() => publishMutation.mutate(run.id)} disabled={publishMutation.isPending} className="bg-green-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50">Publish Payslips</button>
                    )}
                    <button onClick={() => { setSelectedRun(run); setShowPayslips(true); }} className="border border-gray-300 px-3 py-1 rounded text-xs">View Payslips</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPayslips && selectedRun && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Payslips — {months[selectedRun.payrollMonth - 1]} {selectedRun.payrollYear}</h3>
                  <button onClick={() => setShowPayslips(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>
                {runPayslips.length === 0 ? <p className="text-gray-400 text-sm">No payslips generated yet. Process the run first.</p> : runPayslips.map(renderPayslip)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
