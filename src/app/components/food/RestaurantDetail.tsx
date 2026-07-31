import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Star, Clock, MapPin, Phone, ChevronLeft, Plus, Minus, ShoppingCart,
  UtensilsCrossed, Leaf, X, Tag, Info, MessageSquare, Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import type { FoodRestaurant, MenuItem, MenuCategory } from "../../../types/food";

const mockRestaurant: Partial<FoodRestaurant> = {
  id: 1, name: "Spice Garden", cuisineTypes: "North Indian, Mughlai", rating: 4.5,
  totalRatings: 230, avgDeliveryTime: 35, featured: true, status: "APPROVED",
  deliveryEnabled: true, dineInEnabled: true, takeawayEnabled: true,
  address: "Block A, Community Center, Mana Township", phone: "+91 98765 43210",
  openingTime: "10:00", closingTime: "22:00", description: "Authentic North Indian cuisine with a modern twist. Serving the community since 2020 with fresh ingredients and traditional recipes.",
};

const mockCategories: Partial<MenuCategory>[] = [
  { id: 1, name: "Starters" }, { id: 2, name: "Main Course" }, { id: 3, name: "Breads" },
  { id: 4, name: "Rice & Biryani" }, { id: 5, name: "Desserts" }, { id: 6, name: "Beverages" },
];

const mockMenuItems: Partial<MenuItem>[] = [
  { id: 1, categoryId: 1, name: "Paneer Tikka", price: 220, isVeg: true, isAvailable: true, calories: 280, description: "Marinated cottage cheese grilled in tandoor" },
  { id: 2, categoryId: 1, name: "Chicken 65", price: 260, isVeg: false, isAvailable: true, calories: 320, description: "Spicy deep-fried chicken bites" },
  { id: 3, categoryId: 2, name: "Butter Chicken", price: 320, isVeg: false, isAvailable: true, calories: 450, isBestseller: true, description: "Creamy tomato-based chicken curry" },
  { id: 4, categoryId: 2, name: "Dal Makhani", price: 240, isVeg: true, isAvailable: true, calories: 350, isBestseller: true, description: "Slow-cooked black lentils in butter cream" },
  { id: 5, categoryId: 2, name: "Palak Paneer", price: 260, isVeg: true, isAvailable: true, calories: 300, description: "Cottage cheese in spinach gravy" },
  { id: 6, categoryId: 3, name: "Butter Naan", price: 50, isVeg: true, isAvailable: true, calories: 120, description: "Soft bread from tandoor with butter" },
  { id: 7, categoryId: 3, name: "Garlic Naan", price: 60, isVeg: true, isAvailable: true, calories: 140, description: "Naan topped with garlic and herbs" },
  { id: 8, categoryId: 4, name: "Chicken Biryani", price: 340, isVeg: false, isAvailable: true, calories: 550, isBestseller: true, description: "Hyderabadi style dum biryani" },
  { id: 9, categoryId: 4, name: "Veg Pulao", price: 200, isVeg: true, isAvailable: true, calories: 380, description: "Fragrant rice with mixed vegetables" },
  { id: 10, categoryId: 5, name: "Gulab Jamun", price: 100, isVeg: true, isAvailable: true, calories: 200, description: "Deep-fried milk dumplings in sugar syrup" },
  { id: 11, categoryId: 6, name: "Mango Lassi", price: 120, isVeg: true, isAvailable: true, calories: 180, description: "Creamy mango yogurt drink" },
];

const mockReviews = [
  { id: 1, user: "Priya S.", rating: 5, text: "Amazing butter chicken! Best in the township.", date: "2026-07-20" },
  { id: 2, user: "Rahul K.", rating: 4, text: "Great food, delivery was a bit slow.", date: "2026-07-18" },
  { id: 3, user: "Anita M.", rating: 5, text: "Love the paneer tikka. Always consistent quality.", date: "2026-07-15" },
  { id: 4, user: "Vikram P.", rating: 4, text: "Good portions and fair pricing.", date: "2026-07-12" },
];

