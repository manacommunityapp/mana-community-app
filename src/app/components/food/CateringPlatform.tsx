import { useState, useEffect } from "react";
import {
  Truck, Star, Users, Calendar, IndianRupee, ChefHat,
  Send, Clock, CheckCircle2, AlertCircle, FileText,
  ArrowRight, Phone, UtensilsCrossed
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { foodCateringService } from "../../../services/food/foodCateringService";
import type { Caterer, CateringRequest, CateringRequestDto } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  QUOTATION_RECEIVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const occasionTypes = ["WEDDING", "BIRTHDAY", "CORPORATE", "HOUSEWARMING", "POOJA", "ANNIVERSARY", "GET_TOGETHER", "OTHER"];

export function CateringPlatform() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [activeTab, setActiveTab] = useState("browse");
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CateringRequest | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // Form state
  const [occasionType, setOccasionType] = useState<string>("BIRTHDAY");
  const [eventDate, setEventDate] = useState<string>("");
  const [eventTime, setEventTime] = useState<string>("18:00");
  const [guestCount, setGuestCount] = useState<number>(50);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [venue, setVenue] = useState<string>("");
  const [menuPreferences, setMenuPreferences] = useState<string>("");
  const [dietaryRequirements, setDietaryRequirements] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [caterersRes, requestsRes] = await Promise.allSettled([
        foodCateringService.getCaterers(0, 50),
        foodCateringService.getMyCateringRequests(0, 50),
      ]);

      if (caterersRes.status === "fulfilled" && caterersRes.value?.content) {
        setCaterers(caterersRes.value.content);
      }
      if (requestsRes.status === "fulfilled" && requestsRes.value?.content) {
        setRequests(requestsRes.value.content);
      }
    } catch (err) {
      console.error("Failed to load catering data:", err);
      setError("Failed to load caterers and requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !guestCount) return;
    try {
      setSubmitting(true);
      const payload: CateringRequestDto = {
        occasionType,
        eventDate,
        eventTime,
        guestCount: Number(guestCount),
        budget: budget ? Number(budget) : undefined,
        venue,
        menuPreferences,
        dietaryRequirements,
      };
      await foodCateringService.createCateringRequest(payload);
      setQuoteFormOpen(false);
      await loadData();
      setActiveTab("requests");
    } catch (err) {
      console.error("Failed to create catering request:", err);
      alert("Failed to submit quote request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuote = async (requestId: number, quotationId: number) => {
    try {
      await foodCateringService.acceptQuotation(requestId, quotationId);
      setCompareOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to accept quotation:", err);
      alert("Failed to accept quotation. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Catering Platform</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Find caterers and manage event catering</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setQuoteFormOpen(true)}>
          <Send className="w-4 h-4" /> Request Quote
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="browse">Browse Caterers ({caterers.length})</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          {caterers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center flex flex-col items-center justify-center">
                <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No caterers registered yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Community caterers and banquet partners will appear here once onboarded. You can still submit a custom quote request anytime.
                </p>
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white gap-2" size="sm" onClick={() => setQuoteFormOpen(true)}>
                  <Send className="w-3.5 h-3.5" /> Request a Custom Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {caterers.map((caterer) => (
                <Card key={caterer.id} className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-semibold">{caterer.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{caterer.cuisineTypes}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold">{caterer.rating ? caterer.rating.toFixed(1) : "—"}</span>
                          {caterer.totalEvents ? <span className="text-xs text-slate-400">({caterer.totalEvents} events)</span> : null}
                        </div>
                      </div>
                      {caterer.description && <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{caterer.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        {(caterer.minOrderCount || caterer.maxOrderCount) && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{caterer.minOrderCount ?? 1}-{caterer.maxOrderCount ?? 500} guests</span>
                        )}
                        {(caterer.pricePerPlateFrom || caterer.pricePerPlateTo) && (
                          <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{formatPrice(caterer.pricePerPlateFrom ?? 0)} - {formatPrice(caterer.pricePerPlateTo ?? 0)}/plate</span>
                        )}
                      </div>

                      {/* Packages */}
                      {caterer.packages && caterer.packages.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Packages</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {caterer.packages.map((pkg) => (
                              <div key={pkg.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold">{pkg.name}</p>
                                  <Badge variant="outline" className="text-[10px]">{pkg.occasionType}</Badge>
                                </div>
                                {pkg.description && <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</p>}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatPrice(pkg.pricePerPlate)}/plate</span>
                                  {pkg.minPlates && <span className="text-xs text-slate-400">Min {pkg.minPlates} plates</span>}
                                </div>
                                {pkg.includes && <p className="text-[10px] text-slate-400 mt-1">Includes: {pkg.includes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setQuoteFormOpen(true)}>
                          <Send className="w-3 h-3" /> Get Quote
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-4">
          {requests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No catering requests yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setQuoteFormOpen(true)}>Request Quote</Button>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{req.occasionType ? req.occasionType.replace(/_/g, " ") : "Catering"} Event</h3>
                        <Badge className={`text-[10px] ${statusColors[req.status] || ""}`}>{req.status?.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {req.eventDate && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(req.eventDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{req.guestCount} guests</span>
                        {req.budget && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />Budget: {formatPrice(req.budget)}</span>}
                      </div>
                      {(req.venue || req.menuPreferences) && (
                        <p className="text-xs text-slate-400 mt-1">{[req.venue, req.menuPreferences].filter(Boolean).join(" - ")}</p>
                      )}
                    </div>
                  </div>

                  {/* Quotations */}
                  {req.quotations && req.quotations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quotations ({req.quotations.length})</p>
                        {req.quotations.length > 1 && (
                          <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-400" onClick={() => { setSelectedRequest(req); setCompareOpen(true); }}>
                            Compare <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                      {req.quotations.map((q) => (
                        <div key={q.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{q.catererName || `Caterer #${q.catererId}`}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.menu}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatPrice(q.totalAmount)}</p>
                            {q.pricePerPlate ? <p className="text-xs text-slate-400">{formatPrice(q.pricePerPlate)}/plate</p> : null}
                            <Badge className={`text-[10px] mt-1 ${statusColors[q.status] || ""}`}>{q.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Request Quote Dialog */}
      <Dialog open={quoteFormOpen} onOpenChange={setQuoteFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Catering Quote</DialogTitle>
            <DialogDescription>Fill in your event details to receive quotations from community caterers</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Occasion Type</Label>
              <Select value={occasionType} onValueChange={setOccasionType}>
                <SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger>
                <SelectContent>
                  {occasionTypes.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Event Date</Label>
                <Input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Guest Count</Label>
                <Input type="number" required min="1" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Budget (optional)</Label>
                <Input type="number" placeholder="50000" value={budget || ""} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Venue</Label>
                <Input placeholder="e.g., Community Hall" value={venue} onChange={(e) => setVenue(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Menu Preferences</Label>
              <Textarea placeholder="Vegetarian, Non-veg starters, Jain options, specific dishes..." value={menuPreferences} onChange={(e) => setMenuPreferences(e.target.value)} className="h-20 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Dietary Requirements</Label>
              <Input placeholder="e.g., No onion garlic, nut-free..." value={dietaryRequirements} onChange={(e) => setDietaryRequirements(e.target.value)} className="text-sm" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compare Quotations Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare Quotations</DialogTitle>
            <DialogDescription>{selectedRequest?.occasionType?.replace(/_/g, " ")} - {selectedRequest?.guestCount} guests</DialogDescription>
          </DialogHeader>
          {selectedRequest?.quotations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedRequest.quotations.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{q.catererName || `Caterer #${q.catererId}`}</p>
                    <Badge className={`text-[10px] ${statusColors[q.status] || ""}`}>{q.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    {q.pricePerPlate ? <div className="flex justify-between text-xs"><span className="text-slate-500">Per Plate</span><span className="font-semibold">{formatPrice(q.pricePerPlate)}</span></div> : null}
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Total</span><span className="font-bold text-base">{formatPrice(q.totalAmount)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Valid Until</span><span>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "-"}</span></div>
                  </div>
                  {q.menu && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Menu</p>
                      <p className="text-xs">{q.menu}</p>
                    </div>
                  )}
                  {q.notes && <p className="text-[10px] text-slate-400">Note: {q.notes}</p>}
                  {q.status !== "ACCEPTED" && (
                    <Button size="sm" onClick={() => handleAcceptQuote(selectedRequest.id, q.id)} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      Accept Quote
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
