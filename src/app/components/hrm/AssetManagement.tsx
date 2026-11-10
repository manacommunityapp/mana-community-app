import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrAsset } from "../../../types/hrm";

interface Props {
  orgId: number;
  isHrAdmin?: boolean;
}

export default function AssetManagement({ orgId, isHrAdmin }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState<HrAsset | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [form, setForm] = useState({ assetName: "", assetType: "LAPTOP", serialNumber: "", make: "", model: "", purchaseValue: "" });

  const { data: assets } = useQuery({
    queryKey: ["assets", orgId],
    queryFn: () => hrmService.getAssets(orgId),
    enabled: !!orgId,
  });

  const createAsset = useMutation({
    mutationFn: () => hrmService.createAsset(orgId, { ...form, purchaseValue: form.purchaseValue ? +form.purchaseValue : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assets"] }); setShowForm(false); },
  });

  const assignAsset = useMutation({
    mutationFn: () => hrmService.assignAsset(orgId, showAssign!.id, +assignEmployeeId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assets"] }); setShowAssign(null); },
  });

  const statusColor: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    UNDER_REPAIR: "bg-yellow-100 text-yellow-700",
    RETIRED: "bg-gray-100 text-gray-500",
  };

  const assetTypes = ["LAPTOP", "PHONE", "TABLET", "VEHICLE", "FURNITURE", "OTHER"];

  return (
    <div className="space-y-4">
      {isHrAdmin && (
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ Add Asset</button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets?.content.map(asset => (
          <div key={asset.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-sm">{asset.assetName}</div>
                <div className="text-xs text-gray-500">{asset.assetType}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor[asset.status]}`}>{asset.status}</span>
            </div>
            {asset.serialNumber && <div className="text-xs text-gray-400">S/N: {asset.serialNumber}</div>}
            {asset.make && <div className="text-xs text-gray-400">{asset.make} {asset.model}</div>}
            {asset.purchaseValue && <div className="text-xs text-gray-500">Value: ₹{asset.purchaseValue.toLocaleString('en-IN')}</div>}
            {isHrAdmin && asset.status === "AVAILABLE" && (
              <button onClick={() => setShowAssign(asset)} className="text-xs text-blue-600 hover:underline">Assign to Employee</button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Add Asset</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">×</button>
            </div>
            <input placeholder="Asset Name *" value={form.assetName} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
              {assetTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <input placeholder="Serial Number" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Make" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="Model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
            </div>
            <input type="number" placeholder="Purchase Value (₹)" value={form.purchaseValue} onChange={e => setForm(f => ({ ...f, purchaseValue: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <button onClick={() => createAsset.mutate()} disabled={createAsset.isPending || !form.assetName} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Add Asset</button>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Assign {showAssign.assetName}</h3>
              <button onClick={() => setShowAssign(null)} className="text-gray-400">×</button>
            </div>
            <input type="number" placeholder="Employee ID" value={assignEmployeeId} onChange={e => setAssignEmployeeId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            <button onClick={() => assignAsset.mutate()} disabled={assignAsset.isPending || !assignEmployeeId} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Assign</button>
          </div>
        </div>
      )}
    </div>
  );
}
