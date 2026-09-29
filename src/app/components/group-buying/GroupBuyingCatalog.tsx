import { useState, useEffect } from "react";
import {
  ShoppingBag,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  ThumbsUp,
  Plus,
  Tag,
  Package,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import {
  groupBuyingService,
  type GroupDeal,
  type GroupOrder,
  type DemandItem,
} from "../../../services/group-buying/groupBuyingService";
import { useAuth } from "../../../contexts/AuthContext";

export function GroupBuyingCatalog() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [myOrders, setMyOrders] = useState<GroupOrder[]>([]);
  const [demandBoard, setDemandBoard] = useState<DemandItem[]>([]);
  const [activeTab, setActiveTab] = useState("deals");

  const [selectedDeal, setSelectedDeal] = useState<GroupDeal | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [qrOrder, setQrOrder] = useState<GroupOrder | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [demandTitle, setDemandTitle] = useState("");
  const [demandDescription, setDemandDescription] = useState("");
  const [demandCategory, setDemandCategory] = useState("Groceries");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDeals(groupBuyingService.getDeals());
    setMyOrders(groupBuyingService.getMyOrders(user?.userId || "user-1"));
    setDemandBoard(groupBuyingService.getDemandBoard());
  };

  const handleOpenJoin = (deal: GroupDeal) => {
    setSelectedDeal(deal);
    setOrderQuantity(1);
    setJoinSuccess(false);
    setIsJoining(true);
  };

  const handleConfirmJoin = () => {
    if (!selectedDeal) return;
    groupBuyingService.joinDeal(selectedDeal.id, orderQuantity, user?.userId || "user-1");
    setJoinSuccess(true);
    loadData();
    setTimeout(() => {
      setIsJoining(false);
      setJoinSuccess(false);
      setActiveTab("orders");
    }, 1200);
  };

  const handleUpvote = (id: string) => {
    groupBuyingService.upvoteDemand(id);
    setDemandBoard(groupBuyingService.getDemandBoard());
  };

  const handleCreateDemand = () => {
    if (!demandTitle.trim()) return;
    const newItem: DemandItem = {
      id: "dem-" + Date.now(),
      title: demandTitle,
      description: demandDescription || "Community requested group deal.",
      category: demandCategory,
      requestedBy: user?.fullName || "Resident",
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    setDemandBoard([newItem, ...demandBoard]);
    setIsRequestModalOpen(false);
    setDemandTitle("");
    setDemandDescription("");
  };

  const getActiveTier = (deal: GroupDeal) => {
    const p = deal.currentParticipants;
    return deal.tiers.find(
      (t) => p >= t.minQty && (t.maxQty === null || p <= t.maxQty)
    ) || deal.tiers[0];
  };

  const getNextTier = (deal: GroupDeal) => {
    const p = deal.currentParticipants;
    return deal.tiers.find((t) => t.minQty > p);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-emerald-200" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mana Community Group Buying</h1>
          </div>
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl">
            Bulk buying power unlocked by our community. Tier discounts grow as more neighbours join the deal!
          </p>
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-md text-base px-6 py-6 rounded-xl flex items-center gap-2"
          onClick={() => setIsRequestModalOpen(true)}
        >
          <Plus className="w-5 h-5 text-emerald-700" />
          Request a Deal
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="deals" className="py-2.5 font-semibold gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Active Deals ({deals.filter((d) => d.status === "ACTIVE").length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="py-2.5 font-semibold gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            My Orders ({myOrders.length})
          </TabsTrigger>
          <TabsTrigger value="demand" className="py-2.5 font-semibold gap-2">
            <TrendingDown className="w-4 h-4 text-purple-600" />
            Demand Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const activeTier = getActiveTier(deal);
              const nextTier = getNextTier(deal);
              const progressPct = Math.min(
                100,
                Math.round((deal.currentParticipants / deal.targetParticipants) * 100)
              );

              return (
                <Card key={deal.id} className="border hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
                  <div>
                    <div
                      className="h-28 w-full flex items-center justify-between p-4 text-white relative"
                      style={{ backgroundColor: deal.imagePlaceholderColor || "#10b981" }}
                    >
                      <Badge className="bg-black/30 backdrop-blur-md text-white border-0 text-xs">
                        {deal.category}
                      </Badge>
                      <Badge className="bg-white text-slate-800 font-bold shadow text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Ends in {Math.max(1, Math.ceil((new Date(deal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-slate-900 line-clamp-1">{deal.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {deal.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-baseline justify-between p-3 bg-slate-50 rounded-xl border">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Current Price</p>
                          <p className="text-2xl font-black text-emerald-600">₹{activeTier.pricePerUnit}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-xs">
                          {activeTier.label} Tier
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            {deal.currentParticipants} Joined
                          </span>
                          <span className="text-slate-500">Goal: {deal.targetParticipants}</span>
                        </div>
                        <Progress value={progressPct} className="h-2 bg-slate-100" />
                        {nextTier && (
                          <p className="text-[11px] text-slate-500">
                            Need <strong className="text-slate-700">{nextTier.minQty - deal.currentParticipants} more</strong> to unlock ₹{nextTier.pricePerUnit} ({nextTier.label})
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Tier Pricing</span>
                        <div className="grid grid-cols-3 gap-1 pt-1 text-center font-medium">
                          {deal.tiers.map((t, idx) => (
                            <div
                              key={idx}
                              className={`p-1.5 rounded border ${
                                t.label === activeTier.label
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold"
                                  : "bg-white text-slate-500 border-slate-200"
                              }`}
                            >
                              <div className="text-[10px]">{t.label}</div>
                              <div className="text-xs font-bold">₹{t.pricePerUnit}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          By: <strong>{deal.vendor}</strong>
                          <span className="flex items-center text-amber-500"><Star className="w-3 h-3 fill-current inline" /> {deal.vendorRating}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {deal.pickupPoints[0]}
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-sm shadow-sm"
                      onClick={() => handleOpenJoin(deal)}
                    >
                      Join Deal at ₹{activeTier.pricePerUnit} &rarr;
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 pt-4">
          {myOrders.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-semibold text-slate-700">No group orders yet</p>
              <p className="text-xs text-slate-500 mt-1">Join an active deal to start saving with your community.</p>
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("deals")}>
                Browse Active Deals
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myOrders.map((ord) => (
                <Card key={ord.id} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs">{ord.id}</Badge>
                      <Badge className="bg-blue-600 font-semibold text-xs">{ord.status}</Badge>
                    </div>
                    <CardTitle className="text-base text-slate-900 pt-2">{ord.dealTitle}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Ordered on {new Date(ord.orderedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-500">Quantity:</span>
                        <strong className="text-slate-800 ml-1">{ord.quantity} unit(s)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Total:</span>
                        <strong className="text-emerald-700 ml-1 font-bold text-sm">₹{ord.totalAmount}</strong>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full font-semibold text-xs gap-2 border-slate-300"
                      onClick={() => setQrOrder(ord)}
                    >
                      <QrCode className="w-4 h-4 text-slate-700" />
                      View Pickup QR Code
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="demand" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Resident Demand Board</h3>
              <p className="text-xs text-slate-500">Upvote products you want vendors to supply at group discount rates.</p>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 font-semibold"
              onClick={() => setIsRequestModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Propose Product
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demandBoard.map((item) => (
              <Card key={item.id} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    <span className="text-xs text-slate-400">By {item.requestedBy}</span>
                  </div>
                  <CardTitle className="text-base text-slate-900 pt-1">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs text-slate-600">
                  <p>{item.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold text-slate-700">{item.upvotes} Neighbours interested</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-xs gap-1.5"
                      onClick={() => handleUpvote(item.id)}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-purple-600" />
                      Upvote ({item.upvotes})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isJoining} onOpenChange={setIsJoining}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Join Group Deal</DialogTitle>
            <DialogDescription>
              {selectedDeal?.title}
            </DialogDescription>
          </DialogHeader>

          {joinSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">Deal Joined Successfully!</h3>
              <p className="text-xs text-slate-500">Your order has been recorded. Check My Orders for pickup QR code.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {selectedDeal && (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-emerald-800 font-semibold">Current Price:</span>
                      <strong className="text-emerald-900 font-bold text-sm">₹{getActiveTier(selectedDeal).pricePerUnit} / unit</strong>
                    </div>
                    <p className="text-emerald-700 text-[11px]">
                      If more neighbours join before deadline, your final price will automatically drop!
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      >
                        -
                      </Button>
                      <span className="font-bold text-base text-slate-800 w-8 text-center">{orderQuantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderQuantity(orderQuantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Pickup Point:</span>
                      <strong>{selectedDeal.pickupPoints[0]}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Date:</span>
                      <strong>{new Date(selectedDeal.deliveryDate).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t text-sm">
                      <span>Estimated Total:</span>
                      <span className="text-emerald-700">₹{getActiveTier(selectedDeal).pricePerUnit * orderQuantity}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!joinSuccess && (
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsJoining(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handleConfirmJoin}>
                Confirm Order
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrOrder} onOpenChange={() => setQrOrder(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Collection QR Code</DialogTitle>
            <DialogDescription>{qrOrder?.dealTitle}</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 shadow-inner">
              <QrCode className="w-28 h-28 text-slate-800" />
              <span className="font-mono font-bold text-xs text-slate-600 mt-2">{qrOrder?.qrCode}</span>
            </div>
            <p className="text-xs text-slate-500">Present this code at the community pickup desk to collect your parcel.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Request a Group Deal</DialogTitle>
            <DialogDescription>Let vendors know what products our community wants to buy in bulk.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Product Name</label>
              <Input
                placeholder="e.g. A2 Desi Cow Ghee"
                value={demandTitle}
                onChange={(e) => setDemandTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <Input
                placeholder="e.g. Groceries, Electronics, Home"
                value={demandCategory}
                onChange={(e) => setDemandCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Description & Requirements</label>
              <Input
                placeholder="e.g. Looking for authentic farm source..."
                value={demandDescription}
                onChange={(e) => setDemandDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 font-bold" onClick={handleCreateDemand}>Post Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
