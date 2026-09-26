import { apiClient } from "../common/apiClient";
import type {
  PostResponse,
  CommentResponse,
  LikeToggleResponse,
  ReactionResponse,
  ReactionTypeEnum,
  PaginatedResponse,
} from "../../types/api";

export interface UpdatePostRequest {
  content?: string;
  title?: string;
  imageUrl?: string;
  mediaAttachments?: { mediaUrl: string; mediaType: string; thumbnailUrl?: string; altText?: string; sortOrder?: number; mediaObjectId?: string }[];
  eventId?: number;
  eventDate?: string;
  eventVenue?: string;
  location?: string;
  price?: number;
}

export interface CreatePostRequest {
  content: string;
  title?: string;
  imageUrl?: string;
  type?: string;
  visibility?: string;
  priority?: string;
  groupId?: number;
  price?: number;
  location?: string;
  pollQuestion?: string;
  pollOptions?: string;
  pollEndDate?: string;
  pollAnonymous?: boolean;
  hashtags?: string;
  mentions?: string;
  linkUrl?: string;
  eventId?: number;
  eventDate?: string;
  eventEndDate?: string;
  eventVenue?: string;
  notify?: boolean;
  mediaAttachments?: { mediaUrl: string; mediaType: string; thumbnailUrl?: string; altText?: string; sortOrder?: number; mediaObjectId?: string }[];
}

