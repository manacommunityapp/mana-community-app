import { useEffect, useMemo, useState } from "react";
import {
  Search, ShoppingCart, Plus, Minus, Apple, Carrot, Milk, Wheat,
  Egg, Cherry, Leaf, Package, Clock, Truck, Store, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { foodGroceryService } from "../../../services/food/foodGroceryService";
import type { GroceryCategory, GroceryProduct, GroceryStore } from "../../../types/food";

type CartItem = { product: GroceryProduct; quantity: number };
type DeliverySlotOption = { value: string; label: string };

const categoryIcons: Record<string, typeof Apple> = {
  fruits: Apple,
  vegetables: Carrot,
  dairy: Milk,
  eggs: Egg,
  staples: Wheat,
  organic: Leaf,
  snacks: Cherry,
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDeliverySlot(slot: unknown): DeliverySlotOption | null {
  if (typeof slot === "string" && slot.trim()) return { value: slot, label: slot };
  if (!slot || typeof slot !== "object") return null;

  const data = slot as Record<string, unknown>;
  const label = [data.label, data.name, data.slot, data.timeRange, data.startTime && data.endTime ? `${data.startTime} - ${data.endTime}` : undefined]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (!label) return null;
  const value = [data.id, data.value, data.slot, data.timeRange]
    .find((candidate): candidate is string | number => typeof candidate === "string" || typeof candidate === "number");
  return { value: String(value ?? label), label };
}

export function GroceryMarketplace() {
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlotOption[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingStores(true);
    foodGroceryService.getStores(0, 100)
      .then((response) => {
        if (!active) return;
        const availableStores = response.content.filter((store) => store.status === "ACTIVE" && store.deliveryEnabled);
        setStores(availableStores);
        setStoreId(availableStores[0]?.id ?? null);
        if (availableStores.length === 0) setLoadError("No active grocery stores are available in your community yet.");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load grocery stores.");
      })
      .finally(() => { if (active) setLoadingStores(false); });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (storeId === null) {
      setCategories([]);
      setProducts([]);
      setDeliverySlots([]);
      return;
    }

    let active = true;
    setLoadError("");
    Promise.all([
      foodGroceryService.getCategories(storeId),
      foodGroceryService.getDeliverySlots(storeId, localDateString()),
    ]).then(([categoryList, slotList]) => {
        if (!active) return;
        setCategories(categoryList.filter((category) => category.active));
        setDeliverySlots(slotList.map(normalizeDeliverySlot).filter((slot): slot is DeliverySlotOption => slot !== null));
      }).catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load store categories and delivery slots.");
      });

    return () => { active = false; };
  }, [storeId, reloadKey]);

  useEffect(() => {
    if (storeId === null) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingProducts(true);
      foodGroceryService.getProducts(storeId, 0, 100, selectedCategory ?? undefined, searchQuery.trim() || undefined)
        .then((productPage) => { if (active) setProducts(productPage.content.filter((product) => product.active)); })
        .catch((error: unknown) => {
          if (!active) return;
          setLoadError(error instanceof Error ? error.message : "Unable to load this store's products.");
          setProducts([]);
        })
        .finally(() => { if (active) setLoadingProducts(false); });
    }, searchQuery ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [storeId, selectedCategory, searchQuery, reloadKey]);

  const selectedStore = stores.find((store) => store.id === storeId);
  const cartTotal = useMemo(() => cart.reduce(
    (total, item) => total + (item.product.discountedPrice ?? item.product.price) * item.quantity,
    0,
  ), [cart]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const changeStore = (value: string) => {
    const nextStoreId = Number(value);
    setStoreId(nextStoreId);
    setSelectedCategory(null);
    setDeliverySlot("");
    setCart([]);
  };

  const addToCart = (product: GroceryProduct) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock < 1) return current;
      return [...current, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((current) => current
      .map((item) => item.product.id === productId
        ? { ...item, quantity: Math.min(item.product.stock, Math.max(0, item.quantity + delta)) }
        : item)
      .filter((item) => item.quantity > 0));
  };

  const placeOrder = async () => {
    if (storeId === null || cart.length === 0) return;
    setPlacingOrder(true);
    try {
      const order = await foodGroceryService.placeGroceryOrder({
        storeId,
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliverySlot: deliverySlot || undefined,
        items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      toast.success(`Order ${order.orderNumber} placed successfully.`);
      setCart([]);
      setDeliveryAddress("");
      setDeliverySlot("");
      setShowCart(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingStores) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 max-w-md rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Fresh Food &amp; Groceries</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Shop from active stores serving your community</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {stores.length > 1 && (
            <Select value={storeId === null ? "" : String(storeId)} onValueChange={changeStore}>
              <SelectTrigger className="w-full sm:w-[220px]"><Store className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Choose a store" /></SelectTrigger>
              <SelectContent>{stores.map((store) => <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Select value={deliverySlot} onValueChange={setDeliverySlot}>
            <SelectTrigger className="w-full sm:w-[220px]" disabled={!deliverySlots.length}><Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /><SelectValue placeholder="Delivery slot" /></SelectTrigger>
            <SelectContent>
              {deliverySlots.map((slot) => <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {storeId !== null && deliverySlots.length === 0 && <p className="text-xs text-slate-500">No delivery slots are available today.</p>}

      {selectedStore && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Store className="w-4 h-4" /><span>{selectedStore.name}</span>
          {selectedStore.rating > 0 && <Badge variant="secondary">★ {selectedStore.rating.toFixed(1)}</Badge>}
          {selectedStore.minOrder !== undefined && <span>Minimum order {formatPrice(selectedStore.minOrder)}</span>}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search fresh food and groceries..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
      </div>

      {loadError && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button>
          </div>
        </div>
      )}

      {stores.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-36">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="max-h-[60vh]">
                  <button onClick={() => setSelectedCategory(null)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${selectedCategory === null ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                    <Package className="w-4 h-4" />All products
                  </button>
                  {categories.map((category) => {
                    const Icon = categoryIcons[category.slug.toLowerCase()] ?? Package;
                    return (
                      <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${selectedCategory === category.id ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                        <Icon className="w-4 h-4" />{category.name}
                      </button>
                    );
                  })}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-slate-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">No products found</p><p className="text-sm mt-1">Try another category or search term</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => {
                  const inCart = cart.find((item) => item.product.id === product.id);
                  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice < product.price;
                  return (
                    <Card key={product.id} className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                      <CardContent className="p-0">
                        <div className="h-28 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 flex items-center justify-center relative">
                          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <Package className="w-8 h-8 text-green-300 dark:text-green-800" />}
                          {product.isOrganic && <Badge className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] border-0 gap-0.5"><Leaf className="w-2.5 h-2.5" /> Organic</Badge>}
                          {hasDiscount && <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] border-0">{Math.round(((product.price - product.discountedPrice!) / product.price) * 100)}% OFF</Badge>}
                        </div>
                        <div className="p-3">
                          {product.brand && <p className="text-[10px] text-slate-400 uppercase tracking-wider">{product.brand}</p>}
                          <h4 className="font-semibold text-xs mt-0.5 line-clamp-2 leading-tight">{product.name}</h4>
                          {(product.unitValue || product.unit) && <p className="text-[10px] text-slate-400 mt-0.5">{product.unitValue} {product.unit}</p>}
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="font-bold text-sm text-green-700 dark:text-green-400">{formatPrice(product.discountedPrice ?? product.price)}</span>
                            {hasDiscount && <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</p>
                          <div className="mt-2">
                            {inCart ? (
                              <div className="flex items-center justify-center gap-1 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-0.5">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(product.id, -1)}><Minus className="w-3 h-3" /></Button>
                                <span className="text-xs font-bold w-5 text-center">{inCart.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={inCart.quantity >= product.stock} onClick={() => updateCartQuantity(product.id, 1)}><Plus className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="w-full text-xs text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 h-7" disabled={product.stock < 1} onClick={() => addToCart(product)}><Plus className="w-3 h-3 mr-1" />Add</Button>
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
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-green-700 text-white rounded-xl shadow-2xl shadow-green-700/30 px-6 py-3 flex items-center gap-4 max-w-md w-[calc(100%-2rem)]">
          <ShoppingCart className="w-5 h-5" />
          <div className="flex-1"><p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "s" : ""}</p><p className="text-xs opacity-80">{formatPrice(cartTotal)}</p></div>
          <Button size="sm" className="bg-white text-green-700 hover:bg-green-50 font-bold" onClick={() => setShowCart(true)}>View Cart</Button>
        </div>
      )}

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Your Cart ({cartCount} items)</DialogTitle><DialogDescription>Review your order from {selectedStore?.name ?? "this store"}</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[38vh]">
            <div className="space-y-3 py-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.product.name}</p><p className="text-xs text-slate-400">{item.product.unitValue} {item.product.unit} × {item.quantity}</p></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, -1)}><Minus className="w-3 h-3" /></Button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={item.quantity >= item.product.stock} onClick={() => updateCartQuantity(item.product.id, 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <span className="text-sm font-bold w-16 text-right">{formatPrice((item.product.discountedPrice ?? item.product.price) * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Input aria-label="Delivery address" placeholder="Delivery address (optional)" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatPrice(cartTotal)}</span></div>
            {selectedStore?.deliveryFee !== undefined && <div className="flex justify-between text-sm"><span className="text-slate-500">Delivery fee</span><span className="font-semibold">{formatPrice(selectedStore.deliveryFee)}</span></div>}
            <Separator />
            <div className="flex justify-between text-base"><span className="font-bold">Estimated subtotal</span><span className="font-bold">{formatPrice(cartTotal)}</span></div>
          </div>
          {deliverySlot && <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2"><Truck className="w-3.5 h-3.5" />Delivery: {deliverySlots.find((slot) => slot.value === deliverySlot)?.label ?? deliverySlot}</div>}
          <DialogFooter>
            <Button variant="outline" disabled={placingOrder} onClick={() => setShowCart(false)}>Continue shopping</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white" disabled={placingOrder || cart.length === 0} onClick={placeOrder}>{placingOrder ? "Placing order…" : "Place order"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
