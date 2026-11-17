import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrmService } from "../../../services/hrm/hrmService";
import type { ExpenseClaim, ExpenseItem, TravelRequest } from "../../../types/hrm";

interface Props {
  orgId: number;
  isHrAdmin?: boolean;
}

export default function ExpenseManagement({ orgId, isHrAdmin }: Props) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"my-claims" | "my-travel" | "pending">("my-claims");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [claimForm, setClaimForm] = useState({ claimTitle: "", claimType: "TRAVEL", description: "", claimDate: new Date().toISOString().slice(0, 10) });
  const [travelForm, setTravelForm] = useState({ destination: "", purpose: "", travelFrom: "", travelTo: "", modeOfTravel: "AIR", estimatedCost: "" });
  const [items, setItems] = useState<Partial<ExpenseItem>[]>([{ description: "", amount: 0 }]);

  const { data: myClaims } = useQuery({
    queryKey: ["my-claims", orgId],
    queryFn: () => hrmService.getMyClaims(orgId),
    enabled: !!orgId,
  });

  const { data: myTravel } = useQuery({
    queryKey: ["my-travel", orgId],
    queryFn: () => hrmService.getMyTravelRequests(orgId),
    enabled: !!orgId,
  });

  const { data: pendingClaims } = useQuery({
    queryKey: ["pending-claims", orgId],
    queryFn: () => hrmService.getPendingClaims(orgId),
    enabled: !!orgId && !!isHrAdmin,
  });

  const createClaim = useMutation({
    mutationFn: () => hrmService.createExpenseClaim(orgId, { ...claimForm, items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-claims"] }); setShowClaimForm(false); },
  });

  const submitClaim = useMutation({
    mutationFn: (claimId: number) => hrmService.submitExpenseClaim(orgId, claimId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-claims"] }),
  });

  const approveClaim = useMutation({
    mutationFn: (claimId: number) => hrmService.approveExpenseClaim(orgId, claimId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-claims"] }),
  });

  const rejectClaim = useMutation({
    mutationFn: ({ claimId, reason }: { claimId: number; reason: string }) => hrmService.rejectExpenseClaim(orgId, claimId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-claims"] }),
  });

  const createTravel = useMutation({
    mutationFn: () => hrmService.createTravelRequest(orgId, { ...travelForm, estimatedCost: travelForm.estimatedCost ? +travelForm.estimatedCost : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-travel"] }); setShowTravelForm(false); },
  });

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    REIMBURSED: "bg-purple-100 text-purple-700",
    PENDING: "bg-yellow-100 text-yellow-700",
  };

  const claimTypes = ["TRAVEL", "MEAL", "ACCOMMODATION", "MEDICAL", "OTHER"];
  const travelModes = ["AIR", "TRAIN", "BUS", "CAR", "OTHER"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["my-claims", "my-travel", ...(isHrAdmin ? ["pending"] : [])].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === tab ? "bg-white border border-b-white text-blue-600" : "text-gray-500"}`}>
            {tab === "my-claims" ? "My Claims" : tab === "my-travel" ? "Travel Requests" : "Pending Approval"}
          </button>
        ))}
      </div>

      {activeTab === "my-claims" && (
        <div className="space-y-3">
          <button onClick={() => setShowClaimForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ New Claim</button>
          {myClaims?.content.map(claim => (
            <div key={claim.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <div className="font-medium">{claim.claimTitle}</div>
                <div className="text-sm text-gray-500">{claim.claimType} · ₹{claim.totalAmount.toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-400">{claim.claimDate}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[claim.status]}`}>{claim.status}</span>
                {claim.status === "DRAFT" && (
                  <button onClick={() => submitClaim.mutate(claim.id)} className="text-xs text-blue-600 hover:underline">Submit</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "my-travel" && (
        <div className="space-y-3">
          <button onClick={() => setShowTravelForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ New Travel Request</button>
          {myTravel?.content.map(req => (
            <div key={req.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <div className="font-medium">{req.destination}</div>
                <div className="text-sm text-gray-500">{req.purpose}</div>
                <div className="text-xs text-gray-400">{req.travelFrom} → {req.travelTo} · {req.modeOfTravel}</div>
                {req.estimatedCost && <div className="text-xs text-gray-500">Est. ₹{req.estimatedCost.toLocaleString('en-IN')}</div>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor[req.status]}`}>{req.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "pending" && isHrAdmin && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Pending Claims for Approval</h3>
          {pendingClaims?.content.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending claims.</p>
          ) : pendingClaims?.content.map(claim => (
            <div key={claim.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{claim.claimTitle}</div>
                  <div className="text-sm text-gray-500">{claim.employee.firstName} · {claim.claimType} · ₹{claim.totalAmount.toLocaleString('en-IN')}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[claim.status]}`}>{claim.status}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveClaim.mutate(claim.id)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Approve</button>
                <button onClick={() => rejectClaim.mutate({ claimId: claim.id, reason: "Not approved" })} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between">
              <h3 className="font-semibold">New Expense Claim</h3>
              <button onClick={() => setShowClaimForm(false)} className="text-gray-400">×</button>
            </div>
            <input placeholder="Claim Title" value={claimForm.claimTitle} onChange={e => setClaimForm(f => ({ ...f, claimTitle: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <select value={claimForm.claimType} onChange={e => setClaimForm(f => ({ ...f, claimType: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
              {claimTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={claimForm.claimDate} onChange={e => setClaimForm(f => ({ ...f, claimDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={claimForm.description} onChange={e => setClaimForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm h-20" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Line Items</label>
                <button onClick={() => setItems(i => [...i, { description: "", amount: 0 }])} className="text-xs text-blue-600">+ Add</button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input placeholder="Description" value={item.description} onChange={e => setItems(i => i.map((it, j) => j === idx ? { ...it, description: e.target.value } : it))} className="flex-1 border rounded px-2 py-1 text-sm" />
                  <input type="number" placeholder="₹" value={item.amount || ""} onChange={e => setItems(i => i.map((it, j) => j === idx ? { ...it, amount: +e.target.value } : it))} className="w-24 border rounded px-2 py-1 text-sm" />
                </div>
              ))}
            </div>
            <div className="text-sm font-medium text-right">Total: ₹{items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString('en-IN')}</div>
            <button onClick={() => createClaim.mutate()} disabled={createClaim.isPending || !claimForm.claimTitle} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Save Claim</button>
          </div>
        </div>
      )}

      {/* Travel Form Modal */}
      {showTravelForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">New Travel Request</h3>
              <button onClick={() => setShowTravelForm(false)} className="text-gray-400">×</button>
            </div>
            <input placeholder="Destination" value={travelForm.destination} onChange={e => setTravelForm(f => ({ ...f, destination: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <input placeholder="Purpose" value={travelForm.purpose} onChange={e => setTravelForm(f => ({ ...f, purpose: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500">Travel From</label><input type="date" value={travelForm.travelFrom} onChange={e => setTravelForm(f => ({ ...f, travelFrom: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">Travel To</label><input type="date" value={travelForm.travelTo} onChange={e => setTravelForm(f => ({ ...f, travelTo: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" /></div>
            </div>
            <select value={travelForm.modeOfTravel} onChange={e => setTravelForm(f => ({ ...f, modeOfTravel: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
              {travelModes.map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="number" placeholder="Estimated Cost (₹)" value={travelForm.estimatedCost} onChange={e => setTravelForm(f => ({ ...f, estimatedCost: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <button onClick={() => createTravel.mutate()} disabled={createTravel.isPending || !travelForm.destination} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Submit Request</button>
          </div>
        </div>
      )}
    </div>
  );
}
