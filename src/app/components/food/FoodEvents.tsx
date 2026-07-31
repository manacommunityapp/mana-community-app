import { useState, useEffect } from "react";
import {
  PartyPopper, Calendar, MapPin, Users, Clock, ChefHat,
  Trophy, Utensils, Plus, ArrowRight, Ticket, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { FoodEvent, FoodEventRegistration } from "../../../types/food";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const eventTypeConfig: Record<string, { icon: typeof PartyPopper; color: string; bg: string }> = {
  POTLUCK: { icon: Utensils, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  COOKING_COMPETITION: { icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  FOOD_FESTIVAL: { icon: PartyPopper, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30" },
  WORKSHOP: { icon: ChefHat, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  TASTING: { icon: Utensils, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
};

const mockEvents: FoodEvent[] = [
  { id: 1, name: "Community Potluck - Monsoon Special", description: "Bring your favorite monsoon dish! Enjoy pakoras, chai, and more with your neighbors. Each family brings one dish to share.", eventType: "POTLUCK", venue: "Community Hall, Block A", date: "2026-07-28", startTime: "18:00", endTime: "21:00", capacity: 50, registered: 32, spotsLeft: 18, price: 0, organizerId: 1, status: "OPEN", registrationDeadline: "2026-07-27", createdAt: "2026-07-20T10:00:00Z" },
  { id: 2, name: "Biryani Cook-Off Championship", description: "Compete for the title of Best Biryani Chef! Judges include professional chefs. Prizes worth Rs 10,000.", eventType: "COOKING_COMPETITION", venue: "Outdoor Amphitheatre", date: "2026-08-02", startTime: "10:00", endTime: "14:00", capacity: 20, registered: 15, spotsLeft: 5, price: 200, organizerId: 2, status: "OPEN", registrationDeadline: "2026-07-31", createdAt: "2026-07-18T10:00:00Z" },
  { id: 3, name: "South Indian Food Festival", description: "A day celebrating the diverse flavors of South India. Live dosa stations, filter coffee, and traditional banana leaf meals.", eventType: "FOOD_FESTIVAL", venue: "Clubhouse Lawn", date: "2026-08-10", startTime: "11:00", endTime: "20:00", capacity: 200, registered: 85, spotsLeft: 115, price: 150, organizerId: 1, status: "OPEN", registrationDeadline: "2026-08-08", createdAt: "2026-07-15T10:00:00Z" },
  { id: 4, name: "Artisan Bread Baking Workshop", description: "Learn to bake sourdough, naan, and focaccia from scratch. All ingredients and equipment provided.", eventType: "WORKSHOP", venue: "Community Kitchen", date: "2026-08-05", startTime: "09:00", endTime: "13:00", capacity: 12, registered: 12, spotsLeft: 0, price: 500, organizerId: 3, status: "FULL", registrationDeadline: "2026-08-03", createdAt: "2026-07-10T10:00:00Z" },
  { id: 5, name: "Wine & Cheese Tasting Evening", description: "Curated selection of Indian wines paired with artisanal cheeses. Expert sommelier guided tasting.", eventType: "TASTING", venue: "Rooftop Lounge", date: "2026-08-15", startTime: "19:00", endTime: "22:00", capacity: 30, registered: 12, spotsLeft: 18, price: 1200, organizerId: 2, status: "OPEN", registrationDeadline: "2026-08-13", createdAt: "2026-07-22T10:00:00Z" },
];

const mockRegistrations: (FoodEventRegistration & { eventName: string; eventDate: string })[] = [
  { id: 1, eventId: 1, userId: 1, guests: 2, totalAmount: 0, status: "CONFIRMED", qrCode: "QR-EVT-1042", dietaryRequirements: "Vegetarian", contributionItem: "Methi Pakora", eventName: "Community Potluck - Monsoon Special", eventDate: "2026-07-28" },
  { id: 2, eventId: 2, userId: 1, guests: 0, totalAmount: 200, status: "CONFIRMED", qrCode: "QR-EVT-1043", eventName: "Biryani Cook-Off Championship", eventDate: "2026-08-02" },
];

export function FoodEvents() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<FoodEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Food Events</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Discover and join community food experiences</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="registrations">My Registrations ({mockRegistrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockEvents.map((event) => {
              const cfg = eventTypeConfig[event.eventType] ?? eventTypeConfig.POTLUCK;
              const Icon = cfg.icon;
              const isFull = event.spotsLeft === 0;
              return (
                <Card key={event.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedEvent(event); setDetailOpen(true); }}>
                  <CardContent className="p-0">
                    <div className={`h-28 ${cfg.bg} flex items-center justify-center relative`}>
                      <Icon className={`w-10 h-10 ${cfg.color} opacity-50`} />
                      <div className="absolute top-3 left-3">
                        <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>{event.eventType.replace(/_/g, " ")}</Badge>
                      </div>
                      {isFull && (
                        <div className="absolute top-3 right-3">
                          <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">FULL</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold line-clamp-1">{event.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">{event.registered}/{event.capacity} registered</span>
                        </div>
                        <span className="text-sm font-bold">{event.price === 0 ? "Free" : formatPrice(event.price ?? 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="mt-4 space-y-4">
          {mockRegistrations.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No registrations yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab("upcoming")}>Browse Events</Button>
              </CardContent>
            </Card>
          ) : (
            mockRegistrations.map((reg) => (
              <Card key={reg.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{reg.eventName}</p>
                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{reg.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(reg.eventDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                        {reg.guests > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />+{reg.guests} guests</span>}
                        {reg.contributionItem && <Badge variant="outline" className="text-[10px]">Bringing: {reg.contributionItem}</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-mono">{reg.qrCode}</p>
                      {(reg.totalAmount ?? 0) > 0 && <p className="text-sm font-bold mt-1">{formatPrice(reg.totalAmount ?? 0)}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>{selectedEvent?.eventType.replace(/_/g, " ")}</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedEvent.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Date & Time</p>
                  <p className="text-sm font-semibold">{new Date(selectedEvent.date).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <p className="text-xs text-slate-500">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Venue</p>
                  <p className="text-sm font-semibold">{selectedEvent.venue}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Capacity</p>
                  <p className="text-sm font-semibold">{selectedEvent.registered}/{selectedEvent.capacity}</p>
                  <p className="text-xs text-slate-500">{selectedEvent.spotsLeft} spots left</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Price</p>
                  <p className="text-sm font-semibold">{selectedEvent.price === 0 ? "Free" : formatPrice(selectedEvent.price ?? 0)}</p>
                </div>
              </div>
              {selectedEvent.eventType === "POTLUCK" && (
                <div className="space-y-2">
                  <Label className="text-sm">What will you bring?</Label>
                  <Input placeholder="e.g., Paneer Tikka, Gulab Jamun..." className="text-sm" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm">Dietary Requirements (optional)</Label>
                <Textarea placeholder="Any dietary restrictions or allergies..." className="h-16 text-sm" />
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2" disabled={selectedEvent.spotsLeft === 0}>
                <Ticket className="w-4 h-4" />
                {selectedEvent.spotsLeft === 0 ? "Event Full - Join Waitlist" : "Register Now"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
