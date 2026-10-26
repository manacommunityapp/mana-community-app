import { useState, useRef, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Trash2,
  Play,
  RefreshCw,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  ShieldCheck,
  Building2,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { userService } from "../../../services/common/userService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedUser {
  row: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  communityCode: string;
  flatUnit: string;
  idType: string;
  idNumber: string;
  errors: string[];
  warnings: string[];
  remarks: string;
  status: "valid" | "error" | "warning";
  uploadStatus: "idle" | "uploading" | "success" | "failed";
  uploadMessage?: string;
  createdUserId?: number;
}

export const VALID_ROLES = ["member", "resident", "vendor", "admin", "security", "staff", "committee", "user"];

export const TEMPLATE_DATA = [
  ["First Name", "Last Name", "Email", "Phone", "Role", "Community Code", "Flat/Unit", "ID Type", "ID Number"],
  ["Priya", "Sharma", "priya.sharma@example.com", "+91 98765 43210", "member", "APT-TOWER-A-2024", "Apt 402", "Aadhaar Card", "XXXX-XXXX-1234"],
  ["Rahul", "Verma", "rahul.verma@example.com", "+91 98765 12345", "vendor", "APT-TOWER-B-2024", "Apt 1205", "PAN Card", "ABCDE1234F"],
  ["Anita", "Desai", "anita.desai@example.com", "+91 98765 98765", "admin", "APT-TOWER-A-2024", "Tower 1 - 301", "Passport", "P-XXXX-5678"],
  ["Vikram", "Singh", "vikram.singh@example.com", "+91 98765 88888", "resident", "APT-TOWER-A-2024", "Flat 102", "Voter ID", "VOT1234567"],
];

export const SAMPLE_PARSED_RAW = [
  { "First Name": "Priya", "Last Name": "Sharma", "Email": "priya.sharma@example.com", "Phone": "+91 98765 43210", "Role": "member", "Community Code": "APT-TOWER-A-2024", "Flat/Unit": "Apt 402", "ID Type": "Aadhaar Card", "ID Number": "XXXX-XXXX-1234" },
  { "First Name": "Rahul", "Last Name": "Verma", "Email": "rahul.verma@example.com", "Phone": "+91 98765 12345", "Role": "vendor", "Community Code": "APT-TOWER-B-2024", "Flat/Unit": "Apt 1205", "ID Type": "PAN Card", "ID Number": "ABCDE1234F" },
  { "First Name": "Anita", "Last Name": "Desai", "Email": "anita.desai@example.com", "Phone": "+91 98765 98765", "Role": "admin", "Community Code": "APT-TOWER-A-2024", "Flat/Unit": "", "ID Type": "Passport", "ID Number": "P-XXXX-5678" },
  { "First Name": "Sanjay", "Last Name": "", "Email": "sanjay@example.com", "Phone": "+91 98765 11111", "Role": "member", "Community Code": "APT-TOWER-A-2024", "Flat/Unit": "", "ID Type": "", "ID Number": "" },
  { "First Name": "Deepa", "Last Name": "Nair", "Email": "deepa.nair", "Phone": "+91 98765 22222", "Role": "superadmin", "Community Code": "APT-TOWER-A-2024", "Flat/Unit": "", "ID Type": "", "ID Number": "" },
];

/**
 * Validates a single parsed row and checks across previously seen entries in the same CSV
 */
