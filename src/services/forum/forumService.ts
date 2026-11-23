import { apiClient } from "../common/apiClient";

export interface ForumCommentDto {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  authorFlat?: string;
  likeCount: number;
  isLiked?: boolean;
  isOwn: boolean;
  createdAt?: string;
}

export interface ForumPostDto {
  id: number;
  title: string;
  category?: string;
  content?: string;
  preview?: string;
  authorId: number;
  authorName: string;
  authorFlat?: string;
  commentCount: number;
  likeCount: number;
  isLiked?: boolean;
  isPinned: boolean;
  isClosed: boolean;
  isOwn: boolean;
  createdAt?: string;
  updatedAt?: string;
  comments?: ForumCommentDto[];
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const FORUM_CATEGORIES = [
  { key: "ALL", label: "All Topics", emoji: "💬" },
  { key: "ANNOUNCEMENT", label: "Announcements", emoji: "📢" },
  { key: "MAINTENANCE", label: "Maintenance", emoji: "🔧" },
  { key: "EVENTS", label: "Events & Festivals", emoji: "🎉" },
  { key: "CLASSIFIEDS", label: "Buy & Sell", emoji: "🏷️" },
  { key: "COMPLAINT", label: "Complaints & Grievances", emoji: "⚠️" },
  { key: "DISCUSSION", label: "General Discussion", emoji: "☕" }
] as const;

const MOCK_FORUM_POSTS: ForumPostDto[] = [
  {
    id: 1,
    title: "Society Annual General Meeting (AGM) 2026 — Key Decisions & Minutes",
    category: "ANNOUNCEMENT",
    authorId: 101,
    authorName: "Management Committee",
    authorFlat: "Tower Admin Desk",
    commentCount: 8,
    likeCount: 34,
    isLiked: false,
    isPinned: true,
    isClosed: false,
    isOwn: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    preview: "The AGM was concluded successfully on Sunday. Key resolutions passed: 1. Solar rooftop installation approved for Towers A-D; 2. EV charging tariff set at ₹9.5/kWh; 3. Security turnstile biometric rollout complete.",
    content: "Dear Residents,\n\nThe Annual General Meeting (AGM) was concluded successfully on Sunday. Key resolutions passed:\n1. Solar rooftop installation approved for Towers A-D (estimated 35% reduction in common area BESCOM charges).\n2. EV charging tariff set at ₹9.5/kWh, billed through the unified community wallet.\n3. Security turnstile biometric rollout complete across all gate entries.\n\nPlease find the full audited financial statements linked in the Documents tab.\n\nRegards,\nManagement Committee",
    comments: [
      { id: 1, content: "Great initiative on the solar panels! When is the installation expected to start?", authorId: 201, authorName: "Vikram Mehta", authorFlat: "Tower B-302", likeCount: 4, isLiked: false, isOwn: false, createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { id: 2, content: "Installation commences from next Monday. No power disruptions anticipated.", authorId: 101, authorName: "Management Committee", authorFlat: "Tower Admin Desk", likeCount: 6, isLiked: false, isOwn: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ]
  },
  {
    id: 2,
    title: "Overnight water pressure fluctuations in Tower C (Floors 8-14)",
    category: "MAINTENANCE",
    authorId: 204,
    authorName: "Rohan Kulkarni",
    authorFlat: "Tower C-1104",
    commentCount: 14,
    likeCount: 19,
    isLiked: false,
    isPinned: false,
    isClosed: false,
    isOwn: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    preview: "Has anyone on the higher floors in Tower C noticed low pressure between 6 AM and 8 AM? The booster pump seems to trip during peak hours.",
    content: "Has anyone on the higher floors in Tower C noticed low pressure between 6 AM and 8 AM? The booster pump seems to trip during peak morning hours. Can the facility management check the pressure transducer valve on the terrace tank?",
    comments: [
      { id: 3, content: "Facing the exact same issue on the 12th floor. Water runs very thin during morning showers.", authorId: 205, authorName: "Ananya Roy", authorFlat: "Tower C-1202", likeCount: 5, isLiked: false, isOwn: false, createdAt: new Date(Date.now() - 3600000 * 8).toISOString() }
    ]
  },
  {
    id: 3,
    title: "Diwali Carnival & Flea Market 2026 — Stall Registrations Open!",
    category: "EVENTS",
    authorId: 301,
    authorName: "Cultural Committee",
    authorFlat: "Clubhouse Desk",
    commentCount: 6,
    likeCount: 42,
    isLiked: true,
    isPinned: true,
    isClosed: false,
    isOwn: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    preview: "Inviting home bakers, handicraft creators, and festive snack chefs! Reserve your stall for the grand community carnival on November 07.",
    content: "Inviting home bakers, handicraft creators, festive snack chefs, and game creators! Reserve your stall for the grand community carnival on November 07 at the central amphitheatre lawn. Early bird stall bookings are open via the Events tab.",
    comments: []
  },
  {
    id: 4,
    title: "Looking for recommendations for weekend Badminton coach for kids (Age 8-12)",
    category: "DISCUSSION",
    authorId: 402,
    authorName: "Preeti Shenoy",
    authorFlat: "Tower A-601",
    commentCount: 5,
    likeCount: 8,
    isLiked: false,
    isPinned: false,
    isClosed: false,
    isOwn: false,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    preview: "We have a group of 4 kids wanting weekend morning coaching on Court 2. Any resident trainers or academy instructors available?",
    content: "We have a group of 4 kids wanting weekend morning coaching on Court 2. Any resident trainers or academy instructors available for 8:00 AM slots on Saturdays and Sundays?",
    comments: []
  }
];

export const forumService = {
  async getPosts(params?: { category?: string; search?: string; page?: number; size?: number }): Promise<PageResponse<ForumPostDto>> {
    try {
      const q = new URLSearchParams();
      if (params?.category && params.category !== "ALL") q.append("category", params.category);
      if (params?.search) q.append("search", params.search);
      if (params?.page !== undefined) q.append("page", String(params.page));
      if (params?.size !== undefined) q.append("size", String(params.size || 20));

      const queryStr = q.toString() ? `?${q.toString()}` : "";
      const res = await apiClient.get<PageResponse<ForumPostDto>>(`/forum/posts${queryStr}`);
      if (res && res.content && res.content.length > 0) return res;
    } catch {}

    // Fallback filtered mock data
    let filtered = [...MOCK_FORUM_POSTS];
    if (params?.category && params.category !== "ALL") {
      filtered = filtered.filter(p => p.category === params.category);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || (p.preview && p.preview.toLowerCase().includes(s)));
    }

    return {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      page: 0,
      size: 20
    };
  },

  async getPostById(id: number): Promise<ForumPostDto> {
    try {
      const res = await apiClient.get<ForumPostDto>(`/forum/posts/${id}`);
      if (res) return res;
    } catch {}

    const found = MOCK_FORUM_POSTS.find(p => p.id === id);
    if (found) return found;
    return MOCK_FORUM_POSTS[0];
  },

  async createPost(req: CreatePostRequest): Promise<ForumPostDto> {
    try {
      const res = await apiClient.post<ForumPostDto>("/forum/posts", req);
      if (res) return res;
    } catch {}

    const newPost: ForumPostDto = {
      id: Date.now(),
      title: req.title,
      category: req.category || "DISCUSSION",
      content: req.content,
      preview: req.content.slice(0, 150) + "...",
      authorId: 999,
      authorName: "Current Resident",
      authorFlat: "My Flat",
      commentCount: 0,
      likeCount: 1,
      isLiked: true,
      isPinned: false,
      isClosed: false,
      isOwn: true,
      createdAt: new Date().toISOString(),
      comments: []
    };
    MOCK_FORUM_POSTS.unshift(newPost);
    return newPost;
  },

  async addComment(postId: number, content: string): Promise<ForumCommentDto> {
    try {
      const res = await apiClient.post<ForumCommentDto>(`/forum/posts/${postId}/comments`, { content });
      if (res) return res;
    } catch {}

    const newComment: ForumCommentDto = {
      id: Date.now(),
      content,
      authorId: 999,
      authorName: "Current Resident",
      authorFlat: "My Flat",
      likeCount: 0,
      isLiked: false,
      isOwn: true,
      createdAt: new Date().toISOString()
    };
    const post = MOCK_FORUM_POSTS.find(p => p.id === postId);
    if (post) {
      post.comments = [...(post.comments || []), newComment];
      post.commentCount = (post.commentCount || 0) + 1;
    }
    return newComment;
  },

  async toggleLikePost(postId: number): Promise<{ liked: boolean; likeCount: number }> {
    try {
      return await apiClient.post<{ liked: boolean; likeCount: number }>(`/forum/posts/${postId}/like`, {});
    } catch {
      const post = MOCK_FORUM_POSTS.find(p => p.id === postId);
      if (post) {
        post.isLiked = !post.isLiked;
        post.likeCount += post.isLiked ? 1 : -1;
        return { liked: post.isLiked, likeCount: post.likeCount };
      }
      return { liked: true, likeCount: 1 };
    }
  },

  async toggleLikeComment(commentId: number): Promise<{ liked: boolean; likeCount: number }> {
    try {
      return await apiClient.post<{ liked: boolean; likeCount: number }>(`/forum/comments/${commentId}/like`, {});
    } catch {
      return { liked: true, likeCount: 1 };
    }
  },

  async deletePost(postId: number): Promise<void> {
    try {
      await apiClient.delete(`/forum/posts/${postId}`);
    } catch {}
    const idx = MOCK_FORUM_POSTS.findIndex(p => p.id === postId);
    if (idx !== -1) MOCK_FORUM_POSTS.splice(idx, 1);
  }
};
