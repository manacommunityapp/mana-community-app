import React, { useEffect, useState } from "react";
import {
  vendorProductService,
  type VendorProductDto,
  type ProductType,
} from "../../../../services/commerce/vendorProductService";
import CommerceProductForm from "./CommerceProductForm";

const TYPE_LABELS: Record<ProductType, string> = {
  PHYSICAL_PRODUCT: "Physical",
  DIGITAL_PRODUCT: "Digital",
  SERVICE: "Service",
  FOOD: "Food",
  BOOKING: "Booking",
  SUBSCRIPTION: "Subscription",
};

const TYPE_COLORS: Record<ProductType, string> = {
  PHYSICAL_PRODUCT: "bg-blue-100 text-blue-700",
  DIGITAL_PRODUCT: "bg-purple-100 text-purple-700",
  SERVICE: "bg-teal-100 text-teal-700",
  FOOD: "bg-orange-100 text-orange-700",
  BOOKING: "bg-pink-100 text-pink-700",
  SUBSCRIPTION: "bg-indigo-100 text-indigo-700",
};

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : status === "INACTIVE"
      ? "bg-gray-100 text-gray-600"
      : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type?: ProductType }) {
  if (!type) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export default function CommerceProductCatalog() {
  const [products, setProducts] = useState<VendorProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductType | "">("");
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    vendorProductService
      .getMyProducts()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.productCode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || p.productType === typeFilter;
    return matchSearch && matchType;
  });

  if (showForm) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Add New Product</h2>
        </div>
        <CommerceProductForm
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Product Catalog</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category, or code…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ProductType | "")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Types</option>
          {(Object.keys(TYPE_LABELS) as ProductType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {products.length === 0
            ? "No products yet. Click \"Add Product\" to get started."
            : "No products match your filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Product",
                  "Type",
                  "Category",
                  "Variants",
                  "Stock",
                  "Price (₹)",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((p) => {
                const firstVariant = p.variants?.[0];
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-md object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[180px]">
                            {p.name}
                          </p>
                          {p.productCode && (
                            <p className="text-xs text-gray-400">{p.productCode}</p>
                          )}
                          {p.communityOnly && (
                            <span className="text-xs text-violet-600 font-medium">
                              Members only
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={p.productType} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{p.category}</div>
                      {p.commerceCategoryName && (
                        <div className="text-xs text-gray-400">
                          {p.commerceCategoryName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.variants?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${
                          (p.totalStock ?? 0) === 0
                            ? "text-red-600"
                            : (p.totalStock ?? 0) < 10
                            ? "text-orange-600"
                            : "text-gray-700"
                        }`}
                      >
                        {p.totalStock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {firstVariant ? (
                        <div>
                          <div className="font-medium">
                            ₹{firstVariant.defaultCommunityPrice?.toFixed(2) ?? "—"}
                          </div>
                          {firstVariant.mrp &&
                            firstVariant.mrp > (firstVariant.defaultCommunityPrice ?? 0) && (
                              <div className="text-xs text-gray-400 line-through">
                                MRP ₹{firstVariant.mrp.toFixed(2)}
                              </div>
                            )}
                          {firstVariant.promotionalPrice && (
                            <div className="text-xs text-green-600 font-medium">
                              Promo ₹{firstVariant.promotionalPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
