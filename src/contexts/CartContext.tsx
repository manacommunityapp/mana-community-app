import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { orderService, couponService, type OrderResponse, type CouponItem } from "../services/marketplace/listingService";
import { showSuccess, showError } from "../utils/ToastUtils";
import { USE_MOCK_DATA, MOCK_ORDERS, MOCK_COUPONS } from "../app/components/marketplace/mockData";

export interface CartItem {
  id: string | number; // listing or product ID
  title: string;
  price: number;
  priceUnit?: string;
  category?: string;
  imageUrl?: string;
  sellerId?: number;
  sellerName?: string;
  quantity: number;
  type?: "PRODUCT" | "FOOD" | "RENTAL" | "SERVICE";
}

export type DeliveryMethod = "FLAT_PICKUP" | "CLUBHOUSE" | "GATE_SECURITY" | "DOORSTEP_DELIVERY";
export type PaymentMode = "UPI_QR" | "CARD_NETBANKING" | "COMMUNITY_WALLET" | "CASH_ON_HANDOVER";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  appliedCoupon: CouponItem | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  totalAmount: number;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  paymentMode: PaymentMode;
  setPaymentMode: (mode: PaymentMode) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isCheckingOut: boolean;
  checkout: () => Promise<OrderResponse | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "mana_marketplace_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 101,
        title: "Homemade Hyderabadi Dum Biryani",
        price: 280,
        priceUnit: "portion",
        category: "Homemade Food",
        sellerId: 101,
        sellerName: "Ayesha's Kitchen",
        quantity: 2,
        type: "FOOD",
      },
    ];
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("FLAT_PICKUP");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI_QR");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("Tower B - Apt 402");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(item.id));
      if (existing) {
        showSuccess(`Updated ${item.title} quantity in cart`);
        return prev.map((i) =>
          String(i.id) === String(item.id) ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      showSuccess(`Added ${item.title} to cart`);
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeItem = (id: string | number) => {
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
    showSuccess("Item removed from cart");
  };

  const updateQuantity = (id: string | number, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (String(i.id) === String(id) ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const rawDeliveryFee = deliveryMethod === "DOORSTEP_DELIVERY" ? 30 : deliveryMethod === "GATE_SECURITY" ? 15 : 0;
  
  let discountAmount = 0;
  let deliveryFee = rawDeliveryFee;

  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      const calculated = (subtotal * appliedCoupon.discountValue) / 100;
      discountAmount = appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    } else if (appliedCoupon.discountType === "FIXED") {
      discountAmount = Math.min(subtotal, appliedCoupon.discountValue);
    } else if (appliedCoupon.discountType === "FREE_DELIVERY") {
      deliveryFee = 0;
      discountAmount = rawDeliveryFee;
    }
  }

  const totalAmount = Math.max(0, subtotal - (appliedCoupon?.discountType === "FREE_DELIVERY" ? 0 : discountAmount) + deliveryFee);

  const applyCoupon = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (USE_MOCK_DATA) {
      const found = MOCK_COUPONS.find((c) => c.code === cleanCode);
      if (!found) {
        showError("Invalid coupon code.");
        return false;
      }
      if (subtotal < found.minOrderAmount) {
        showError(`Minimum order amount of ₹${found.minOrderAmount} required for this coupon.`);
        return false;
      }
      setAppliedCoupon(found);
      showSuccess(`Coupon ${found.code} applied successfully!`);
      return true;
    } else {
      try {
        const res = await couponService.validateCoupon(cleanCode, subtotal);
        if (res.valid && res.coupon) {
          setAppliedCoupon(res.coupon);
          showSuccess(`Coupon ${cleanCode} applied!`);
          return true;
        } else {
          showError(res.message || "Invalid coupon code.");
          return false;
        }
      } catch {
        showError("Failed to validate coupon.");
        return false;
      }
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showSuccess("Coupon removed.");
  };

  const checkout = async (): Promise<OrderResponse | null> => {
    if (items.length === 0) {
      showError("Your cart is empty!");
      return null;
    }

    setIsCheckingOut(true);
    try {
      const firstItem = items[0];
      const deliveryInfo = `${deliveryMethod.replace(/_/g, " ")} | ${deliveryAddress}${deliveryNotes ? ` (${deliveryNotes})` : ""}`;
      
      let order: OrderResponse;

      if (USE_MOCK_DATA) {
        const randomOtp = ["GATE_SECURITY", "CLUBHOUSE"].includes(deliveryMethod)
          ? String(Math.floor(1000 + Math.random() * 9000))
          : undefined;

        order = {
          id: Date.now(),
          orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          buyer: { id: 100, fullName: "Demo Resident" },
          seller: { id: firstItem.sellerId || 101, fullName: firstItem.sellerName || "Neighbor", verified: true },
          status: "PENDING",
          totalAmount,
          notes: deliveryNotes,
          deliveryAddress: deliveryInfo,
          deliveryMethod,
          paymentMode,
          paymentStatus: paymentMode === "CASH_ON_HANDOVER" ? "PENDING" : "PAID",
          pickupOtp: randomOtp,
          items: items.map((i, idx) => ({
            id: idx + 1,
            listingId: typeof i.id === "number" ? i.id : idx + 1,
            listingTitle: i.title,
            quantity: i.quantity,
            unitPrice: i.price,
            imageUrl: i.imageUrl || null,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        MOCK_ORDERS.unshift(order);
      } else {
        order = await orderService.create({
          listingId: typeof firstItem.id === "number" ? firstItem.id : 1,
          quantity: firstItem.quantity,
          notes: deliveryNotes,
          deliveryAddress: deliveryInfo,
          deliveryMethod,
          paymentMode,
        });
      }

      showSuccess(`Order #${order.orderNumber || order.id} placed successfully!`);
      clearCart();
      return order;
    } catch {
      showError("Failed to complete order. Please try again.");
      return null;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        discountAmount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        totalAmount,
        deliveryMethod,
        setDeliveryMethod,
        deliveryNotes,
        setDeliveryNotes,
        deliveryAddress,
        setDeliveryAddress,
        paymentMode,
        setPaymentMode,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isCheckingOut,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