export function validateUser(
  row: number,
  data: Record<string, string>,
  seenEmails: Map<string, number>,
  seenPhones: Map<string, number>
): ParsedUser {
  const errors: string[] = [];
  const warnings: string[] = [];

  const firstName = (data["firstName"] || data["First Name"] || data["first_name"] || "").trim();
  const lastName = (data["lastName"] || data["Last Name"] || data["last_name"] || "").trim();
  const email = (data["email"] || data["Email"] || "").trim();
  const phone = (data["phone"] || data["Phone"] || data["mobile"] || data["Mobile"] || "").trim();
  const rawRole = (data["role"] || data["Role"] || "").trim();
  const role = rawRole.toLowerCase();
  const communityCode = (data["communityCode"] || data["Community Code"] || data["community_code"] || data["inviteCode"] || data["Invite Code"] || "").trim();
  const flatUnit = (data["flatUnit"] || data["Flat/Unit"] || data["flat_unit"] || data["Flat"] || data["Unit"] || "").trim();
  const idType = (data["idType"] || data["ID Type"] || data["id_type"] || "").trim();
  const idNumber = (data["idNumber"] || data["ID Number"] || data["id_number"] || "").trim();

  // 1. Mandatory Field Checks
  if (!firstName) {
    errors.push("First name is required");
  }
  if (!lastName) {
    errors.push("Last name is required");
  }

  // 2. Email Validation
  if (!email) {
    errors.push("Email address is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format (e.g. name@domain.com)");
  } else {
    const lowerEmail = email.toLowerCase();
    if (seenEmails.has(lowerEmail)) {
      errors.push(`Duplicate email in CSV (same as row #${seenEmails.get(lowerEmail)})`);
    } else {
      seenEmails.set(lowerEmail, row);
    }
  }

  // 3. Phone Validation
  if (!phone) {
    errors.push("Phone number is required");
  } else {
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      errors.push("Phone must be between 8 and 15 digits");
    } else if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      errors.push("Phone contains invalid characters (digits and optional + prefix only)");
    } else {
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      const phoneKey = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      if (seenPhones.has(phoneKey)) {
        errors.push(`Duplicate phone in CSV (same as row #${seenPhones.get(phoneKey)})`);
      } else {
        seenPhones.set(phoneKey, row);
      }
    }
  }

  // 4. Role Validation
  if (!role) {
    errors.push("Role is required (e.g. member, resident, vendor, admin)");
  } else if (!VALID_ROLES.includes(role)) {
    errors.push(`Invalid role '${rawRole}' – supported: member, resident, vendor, admin, staff, security`);
  }

  // 5. Community Code Validation
  if (!communityCode) {
    errors.push("Community Code is required for community linking");
  }

  // 6. Optional Field Warnings & Format Tips
  if (idType && !idNumber) {
    warnings.push("ID Type is provided but ID Number is blank");
  } else if (!idType && idNumber) {
    warnings.push("ID Number is provided without ID Type");
  }

  // 7. Generate Descriptive Remark for this row
  let remarks = "";
  let status: "valid" | "error" | "warning" = "valid";

  if (errors.length > 0) {
    status = "error";
    remarks = `Needs attention: ${errors.join("; ")}`;
  } else if (warnings.length > 0) {
    status = "warning";
    remarks = `Ready with notice: ${warnings.join("; ")} (Default password 'Pass1234' will be set)`;
  } else {
    status = "valid";
    remarks = `Ready for insert – Account will be created in ${communityCode} with role ${role.toUpperCase()} and default password 'Pass1234'.`;
  }

  return {
    row,
    firstName,
    lastName,
    email,
    phone,
    role,
    communityCode,
    flatUnit,
    idType,
    idNumber,
    errors,
    warnings,
    remarks,
    status,
    uploadStatus: "idle",
  };
}

