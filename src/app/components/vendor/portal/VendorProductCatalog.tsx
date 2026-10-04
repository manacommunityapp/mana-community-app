import { useState, useEffect } from "react";
import {
  Package, Plus, Search, Layers,
  CheckCircle2
} from "lucide-react";
import { vendorCommerceService } from "../../../../services/vendor/vendorCommerceService";
import type {
  VendorProductDto,
  VendorProductVariantDto,
  CreateProductRequest
} from "../../../../services/vendor/vendorCommerceService";

export function VendorProductCatalog() {
  const [products, setProducts] = useState<VendorProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New product form state
  const [newProductName, setNewProductName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("Grocery");
  const [newDescription, setNewDescription] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPackSize, setNewPackSize] = useState("");
  const [newMrp, setNewMrp] = useState<number>(0);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newCommunityPrice, setNewCommunityPrice] = useState<number>(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await vendorCommerceService.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newSku) return;

    const payload: CreateProductRequest = {
      productName: newProductName,
      brand: newBrand || "Generic",
      category: newCategory,
      description: newDescription,
      images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"],
      variants: [
        {
          variantName: newPackSize || "Standard Pack",
          sku: newSku,
          packSize: newPackSize || "1 Unit",
          unitOfMeasure: "UNIT",
          mrp: Number(newMrp),
          costPrice: Number(newCostPrice),
          communityPrice: Number(newCommunityPrice || newMrp * 0.88),
        },
      ],
    };

    await vendorCommerceService.createProduct(payload);
    setShowCreateModal(false);
    // Reset form
    setNewProductName("");
    setNewBrand("");
    setNewDescription("");
    setNewSku("");
    setNewPackSize("");
    setNewMrp(0);
    setNewCostPrice(0);
    setNewCommunityPrice(0);
    loadProducts();
  };

  const categories = ["ALL", ...Array.from(new Set(products.map((p: VendorProductDto) => p.category)))];

  const filteredProducts = products.filter((p: VendorProductDto) => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.variants.some((v: VendorProductVariantDto) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Product Catalog & Variants
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your wholesale catalog, package sizes, SKUs, and community tier pricing.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, brands, SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer " +
                (selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Loading catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try changing your filters or add a new product to your catalog.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product: VendorProductDto) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-indigo-300 transition-all"
            >
              {/* Product Header */}
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {product.brand}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">•</span>
                      <span className="text-[10px] font-semibold text-slate-500">{product.category}</span>
                      {product.subCategory && (
                        <span className="text-[10px] text-slate-400">/ {product.subCategory}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{product.productName}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Variants Section */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  SKU Variants ({product.variants.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.variants.map((v: VendorProductVariantDto) => (
                    <div
                      key={v.sku}
                      className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 hover:bg-white hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{v.variantName}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {v.sku}</div>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {v.packSize}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center pt-2.5 border-t border-slate-200/60">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">MRP</div>
                          <div className="text-xs font-bold text-slate-700">₹{v.mrp}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Cost</div>
                          <div className="text-xs font-bold text-slate-700">₹{v.costPrice}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-indigo-600 font-bold">Community</div>
                          <div className="text-xs font-black text-indigo-600">₹{v.communityPrice}</div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] bg-white p-2 rounded-lg border border-slate-200/50">
                        <span className="text-slate-500 font-medium">Avail: <b className="text-slate-800">{v.availableStock ?? 0}</b></span>
                        <span className="text-amber-600 font-medium">Resvd: <b>{v.reservedStock ?? 0}</b></span>
                        <span className="text-indigo-600 font-medium">Comm: <b>{v.committedStock ?? 0}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-lg font-black text-slate-900 mb-1">Add Wholesale Product</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new item to your group buying catalog with base variant.</p>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sona Masoori Rice (Premium)"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Harvest"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Dairy & Bakery">Dairy & Bakery</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief quality and origin description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-indigo-600 mb-2">Initial Variant & Pricing</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RICE-SONA-25KG"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pack Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 25 KG Bag"
                      value={newPackSize}
                      onChange={(e) => setNewPackSize(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={newMrp || ""}
                      onChange={(e) => setNewMrp(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      placeholder="1100"
                      value={newCostPrice || ""}
                      onChange={(e) => setNewCostPrice(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-indigo-600 mb-1">Community (₹)</label>
                    <input
                      type="number"
                      placeholder="1250"
                      value={newCommunityPrice || ""}
                      onChange={(e) => setNewCommunityPrice(Number(e.target.value))}
                      className="w-full p-2 border border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-hidden font-bold text-indigo-700 bg-indigo-50/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
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
