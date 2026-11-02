/**
 * Mana Fresh Kitchen & My Daily Basket Core Types
 * Complete TypeScript definitions matching backend REST contracts & UI models.
 */

export type FreshFoodProductCategory =
  | 'ALL'
  | 'STANDARD_BATTER'
  | 'SPECIALTY_BATTER'
  | 'MILLET_BATTER'
  | 'CHUTNEY_PODI'
  | 'BREAKFAST_KIT';

export type DietaryFlag =
  | 'VEG'
  | 'VEGAN'
  | 'JAIN'
  | 'GLUTEN_FREE'
  | 'HIGH_PROTEIN'
  | 'DIABETIC_FRIENDLY'
  | 'ORGANIC';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type BasketExecutionMode = 'AUTO_ORDER' | 'DAILY_APPROVAL';

export type DailyBasketStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type ComboItemCategory = 'BATTER' | 'CHUTNEY' | 'EXTRA' | 'BEVERAGE' | 'SAMBAR';

export type BatchQaStatus = 'PENDING' | 'PASSED' | 'REJECTED' | 'CONDITIONAL';

export type VendorCapacityCategory = 'BATTER' | 'CHUTNEY' | 'ALL';

export interface FreshNutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sodium?: number;
}

export interface FreshFoodProduct {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: FreshFoodProductCategory;
  subCategory?: string;
  price: number;
  mrp: number;
  discountPercentage?: number;
  unit: string; // e.g. "500g", "1kg", "250g", "200ml"
  imageUrl?: string;
  shelfLifeHours: number; // e.g. 72 hours
  storageTempMin: number; // e.g. 2°C
  storageTempMax: number; // e.g. 4°C
  storageInstructions: string; // e.g. "Store at 2-4°C, keep refrigerated"
  ingredients: string[];
  dietaryFlags: DietaryFlag[];
  inStock: boolean;
  availableStock: number;
  isSoldOut: boolean;
  vendorId: string;
  vendorName: string;
  rating: number;
  totalReviews: number;
  preparationBatchId?: string;
  fssaiNumber?: string;
  nutritionalInfo?: FreshNutritionalInfo;
  tags?: string[];
  isFeatured?: boolean;
  leadTimeHours?: number; // order before X hours
  fermentationHours?: number; // naturally fermented hours
}

export interface BreakfastComboItem {
  id: string;
  name: string;
  productId?: string;
  product?: FreshFoodProduct;
  quantity: number;
  price: number;
  unit?: string;
  isMandatory: boolean;
  category: ComboItemCategory;
  description?: string;
}

export interface BreakfastCombo {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  servings: string; // e.g. "Serves 2-3 Persons"
  servingsCount: number;
  mainProduct: FreshFoodProduct;
  mainProductId?: string;
  mandatoryChutneyOptions: FreshFoodProduct[];
  optionalAddons: BreakfastComboItem[];
  isActive: boolean;
  vendorId: string;
  vendorName: string;
  rating: number;
  totalReviews?: number;
  tags?: string[];
  prepTimeMinutes?: number;
}

export interface BreakfastComboSelection {
  comboId: string;
  mainProductId: string;
  selectedChutneyId: string;
  selectedAddonIds: string[];
  quantity: number;
  servingsMultiplier?: number;
  customNotes?: string;
  computedTotalPrice: number;
  scheduledDays?: DayOfWeek[];
}

export interface DailyBasketItem {
  id: string;
  basketId?: string;
  productId: string;
  product?: FreshFoodProduct;
  comboId?: string;
  combo?: BreakfastCombo;
  itemName: string;
  itemCategory: string;
  unitPrice: number;
  quantity: number;
  scheduledDays: DayOfWeek[];
  isPaused: boolean;
  specialInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyBasket {
  id: string;
  userId: string;
  communityId: string | number;
  flatNumber: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  executionMode: BasketExecutionMode;
  isVacationPaused: boolean;
  vacationStartDate?: string;
  vacationEndDate?: string;
  items: DailyBasketItem[];
  preferredDeliveryTime: string; // e.g. "06:00 AM - 06:45 AM"
  totalDailyEstimate: number;
  totalWeeklyEstimate: number;
  monthlyProjection: number;
  status: DailyBasketStatus;
  lastOrderTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorCapacity {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string; // YYYY-MM-DD
  category: VendorCapacityCategory;
  maxDailyCapacityLitres: number;
  bookedCapacityLitres: number;
  availableCapacityLitres: number;
  capacityPercentage: number;
  isSoldOut: boolean;
  cutOffTime: string; // e.g. "20:00" (8 PM for next morning 6:30 AM delivery)
  acceptsAutoOrders: boolean;
  activeOrdersCount?: number;
  pendingDispatchCount?: number;
  updatedAt: string;
}

export interface FoodProductionBatch {
  id: string;
  batchNumber: string;
  vendorId: string;
  vendorName?: string;
  productId: string;
  productName: string;
  category?: string;
  quantityProduced: number;
  unit: string; // "Litres" | "kg" | "units"
  productionTimestamp: string;
  expiryTimestamp: string;
  storageTempTarget: string; // "2-4°C"
  recordedTemp?: number;
  phLevel?: number; // 4.2 - 4.6
  fermentationHours?: number;
  qaInspectorName: string;
  qaStatus: BatchQaStatus;
  qaNotes?: string;
  coldChainVerified: boolean;
  releasedAt?: string;
  releaseSignature?: string;
}

// ── DTO Requests and Responses ──

export interface CreateDailyBasketItemRequest {
  productId?: string;
  comboId?: string;
  itemName: string;
  itemCategory: string;
  unitPrice: number;
  quantity: number;
  scheduledDays: DayOfWeek[];
  specialInstructions?: string;
}

export interface UpdateDailyBasketItemRequest {
  quantity?: number;
  scheduledDays?: DayOfWeek[];
  isPaused?: boolean;
  specialInstructions?: string;
}

export interface VacationPauseRequest {
  isVacationPaused: boolean;
  vacationStartDate?: string;
  vacationEndDate?: string;
}

export interface UpdateExecutionModeRequest {
  executionMode: BasketExecutionMode;
}

export interface UpdateDeliveryDetailsRequest {
  flatNumber: string;
  deliveryAddress: string;
  preferredDeliveryTime?: string;
  deliveryInstructions?: string;
}

export interface UpdateVendorCapacityRequest {
  maxDailyCapacityLitres: number;
  isSoldOut?: boolean;
  acceptsAutoOrders?: boolean;
  cutOffTime?: string;
}

export interface CreateBatchReleaseRequest {
  batchNumber: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  unit: string;
  phLevel: number;
  recordedTemp: number;
  fermentationHours: number;
  qaInspectorName: string;
  qaStatus: BatchQaStatus;
  qaNotes?: string;
  coldChainVerified: boolean;
  releaseSignature?: string;
}

export interface InstantBuyRequest {
  productId?: string;
  comboId?: string;
  quantity: number;
  selectedChutneyId?: string;
  selectedAddonIds?: string[];
  unitPrice: number;
  totalPrice: number;
  deliveryAddress: string;
  flatNumber: string;
  deliveryInstructions?: string;
  preferredDeliveryDate?: string;
  preferredDeliveryTime?: string;
}

export interface InstantBuyResponse {
  orderId: string;
  orderNumber: string;
  status: 'CONFIRMED' | 'PREPARING' | 'SCHEDULED_FOR_DISPATCH';
  totalAmount: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  recipientFlat: string;
  createdAt: string;
}
