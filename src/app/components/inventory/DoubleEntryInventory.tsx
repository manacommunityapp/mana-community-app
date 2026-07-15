import { useState, useEffect } from "react";
import { 
  Package, RefreshCw, FileText, Sliders, Building, MapPin, 
  TrendingUp, Plus, CheckCircle2, XCircle, AlertCircle, Calendar, 
  DollarSign, ChevronRight, Play, Check, X, Clipboard,
  Grid, Settings, FolderTree, Activity, Archive, Tags
} from "lucide-react";
import { stockService } from "../../../services/stockService";
import type { 
  Product, Warehouse, Location, PickingTypeStats, Picking, 
  StockLevelReport, MoveHistoryReport 
} from "../../../services/stockService";
import { toast } from "sonner";
import { InventoryOverviewDashboard } from "./InventoryOverviewDashboard";
import { LotsManagement } from "./LotsManagement";
import { ScrapManagement } from "./ScrapManagement";

type MenuSection = "overview" | "scrap" | "lots" | "products" | "moves-history" | "moves-analysis" | "stock" | "settings" | "warehouses" | "operation-types" | "categories";

const PRODUCT_CATEGORIES = [
  { id: 1, name: "All / Saleable" },
  { id: 2, name: "Raw Materials" },
  { id: 3, name: "Finished Goods" },
  { id: 4, name: "Consumables" }
];

