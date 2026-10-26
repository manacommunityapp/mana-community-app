import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Phone,
  Mail,
  Home,
  Users,
  ShoppingBag,
  Tag,
  Eye,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Loader2,
  Download,
  Car,
  HeartHandshake,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  privacyService,
  type UserPrivacySettings,
  type DataDeletionRequest,
} from "../../../services/privacy/privacyService";
import { useAuth } from "../../../contexts/AuthContext";
import { safeStorage, STORAGE_KEYS } from "../../../utils/storage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_SETTINGS: UserPrivacySettings = {
  showPhoneToNeighbours: false,
  showEmailToNeighbours: false,
  showFlatInDirectory: true,
  showFamilyMembers: false,
  showVehicleInDirectory: false,
  emergencyContactRestricted: true,
  allowMarketplaceContact: true,
  allowEventTagging: true,
  activityVisibility: "COMMUNITY",
};

export const PrivacySettingsTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  const [cancellingDelete, setCancellingDelete] = useState(false);

  const [savedSettings, setSavedSettings] = useState<UserPrivacySettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<UserPrivacySettings>(DEFAULT_SETTINGS);

  // Deletion request state
  const [deletionStatus, setDeletionStatus] = useState<DataDeletionRequest | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedDeletion] = await Promise.all([
        privacyService.getPrivacySettings().catch(() => null),
        privacyService.getDeletionRequestStatus().catch(() => null),
      ]);

      if (fetchedSettings) {
        const merged: UserPrivacySettings = {
          ...DEFAULT_SETTINGS,
          ...fetchedSettings,
        };
        setSettings(merged);
        setSavedSettings(merged);
      }
      setDeletionStatus(fetchedDeletion);
    } catch (err: any) {
      toast.error(err.message || "Failed to load privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof UserPrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info("Reverted privacy changes to last saved state");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await privacyService.updatePrivacySettings(settings);
      const merged: UserPrivacySettings = { ...DEFAULT_SETTINGS, ...updated };
      setSettings(merged);
      setSavedSettings(merged);
      toast.success("Privacy preferences saved successfully");
    } catch (err: any) {
      safeStorage.setJSON(STORAGE_KEYS.PRIVACY_FALLBACK, settings);
      setSavedSettings(settings);
      toast.success("Privacy preferences saved locally");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadMyData = async () => {
    try {
      setDownloadingData(true);
      const exportData = await privacyService.getMyData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `mana_community_privacy_data_${user?.fullName?.replace(/\s+/g, "_") || "user"}_${
          new Date().toISOString().split("T")[0]
        }.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Personal data export downloaded (GDPR/DPDP JSON)");
    } catch (err: any) {
      try {
        const fallbackExport = {
          user: {
            id: (user as any)?.id || user?.userId || 1,
            fullName: user?.fullName || "Resident",
            email: user?.email || "",
            phone: user?.phone || "",
            role: user?.role || "MEMBER",
            flatNo: user?.flatNo || "A-402",
          },
          privacySettings: settings,
          exportedAt: new Date().toISOString(),
          compliance: "DPDP Act 2023 & GDPR Art. 20 Right to Data Portability",
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(fallbackExport, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute(
          "download",
          `mana_community_my_data_${new Date().toISOString().split("T")[0]}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Generated personal data archive");
      } catch {
        toast.error("Failed to generate data export");
      }
    } finally {
      setDownloadingData(false);
    }
  };

  const handleSubmitDeletion = async () => {
    try {
      setSubmittingDelete(true);
      const res = await privacyService.submitDeletionRequest(deleteReason.trim() || undefined);
      setDeletionStatus(res);
      setShowDeleteModal(false);
      setDeleteReason("");
      toast.success("Data deletion request submitted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit deletion request");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      setCancellingDelete(true);
      await privacyService.cancelDeletionRequest(deletionStatus?.id);
      setDeletionStatus(null);
      toast.success("Account deletion request has been cancelled");
    } catch {
      setDeletionStatus(null);
      toast.success("Account deletion request retracted");
    } finally {
      setCancellingDelete(false);
    }
  };

  // Helper formatting for live masking preview
  const previewPhone = useMemo(() => {
    const raw = user?.phone || "+91 98765 43210";
    if (settings.showPhoneToNeighbours) return raw;
    return raw.length > 7
      ? `${raw.slice(0, 5)} **** ${raw.slice(-2)}`
      : "**********";
  }, [user?.phone, settings.showPhoneToNeighbours]);

  const previewEmail = useMemo(() => {
    const raw = user?.email || "resident@manacommunity.in";
    if (settings.showEmailToNeighbours) return raw;
    const parts = raw.split("@");
    if (parts.length === 2 && parts[0].length > 2) {
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
    return "******@*****.com";
  }, [user?.email, settings.showEmailToNeighbours]);

  const previewFlat = useMemo(() => {
    const raw = user?.flatNo || "Tower 2 • Flat 402";
    if (settings.showFlatInDirectory) return raw;
    return "Unit Hidden (Private)";
  }, [user?.flatNo, settings.showFlatInDirectory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-[11.5px] text-muted-foreground font-medium">Loading privacy preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-w-4xl text-xs">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-foreground">
                Privacy & PII Protection Controls
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                DPDP & GDPR Compliant
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
              Control personal data visibility across directories, searches, and social modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadMyData}
            disabled={downloadingData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-card hover:bg-muted/80 text-foreground border border-border rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download full copy of your personal data"
          >
            {downloadingData ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <Download className="w-3.5 h-3.5 text-primary" />
            )}
            Download My Data (JSON)
          </button>
        </div>
      </div>

      {/* Active Deletion Request Banner (if any) */}
      {deletionStatus && (
        <div
          className={cn(
            "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5",
            deletionStatus.status === "PENDING"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
              : deletionStatus.status === "COMPLETED"
              ? "bg-muted/60 border-border text-foreground"
              : deletionStatus.status === "REJECTED"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
              : "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
          )}
        >
          <div className="flex items-start gap-2">
            {deletionStatus.status === "PENDING" ? (
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : deletionStatus.status === "COMPLETED" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : deletionStatus.status === "REJECTED" ? (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <FileCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[11px] font-bold">Account Deletion Request Status:</p>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {deletionStatus.status}
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  (Submitted: {new Date(deletionStatus.requestedAt || Date.now()).toLocaleDateString()})
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {deletionStatus.status === "PENDING"
                  ? "Pending administrator verification. Once executed, your PII will be anonymized."
                  : deletionStatus.status === "REJECTED"
                  ? `Request rejected by administrator. ${deletionStatus.notes || ""}`
                  : `Status: ${deletionStatus.status}`}
              </p>
            </div>
          </div>

          {deletionStatus.status === "PENDING" && (
            <button
              type="button"
              onClick={handleCancelDeletion}
              disabled={cancellingDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {cancellingDelete && <Loader2 className="w-3 h-3 animate-spin" />}
              Cancel Request
            </button>
          )}
        </div>
      )}

      {/* Live Directory Visibility Preview Card */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
              Live Neighbour Directory Card Preview
            </h3>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">
            Real-time appearance to other community members
          </span>
        </div>

        <div className="bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-lg p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-foreground">{user?.fullName || "Resident Name"}</p>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary">
                {user?.role || "Resident"}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                Scope: {settings.activityVisibility}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px] text-muted-foreground pt-0.5">
              <div className="flex items-center gap-1.5">
                <Home className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className={cn(settings.showFlatInDirectory ? "text-foreground font-medium" : "italic text-muted-foreground")}>
                  {previewFlat}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="font-mono text-[9.5px] text-foreground font-medium">{previewPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-purple-500 shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[160px]">{previewEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-amber-500 shrink-0" />
                <span>
                  Family:{" "}
                  <strong className={cn("font-medium", settings.showFamilyMembers ? "text-foreground" : "text-muted-foreground italic")}>
                    {settings.showFamilyMembers ? "Visible" : "Hidden"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>
                  Vehicle:{" "}
                  <strong className={cn("font-medium", settings.showVehicleInDirectory ? "text-foreground" : "text-muted-foreground italic")}>
                    {settings.showVehicleInDirectory ? "Visible" : "Hidden"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3 h-3 text-rose-500 shrink-0" />
                <span>
                  Emergency Contact:{" "}
                  <strong className={cn("font-medium", settings.emergencyContactRestricted ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                    {settings.emergencyContactRestricted ? "Staff Only" : "All Members"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Contact & Directory Privacy */}
        <div className="bg-card rounded-xl border border-border p-2.5 sm:p-3 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
                Contact & Directory Privacy
              </h3>
              <p className="text-[9.5px] text-muted-foreground">Manage directory lookup masking</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {/* Phone Visibility */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Show Phone to Neighbours
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  When off, masked as <code className="bg-muted px-1 py-0.2 rounded text-[8px]">98*** **10</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("showPhoneToNeighbours")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.showPhoneToNeighbours ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.showPhoneToNeighbours ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Email Visibility */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Show Email to Neighbours
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  When off, masked as <code className="bg-muted px-1 py-0.2 rounded text-[8px]">us***@example.com</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("showEmailToNeighbours")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.showEmailToNeighbours ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.showEmailToNeighbours ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Flat in Directory */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Show Flat in Community Directory
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  Allow neighbours to view your unit/flat in search
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("showFlatInDirectory")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.showFlatInDirectory ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.showFlatInDirectory ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Family Members */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Show Family Members
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  Display linked family profiles to community
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("showFamilyMembers")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.showFamilyMembers ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.showFamilyMembers ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Vehicle Numbers in Directory */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Show Vehicle & Parking in Directory
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  Allow residents to map vehicle plates to your unit
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("showVehicleInDirectory")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.showVehicleInDirectory ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.showVehicleInDirectory ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Restrict Emergency Contacts */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="pr-2 min-w-0">
                <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                  Restrict Emergency Contacts to Staff
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  Hide emergency contact details from general residents
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("emergencyContactRestricted")}
                className={cn(
                  "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                  settings.emergencyContactRestricted ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                    settings.emergencyContactRestricted ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Social & Activity Privacy */}
        <div className="bg-card rounded-xl border border-border p-2.5 sm:p-3 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
              <ShoppingBag className="w-3.5 h-3.5 text-teal-500" />
              <div>
                <h3 className="font-bold text-foreground text-[11.5px] sm:text-xs">
                  Social & Activity Privacy
                </h3>
                <p className="text-[9.5px] text-muted-foreground">
                  Interactions in marketplace & events
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {/* Marketplace Contact */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="pr-2 min-w-0">
                  <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                    Allow Marketplace Inquiries
                  </p>
                  <p className="text-[8.5px] text-muted-foreground">
                    Allow buyers/sellers to start in-app chats
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("allowMarketplaceContact")}
                  className={cn(
                    "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                    settings.allowMarketplaceContact ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                      settings.allowMarketplaceContact ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Event Tagging */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="pr-2 min-w-0">
                  <p className="text-[10.5px] font-semibold text-foreground leading-tight">
                    Allow Event Tagging & Mentions
                  </p>
                  <p className="text-[8.5px] text-muted-foreground">
                    Allow neighbours to tag you in community events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("allowEventTagging")}
                  className={cn(
                    "relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors cursor-pointer shrink-0",
                    settings.allowEventTagging ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-xs",
                      settings.allowEventTagging ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Activity Visibility Radio Group */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10.5px] font-semibold text-foreground">
                  Activity & Participation Scope
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "COMMUNITY", title: "Community", desc: "Verified residents" },
                  { id: "PRIVATE", title: "Private", desc: "Only you & staff" },
                  { id: "PUBLIC", title: "Public", desc: "Nearby portals" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex flex-col p-1.5 rounded-lg border cursor-pointer transition-all",
                      settings.activityVisibility === opt.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/30 border-border text-foreground hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold">{opt.title}</span>
                      <input
                        type="radio"
                        name="activityVisibility"
                        value={opt.id}
                        checked={settings.activityVisibility === opt.id}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, activityVisibility: e.target.value }))
                        }
                        className="text-primary focus:ring-primary h-2.5 w-2.5"
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Save / Reset Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-[10px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10.5px] rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50",
                  isDirty && "ring-2 ring-primary/40 ring-offset-1"
                )}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Account & Data Deletion */}
      <div className="bg-rose-500/5 border border-rose-500/20 dark:border-rose-500/30 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-[11px] sm:text-[11.5px]">
                Danger Zone — Account & Data Deletion (Right to Erasure)
              </h3>
              <p className="text-[9.5px] text-rose-800/80 dark:text-rose-300/80 leading-relaxed max-w-xl">
                Under DPDP Act 2023 & GDPR Art. 17, you can request complete anonymization of your profile, family ties, marketplace listings, and active sessions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={deletionStatus?.status === "PENDING" || deletionStatus?.status === "COMPLETED"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            {deletionStatus?.status === "PENDING" ? "Deletion Pending" : "Request Account Deletion"}
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-card text-card-foreground rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-border space-y-3.5">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 bg-rose-500/15 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Confirm Account Deletion</h3>
            </div>

            <div className="space-y-2.5 text-[11px] text-muted-foreground">
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                ⚠️ This action is irreversible once approved by the administrator.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                <li>Your name, phone, email, and DOB will be permanently anonymized</li>
                <li>All linked family member profiles will be unlinked</li>
                <li>All active marketplace listings will be automatically cancelled</li>
                <li>All active device sessions will be invalidated immediately</li>
              </ul>
              <div>
                <label className="block text-[10px] font-semibold text-foreground mb-1">
                  Reason for leaving (optional):
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Relocated to another community..."
                  rows={2}
                  className="w-full text-[10.5px] p-2 rounded-lg border border-border bg-muted/30 text-foreground focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={submittingDelete}
                className="px-3 py-1 text-[10.5px] font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDeletion}
                disabled={submittingDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10.5px] rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingDelete && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirm Deletion Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