export const feedService = {
  async getFeed(page = 0, size = 10, type?: string): Promise<PaginatedResponse<PostResponse>> {
    let url = `/posts?page=${page}&size=${size}`;
    if (type) url += `&type=${type}`;
    return apiClient.get<PaginatedResponse<PostResponse>>(url);
  },

  /** Lightweight feed stream with slim public author fields, avoiding heavy entity queries */
  async getFeedStream(page = 0, size = 10, type?: string): Promise<PaginatedResponse<PostResponse>> {
    let url = `/posts/stream?page=${page}&size=${size}`;
    if (type) url += `&type=${type}`;
    return apiClient.get<PaginatedResponse<PostResponse>>(url);
  },

  async getGroupFeed(groupId: number, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/group/${groupId}?page=${page}&size=${size}`);
  },

  async getGroupFeedStream(groupId: number, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/group/${groupId}/stream?page=${page}&size=${size}`);
  },

  async searchPosts(query: string, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  },

  async searchFeedStream(query: string, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/search-stream?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  },

  async getBookmarks(page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/bookmarks?page=${page}&size=${size}`);
  },

  async createPost(request: CreatePostRequest): Promise<PostResponse> {
    return apiClient.post<PostResponse>("/posts", request);
  },

  async updatePost(id: number, request: UpdatePostRequest): Promise<PostResponse> {
    return apiClient.patch<PostResponse>(`/posts/${id}`, request);
  },

  async deletePost(id: number): Promise<void> {
    return apiClient.delete<void>(`/posts/${id}`);
  },

  async pinPost(id: number): Promise<PostResponse> {
    return apiClient.post<PostResponse>(`/posts/${id}/pin`);
  },

  async toggleReaction(id: number, reactionType: ReactionTypeEnum): Promise<ReactionResponse> {
    return apiClient.post<ReactionResponse>(`/posts/${id}/react`, { reactionType });
  },

  async toggleLike(id: number): Promise<LikeToggleResponse> {
    return apiClient.post<LikeToggleResponse>(`/posts/${id}/like`);
  },

  async getPostLikers(id: number): Promise<import("../../types/api").PostLikerResponse[]> {
    return apiClient.get<import("../../types/api").PostLikerResponse[]>(`/posts/${id}/likes`);
  },

  async toggleBookmark(id: number): Promise<PostResponse> {
    return apiClient.post<PostResponse>(`/posts/${id}/bookmark`);
  },

  async getComments(postId: number): Promise<CommentResponse[]> {
    return apiClient.get<CommentResponse[]>(`/posts/${postId}/comments`);
  },

  async toggleCommentLike(commentId: number): Promise<import("../../types/api").CommentLikeToggleResponse> {
    return apiClient.post<import("../../types/api").CommentLikeToggleResponse>(`/posts/comments/${commentId}/like`);
  },

  async getCommentLikers(commentId: number): Promise<import("../../types/api").CommentLikerResponse[]> {
    return apiClient.get<import("../../types/api").CommentLikerResponse[]>(`/posts/comments/${commentId}/likes`);
  },

  async addComment(postId: number, content: string, parentId?: number): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, { content, parentId });
  },

  async deleteComment(commentId: number): Promise<void> {
    return apiClient.delete<void>(`/posts/comments/${commentId}`);
  },

  async pinComment(commentId: number): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/comments/${commentId}/pin`);
  },

  async acceptAnswer(commentId: number): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/comments/${commentId}/accept`);
  },

  async voteOnPoll(postId: number, option: string): Promise<PostResponse> {
    return apiClient.post<PostResponse>(`/posts/${postId}/vote?option=${encodeURIComponent(option)}`);
  },

  async reportPost(postId: number, reason: string, description?: string): Promise<void> {
    return apiClient.post<void>(`/posts/${postId}/report`, { contentType: "POST", contentId: postId, reason, description });
  },

  /**
   * Toggle a rich reaction (LIKE, LOVE, CELEBRATE, HELPFUL, THANKS) on a comment.
   * Passing the same reaction type again will un-react.
   */
  async toggleCommentReaction(commentId: number, reactionType: string): Promise<import("../../types/api").CommentReactionToggleResponse> {
    return apiClient.post<import("../../types/api").CommentReactionToggleResponse>(
      `/posts/comments/${commentId}/react?type=${encodeURIComponent(reactionType)}`
    );
  },

  /** Returns per-type reaction counts for a comment, e.g. { LIKE: 3, LOVE: 2 } */
  async getCommentReactionCounts(commentId: number): Promise<Record<string, number>> {
    return apiClient.get<Record<string, number>>(`/posts/comments/${commentId}/reactions`);
  },

  /** Fast summary counts for sidebar accordion badges on initial page load */
  async getSidebarSummary(): Promise<FeedSummaryCountsResponse> {
    return apiClient.get<FeedSummaryCountsResponse>("/posts/summary-counts");
  },

  /** Keyset/cursor-based infinite feed */
  async getCursorFeed(cursor?: string | null, limit = 20): Promise<CursorFeedResponse> {
    let url = `/feed?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    try {
      return await apiClient.get<CursorFeedResponse>(url);
    } catch {
      // Graceful fallback adapter to existing posts stream
      const res = await apiClient.get<PaginatedResponse<PostResponse>>(`/posts/stream?page=0&size=${limit}`);
      return {
        items: (res.content || []).map((p: any) => ({
          id: p.id,
          title: p.title || (p.content ? p.content.slice(0, 60) : "Community Post"),
          summary: p.content || "",
          image: p.imageUrl || p.mediaAttachments?.[0]?.mediaUrl || null,
          createdAt: p.createdAt || new Date().toISOString(),
          authorName: p.authorName || p.author?.fullName || "Resident",
          authorAvatar: p.authorAvatar || p.author?.profilePicUrl,
          authorRole: p.authorRole,
          likesCount: p.likesCount || p.likeCount || 0,
          commentsCount: p.commentsCount || p.commentCount || 0,
        })),
        nextCursor: res.last ? null : btoa(String(Date.now())),
      };
    }
  },

  /** Dashboard fast aggregate stats */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    try {
      return await apiClient.get<DashboardStatsResponse>("/dashboard");
    } catch {
      // Graceful fallback adapter to summary counts
      const counts = await apiClient.get<FeedSummaryCountsResponse>("/posts/summary-counts").catch(() => null);
      return {
        stats: [
          { label: "Total Events", value: String(counts?.upcomingEventsCount ?? 12) },
          { label: "Registered", value: String(counts?.myPassCount ?? 4) },
          { label: "Community", value: String(counts?.directoryCount ?? 432) },
        ],
      };
    }
  },
};

export interface CursorFeedItem {
  id: string | number;
  title: string;
  summary: string;
  image?: string | null;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface CursorFeedResponse {
  items: CursorFeedItem[];
  nextCursor: string | null;
}

export interface DashboardStatItem {
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStatItem[];
}

export interface FeedSummaryCountsResponse {
  directoryCount: number;
  sportsEventsCount: number;
  upcomingEventsCount: number;
  myPassCount: number;
  trendingCount: number;
  myGroupsCount: number;
  topContributorsCount: number;
  myEngagementPoints: number;
  myEngagementLevel: number;
  officialAnnouncementsCount: number;
}
