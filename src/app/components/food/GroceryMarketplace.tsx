import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, Plus, Minus, Apple, Carrot, Milk, Wheat,
  Egg, Cherry, Leaf, Package, Clock, Truck, X, Check, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import type { GroceryProduct, GroceryCategory, GroceryStore } from "../../../types/food";

const mockCategories: Partial<GroceryCategory>[] = [
  { id: 0, name: "All", slug: "all", sortOrder: 0, active: true },
  { id: 1, name: "Fruits", slug: "fruits", sortOrder: 1, active: true },
  { id: 2, name: "Vegetables", slug: "vegetables", sortOrder: 2, active: true },
  { id: 3, name: "Dairy & Eggs", slug: "dairy", sortOrder: 3, active: true },
  { id: 4, name: "Staples & Grains", slug: "staples", sortOrder: 4, active: true },
  { id: 5, name: "Spices & Masala", slug: "spices", sortOrder: 5, active: true },
  { id: 6, name: "Snacks", slug: "snacks", sortOrder: 6, active: true },
  { id: 7, name: "Beverages", slug: "beverages", sortOrder: 7, active: true },
  { id: 8, name: "Organic", slug: "organic", sortOrder: 8, active: true },
];

const categoryIcons: Record<number, typeof Apple> = {
  0: Package, 1: Apple, 2: Carrot, 3: Milk, 4: Wheat,
  5: Leaf, 6: Cherry, 7: Egg, 8: Leaf,
};

const mockProducts: Partial<GroceryProduct>[] = [
  { id: 1, categoryId: 1, name: "Alphonso Mangoes", brand: "Farm Fresh", unit: "kg", unitValue: 1, price: 450, discountedPrice: 399, stock: 25, isOrganic: false, isFeatured: true, active: true },
  { id: 2, categoryId: 1, name: "Shimla Apples", brand: "Himalayan", unit: "kg", unitValue: 1, price: 220, stock: 40, isOrganic: false, isFeatured: false, active: true },
  { id: 3, categoryId: 1, name: "Bananas", brand: "Local Farm", unit: "dozen", unitValue: 1, price: 60, stock: 50, isOrganic: true, isFeatured: false, active: true },
  { id: 4, categoryId: 2, name: "Tomatoes", brand: "Farm Fresh", unit: "kg", unitValue: 1, price: 40, stock: 60, isOrganic: false, isFeatured: false, active: true },
  { id: 5, categoryId: 2, name: "Onions", brand: "Local", unit: "kg", unitValue: 1, price: 35, stock: 100, isOrganic: false, isFeatured: false, active: true },
  { id: 6, categoryId: 2, name: "Palak (Spinach)", brand: "Organic Farms", unit: "bunch", unitValue: 1, price: 30, stock: 30, isOrganic: true, isFeatured: false, active: true },
  { id: 7, categoryId: 2, name: "Bhindi (Okra)", brand: "Farm Fresh", unit: "kg", unitValue: 0.5, price: 45, stock: 20, isOrganic: false, isFeatured: false, active: true },
  { id: 8, categoryId: 3, name: "Amul Toned Milk", brand: "Amul", unit: "litre", unitValue: 1, price: 60, stock: 80, isOrganic: false, isFeatured: true, active: true },
  { id: 9, categoryId: 3, name: "Paneer (Cottage Cheese)", brand: "Amul", unit: "gm", unitValue: 200, price: 90, stock: 35, isOrganic: false, isFeatured: false, active: true },
  { id: 10, categoryId: 3, name: "Farm Eggs", brand: "Country", unit: "pack", unitValue: 12, price: 96, stock: 45, isOrganic: true, isFeatured: false, active: true },
  { id: 11, categoryId: 3, name: "Curd (Dahi)", brand: "Mother Dairy", unit: "gm", unitValue: 400, price: 45, stock: 40, isOrganic: false, isFeatured: false, active: true },
  { id: 12, categoryId: 4, name: "Basmati Rice", brand: "India Gate", unit: "kg", unitValue: 5, price: 550, discountedPrice: 499, stock: 30, isOrganic: false, isFeatured: true, active: true },
  { id: 13, categoryId: 4, name: "Toor Dal", brand: "Tata Sampann", unit: "kg", unitValue: 1, price: 180, stock: 55, isOrganic: false, isFeatured: false, active: true },
  { id: 14, categoryId: 4, name: "Whole Wheat Atta", brand: "Aashirvaad", unit: "kg", unitValue: 5, price: 280, discountedPrice: 259, stock: 40, isOrganic: false, isFeatured: false, active: true },
  { id: 15, categoryId: 5, name: "Turmeric Powder", brand: "MDH", unit: "gm", unitValue: 100, price: 55, stock: 70, isOrganic: false, isFeatured: false, active: true },
  { id: 16, categoryId: 5, name: "Garam Masala", brand: "Everest", unit: "gm", unitValue: 100, price: 85, stock: 45, isOrganic: false, isFeatured: false, active: true },
  { id: 17, categoryId: 6, name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", unit: "gm", unitValue: 400, price: 120, stock: 35, isOrganic: false, isFeatured: false, active: true },
  { id: 18, categoryId: 7, name: "Brooke Bond Red Label Tea", brand: "Brooke Bond", unit: "gm", unitValue: 500, price: 290, discountedPrice: 265, stock: 50, isOrganic: false, isFeatured: true, active: true },
  { id: 19, categoryId: 8, name: "Organic Honey", brand: "Zandu", unit: "gm", unitValue: 500, price: 350, stock: 20, isOrganic: true, isFeatured: true, active: true },
  { id: 20, categoryId: 8, name: "Organic Moong Dal", brand: "24 Mantra", unit: "kg", unitValue: 1, price: 220, stock: 25, isOrganic: true, isFeatured: false, active: true },
];

const deliverySlots = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
];

