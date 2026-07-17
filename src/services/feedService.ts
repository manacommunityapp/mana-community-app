import { apiClient } from "./apiClient";
import type { PostResponse, CommentResponse, LikeToggleResponse, PaginatedResponse } from "../types/api";

export const feedService = {
  /** GET /api/posts */
  async getFeed(page = 0, size = 10, type?: string): Promise<PaginatedResponse<PostResponse>> {
    let url = `/posts?page=${page}&size=${size}`;
    if (type) url += `&type=${type}`;
    return apiClient.get<PaginatedResponse<PostResponse>>(url);
  },

  /** POST /api/posts */
  async createPost(
    content: string,
    imageUrl?: string,
    type?: string,
    price?: number,
    location?: string,
    pollQuestion?: string,
    pollOptions?: string
  ): Promise<PostResponse> {
    return apiClient.post<PostResponse>("/posts", {
      content,
      imageUrl,
      type,
      price,
      location,
      pollQuestion,
      pollOptions
    });
  },

  /** DELETE /api/posts/:id */
  async deletePost(id: number): Promise<void> {
    return apiClient.delete<void>(`/posts/${id}`);
  },

  /** POST /api/posts/:id/like */
  async toggleLike(id: number): Promise<LikeToggleResponse> {
    return apiClient.post<LikeToggleResponse>(`/posts/${id}/like`);
  },

  /** GET /api/posts/:id/comments */
  async getComments(postId: number): Promise<CommentResponse[]> {
    return apiClient.get<CommentResponse[]>(`/posts/${postId}/comments`);
  },

  /** POST /api/posts/:id/comments */
  async addComment(postId: number, content: string): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, { content });
  },

  /** DELETE /api/posts/comments/:commentId */
  async deleteComment(commentId: number): Promise<void> {
    return apiClient.delete<void>(`/posts/comments/${commentId}`);
  },

  /** POST /api/posts/:id/vote */
  async voteOnPoll(postId: number, option: string): Promise<PostResponse> {
    return apiClient.post<PostResponse>(`/posts/${postId}/vote?option=${encodeURIComponent(option)}`);
  },
};
