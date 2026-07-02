import { useState } from "react";
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
  DollarSign 
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface Product {
  id: string;
  name: string;
  emoji: string;
  category: string;
  unitPrice: number;
  reorderLevel: number;
  unitsOrdered: number;
  unitsSold: number;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface OrderItem {
  productId: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  partyId: string; // supplierId or customerId
  date: string;
  status: "open" | "pending" | "fulfilled";
  items: OrderItem[];
}

export function InventoryManagement() {
  /* ============================= DATA STATE ============================= */
  const [products, setProducts] = useState<Product[]>([
    { id: "10001", name: "Apple", emoji: "ðŸŽ", category: "Pome Fruit", unitPrice: 1.20, reorderLevel: 20, unitsOrdered: 520, unitsSold: 498 },
    { id: "10002", name: "Banana", emoji: "ðŸŒ", category: "Tropical", unitPrice: 0.55, reorderLevel: 30, unitsOrdered: 31, unitsSold: 19 },
    { id: "10003", name: "Orange", emoji: "ðŸŠ", category: "Citrus", unitPrice: 0.85, reorderLevel: 15, unitsOrdered: 7, unitsSold: 8 },
    { id: "10004", name: "Pineapple", emoji: "ðŸ", category: "Tropical", unitPrice: 2.75, reorderLevel: 10, unitsOrdered: 108, unitsSold: 70 },
    { id: "10005", name: "Watermelon", emoji: "ðŸ‰", category: "Melon", unitPrice: 4.50, reorderLevel: 8, unitsOrdered: 1037, unitsSold: 900 },
    { id: "10006", name: "Guava", emoji: "ðŸˆ", category: "Tropical", unitPrice: 1.05, reorderLevel: 12, unitsOrdered: 17, unitsSold: 6 },
    { id: "10007", name: "Muskmelon", emoji: "ðŸˆ", category: "Melon", unitPrice: 2.20, reorderLevel: 10, unitsOrdered: 155, unitsSold: 120 },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "S01", name: "Nature's Basket", contact: "Rina Kapoor", phone: "555-0114", email: "orders@naturesbasket.com" },
    { id: "S02", name: "Golden Goose Farms", contact: "Marco Diaz", phone: "555-0128", email: "sales@goldengoose.farm" },
    { id: "S03", name: "Yellow Tail Produce Co.", contact: "Wei Chen", phone: "555-0142", email: "wei@yellowtail.co" },
    { id: "S04", name: "Grandma Kelly's Homestead", contact: "Anna Kelly", phone: "555-0157", email: "anna@gkhomestead.com" },
    { id: "S05", name: "Creator Owl Organics", contact: "Sam Torres", phone: "555-0163", email: "sam@creatorowl.org" },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    { id: "C01", name: "Green Leaf Grocers", email: "buy@greenleaf.com", phone: "555-2001" },
    { id: "C02", name: "Sunrise Cafe", email: "kitchen@sunrise.io", phone: "555-2014" },
    { id: "C03", name: "Maple Street Market", email: "ops@maplemkt.com", phone: "555-2029" },
    { id: "C04", name: "Fresh & Co. Catering", email: "hello@freshco.com", phone: "555-2033" },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([
    { id: "PO40", partyId: "S02", date: "2026-05-02", status: "fulfilled", items: [{ productId: "10001", qty: 60, price: 1.20 }, { productId: "10002", qty: 12, price: 0.55 }] },
    { id: "PO55", partyId: "S03", date: "2026-05-14", status: "fulfilled", items: [{ productId: "10002", qty: 12, price: 0.55 }] },
    { id: "PO61", partyId: "S02", date: "2026-05-20", status: "open", items: [{ productId: "10001", qty: 30, price: 1.20 }] },
    { id: "PO63", partyId: "S01", date: "2026-05-24", status: "fulfilled", items: [{ productId: "10006", qty: 17, price: 1.05 }, { productId: "10003", qty: 7, price: 0.85 }, { productId: "10005", qty: 35, price: 4.50 }] },
    { id: "PO70", partyId: "S01", date: "2026-06-01", status: "open", items: [{ productId: "10003", qty: 20, price: 0.85 }] },
    { id: "PO72", partyId: "S02", date: "2026-06-04", status: "pending", items: [{ productId: "10007", qty: 25, price: 2.20 }] },
  ]);

  const [salesOrders, setSalesOrders] = useState<Order[]>([
    { id: "SO12", partyId: "C01", date: "2026-05-10", status: "fulfilled", items: [{ productId: "10002", qty: 12, price: 0.55 }] },
    { id: "SO31", partyId: "C02", date: "2026-05-19", status: "fulfilled", items: [{ productId: "10001", qty: 31, price: 1.20 }] },
    { id: "SO50", partyId: "C03", date: "2026-05-28", status: "fulfilled", items: [{ productId: "10004", qty: 55, price: 2.75 }] },
    { id: "SO63", partyId: "C04", date: "2026-06-02", status: "open", items: [{ productId: "10005", qty: 1000, price: 4.50 }, { productId: "10007", qty: 150, price: 2.20 }] },
    { id: "SO65", partyId: "C01", date: "2026-06-05", status: "pending", items: [{ productId: "10001", qty: 20, price: 1.20 }, { productId: "10003", qty: 2, price: 0.85 }] },
  ]);

  const [idCounters, setIdCounters] = useState({ po: 73, so: 66, prod: 10008, sup: 6, cust: 5 });

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
  const inventoryOf = (p: Product) => p.unitsOrdered - p.unitsSold;
  
  const stockState = (p: Product) => {
    const inv = inventoryOf(p);
    if (inv <= 0) return "out";
    if (inv <= p.reorderLevel) return "low";
    return "in";
  };

  const getProductById = (id: string) => products.find(p => p.id === id);
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);
  const getCustomerById = (id: string) => customers.find(c => c.id === id);

  const orderTotal = (order: Order) => {
    return order.items.reduce((sum, item) => {
      const p = getProductById(item.productId);
      const price = item.price !== undefined ? item.price : (p ? p.unitPrice : 0);
      return sum + price * item.qty;
    }, 0);
  };

  const itemsSummary = (items: OrderItem[]) => {
    return items.map(item => {
      const p = getProductById(item.productId);
      return `${p ? p.emoji : ""} ${p ? p.name : "â€”"} Ã—${item.qty}`;
    }).join(", ");
  };

  /* ============================= CRUD MODAL STATE ============================= */
  const [modalType, setModalType] = useState<"product" | "supplier" | "customer" | "order" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderKind, setOrderKind] = useState<"purchase" | "sales">("purchase");

  // Forms state
  const [productForm, setProductForm] = useState({ name: "", emoji: "ðŸŽ", category: "", unitPrice: 0, reorderLevel: 10, unitsOrdered: 0, unitsSold: 0 });
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", phone: "", email: "" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });
  const [orderForm, setOrderForm] = useState({
    partyId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "open" as "open" | "pending" | "fulfilled",
    items: [{ productId: "", qty: 1, price: 0 }]
  });

  /* ============================= HANDLERS ============================= */
  const openProductModal = (id?: string) => {
    if (id) {
      const p = getProductById(id);
      if (p) {
        setProductForm({ ...p });
        setEditingId(id);
      }
    } else {
      setProductForm({ name: "", emoji: "ðŸŽ", category: "", unitPrice: 0.00, reorderLevel: 10, unitsOrdered: 0, unitsSold: 0 });
      setEditingId(null);
    }
    setModalType("product");
  };

  const saveProduct = () => {
    if (!productForm.name.trim()) {
      toast.error("Please fill in the product name.");
      return;
    }
    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...productForm } : p));
      toast.success("Product updated successfully.");
    } else {
      const newId = String(idCounters.prod);
      setProducts(prev => [...prev, { id: newId, ...productForm }]);
      setIdCounters(prev => ({ ...prev, prod: prev.prod + 1 }));
      toast.success("Product created successfully.");
    }
    setModalType(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm("Delete this product? This cannot be undone.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Product deleted.");
    }
  };

  const openSupplierModal = (id?: string) => {
    if (id) {
      const s = getSupplierById(id);
      if (s) {
        setSupplierForm({ ...s });
        setEditingId(id);
      }
    } else {
      setSupplierForm({ name: "", contact: "", phone: "", email: "" });
      setEditingId(null);
    }
    setModalType("supplier");
  };

  const saveSupplier = () => {
    if (!supplierForm.name.trim()) {
      toast.error("Supplier name required.");
      return;
    }
    if (editingId) {
      setSuppliers(prev => prev.map(s => s.id === editingId ? { ...s, ...supplierForm } : s));
      toast.success("Supplier updated.");
    } else {
      const newId = "S" + String(idCounters.sup).padStart(2, "0");
      setSuppliers(prev => [...prev, { id: newId, ...supplierForm }]);
      setIdCounters(prev => ({ ...prev, sup: prev.sup + 1 }));
      toast.success("Supplier added.");
    }
    setModalType(null);
  };

  const deleteSupplier = (id: string) => {
    if (confirm("Delete this supplier?")) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success("Supplier deleted.");
    }
  };

  const openCustomerModal = (id?: string) => {
    if (id) {
      const c = getCustomerById(id);
      if (c) {
        setCustomerForm({ ...c });
        setEditingId(id);
      }
    } else {
      setCustomerForm({ name: "", email: "", phone: "" });
      setEditingId(null);
    }
    setModalType("customer");
  };

  const saveCustomer = () => {
    if (!customerForm.name.trim()) {
      toast.error("Customer name required.");
      return;
    }
    if (editingId) {
      setCustomers(prev => prev.map(c => c.id === editingId ? { ...c, ...customerForm } : c));
      toast.success("Customer updated.");
    } else {
      const newId = "C" + String(idCounters.cust).padStart(2, "0");
      setCustomers(prev => [...prev, { id: newId, ...customerForm }]);
      setIdCounters(prev => ({ ...prev, cust: prev.cust + 1 }));
      toast.success("Customer added.");
    }
    setModalType(null);
  };

  const deleteCustomer = (id: string) => {
    if (confirm("Delete this customer?")) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success("Customer deleted.");
    }
  };

  const openOrderModal = (kind: "purchase" | "sales", id?: string) => {
    setOrderKind(kind);
    const list = kind === "purchase" ? purchaseOrders : salesOrders;
    const defaultParty = kind === "purchase" ? suppliers[0]?.id : customers[0]?.id;
    if (id) {
      const o = list.find(x => x.id === id);
      if (o) {
        setOrderForm({
          partyId: o.partyId,
          date: o.date,
          status: o.status,
          items: o.items.map(it => ({ ...it }))
        });
        setEditingId(id);
      }
    } else {
      setOrderForm({
        partyId: defaultParty || "",
        date: new Date().toISOString().slice(0, 10),
        status: "open",
        items: [{ productId: products[0]?.id || "", qty: 1, price: products[0]?.unitPrice || 0 }]
      });
      setEditingId(null);
    }
    setModalType("order");
  };

  const saveOrder = () => {
    if (!orderForm.partyId) {
      toast.error(`Please select a ${orderKind === "purchase" ? "supplier" : "customer"}.`);
      return;
    }
    const validLines = orderForm.items.filter(it => it.productId && it.qty > 0);
    if (validLines.length === 0) {
      toast.error("Add at least one valid line item.");
      return;
    }

    const payload: Order = {
      id: editingId || (orderKind === "purchase" ? "PO" + idCounters.po : "SO" + idCounters.so),
      partyId: orderForm.partyId,
      date: orderForm.date,
      status: orderForm.status,
      items: validLines
    };

    if (orderKind === "purchase") {
      if (editingId) {
        setPurchaseOrders(prev => prev.map(o => o.id === editingId ? payload : o));
      } else {
        setPurchaseOrders(prev => [...prev, payload]);
        setIdCounters(prev => ({ ...prev, po: prev.po + 1 }));
      }
      toast.success("Purchase order saved.");
    } else {
      if (editingId) {
        setSalesOrders(prev => prev.map(o => o.id === editingId ? payload : o));
      } else {
        setSalesOrders(prev => [...prev, payload]);
        setIdCounters(prev => ({ ...prev, so: prev.so + 1 }));
      }
      toast.success("Sales order saved.");
    }
    setModalType(null);
  };

  const deleteOrder = (kind: "purchase" | "sales", id: string) => {
    if (confirm(`Delete this ${kind} order?`)) {
      if (kind === "purchase") {
        setPurchaseOrders(prev => prev.filter(o => o.id !== id));
      } else {
        setSalesOrders(prev => prev.filter(o => o.id !== id));
      }
      toast.success("Order deleted.");
    }
  };

  /* ============================= RENDER ANALYTICS ============================= */
  const totalInvUnits = products.reduce((s, p) => s + inventoryOf(p), 0);
  const totalInvValue = products.reduce((s, p) => s + inventoryOf(p) * p.unitPrice, 0);
  const lowStock = products.filter(p => stockState(p) !== "in");
  const openPOs = purchaseOrders.filter(o => o.status !== "fulfilled").length;
  const openSOs = salesOrders.filter(o => o.status !== "fulfilled").length;
  const topSeller = [...products].sort((a, b) => b.unitsSold - a.unitsSold)[0];

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5 bg-white -mx-6 px-6 -mt-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
            <Package className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0d0d2b]">Inventory Management</h1>
            <p className="text-[#6b7094] text-xs font-semibold uppercase tracking-wider mt-0.5">Facility &amp; Stock Hub</p>
          </div>
        </div>
        <div className="text-right text-xs text-[#6b7094] font-bold bg-slate-50 border border-slate-200/50 px-4 py-2.5 rounded-xl self-start sm:self-auto">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          <span className="block text-[10px] text-indigo-600 mt-0.5">
            {lowStock.length > 0 ? `${lowStock.length} items need restock` : "All stock levels healthy"}
          </span>
        </div>
      </div>

      {/* Pill Tab Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 overflow-x-auto max-w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none ${
                isActive 
                  ? "bg-[#0d0d2b] text-white shadow-sm" 
                  : "text-[#6b7094] hover:text-[#0d0d2b] bg-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================= SUBVIEWS ============================= */}

      {/* 1. DASHBOARD VIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:width-[4px] before:bg-indigo-600">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-2">Units in stock</span>
              <h3 className="text-2xl font-black">{totalInvUnits.toLocaleString()}</h3>
              <p className="text-xs text-[#6b7094] mt-2">across {products.length} products</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:width-[4px] before:bg-indigo-400">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-2">Inventory value</span>
              <h3 className="text-2xl font-black">₹{totalInvValue.toFixed(2)}</h3>
              <p className="text-xs text-[#6b7094] mt-2">at current unit prices</p>
            </div>
            <div className={`bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:width-[4px] ${lowStock.length > 0 ? "before:bg-red-500" : "before:bg-emerald-500"}`}>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-2">Needs Restock</span>
              <h3 className="text-2xl font-black">{lowStock.length}</h3>
              <p className="text-xs text-[#6b7094] truncate mt-2">{lowStock.length ? lowStock.map(p => p.name).join(", ") : "nothing right now"}</p>
            </div>
            <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:width-[4px] before:bg-amber-500">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-2">Open Orders</span>
              <h3 className="text-2xl font-black">{openPOs + openSOs}</h3>
              <p className="text-xs text-[#6b7094] mt-2">{openPOs} purchase Â· {openSOs} sales</p>
            </div>
          </div>

          <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-[#0d0d2b]">Stock at a Glance</h3>
                {topSeller && <p className="text-xs text-[#6b7094] mt-0.5">Top mover: {topSeller.emoji} {topSeller.name} â€” {topSeller.unitsSold} units sold</p>}
              </div>
            </div>
            <div className="overflow-x-auto">
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
          <div className="overflow-x-auto">
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
                          <button onClick={() => deleteProduct(p.id)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
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
          <div className="overflow-x-auto">
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
                  const openCount = purchaseOrders.filter(o => o.partyId === s.id && o.status !== "fulfilled").length;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-sm text-[#0d0d2b] block">{s.name}</span>
                        <span className="text-[10px] font-mono text-[#6b7094] font-semibold tracking-wider">#{s.id}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{s.contact}</td>
                      <td className="px-5 py-3.5 text-sm font-mono">{s.phone}</td>
                      <td className="px-5 py-3.5 text-sm">{s.email}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold">{openCount}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openSupplierModal(s.id)} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-[#0d0d2b] flex items-center justify-center transition-all cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteSupplier(s.id)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
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
          <div className="overflow-x-auto">
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
                  const openCount = salesOrders.filter(o => o.partyId === c.id && o.status !== "fulfilled").length;
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
                          <button onClick={() => deleteCustomer(c.id)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
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
          <div className="overflow-x-auto">
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
                      <td className="px-5 py-3.5 font-bold font-mono text-sm">#{o.id}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold">{sup ? sup.name : "â€”"}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{o.date}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] max-w-[280px] truncate">{itemsSummary(o.items)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          o.status === "fulfilled" ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : o.status === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200" 
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
                          <button onClick={() => deleteOrder("purchase", o.id)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
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
          <div className="overflow-x-auto">
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
                      <td className="px-5 py-3.5 font-bold font-mono text-sm">#{o.id}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold">{cust ? cust.name : "â€”"}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] font-semibold">{o.date}</td>
                      <td className="px-5 py-3.5 text-xs text-[#6b7094] max-w-[280px] truncate">{itemsSummary(o.items)}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-indigo-600">₹{orderTotal(o).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          o.status === "fulfilled" ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : o.status === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200" 
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
                          <button onClick={() => deleteOrder("sales", o.id)} className="h-8 w-8 rounded-lg bg-red-50 border border-red-200/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer">
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
        </div>
      )}

      {/* ============================= MODAL POPUPS ============================= */}

      {/* Product Form Modal */}
      {modalType === "product" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">âœ•</button>
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
              <button onClick={saveProduct} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none">{editingId ? "Save Changes" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {modalType === "supplier" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">âœ•</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Supplier Name</label>
                <input type="text" value={supplierForm.name} onChange={e => setSupplierForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Nature's Basket" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Contact Person</label>
                <input type="text" value={supplierForm.contact} onChange={e => setSupplierForm(prev => ({ ...prev, contact: e.target.value }))} placeholder="e.g. Sam Torres" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
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
              <button onClick={saveSupplier} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none">{editingId ? "Save Changes" : "Add Supplier"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {modalType === "customer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? "Edit Customer" : "Add Customer"}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">âœ•</button>
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
              <button onClick={saveCustomer} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none">{editingId ? "Save Changes" : "Add Customer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal (PO & SO) */}
      {modalType === "order" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">{editingId ? `Edit ${orderKind} order #${editingId}` : `New ${orderKind} order`}</h3>
              <button onClick={() => setModalType(null)} className="text-[#6b7094] hover:text-[#0d0d2b] bg-transparent border-none text-lg">âœ•</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">{orderKind === "purchase" ? "Supplier" : "Customer"}</label>
                  <select value={orderForm.partyId} onChange={e => setOrderForm(prev => ({ ...prev, partyId: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 cursor-pointer">
                    {(orderKind === "purchase" ? suppliers : customers).map(x => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Date</label>
                  <input type="date" value={orderForm.date} onChange={e => setOrderForm(prev => ({ ...prev, date: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block mb-1">Status</label>
                <select value={orderForm.status} onChange={e => setOrderForm(prev => ({ ...prev, status: e.target.value as any }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#0d0d2b] focus:outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#6b7094] block">Line items</label>
                  <button onClick={() => setOrderForm(prev => ({ ...prev, items: [...prev.items, { productId: products[0]?.id || "", qty: 1, price: products[0]?.unitPrice || 0 }] }))} className="text-xs text-indigo-600 bg-transparent border-none font-bold hover:underline cursor-pointer">+ Add item</button>
                </div>
                <div className="border border-slate-200 border-dashed rounded-xl p-3 space-y-2">
                  {orderForm.items.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select 
                          value={line.productId} 
                          onChange={e => {
                            const prodId = e.target.value;
                            const prodObj = getProductById(prodId);
                            setOrderForm(prev => {
                              const list = [...prev.items];
                              list[idx] = { productId: prodId, qty: line.qty, price: prodObj ? prodObj.unitPrice : 0 };
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
                          value={line.price} 
                          onChange={e => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setOrderForm(prev => {
                              const list = [...prev.items];
                              list[idx].price = val;
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
                            return { ...prev, items: filtered.length > 0 ? filtered : [{ productId: products[0]?.id || "", qty: 1, price: products[0]?.unitPrice || 0 }] };
                          })} 
                          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer flex items-center justify-center w-full"
                        >
                          âœ•
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setModalType(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0d0d2b] font-bold rounded-xl text-xs transition-all cursor-pointer border-none">Cancel</button>
              <button onClick={saveOrder} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer border-none">{editingId ? "Save Changes" : "Create Order"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