type CartItem = { product: Partial<GroceryProduct>; quantity: number };

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function GroceryMarketplace() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = mockProducts.filter((p) => {
    if (selectedCategory !== 0 && p.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const addToCart = (product: Partial<GroceryProduct>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.product.id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.product.discountedPrice ?? c.product.price ?? 0) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 max-w-md rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Grocery Store</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fresh groceries delivered to your doorstep</p>
        </div>
        <Select value={deliverySlot} onValueChange={setDeliverySlot}>
          <SelectTrigger className="w-[200px]">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Delivery Slot" />
          </SelectTrigger>
          <SelectContent>
            {deliverySlots.map((slot) => (
              <SelectItem key={slot} value={slot}>{slot}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search groceries, brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-36">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="max-h-[60vh]">
                {mockCategories.map((cat) => {
                  const CatIcon = categoryIcons[cat.id ?? 0] ?? Package;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id!)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedCategory === cat.id
                          ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <CatIcon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">Try a different category or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => {
                const inCart = cart.find((c) => c.product.id === product.id);
                const hasDiscount = product.discountedPrice && product.discountedPrice < (product.price ?? 0);
                return (
                  <Card key={product.id} className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <div className="h-28 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 flex items-center justify-center relative">
                        <Package className="w-8 h-8 text-green-300 dark:text-green-800" />
                        {product.isOrganic && (
                          <Badge className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] border-0 gap-0.5">
                            <Leaf className="w-2.5 h-2.5" /> Organic
                          </Badge>
                        )}
                        {hasDiscount && (
                          <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] border-0">
                            {Math.round(((product.price! - product.discountedPrice!) / product.price!) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{product.brand}</p>
                        <h4 className="font-semibold text-xs mt-0.5 line-clamp-2 leading-tight">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {product.unitValue} {product.unit}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {hasDiscount ? (
                            <>
                              <span className="font-bold text-sm text-green-700 dark:text-green-400">{formatPrice(product.discountedPrice!)}</span>
                              <span className="text-xs text-slate-400 line-through">{formatPrice(product.price!)}</span>
                            </>
                          ) : (
                            <span className="font-bold text-sm">{formatPrice(product.price ?? 0)}</span>
                          )}
                        </div>
                        <div className="mt-2">
                          {inCart ? (
                            <div className="flex items-center justify-center gap-1 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-0.5">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(product.id!, -1)}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs font-bold w-5 text-center">{inCart.quantity}</span>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(product.id!, 1)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 h-7"
                              onClick={() => addToCart(product)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-green-700 text-white rounded-xl shadow-2xl shadow-green-700/30 px-6 py-3 flex items-center gap-4 max-w-md w-[calc(100%-2rem)]">
          <ShoppingCart className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "s" : ""}</p>
            <p className="text-xs opacity-80">{formatPrice(cartTotal)}</p>
          </div>
          <Button size="sm" className="bg-white text-green-700 hover:bg-green-50 font-bold" onClick={() => setShowCart(true)}>
            View Cart
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart ({cartCount} items)</DialogTitle>
            <DialogDescription>Review your grocery order</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 py-2">
              {cart.map((c) => (
                <div key={c.product.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.product.name}</p>
                    <p className="text-xs text-slate-400">{c.product.unitValue} {c.product.unit} x {c.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(c.product.id!, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-bold w-5 text-center">{c.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(c.product.id!, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {formatPrice((c.product.discountedPrice ?? c.product.price ?? 0) * c.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Delivery Fee</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatPrice(cartTotal)}</span>
            </div>
          </div>
          {deliverySlot && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <Truck className="w-3.5 h-3.5" />
              Delivery: {deliverySlot}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCart(false)}>Continue Shopping</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white" onClick={() => setShowCart(false)}>
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
