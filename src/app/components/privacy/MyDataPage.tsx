import React, { useState, useEffect } from "react";
import {
  Download,
  User,
  Users,
  Shield,
  ShoppingBag,
  FileJson,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Home,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { privacyService, type UserDataExport } from "../../../services/privacy/privacyService";

export const MyDataPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState<UserDataExport | null>(null);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const data = await privacyService.getMyData();
      setExportData(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load personal data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!exportData) return;
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `mana_community_my_data_${exportData.user?.fullName?.replace(/\s+/g, "_") || "user"}_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Personal data export downloaded as JSON");
    } catch (err: any) {
      toast.error("Failed to generate export file");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-medium">Gathering your personal data across modules...</p>
      </div>
    );
  }

  if (!exportData) {
    return (
      <div className="text-center p-12 space-y-4">
        <p className="text-slate-500 text-sm">Unable to retrieve personal data records.</p>
        <button
          onClick={fetchMyData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const { user, familyMembers = [], visitorPasses = [], marketplaceOrders = [] } = exportData;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-200" />
            <h2 className="text-xl font-bold">Personal Data Portability & Access</h2>
          </div>
          <p className="text-xs text-emerald-100 max-w-xl">
            Under data protection regulations (GDPR / DPDP Act), you have the right to view, audit, and download a complete copy of all your personal data stored within the Mana Community platform.
          </p>
        </div>
        <button
          onClick={handleDownloadJson}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          Download JSON Export
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium">Profile KYC</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{user.kycStatus || "Verified"}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium">Family Members</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{familyMembers.length} records</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Visitor Passes</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{visitorPasses.length} records</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium">Market Orders</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{marketplaceOrders.length} records</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile & Identity Data</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Full Name</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.fullName}</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Email Address</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Phone Number</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.phone || "-"}</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Flat / Unit</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {user.flatNo ? `${user.block ? `${user.block}-` : ""}${user.flatNo}` : "-"}
            </p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Assigned Role</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.role}</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Resident Type</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.residentType || user.occupancyStatus || "-"}</p>
          </div>
        </div>
      </div>

      {/* Family Members Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Users className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Linked Family Members</h3>
        </div>
        {familyMembers.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No family members registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Relation</th>
                  <th className="py-2">Age / Gender</th>
                  <th className="py-2">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {familyMembers.map((m) => (
                  <tr key={m.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2.5 font-semibold">{m.name}</td>
                    <td className="py-2.5">{m.relation}</td>
                    <td className="py-2.5">{m.age ? `${m.age} yrs` : "-"} / {m.gender || "-"}</td>
                    <td className="py-2.5">{m.phone || m.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Passes Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Visitor Pass Logs (Past 90 Days)</h3>
        </div>
        {visitorPasses.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No visitor passes recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2">Pass Code</th>
                  <th className="py-2">Visitor</th>
                  <th className="py-2">Purpose</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitorPasses.map((p) => (
                  <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{p.passCode}</td>
                    <td className="py-2.5">{p.visitorName}</td>
                    <td className="py-2.5">{p.purpose || "-"}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Marketplace Orders Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShoppingBag className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Marketplace Transactions</h3>
        </div>
        {marketplaceOrders.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No marketplace orders recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2">Order #</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marketplaceOrders.map((o) => (
                  <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2.5 font-mono font-semibold">{o.orderNumber || `#${o.id}`}</td>
                    <td className="py-2.5 capitalize">{o.role}</td>
                    <td className="py-2.5 font-semibold">₹{o.totalAmount || 0}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
