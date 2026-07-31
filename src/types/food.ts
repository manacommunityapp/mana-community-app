// Page response wrapper
export interface FoodPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ── Resident Food Profile ──
export interface ResidentFoodProfile {
  id: number;
  userId: number;
  dietType: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'VEGAN' | 'JAIN' | 'HALAL' | 'KOSHER' | 'EGGITARIAN' | 'GLUTEN_FREE' | 'LACTOSE_FREE';
  calorieGoal?: number;
  proteinGoal?: number;
  weightGoal?: number;
  healthGoal?: string;
  fitnessGoal?: string;
  waterIntakeGoal?: number;
  coffeeLimit?: number;
  dailyNutritionScore?: number;
  aiLifestyleScore?: number;
  bmi?: number;
  allergies: FoodAllergy[];
  cuisinePreferences: string[];
  mealTimings: FoodMealTiming[];
  favoritesCount: number;
  goals: FoodGoal[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodAllergy {
  id: number;
  allergyName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  notes?: string;
}

export interface FoodMealTiming {
  id: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  preferredTime: string;
  flexibilityMinutes: number;
}

export interface FoodGoal {
  id: number;
  goalType: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'ABANDONED';
}

export interface FoodProfileRequest {
  dietType: string;
  calorieGoal?: number;
  proteinGoal?: number;
  weightGoal?: number;
  healthGoal?: string;
  fitnessGoal?: string;
  waterIntakeGoal?: number;
  coffeeLimit?: number;
  allergies?: { allergyName: string; severity: string; notes?: string }[];
  cuisinePreferences?: string[];
}

// ── Restaurant ──
export interface FoodRestaurant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cuisineTypes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  fssaiLicense?: string;
  gstNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';
  rating: number;
  totalRatings: number;
  commissionRate?: number;
  openingTime?: string;
  closingTime?: string;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  dineInEnabled: boolean;
  minOrderAmount?: number;
  avgDeliveryTime?: number;
  featured: boolean;
  verified: boolean;
  ownerId: number;
  communityId: number;
  operatingHours?: OperatingHours[];
  offerCount?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  id: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface RestaurantRequest {
  name: string;
  description?: string;
  cuisineTypes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  fssaiLicense?: string;
  gstNumber?: string;
  deliveryEnabled?: boolean;
  takeawayEnabled?: boolean;
  dineInEnabled?: boolean;
  minOrderAmount?: number;
  operatingHours?: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];
}

// ── Menu ──
export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  active: boolean;
  parentId?: number;
  itemCount?: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  restaurantId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  price: number;
  discountedPrice?: number;
  isVeg: boolean;
  isVegan: boolean;
  isJain: boolean;
  spiceLevel?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  preparationTime?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  sortOrder: number;
  tags?: string;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  createdAt: string;
}

export interface MenuItemVariant {
  id: number;
  variantName: string;
  price: number;
  isDefault: boolean;
}

export interface MenuItemAddon {
  id: number;
  addonGroupName: string;
  addonName: string;
  price: number;
  isDefault: boolean;
  maxQuantity: number;
}

export interface MenuCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  parentId?: number;
  active?: boolean;
}

export interface MenuItemRequest {
  name: string;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  price: number;
  discountedPrice?: number;
  isVeg?: boolean;
  isVegan?: boolean;
  isJain?: boolean;
  spiceLevel?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  preparationTime?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  tags?: string;
  variants?: { variantName: string; price: number; isDefault: boolean }[];
  addons?: { addonGroupName: string; addonName: string; price: number; isDefault: boolean; maxQuantity: number }[];
}

// ── Home Chef ──
export interface HomeChef {
  id: number;
  userId: number;
  kitchenName: string;
  description?: string;
  speciality?: string;
  cuisineTypes?: string;
  fssaiLicense?: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  verificationStatus?: string;
  maxOrdersPerDay?: number;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  revenueTotal?: number;
  commissionRate?: number;
  profileImageUrl?: string;
  coverImageUrl?: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  menuCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomeChefMenu {
  id: number;
  chefId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  isVeg: boolean;
  calories?: number;
  protein?: number;
  preparationTime?: number;
  availableDays?: string;
  orderBeforeTime?: string;
  maxQuantity?: number;
  sortOrder: number;
  active: boolean;
}

export interface HomeChefRequest {
  kitchenName: string;
  description?: string;
  speciality?: string;
  cuisineTypes?: string;
  fssaiLicense?: string;
  maxOrdersPerDay?: number;
  profileImageUrl?: string;
  coverImageUrl?: string;
}

export interface HomeChefMenuRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  isVeg?: boolean;
  calories?: number;
  protein?: number;
  preparationTime?: number;
  availableDays?: string;
  orderBeforeTime?: string;
  maxQuantity?: number;
}

