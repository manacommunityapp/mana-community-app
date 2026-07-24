import { useState, useEffect } from "react";
import {
  Refrigerator, Plus, AlertTriangle, ShoppingCart, Trash2,
  Search, Filter, Package, BarChart3, Apple, Clock, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { PantryItem, ShoppingList, ShoppingListItem, PantryAlert } from "../../../types/food";

const mockPantryItems: PantryItem[] = [
  { id: 1, userId: 1, itemName: "Toor Dal", category: "Pulses", quantity: 2, unit: "kg", purchaseDate: "2026-07-15", expiryDate: "2027-01-15", storageLocation: "PANTRY", status: "GOOD", daysUntilExpiry: 175, createdAt: "2026-07-15T10:00:00Z" },
  { id: 2, userId: 1, itemName: "Paneer", category: "Dairy", quantity: 1, unit: "pack", purchaseDate: "2026-07-22", expiryDate: "2026-07-28", storageLocation: "FRIDGE", status: "EXPIRING_SOON", daysUntilExpiry: 4, createdAt: "2026-07-22T10:00:00Z" },
  { id: 3, userId: 1, itemName: "Curd", category: "Dairy", quantity: 2, unit: "cups", purchaseDate: "2026-07-23", expiryDate: "2026-07-26", storageLocation: "FRIDGE", status: "EXPIRING_SOON", daysUntilExpiry: 2, createdAt: "2026-07-23T10:00:00Z" },
  { id: 4, userId: 1, itemName: "Brown Rice", category: "Grains", quantity: 5, unit: "kg", purchaseDate: "2026-07-01", expiryDate: "2026-12-01", storageLocation: "PANTRY", status: "GOOD", daysUntilExpiry: 130, createdAt: "2026-07-01T10:00:00Z" },
  { id: 5, userId: 1, itemName: "Milk", category: "Dairy", quantity: 1, unit: "litre", purchaseDate: "2026-07-24", expiryDate: "2026-07-25", storageLocation: "FRIDGE", status: "EXPIRED", daysUntilExpiry: -1, createdAt: "2026-07-24T10:00:00Z" },
  { id: 6, userId: 1, itemName: "Green Chillies", category: "Vegetables", quantity: 100, unit: "g", purchaseDate: "2026-07-22", expiryDate: "2026-07-30", storageLocation: "FRIDGE", status: "GOOD", daysUntilExpiry: 6, createdAt: "2026-07-22T10:00:00Z" },
  { id: 7, userId: 1, itemName: "Ghee", category: "Cooking Oil", quantity: 1, unit: "litre", purchaseDate: "2026-07-10", expiryDate: "2027-07-10", storageLocation: "PANTRY", status: "GOOD", daysUntilExpiry: 351, createdAt: "2026-07-10T10:00:00Z" },
  { id: 8, userId: 1, itemName: "Frozen Parathas", category: "Frozen", quantity: 1, unit: "pack", purchaseDate: "2026-07-18", expiryDate: "2026-09-18", storageLocation: "FREEZER", status: "GOOD", daysUntilExpiry: 56, createdAt: "2026-07-18T10:00:00Z" },
];

const mockShoppingList: ShoppingList = {
  id: 1, name: "Weekly Groceries", status: "ACTIVE",
  items: [
    { id: 1, itemName: "Milk", category: "Dairy", quantity: 2, unit: "litre", estimatedPrice: 100, isPurchased: false },
    { id: 2, itemName: "Atta (Whole Wheat)", category: "Grains", quantity: 5, unit: "kg", estimatedPrice: 250, isPurchased: false },
    { id: 3, itemName: "Onions", category: "Vegetables", quantity: 2, unit: "kg", estimatedPrice: 80, isPurchased: true, purchasedPrice: 76 },
    { id: 4, itemName: "Tomatoes", category: "Vegetables", quantity: 1, unit: "kg", estimatedPrice: 40, isPurchased: true, purchasedPrice: 45 },
    { id: 5, itemName: "Coriander Leaves", category: "Herbs", quantity: 2, unit: "bunch", estimatedPrice: 20, isPurchased: false },
  ],
  createdAt: "2026-07-24T08:00:00Z",
};

const mockAlerts: PantryAlert[] = [
  { id: 1, pantryItemId: 5, itemName: "Milk", alertType: "EXPIRED", message: "Milk expired yesterday. Consider discarding.", isRead: false, createdAt: "2026-07-25T06:00:00Z" },
  { id: 2, pantryItemId: 3, itemName: "Curd", alertType: "EXPIRING_SOON", message: "Curd expires in 2 days. Use it soon!", isRead: false, createdAt: "2026-07-24T06:00:00Z" },
  { id: 3, pantryItemId: 2, itemName: "Paneer", alertType: "EXPIRING_SOON", message: "Paneer expires in 4 days.", isRead: true, createdAt: "2026-07-24T06:00:00Z" },
];

function freshnessColor(days?: number): string {
  if (days === undefined) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  if (days < 0) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 3) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (days <= 7) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

function freshnessLabel(days?: number): string {
  if (days === undefined) return "No expiry";
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

const locationIcons: Record<string, string> = {
  FRIDGE: "bg-blue-50 dark:bg-blue-950/30",
  FREEZER: "bg-cyan-50 dark:bg-cyan-950/30",
  PANTRY: "bg-amber-50 dark:bg-amber-950/30",
  COUNTER: "bg-green-50 dark:bg-green-950/30",
};

export function SmartPantry() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [addItemOpen, setAddItemOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = mockPantryItems.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocation === "ALL" || item.storageLocation === filterLocation;
    return matchesSearch && matchesLocation;
  });

  const expiredCount = mockPantryItems.filter((i) => (i.daysUntilExpiry ?? 999) < 0).length;
  const expiringSoonCount = mockPantryItems.filter((i) => (i.daysUntilExpiry ?? 999) >= 0 && (i.daysUntilExpiry ?? 999) <= 3).length;
  const totalItems = mockPantryItems.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Smart Pantry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track inventory, reduce waste, shop smarter</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => setAddItemOpen(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: totalItems, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Expiring Soon", value: expiringSoonCount, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
          { label: "Expired", value: expiredCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Shopping List", value: mockShoppingList.items?.filter((i) => !i.isPurchased).length ?? 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {mockAlerts.filter((a) => !a.isRead).length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 space-y-2">
            {mockAlerts.filter((a) => !a.isRead).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${alert.alertType === "EXPIRED" ? "text-red-500" : "text-amber-500"}`} />
                <span className="text-sm flex-1">{alert.message}</span>
                <Button variant="ghost" size="sm" className="text-xs">Dismiss</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
          <TabsTrigger value="stats">Waste Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-sm" />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Locations</SelectItem>
                <SelectItem value="FRIDGE">Fridge</SelectItem>
                <SelectItem value="FREEZER">Freezer</SelectItem>
                <SelectItem value="PANTRY">Pantry</SelectItem>
                <SelectItem value="COUNTER">Counter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${locationIcons[item.storageLocation]} flex items-center justify-center`}>
                    <Refrigerator className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.itemName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.quantity} {item.unit}</span>
                      <Badge variant="outline" className="text-[10px]">{item.storageLocation}</Badge>
                      {item.category && <span className="text-xs text-slate-400">{item.category}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${freshnessColor(item.daysUntilExpiry)}`}>
                    {freshnessLabel(item.daysUntilExpiry)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shopping" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{mockShoppingList.name}</CardTitle>
                <CardDescription>{mockShoppingList.items?.filter((i) => i.isPurchased).length}/{mockShoppingList.items?.length} purchased</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2"><Plus className="w-3 h-3" /> Add Item</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockShoppingList.items?.map((item) => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${item.isPurchased ? "bg-green-50 dark:bg-green-950/10 opacity-70" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.isPurchased ? "border-green-500 bg-green-500" : "border-slate-300 dark:border-slate-600"}`}>
                      {item.isPurchased && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${item.isPurchased ? "line-through text-slate-400" : ""}`}>{item.itemName}</p>
                      <p className="text-xs text-slate-400">{item.quantity} {item.unit} - {item.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{item.isPurchased && item.purchasedPrice ? `Rs ${item.purchasedPrice}` : `~Rs ${item.estimatedPrice}`}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" /> Consumption Stats
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Items Consumed", value: 42, total: 50, color: "bg-green-500" },
                  { label: "Items Wasted", value: 3, total: 50, color: "bg-red-500" },
                  { label: "Items Donated", value: 5, total: 50, color: "bg-blue-500" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stat.label}</span>
                      <span className="text-sm font-bold">{stat.value}</span>
                    </div>
                    <Progress value={(stat.value / stat.total) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Apple className="w-4 h-4 text-red-500" /> Waste Reduction
                </CardTitle>
                <CardDescription>Your waste score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-50 dark:bg-green-950/20 mb-3">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">94%</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Excellent</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Only 6% waste this month</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Estimated savings</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rs 1,240</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pantry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Item Name</Label>
              <Input placeholder="e.g., Basmati Rice" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Quantity</Label>
                <Input type="number" placeholder="1" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Unit</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "litre", "ml", "pack", "pcs", "bunch", "dozen"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Purchase Date</Label>
                <Input type="date" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Expiry Date</Label>
                <Input type="date" className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Storage Location</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRIDGE">Fridge</SelectItem>
                  <SelectItem value="FREEZER">Freezer</SelectItem>
                  <SelectItem value="PANTRY">Pantry</SelectItem>
                  <SelectItem value="COUNTER">Counter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Add to Pantry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
