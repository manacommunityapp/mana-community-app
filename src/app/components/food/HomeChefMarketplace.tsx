import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search, Star, ChefHat, ShoppingBag, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, AlertCircle, FileCheck
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { foodHomeChefService } from "../../../services/food/foodHomeChefService";
import type { HomeChef, HomeChefRequest } from "../../../types/food";
import { automationService, type FoodFssaiAllergenAuditResponse } from "../../../services/automation/automationService";

const cuisineOptions = ["All", "South Indian", "North Indian", "Bengali", "Gujarati", "Korean", "Vegan", "Continental"];
const availabilityColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  BUSY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  OFFLINE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const EMPTY_FORM: HomeChefRequest = { kitchenName: "", description: "", speciality: "", cuisineTypes: "", fssaiLicense: "" };

export function HomeChefMarketplace() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState<HomeChefRequest>(EMPTY_FORM);
  const [allChefs, setAllChefs] = useState<HomeChef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // AI FSSAI & Allergen Audit State
  const [isAuditingFssai, setIsAuditingFssai] = useState(false);
  const [fssaiAuditResult, setFssaiAuditResult] = useState<FoodFssaiAllergenAuditResponse | null>(null);
  const [showFssaiModal, setShowFssaiModal] = useState(false);

  const handleAuditFssai = async (kitchenName?: string, fssaiLicense?: string, speciality?: string, cuisineTypes?: string) => {
    setIsAuditingFssai(true);
    try {
      const res = await automationService.screenFoodAllergenCompliance({
        kitchenName: kitchenName || regForm.kitchenName || "Artisan Home Kitchen",
        fssaiLicense: fssaiLicense || regForm.fssaiLicense || "21423010000452",
        cuisineTypes: cuisineTypes || regForm.cuisineTypes || "South Indian, Traditional",
        sampleDishes: [
          {
            name: speciality || regForm.speciality || "Special Signature Thali",
            ingredients: ["Ghee Rice", "Sambar", "Peanut Podi", "Wheat Chapati", "Curd"],
            declaredAllergens: ["Peanuts", "Dairy"],
          },
        ],
        auditScope: "REGISTRATION",
      });
      setFssaiAuditResult(res);
      setShowFssaiModal(true);
    } catch (err) {
      console.error("FSSAI audit failed:", err);
    } finally {
      setIsAuditingFssai(false);
    }
  };

  const fetchChefs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await foodHomeChefService.getHomeChefs(0, 50, undefined, searchQuery || undefined);
      setAllChefs(data?.content ?? []);
    } catch (err) {
      console.error("Failed to fetch home chefs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  const chefs = allChefs.filter((c) => {
    if (cuisineFilter !== "All" && !c.cuisineTypes?.toLowerCase().includes(cuisineFilter.toLowerCase())) return false;
    if (ratingFilter === "4plus" && (c.rating ?? 0) < 4) return false;
    if (ratingFilter === "4.5plus" && (c.rating ?? 0) < 4.5) return false;
    return true;
  });

  const handleRegister = async () => {
    if (!regForm.kitchenName.trim()) return;
    setIsRegistering(true);
    try {
      await foodHomeChefService.registerHomeChef(regForm);
      setShowRegister(false);
      setRegForm(EMPTY_FORM);
      fetchChefs();
    } catch (err) {
      console.error("Failed to register home chef:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 max-w-md rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Home Chefs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Discover home-cooked meals from talented chefs in your community</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleAuditFssai()}
            disabled={isAuditingFssai}
            className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-900/50 dark:text-pink-300 gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-pink-600" />
            {isAuditingFssai ? "Auditing…" : "AI FSSAI & Allergen Audit"}
          </Button>
          <Dialog open={showRegister} onOpenChange={setShowRegister}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
                <ChefHat className="w-4 h-4" /> Register as Chef
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register as a Home Chef</DialogTitle>
                <DialogDescription>Share your culinary skills with the community. Start your home kitchen business today.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kitchen Name</label>
                  <Input placeholder="e.g., Mom's Kitchen" value={regForm.kitchenName} onChange={(e) => setRegForm((f) => ({ ...f, kitchenName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speciality</label>
                  <Input placeholder="e.g., South Indian Meals" value={regForm.speciality ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, speciality: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cuisine Types</label>
                  <Input placeholder="e.g., South Indian, Tamil" value={regForm.cuisineTypes ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, cuisineTypes: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Tell us about your kitchen..." value={regForm.description ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FSSAI License (if available)</label>
                  <div className="flex gap-2">
                    <Input placeholder="License number" value={regForm.fssaiLicense ?? ""} onChange={(e) => setRegForm((f) => ({ ...f, fssaiLicense: e.target.value }))} />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isAuditingFssai}
                      onClick={() => handleAuditFssai(regForm.kitchenName, regForm.fssaiLicense, regForm.speciality, regForm.cuisineTypes)}
                      className="shrink-0 text-xs gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      AI Check
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowRegister(false); setRegForm(EMPTY_FORM); }}>Cancel</Button>
                <Button
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  disabled={!regForm.kitchenName.trim() || isRegistering}
                  onClick={handleRegister}
                >
                  {isRegistering ? "Submitting…" : "Submit Application"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search home chefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cuisine" /></SelectTrigger>
          <SelectContent>
            {cuisineOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4plus">4+ Stars</SelectItem>
            <SelectItem value="4.5plus">4.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chef Grid */}
      {chefs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No home chefs found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chefs.map((chef) => (
            <Card
              key={chef.id}
              className="border-0 shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
              onClick={() => navigate(`/food/home-chefs/${chef.id}`)}
            >
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-pink-500" />
                  </div>
                  <Badge className={`absolute top-2 right-2 text-[10px] border-0 ${availabilityColors[chef.availabilityStatus ?? "OFFLINE"]}`}>
                    {chef.availabilityStatus}
                  </Badge>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{chef.kitchenName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{chef.speciality}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chef.cuisineTypes?.split(", ").map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{chef.rating}</span>
                      <span className="text-xs text-slate-400">({chef.totalRatings})</span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {chef.totalOrders} orders
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI FSSAI & Allergen Compliance Modal */}
      <Dialog open={showFssaiModal} onOpenChange={setShowFssaiModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-xs tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              AI FSSAI & Food Allergen Screener
            </div>
            <DialogTitle>Kitchen Compliance Audit</DialogTitle>
            <DialogDescription>
              FSSAI regulatory validation, allergen cross-contamination matrix, and statutory labeling directives.
            </DialogDescription>
          </DialogHeader>

          {fssaiAuditResult && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500">Compliance Status</div>
                  <Badge
                    className={`mt-1 font-semibold ${
                      fssaiAuditResult.complianceStatus === "COMPLIANT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : fssaiAuditResult.complianceStatus === "PROVISIONAL"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}
                  >
                    {fssaiAuditResult.complianceStatus === "COMPLIANT" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {fssaiAuditResult.complianceStatus !== "COMPLIANT" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {fssaiAuditResult.complianceStatus}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Risk Level</div>
                  <Badge
                    variant="outline"
                    className={`mt-1 font-semibold ${
                      fssaiAuditResult.riskLevel === "LOW"
                        ? "text-emerald-600 border-emerald-300"
                        : fssaiAuditResult.riskLevel === "MEDIUM"
                        ? "text-amber-600 border-amber-300"
                        : "text-rose-600 border-rose-300"
                    }`}
                  >
                    {fssaiAuditResult.riskLevel} RISK
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">FSSAI Status</div>
                  <div className="text-xs font-semibold mt-1">
                    {fssaiAuditResult.fssaiValidated ? (
                      <span className="text-emerald-600 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1 justify-end">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending Docs
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Allergens */}
              {fssaiAuditResult.detectedAllergens && fssaiAuditResult.detectedAllergens.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Detected Food Allergens ({fssaiAuditResult.detectedAllergens.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fssaiAuditResult.detectedAllergens.map((allergen, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Warning Labels */}
              {fssaiAuditResult.recommendedLabels && fssaiAuditResult.recommendedLabels.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-pink-500" />
                    Mandatory FSSAI Warning Labels
                  </h4>
                  <div className="space-y-1">
                    {fssaiAuditResult.recommendedLabels.map((lbl, idx) => (
                      <div key={idx} className="text-xs p-2 rounded-lg bg-pink-50/60 dark:bg-pink-950/20 text-pink-800 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30">
                        "{lbl}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remediation Steps */}
              {fssaiAuditResult.requiredRemediations && fssaiAuditResult.requiredRemediations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Required Remediation Actions</h4>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {fssaiAuditResult.requiredRemediations.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setShowFssaiModal(false)}
            >
              Acknowledge & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
