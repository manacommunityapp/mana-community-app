import { apiClient, getToken } from "../common/apiClient";

export interface EventDonationResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  flatNumber: string | null;
  amount: number;
  paymentMethod: string;
  transactionRef: string | null;
  note: string | null;
  anonymous: boolean;
  recordedByName: string;
  createdAt: string;
}

export interface EventDonationRequest {
  eventId?: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  flatNumber?: string;
  amount: number;
  paymentMethod?: string;
  transactionRef?: string;
  note?: string;
  anonymous?: boolean;
}

export const eventDonationService = {
  async getAll(eventId?: number): Promise<EventDonationResponse[]> {
    const qs = eventId ? `?eventId=${eventId}` : "";
    return apiClient.get<EventDonationResponse[]>(`/events/donations${qs}`);
  },

  async create(data: EventDonationRequest): Promise<EventDonationResponse> {
    return apiClient.post<EventDonationResponse>("/events/donations", data);
  },

  async update(id: number, data: EventDonationRequest): Promise<EventDonationResponse> {
    return apiClient.put<EventDonationResponse>(`/events/donations/${id}`, data);
  },

  async deleteDonation(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/donations/${id}`);
  },

  async downloadTemplate(): Promise<void> {
    const token = getToken();
    const res = await fetch("/api/events/donations/bulk-upload/template", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download template");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation_upload_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },

  async bulkUpload(file: File): Promise<{ total: number; saved: number; failed: number; blob: Blob }> {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      throw new Error("Invalid file type. Only Excel (.xlsx) files are accepted. Please use the provided template.");
    }

    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/events/donations/bulk-upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      let errorMessage = "Bulk upload failed. Please try again.";
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        errorMessage = json?.message ?? errorMessage;
      } else {
        const text = await res.text().catch(() => "");
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }
    const total  = parseInt(res.headers.get("X-Total-Rows")   ?? "0", 10);
    const saved  = parseInt(res.headers.get("X-Saved-Count")  ?? "0", 10);
    const failed = parseInt(res.headers.get("X-Failed-Count") ?? "0", 10);
    const blob = await res.blob();
    return { total, saved, failed, blob };
  },
};
