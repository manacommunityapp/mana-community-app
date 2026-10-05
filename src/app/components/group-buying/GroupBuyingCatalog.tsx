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
  RefreshCw,
  Gift,
  Calendar,
  Layers,
  HeartHandshake
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
import { groupBuyingService } from '../../../services/group-buying/groupBuyingService';
import type {
  GroupDeal,
  GroupOrder,
  DemandItem,
  CommunitySavings,
  BuyAgainItem,
  MonthlyBasket,
  FestivalCategory
} from '../../../services/group-buying/groupBuyingService';
import { useAuth } from '../../../contexts/AuthContext';

export function GroupBuyingCatalog() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [myOrders, setMyOrders] = useState<GroupOrder[]>([]);
  const [demandBoard, setDemandBoard] = useState<DemandItem[]>([]);
  const [savings, setSavings] = useState<CommunitySavings | null>(null);
  const [buyAgainList, setBuyAgainList] = useState<BuyAgainItem[]>([]);
  const [monthlyBaskets, setMonthlyBaskets] = useState<MonthlyBasket[]>([]);
  const [festivals, setFestivals] = useState<FestivalCategory[]>([]);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [d, o, dem, s, ba, mb, fest] = await Promise.all([
      groupBuyingService.getDeals(),
      groupBuyingService.getMyOrders(user?.userId),
      groupBuyingService.getDemandBoard(),
      groupBuyingService.getCommunitySavings(),
      groupBuyingService.getBuyAgainSuggestions(),
      groupBuyingService.getMonthlyBaskets(),
      groupBuyingService.getFestivalCategories(),
    ]);
    setDeals(d);
    setMyOrders(o);
    setDemandBoard(dem);
    setSavings(s);
    setBuyAgainList(ba);
    setMonthlyBaskets(mb);
    setFestivals(fest);
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
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandTitle) return;

    await groupBuyingService.createDemand({
      title: demandTitle,
      description: demandDescription,
      category: demandCategory,
      expectedQty: parseInt(demandExpectedQty) || 1,
      preferredPriceMin: parseFloat(demandPriceMin) || undefined,
      preferredPriceMax: parseFloat(demandPriceMax) || undefined,
      requestedBy: user?.fullName || 'Resident',
    });

    setIsRequestModalOpen(false);
    setDemandTitle('');
    setDemandDescription('');
    setDemandExpectedQty('');
    setDemandPriceMin('');
    setDemandPriceMax('');
    await loadData();
  };

  const handleUpvote = async (demandId: string) => {
    await groupBuyingService.upvoteDemand(demandId);
    setDemandBoard(prev =>
      prev.map(d => (d.id === demandId ? { ...d, upvotes: d.upvotes + 1, hasUpvoted: true } : d))
    );
  };

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))];
  const filteredDeals =
    selectedCategory === 'All' ? deals : deals.filter(d => d.category === selectedCategory);
  const almostUnlockedDeals = deals.filter(d => d.isAlmostUnlocked);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Top Hero & Community Savings Banner ── */}
      {savings && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 p-6 text-white shadow-xl sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Gated Society Wholesale Collective</span>
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
          <TabsList className="bg-slate-100 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="deals" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <ShoppingBag className="h-3.5 w-3.5 text-purple-600" />
              <span>All Deals</span>
              <Badge variant="secondary" className="ml-1 text-[10px]">{deals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="almost-unlocked" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>🔥 Almost Unlocked</span>
              <Badge className="ml-1 bg-amber-500 text-white text-[10px]">{almostUnlockedDeals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="buy-again" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
              <span>🔁 Buy Again</span>
            </TabsTrigger>
            <TabsTrigger value="baskets" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <Package className="h-3.5 w-3.5 text-indigo-600" />
              <span>🧺 Monthly Baskets</span>
            </TabsTrigger>
            <TabsTrigger value="festivals" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <Gift className="h-3.5 w-3.5 text-rose-500" />
              <span>🪔 Festival Buying</span>
            </TabsTrigger>
            <TabsTrigger value="demand" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>Community Demand</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1.5 data-[state=active]:bg-white text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
              <span>My Orders</span>
              {myOrders.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{myOrders.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'demand' && (
            <Button onClick={() => setIsRequestModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Propose Product
            </Button>
          )}
        </div>

        {/* ── TAB 1: ACTIVE DEALS ── */}
        <TabsContent value="deals" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={"rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer " +
                  (selectedCategory === cat
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
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
                <Card key={deal.id} className="flex flex-col justify-between border-slate-200 shadow-xs hover:shadow-md transition rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-slate-50 text-[11px] font-bold text-slate-700">
                        {deal.category}
                      </Badge>
                      {deal.isAlmostUnlocked ? (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Flame className="h-3 w-3 text-amber-600" /> Almost Unlocked
                        </Badge>
                      ) : (
                        <div className="flex items-center text-xs text-slate-500 gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{deal.daysLeft}d left</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 mt-2">{deal.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs text-slate-600">
                      {deal.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-baseline justify-between rounded-xl bg-purple-50/70 p-3">
                      <div>
                        <span className="text-2xl font-black text-purple-900">₹{deal.currentTierPrice}</span>
                        <span className="ml-2 text-xs text-slate-400 line-through">₹{deal.mrp}</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                        Save {discountPct}%
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{deal.committedQty} ordered</span>
                        <span className="text-purple-600">{deal.targetQty} MOQ target</span>
                      </div>
                      <Progress value={progressPct} className="h-2 bg-slate-100" />
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>Supplier: <b>{deal.vendor}</b></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>Pickup: {deal.pickupPoint}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleOpenJoin(deal)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
                    >
                      Join Deal
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 2: ALMOST UNLOCKED FEED ── */}
        <TabsContent value="almost-unlocked" className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-950">🔥 Threshold Sprint: Almost Unlocked Deals</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  These deals are just a few units away from stepping down into a lower wholesale tier for all participating neighbours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {almostUnlockedDeals.map(deal => {
              const needed = deal.nextTierUnitsNeeded ?? (deal.targetQty - deal.committedQty);
              const nextPrice = deal.nextTierPrice ?? deal.currentTierPrice;

              return (
                <div
                  key={deal.id}
                  className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                        🔥 {needed} units to unlock ₹{nextPrice}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Ends in {deal.daysLeft}d</span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900">{deal.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{deal.description}</p>
                    </div>

                    {/* Step-down Price Comparison */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Tier</div>
                        <div className="text-lg font-bold text-slate-700">₹{deal.currentTierPrice}</div>
                      </div>
                      <div className="text-center px-4">
                        <ArrowRight className="w-5 h-5 text-amber-500 mx-auto" />
                        <span className="text-[10px] font-bold text-amber-600">Unlocks Next</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Next Tier Rate</div>
                        <div className="text-2xl font-black text-emerald-600">₹{nextPrice}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700">{deal.committedQty} of {deal.targetQty} units ordered</span>
                        <span className="text-amber-600 font-extrabold">{needed} more needed</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                          style={{ width: Math.min(100, Math.round((deal.committedQty / deal.targetQty) * 100)) + '%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 mt-4">
                    <Button
                      onClick={() => handleOpenJoin(deal)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                    >
                      Join Deal Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => alert('Deal link copied to clipboard! Share with your tower WhatsApp group to unlock faster.')}
                      className="border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share with Tower
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 3: BUY AGAIN ── */}
        <TabsContent value="buy-again" className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-950">🔁 Smart Reorder: Household Consumption Staples</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Replenish monthly essentials at guaranteed community bulk rates based on your previous order cycle.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {buyAgainList.map(item => (
              <div
                key={item.dealId}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Last bought {item.daysAgo} days ago
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">
                      ₹{item.currentPrice ?? item.lastPrice}
                    </span>
                    <span className="text-xs text-slate-400">previous rate: ₹{item.lastPrice}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {item.isAvailable ? (
                    <Button
                      onClick={() => {
                        const targetDeal = deals.find(d => d.id === item.dealId) || deals[0];
                        handleOpenJoin(targetDeal);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      Join Similar Deal
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDemandTitle(item.title);
                        setDemandCategory(item.category);
                        setIsRequestModalOpen(true);
                      }}
                      className="border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Start Demand for This Item
                    </Button>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {item.isAvailable ? '✓ Deal Live' : 'Not in active deal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 4: MONTHLY COMMUNITY BASKETS ── */}
        <TabsContent value="baskets" className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-indigo-950">🧺 Mana Monthly Family Essential Baskets</h3>
              <p className="text-xs text-indigo-800 mt-0.5">
                Complete monthly pantry boxes curated with wholesale staples, delivered directly to society clubhouse every month.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {monthlyBaskets.map(basket => (
              <div
                key={basket.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                      {basket.nextDeliveryDate}
                    </span>
                    <Badge className="bg-emerald-600 text-white font-bold text-xs">
                      Save ₹{basket.savings} / month
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900">{basket.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{basket.description}</p>
                  </div>

                  {/* Items included */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Included In Basket ({basket.items.length} Items):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                      {basket.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress towards target families */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">{basket.enrolledFamilies} Families Subscribed</span>
                      <span className="text-indigo-600">{basket.targetFamilies} Families Goal</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: ((basket.enrolledFamilies / basket.targetFamilies) * 100) + '%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 line-through">Regular: ₹{basket.regularPrice}</div>
                    <div className="text-2xl font-black text-indigo-600">₹{basket.communityPrice} <span className="text-xs text-slate-500 font-normal">/ basket</span></div>
                  </div>
                  <Button
                    onClick={() => alert('Enrolled in Mana Monthly Basket for ' + basket.title)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20"
                  >
                    Subscribe to Basket
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 5: FESTIVAL BUYING ── */}
        <TabsContent value="festivals" className="space-y-6">
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-3xl p-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-950">🪔 Festive Community Bulk Procurement</h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Diwali, Sankranti, and Ugadi wholesale sweets, dry fruits hampers, artisanal clay diyas, and pooja boxes.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {festivals.map(fest => (
              <div key={fest.id} className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-lg font-black text-slate-900">{fest.festivalName}</h4>
                  <p className="text-xs text-slate-500">{fest.tagline}</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {fest.deals.map(deal => (
                    <Card key={deal.id} className="border-slate-200 shadow-xs hover:shadow-md transition rounded-2xl overflow-hidden flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {deal.subCategory ?? 'Festive Special'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{deal.daysLeft}d left</span>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 mt-2">{deal.title}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">{deal.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-baseline justify-between rounded-xl bg-rose-50 p-3">
                          <div>
                            <span className="text-2xl font-black text-rose-900">₹{deal.currentTierPrice}</span>
                            <span className="ml-2 text-xs text-slate-400 line-through">₹{deal.mrp}</span>
                          </div>
                          <Badge className="bg-rose-600 text-white text-[10px]">Festive MOQ</Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          onClick={() => handleOpenJoin(deal)}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                        >
                          Join Festive Deal
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 6: DEMAND BOARD ── */}
        <TabsContent value="demand" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demandBoard.map(dem => (
              <Card key={dem.id} className="border-slate-200 shadow-xs flex flex-col justify-between rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] font-bold">{dem.category}</Badge>
                    <span className="text-xs text-slate-400">By {dem.requestedBy}</span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-2">{dem.title}</CardTitle>
                  <CardDescription className="text-xs">{dem.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-xs">
                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                    <span>Target Upvotes: <b>{dem.targetUpvotes ?? 25}</b></span>
                    <span>Current: <b className="text-purple-600">{dem.upvotes}</b></span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    onClick={() => handleUpvote(dem.id)}
                    variant={dem.hasUpvoted ? "outline" : "default"}
                    className={"w-full text-xs font-bold rounded-xl " + (dem.hasUpvoted ? "text-purple-600 border-purple-200" : "bg-purple-600 hover:bg-purple-700 text-white")}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    {dem.hasUpvoted ? "Upvoted" : "Upvote Demand"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 7: MY ORDERS & QR PASSES ── */}
        <TabsContent value="orders" className="space-y-6">
          {myOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Orders Yet</h3>
              <p className="text-xs text-slate-500 mt-1">Join an active group deal to see your order pickup passes here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myOrders.map(order => (
                <Card key={order.id} className="border-slate-200 shadow-xs rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      {order.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{order.dealTitle || order.title}</h4>
                  <div className="text-xs text-slate-500 mt-1">
                    Qty: {order.quantity} • Total: ₹{order.totalAmount}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      onClick={() => setQrOrder(order)}
                      variant="outline"
                      className="text-xs font-bold flex items-center gap-1.5 rounded-xl"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-600" /> View Pickup Pass
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Join Deal Modal ── */}
      {selectedDeal && (
        <Dialog open={isJoining} onOpenChange={setIsJoining}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900">Join Group Buy</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Lock your units to help unlock the lowest community price tier.
              </DialogDescription>
            </DialogHeader>

            {joinSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Order Confirmed!</h3>
                <p className="text-xs text-slate-500">
                  Your pickup pass has been generated. You can view it under "My Orders & Passes".
                </p>
                <Button onClick={() => setIsJoining(false)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50 rounded-xl space-y-1">
                  <div className="font-bold text-purple-900">{selectedDeal.title}</div>
                  <div className="text-purple-700">Community Price: ₹{selectedDeal.currentTierPrice} / unit</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="rounded-xl font-bold"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold">
                  <span>Total Amount Payable:</span>
                  <span className="text-lg text-purple-900">₹{selectedDeal.currentTierPrice * orderQuantity}</span>
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="outline" onClick={() => setIsJoining(false)} className="rounded-xl text-xs">Cancel</Button>
                  <Button onClick={handleConfirmJoin} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
                    Confirm & Reserve Stock
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* ── QR Pickup Pass Modal ── */}
      {qrOrder && (
        <Dialog open={!!qrOrder} onOpenChange={() => setQrOrder(null)}>
          <DialogContent className="sm:max-w-xs text-center rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black">Pickup Gate Pass</DialogTitle>
              <DialogDescription className="text-xs">Show this pass to the delivery coordinator at the clubhouse desk.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="w-40 h-40 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center p-3 shadow-inner">
                <QrCode className="w-32 h-32 text-purple-400" />
              </div>
              <div className="font-mono text-xs font-bold text-purple-800">{qrOrder.qrCode}</div>
              <div className="text-xs text-slate-600 font-medium">Order: {qrOrder.id} • Qty: {qrOrder.quantity}</div>
            </div>
            <DialogFooter>
              <Button onClick={() => setQrOrder(null)} className="w-full bg-purple-600 text-white text-xs font-bold rounded-xl">
                Close Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Propose Product Modal ── */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Propose a Group Buy Demand</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gather 25+ interested neighbours to invite bulk supplier quotations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDemand} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
              <Input
                required
                placeholder="e.g. Kashmiri Saffron 5g Box"
                value={demandTitle}
                onChange={(e) => setDemandTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={demandCategory}
                onChange={(e) => setDemandCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="Groceries">Groceries</option>
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Festival Specials">Festival Specials</option>
                <option value="Household">Household</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brand preferences or pack size requirements"
                value={demandDescription}
                onChange={(e) => setDemandDescription(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
                Publish Demand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
