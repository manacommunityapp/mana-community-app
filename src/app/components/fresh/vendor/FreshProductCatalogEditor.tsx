import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Leaf, Zap, ChevronDown, ChevronUp, Plus, Trash2, Save,
  Calculator, AlertTriangle, CheckCircle, Info, Edit3
} from 'lucide-react';

// ----- Types -----
type CapabilityType =
  | 'FRUIT_SUPPLIER' | 'VEGETABLE_SUPPLIER' | 'FRESH_CUT_PROCESSOR' | 'DAIRY_VENDOR'
  | 'BATTER_MANUFACTURER' | 'NUTRITION_VENDOR' | 'DRY_FRUIT_SUPPLIER' | 'CHICKEN_SUPPLIER'
  | 'MUTTON_SUPPLIER' | 'SEAFOOD_SUPPLIER' | 'HEALTHY_SNACK_VENDOR' | 'DELIVERY_PARTNER';

interface AttributeItem {
  attributeKey: string;
  attributeValue: string;
  unit?: string;
  displayOrder: number;
  isSearchable: boolean;
}

interface NutritionData {
  vendorProductId: number;
  servingSizeGrams?: number;
  caloriesKcal?: number;
  proteinG?: number;
  carbohydratesG?: number;
  fatG?: number;
  saturatedFatG?: number;
  fibreG?: number;
  sodiumMg?: number;
  sugarG?: number;
  dietitianCertified: boolean;
  dietitianName?: string;
  certificationNumber?: string;
  fssaiLabelCompliant: boolean;
}

interface AllergenItem {
  allergenName: string;
  severity: 'CONTAINS' | 'MAY_CONTAIN' | 'FREE_FROM';
}

interface PricingData {
  vendorCostPrice: number;
  manaCommissionPct: number;
  deliveryFee: number;
  packagingFee: number;
  gstRatePct: number;
  residentSellingPrice?: number;
  effectiveFrom: string;
}

interface CatalogProfile {
  capabilityType: CapabilityType;
  shelfLifeHours?: number;
  storageInstruction?: string;
  originState?: string;
  originDistrict?: string;
  isOrganic: boolean;
  isPesticideFree: boolean;
  isAntibioticFree: boolean;
  isHormoneFree: boolean;
  minOrderQty: number;
  maxOrderQty?: number;
  orderUnit: string;
}

interface VendorProduct {
  id: number;
  name: string;
  category: string;
  status: string;
}

// ----- Capability attribute templates -----
const CAPABILITY_ATTRIBUTES: Record<string, AttributeItem[]> = {
  FRUIT_SUPPLIER: [
    { attributeKey: 'GRADE', attributeValue: '', unit: '', displayOrder: 0, isSearchable: true },
    { attributeKey: 'VARIETY', attributeValue: '', unit: '', displayOrder: 1, isSearchable: true },
    { attributeKey: 'RIPENESS', attributeValue: '', unit: '', displayOrder: 2, isSearchable: false },
    { attributeKey: 'SIZE_BAND', attributeValue: '', unit: 'mm', displayOrder: 3, isSearchable: false },
  ],
  VEGETABLE_SUPPLIER: [
    { attributeKey: 'FRESHNESS_HOURS', attributeValue: '', unit: 'hrs', displayOrder: 0, isSearchable: false },
    { attributeKey: 'HARVEST_DATE', attributeValue: '', unit: '', displayOrder: 1, isSearchable: false },
    { attributeKey: 'GRADE', attributeValue: '', unit: '', displayOrder: 2, isSearchable: true },
  ],
  BATTER_MANUFACTURER: [
    { attributeKey: 'FERMENTATION_HOURS', attributeValue: '', unit: 'hrs', displayOrder: 0, isSearchable: false },
    { attributeKey: 'RICE_TO_DAL_RATIO', attributeValue: '', unit: '', displayOrder: 1, isSearchable: false },
    { attributeKey: 'CONSISTENCY', attributeValue: '', unit: '', displayOrder: 2, isSearchable: false },
    { attributeKey: 'SHELF_LIFE_DAYS', attributeValue: '', unit: 'days', displayOrder: 3, isSearchable: false },
  ],
  DAIRY_VENDOR: [
    { attributeKey: 'FAT_CONTENT', attributeValue: '', unit: '%', displayOrder: 0, isSearchable: true },
    { attributeKey: 'SNF', attributeValue: '', unit: '%', displayOrder: 1, isSearchable: false },
    { attributeKey: 'PASTEURIZED', attributeValue: 'true', unit: '', displayOrder: 2, isSearchable: true },
  ],
  NUTRITION_VENDOR: [
    { attributeKey: 'PROTEIN_PER_100G', attributeValue: '', unit: 'g', displayOrder: 0, isSearchable: true },
    { attributeKey: 'CALORIE_PER_SERVING', attributeValue: '', unit: 'kcal', displayOrder: 1, isSearchable: false },
    { attributeKey: 'SUGAR_FREE', attributeValue: 'false', unit: '', displayOrder: 2, isSearchable: true },
    { attributeKey: 'VEGAN', attributeValue: 'false', unit: '', displayOrder: 3, isSearchable: true },
  ],
  CHICKEN_SUPPLIER: [
    { attributeKey: 'CUT_TYPE', attributeValue: '', unit: '', displayOrder: 0, isSearchable: true },
    { attributeKey: 'BREED', attributeValue: '', unit: '', displayOrder: 1, isSearchable: false },
    { attributeKey: 'CLEANED', attributeValue: 'true', unit: '', displayOrder: 2, isSearchable: false },
  ],
  SEAFOOD_SUPPLIER: [
    { attributeKey: 'SPECIES', attributeValue: '', unit: '', displayOrder: 0, isSearchable: true },
    { attributeKey: 'CATCH_DATE', attributeValue: '', unit: '', displayOrder: 1, isSearchable: false },
    { attributeKey: 'CLEANED_DEVEINED', attributeValue: 'false', unit: '', displayOrder: 2, isSearchable: false },
    { attributeKey: 'SIZE_COUNT', attributeValue: '', unit: 'per kg', displayOrder: 3, isSearchable: false },
  ],
};