export function AdminBulkUpload() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedUser[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"table" | "card">("table");

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-500 font-medium">Access Denied. Administrative privileges required.</p>
        <button onClick={() => navigate("/")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Go to Feed</button>
      </div>
    );
  }

  const stats = parsedData ? {
    total: parsedData.length,
    valid: parsedData.filter(r => r.status === "valid").length,
    errors: parsedData.filter(r => r.status === "error").length,
    warnings: parsedData.filter(r => r.status === "warning").length,
    uploaded: parsedData.filter(r => r.uploadStatus === "success").length,
    failed: parsedData.filter(r => r.uploadStatus === "failed").length,
  } : null;

  const downloadTemplate = () => {
    const csvContent = Papa.unparse(TEMPLATE_DATA);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "mana_community_bulk_user_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded with guidelines!");
  };

  const parseAndSetRows = (rawData: Record<string, string>[], sourceName: string) => {
    const seenEmails = new Map<string, number>();
    const seenPhones = new Map<string, number>();
    const parsed = rawData.map((row, idx) => validateUser(idx + 2, row, seenEmails, seenPhones));
    setParsedData(parsed);
    toast.success(`Parsed ${parsed.length} records from ${sourceName}`);
  };

  const processFile = useCallback((file: File) => {
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.match(/\.csv$/i)) {
      toast.error("Please upload a valid CSV file (.csv)");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        try {
          parseAndSetRows(results.data, file.name);
        } catch {
          toast.error("Failed to process file. Ensure it follows the template format.");
          parseAndSetRows(SAMPLE_PARSED_RAW, "Sample Template Data");
        } finally {
          setIsProcessing(false);
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
        parseAndSetRows(SAMPLE_PARSED_RAW, "Sample Template Data");
        setIsProcessing(false);
      }
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /**
   * Real Sequential Bulk Save calling the backend /api/users endpoint
   */
  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) return;

    const candidates = parsedData.filter(r => (r.status === "valid" || r.status === "warning") && r.uploadStatus !== "success");
    if (candidates.length === 0) {
      toast.info("No pending valid records to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: candidates.length });

    let successCount = 0;
    let failCount = 0;

    const updatedData = [...parsedData];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const targetIndex = updatedData.findIndex(u => u.row === candidate.row);
      if (targetIndex === -1) continue;

      // Mark row as uploading
      updatedData[targetIndex] = {
        ...updatedData[targetIndex],
        uploadStatus: "uploading",
        remarks: "Submitting to database...",
      };
      setParsedData([...updatedData]);
      setUploadProgress({ current: i + 1, total: candidates.length });

      try {
        const payload = {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          role: candidate.role,
          inviteCode: candidate.communityCode,
          flatNo: candidate.flatUnit || undefined,
          govtIdType: candidate.idType || undefined,
          govtIdNumber: candidate.idNumber || undefined,
          isActive: true,
        };

        const res = await userService.createUser(payload);

        successCount++;
        updatedData[targetIndex] = {
          ...updatedData[targetIndex],
          uploadStatus: "success",
          createdUserId: res.id,
          uploadMessage: `User #${res.id} created successfully`,
          remarks: `✅ Successfully saved in database (User ID #${res.id}). Account is active & pre-verified.`,
        };
      } catch (err: unknown) {
        failCount++;
        const errorMessage = (err as { message?: string })?.message || "Failed to save user in database.";
        updatedData[targetIndex] = {
          ...updatedData[targetIndex],
          uploadStatus: "failed",
          uploadMessage: errorMessage,
          remarks: `❌ Insertion Error: ${errorMessage}`,
        };
      }

      setParsedData([...updatedData]);
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0 && failCount === 0) {
      toast.success(`All ${successCount} users were inserted and saved successfully!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Uploaded ${successCount} users. ${failCount} failed – check remarks in the table.`);
    } else {
      toast.error(`All ${failCount} candidate records failed insertion. Check error remarks.`);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setFileName(null);
    setShowErrorsOnly(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Downloads a CSV of only the rows that have validation errors or upload failures,
   * with an extra "Error Reason" column for easy admin correction and re-upload.
   */
  const downloadErrorRows = () => {
    if (!parsedData) return;
    const errorRows = parsedData.filter(
      r => r.status === "error" || r.uploadStatus === "failed"
    );
    if (errorRows.length === 0) {
      toast.info("No error rows to export.");
      return;
    }
    const csvRows = errorRows.map(r => ({
      "First Name": r.firstName,
      "Last Name": r.lastName,
      "Email": r.email,
      "Phone": r.phone,
      "Role": r.role,
      "Community Code": r.communityCode,
      "Flat/Unit": r.flatUnit,
      "ID Type": r.idType,
      "ID Number": r.idNumber,
      "Error Reason": r.uploadStatus === "failed"
        ? (r.uploadMessage || r.remarks)
        : r.errors.join("; "),
    }));
    const csvContent = Papa.unparse(csvRows, { header: true });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mana_bulk_upload_errors_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${errorRows.length} error row(s) as CSV for correction.`);
  };

  const displayData = parsedData
    ? showErrorsOnly
      ? parsedData.filter(r => r.status !== "valid" || r.uploadStatus === "failed")
      : parsedData
    : [];

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
              Bulk User Upload &amp; Insertion
            </h1>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">
              Validate, inspect remarks, and save multiple community users into the database
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border/80 text-foreground hover:bg-input/80 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* What needs to be taken care of for proper insertion Guide */}
      <div className="bg-card border border-border/80 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>What Needs to Be Taken Care of for Proper User Insertion</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-foreground">
          <div className="bg-input/40 border border-border/60 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1. Mandatory &amp; Unique Fields</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-muted-foreground">
              <li><strong className="text-foreground">First &amp; Last Name</strong> must be non-empty.</li>
              <li><strong className="text-foreground">Email</strong> must be a valid format &amp; unique.</li>
              <li><strong className="text-foreground">Phone</strong> must be 8–15 digits &amp; unique.</li>
            </ul>
          </div>

          <div className="bg-input/40 border border-border/60 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
              <Building2 className="w-3.5 h-3.5" />
              <span>2. Community Code &amp; Roles</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-muted-foreground">
              <li><strong className="text-foreground">Community Code</strong> must match Invite Code.</li>
              <li><strong className="text-foreground">Roles</strong>: member, resident, vendor, admin, staff.</li>
              <li>Flat/Unit, ID Type/Number are optional.</li>
            </ul>
          </div>

          <div className="bg-input/40 border border-border/60 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
              <KeyRound className="w-3.5 h-3.5" />
              <span>3. Password &amp; Verification</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-muted-foreground">
              <li>Default initial password is <code className="bg-success/10 text-success px-1 py-0.2 rounded font-mono font-bold text-[10px]">Pass1234</code>.</li>
              <li>Users can sign in or reset via OTP.</li>
              <li>Created in <strong>Active</strong> state.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload Zone */}
      {!parsedData && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/80 bg-card hover:border-primary/40 hover:bg-input/30"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Parsing and validating CSV records...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-2xs",
                isDragging ? "bg-primary/20" : "bg-input"
              )}>
                <Upload className={cn("w-5 h-5", isDragging ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-foreground font-bold text-xs sm:text-sm">
                  {isDragging ? "Drop your CSV file here" : "Drag & drop your user CSV file, or click to browse"}
                </p>
                <p className="text-muted-foreground text-[10.5px] mt-0.5">Supports UTF-8 CSV files up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsed Results & Remarks Table */}
      {parsedData && (
        <div className="space-y-3">
          {/* File Info Bar */}
          <div className="bg-card rounded-xl border border-border/80 p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground truncate">{fileName || "uploaded_file.csv"}</p>
                <p className="text-[10px] text-muted-foreground">{parsedData.length} rows loaded &amp; validated</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isUploading}
                className="flex items-center gap-1 text-xs text-danger hover:bg-danger/10 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear &amp; Upload Another
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "Total Rows", value: stats.total, color: "slate", icon: Users },
                { label: "Valid for Save", value: stats.valid, color: "green", icon: CheckCircle2 },
                { label: "Warnings", value: stats.warnings, color: "yellow", icon: AlertTriangle },
                { label: "Errors (Blocked)", value: stats.errors, color: "red", icon: XCircle },
                { label: "Saved in DB", value: stats.uploaded, color: "emerald", icon: ShieldCheck },
              ].map(s => (
                <div key={s.label} className={cn(
                  "bg-card rounded-xl border p-2.5 shadow-2xs transition-all",
                  s.color === "green" ? "border-success/30 bg-success/5" :
                  s.color === "red" ? "border-danger/30 bg-danger/5" :
                  s.color === "yellow" ? "border-warning/30 bg-warning/5" :
                  s.color === "emerald" ? "border-primary/30 bg-primary/5" : "border-border/80"
                )}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">{s.label}</span>
                    <s.icon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar while uploading */}
          {isUploading && uploadProgress && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5 shadow-2xs">
              <div className="flex justify-between text-xs font-bold text-primary">
                <span>Saving users into database...</span>
                <span>{uploadProgress.current} / {uploadProgress.total} ({Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 bg-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Display:</span>
              <div className="flex bg-input rounded-lg p-0.5 border border-border/80 shadow-2xs">
                <button
                  onClick={() => setPreviewMode("table")}
                  className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer", previewMode === "table" ? "bg-card shadow-2xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Table View
                </button>
                <button
                  onClick={() => setPreviewMode("card")}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", previewMode === "card" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                  Card View
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Download Errors CSV button — shown when there are error/failed rows */}
              {stats && (stats.errors > 0 || stats.failed > 0) && (
                <button
                  onClick={downloadErrorRows}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
                  title="Download only the invalid / failed rows as a correctable CSV"
                >
                  <Download className="w-4 h-4" />
                  Download Errors CSV
                  <span className="ml-1 text-[10px] font-extrabold bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full">
                    {stats.errors + stats.failed}
                  </span>
                </button>
              )}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={showErrorsOnly}
                  onChange={e => setShowErrorsOnly(e.target.checked)}
                  className="rounded accent-indigo-600 w-4 h-4"
                />
                <span>Filter: Show errors &amp; failed rows only</span>
              </label>
            </div>
          </div>

          {/* Table View */}
          {previewMode === "table" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Row</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User Details</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role & Community</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Validation Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-80">Remarks / Insertion Guidance</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayData.map((user) => (
                      <tr
                        key={user.row}
                        className={cn(
                          "hover:bg-slate-50/80 transition-colors text-sm",
                          user.uploadStatus === "success" ? "bg-emerald-50/40" :
                          user.uploadStatus === "failed" ? "bg-red-50/50" :
                          user.status === "error" ? "bg-red-50/20" :
                          user.status === "warning" ? "bg-yellow-50/20" : ""
                        )}
                      >
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{user.row}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                              {user.firstName?.[0] || "?"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {user.firstName || <span className="text-red-500 italic">missing</span>} {user.lastName || <span className="text-red-500 italic">missing</span>}
                              </span>
                              {user.flatUnit && (
                                <span className="text-xs text-slate-500">Unit: {user.flatUnit}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="text-xs text-slate-700">{user.email || <span className="text-red-500 italic">missing email</span>}</div>
                          <div className="text-xs text-slate-500 font-mono">{user.phone || <span className="text-red-500 italic">missing phone</span>}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            {user.role ? (
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                                user.role === "admin" ? "bg-purple-100 text-purple-700" :
                                user.role === "vendor" ? "bg-blue-100 text-blue-700" :
                                user.role === "member" || user.role === "resident" ? "bg-emerald-100 text-emerald-700" :
                                "bg-slate-100 text-slate-700"
                              )}>
                                {user.role}
                              </span>
                            ) : <span className="text-red-500 text-xs italic">missing role</span>}
                            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {user.communityCode || <span className="text-red-500 italic">missing code</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {user.uploadStatus === "uploading" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full animate-pulse">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </span>
                          )}
                          {user.uploadStatus === "success" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Uploaded #{user.createdUserId}
                            </span>
                          )}
                          {user.uploadStatus === "failed" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Save Failed
                            </span>
                          )}
                          {user.uploadStatus === "idle" && (
                            <>
                              {user.status === "valid" && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Valid
                                </span>
                              )}
                              {user.status === "error" && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" /> {user.errors.length} Error{user.errors.length > 1 ? "s" : ""}
                                </span>
                              )}
                              {user.status === "warning" && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" /> Warning
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <div className={cn(
                            "text-xs p-2 rounded-lg border",
                            user.uploadStatus === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                            user.uploadStatus === "failed" ? "bg-rose-50 border-rose-200 text-rose-900" :
                            user.status === "error" ? "bg-red-50 border-red-200 text-red-800" :
                            user.status === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                            "bg-slate-50 border-slate-200 text-slate-700"
                          )}>
                            <p className="leading-relaxed font-medium">{user.remarks}</p>
                            {user.errors.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-[11px] list-disc list-inside text-red-700">
                                {user.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setExpandedRow(expandedRow === user.row ? null : user.row)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                            title="Toggle row details"
                          >
                            {expandedRow === user.row ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card View */}
          {previewMode === "card" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayData.map(user => (
                <div key={user.row} className={cn(
                  "bg-white rounded-xl border p-4 space-y-3 shadow-sm transition-all",
                  user.uploadStatus === "success" ? "border-emerald-300 bg-emerald-50/20" :
                  user.uploadStatus === "failed" ? "border-rose-300 bg-rose-50/20" :
                  user.status === "error" ? "border-red-200" :
                  user.status === "warning" ? "border-yellow-200" : "border-slate-200"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {user.firstName?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">Row #{user.row} • {user.communityCode}</p>
                      </div>
                    </div>

                    <div>
                      {user.uploadStatus === "success" && (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> #{user.createdUserId}
                        </span>
                      )}
                      {user.uploadStatus === "failed" && (
                        <span className="text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Failed
                        </span>
                      )}
                      {user.uploadStatus === "idle" && (
                        user.status === "valid" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                        user.status === "error" ? <XCircle className="w-5 h-5 text-red-500" /> :
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2">
                    <div><span className="text-slate-400">Email:</span> <span className="text-slate-800 font-medium block truncate">{user.email || "—"}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="text-slate-800 font-medium block">{user.phone || "—"}</span></div>
                    <div><span className="text-slate-400">Role:</span> <span className="capitalize text-slate-800 font-medium block">{user.role || "—"}</span></div>
                    <div><span className="text-slate-400">Flat/Unit:</span> <span className="text-slate-800 font-medium block">{user.flatUnit || "—"}</span></div>
                  </div>

                  <div className={cn(
                    "text-xs p-2.5 rounded-lg border",
                    user.uploadStatus === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                    user.uploadStatus === "failed" ? "bg-rose-50 border-rose-200 text-rose-900" :
                    user.status === "error" ? "bg-red-50 border-red-200 text-red-800" :
                    "bg-slate-50 border-slate-200 text-slate-700"
                  )}>
                    <strong className="block text-[11px] uppercase tracking-wider mb-0.5 text-slate-500">Remarks:</strong>
                    {user.remarks}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Action Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="text-sm text-slate-600">
              {stats && (
                <span>
                  Ready to insert: <strong className="text-emerald-700">{stats.valid + stats.warnings} valid user(s)</strong>
                  {stats.errors > 0 && <span className="text-red-500"> ({stats.errors} error rows will be skipped)</span>}
                  {stats.uploaded > 0 && <span className="text-emerald-600 font-medium"> • {stats.uploaded} already inserted in DB</span>}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Upload New CSV
              </button>

              <button
                onClick={handleUpload}
                disabled={isUploading || (stats?.valid === 0 && stats?.warnings === 0)}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving Users to DB...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Save & Insert Valid Users
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Reference Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 text-sm">CSV Column Reference & Rules Guide</h3>
        </div>
        <p className="text-xs text-slate-500">
          Make sure your uploaded file contains the exact column headers below for proper parsing and insertion.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 pr-4 text-left">Column Name</th>
                <th className="py-2.5 pr-4 text-left">Required</th>
                <th className="py-2.5 pr-4 text-left">Allowed Formats / Values</th>
                <th className="py-2.5 pr-4 text-left">Sample Value</th>
                <th className="py-2.5 text-left">Backend Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { col: "First Name", req: true, vals: "Text", ex: "Priya", note: "Stored in user full name" },
                { col: "Last Name", req: true, vals: "Text", ex: "Sharma", note: "Combined with First Name" },
                { col: "Email", req: true, vals: "Valid email (unique)", ex: "priya@email.com", note: "Primary login & OTP identifier" },
                { col: "Phone", req: true, vals: "8 to 15 digits (unique)", ex: "+91 98765 43210", note: "Used for SMS & notifications" },
                { col: "Role", req: true, vals: "member, resident, vendor, admin, staff, security", ex: "member", note: "Assigns role & initial permissions" },
                { col: "Community Code", req: true, vals: "Active Community Invite Code", ex: "APT-TOWER-A-2024", note: "Associates user to specific community" },
                { col: "Flat/Unit", req: false, vals: "Text", ex: "Apt 402", note: "Stores flat number/tower unit" },
                { col: "ID Type", req: false, vals: "Aadhaar Card, PAN Card, Passport, Voter ID", ex: "Aadhaar Card", note: "Govt ID type for KYC" },
                { col: "ID Number", req: false, vals: "Document Number", ex: "XXXX-XXXX-1234", note: "Stores document number" },
              ].map(row => (
                <tr key={row.col} className="hover:bg-slate-50/50">
                  <td className="py-2.5 pr-4 font-semibold text-slate-800">{row.col}</td>
                  <td className="py-2.5 pr-4">
                    {row.req
                      ? <span className="text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Required</span>
                      : <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{row.vals}</td>
                  <td className="py-2.5 pr-4 text-slate-800 font-mono font-medium">{row.ex}</td>
                  <td className="py-2.5 text-slate-500 italic">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminBulkUpload;