// ── Food Order ──
export interface FoodOrder {
  id: number;
  orderNumber: string;
  userId: number;
  providerType: 'RESTAURANT' | 'HOME_CHEF' | 'CLOUD_KITCHEN';
  providerId: number;
  providerName?: string;
  orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  placedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isGroupOrder: boolean;
  isGift: boolean;
  giftMessage?: string;
  items: FoodOrderItem[];
  tracking?: FoodOrderTracking[];
  rating?: FoodOrderRating;
  createdAt: string;
}

export interface FoodOrderItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string;
  specialInstructions?: string;
  isVeg: boolean;
  addons?: { addonName: string; price: number; quantity: number }[];
}

export interface FoodOrderTracking {
  id: number;
  status: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  timestamp: string;
}

export interface FoodOrderRating {
  id: number;
  overallRating: number;
  foodRating: number;
  deliveryRating?: number;
  packagingRating?: number;
  reviewText?: string;
}

export interface FoodOrderRequest {
  providerType: string;
  providerId: number;
  orderType?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryInstructions?: string;
  scheduledFor?: string;
  isGift?: boolean;
  giftMessage?: string;
  paymentMethod?: string;
  items: { itemId: number; quantity: number; variantName?: string; specialInstructions?: string; addons?: { addonName: string; price: number; quantity: number }[] }[];
  couponCode?: string;
}

// ── Dining Reservation ──
export interface DiningReservation {
  id: number;
  restaurantId: number;
  restaurantName?: string;
  userId: number;
  reservationType: 'RESTAURANT' | 'CLUBHOUSE' | 'PARTY_HALL' | 'POOLSIDE' | 'CHEF_TABLE';
  date: string;
  time: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  tableId?: number;
  specialRequests?: string;
  occasion?: string;
  confirmationCode?: string;
  checkedInAt?: string;
  createdAt: string;
}

export interface DiningReservationRequest {
  restaurantId: number;
  reservationType?: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: number;
  specialRequests?: string;
  occasion?: string;
}

// ── Subscription ──
export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  planType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'FULL_DAY';
  targetAudience: string;
  providerType: string;
  providerId: number;
  pricePerMeal: number;
  monthlyPrice: number;
  minDays: number;
  includesWeekends: boolean;
  active: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface FoodSubscription {
  id: number;
  planId: number;
  planName?: string;
  userId: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  autoRenew: boolean;
  deliveryAddress?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface SubscriptionRequest {
  planId: number;
  startDate?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
}

// ── Grocery ──
export interface GroceryStore {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  storeType: string;
  status: string;
  rating: number;
  deliveryEnabled: boolean;
  minOrder?: number;
  deliveryFee?: number;
  createdAt: string;
}

export interface GroceryProduct {
  id: number;
  storeId: number;
  storeName?: string;
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  images?: string;
  brand?: string;
  unit?: string;
  unitValue?: number;
  price: number;
  discountedPrice?: number;
  stock: number;
  barcode?: string;
  isOrganic: boolean;
  isFeatured: boolean;
  nutritionalInfo?: string;
  active: boolean;
  createdAt: string;
}

export interface GroceryCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  parentId?: number;
  sortOrder: number;
  active: boolean;
}

export interface GroceryOrder {
  id: number;
  userId: number;
  storeId: number;
  storeName?: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  deliveryAddress?: string;
  deliverySlot?: string;
  deliveredAt?: string;
  paymentStatus: string;
  items?: GroceryOrderItem[];
  createdAt: string;
}

export interface GroceryOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface GroceryOrderRequest {
  storeId: number;
  deliveryAddress?: string;
  deliverySlot?: string;
  paymentMethod?: string;
  items: { productId: number; quantity: number }[];
}

// ── Recipe ──
export interface FoodRecipe {
  id: number;
  title: string;
  slug: string;
  description?: string;
  cuisineType?: string;
  mealType?: string;
  courseType?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string;
  tips?: string;
  tags?: string;
  isVeg: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  authorId: number;
  authorName?: string;
  sourceType: string;
  status: string;
  viewCount: number;
  likeCount: number;
  avgRating?: number;
  totalRatings?: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
}

