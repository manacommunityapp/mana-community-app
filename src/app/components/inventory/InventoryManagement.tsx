import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Users,
  Truck,
  Receipt,
  ShoppingBag,
  BarChart3,
  Trash2,
  Edit3,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  retailInventoryService,
  type RetailProduct,
  type Supplier,
  type Customer,
  type RetailOrder,
  type RetailOrderLine,
  type RetailOrderType,
  type RetailOrderStatus,
} from "../../../services/retailInventoryService";

export function InventoryManagement() {
  /* ============================= DATA STATE ============================= */
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<RetailOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<RetailOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [prods, sups, custs, pos, sos] = await Promise.all([
        retailInventoryService.getProducts(),
        retailInventoryService.getSuppliers(),
        retailInventoryService.getCustomers(),
        retailInventoryService.getOrders("PURCHASE"),
        retailInventoryService.getOrders("SALES"),
      ]);
      setProducts(prods);
      setSuppliers(sups);
      setCustomers(custs);
      setPurchaseOrders(pos);
      setSalesOrders(sos);
    } catch (err) {
      toast.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ============================= TABS & VIEW STATE ============================= */
  type TabType = "dashboard" | "products" | "suppliers" | "purchase" | "sales" | "customers";
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const TABS = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: BarChart3 },
    { id: "products" as TabType, label: "Products", icon: Package },
    { id: "suppliers" as TabType, label: "Suppliers", icon: Truck },
    { id: "purchase" as TabType, label: "Purchase Orders", icon: Receipt },
    { id: "sales" as TabType, label: "Sales Orders", icon: ShoppingBag },
    { id: "customers" as TabType, label: "Customers", icon: Users },
  ];

  /* ============================= HELPER METHODS ============================= */
  const inventoryOf = (p: RetailProduct) => p.unitsOrdered - p.unitsSold;

  const stockState = (p: RetailProduct) => {
    const inv = inventoryOf(p);
    if (inv <= 0) return "out";
    if (inv <= p.reorderLevel) return "low";
    return "in";
  };

  const getProductById = (id: number) => products.find(p => p.id === id);
  const getSupplierById = (id: number) => suppliers.find(s => s.id === id);
  const getCustomerById = (id: number) => customers.find(c => c.id === id);

  const orderTotal = (order: RetailOrder) => {
    return order.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.qty;
    }, 0);
  };

  const itemsSummary = (items: RetailOrderLine[]) => {
    return items.map(item => {
      const p = getProductById(item.productId);
      return `${p ? p.emoji : ""} ${p ? p.name : "—"} ×${item.qty}`;
    }).join(", ");
  };

  /* ============================= CRUD MODAL STATE ============================= */
  const [modalType, setModalType] = useState<"product" | "supplier" | "customer" | "order" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderKind, setOrderKind] = useState<"purchase" | "sales">("purchase");
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({ name: "", emoji: "🎁", category: "", unitPrice: 0, reorderLevel: 10, unitsOrdered: 0, unitsSold: 0 });
  const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", phone: "", email: "" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });
  const [orderForm, setOrderForm] = useState({
    partyId: 0,
    orderDate: new Date().toISOString().slice(0, 10),
    status: "OPEN" as RetailOrderStatus,
    items: [{ productId: 0, qty: 1, unitPrice: 0 }]
  });

  /* ============================= HANDLERS ============================= */
  const openProductModal = (id?: number) => {
    if (id) {
      const p = getProductById(id);
      if (p) {
        setProductForm({ name: p.name, emoji: p.emoji || "", category: p.category || "", unitPrice: p.unitPrice, reorderLevel: p.reorderLevel, unitsOrdered: p.unitsOrdered, unitsSold: p.unitsSold });
        setEditingId(id);
      }
    } else {
      setProductForm({ name: "", emoji: "🎁", category: "", unitPrice: 0.00, reorderLevel: 10, unitsOrdered: 0, unitsSold: 0 });
      setEditingId(null);
    }
    setModalType("product");
  };

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error("Please fill in the product name.");
      return;
    }
    setSaving(true);
    try {
      const payload: RetailProduct = { ...productForm };
      if (editingId) {
        await retailInventoryService.updateProduct(editingId, payload);
        toast.success("Product updated successfully.");
      } else {
        await retailInventoryService.createProduct(payload);
        toast.success("Product created successfully.");
      }
      setModalType(null);
      await fetchAll();
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm("Delete this product? This cannot be undone.")) {
      try {
        await retailInventoryService.deleteProduct(id);
        toast.success("Product deleted.");
        await fetchAll();
      } catch {
        toast.error("Failed to delete product.");
      }
    }
  };

  const openSupplierModal = (id?: number) => {
    if (id) {
      const s = getSupplierById(id);
      if (s) {
        setSupplierForm({ name: s.name, contactPerson: s.contactPerson || "", phone: s.phone || "", email: s.email || "" });
        setEditingId(id);
      }
    } else {
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "" });
      setEditingId(null);
    }
    setModalType("supplier");
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("Supplier name required.");
      return;
    }
    setSaving(true);
    try {
      const payload: Supplier = { ...supplierForm };
      if (editingId) {
        await retailInventoryService.updateSupplier(editingId, payload);
        toast.success("Supplier updated.");
      } else {
        await retailInventoryService.createSupplier(payload);
        toast.success("Supplier added.");
      }
      setModalType(null);
      await fetchAll();
    } catch {
      toast.error("Failed to save supplier.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (id: number) => {
    if (confirm("Delete this supplier?")) {
      try {
        await retailInventoryService.deleteSupplier(id);
        toast.success("Supplier deleted.");
        await fetchAll();
      } catch {
        toast.error("Failed to delete supplier.");
      }
    }
  };

  const openCustomerModal = (id?: number) => {
    if (id) {
      const c = getCustomerById(id);
      if (c) {
        setCustomerForm({ name: c.name, email: c.email || "", phone: c.phone || "" });
        setEditingId(id);
      }
    } else {
      setCustomerForm({ name: "", email: "", phone: "" });
      setEditingId(null);
    }
    setModalType("customer");
  };

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error("Customer name required.");
      return;
    }
    setSaving(true);
    try {
      const payload: Customer = { ...customerForm };
      if (editingId) {
        await retailInventoryService.updateCustomer(editingId, payload);
        toast.success("Customer updated.");
      } else {
        await retailInventoryService.createCustomer(payload);
        toast.success("Customer added.");
      }
      setModalType(null);
      await fetchAll();
    } catch {
      toast.error("Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    if (confirm("Delete this customer?")) {
      try {
        await retailInventoryService.deleteCustomer(id);
        toast.success("Customer deleted.");
        await fetchAll();
      } catch {
        toast.error("Failed to delete customer.");
      }
    }
  };

  const openOrderModal = (kind: "purchase" | "sales", id?: number) => {
    setOrderKind(kind);
    const list = kind === "purchase" ? purchaseOrders : salesOrders;
    const defaultParty = kind === "purchase" ? suppliers[0]?.id : customers[0]?.id;
    if (id) {
      const o = list.find(x => x.id === id);
      if (o) {
        setOrderForm({
          partyId: o.partyId,
          orderDate: o.orderDate,
          status: o.status,
          items: o.items.map(it => ({ ...it }))
        });
        setEditingId(id);
      }
    } else {
      setOrderForm({
        partyId: defaultParty || 0,
        orderDate: new Date().toISOString().slice(0, 10),
        status: "OPEN",
        items: [{ productId: products[0]?.id || 0, qty: 1, unitPrice: products[0]?.unitPrice || 0 }]
      });
      setEditingId(null);
    }
    setModalType("order");
  };

  const saveOrder = async () => {
    if (!orderForm.partyId) {
      toast.error(`Please select a ${orderKind === "purchase" ? "supplier" : "customer"}.`);
      return;
    }
    const validLines = orderForm.items.filter(it => it.productId && it.qty > 0);
    if (validLines.length === 0) {
      toast.error("Add at least one valid line item.");
      return;
    }

    setSaving(true);
    try {
      const payload: RetailOrder = {
        type: orderKind === "purchase" ? "PURCHASE" : "SALES",
        partyId: orderForm.partyId,
        orderDate: orderForm.orderDate,
        status: orderForm.status,
        items: validLines
      };

      if (editingId) {
        await retailInventoryService.updateOrder(editingId, payload);
        toast.success(`${orderKind === "purchase" ? "Purchase" : "Sales"} order saved.`);
      } else {
        await retailInventoryService.createOrder(payload);
        toast.success(`${orderKind === "purchase" ? "Purchase" : "Sales"} order created.`);
      }
      setModalType(null);
      await fetchAll();
    } catch {
      toast.error("Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async (kind: "purchase" | "sales", id: number) => {
    if (confirm(`Delete this ${kind} order?`)) {
      try {
        await retailInventoryService.deleteOrder(id);
        toast.success("Order deleted.");
        await fetchAll();
      } catch {
        toast.error("Failed to delete order.");
      }
    }
  };

  /* ============================= RENDER ANALYTICS ============================= */
  const totalInvUnits = products.reduce((s, p) => s + inventoryOf(p), 0);
  const totalInvValue = products.reduce((s, p) => s + inventoryOf(p) * p.unitPrice, 0);
  const lowStock = products.filter(p => stockState(p) !== "in");
  const openPOs = purchaseOrders.filter(o => o.status !== "FULFILLED").length;
  const openSOs = salesOrders.filter(o => o.status !== "FULFILLED").length;
  const topSeller = [...products].sort((a, b) => b.unitsSold - a.unitsSold)[0];
  const activities = [
    ...purchaseOrders.map(o => ({
      id: o.id!,
      code: o.code || `PO${o.id}`,
      type: "purchase" as const,
      partyId: o.partyId,
      orderDate: o.orderDate,
      status: o.status,
      items: o.items
    })),
    ...salesOrders.map(o => ({
      id: o.id!,
      code: o.code || `SO${o.id}`,
      type: "sale" as const,
      partyId: o.partyId,
      orderDate: o.orderDate,
      status: o.status,
      items: o.items
    }))
  ];
  const recentActivities = activities
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime() || b.id - a.id)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-[#6b7094] font-semibold">Loading inventory…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 text-[#0d0d2b] font-sans">
      <Toaster position="top-center" richColors />

      {/* Breadcrumb + page header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6b7094" }}>
          <span>Home</span>
          <span className="text-slate-300">›</span>
          <span style={{ color: "#4f46e5" }}>Inventory</span>
        </div>

        {/* Right: Page Header */}
        <div className="flex items-center gap-3 sm:text-right sm:justify-end">
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "#0d0d2b" }}>Inventory Management</h2>
            <p className="text-xs" style={{ color: "#6b7094" }}>Facility &amp; Stock Hub</p>
          </div>
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 order-first sm:order-last"
            style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
          >
            <Package className="h-4.5 w-4.5 text-white" />
          </div>
        </div>
      </div>

      {/* Sports-style pill nav bar */}
      <div
        className="rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shrink-0"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 border-none bg-transparent p-0"
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        boxShadow: "0 2px 12px rgba(99, 102, 241, 0.35)",
                      }
                    : {
                        color: "rgb(107, 112, 148)",
                        background: "transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                    e.currentTarget.style.color = "#4f46e5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgb(107, 112, 148)";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">

      {/* ============================= SUBVIEWS ============================= */}

      {/* 1. DASHBOARD VIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white border border-[#6366f1]/12 rounded-xl py-1.5 px-3 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2.5px] sm:before:w-[4px] before:bg-indigo-600 w-full">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-0.5 leading-none">Units in stock</span>
              <h2 className="text-base sm:text-2xl font-black leading-none">{totalInvUnits.toLocaleString()}</h2>
              <p className="text-[9px] sm:text-xs text-[#6b7094] mt-0.5 leading-none truncate">across {products.length} products</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-xl py-1.5 px-3 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2.5px] sm:before:w-[4px] before:bg-indigo-400 w-full">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-0.5 leading-none">Inventory value</span>
              <h2 className="text-base sm:text-2xl font-black leading-none">₹{totalInvValue.toFixed(2)}</h2>
              <p className="text-[9px] sm:text-xs text-[#6b7094] mt-0.5 leading-none truncate">at current unit prices</p>
            </div>
            <div className={`bg-white border border-[#6366f1]/12 rounded-xl py-1.5 px-3 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2.5px] sm:before:w-[4px] ${lowStock.length > 0 ? "before:bg-red-500" : "before:bg-emerald-500"} w-full`}>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-0.5 leading-none">Needs Restock</span>
              <h2 className="text-base sm:text-2xl font-black leading-none">{lowStock.length}</h2>
              <p className="text-[9px] sm:text-xs text-[#6b7094] mt-0.5 leading-none truncate">{lowStock.length ? lowStock.map(p => p.name).join(", ") : "nothing right now"}</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-xl py-1.5 px-3 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2.5px] sm:before:w-[4px] before:bg-amber-500 w-full">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-0.5 leading-none">Open Orders</span>
              <h2 className="text-base sm:text-2xl font-black leading-none">{openPOs + openSOs}</h2>
              <p className="text-[9px] sm:text-xs text-[#6b7094] mt-0.5 leading-none truncate">{openPOs} purchase · {openSOs} sales</p>
            </div>
          </div>

          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-[#0d0d2b]">Stock at a Glance</h3>
                {topSeller && <p className="text-xs text-[#6b7094] mt-0.5">Top mover: {topSeller.emoji} {topSeller.name} – {topSeller.unitsSold} units sold</p>}
              </div>
            </div>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Product</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Category</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">On Hand</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Reorder Level</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const inv = inventoryOf(p);
                    const st = stockState(p);
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <span className="text-xl">{p.emoji}</span>
                          <span className="font-bold text-sm text-[#0d0d2b]">{p.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#6b7094] font-medium">{p.category}</td>
                        <td className="px-5 py-3.5 text-sm font-mono font-bold">{inv}</td>
                        <td className="px-5 py-3.5 text-sm font-mono text-[#6b7094]">{p.reorderLevel}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            st === "in" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : st === "low" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                            : "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {st === "in" ? "In Stock" : st === "low" ? "Low Stock" : "Out of stock"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">₹{(inv * p.unitPrice).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map(p => {
                const inv = inventoryOf(p);
                const st = stockState(p);
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <span className="font-bold text-sm text-[#0d0d2b] block">{p.name}</span>
                        <span className="text-[10px] text-[#6b7094] font-semibold">{p.category} · Value: ₹{(inv * p.unitPrice).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm block">{inv} units</span>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                        st === "in" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : st === "low" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                        : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {st === "in" ? "In" : st === "low" ? "Low" : "Out"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-[#0d0d2b]">Recent Activity</h3>
                <p className="text-xs text-[#6b7094] mt-0.5">Latest purchase and sales operations</p>
              </div>
            </div>

            {/* Desktop View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Type</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Order</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Party</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Date</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map(act => {
                    const partyName = act.type === "purchase"
                      ? getSupplierById(act.partyId)?.name
                      : getCustomerById(act.partyId)?.name;
                    return (
                      <tr key={`${act.type}-${act.id}`} className="border-b border-slate-100 hover:bg-slate-50/40">
                        <td className="px-5 py-3.5 text-sm font-semibold">
                          <span className="flex items-center gap-1.5">
                            {act.type === "sale" ? (
                              <>
                                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                                <span>Sale</span>
                              </>
                            ) : (
                              <>
                                <span className="p-1 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </span>
                                <span>Purchase</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold font-mono text-sm">#{act.code}</td>
                        <td className="px-5 py-3.5 text-sm font-medium">{partyName || "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">
                          {new Date(act.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            act.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : act.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {recentActivities.map(act => {
                const partyName = act.type === "purchase"
                  ? getSupplierById(act.partyId)?.name
                  : getCustomerById(act.partyId)?.name;
                return (
                  <div key={`${act.type}-${act.id}`} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl flex items-center justify-center shrink-0">
                        {act.type === "sale" ? (
                          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <ArrowDownLeft className="w-4 h-4" />
                          </span>
                        )}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-[#0d0d2b] block">#{act.code} · {act.type === "sale" ? "Sale" : "Purchase"}</span>
                        <span className="text-[10px] text-[#6b7094] font-semibold">{partyName || "—"} · {act.orderDate}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                        act.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : act.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                        : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS VIEW */}
      {activeTab === "products" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-[#0d0d2b]">Products Catalog</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">{products.length} registered products</p>
            </div>
            <button onClick={() => openProductModal()} className="px-4 py-2 bg-[#0d0d2b] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-none">
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Product</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Category</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Unit Price</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Ordered</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Sold</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">On Hand</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const inv = inventoryOf(p);
                  const st = stockState(p);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <span className="text-xl">{p.emoji}</span>
                        <div>
                          <span className="font-bold text-sm text-[#0d0d2b] block">{p.name}</span>
                          <span className="text-[10px] font-mono text-[#6b7094] font-semibold tracking-wider">#{p.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{p.category}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold">₹{p.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{p.unitsOrdered}</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{p.unitsSold}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold">{inv}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          st === "in" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : st === "low" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-red-50 text-red-600 border-red-200"
                        }`}>
                          {st === "in" ? "In Stock" : st === "low" ? "Low Stock" : "Out of stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openProductModal(p.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteProduct(p.id!)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {products.map(p => {
              const inv = inventoryOf(p);
              const st = stockState(p);
              return (
                <div key={p.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <span className="font-bold text-sm text-[#0d0d2b] block">{p.name}</span>
                        <span className="text-[10px] text-[#6b7094] font-semibold">#{p.id} · {p.category}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                      st === "in" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : st === "low" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                      : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {st === "in" ? "In Stock" : st === "low" ? "Low Stock" : "Out"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#6b7094] block font-bold">Price</span>
                      <span className="font-mono font-bold text-[#0d0d2b]">₹{p.unitPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#6b7094] block font-bold">On Hand</span>
                      <span className="font-mono font-bold text-[#0d0d2b]">{inv}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#6b7094] block font-bold">Sold</span>
                      <span className="font-mono text-[#6b7094]">{p.unitsSold}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => openProductModal(p.id)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteProduct(p.id!)} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SUPPLIERS VIEW */}
      {activeTab === "suppliers" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-[#0d0d2b]">Suppliers List</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">{suppliers.length} active suppliers</p>
            </div>
            <button onClick={() => openSupplierModal()} className="px-4 py-2 bg-[#0d0d2b] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-none">
              <Plus className="w-3.5 h-3.5" />
              Add Supplier
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Supplier</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Contact</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Phone</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Email</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Open POs</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => {
                  const openCount = purchaseOrders.filter(o => o.partyId === s.id && o.status !== "FULFILLED").length;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm text-[#0d0d2b] block">{s.name}</span>
                        <span className="text-[10px] font-mono text-[#6b7094] font-semibold tracking-wider">#{s.id}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{s.contactPerson}</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{s.phone}</td>
                      <td className="px-5 py-3.5 text-sm">{s.email}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold">{openCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openSupplierModal(s.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteSupplier(s.id!)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {suppliers.map(s => {
              const openCount = purchaseOrders.filter(o => o.partyId === s.id && o.status !== "FULFILLED").length;
              return (
                <div key={s.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-[#0d0d2b] block">{s.name}</span>
                      <span className="text-[10px] font-mono text-[#6b7094] font-semibold">#{s.id} · Contact: {s.contactPerson}</span>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                      {openCount} Open POs
                    </span>
                  </div>
                  <div className="text-xs text-[#6b7094] space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <p><span className="font-bold text-[#0d0d2b]/60">Phone:</span> <span className="font-mono text-[#0d0d2b]">{s.phone}</span></p>
                    <p><span className="font-bold text-[#0d0d2b]/60">Email:</span> <span className="text-[#0d0d2b]">{s.email}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => openSupplierModal(s.id)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[#0d0d2b] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteSupplier(s.id!)} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CUSTOMERS VIEW */}
      {activeTab === "customers" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-[#0d0d2b]">Customers Directory</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">{customers.length} registered clients</p>
            </div>
            <button onClick={() => openCustomerModal()} className="px-4 py-2 bg-[#0d0d2b] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-none">
              <Plus className="w-3.5 h-3.5" />
              Add Customer
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Email</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Phone</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Open Sales</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const openCount = salesOrders.filter(o => o.partyId === c.id && o.status !== "FULFILLED").length;
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm text-[#0d0d2b] block">{c.name}</span>
                        <span className="text-[10px] font-mono text-[#6b7094] font-semibold tracking-wider">#{c.id}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">{c.email}</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{c.phone}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold">{openCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openCustomerModal(c.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteCustomer(c.id!)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {customers.map(c => {
              const openCount = salesOrders.filter(o => o.partyId === c.id && o.status !== "FULFILLED").length;
              return (
                <div key={c.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-[#0d0d2b] block">{c.name}</span>
                      <span className="text-[10px] font-mono text-[#6b7094] font-semibold">#{c.id}</span>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                      {openCount} Open Sales
                    </span>
                  </div>
                  <div className="text-xs text-[#6b7094] space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    <p><span className="font-bold text-[#0d0d2b]/60">Phone:</span> <span className="font-mono text-[#0d0d2b]">{c.phone}</span></p>
                    <p><span className="font-bold text-[#0d0d2b]/60">Email:</span> <span className="text-[#0d0d2b]">{c.email}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => openCustomerModal(c.id)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[#0d0d2b] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteCustomer(c.id!)} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PURCHASE ORDERS VIEW */}
      {activeTab === "purchase" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-[#0d0d2b]">Purchase Orders</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">Incoming stock deliveries from suppliers</p>
            </div>
            <button onClick={() => openOrderModal("purchase")} className="px-4 py-2 bg-[#0d0d2b] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-none">
              <Plus className="w-3.5 h-3.5" />
              New Purchase Order
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Order ID</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Supplier</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Items Summary</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Total</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(o => {
                  const sup = getSupplierById(o.partyId);
                  return (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5 font-bold font-mono text-sm">#{o.code}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold">{sup ? sup.name : "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{o.orderDate}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] max-w-[280px] truncate">{itemsSummary(o.items)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          o.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : o.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openOrderModal("purchase", o.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteOrder("purchase", o.id!)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {purchaseOrders.map(o => {
              const sup = getSupplierById(o.partyId);
              return (
                <div key={o.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#0d0d2b] block">#{o.code}</span>
                      <span className="text-[10px] text-[#6b7094] font-semibold">{o.orderDate}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                      o.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : o.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#0d0d2b] bg-slate-50 p-2.5 rounded-xl space-y-1">
                    <p><span className="font-bold text-[#6b7094]">Supplier:</span> {sup ? sup.name : "—"}</p>
                    <p className="truncate"><span className="font-bold text-[#6b7094]">Items:</span> {itemsSummary(o.items)}</p>
                    <p><span className="font-bold text-[#6b7094]">Total:</span> <span className="font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => openOrderModal("purchase", o.id)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[#0d0d2b] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteOrder("purchase", o.id!)} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SALES ORDERS VIEW */}
      {activeTab === "sales" && (
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-[#0d0d2b]">Sales Orders</h3>
              <p className="text-xs text-[#6b7094] mt-0.5">Outgoing stock deliveries to customers</p>
            </div>
            <button onClick={() => openOrderModal("sales")} className="px-4 py-2 bg-[#0d0d2b] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-none">
              <Plus className="w-3.5 h-3.5" />
              New Sales Order
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-left">
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Order ID</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Items Summary</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Total</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-[#6b7094] uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map(o => {
                  const cust = getCustomerById(o.partyId);
                  return (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5 font-bold font-mono text-sm">#{o.code}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold">{cust ? cust.name : "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{o.orderDate}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] max-w-[280px] truncate">{itemsSummary(o.items)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          o.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : o.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openOrderModal("sales", o.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteOrder("sales", o.id!)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {salesOrders.map(o => {
              const cust = getCustomerById(o.partyId);
              return (
                <div key={o.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#0d0d2b] block">#{o.code}</span>
                      <span className="text-[10px] text-[#6b7094] font-semibold">{o.orderDate}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                      o.status === "FULFILLED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : o.status === "PENDING" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#0d0d2b] bg-slate-50 p-2.5 rounded-xl space-y-1">
                    <p><span className="font-bold text-[#6b7094]">Customer:</span> {cust ? cust.name : "—"}</p>
                    <p className="truncate"><span className="font-bold text-[#6b7094]">Items:</span> {itemsSummary(o.items)}</p>
                    <p><span className="font-bold text-[#6b7094]">Total:</span> <span className="font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => openOrderModal("sales", o.id)} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[#0d0d2b] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteOrder("sales", o.id!)} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200/60 text-red-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================= MODAL POPUPS ============================= */}

      {/* Product Form Modal */}
      {modalType === "product" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 absolute bottom-0 sm:relative sm:bottom-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Product Name</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Mango" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Emoji Icon</label>
                  <input type="text" maxLength={2} value={productForm.emoji} onChange={e => setProductForm(prev => ({ ...prev, emoji: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Category</label>
                <input type="text" value={productForm.category} onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g. Tropical" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Unit Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={productForm.unitPrice} onChange={e => setProductForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Reorder Level</label>
                  <input type="number" min="0" value={productForm.reorderLevel} onChange={e => setProductForm(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Total Ordered</label>
                  <input type="number" min="0" value={productForm.unitsOrdered} onChange={e => setProductForm(prev => ({ ...prev, unitsOrdered: parseInt(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Total Sold</label>
                  <input type="number" min="0" value={productForm.unitsSold} onChange={e => setProductForm(prev => ({ ...prev, unitsSold: parseInt(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setModalType(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0d0d2b] font-bold rounded-xl text-xs transition-all cursor-pointer border-none">Cancel</button>
              <button onClick={saveProduct} disabled={saving} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingId ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {modalType === "supplier" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 absolute bottom-0 sm:relative sm:bottom-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Supplier Name</label>
                <input type="text" value={supplierForm.name} onChange={e => setSupplierForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Nature's Basket" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Contact Person</label>
                <input type="text" value={supplierForm.contactPerson} onChange={e => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))} placeholder="e.g. Sam Torres" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Phone</label>
                  <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Email</label>
                  <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setModalType(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0d0d2b] font-bold rounded-xl text-xs transition-all cursor-pointer border-none">Cancel</button>
              <button onClick={saveSupplier} disabled={saving} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingId ? "Save Changes" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {modalType === "customer" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 absolute bottom-0 sm:relative sm:bottom-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Customer" : "Add Customer"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Customer Name</label>
                <input type="text" value={customerForm.name} onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Green Leaf Grocers" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Email</label>
                  <input type="email" value={customerForm.email} onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Phone</label>
                  <input type="text" value={customerForm.phone} onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setModalType(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0d0d2b] font-bold rounded-xl text-xs transition-all cursor-pointer border-none">Cancel</button>
              <button onClick={saveCustomer} disabled={saving} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingId ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal (PO & SO) */}
      {modalType === "order" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-t-2xl rounded-b-none sm:rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 absolute bottom-0 sm:relative sm:bottom-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? `Edit ${orderKind} order` : `New ${orderKind} order`}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">{orderKind === "purchase" ? "Supplier" : "Customer"}</label>
                  <select value={orderForm.partyId} onChange={e => setOrderForm(prev => ({ ...prev, partyId: Number(e.target.value) }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 cursor-pointer">
                    {(orderKind === "purchase" ? suppliers : customers).map(x => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Date</label>
                  <input type="date" value={orderForm.orderDate} onChange={e => setOrderForm(prev => ({ ...prev, orderDate: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Status</label>
                <select value={orderForm.status} onChange={e => setOrderForm(prev => ({ ...prev, status: e.target.value as RetailOrderStatus }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="OPEN">Open</option>
                  <option value="PENDING">Pending</option>
                  <option value="FULFILLED">Fulfilled</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block">Line items</label>
                  <button onClick={() => setOrderForm(prev => ({ ...prev, items: [...prev.items, { productId: products[0]?.id || 0, qty: 1, unitPrice: products[0]?.unitPrice || 0 }] }))} className="text-xs text-indigo-600 bg-transparent border-none font-bold hover:underline cursor-pointer">+ Add item</button>
                </div>
                <div className="border border-slate-200 border-dashed rounded-xl p-3 space-y-2">
                  {orderForm.items.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          value={line.productId}
                          onChange={e => {
                            const prodId = Number(e.target.value);
                            const prodObj = getProductById(prodId);
                            setOrderForm(prev => {
                              const list = [...prev.items];
                              list[idx] = { productId: prodId, qty: line.qty, unitPrice: prodObj ? prodObj.unitPrice : 0 };
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-[#0d0d2b] focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setOrderForm(prev => {
                              const list = [...prev.items];
                              list[idx].qty = val;
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-right text-[#0d0d2b] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={line.unitPrice}
                          onChange={e => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setOrderForm(prev => {
                              const list = [...prev.items];
                              list[idx].unitPrice = val;
                              return { ...prev, items: list };
                            });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-right text-[#0d0d2b] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => setOrderForm(prev => {
                            const filtered = prev.items.filter((_, i) => i !== idx);
                            return { ...prev, items: filtered.length > 0 ? filtered : [{ productId: products[0]?.id || 0, qty: 1, unitPrice: products[0]?.unitPrice || 0 }] };
                          })}
                          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer flex items-center justify-center w-full"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setModalType(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0d0d2b] font-bold rounded-xl text-xs transition-all cursor-pointer border-none">Cancel</button>
              <button onClick={saveOrder} disabled={saving} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                {editingId ? "Save Changes" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