export function DoubleEntryInventory() {
  const [activeMenu, setActiveMenu] = useState<MenuSection>("overview");
  const [stats, setStats] = useState<PickingTypeStats[]>([]);
  const [pickings, setPickings] = useState<Picking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockReport, setStockReport] = useState<StockLevelReport[]>([]);
  const [movesReport, setMovesReport] = useState<MoveHistoryReport[]>([]);
  
  // Selection/Modals state
  const [selectedPickingType, setSelectedPickingType] = useState<PickingTypeStats | null>(null);
  const [selectedPicking, setSelectedPicking] = useState<Picking | null>(null);
  const [isCreatePickingOpen, setIsCreatePickingOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Verification & Filtering state
  const [valLines, setValLines] = useState<Record<number, number>>({});
  const [pickingsFilter, setPickingsFilter] = useState<"all" | "late">("all");
  const [creatingProductForLineIdx, setCreatingProductForLineIdx] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);

  // Settings states
  const [settingsToggles, setSettingsToggles] = useState({
    multiStep: true,
    storageLocations: true,
    trackingLots: true,
    packages: false
  });

  // Form states

  const [newPicking, setNewPicking] = useState({
    pickingTypeId: 0,
    partnerId: "",
    locationId: 0,
    locationDestId: 0,
    scheduledDate: "",
    origin: "",
    lines: [{ productId: 0, productQty: 1 }]
  });

  const [newProduct, setNewProduct] = useState<Omit<Product, "id" | "qtyAvailable">>({
    name: "",
    defaultCode: "",
    barcode: "",
    listPrice: 0,
    standardPrice: 0,
    type: "STORABLE",
    tracking: "NONE"
  });

  // Load Initial Data
  const loadStats = async () => {
    try {
      const data = await stockService.getPickingTypeStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load operations stats", err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await stockService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await stockService.getLocations();
      setLocations(data);
    } catch (err) {
      console.error("Failed to load locations", err);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await stockService.getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error("Failed to load warehouses", err);
    }
  };

  const loadReports = async () => {
    try {
      const stockData = await stockService.getStockLevelReport();
      const movesData = await stockService.getMoveHistoryReport();
      setStockReport(stockData);
      setMovesReport(movesData);
    } catch (err) {
      console.error("Failed to load reporting data", err);
    }
  };

  const loadPickings = async () => {
    try {
      const data = await stockService.getPickings();
      setPickings(data);
    } catch (err) {
      console.error("Failed to load pickings", err);
    }
  };

  useEffect(() => {
    loadStats();
    loadProducts();
    loadLocations();
    loadWarehouses();
    loadReports();
    loadPickings();
  }, [activeMenu]);

  useEffect(() => {
    if (selectedPicking && selectedPicking.moveLines) {
      const initialLines: Record<number, number> = {};
      selectedPicking.moveLines.forEach(l => {
        initialLines[l.productId] = l.qtyDone || l.productQty;
      });
      setValLines(initialLines);
    } else {
      setValLines({});
    }
  }, [selectedPicking]);

  // Handle Pickings (Transfers) Operations
  const handleConfirmPicking = async (id: number) => {
    try {
      const updated = await stockService.confirmPicking(id);
      toast.success(`Transfer ${updated.name} confirmed!`);
      setSelectedPicking(updated);
      loadPickings();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm picking");
    }
  };

  const handleValidatePicking = async (id: number) => {
    try {
      const linesPayload = selectedPicking?.moveLines?.map(l => ({
        productId: l.productId,
        productQty: l.productQty,
        qtyDone: valLines[l.productId] !== undefined ? valLines[l.productId] : l.productQty
      })) || [];

      const updated = await stockService.validatePicking(id, linesPayload);
      toast.success(`Transfer ${updated.name} validated and stock moved!`);
      setSelectedPicking(updated);
      loadPickings();
      loadStats();
      loadReports();
    } catch (err: any) {
      toast.error(err.message || "Failed to validate picking");
    }
  };

  const handleCreatePickingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanLines = newPicking.lines.filter(l => l.productId > 0 && l.productQty > 0);
      if (cleanLines.length === 0) {
        toast.error("Please add at least one valid product line.");
        return;
      }

      await stockService.createPicking({
        pickingTypeId: newPicking.pickingTypeId,
        locationId: newPicking.locationId,
        locationDestId: newPicking.locationDestId,
        scheduledDate: newPicking.scheduledDate ? new Date(newPicking.scheduledDate).toISOString() : undefined,
        origin: newPicking.origin || undefined,
        moveLines: cleanLines
      });

      toast.success("Transfer created successfully!");
      setIsCreatePickingOpen(false);
      loadPickings();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to create transfer");
    }
  };



  // Handle Products operations
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await stockService.createProduct({
        ...newProduct,
        categId: selectedCategoryId
      } as any);

      toast.success(`Product ${newProduct.name} registered successfully!`);

      // Auto-select line in picking if product creation was triggered inline
      if (creatingProductForLineIdx !== null) {
        const updatedLines = [...newPicking.lines];
        updatedLines[creatingProductForLineIdx].productId = saved.id!;
        setNewPicking(prev => ({ ...prev, lines: updatedLines }));
        setCreatingProductForLineIdx(null);
      }

      setNewProduct({
        name: "",
        defaultCode: "",
        barcode: "",
        listPrice: 0,
        standardPrice: 0,
        type: "STORABLE",
        tracking: "NONE"
      });
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    }
  };

  const handleUpdateProductQty = async (productId: number, currentQty: number) => {
    const qtyStr = prompt("Enter new Quantity on Hand:", String(currentQty));
    if (qtyStr === null) return;
    const qty = parseFloat(qtyStr);
    if (isNaN(qty)) {
      toast.error("Please enter a valid number.");
      return;
    }

    try {
      const stockLoc = locations.find(l => l.completeName.endsWith("/Stock"));
      if (!stockLoc) {
        toast.error("Main storage location not found to register manual count.");
        return;
      }

      await stockService.createPicking({
        pickingTypeId: stats.find(s => s.code === "INCOMING")?.id || 1,
        locationId: locations.find(l => l.usage === "VENDOR")?.id || 2,
        locationDestId: stockLoc.id,
        origin: "Manual Inventory Adjustment",
        moveLines: [{ productId, productQty: qty }]
      });

      toast.success("Inventory adjustment generated! Validate draft incoming transfer to apply counts.");
      loadPickings();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock levels");
    }
  };

  // Helper check to calculate shortfall warnings
  const shortfallCheck = () => {
    if (!selectedPicking || !selectedPicking.moveLines) return false;
    return selectedPicking.moveLines.some(l => {
      const done = valLines[l.productId] !== undefined ? valLines[l.productId] : l.qtyDone;
      return done < l.productQty;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[560px] bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
      {/* ──── LEFT APP SUBMENU SIDEBAR ──── */}
      <aside className="w-full lg:w-60 bg-white border border-[#dee2e6] rounded-[4px] p-4 flex flex-col gap-5 shrink-0 shadow-sm">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Main</span>
          <button 
            onClick={() => { setActiveMenu("overview"); setSelectedPicking(null); setSelectedPickingType(null); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeMenu === "overview" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Operations</span>
          <button 
            onClick={() => setActiveMenu("scrap")}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeMenu === "scrap" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-[#017e84]/5 hover:text-slate-900 bg-transparent"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Scrap
          </button>
          <button 
            onClick={() => setActiveMenu("lots")}
            className={`w-full text-left px-3 py-2 mt-1 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeMenu === "lots" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-[#017e84]/5 hover:text-slate-900 bg-transparent"
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            Lots & Serials
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Products</span>
          <button 
            onClick={() => setActiveMenu("products")}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeMenu === "products" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Reporting</span>
          <div className="flex flex-col gap-0.5">
            <button 
              onClick={() => setActiveMenu("moves-history")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "moves-history" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Moves History
            </button>
            <button 
              onClick={() => setActiveMenu("moves-analysis")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "moves-analysis" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Moves Analysis
            </button>
            <button 
              onClick={() => setActiveMenu("stock")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "stock" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Stock
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">Configuration</span>
          <div className="flex flex-col gap-0.5">
            <button 
              onClick={() => setActiveMenu("settings")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "settings" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button 
              onClick={() => setActiveMenu("warehouses")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "warehouses" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Warehouses
            </button>
            <button 
              onClick={() => setActiveMenu("operation-types")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "operation-types" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Operation Types
            </button>
            <button 
              onClick={() => setActiveMenu("categories")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
                activeMenu === "categories" ? "bg-[#017e84]/10 text-[#017e84] font-extrabold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 bg-transparent"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Product Categories
            </button>
          </div>
        </div>
      </aside>

      {/* ──── RIGHT CONTENT AREA ──── */}
      <div className="flex-grow bg-white border border-[#dee2e6] rounded-[4px] p-6 shadow-sm overflow-x-auto min-h-[500px]">

        {/* OVERVIEW */}
        {activeMenu === "overview" && !selectedPickingType && !selectedPicking && (
          <InventoryOverviewDashboard
            stats={stats}
            locations={locations}
            pickings={pickings}
            products={products}
            onCreatePicking={async (payload) => {
              await stockService.createPicking(payload);
              toast.success("Transfer created successfully!");
              loadPickings();
              loadStats();
            }}
            onValidatePicking={async (id, lines) => {
              await stockService.validatePicking(id, lines);
              toast.success("Transfer validated and stock moved!");
              loadPickings();
              loadStats();
              loadReports();
            }}
            onCreateProduct={async (payload) => {
              const saved = await stockService.createProduct(payload);
              toast.success(`Product ${saved.name} registered!`);
              loadProducts();
              return saved;
            }}
          />
        )}

        {/* Overview -> List Transfers of specific Type */}
        {activeMenu === "overview" && selectedPickingType && !selectedPicking && (
          <div className="bg-white p-2 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dee2e6]/40 pb-3">
              <div>
                <button 
                  onClick={() => setSelectedPickingType(null)}
                  className="text-xs text-indigo-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
                >
                  ← Back to Overview
                </button>
                <h3 className="font-extrabold text-lg mt-1 text-slate-800">
                  {selectedPickingType.code === "OUTGOING" ? "Delivery Orders" : selectedPickingType.code === "INCOMING" ? "Receipts" : selectedPickingType.name} Transfers ({pickingsFilter === "late" ? "LATE ONLY" : "ALL"})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Origin Document</th>
                    <th className="pb-3">Scheduled Date</th>
                    <th className="pb-3 text-right">State</th>
                  </tr>
                </thead>
                <tbody>
                  {pickings
                    .filter(p => p.pickingTypeId === selectedPickingType.id)
                    .filter(p => {
                      if (pickingsFilter === "late") {
                        const isLate = p.scheduledDate && new Date(p.scheduledDate) < new Date() && p.state !== "DONE" && p.state !== "CANCEL";
                        return isLate;
                      }
                      return true;
                    })
                    .map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 font-bold text-indigo-600 cursor-pointer hover:underline" onClick={() => setSelectedPicking(p)}>
                          {p.name}
                        </td>
                        <td className="py-3 text-slate-600">{p.origin || "—"}</td>
                        <td className="py-3 text-slate-600">
                          {p.scheduledDate ? new Date(p.scheduledDate).toLocaleString() : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            p.state === "DONE" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                              : p.state === "ASSIGNED"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : p.state === "CONFIRMED"
                              ? "bg-purple-50 text-purple-600 border-purple-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {p.state}
                          </span>
                        </td>
                      </tr>
                  ))}
                  {pickings
                    .filter(p => p.pickingTypeId === selectedPickingType.id)
                    .filter(p => {
                      if (pickingsFilter === "late") {
                        return p.scheduledDate && new Date(p.scheduledDate) < new Date() && p.state !== "DONE" && p.state !== "CANCEL";
                      }
                      return true;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                          {pickingsFilter === "late" ? "No late transfers — nice work." : "No active transfers to process."}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview -> Picking Detailed Form View */}
        {activeMenu === "overview" && selectedPicking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <button 
                  onClick={() => setSelectedPicking(null)}
                  className="text-xs text-indigo-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
                >
                  ← Back to List
                </button>
                <h3 className="font-extrabold text-lg mt-1 text-slate-800">{selectedPicking.name}</h3>
              </div>
              
              <div className="flex gap-2">
                {selectedPicking.state === "DRAFT" && (
                  <button 
                    onClick={() => handleConfirmPicking(selectedPicking.id!)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer border-none"
                  >
                    Mark as Todo
                  </button>
                )}
                {selectedPicking.state === "CONFIRMED" && (
                  <button 
                    onClick={() => handleConfirmPicking(selectedPicking.id!)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer border-none"
                  >
                    Check Availability
                  </button>
                )}
                {selectedPicking.state === "ASSIGNED" && (
                  <button 
                    onClick={() => handleValidatePicking(selectedPicking.id!)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer border-none"
                  >
                    Validate
                  </button>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold border border-slate-200 uppercase tracking-wider flex items-center">
                  State: {selectedPicking.state}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">Source:</span>
                  <span className="col-span-2 text-slate-800">
                    {locations.find(l => l.id === selectedPicking.locationId)?.completeName || selectedPicking.locationId}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">Destination:</span>
                  <span className="col-span-2 font-bold text-indigo-600">
                    {locations.find(l => l.id === selectedPicking.locationDestId)?.completeName || selectedPicking.locationDestId}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">Scheduled:</span>
                  <span className="col-span-2 text-slate-800">
                    {selectedPicking.scheduledDate ? new Date(selectedPicking.scheduledDate).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">Source PO/SO:</span>
                  <span className="col-span-2 text-slate-800">{selectedPicking.origin || "—"}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Demand</th>
                    <th className="p-3 text-center">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPicking.moveLines?.map((line) => (
                    <tr key={line.id} className="border-b border-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{line.productName || `Product #${line.productId}`}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{line.productQty}</td>
                      <td className="p-3 text-center">
                        {selectedPicking.state !== "DONE" && selectedPicking.state !== "CANCEL" ? (
                          <input 
                            type="number"
                            value={valLines[line.productId] !== undefined ? valLines[line.productId] : line.productQty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setValLines(prev => ({ ...prev, [line.productId]: val }));
                            }}
                            className="w-16 p-1 border border-slate-200 rounded text-center outline-none bg-white font-bold"
                            min="0"
                            step="any"
                          />
                        ) : (
                          <span className="font-black text-indigo-600">{line.qtyDone}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {shortfallCheck() && selectedPicking.state !== "DONE" && selectedPicking.state !== "CANCEL" && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-[#8c5600] rounded-lg text-xs font-semibold">
                ⚠️ Remaining units will generate a backorder.
              </div>
            )}
          </div>
        )}

        {/* OPERATIONS -> SCRAP */}
        {activeMenu === "scrap" && (
          <ScrapManagement
            products={products}
            locations={locations}
            onScrapSuccess={loadReports}
          />
        )}

        {/* OPERATIONS -> LOTS & SERIALS */}
        {activeMenu === "lots" && (
          <LotsManagement
            products={products}
          />
        )}

        {/* PRODUCTS -> PRODUCTS */}
        {activeMenu === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">Products Catalog</h3>
              <button 
                onClick={() => {
                  setCreatingProductForLineIdx(null);
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#017e84] hover:bg-[#015a5e] text-white rounded-[3px] text-xs font-bold transition-all shadow-sm cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-[#017e84]/20 hover:shadow-md transition-all duration-300 group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">SKU: {p.defaultCode || "—"}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        {p.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-indigo-50 border border-indigo-100/50 rounded-xl flex items-center justify-center text-xl">
                        {p.name.toLowerCase().includes("mower") ? "🌱" : p.name.toLowerCase().includes("drill") ? "🛠️" : p.name.toLowerCase().includes("ladder") ? "🪜" : "📦"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0d0d2b] group-hover:text-[#017e84] transition-colors">
                          {p.name}
                        </h4>
                        <span className="text-[9px] font-bold text-[#017e84] uppercase tracking-wider">
                          Barcode: {p.barcode || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Sales Price</span>
                        <span className="font-extrabold text-slate-800">₹{p.listPrice?.toLocaleString() || "0.00"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Cost Price</span>
                        <span className="font-bold text-slate-600">₹{p.standardPrice?.toLocaleString() || "0.00"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => handleUpdateProductQty(p.id!, p.qtyAvailable || 0)}
                      className="flex-grow py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
                    >
                      Update Count ({p.qtyAvailable || 0} On Hand)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTING -> MOVES HISTORY */}
        {activeMenu === "moves-history" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Moves History</h3>
            <p className="text-xs text-slate-500">Audit trail of all registered and completed stock movement lines.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">From</th>
                    <th className="pb-3">To</th>
                    <th className="pb-3 text-right">Quantity Done</th>
                  </tr>
                </thead>
                <tbody>
                  {movesReport.map((rep) => (
                    <tr key={rep.moveLineId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-500">{new Date(rep.date).toLocaleString()}</td>
                      <td className="py-3 font-bold text-indigo-600">{rep.reference}</td>
                      <td className="py-3 text-slate-800 font-bold">{rep.productName}</td>
                      <td className="py-3 text-slate-600">{rep.sourceLocation}</td>
                      <td className="py-3 text-slate-600">{rep.destLocation}</td>
                      <td className={`py-3 text-right font-bold ${rep.qtyDone > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {rep.qtyDone > 0 ? `+${rep.qtyDone}` : rep.qtyDone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTING -> MOVES ANALYSIS */}
        {activeMenu === "moves-analysis" && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Moves Analysis</h3>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-4">
              <h4 className="font-bold text-xs text-slate-700">Weekly Movements Analysis (Done Qty)</h4>
              
              <div className="flex items-end justify-around h-48 border-b-2 border-slate-200 pb-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600" style={{ height: "140px" }} />
                  <span className="text-[10px] text-slate-500 font-bold">W26 Receipts</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 bg-[#017e84] rounded-t-lg transition-all hover:bg-[#015a5e]" style={{ height: "30px" }} />
                  <span className="text-[10px] text-slate-500 font-bold">W26 Shipments</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTING -> STOCK */}
        {activeMenu === "stock" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Stock Levels & Valuation</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Internal Reference</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3 text-right">Physical On Hand</th>
                    <th className="pb-3 text-right">Reserved Units</th>
                    <th className="pb-3 text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stockReport.map((rep, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800">{rep.productName}</td>
                      <td className="py-3 text-slate-600 font-mono">{rep.defaultCode || "—"}</td>
                      <td className="py-3 text-indigo-600">{rep.locationName}</td>
                      <td className="py-3 text-right font-black text-slate-800">{rep.onHand}</td>
                      <td className="py-3 text-right text-rose-500 font-bold">{rep.reserved}</td>
                      <td className="py-3 text-right text-emerald-600 font-extrabold">{rep.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONFIGURATION -> SETTINGS */}
        {activeMenu === "settings" && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Inventory Settings</h3>
            <p className="text-xs text-slate-500">Configure global warehouse feature toggles.</p>

            <div className="space-y-4 max-w-md text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settingsToggles.multiStep} 
                  onChange={(e) => setSettingsToggles(prev => ({ ...prev, multiStep: e.target.checked }))} 
                />
                Multi-Step Routes & Operations routing
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settingsToggles.storageLocations} 
                  onChange={(e) => setSettingsToggles(prev => ({ ...prev, storageLocations: e.target.checked }))} 
                />
                Track individual Storage Locations
              </label>
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settingsToggles.trackingLots} 
                  onChange={(e) => setSettingsToggles(prev => ({ ...prev, trackingLots: e.target.checked }))} 
                />
                Enable Lot & Serial Numbers tracking
              </label>
            </div>
          </div>
        )}

        {/* CONFIGURATION -> WAREHOUSES */}
        {activeMenu === "warehouses" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Warehouses Configuration</h3>
            
            <div className="space-y-4 max-w-xl">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="font-black text-slate-800 text-sm">{wh.name}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold rounded">
                      Code: {wh.code}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-500 font-bold">
                    <div>Reception Workflow: <span className="text-slate-700">{wh.receptionSteps}</span></div>
                    <div>Delivery Workflow: <span className="text-slate-700">{wh.deliverySteps}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONFIGURATION -> OPERATION TYPES */}
        {activeMenu === "operation-types" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Operation Types Configuration</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Code Prefix</th>
                    <th className="pb-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((type) => (
                    <tr key={type.id} className="border-b border-slate-50">
                      <td className="py-2.5 font-bold text-slate-700">{type.name}</td>
                      <td className="py-2.5 font-mono text-indigo-600 font-bold">{type.code === "INCOMING" ? "IN" : type.code === "OUTGOING" ? "OUT" : "INT"}</td>
                      <td className="py-2.5 text-slate-500 uppercase font-bold text-[10px]">{type.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONFIGURATION -> PRODUCT CATEGORIES */}
        {activeMenu === "categories" && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-[#0d0d2b]">Product Categories</h3>
            
            <div className="overflow-x-auto max-w-xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="pb-3">Product Category</th>
                    <th className="pb-3">Force Removal Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700">All</td>
                    <td className="py-2.5 text-slate-500">FIFO</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700 px-4">All / Saleable</td>
                    <td className="py-2.5 text-slate-500">FIFO</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700 px-8">All / Saleable / Tools</td>
                    <td className="py-2.5 text-slate-500">FIFO</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700 px-8">All / Saleable / Electronics</td>
                    <td className="py-2.5 text-slate-500">FIFO</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──── CREATE TRANSFER MODAL ──── */}
      {isCreatePickingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreatePickingOpen(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">Draft Operations Transfer</h3>
              <button onClick={() => setIsCreatePickingOpen(false)} className="text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleCreatePickingSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Operation Type *</label>
                  <select 
                    value={newPicking.pickingTypeId}
                    onChange={(e) => {
                      const typeId = parseInt(e.target.value);
                      const type = stats.find(s => s.id === typeId);
                      let src = locations[0]?.id || 0;
                      let dest = locations[1]?.id || 0;
                      
                      if (type?.code === "INCOMING") {
                        src = locations.find(l => l.usage === "VENDOR")?.id || src;
                        dest = locations.find(l => l.usage === "INTERNAL")?.id || dest;
                      } else if (type?.code === "OUTGOING") {
                        src = locations.find(l => l.usage === "INTERNAL")?.id || src;
                        dest = locations.find(l => l.usage === "CUSTOMER")?.id || dest;
                      }
                      
                      setNewPicking(prev => ({ 
                        ...prev, 
                        pickingTypeId: typeId,
                        locationId: src,
                        locationDestId: dest
                      }));
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    {stats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Scheduled Date</label>
                  <input 
                    type="datetime-local" 
                    value={newPicking.scheduledDate}
                    onChange={(e) => setNewPicking(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Source Location *</label>
                  <select 
                    value={newPicking.locationId}
                    onChange={(e) => setNewPicking(prev => ({ ...prev, locationId: parseInt(e.target.value) }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    {locations.map(l => <option key={l.id} value={l.id}>{l.completeName} [{l.usage}]</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Destination Location *</label>
                  <select 
                    value={newPicking.locationDestId}
                    onChange={(e) => setNewPicking(prev => ({ ...prev, locationDestId: parseInt(e.target.value) }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    {locations.map(l => <option key={l.id} value={l.id}>{l.completeName} [{l.usage}]</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Source Document (Reference / PO / SO)</label>
                <input 
                  type="text" 
                  value={newPicking.origin}
                  onChange={(e) => setNewPicking(prev => ({ ...prev, origin: e.target.value }))}
                  placeholder="e.g. PO0001, SO0001"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Product Lines</span>
                  <button 
                    type="button"
                    onClick={() => setNewPicking(prev => ({ 
                      ...prev, 
                      lines: [...prev.lines, { productId: 0, productQty: 1 }] 
                    }))}
                    className="text-xs text-indigo-600 font-bold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    + Add Product Line
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {newPicking.lines.map((line, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex gap-2 items-center">
                        <select
                          value={line.productId}
                          onChange={(e) => {
                            const updatedLines = [...newPicking.lines];
                            updatedLines[idx].productId = parseInt(e.target.value);
                            setNewPicking(prev => ({ ...prev, lines: updatedLines }));
                          }}
                          className="flex-grow p-2 border border-slate-200 rounded-lg outline-none bg-white text-xs"
                        >
                          <option value="0">Select Product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.defaultCode}]</option>)}
                        </select>
                        <input 
                          type="number"
                          value={line.productQty}
                          onChange={(e) => {
                            const updatedLines = [...newPicking.lines];
                            updatedLines[idx].productQty = parseFloat(e.target.value) || 1;
                            setNewPicking(prev => ({ ...prev, lines: updatedLines }));
                          }}
                          className="w-20 p-2 border border-slate-200 rounded-lg text-center outline-none text-xs"
                          min="1"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const updatedLines = newPicking.lines.filter((_, i) => i !== idx);
                            setNewPicking(prev => ({ ...prev, lines: updatedLines }));
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg bg-transparent border-none cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingProductForLineIdx(idx);
                            setIsProductModalOpen(true);
                          }}
                          className="text-[10px] text-indigo-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
                        >
                          + New product
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreatePickingOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/15 cursor-pointer border-none"
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── REGISTER PRODUCT MODAL ──── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-[#0d0d2b]">New Product</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Product Name *</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Industrial Bolt - 10mm"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">SKU / Reference</label>
                  <input 
                    type="text" 
                    value={newProduct.defaultCode}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, defaultCode: e.target.value }))}
                    placeholder="e.g. LMW-001"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Barcode</label>
                  <input 
                    type="text" 
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="e.g. 1234567"
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Sales Price *</label>
                  <input 
                    type="number" 
                    value={newProduct.listPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, listPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Cost Price *</label>
                  <input 
                    type="number" 
                    value={newProduct.standardPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, standardPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Type</label>
                  <select 
                    value={newProduct.type}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="STORABLE">Storable Product</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Tracking</label>
                  <select 
                    value={newProduct.tracking}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, tracking: e.target.value as any }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="NONE">No Tracking</option>
                    <option value="LOT">By Lots</option>
                    <option value="SERIAL">By Unique Serial Number</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Product Category</label>
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(parseInt(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                >
                  {PRODUCT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/15 cursor-pointer border-none"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
