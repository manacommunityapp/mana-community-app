import { useState, useEffect } from 'react';
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
  Flame,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import {
  groupBuyingService,
  type GroupDeal,
  type GroupOrder,
  type DemandItem,
  type CommunitySavings,
  type VendorOffer,
} from '../../../services/group-buying/groupBuyingService';
import { useAuth } from '../../../contexts/AuthContext';

export function GroupBuyingCatalog() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [myOrders, setMyOrders] = useState<GroupOrder[]>([]);
  const [demandBoard, setDemandBoard] = useState<DemandItem[]>([]);
  const [savings, setSavings] = useState<CommunitySavings | null>(null);
  const [activeTab, setActiveTab] = useState('deals');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedDeal, setSelectedDeal] = useState<GroupDeal | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [qrOrder, setQrOrder] = useState<GroupOrder | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [demandTitle, setDemandTitle] = useState('');
  const [demandDescription, setDemandDescription] = useState('');
  const [demandCategory, setDemandCategory] = useState('Groceries');
  const [demandExpectedQty, setDemandExpectedQty] = useState('');
  const [demandPriceMin, setDemandPriceMin] = useState('');
  const [demandPriceMax, setDemandPriceMax] = useState('');

  const [selectedDemandForBids, setSelectedDemandForBids] = useState<DemandItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [d, o, dem, s] = await Promise.all([
      groupBuyingService.getDeals(),
      groupBuyingService.getMyOrders(user?.userId),
      groupBuyingService.getDemandBoard(),
      groupBuyingService.getCommunitySavings(),
    ]);
    setDeals(d);
    setMyOrders(o);
    setDemandBoard(dem);
    setSavings(s);
  };

  const handleOpenJoin = (deal: GroupDeal) => {
    setSelectedDeal(deal);
    setOrderQuantity(1);
    setJoinSuccess(false);
    setIsJoining(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedDeal) return;
    await groupBuyingService.joinDeal(selectedDeal.id, orderQuantity, user?.userId);
    setJoinSuccess(true);
    await loadData();
    setTimeout(() => {
      setIsJoining(false);
      setJoinSuccess(false);
      setActiveTab('orders');
    }, 1000);
  };

  const handleUpvote = async (id: string) => {
    await groupBuyingService.upvoteDemand(id);
    const updated = await groupBuyingService.getDemandBoard();
    setDemandBoard(updated);
  };

  const handleCreateDemand = async () => {
    if (!demandTitle.trim()) return;
    await groupBuyingService.createDemand({
      title: demandTitle.trim(),
      category: demandCategory,
      description: demandDescription || undefined,
      expectedQty: demandExpectedQty ? parseInt(demandExpectedQty) : undefined,
      preferredPriceMin: demandPriceMin ? parseInt(demandPriceMin) : undefined,
      preferredPriceMax: demandPriceMax ? parseInt(demandPriceMax) : undefined,
    });
    setIsRequestModalOpen(false);
    setDemandTitle('');
    setDemandDescription('');
    setDemandExpectedQty('');
    setDemandPriceMin('');
    setDemandPriceMax('');
    await loadData();
  };

  const categories = ['All', 'Groceries', 'Fresh Produce', 'Dairy & Bakery', 'Home & Kitchen', 'Festive Special'];

  const filteredDeals = deals.filter(deal => {
    if (selectedCategory === 'All') return true;
    return deal.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* ── Community Savings Hero Banner ── */}
      {savings && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span>COMMUNITY WHOLESALE SAVINGS</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Mana Group Buy Network</h1>
              <p className="max-w-xl text-sm text-purple-100">
                Combine demand with your neighbours to unlock farm-direct wholesale pricing. Buy together, save together.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-md text-center">
              <div>
                <p className="text-2xl font-black">₹{(savings.totalSavedThisMonth / 1000).toFixed(0)}K</p>
                <p className="text-xs text-purple-200">Saved This Month</p>
              </div>
              <div className="border-x border-white/20 px-3">
                <p className="text-2xl font-black">{savings.totalOrders}</p>
                <p className="text-xs text-purple-200">Orders Placed</p>
              </div>
              <div>
                <p className="text-2xl font-black">{savings.activeDeals}</p>
                <p className="text-xs text-purple-200">Active Deals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="deals" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Active Group Deals</span>
              <Badge variant="secondary" className="ml-1 text-xs">{deals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="demand" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Community Demand Board</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Package className="h-4 w-4 text-green-600" />
              <span>My Orders & Passes</span>
              {myOrders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{myOrders.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'demand' && (
            <Button onClick={() => setIsRequestModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Propose Product
            </Button>
          )}
        </div>

        {/* ── TAB 1: ACTIVE DEALS ── */}
        <TabsContent value="deals" className="space-y-6">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDeals.map(deal => {
              const progressPct = Math.min(100, Math.round((deal.committedQty / deal.targetQty) * 100));
              const discountPct = Math.round(((deal.mrp - deal.currentTierPrice) / deal.mrp) * 100);

              return (
                <Card key={deal.id} className="flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-slate-50 text-xs font-semibold text-slate-700">
                        {deal.category}
                      </Badge>
                      {deal.isAlmostUnlocked ? (
                        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300 text-xs flex items-center gap-1">
                          <Flame className="h-3 w-3 text-amber-600" /> Almost Unlocked
                        </Badge>
                      ) : (
                        <div className="flex items-center text-xs text-slate-500 gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{deal.daysLeft}d left</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 mt-2">{deal.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs text-slate-600">
                      {deal.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Price and Savings Box */}
                    <div className="flex items-baseline justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <div>
                        <div className="text-xs text-slate-400 line-through">MRP ₹{deal.mrp}</div>
                        <div className="text-2xl font-extrabold text-purple-700">₹{deal.currentTierPrice}</div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-bold">
                        {discountPct}% OFF
                      </Badge>
                    </div>

                    {/* Quantity Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span><strong className="text-slate-900">{deal.committedQty}</strong> / {deal.targetQty} {deal.moqLabel ?? 'units'}</span>
                        <span className="text-purple-700 font-semibold">{progressPct}% reached</span>
                      </div>
                      <Progress value={progressPct} className="h-2 bg-slate-100" />
                      {deal.nextTierPrice && (
                        <p className="text-[11px] text-emerald-700 font-medium pt-0.5">
                          🔥 Unlock ₹{deal.nextTierPrice} with {deal.nextTierUnitsNeeded} more units
                        </p>
                      )}
                    </div>

                    {/* Vendor and Pickup */}
                    <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-700">{deal.vendor}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Star className="h-3.5 w-3.5 fill-amber-400" /> {deal.vendorRating}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Pickup: {deal.pickupPoint}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button onClick={() => handleOpenJoin(deal)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                      Join Group Buy <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 2: DEMAND BOARD ── */}
        <TabsContent value="demand" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {demandBoard.map(item => (
              <Card key={item.id} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1.5">{item.category}</Badge>
                      <CardTitle className="text-base font-bold text-slate-900">{item.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpvote(item.id)}
                      className="flex items-center gap-1.5 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="font-bold">{item.upvotes}</span>
                    </Button>
                  </div>
                  <CardDescription className="text-xs text-slate-600 mt-1">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md">
                    <span>👥 {item.interestedResidents ?? 1} residents</span>
                    <span>📦 {item.expectedQty ?? 1} units expected</span>
                    {item.preferredPriceMin && <span>💰 Target: ₹{item.preferredPriceMin}–₹{item.preferredPriceMax}</span>}
                  </div>
                  {item.vendorOffers && item.vendorOffers.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs font-semibold text-emerald-700">
                        ⚡ {item.vendorOffers.length} competing vendor bid{item.vendorOffers.length > 1 ? 's' : ''}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDemandForBids(item)} className="text-xs text-purple-600">
                        View Bids →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 3: MY ORDERS & PASSES ── */}
        <TabsContent value="orders" className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-800">No Orders Placed Yet</h3>
              <p className="mt-1 text-xs text-slate-500">Join any active group deal to save wholesale and get your pickup QR pass.</p>
              <Button onClick={() => setActiveTab('deals')} className="mt-4 bg-purple-600 text-white hover:bg-purple-700">
                Browse Active Deals
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myOrders.map(order => (
                <Card key={order.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-slate-400">{order.id}</span>
                        <CardTitle className="text-base font-bold text-slate-900 mt-0.5">{order.dealTitle || order.title}</CardTitle>
                      </div>
                      <Badge className={order.status === 'PICKED_UP' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                        {order.status === 'PICKED_UP' ? 'COLLECTED ✓' : 'CONFIRMED'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-600 pt-0">
                    <div className="flex justify-between">
                      <span>Quantity: <strong className="text-slate-800">{order.quantity} units</strong></span>
                      <span>Total: <strong className="text-purple-700 font-bold">₹{order.totalAmount.toLocaleString()}</strong></span>
                    </div>
                    {order.pickupPoint && (
                      <div className="flex items-center gap-1 text-slate-500 pt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Pickup: {order.pickupPoint}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" onClick={() => setQrOrder(order)} className="w-full flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                      <QrCode className="h-4 w-4" /> Show Digital Pickup Pass
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Join Deal Dialog ── */}
      <Dialog open={isJoining} onOpenChange={setIsJoining}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
            <DialogDescription>
              Confirm your quantity to join this wholesale group deal.
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-600">Unit Price:</span>
                <span className="text-lg font-bold text-purple-700">₹{selectedDeal.currentTierPrice}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Quantity:</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setOrderQuantity(q => Math.max(1, q - 1))}>-</Button>
                  <span className="w-8 text-center font-bold text-base">{orderQuantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setOrderQuantity(q => q + 1)}>+</Button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{(selectedDeal.currentTierPrice * orderQuantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium text-xs">
                  <span>You Save vs MRP:</span>
                  <span>₹{((selectedDeal.mrp - selectedDeal.currentTierPrice) * orderQuantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoining(false)}>Cancel</Button>
            <Button onClick={handleConfirmJoin} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Confirm & Pay ₹{selectedDeal ? (selectedDeal.currentTierPrice * orderQuantity).toLocaleString() : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Pickup Pass Dialog ── */}
      <Dialog open={!!qrOrder} onOpenChange={() => setQrOrder(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Digital Pickup Pass</DialogTitle>
            <DialogDescription>
              Show this pass at the pickup desk to collect your order.
            </DialogDescription>
          </DialogHeader>

          {qrOrder && (
            <div className="space-y-4 py-3">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                <QrCode className="h-28 w-28 text-slate-800" />
              </div>
              <p className="font-mono text-xs text-slate-400">{qrOrder.qrCode}</p>

              <div className="rounded-lg bg-slate-50 p-3 text-left text-xs space-y-1 text-slate-700">
                <div className="flex justify-between"><span>Order:</span><strong className="font-mono">{qrOrder.id}</strong></div>
                <div className="flex justify-between"><span>Product:</span><strong>{qrOrder.dealTitle || qrOrder.title}</strong></div>
                <div className="flex justify-between"><span>Quantity:</span><strong>{qrOrder.quantity} units</strong></div>
                <div className="flex justify-between"><span>Total:</span><strong>₹{qrOrder.totalAmount.toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Propose Demand Modal ── */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Propose a Bulk Product</DialogTitle>
            <DialogDescription>
              Tell your neighbours what you want to buy in bulk. When enough people upvote, we bring supplier quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Product name (e.g. 5KG Basmati Rice)" value={demandTitle} onChange={(e) => setDemandTitle(e.target.value)} />
            <Input placeholder="Category (e.g. Groceries)" value={demandCategory} onChange={(e) => setDemandCategory(e.target.value)} />
            <Input placeholder="Expected Quantity needed (e.g. 50)" value={demandExpectedQty} onChange={(e) => setDemandExpectedQty(e.target.value)} type="number" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Target Min Price (₹)" value={demandPriceMin} onChange={(e) => setDemandPriceMin(e.target.value)} type="number" />
              <Input placeholder="Target Max Price (₹)" value={demandPriceMax} onChange={(e) => setDemandPriceMax(e.target.value)} type="number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDemand} className="bg-purple-600 hover:bg-purple-700 text-white">
              Submit Demand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Competing Bids Modal ── */}
      <Dialog open={!!selectedDemandForBids} onOpenChange={() => setSelectedDemandForBids(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Competing Vendor Quotes</DialogTitle>
            <DialogDescription>{selectedDemandForBids?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedDemandForBids?.vendorOffers?.map(offer => (
              <div key={offer.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{offer.vendorName}</h4>
                    <p className="text-xs text-slate-500">MOQ: {offer.minimumQty} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-purple-700">₹{offer.offeredPrice}</p>
                    {offer.isBestValue && <Badge className="bg-amber-100 text-amber-800 text-[10px]">👑 Best Value</Badge>}
                  </div>
                </div>
                {offer.terms && <p className="text-xs text-slate-600 italic">"{offer.terms}"</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
