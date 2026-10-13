import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  vendorProductService,
  type CreateProductRequest,
  type CommerceProductCategoryResponse,
  type ProductType,
} from "../../../../services/commerce/vendorProductService";

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "PHYSICAL_PRODUCT", label: "Physical Product" },
  { value: "DIGITAL_PRODUCT", label: "Digital Product" },
  { value: "SERVICE", label: "Service" },
  { value: "FOOD", label: "Food & Beverage" },
  { value: "BOOKING", label: "Booking / Appointment" },
  { value: "SUBSCRIPTION", label: "Subscription" },
];

const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28];

function flattenCategories(
  cats: CommerceProductCategoryResponse[],
  depth = 0
): { id: number; label: string }[] {
  return cats.flatMap((c) => [
    { id: c.id, label: " ".repeat(depth * 3) + c.name },
    ...(c.children ? flattenCategories(c.children, depth + 1) : []),
  ]);
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CommerceProductForm({ onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<
    { id: number; label: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateProductRequest>({
    defaultValues: {
      productType: "PHYSICAL_PRODUCT",
      communityOnly: false,
      variants: [
        {
          variantName: "Default",
          sku: "",
          packSize: "1",
          mrp: undefined,
          vendorCost: undefined,
          defaultCommunityPrice: undefined,
          bulkMinQty: 5,
          initialStock: 50,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const productType = watch("productType");

  useEffect(() => {
    vendorProductService
      .getCategories()
      .then((cats) => setCategories(flattenCategories(cats)))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: CreateProductRequest) => {
    setSaving(true);
    setError(null);
    try {
      await vendorProductService.createProduct(data);
      onSuccess?.();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to save product. Try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const isPhysical =
    productType === "PHYSICAL_PRODUCT" || productType === "FOOD";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Basic Info ─────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Product Name *
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Aashirvaad Atta 10 KG"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Product Type *
            </label>
            <select
              {...register("productType")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Legacy Category *
            </label>
            <input
              {...register("category", { required: "Category is required" })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Staples & Grains"
            />
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Commerce Category
            </label>
            <select
              {...register("commerceCategoryId", {
                setValueAs: (v) => (v ? Number(v) : undefined),
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Brand
            </label>
            <input
              {...register("brand")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. ITC"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Product Code / SKU (master)
            </label>
            <input
              {...register("productCode")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. ATTA-10KG-001"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              HSN Code
            </label>
            <input
              {...register("hsnCode")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. 1101"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              GST Rate (%)
            </label>
            <select
              {...register("gstRate", {
                setValueAs: (v) => (v !== "" ? Number(v) : undefined),
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="Describe the product…"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Image URL
            </label>
            <input
              {...register("imageUrl")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tags (comma-separated)
            </label>
            <input
              {...register("tags")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="bulk, staple, festive"
            />
          </div>
        </div>

        {isPhysical && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Weight (grams)
              </label>
              <input
                type="number"
                {...register("weightGrams", {
                  setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. 10000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dimensions (L×W×H cm)
              </label>
              <input
                {...register("dimensionsCm")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. 30×20×15"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            {...register("communityOnly")}
            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          Community members only — hide from public storefront
        </label>
      </section>

      {/* ── Variants & Pricing ─────────────────────────── */}
      <section className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Variants &amp; Pricing
          </h3>
          <button
            type="button"
            onClick={() =>
              append({
                variantName: "",
                sku: "",
                packSize: "1",
                bulkMinQty: 5,
                initialStock: 50,
              })
            }
            className="text-xs font-medium text-violet-600 hover:text-violet-800"
          >
            + Add Variant
          </button>
        </div>

        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Variant {idx + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Variant identity */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Variant Name *
                </label>
                <input
                  {...register(`variants.${idx}.variantName`, {
                    required: true,
                  })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. 10 KG Bag"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  SKU *
                </label>
                <input
                  {...register(`variants.${idx}.sku`, { required: true })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pack Size *
                </label>
                <input
                  {...register(`variants.${idx}.packSize`, { required: true })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. 10 KG"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  {...register(`variants.${idx}.initialStock`, {
                    setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                  })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Core pricing */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Core Pricing
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "mrp", label: "MRP (₹)" },
                  { key: "vendorCost", label: "Vendor Cost (₹)" },
                  { key: "defaultCommunityPrice", label: "Community Price (₹)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(
                        `variants.${idx}.${key as string}`,
                        {
                          setValueAs: (v) =>
                            v !== "" ? Number(v) : undefined,
                        }
                      )}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Community pricing tiers */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Community Pricing Tiers
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Member Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`variants.${idx}.memberPrice`, {
                      setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Bulk Min Qty
                  </label>
                  <input
                    type="number"
                    {...register(`variants.${idx}.bulkMinQty`, {
                      setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Bulk Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`variants.${idx}.bulkPrice`, {
                      setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Promo Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`variants.${idx}.promotionalPrice`, {
                      setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Promo End Date
                  </label>
                  <input
                    type="date"
                    {...register(`variants.${idx}.promotionalEndDate`)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Festival Tag
                  </label>
                  <input
                    {...register(`variants.${idx}.festivalTag`)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. DIWALI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Festival Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`variants.${idx}.festivalPrice`, {
                      setValueAs: (v) => (v !== "" ? Number(v) : undefined),
                    })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>
    </form>
  );
}
