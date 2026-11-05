import { apiClient } from '../common/apiClient';
import type {
  WellnessProfileDto,
  MealLogDto,
  WaterLogDto,
  DailyNutritionSummaryDto,
  WellnessChallengeDto,
  ChallengeParticipantDto,
  WellnessProviderDto,
  AccountabilityAlertDto,
  FoodCatalogItem,
  ChallengeStatus,
  WellnessProviderType,
  WorkoutLogDto,
  ExerciseCatalogItem,
  BodyMetricLogDto,
  ActivityGoalDto,
  FitnessStreakDto,
} from '../../types/wellness';

const BASE = '/api/wellness';

export const wellnessService = {
  // Profile
  getProfile: () => apiClient.get<WellnessProfileDto>(`${BASE}/profile`),
  saveProfile: (dto: WellnessProfileDto) => apiClient.put<WellnessProfileDto>(`${BASE}/profile`, dto),

  // Meals
  getMeals: (date: string) => apiClient.get<MealLogDto[]>(`${BASE}/meals?date=${date}`),
  getMealsRange: (start: string, end: string) => apiClient.get<MealLogDto[]>(`${BASE}/meals/range?start=${start}&end=${end}`),
  logMeal: (dto: MealLogDto) => apiClient.post<MealLogDto>(`${BASE}/meals`, dto),
  deleteMeal: (id: number) => apiClient.delete<void>(`${BASE}/meals/${id}`),

  // Daily Summary
  getDailySummary: (date?: string) => apiClient.get<DailyNutritionSummaryDto>(`${BASE}/summary${date ? `?date=${date}` : ''}`),

  // Water
  getWaterLogs: (date: string) => apiClient.get<WaterLogDto[]>(`${BASE}/water?date=${date}`),
  logWater: (dto: WaterLogDto) => apiClient.post<WaterLogDto>(`${BASE}/water`, dto),

  // Food Catalog
  searchFood: (query: string) => apiClient.get<FoodCatalogItem[]>(`${BASE}/food/search?query=${encodeURIComponent(query)}`),

  // Challenges
  getChallenges: (status?: ChallengeStatus) => apiClient.get<WellnessChallengeDto[]>(`${BASE}/challenges${status ? `?status=${status}` : ''}`),
  joinChallenge: (id: number) => apiClient.post<ChallengeParticipantDto>(`${BASE}/challenges/${id}/join`, {}),
  updateProgress: (id: number, progress: number) => apiClient.put<ChallengeParticipantDto>(`${BASE}/challenges/${id}/progress?progress=${progress}`, {}),

  // Providers
  getProviders: (type?: WellnessProviderType) => apiClient.get<WellnessProviderDto[]>(`${BASE}/providers${type ? `?type=${type}` : ''}`),

  // Accountability Alerts
  getAlerts: () => apiClient.get<AccountabilityAlertDto[]>(`${BASE}/alerts`),
  markAlertRead: (id: number) => apiClient.put<void>(`${BASE}/alerts/${id}/read`, {}),
  sendAlert: (alertType: string, message: string, data?: unknown) =>
    apiClient.post<AccountabilityAlertDto>(`${BASE}/alerts`, { alertType, message, data }),

  // Analyze meal (AI)
  analyzeMeal: (req: { text?: string; photoBase64?: string; mealType: string }) =>
    apiClient.post(`${BASE}/meals/analyze`, req),

  // Workouts
  getWorkouts: (date: string) => apiClient.get<WorkoutLogDto[]>(`${BASE}/workouts?date=${date}`),
  getWorkoutsRange: (start: string, end: string) => apiClient.get<WorkoutLogDto[]>(`${BASE}/workouts/range?start=${start}&end=${end}`),
  logWorkout: (dto: WorkoutLogDto) => apiClient.post<WorkoutLogDto>(`${BASE}/workouts`, dto),
  deleteWorkout: (id: number) => apiClient.delete<void>(`${BASE}/workouts/${id}`),

  // Exercise Catalog
  searchExercises: (query?: string) => apiClient.get<ExerciseCatalogItem[]>(`${BASE}/exercise/search${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  getExercisesByCategory: (category: string) => apiClient.get<ExerciseCatalogItem[]>(`${BASE}/exercise/category/${category}`),

  // Body Metrics
  getBodyMetrics: (days?: number) => apiClient.get<BodyMetricLogDto[]>(`${BASE}/body-metrics${days ? `?days=${days}` : ''}`),
  getLatestBodyMetric: () => apiClient.get<BodyMetricLogDto>(`${BASE}/body-metrics/latest`),
  logBodyMetric: (dto: BodyMetricLogDto) => apiClient.post<BodyMetricLogDto>(`${BASE}/body-metrics`, dto),

  // Activity Goals
  getActivityGoal: () => apiClient.get<ActivityGoalDto>(`${BASE}/activity-goal`),
  saveActivityGoal: (dto: ActivityGoalDto) => apiClient.put<ActivityGoalDto>(`${BASE}/activity-goal`, dto),

  // Streak
  getStreak: () => apiClient.get<FitnessStreakDto>(`${BASE}/streak`),
};
