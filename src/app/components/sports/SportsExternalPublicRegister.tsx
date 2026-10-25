import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { sportsExternalFormService, type ExternalFormConfig, type FieldMapping } from "../../../services/sports/sportsExternalFormService";
import { isValidIndianPhone, normalizeIndianPhone, isValidEmail } from "./sportsValidation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function SportsExternalPublicRegister() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formConfig, setFormConfig] = useState<ExternalFormConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form input state
  const [playerName, setPlayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [flatNumber, setFlatNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("MALE");
  const [categoryId, setCategoryId] = useState("");
  const [matchFormat, setMatchFormat] = useState("SINGLES");
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [cricheroesUrl, setCricHeroesUrl] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission result state
  const [submitResult, setSubmitResult] = useState<{
    status: "IMPORTED" | "NEEDS_REVIEW" | "REJECTED";
    registrationId?: number;
    responseId?: number;
    reviewReason?: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Invalid registration link. Token missing.");
      setLoading(false);
      return;
    }

    async function loadForm() {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await sportsExternalFormService.getPublicForm(token!);
        setFormConfig(data);

        // Pre-select first category if options exist
        const catMapping = data.fieldMappings?.find((m) => m.manaFieldKey === "categoryId");
        if (catMapping?.mappingRulesJson) {
          try {
            const rules = JSON.parse(catMapping.mappingRulesJson);
            const keys = Object.keys(rules);
            if (keys.length > 0) {
              setCategoryId(keys[0]);
            }
          } catch (e) {
            console.error("Failed to parse category mapping rules", e);
          }
        }
      } catch (err: any) {
        console.error("Failed to load public external form", err);
        setLoadError(
          err?.response?.data?.message ||
            "Registration form not found or is currently inactive. Please check the link or contact the organizer."
        );
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [token]);

  // Extract category options from mappingRulesJson
  const categoryOptions = (() => {
    const catMapping = formConfig?.fieldMappings?.find((m) => m.manaFieldKey === "categoryId");
    if (!catMapping?.mappingRulesJson) return [];
    try {
      const parsed = JSON.parse(catMapping.mappingRulesJson);
      return Object.entries(parsed).map(([name, id]) => ({
        label: name,
        value: String(id),
      }));
    } catch {
      return [];
    }
  })();

  // Extract match format options from mappingRulesJson (set by backend based on event's declared formats only)
  const formatOptions = (() => {
    const fmtMapping = formConfig?.fieldMappings?.find((m) => m.manaFieldKey === "matchFormat");
    if (!fmtMapping?.mappingRulesJson) {
      // Minimal safe fallback — backend should always provide mappingRulesJson for MANA_FORM
      return [
        { label: "Singles", value: "SINGLES" },
        { label: "Doubles", value: "DOUBLES" },
      ];
    }
    try {
      const parsed = JSON.parse(fmtMapping.mappingRulesJson);
      return Object.entries(parsed).map(([name, val]) => ({
        label: name,
        value: String(val),
      }));
    } catch {
      return [
        { label: "Singles", value: "SINGLES" },
        { label: "Doubles", value: "DOUBLES" },
      ];
    }
  })();

  const isFieldIncluded = (fieldKey: string): boolean => {
    if (!formConfig?.fieldMappings || formConfig.fieldMappings.length === 0) return true;
    return formConfig.fieldMappings.some((m) => m.manaFieldKey === fieldKey);
  };

  const isFieldRequired = (fieldKey: string): boolean => {
    if (!formConfig?.fieldMappings) return false;
    const mapping = formConfig.fieldMappings.find((m) => m.manaFieldKey === fieldKey);
    return mapping?.required ?? false;
  };

  const isDoublesOrTeam =
    matchFormat.toUpperCase().includes("DOUBLE") ||
    matchFormat.toUpperCase().includes("TEAM");

  // Validate form before submission
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!playerName.trim()) {
      newErrors.playerName = "Full name is required";
    }

    if (isFieldIncluded("phone")) {
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!isValidIndianPhone(phone)) {
        newErrors.phone = "Enter a valid 10-digit mobile number";
      }
    }

    if (isFieldIncluded("email")) {
      if (isFieldRequired("email") && !email.trim()) {
        newErrors.email = "Email address is required";
      } else if (email.trim() && !isValidEmail(email)) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (isFieldIncluded("flatNumber") && !isGuest && !flatNumber.trim()) {
      newErrors.flatNumber = "Flat / Villa number is required for residents";
    }

    if (isFieldIncluded("age")) {
      if (!age.trim()) {
        if (isFieldRequired("age")) newErrors.age = "Age is required";
      } else {
        const numAge = parseInt(age, 10);
        if (isNaN(numAge) || numAge < 4 || numAge > 100) {
          newErrors.age = "Please enter a valid age (4–100)";
        }
      }
    }

    if (isDoublesOrTeam) {
      if (isFieldIncluded("partnerName") && !partnerName.trim()) {
        newErrors.partnerName = "Partner name is required for doubles / team";
      }
      if (partnerPhone.trim() && !isValidIndianPhone(partnerPhone)) {
        newErrors.partnerPhone = "Enter a valid 10-digit mobile number for partner";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !token) return;

    try {
      setSubmitting(true);
      const answers: Record<string, any> = {
        playerName: playerName.trim(),
        phone: normalizeIndianPhone(phone),
        email: email.trim(),
        flatNumber: isGuest ? "" : flatNumber.trim(),
        isExternalGuest: isGuest,
        gender,
        age: age.trim(),
        matchFormat,
      };

      if (categoryId) {
        answers.categoryId = categoryId;
      }
      if (isDoublesOrTeam) {
        answers.partnerName = partnerName.trim();
        answers.partnerPhone = normalizeIndianPhone(partnerPhone);
      }
      if (cricheroesUrl.trim()) {
        answers.cricheroesUrl = cricheroesUrl.trim();
      }

      // Add custom answers
      Object.entries(customAnswers).forEach(([k, v]) => {
        answers[k] = v;
      });

      const payload = {
        externalResponseId: "mana_web_" + Date.now(),
        email: email.trim(),
        answers,
      };

      const result = await sportsExternalFormService.submitPublicForm(token, payload);
      setSubmitResult(result);
    } catch (err: any) {
      console.error("Submission failed", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to submit registration. Please check your connection and try again.";
      setErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setPlayerName("");
    setPhone("");
    setEmail("");
    setFlatNumber("");
    setIsGuest(false);
    setAge("");
    setPartnerName("");
    setPartnerPhone("");
    setCricHeroesUrl("");
    setCustomAnswers({});
    setErrors({});
    setSubmitResult(null);
  };

  const shareOnWhatsApp = () => {
    const currentUrl = window.location.href;
    const title = formConfig?.title || formConfig?.eventName || "Sports Tournament";
    const text = `🏆 *Register for ${title}*\n\nSign up easily here:\n👉 ${currentUrl}\n\n_Mana Community Sports Hub_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800">Loading Registration Form...</h2>
          <p className="text-sm text-slate-500 mt-1">Connecting to Mana Sports Tournament Portal</p>
        </div>
      </div>
    );
  }

  // Error or Not Found state
  if (loadError || !formConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Form Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">{loadError || "This registration form does not exist or has expired."}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Go to Mana Community Hub
          </Link>
        </div>
      </div>
    );
  }

  // Closed Form Notice
  if (formConfig.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Registrations Closed</h2>
          <p className="text-xs text-slate-500 font-medium mb-4">{formConfig.eventName}</p>
          <p className="text-sm text-slate-600 mb-6">
            Registration for this tournament has been paused or closed by the organizers.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" /> Check Again
          </button>
        </div>
      </div>
    );
  }

  // Success / Confirmation View
  if (submitResult) {
    const isApproved = submitResult.status === "IMPORTED";
    const isReview = submitResult.status === "NEEDS_REVIEW";

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/20 py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className={`p-8 text-center text-white ${isApproved ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-gradient-to-r from-amber-600 to-orange-700"}`}>
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              {isApproved ? <CheckCircle2 className="w-9 h-9 text-white" /> : <Clock className="w-9 h-9 text-white" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isApproved ? "Registration Confirmed!" : "Registration Received"}
            </h1>
            <p className="text-sm text-white/90 mt-1 max-w-sm mx-auto">
              {isApproved
                ? "You have been successfully registered for this tournament."
                : "Your entry has been received and is pending tournament organizer review."}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500">Status</span>
                <Badge variant={isApproved ? "default" : "secondary"} className={isApproved ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800 border-amber-200"}>
                  {isApproved ? "CONFIRMED" : "PENDING REVIEW"}
                </Badge>
              </div>

              {submitResult.registrationId && submitResult.registrationId > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Registration ID</span>
                  <span className="font-mono font-semibold text-slate-800">#{submitResult.registrationId}</span>
                </div>
              )}

              {submitResult.responseId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Response Reference</span>
                  <span className="font-mono text-slate-600">REF-{submitResult.responseId}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Player</span>
                <span className="font-medium text-slate-900">{playerName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tournament Event</span>
                <span className="font-medium text-slate-900">{formConfig.eventName}</span>
              </div>

              {categoryId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-900">{categoryId}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Format</span>
                <span className="font-medium text-slate-900">{matchFormat}</span>
              </div>

              {isDoublesOrTeam && partnerName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Partner</span>
                  <span className="font-medium text-slate-900">{partnerName}</span>
                </div>
              )}
            </div>

            {isReview && submitResult.reviewReason && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Reason for Queueing:</p>
                  <p className="mt-0.5 text-amber-700">{submitResult.reviewReason}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-sm text-sm"
              >
                <Share2 className="w-4 h-4" /> Share on WhatsApp
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyPageLink}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition text-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  {copiedLink ? "Link Copied" : "Copy Form Link"}
                </button>

                <button
                  type="button"
                  onClick={handleRegisterAnother}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition text-xs"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Register Another
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Powered by Mana Community Hub Sports Module
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form View
  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tournament Brand Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2.5 py-0.5 font-medium">
                  <Trophy className="w-3.5 h-3.5" />
                  Mana Sports Portal
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                  Open Registration
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
                {formConfig.title || formConfig.eventName}
              </h1>

              {formConfig.description && (
                <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                  {formConfig.description}
                </p>
              )}
            </div>

            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-600 text-white items-center justify-center shadow-sm shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Section: Player Details */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Player Information
              </h2>

              {/* Full Name */}
              <div>
                <Label htmlFor="playerName" className="text-xs font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      if (errors.playerName) setErrors((prev) => ({ ...prev, playerName: "" }));
                    }}
                    placeholder="Enter player's complete name"
                    className={`h-11 rounded-xl text-sm ${errors.playerName ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                  />
                </div>
                {errors.playerName && <p className="text-xs text-rose-600 mt-1">{errors.playerName}</p>}
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isFieldIncluded("phone") && (
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      Phone Number / WhatsApp <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        placeholder="10-digit mobile number"
                        className={`h-11 rounded-xl text-sm ${errors.phone ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
                  </div>
                )}

                {isFieldIncluded("email") && (
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                      Email Address {isFieldRequired("email") && <span className="text-rose-500">*</span>}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="name@example.com"
                        className={`h-11 rounded-xl text-sm ${errors.email ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                  </div>
                )}
              </div>

              {/* Community Resident vs External Guest */}
              {isFieldIncluded("flatNumber") && (
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="flatNumber" className="text-xs font-semibold text-slate-700">
                      Community Flat / Unit Number {!isGuest && <span className="text-rose-500">*</span>}
                    </Label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isGuest}
                        onChange={(e) => {
                          setIsGuest(e.target.checked);
                          if (errors.flatNumber) setErrors((prev) => ({ ...prev, flatNumber: "" }));
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>I am an external guest / non-resident</span>
                    </label>
                  </div>

                  {!isGuest ? (
                    <div>
                      <Input
                        id="flatNumber"
                        type="text"
                        value={flatNumber}
                        onChange={(e) => {
                          setFlatNumber(e.target.value);
                          if (errors.flatNumber) setErrors((prev) => ({ ...prev, flatNumber: "" }));
                        }}
                        placeholder="e.g. A-402, Tower 2 / Villa 15"
                        className={`h-11 rounded-xl text-sm ${errors.flatNumber ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                      />
                      {errors.flatNumber && <p className="text-xs text-rose-600 mt-1">{errors.flatNumber}</p>}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Guest participant entry. Organizer approval may be required based on tournament policy.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Age & Gender Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isFieldIncluded("age") && (
                  <div>
                    <Label htmlFor="age" className="text-xs font-semibold text-slate-700">
                      Age (Years) {isFieldRequired("age") && <span className="text-rose-500">*</span>}
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={4}
                      max={100}
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        if (errors.age) setErrors((prev) => ({ ...prev, age: "" }));
                      }}
                      placeholder="e.g. 24"
                      className={`h-11 rounded-xl text-sm mt-1 ${errors.age ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                    />
                    {errors.age && <p className="text-xs text-rose-600 mt-1">{errors.age}</p>}
                  </div>
                )}

                {isFieldIncluded("gender") && (
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Gender</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`h-11 rounded-xl text-xs font-medium border transition ${
                            gender === g
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Tournament Category & Match Format */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                Category & Match Details
              </h2>

              {/* Tournament Category */}
              {isFieldIncluded("categoryId") && categoryOptions.length > 0 && (
                <div>
                  <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                    Category Selection <span className="text-rose-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategoryId(cat.label)}
                        className={`p-3 text-left rounded-xl border text-xs transition ${
                          categoryId === cat.label
                            ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-300"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-semibold">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Format */}
              {isFieldIncluded("matchFormat") && (
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Match Format</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                    {formatOptions.map((fmt) => (
                      <button
                        key={fmt.value}
                        type="button"
                        onClick={() => setMatchFormat(fmt.value)}
                        className={`h-11 rounded-xl text-xs font-medium border transition ${
                          matchFormat === fmt.value
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Doubles / Team Partner fields */}
              {isDoublesOrTeam && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Doubles Partner Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="partnerName" className="text-xs text-slate-700">
                        Partner Full Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="partnerName"
                        type="text"
                        value={partnerName}
                        onChange={(e) => {
                          setPartnerName(e.target.value);
                          if (errors.partnerName) setErrors((prev) => ({ ...prev, partnerName: "" }));
                        }}
                        placeholder="Partner's name"
                        className={`h-10 rounded-lg text-xs mt-1 bg-white ${errors.partnerName ? "border-rose-400" : ""}`}
                      />
                      {errors.partnerName && <p className="text-xs text-rose-600 mt-1">{errors.partnerName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="partnerPhone" className="text-xs text-slate-700">
                        Partner Phone Number
                      </Label>
                      <Input
                        id="partnerPhone"
                        type="tel"
                        value={partnerPhone}
                        onChange={(e) => {
                          setPartnerPhone(e.target.value);
                          if (errors.partnerPhone) setErrors((prev) => ({ ...prev, partnerPhone: "" }));
                        }}
                        placeholder="Partner's 10-digit mobile"
                        className={`h-10 rounded-lg text-xs mt-1 bg-white ${errors.partnerPhone ? "border-rose-400" : ""}`}
                      />
                      {errors.partnerPhone && <p className="text-xs text-rose-600 mt-1">{errors.partnerPhone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* CricHeroes URL (if present in field mappings) */}
              {isFieldIncluded("cricheroesUrl") && (
                <div>
                  <Label htmlFor="cricheroesUrl" className="text-xs font-semibold text-slate-700">
                    CricHeroes Profile Link
                  </Label>
                  <Input
                    id="cricheroesUrl"
                    type="url"
                    value={cricheroesUrl}
                    onChange={(e) => setCricHeroesUrl(e.target.value)}
                    placeholder="https://cricheroes.in/player-profile/..."
                    className="h-11 rounded-xl text-sm mt-1"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used to display your tournament cricket stats and batting/bowling profile.
                  </p>
                </div>
              )}
            </div>

            {/* Custom Field Questions (if any exist beyond canonicals) */}
            {formConfig.fieldMappings
              ?.filter(
                (m) =>
                  ![
                    "playerName",
                    "phone",
                    "email",
                    "flatNumber",
                    "age",
                    "dob",
                    "gender",
                    "categoryId",
                    "matchFormat",
                    "partnerName",
                    "partnerPhone",
                    "cricheroesUrl",
                  ].includes(m.manaFieldKey)
              )
              .map((mapping) => (
                <div key={mapping.manaFieldKey} className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    {mapping.questionTitle || mapping.manaFieldKey}{" "}
                    {mapping.required && <span className="text-rose-500">*</span>}
                  </Label>
                  <Input
                    type="text"
                    value={customAnswers[mapping.manaFieldKey] || ""}
                    onChange={(e) =>
                      setCustomAnswers((prev) => ({
                        ...prev,
                        [mapping.manaFieldKey]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${mapping.questionTitle || mapping.manaFieldKey}`}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
              ))}

            {/* Submit Action Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Tournament Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Mana Community Form
                </span>
                <span>Idempotent & Secure Submission</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