const mockOffers = [
  { id: 1, code: "SPICE20", title: "20% off on first order", description: "Valid for new customers", minOrder: 300, discount: 20 },
  { id: 2, code: "LUNCH15", title: "15% off on lunch orders", description: "Valid 11 AM - 3 PM", minOrder: 200, discount: 15 },
];

type CartItem = { item: Partial<MenuItem>; quantity: number };

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Partial<FoodRestaurant> | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setRestaurant(mockRestaurant);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  const addToCart = (item: Partial<MenuItem>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => prev.map((c) => c.item.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price ?? 0) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const filteredItems = mockMenuItems.filter((i) => i.categoryId === activeCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!restaurant) return <div className="text-center py-16 text-slate-400">Restaurant not found</div>;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/food/restaurants")} className="gap-1 -ml-2">
        <ChevronLeft className="w-4 h-4" /> Back to Restaurants
      </Button>

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-sm opacity-90 mt-1">{restaurant.cuisineTypes}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />{restaurant.rating} ({restaurant.totalRatings} reviews)</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{restaurant.avgDeliveryTime} min delivery</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{restaurant.address}</span>
          </div>
          <div className="flex gap-2 mt-3">
            {restaurant.deliveryEnabled && <Badge className="bg-white/20 border-0 text-white text-xs">Delivery</Badge>}
            {restaurant.dineInEnabled && <Badge className="bg-white/20 border-0 text-white text-xs">Dine-in</Badge>}
            {restaurant.takeawayEnabled && <Badge className="bg-white/20 border-0 text-white text-xs">Takeaway</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({mockReviews.length})</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm sticky top-36">
                <CardContent className="p-2">
                  <ScrollArea className="max-h-[60vh]">
                    {mockCategories.map((cat) => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.id!)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                        {cat.name}
                      </button>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Menu Items */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="font-bold text-lg">{mockCategories.find((c) => c.id === activeCategory)?.name}</h3>
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.item.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${item.isVeg ? "border-green-600" : "border-red-600"}`}>
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </span>
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        {item.isBestseller && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] border-0">Bestseller</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-bold text-sm">{formatPrice(item.price ?? 0)}</span>
                        {item.calories && <span className="text-xs text-slate-400">{item.calories} cal</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.id!, -1)}><Minus className="w-3 h-3" /></Button>
                          <span className="text-sm font-bold w-6 text-center">{inCart.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.id!, 1)}><Plus className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800" onClick={() => addToCart(item)}>
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          {mockReviews.map((rev) => (
            <Card key={rev.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600">{rev.user[0]}</div>
                    <div>
                      <p className="text-sm font-semibold">{rev.user}</p>
                      <p className="text-xs text-slate-400">{rev.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{rev.text}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">About</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">{restaurant.description}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-medium">Address</p><p className="text-sm text-slate-500">{restaurant.address}</p></div></div>
                <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-medium">Phone</p><p className="text-sm text-slate-500">{restaurant.phone}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="w-5 h-5 text-slate-400 mt-0.5" /><div><p className="text-sm font-medium">Hours</p><p className="text-sm text-slate-500">{restaurant.openingTime} - {restaurant.closingTime}</p></div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="mt-4 space-y-4">
          {mockOffers.map((offer) => (
            <Card key={offer.id} className="border-0 shadow-sm border-l-4 border-l-orange-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-orange-500" />
                    <h4 className="text-sm font-bold">{offer.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{offer.description} | Min. order {formatPrice(offer.minOrder)}</p>
                </div>
                <Badge variant="outline" className="font-mono text-sm font-bold border-orange-300 text-orange-600">{offer.code}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white rounded-xl shadow-2xl shadow-orange-600/30 px-6 py-3 flex items-center gap-4 max-w-md w-[calc(100%-2rem)]">
          <ShoppingCart className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "s" : ""}</p>
            <p className="text-xs opacity-80">{formatPrice(cartTotal)}</p>
          </div>
          <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50 font-bold">
            View Cart
          </Button>
        </div>
      )}
    </div>
  );
}
