import { apiClient } from "./common/apiClient";

export interface VehicleProfileResponse {
  id: number;
  nickname: string;
  vehicleType: string;
  make: string;
  model: string;
  color: string;
  plateNumber: string;
  isDefault: boolean;
  createdAt: string;
}

export interface VehicleServiceAddonResponse {
  id: number;
  name: string;
  price: number;
}

export interface VehicleServiceCatalogResponse {
  id: number;
  name: string;
  description: string;
  vehicleTypes: string[];
  durationMinutes: number;
  basePrice: number;
  communityPrice: number;
  isPopular: boolean;
  gradientStart: string;
  gradientEnd: string;
  addons: VehicleServiceAddonResponse[];
}

export interface VehicleServiceSlotResponse {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  bookedCount: number;
  remaining: number;
  available: boolean;
}

export interface VehicleCareBookingResponse {
  id: number;
  bookingNumber: string;
  status: string;
  vehicleId: number;
  vehicleNickname: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleDisplay: string;
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  slotId: number;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  technicianId?: number;
  technicianName?: string;
  baseAmount: number;
  addonAmount: number;
  totalAmount: number;
  addons: VehicleServiceAddonResponse[];
  locationNotes: string;
  etaMinutes?: number;
  rating?: number;
  reviewText?: string;
  createdAt: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  quotedPrice?: number;
  paidAmount?: number;
  addonNames?: string[];
  canCancel?: boolean;
  canRate?: boolean;
}

export interface VehicleCarePlanCatalogResponse {
  id: number;
  name: string;
  description: string;
  frequencyLabel: string;
  washesPerMonth: number;
  price: number;
  originalPrice: number;
  vehicleTypes: string[];
  creditsPerCycle?: number;
  savingsPercent?: number;
  frequency?: string;
  emoji?: string;
  popular?: boolean;
}

export interface VehicleCarePlanResponse {
  id: number;
  planName: string;
  frequencyLabel: string;
  vehicleNickname: string;
  vehiclePlate: string;
  status: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  startDate: string;
  endDate: string;
  name?: string;
  vehicleDisplay?: string;
  nextRenewalDate?: string;
  frequency?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const vehicleCareService = {
  // Catalog
  async getCatalog(): Promise<VehicleServiceCatalogResponse[]> {
    return apiClient.get<VehicleServiceCatalogResponse[]>("/vehicle-care/catalog");
  },

  async getAddons(serviceId: number): Promise<VehicleServiceAddonResponse[]> {
    return apiClient.get<VehicleServiceAddonResponse[]>(`/vehicle-care/catalog/${serviceId}/addons`);
  },

  // Slots
  async getAvailableSlots(from: string, to: string): Promise<VehicleServiceSlotResponse[]> {
    return apiClient.get<VehicleServiceSlotResponse[]>(`/vehicle-care/slots?from=${from}&to=${to}`);
  },

  // Resident Vehicles
  async getVehicles(): Promise<VehicleProfileResponse[]> {
    return apiClient.get<VehicleProfileResponse[]>("/vehicle-care/vehicles");
  },

  async createVehicle(data: Partial<VehicleProfileResponse>): Promise<VehicleProfileResponse> {
    return apiClient.post<VehicleProfileResponse>("/vehicle-care/vehicles", data);
  },

  async deleteVehicle(vehicleId: number): Promise<void> {
    return apiClient.delete<void>(`/vehicle-care/vehicles/${vehicleId}`);
  },

  // Bookings
  async getBookings(filter = "all", page = 0, size = 20): Promise<PageResponse<VehicleCareBookingResponse>> {
    return apiClient.get<PageResponse<VehicleCareBookingResponse>>(`/vehicle-care/bookings?filter=${filter}&page=${page}&size=${size}`);
  },

  async createBooking(data: any): Promise<VehicleCareBookingResponse> {
    return apiClient.post<VehicleCareBookingResponse>("/vehicle-care/bookings", data);
  },

  async cancelBooking(bookingId: number): Promise<void> {
    return apiClient.patch<void>(`/vehicle-care/bookings/${bookingId}/cancel`);
  },

  async submitReview(bookingId: number, rating: number, reviewText?: string): Promise<VehicleCareBookingResponse> {
    return apiClient.post<VehicleCareBookingResponse>(`/vehicle-care/bookings/${bookingId}/review`, { rating, reviewText });
  },

  // Plans
  async getPlanCatalog(): Promise<VehicleCarePlanCatalogResponse[]> {
    return apiClient.get<VehicleCarePlanCatalogResponse[]>("/vehicle-care/plans/catalog");
  },

  async getMyPlans(): Promise<VehicleCarePlanResponse[]> {
    return apiClient.get<VehicleCarePlanResponse[]>("/vehicle-care/plans");
  },

  async updatePlanStatus(planId: number, status: string): Promise<VehicleCarePlanResponse> {
    return apiClient.patch<VehicleCarePlanResponse>(`/vehicle-care/plans/${planId}/status?status=${status}`);
  },

  // Vendor / Technician
  async getVendorJobs(filter = "active"): Promise<VehicleCareBookingResponse[]> {
    return apiClient.get<VehicleCareBookingResponse[]>(`/vehicle-care/vendor/jobs?filter=${filter}`);
  },

  async updateJobStatus(bookingId: number, status: string): Promise<VehicleCareBookingResponse> {
    return apiClient.patch<VehicleCareBookingResponse>(`/vehicle-care/vendor/jobs/${bookingId}/status?status=${status}`);
  },

  // Admin
  async getAdminBookings(status?: string, page = 0, size = 20): Promise<PageResponse<VehicleCareBookingResponse>> {
    const statusParam = status && status !== "ALL" ? `&status=${status}` : "";
    return apiClient.get<PageResponse<VehicleCareBookingResponse>>(`/vehicle-care/admin/bookings?page=${page}&size=${size}${statusParam}`);
  },

  async assignTechnician(bookingId: number, technicianId: number): Promise<VehicleCareBookingResponse> {
    return apiClient.patch<VehicleCareBookingResponse>(`/vehicle-care/admin/bookings/${bookingId}/assign?technicianId=${technicianId}`);
  },
};
