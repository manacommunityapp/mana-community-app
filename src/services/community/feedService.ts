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

  async getGroupFeed(groupId: number, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/group/${groupId}?page=${page}&size=${size}`);
  },

  async searchPosts(query: string, page = 0, size = 10): Promise<PaginatedResponse<PostResponse>> {
    return apiClient.get<PaginatedResponse<PostResponse>>(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
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
};
