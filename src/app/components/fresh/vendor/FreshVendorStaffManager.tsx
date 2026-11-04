import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, UserX, CheckCircle2,
  Mail, Phone, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { freshVendorService } from '../../../../services/freshVendorService';
import type { VendorStaffDto, VendorStaffRole } from '../../../../types/freshVendor';
import { useAuth } from '../../../../contexts/AuthContext';

const STAFF_ROLES: { role: VendorStaffRole; label: string; description: string }[] = [
  { role: 'VENDOR_OWNER', label: 'Vendor Owner', description: 'Complete business access, banking and staff controls' },
  { role: 'VENDOR_MANAGER', label: 'Vendor Manager', description: 'Daily operations, pricing, orders and dispatch' },
  { role: 'CATALOGUE_MANAGER', label: 'Catalogue Manager', description: 'Product creation, descriptions and category attributes' },
  { role: 'INVENTORY_MANAGER', label: 'Inventory Manager', description: 'Stock levels, reservations and buffer management' },
  { role: 'PRODUCTION_MANAGER', label: 'Production Manager', description: 'Processing batches, BOM yield and fermentation logging' },
  { role: 'QUALITY_MANAGER', label: 'Quality Manager', description: 'Quality inspection checklists and 2–4°C cold chain release' },
  { role: 'PACKING_STAFF', label: 'Packing Staff', description: 'Community tower packing, barcode scanning and dispatch' },
  { role: 'DELIVERY_STAFF', label: 'Delivery Staff', description: 'Doorstep morning delivery runs and resident OTP validation' },
  { role: 'VENDOR_ACCOUNTANT', label: 'Vendor Accountant', description: 'Invoices, settlements, commissions and financial reports' }
];

export function FreshVendorStaffManager() {
  const { user } = useAuth();
  const vendorId = user?.vendorId || 1;

  const [staffList, setStaffList] = useState<VendorStaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<VendorStaffRole>('PACKING_STAFF');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await freshVendorService.getVendorStaff(vendorId);
      setStaffList(data || []);
    } catch (err) {
      console.error('Failed to load vendor staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [vendorId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = Number(userIdInput);
    if (!uid) return;

    try {
      setInviting(true);
      await freshVendorService.assignStaff({
        vendorId,
        userId: uid,
        vendorRole: selectedRole
      });
      setModalOpen(false);
      setUserIdInput('');
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to assign staff member');
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (staffUserId: number) => {
    if (!confirm('Are you sure you want to revoke this staff member access?')) return;
    try {
      await freshVendorService.deactivateStaff(vendorId, staffUserId);
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff member');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" /> Vendor Team & Scoped Access
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white m-0">
            Staff & Operational Role Assignments
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl m-0">
            Empower your kitchen, packaging, and delivery crew with tailored role-based permissions. A packing staff member cannot alter bank details, while a quality manager holds exclusive authority for batch release.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Assign Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Loading staff roster...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 m-0">No Staff Assigned Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto m-0">
            You are operating with full owner privileges. Click "Assign Staff Member" above to delegate kitchen production, quality inspection, or packaging tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((member) => (
            <div
              key={member.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm flex flex-col justify-between ${
                member.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                      {(member.userFullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 m-0">
                        {member.userFullName || `User #${member.userId}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 m-0">ID: {member.userId}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    {member.vendorRole.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {STAFF_ROLES.find(r => r.role === member.vendorRole)?.description || 'Assigned vendor staff member'}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500">
                  {member.userEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{member.userEmail}</span>
                    </div>
                  )}
                  {member.userPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.userPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {member.isActive && member.vendorRole !== 'VENDOR_OWNER' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeactivate(member.userId)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1"
                  >
                    <UserX className="w-3.5 h-3.5" /> Revoke Access
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 m-0">Assign Staff Member</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">User ID / Registered App User ID</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 101"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 m-0">
                  Enter the numerical user ID of the employee registered in Mana Community Hub.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Role & Permissions</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as VendorStaffRole)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}