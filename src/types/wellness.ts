export type GoalType = 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MAINTAIN' | 'MUSCLE_GAIN' | 'GENERAL_WELLNESS';
export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type MealSourceType = 'AI_PHOTO' | 'AI_TEXT' | 'AI_VOICE' | 'MANUAL' | 'FOOD_DATABASE';
export type MealLogStatus = 'DRAFT' | 'CONFIRMED';
export type ChallengeType = 'WALKING' | 'HYDRATION' | 'NUTRITION' | 'FITNESS' | 'YOGA' | 'CUSTOM';
export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SharingPreference = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
export type CoachingStyle = 'GENTLE' | 'MOTIVATIONAL' | 'STRICT' | 'DATA_FOCUSED';
export type WellnessProviderType = 'DIETITIAN' | 'NUTRITIONIST' | 'PERSONAL_TRAINER' | 'YOGA_INSTRUCTOR' | 'GYM';

export interface WellnessProfileDto {
  id?: number;
  userId?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  age?: number;
  gender?: string;
  activityLevel?: ActivityLevel;
  goalType?: GoalType;
  coachingStyle?: CoachingStyle;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
  dailyCarbsTarget?: number;
  dailyFatTarget?: number;
  dailyWaterTargetMl?: number;
  sharingPreference?: SharingPreference;
  dietaryRestrictions?: string;
  allergies?: string;
  healthConditions?: string;
}

export interface MealItemDto {
  id?: number;
  foodName: string;
  foodNameLocal?: string;
  quantity?: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  foodCatalogId?: number;
}

export interface MealLogDto {
  id?: number;
  userId?: number;
  mealType: MealType;
  mealDate: string;
  mealTime?: string;
  sourceType?: MealSourceType;
  originalInput?: string;
  photoUrl?: string;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  aiConfidence?: number;
  status?: MealLogStatus;
  notes?: string;
  items?: MealItemDto[];
}

export interface WaterLogDto {
  id?: number;
  userId?: number;
  logDate: string;
  logTime?: string;
  amountMl: number;
  notes?: string;
}

export interface DailyNutritionSummaryDto {
  date: string;
  totalCalories: number;
  calorieTarget: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalWaterMl: number;
  waterTargetMl: number;
  mealCount: number;
  meals: MealLogDto[];
}

export interface WellnessChallengeDto {
  id: number;
  title: string;
  description?: string;
  challengeType: ChallengeType;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  targetValue?: number;
  targetUnit?: string;
  maxParticipants?: number;
  communityId?: number;
  createdByUserId?: number;
  badgeName?: string;
  badgeIcon?: string;
  participantCount?: number;
}

export interface ChallengeParticipantDto {
  id: number;
  userId: number;
  userName?: string;
  currentProgress: number;
  joinedDate?: string;
  completed: boolean;
  completedDate?: string;
  badgeEarned: boolean;
}

export interface WellnessProviderDto {
  id: number;
  name: string;
  providerType: WellnessProviderType;
  specialty?: string;
  description?: string;
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  consultationFee?: number;
  availableOnline?: boolean;
  availableInPerson?: boolean;
  location?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  communityId?: number;
  verified?: boolean;
  active?: boolean;
}

export interface AiMealAnalysisRequest {
  text?: string;
  photoBase64?: string;
  mealType: MealType;
}

export interface AiMealAnalysisResponse {
  items: MealItemDto[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  confidence: number;
  suggestions?: string;
  junkFoodScore?: number;
  isJunkFood?: boolean;
}

export type AccountabilityAlertType = 'CALORIE_OVERAGE' | 'MISSED_DAY' | 'JUNK_FOOD' | 'BUDDY_CHANGES';

export interface AccountabilityAlertDto {
  id: number;
  alertType: AccountabilityAlertType;
  partnerUserId?: number;
  triggeredAt: string;
  message: string;
  isRead: boolean;
  dataJson?: string;
}

export interface FoodCatalogItem {
  id: number;
  name: string;
  nameLocal?: string;
  category?: string;
  cuisine?: string;
  servingSize?: string;
  servingUnit?: string;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  fiberPerServing?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  region?: string;
  verified?: boolean;
}