const ALLERGEN_OPTIONS = [
  'GLUTEN', 'DAIRY', 'NUTS', 'SOY', 'EGG', 'FISH', 'SHELLFISH',
  'SESAME', 'MUSTARD', 'CELERY', 'SULPHITES', 'LUPIN', 'MOLLUSCS', 'PEANUTS'
];

const ORDER_UNITS = ['kg', 'g', 'litre', 'ml', 'pcs', 'pack', 'dozen', 'bundle'];

// ----- Helper -----
function computeSellingPrice(cost: number, commission: number, delivery: number, packaging: number, gst: number): number {
  const base = cost + (cost * commission / 100) + delivery + packaging;
  const gstAmt = base * gst / 100;
  return Math.round((base + gstAmt) * 100) / 100;
}

// ----- Sub-components -----
function SectionCard({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Icon size={18} className="text-green-600" />
          {title}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ----- Main Component -----
const FreshProductCatalogEditor: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [capabilityType, setCapabilityType] = useState<CapabilityType>('FRUIT_SUPPLIER');
  const [profile, setProfile] = useState<CatalogProfile>({
    capabilityType: 'FRUIT_SUPPLIER',
    isOrganic: false,
    isPesticideFree: false,
    isAntibioticFree: false,
    isHormoneFree: false,
    minOrderQty: 1,
    orderUnit: 'kg',
  });
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [nutrition, setNutrition] = useState<NutritionData>({
    vendorProductId: 0,
    dietitianCertified: false,
    fssaiLabelCompliant: false,
  });
  const [allergens, setAllergens] = useState<AllergenItem[]>([]);
  const [pricing, setPricing] = useState<PricingData>({
    vendorCostPrice: 0,
    manaCommissionPct: 10,
    deliveryFee: 0,
    packagingFee: 0,
    gstRatePct: 5,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const computedPrice = computeSellingPrice(
    pricing.vendorCostPrice, pricing.manaCommissionPct,
    pricing.deliveryFee, pricing.packagingFee, pricing.gstRatePct
  );

  // Load attribute template when capability changes
  useEffect(() => {
    const template = CAPABILITY_ATTRIBUTES[capabilityType] || [];
    setAttributes(template.map(a => ({ ...a })));
  }, [capabilityType]);

  const handleCapabilityChange = (type: CapabilityType) => {
    setCapabilityType(type);
    setProfile(p => ({ ...p, capabilityType: type }));
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, {
      attributeKey: '', attributeValue: '', unit: '',
      displayOrder: prev.length, isSearchable: false
    }]);
  };

  const updateAttribute = (index: number, field: keyof AttributeItem, value: string | number | boolean) => {
    setAttributes(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAllergen = (name: string, severity: AllergenItem['severity'] = 'CONTAINS') => {
    setAllergens(prev => {
      const exists = prev.find(a => a.allergenName === name);
      if (exists) return prev.filter(a => a.allergenName !== name);
      return [...prev, { allergenName: name, severity }];
    });
  };

  const handleSaveAll = async () => {
    if (!selectedProductId) {
      setSaved('Please select a product first');
      return;
    }
    setLoading(true);
    try {
      // In production: call API endpoints
      // await freshCatalogService.saveProfile({ ...profile, vendorProductId: selectedProductId });
      // await freshCatalogService.saveAttributes(selectedProductId, { attributes });
      // await freshCatalogService.saveNutrition({ ...nutrition, vendorProductId: selectedProductId });
      // await freshCatalogService.saveAllergens(selectedProductId, allergens);
      // await freshCatalogService.simulatePricing({ ...pricing, vendorProductId: selectedProductId });
      await new Promise(r => setTimeout(r, 1000)); // mock
      setSaved('Catalog saved successfully!');
      setTimeout(() => setSaved(null), 3000);
    } catch {
      setSaved('Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fresh Product Catalog Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enrich your fresh products with dynamic attributes, nutrition, allergens & pricing
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          <Save size={16} />
          {loading ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {saved && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${saved.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saved.includes('success') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {saved}
        </div>
      )}

      {/* Product selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product to Enrich</label>
        <div className="flex gap-3">
          <select
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            value={selectedProductId ?? ''}
            onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select a product —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            value={capabilityType}
            onChange={e => handleCapabilityChange(e.target.value as CapabilityType)}
          >
            {Object.keys(CAPABILITY_ATTRIBUTES).map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Profile */}
      <SectionCard title="Catalog Profile" icon={Package}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Shelf Life (hours)</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.shelfLifeHours ?? ''} onChange={e => setProfile(p => ({ ...p, shelfLifeHours: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order Unit</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.orderUnit} onChange={e => setProfile(p => ({ ...p, orderUnit: e.target.value }))}>
              {ORDER_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Qty</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.minOrderQty} onChange={e => setProfile(p => ({ ...p, minOrderQty: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Order Qty</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.maxOrderQty ?? ''} onChange={e => setProfile(p => ({ ...p, maxOrderQty: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Origin State</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.originState ?? ''} onChange={e => setProfile(p => ({ ...p, originState: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Origin District</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={profile.originDistrict ?? ''} onChange={e => setProfile(p => ({ ...p, originDistrict: e.target.value }))} />
          </div>
        </div>
        <div className="col-span-2 mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Storage Instruction</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={profile.storageInstruction ?? ''}
            onChange={e => setProfile(p => ({ ...p, storageInstruction: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {(['isOrganic', 'isPesticideFree', 'isAntibioticFree', 'isHormoneFree'] as const).map(flag => (
            <label key={flag} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded accent-green-600"
                checked={profile[flag]} onChange={e => setProfile(p => ({ ...p, [flag]: e.target.checked }))} />
              <Leaf size={14} className="text-green-600" />
              {flag.replace(/([A-Z])/g, ' $1').replace('is ', '').trim()}
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Dynamic Attributes */}
      <SectionCard title="Category-Specific Attributes" icon={Edit3}>
        <div className="space-y-3">
          {attributes.map((attr, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input type="text" placeholder="Key" className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={attr.attributeKey} onChange={e => updateAttribute(idx, 'attributeKey', e.target.value)} />
              <input type="text" placeholder="Value" className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={attr.attributeValue} onChange={e => updateAttribute(idx, 'attributeValue', e.target.value)} />
              <input type="text" placeholder="Unit" className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={attr.unit ?? ''} onChange={e => updateAttribute(idx, 'unit', e.target.value)} />
              <label className="col-span-2 flex items-center gap-1 text-xs">
                <input type="checkbox" className="rounded accent-green-600"
                  checked={attr.isSearchable} onChange={e => updateAttribute(idx, 'isSearchable', e.target.checked)} />
                Searchable
              </label>
              <button onClick={() => removeAttribute(idx)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addAttribute} className="mt-3 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
          <Plus size={16} /> Add Attribute
        </button>
      </SectionCard>

      {/* Pricing Simulator */}
      <SectionCard title="Pricing Margin Simulator" icon={Calculator}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: 'Vendor Cost Price (₹)', field: 'vendorCostPrice' as const },
            { label: 'Mana Commission (%)', field: 'manaCommissionPct' as const },
            { label: 'Delivery Fee (₹)', field: 'deliveryFee' as const },
            { label: 'Packaging Fee (₹)', field: 'packagingFee' as const },
            { label: 'GST Rate (%)', field: 'gstRatePct' as const },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={pricing[field]} onChange={e => setPricing(p => ({ ...p, [field]: Number(e.target.value) }))} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Effective From</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={pricing.effectiveFrom} onChange={e => setPricing(p => ({ ...p, effectiveFrom: e.target.value }))} />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800 font-medium">
            <Zap size={18} />
            Resident Selling Price
          </div>
          <div className="text-2xl font-bold text-green-700">₹{computedPrice.toFixed(2)}</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-500">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-700">Cost</div>
            <div>₹{pricing.vendorCostPrice.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-700">Commission</div>
            <div>₹{(pricing.vendorCostPrice * pricing.manaCommissionPct / 100).toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-700">Fees</div>
            <div>₹{(pricing.deliveryFee + pricing.packagingFee).toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-700">GST</div>
            <div>₹{(computedPrice - pricing.vendorCostPrice - (pricing.vendorCostPrice * pricing.manaCommissionPct / 100) - pricing.deliveryFee - pricing.packagingFee).toFixed(2)}</div>
          </div>
        </div>
      </SectionCard>

      {/* Nutrition Panel */}
      <SectionCard title="Nutrition Panel" icon={Info} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {([
            ['Serving Size (g)', 'servingSizeGrams'],
            ['Calories (kcal)', 'caloriesKcal'],
            ['Protein (g)', 'proteinG'],
            ['Carbohydrates (g)', 'carbohydratesG'],
            ['Fat (g)', 'fatG'],
            ['Saturated Fat (g)', 'saturatedFatG'],
            ['Fibre (g)', 'fibreG'],
            ['Sodium (mg)', 'sodiumMg'],
            ['Sugar (g)', 'sugarG'],
          ] as const).map(([label, field]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={(nutrition as unknown as Record<string, number | boolean | string | undefined>)[field] as number ?? ''}
                onChange={e => setNutrition(n => ({ ...n, [field]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded accent-green-600"
              checked={nutrition.dietitianCertified}
              onChange={e => setNutrition(n => ({ ...n, dietitianCertified: e.target.checked }))} />
            Dietitian Certified
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded accent-green-600"
              checked={nutrition.fssaiLabelCompliant}
              onChange={e => setNutrition(n => ({ ...n, fssaiLabelCompliant: e.target.checked }))} />
            FSSAI Label Compliant
          </label>
        </div>
        {nutrition.dietitianCertified && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dietitian Name</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={nutrition.dietitianName ?? ''} onChange={e => setNutrition(n => ({ ...n, dietitianName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Certification No.</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={nutrition.certificationNumber ?? ''} onChange={e => setNutrition(n => ({ ...n, certificationNumber: e.target.value }))} />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Allergens */}
      <SectionCard title="Allergen Declarations" icon={AlertTriangle} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map(allergen => {
            const existing = allergens.find(a => a.allergenName === allergen);
            return (
              <div key={allergen} className="flex items-center gap-1">
                <button
                  onClick={() => toggleAllergen(allergen)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    existing
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {allergen.replace(/_/g, ' ')}
                </button>
                {existing && (
                  <select
                    className="text-xs border border-gray-300 rounded px-1 py-1"
                    value={existing.severity}
                    onChange={e => setAllergens(prev => prev.map(a =>
                      a.allergenName === allergen ? { ...a, severity: e.target.value as AllergenItem['severity'] } : a
                    ))}
                  >
                    <option value="CONTAINS">Contains</option>
                    <option value="MAY_CONTAIN">May Contain</option>
                    <option value="FREE_FROM">Free From</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
        {allergens.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <strong>Declared Allergens:</strong> {allergens.map(a => `${a.allergenName} (${a.severity})`).join(', ')}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default FreshProductCatalogEditor;