import { apiClient } from "../common/apiClient";

export interface EventGalleryItemResponse {
  id: number;
  eventId: number;
  eventName?: string;
  url: string;
  thumbnailUrl: string | null;
  mediaType: string;
  albumName: string | null;
  dayLabel?: string;
  category?: string;
  caption: string | null;
  featured: boolean;
  sortOrder: number;
  uploadedByName: string;
  uploaderName?: string;
  createdAt: string;
}

export interface EventGalleryItemRequest {
  eventId: number;
  url: string;
  thumbnailUrl?: string;
  mediaType?: string;
  albumName?: string;
  caption?: string;
  featured?: boolean;
  sortOrder?: number;
}

export const eventGalleryService = {
  async getByEvent(eventId: number, albumName?: string): Promise<EventGalleryItemResponse[]> {
    let qs = `?eventId=${eventId}`;
    if (albumName) qs += `&albumName=${encodeURIComponent(albumName)}`;
    return apiClient.get<EventGalleryItemResponse[]>(`/events/gallery${qs}`);
  },

  async getAlbums(eventId: number): Promise<string[]> {
    return apiClient.get<string[]>(`/events/gallery/albums?eventId=${eventId}`);
  },

  async create(data: EventGalleryItemRequest): Promise<EventGalleryItemResponse> {
    return apiClient.post<EventGalleryItemResponse>("/events/gallery", data);
  },

  async update(id: number, data: EventGalleryItemRequest): Promise<EventGalleryItemResponse> {
    return apiClient.put<EventGalleryItemResponse>(`/events/gallery/${id}`, data);
  },

  async deleteItem(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/gallery/${id}`);
  },
};