export interface RecipeIngredient {
  id: number;
  ingredientName: string;
  quantity: number;
  unit?: string;
  isOptional: boolean;
  substitute?: string;
}

export interface RecipeRequest {
  title: string;
  description?: string;
  cuisineType?: string;
  mealType?: string;
  courseType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string;
  tips?: string;
  tags?: string;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  ingredients?: { ingredientName: string; quantity: number; unit?: string; isOptional?: boolean; substitute?: string }[];
}

// ── Nutrition ──
export interface Nutritionist {
  id: number;
  userId: number;
  qualification?: string;
  specialization?: string;
  licenseNumber?: string;
  experienceYears?: number;
  bio?: string;
  consultationFee?: number;
  rating: number;
  status: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface MealPlan {
  id: number;
  userId: number;
  nutritionistId?: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  goal?: string;
  dailyCalories: number;
  dailyProtein?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  items: MealPlanItem[];
  createdAt: string;
}

export interface MealPlanItem {
  id: number;
  dayOfWeek: number;
  mealType: string;
  recipeId?: number;
  itemName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portionSize?: string;
}

export interface CalorieLog {
  id: number;
  userId: number;
  date: string;
  mealType: string;
  itemName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  quantity?: number;
  unit?: string;
  source: string;
  createdAt: string;
}

export interface CalorieLogRequest {
  date: string;
  mealType: string;
  itemName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  quantity?: number;
  unit?: string;
  source?: string;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  calorieGoal: number;
  proteinGoal: number;
  mealBreakdown: { mealType: string; calories: number; items: number }[];
}

export interface WeightLog {
  id: number;
  date: string;
  weight: number;
  unit: 'KG' | 'LBS';
  bodyFatPct?: number;
  muscleMass?: number;
  notes?: string;
}

// ── Food Events ──
export interface FoodEvent {
  id: number;
  name: string;
  description?: string;
  eventType: string;
  venue?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  registered: number;
  spotsLeft?: number;
  price?: number;
  imageUrl?: string;
  organizerId: number;
  status: string;
  registrationDeadline?: string;
  createdAt: string;
}

export interface FoodEventRequest {
  name: string;
  description?: string;
  eventType: string;
  venue?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  capacity: number;
  price?: number;
  imageUrl?: string;
  registrationDeadline?: string;
}

export interface FoodEventRegistration {
  id: number;
  eventId: number;
  userId: number;
  guests: number;
  totalAmount?: number;
  status: string;
  qrCode?: string;
  checkedInAt?: string;
  dietaryRequirements?: string;
  contributionItem?: string;
}

// ── Catering ──
export interface Caterer {
  id: number;
  name: string;
  description?: string;
  cuisineTypes?: string;
  minOrderCount?: number;
  maxOrderCount?: number;
  pricePerPlateFrom?: number;
  pricePerPlateTo?: number;
  fssaiLicense?: string;
  rating: number;
  totalEvents: number;
  status: string;
  logoUrl?: string;
  packages?: CateringPackage[];
  createdAt: string;
}

export interface CateringPackage {
  id: number;
  catererId: number;
  name: string;
  description?: string;
  occasionType: string;
  itemsPerPlate?: number;
  pricePerPlate: number;
  minPlates: number;
  includes?: string;
  imageUrl?: string;
  active: boolean;
}

export interface CateringRequest {
  id: number;
  userId: number;
  occasionType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  guestCount: number;
  budget?: number;
  menuPreferences?: string;
  dietaryRequirements?: string;
  status: string;
  selectedCatererId?: number;
  quotations?: CateringQuotation[];
  createdAt: string;
}

export interface CateringQuotation {
  id: number;
  requestId: number;
  catererId: number;
  catererName?: string;
  menu?: string;
  pricePerPlate: number;
  totalAmount: number;
  validUntil?: string;
  status: string;
  notes?: string;
}

export interface CateringRequestDto {
  occasionType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  guestCount: number;
  budget?: number;
  menuPreferences?: string;
  dietaryRequirements?: string;
}

// ── Community Kitchen ──
export interface CommunityKitchen {
  id: number;
  name: string;
  kitchenType: string;
  location?: string;
  description?: string;
  capacity: number;
  status: string;
  openingTime?: string;
  closingTime?: string;
  createdAt: string;
}

export interface CommunityKitchenMenu {
  id: number;
  kitchenId: number;
  date: string;
  mealType: string;
  items?: string;
  pricePerPlate: number;
  totalPlates: number;
  bookedPlates: number;
  availablePlates?: number;
  cutoffTime?: string;
}

export interface CommunityKitchenBooking {
  id: number;
  menuId: number;
  userId: number;
  quantity: number;
  totalAmount: number;
  status: string;
  pickupCode?: string;
  pickupTime?: string;
  pickedUpAt?: string;
}

// ── Cloud Kitchen ──
export interface CloudKitchen {
  id: number;
  name: string;
  description?: string;
  address?: string;
  capacity: number;
  status: string;
  kitchenType: string;
  rent?: number;
  brands?: CloudKitchenBrand[];
  createdAt: string;
}

export interface CloudKitchenBrand {
  id: number;
  kitchenId: number;
  brandName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  cuisineType?: string;
  status: string;
  rating?: number;
}

// ── Pantry ──
export interface PantryItem {
  id: number;
  userId: number;
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  purchaseDate?: string;
  expiryDate?: string;
  barcode?: string;
  imageUrl?: string;
  storageLocation: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'COUNTER';
  status: string;
  daysUntilExpiry?: number;
  createdAt: string;
}

export interface PantryItemRequest {
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  purchaseDate?: string;
  expiryDate?: string;
  barcode?: string;
  storageLocation?: string;
}

export interface PantryAlert {
  id: number;
  pantryItemId: number;
  itemName?: string;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ShoppingList {
  id: number;
  name: string;
  status: 'ACTIVE' | 'COMPLETED';
  items?: ShoppingListItem[];
  createdAt: string;
}

export interface ShoppingListItem {
  id: number;
  itemName: string;
  category?: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: number;
  isPurchased: boolean;
  purchasedPrice?: number;
}

// ── Loyalty ──
export interface LoyaltyProgram {
  id: number;
  name: string;
  description?: string;
  programType: string;
  pointsPerRupee?: number;
  minRedeemPoints?: number;
  pointValue?: number;
  status: string;
}

export interface LoyaltyMember {
  id: number;
  programId: number;
  userId: number;
  pointsBalance: number;
  lifetimePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  joinedAt: string;
}

export interface LoyaltyCoupon {
  id: number;
  code: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  remainingUses?: number;
  applicableTo: string;
  active: boolean;
}

// ── Corporate ──
export interface CorporateAccount {
  id: number;
  companyName: string;
  billingAddress?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  creditLimit?: number;
  balance: number;
  status: string;
  cardCount?: number;
  cafeteriaCount?: number;
  createdAt: string;
}

export interface MealCard {
  id: number;
  accountId: number;
  userId: number;
  userName?: string;
  cardNumber: string;
  dailyLimit: number;
  monthlyLimit: number;
  balance: number;
  status: string;
  validFrom: string;
  validUntil: string;
}

// ── Delivery ──
export interface DeliveryPartner {
  id: number;
  userId: number;
  vehicleType: string;
  vehicleNumber?: string;
  status: string;
  rating: number;
  totalDeliveries: number;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface DeliveryAssignment {
  id: number;
  orderId: number;
  partnerId: number;
  status: string;
  assignedAt: string;
  deliveredAt?: string;
  distanceKm?: number;
  deliveryFee?: number;
  tip?: number;
  otpCode?: string;
}

// ── Analytics ──
export interface FoodDashboardStats {
  totalRestaurants: number;
  totalHomeChefs: number;
  totalOrders: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalRecipes: number;
  activeEvents: number;
  totalDeliveryPartners: number;
}

export interface RestaurantAnalytics {
  id: number;
  restaurantId: number;
  date: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newCustomers: number;
  repeatCustomers: number;
  avgPreparationTime: number;
  avgDeliveryTime: number;
  cancellationRate: number;
  ratingAvg: number;
}

export interface ConsumptionTrend {
  id: number;
  month: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  vegPct: number;
  nonVegPct: number;
  subscriptionCount: number;
}

// ── Payment ──
export interface FoodPaymentInfo {
  id: number;
  orderType: string;
  orderId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status: string;
  createdAt: string;
}

export interface FoodWallet {
  id: number;
  userId: number;
  balance: number;
}

export interface WalletTransaction {
  id: number;
  transactionType: string;
  amount: number;
  referenceType?: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}
