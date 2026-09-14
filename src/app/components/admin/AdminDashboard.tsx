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
import { userService } from "../../../services/common/userService";

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
  const { user, isAnyAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAnyAdmin) {
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
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
              KYC Verification &amp; Applicant Review
            </h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Review, verify and approve community member identity applications</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-card p-2.5 sm:p-3 rounded-xl border border-border/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-bold text-muted-foreground">Total Apps</span>
            <div className="p-1 rounded-md bg-input shrink-0">
              <UserCheck className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-foreground">{stats.total}</div>
        </div>

        <div className="bg-card p-2.5 sm:p-3 rounded-xl border border-warning/30 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-bold text-warning">Pending</span>
            <div className="p-1 rounded-md bg-warning/10 shrink-0">
              <Clock className="w-3 h-3 text-warning" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-warning">{stats.pending}</div>
        </div>

        <div className="bg-card p-2.5 sm:p-3 rounded-xl border border-success/30 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-bold text-success">Approved</span>
            <div className="p-1 rounded-md bg-success/10 shrink-0">
              <CheckCircle className="w-3 h-3 text-success" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-success">{stats.approved}</div>
        </div>

        <div className="bg-card p-2.5 sm:p-3 rounded-xl border border-danger/30 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-bold text-danger">Rejected</span>
            <div className="p-1 rounded-md bg-danger/10 shrink-0">
              <XCircle className="w-3 h-3 text-danger" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-danger">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by applicant name or email..."
            className="w-full pl-8 pr-3 py-1.5 bg-input border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-2xs"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar flex-nowrap w-full sm:w-auto">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0 hidden sm:inline mr-1" />
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                filterStatus === status
                  ? "bg-primary text-white border-transparent shadow-2xs"
                  : "bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-input/60"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-card rounded-xl shadow-2xs border border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-input/40 border-b border-border/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">Applicant</th>
                <th className="px-3.5 py-2.5">Community</th>
                <th className="px-3.5 py-2.5">Type</th>
                <th className="px-3.5 py-2.5">Submitted</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5 text-primary" />
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs font-medium">
                    No applications found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-input/30 transition-colors">
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-2xs">
                          {app.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-2.5">
                          <div className="text-xs font-semibold text-foreground leading-tight">{app.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <div className="text-xs font-semibold text-foreground">{app.communityCode}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{app.communityType}</div>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[9.5px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-md capitalize">
                        {app.userType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap text-[11px] text-muted-foreground font-medium">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      {app.status === "pending" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-warning/10 text-warning border border-warning/25 rounded-md">
                          Pending
                        </span>
                      )}
                      {app.status === "approved" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-success/10 text-success border border-success/25 rounded-md">
                          Approved
                        </span>
                      )}
                      {app.status === "rejected" && (
                        <span className="px-2 py-0.5 text-[9.5px] font-bold bg-danger/10 text-danger border border-danger/25 rounded-md">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap text-right text-xs font-semibold">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 ml-auto cursor-pointer px-2 py-1 hover:bg-primary/10 rounded-md transition-colors text-[11px] font-bold"
                      >
                        <Eye className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs" onClick={() => setSelectedApp(null)}>
          <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border/80 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Application Review
              </h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-input rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Applicant Info */}
              <div className="bg-input/40 rounded-xl p-3 border border-border/60">
                <h3 className="font-bold text-xs text-foreground mb-2.5">Applicant Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Full Name:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Email:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Phone:</span>
                    <p className="font-semibold text-foreground font-mono truncate">{selectedApp.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Unit / Address:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.address}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Community:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.communityCode}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Account Type:</span>
                    <p className="font-semibold text-foreground capitalize">{selectedApp.userType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ID Type:</span>
                    <p className="font-semibold text-foreground truncate">{selectedApp.idType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ID Number:</span>
                    <p className="font-semibold text-foreground font-mono truncate">{selectedApp.idNumber}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-bold text-xs text-foreground mb-2">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                    <img
                      src={selectedApp.documents.idFront}
                      alt="ID Front"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-1.5 bg-input/40 text-center text-[10.5px] font-semibold text-muted-foreground">
                      ID Front Side
                    </div>
                  </div>
                  <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                    <img
                      src={selectedApp.documents.idBack}
                      alt="ID Back"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-1.5 bg-input/40 text-center text-[10.5px] font-semibold text-muted-foreground">
                      ID Back Side
                    </div>
                  </div>
                  <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                    <img
                      src={selectedApp.documents.selfie}
                      alt="Selfie"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-1.5 bg-input/40 text-center text-[10.5px] font-semibold text-muted-foreground">
                      Selfie Verification
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              {selectedApp.status === "pending" && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div className="text-[11px] text-foreground">
                    <p className="font-bold text-warning mb-0.5">Verification Checklist:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Verify ID documents are clear and valid</li>
                      <li>Confirm selfie matches ID photo</li>
                      <li>Check community code is valid for this user</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    className="flex-1 py-1.5 px-3 bg-danger/10 hover:bg-danger/15 text-danger font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-danger/20"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-1.5 px-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Approve Application
                  </button>
                </div>
              )}

              {selectedApp.status !== "pending" && (
                <div className="text-center py-2 border-t border-border/60">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                    selectedApp.status === "approved"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-danger/10 text-danger border border-danger/20"
                  }`}>
                    {selectedApp.status === "approved" ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Application Approved
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
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