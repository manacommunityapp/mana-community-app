import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ExternalLink, Loader2, MessageCircle, PackageSearch, Search, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import { useChat } from "../../../contexts/ChatContext";
import { commerceCoreService } from "../../../services/commerceCoreService";
import { interiorsService } from "../../../services/interiors/interiorsService";
import type { CommerceOrder } from "../../../types/commerceCore";
import type { CommerceOrderDto } from "../../../services/commerce/commerceOrderService";
import CheckoutPayment from "../commerce/orders/CheckoutPayment";
import { vendorService } from "../../../services/vendor/vendorService";
import type { CommerceProduct } from "../../../types/commerceCore";

const INTERIOR_TERMS = /interior|furniture|home|decor|lighting|paint|kitchen|bath|floor|wood|curtain|sofa|fabric|appliance|hardware/i;

export function InteriorVendors() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openFloatingChatWithUser } = useChat();
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<CommerceProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutOrder, setCheckoutOrder] = useState<CommerceOrderDto | null>(null);

  useEffect(() => {
    let active = true;
    commerceCoreService.getProducts("MARKETPLACE")
      .then((items) => { if (active) setProducts(items.filter((item) => item.isActive)); })
      .catch(() => { if (active) toast.error("Could not load interior vendors"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const text = `${product.title} ${product.description ?? ""} ${product.category} ${product.sellerName ?? ""}`;
      return INTERIOR_TERMS.test(text) && (!term || text.toLowerCase().includes(term));
    });
  }, [products, query]);

  const contactVendor = async (vendorId: number) => {
    try {
      const vendor = await vendorService.getVendorById(vendorId);
      await openFloatingChatWithUser(String(vendor.owner.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open vendor chat");
    }
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!buying) return;
    try {
      const request: any = {
        channel: "MARKETPLACE",
        sellerId: buying.sellerId,
        sellerType: buying.sellerType,
        sellerName: buying.sellerName,
        fulfillmentType: "DELIVERY",
        deliveryAddress: deliveryAddress.trim(),
        items: [{ sku: buying.sku, title: buying.title, unitPrice: buying.discountPrice ?? buying.basePrice, quantity, thumbnailUrl: buying.thumbnailUrl }],
      };
      const projectId = Number(searchParams.get("projectId"));
      const order = projectId > 0
        ? await interiorsService.checkoutProjectMaterials(projectId, request)
        : await commerceCoreService.checkout(request);
      setBuying(null);
      setCheckoutOrder(toPaymentOrder(order));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create vendor order");
    }
  };

  const completePayment = (order: CommerceOrderDto) => {
    setCheckoutOrder(null);
    toast.success(`Order ${order.orderNumber} paid successfully`);
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><button onClick={() => navigate("/services/interiors")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" />Back to designers</button><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9b7651]">Mana Interiors</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Materials and vendors</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Explore home products from community vendors and contact a seller for details.</p></div>
      <label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><Search className="h-4 w-4 text-slate-400" /><input aria-label="Search interior products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search furniture, lighting, decor…" className="w-full bg-transparent text-sm outline-none" /></label>
    </div>
    {loading ? <div className="flex justify-center rounded-2xl border bg-white py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-700" /></div>
      : visibleProducts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="aspect-[1.45] bg-slate-100">{product.thumbnailUrl ? <img src={product.thumbnailUrl} alt={product.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-300"><Store className="h-10 w-10" /></div>}</div>
        <div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9b7651]">{product.category}</p><h2 className="mt-1 line-clamp-1 text-base font-bold">{product.title}</h2><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{product.description || `Available from ${product.sellerName || "a community vendor"}.`}</p><div className="mt-3 flex items-center justify-between gap-2"><div><p className="text-sm font-bold">₹{(product.discountPrice ?? product.basePrice).toLocaleString("en-IN")}</p><p className="text-[11px] text-slate-500">{product.sellerName || "Community vendor"}</p></div><div className="flex gap-2"><button onClick={() => { setBuying(product); setQuantity(1); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900"><ShoppingBag className="h-3.5 w-3.5" />Buy</button><button onClick={() => void contactVendor(product.sellerId)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"><MessageCircle className="h-3.5 w-3.5" />Contact</button></div></div></div>
      </article>)}</div>
      : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><PackageSearch className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 font-bold">No matching interior products</h2><p className="mt-1 text-sm text-slate-500">Try another search, or check back as vendors add products.</p></div>}
    {!loading && visibleProducts.length > 0 && <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400"><ExternalLink className="h-3 w-3" />Product listings are provided by community vendors.</p>}
    {buying && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBuying(null); }}><form onSubmit={(event) => void placeOrder(event)} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Vendor checkout</p><h2 className="mt-1 text-lg font-bold">{buying.title}</h2><p className="text-sm text-slate-500">₹{(buying.discountPrice ?? buying.basePrice).toLocaleString("en-IN")} each · {buying.sellerName || "Community vendor"}</p></div><label className="block text-xs font-semibold text-slate-600">Quantity<input min={1} max={100} type="number" required value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-slate-600">Delivery address<textarea required maxLength={500} rows={3} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Enter the address for delivery" /></label><p className="text-[11px] text-slate-500">Final amount and product price are confirmed by Mana checkout.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setBuying(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Continue to payment</button></div></form></div>}
    {checkoutOrder && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"><div className="w-full max-w-lg"><CheckoutPayment order={checkoutOrder} onSuccess={completePayment} onDismiss={() => setCheckoutOrder(null)} onError={(message) => toast.error(message)} /><button onClick={() => setCheckoutOrder(null)} className="mt-2 w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold">Close</button></div></div>}
  </div>;
}

function toPaymentOrder(order: CommerceOrder): CommerceOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    channel: order.channel,
    status: order.status as CommerceOrderDto["status"],
    subtotalAmount: order.subtotal,
    discountAmount: order.discountAmount,
    deliveryFee: order.deliveryFee,
    taxAmount: 0,
    totalAmount: order.totalAmount,
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    vendorName: order.sellerName,
    items: order.items.map((item) => ({ sku: item.sku, title: item.title, unitPrice: item.unitPrice, quantity: item.quantity, totalPrice: item.totalPrice ?? item.unitPrice * item.quantity, imageUrl: item.thumbnailUrl })),
    createdAt: order.createdAt,
  };
}
