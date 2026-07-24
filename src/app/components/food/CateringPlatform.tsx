import { useState, useEffect } from "react";
import {
  Truck, Star, Users, Calendar, IndianRupee, ChefHat,
  Plus, Send, Clock, CheckCircle2, AlertCircle, FileText,
  ArrowRight, Phone
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
import type { Caterer, CateringPackage, CateringRequest, CateringQuotation } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const mockCaterers: Caterer[] = [
  { id: 1, name: "Royal Feast Caterers", description: "Premium North Indian catering with 15+ years of experience. Specializing in wedding and corporate events.", cuisineTypes: "North Indian, Mughlai, Continental", minOrderCount: 50, maxOrderCount: 1000, pricePerPlateFrom: 500, pricePerPlateTo: 2500, rating: 4.7, totalEvents: 320, status: "ACTIVE", packages: [
    { id: 1, catererId: 1, name: "Silver Package", description: "4 starters + 6 main course + 3 desserts", occasionType: "WEDDING", itemsPerPlate: 13, pricePerPlate: 800, minPlates: 100, includes: "Service staff, crockery, setup", active: true },
    { id: 2, catererId: 1, name: "Gold Package", description: "6 starters + 8 main course + 4 desserts + live counters", occasionType: "WEDDING", itemsPerPlate: 18, pricePerPlate: 1200, minPlates: 100, includes: "Service staff, crockery, setup, decoration", active: true },
  ], createdAt: "2025-01-15T10:00:00Z" },
  { id: 2, name: "Green Leaf Catering", description: "Pure vegetarian and vegan catering. Organic ingredients, Jain-friendly options available.", cuisineTypes: "South Indian, Jain, Vegan", minOrderCount: 25, maxOrderCount: 500, pricePerPlateFrom: 350, pricePerPlateTo: 1500, rating: 4.5, totalEvents: 180, status: "ACTIVE", packages: [
    { id: 3, catererId: 2, name: "Corporate Lunch", description: "3 starters + 4 main course + 2 desserts", occasionType: "CORPORATE", itemsPerPlate: 9, pricePerPlate: 450, minPlates: 25, includes: "Disposable packaging, delivery", active: true },
  ], createdAt: "2025-03-20T10:00:00Z" },
  { id: 3, name: "Spice Route Events", description: "Multi-cuisine catering specialists. From intimate gatherings to grand celebrations.", cuisineTypes: "Multi-Cuisine, Chinese, Italian", minOrderCount: 30, maxOrderCount: 800, pricePerPlateFrom: 400, pricePerPlateTo: 2000, rating: 4.6, totalEvents: 245, status: "ACTIVE", packages: [
    { id: 4, catererId: 3, name: "Birthday Bash", description: "5 starters + 5 main course + 3 desserts + drinks", occasionType: "BIRTHDAY", itemsPerPlate: 13, pricePerPlate: 600, minPlates: 30, includes: "Service staff, setup, cake cutting arrangement", active: true },
  ], createdAt: "2025-06-10T10:00:00Z" },
];

const mockRequests: CateringRequest[] = [
  { id: 1, userId: 1, occasionType: "BIRTHDAY", eventDate: "2026-08-15", eventTime: "18:00", venue: "Community Hall, Block A", guestCount: 80, budget: 60000, menuPreferences: "Vegetarian + Non-Veg starters", status: "QUOTATION_RECEIVED", quotations: [
    { id: 1, requestId: 1, catererId: 1, catererName: "Royal Feast Caterers", menu: "4 veg starters, 2 non-veg starters, 5 main course, 3 desserts", pricePerPlate: 750, totalAmount: 60000, validUntil: "2026-08-05", status: "PENDING", notes: "Includes service staff and crockery" },
    { id: 2, requestId: 1, catererId: 3, catererName: "Spice Route Events", menu: "5 starters, 5 main course, 3 desserts, welcome drink", pricePerPlate: 700, totalAmount: 56000, validUntil: "2026-08-05", status: "PENDING", notes: "Setup included, decoration extra" },
  ], createdAt: "2026-07-20T10:00:00Z" },
  { id: 2, userId: 1, occasionType: "CORPORATE", eventDate: "2026-07-30", eventTime: "12:30", venue: "Office Conference Room", guestCount: 40, budget: 20000, menuPreferences: "Pure Veg, Jain options", status: "CONFIRMED", selectedCatererId: 2, quotations: [
    { id: 3, requestId: 2, catererId: 2, catererName: "Green Leaf Catering", menu: "3 starters, 4 main course, 2 desserts", pricePerPlate: 450, totalAmount: 18000, validUntil: "2026-07-28", status: "ACCEPTED" },
  ], createdAt: "2026-07-22T10:00:00Z" },
];

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
  const [activeTab, setActiveTab] = useState("browse");
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CateringRequest | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catering Platform</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Find caterers and manage event catering</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setQuoteFormOpen(true)}>
          <Send className="w-4 h-4" /> Request Quote
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="browse">Browse Caterers</TabsTrigger>
          <TabsTrigger value="requests">My Requests ({mockRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <div className="space-y-6">
            {mockCaterers.map((caterer) => (
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
                        <span className="text-sm font-semibold">{caterer.rating}</span>
                        <span className="text-xs text-slate-400">({caterer.totalEvents} events)</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{caterer.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{caterer.minOrderCount}-{caterer.maxOrderCount} guests</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{formatPrice(caterer.pricePerPlateFrom ?? 0)} - {formatPrice(caterer.pricePerPlateTo ?? 0)}/plate</span>
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
                              <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatPrice(pkg.pricePerPlate)}/plate</span>
                                <span className="text-xs text-slate-400">Min {pkg.minPlates} plates</span>
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
                      <Button variant="outline" size="sm" className="gap-2">
                        <Phone className="w-3 h-3" /> Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4 space-y-4">
          {mockRequests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No catering requests yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setQuoteFormOpen(true)}>Request Quote</Button>
              </CardContent>
            </Card>
          ) : (
            mockRequests.map((req) => (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{req.occasionType.replace(/_/g, " ")} Event</h3>
                        <Badge className={`text-[10px] ${statusColors[req.status]}`}>{req.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(req.eventDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{req.guestCount} guests</span>
                        {req.budget && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />Budget: {formatPrice(req.budget)}</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{req.venue} - {req.menuPreferences}</p>
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
                            <p className="text-sm font-medium">{q.catererName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.menu}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatPrice(q.totalAmount)}</p>
                            <p className="text-xs text-slate-400">{formatPrice(q.pricePerPlate)}/plate</p>
                            <Badge className={`text-[10px] mt-1 ${statusColors[q.status]}`}>{q.status}</Badge>
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
            <DialogDescription>Fill in your event details to receive quotations from caterers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Occasion Type</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger>
                <SelectContent>
                  {occasionTypes.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Event Date</Label>
                <Input type="date" className="text-sm" min="2026-07-24" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Guest Count</Label>
                <Input type="number" placeholder="50" className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Budget (approx)</Label>
                <Input type="number" placeholder="50000" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Venue</Label>
                <Input placeholder="e.g., Community Hall" className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Menu Preferences</Label>
              <Textarea placeholder="Vegetarian, Non-veg starters, Jain options, specific dishes..." className="h-20 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Dietary Requirements</Label>
              <Input placeholder="e.g., No onion garlic, nut-free..." className="text-sm" />
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <Send className="w-4 h-4" /> Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Quotations Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare Quotations</DialogTitle>
            <DialogDescription>{selectedRequest?.occasionType.replace(/_/g, " ")} - {selectedRequest?.guestCount} guests</DialogDescription>
          </DialogHeader>
          {selectedRequest?.quotations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedRequest.quotations.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{q.catererName}</p>
                    <Badge className={`text-[10px] ${statusColors[q.status]}`}>{q.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Per Plate</span><span className="font-semibold">{formatPrice(q.pricePerPlate)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Total</span><span className="font-bold text-base">{formatPrice(q.totalAmount)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Valid Until</span><span>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "-"}</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Menu</p>
                    <p className="text-xs">{q.menu}</p>
                  </div>
                  {q.notes && <p className="text-[10px] text-slate-400">Note: {q.notes}</p>}
                  <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">Accept Quote</Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
