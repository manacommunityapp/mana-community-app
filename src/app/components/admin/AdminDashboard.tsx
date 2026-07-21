import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Download,
  AlertTriangle,
  UserPlus,
  FileSpreadsheet,
  Building2,
  Trophy,
  Loader2,
} from "lucide-react";
import { showSuccess, showError } from "../../../utils/ToastUtils";
const toast = {
  success: (msg: string) => showSuccess(msg),
  error: (msg: string) => showError(msg),
};
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../services/userService";

type VerificationStatus = "pending" | "approved" | "rejected";

type UserApplication = {
  id: string;
  fullName: string;
  email: string;
  communityType: string;
  communityCode: string;
  userType: "member" | "vendor";
  idType: string;
  idNumber: string;
  phoneNumber: string;
  address: string;
  submittedAt: string;
  status: VerificationStatus;
  documents: {
    idFront: string;
    idBack: string;
    selfie: string;
  };
};

const mockApplications: UserApplication[] = [
  {
    id: "1",
    fullName: "Priya Sharma",
    email: "priya.sharma@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-A-2024",
    userType: "member",
    idType: "Aadhar Card",
    idNumber: "XXXX-XXXX-1234",
    phoneNumber: "+91 98765 43210",
    address: "Tower A, Apt 402, Bangalore",
    submittedAt: "2026-04-22T10:30:00",
    status: "pending",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    },
  },
  {
    id: "2",
    fullName: "Rahul Verma",
    email: "rahul.verma@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-B-2024",
    userType: "vendor",
    idType: "Driver's License",
    idNumber: "DL-XX-2024-XXXX",
    phoneNumber: "+91 98765 12345",
    address: "Tower B, Apt 1205, Bangalore",
    submittedAt: "2026-04-21T14:20:00",
    status: "pending",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
  },
  {
    id: "3",
    fullName: "Anita Desai",
    email: "anita.desai@email.com",
    communityType: "apartment",
    communityCode: "APT-TOWER-A-2024",
    userType: "member",
    idType: "Passport",
    idNumber: "P-XXXX-5678",
    phoneNumber: "+91 98765 98765",
    address: "Tower A, Apt 801, Bangalore",
    submittedAt: "2026-04-20T09:15:00",
    status: "approved",
    documents: {
      idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
      selfie: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
  },
];

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
      </div>
    );
  }

  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | "all">("pending");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      
      let backendStatus: "PENDING" | "VERIFIED" | "REJECTED" | undefined = undefined;
      if (filterStatus === "pending") backendStatus = "PENDING";
      else if (filterStatus === "approved") backendStatus = "VERIFIED";
      else if (filterStatus === "rejected") backendStatus = "REJECTED";

      const users = await userService.getAllUsers(backendStatus);
      const mapped: UserApplication[] = users.map((u) => {
        let status: VerificationStatus = "pending";
        if (u.kycStatus === "VERIFIED") status = "approved";
        else if (u.kycStatus === "REJECTED") status = "rejected";

        return {
          id: String(u.id),
          fullName: u.fullName,
          email: u.email,
          communityType: u.communityId ? "Apartment" : "None",
          communityCode: u.communityId ? `COMM-${u.communityId}` : "—",
          userType: u.role === "VENDOR" ? "vendor" : "member",
          idType: "Aadhar Card",
          idNumber: u.phone ? `XXXX-XXXX-${u.phone.slice(-4)}` : "XXXX-XXXX-1234",
          phoneNumber: u.phone || "—",
          address: u.flatNo && u.block ? `${u.block}, Apt ${u.flatNo}` : "—",
          submittedAt: "2026-07-09T10:00:00",
          status,
          documents: {
            idFront: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
            idBack: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400",
            selfie: u.profilePicUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
          },
        };
      });
      setApplications(mapped);

      // Fetch stats count from the dedicated service
      const statsData = await userService.getKycStats();
      setStats(statsData);
    } catch (err: any) {
      toast.error("Failed to load applications from database");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications;

  const handleApprove = async (id: string) => {
    try {
      await userService.updateUserKycStatus(Number(id), "VERIFIED");
      toast.success("Application approved successfully");
      fetchApplications();
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve application");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await userService.updateUserKycStatus(Number(id), "REJECTED");
      toast.error("Application rejected");
      fetchApplications();
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject application");
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Admin Dashboard - KYC Verification
          </h2>
          <p className="text-slate-500 text-sm mt-1">Review and approve user applications</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Total Apps</span>
            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-yellow-250/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-yellow-700">Pending</span>
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg shrink-0">
              <Clock className="w-4 h-4 sm:w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-yellow-750 mt-1">{stats.pending}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-green-250/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-green-700">Approved</span>
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-green-700 mt-1">{stats.approved}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-red-250/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-red-700">Rejected</span>
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-red-700 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-350/60 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-nowrap w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                filterStatus === status
                  ? "bg-indigo-600 text-white border-transparent shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">Applicant</th>
                <th className="px-4 sm:px-6 py-3.5">Community</th>
                <th className="px-4 sm:px-6 py-3.5">Type</th>
                <th className="px-4 sm:px-6 py-3.5">Submitted</th>
                <th className="px-4 sm:px-6 py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading applications from database...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No applications found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 shadow-inner">
                          {app.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-xs sm:text-sm font-semibold text-slate-800">{app.fullName}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-slate-800">{app.communityCode}</div>
                      <div className="text-[10px] text-slate-450 capitalize mt-0.5">{app.communityType}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 rounded-full capitalize">
                        {app.userType}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      {app.status === "pending" && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                          Pending
                        </span>
                      )}
                      {app.status === "approved" && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">
                          Approved
                        </span>
                      )}
                      {app.status === "rejected" && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs font-semibold">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1.5 ml-auto cursor-pointer p-1.5 hover:bg-indigo-50/50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Application Review</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div className="bg-slate-50 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Applicant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Full Name:</span>
                    <p className="font-medium text-slate-900">{selectedApp.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-900">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <p className="font-medium text-slate-900">{selectedApp.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <p className="font-medium text-slate-900">{selectedApp.address}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Community:</span>
                    <p className="font-medium text-slate-900">{selectedApp.communityCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Type:</span>
                    <p className="font-medium text-slate-900 capitalize">{selectedApp.userType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ID Type:</span>
                    <p className="font-medium text-slate-900">{selectedApp.idType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ID Number:</span>
                    <p className="font-medium text-slate-900">{selectedApp.idNumber}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Verification Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.idFront}
                      alt="ID Front"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      ID Front Side
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.idBack}
                      alt="ID Back"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      ID Back Side
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <img
                      src={selectedApp.documents.selfie}
                      alt="Selfie"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-slate-50 text-center text-sm font-medium text-slate-700">
                      Selfie Verification
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              {selectedApp.status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Verification Checklist:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Verify ID documents are clear and valid</li>
                      <li>Confirm selfie matches ID photo</li>
                      <li>Check community code is valid for this user</li>
                      <li>Ensure all information is accurate</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserX className="w-5 h-5" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserCheck className="w-5 h-5" />
                    Approve Application
                  </button>
                </div>
              )}

              {selectedApp.status !== "pending" && (
                <div className="text-center py-4">
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                    selectedApp.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {selectedApp.status === "approved" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Application Approved
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Application Rejected
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}