/**
 * Centralized utility to resolve, sanitize, and normalize image & S3 URLs across the entire application.
 */

import { getToken } from "../services/common/apiClient";

const DEFAULT_EVENT_FALLBACK = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80";
const DEFAULT_USER_FALLBACK = "";

const refreshCache = new Map<string, { url: string; at: number }>();
const REFRESH_CACHE_TTL = 55 * 60 * 1000;

/**
 * Asks the backend to generate a fresh presigned URL for an expired S3 URL.
 * Cached for 55 minutes to avoid redundant network calls.
 */
export async function refreshPresignedUrl(expiredUrl: string): Promise<string | null> {
  if (!expiredUrl || !expiredUrl.includes("X-Amz-Date")) return null;

  const cached = refreshCache.get(expiredUrl);
  if (cached && Date.now() - cached.at < REFRESH_CACHE_TTL) return cached.url;

  try {
    const token = getToken();
    const res = await fetch("/api/files/refresh-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ url: expiredUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const freshUrl = data.url;
    if (freshUrl && freshUrl !== expiredUrl) {
      refreshCache.set(expiredUrl, { url: freshUrl, at: Date.now() });
      return freshUrl;
    }
  } catch {
    // Refresh failed — caller falls back to placeholder
  }
  return null;
}

/**
 * Checks whether an AWS S3 pre-signed URL has expired or is within 5 minutes of expiring.
 */
export function isPresignedUrlExpired(url: string): boolean {
  if (!url || !url.includes("X-Amz-Date")) return false;

  try {
    const urlObj = new URL(url);
    const amzDate = urlObj.searchParams.get("X-Amz-Date");
    const amzExpires = urlObj.searchParams.get("X-Amz-Expires");

    if (amzDate) {
      const match = amzDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
      if (match) {
        const signedAtMs = Date.UTC(
          parseInt(match[1], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[3], 10),
          parseInt(match[4], 10),
          parseInt(match[5], 10),
          parseInt(match[6], 10)
        );
        const expiresSec = amzExpires ? parseInt(amzExpires, 10) : 3600;
        const expiresAtMs = signedAtMs + expiresSec * 1000;
        const bufferMs = 5 * 60 * 1000; // 5-minute buffer

        return Date.now() > expiresAtMs - bufferMs;
      }
    }
  } catch {
    // If URL parsing fails, assume not expired
  }

  return false;
}

/**
 * Returns the URL as-is. Previously this stripped query params from expired
 * pre-signed URLs, which caused 403s on private buckets. The backend now
 * regenerates fresh pre-signed URLs at read time, so no client-side
 * stripping is needed.
 */
export function sanitizePresignedUrl(url: string): string {
  return url;
}

/**
 * Normalizes any image URL (including AWS S3 URIs, relative media paths, and backend host URLs).
 */
export function resolveImageUrl(url?: string | null, fallback: string = ""): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // 1. Data URLs & Blob URLs (e.g. preview or base64 fallback)
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // 2. AWS S3 Protocol: s3://my-bucket/path/to/image.jpg
  if (trimmed.startsWith("s3://")) {
    const withoutPrefix = trimmed.slice(5);
    const firstSlashIndex = withoutPrefix.indexOf("/");
    if (firstSlashIndex !== -1) {
      const bucketName = withoutPrefix.slice(0, firstSlashIndex);
      const key = withoutPrefix.slice(firstSlashIndex + 1);
      return `https://${bucketName}.s3.amazonaws.com/${key}`;
    }
    return fallback;
  }

  // 3. Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("localhost:") && trimmed.includes("/api/")) {
      const apiIndex = trimmed.indexOf("/api/");
      return trimmed.slice(apiIndex);
    }
    return trimmed;
  }

  // 4. Relative paths starting with /api/
  if (trimmed.startsWith("/api/")) {
    return trimmed;
  }

  // 5. Relative paths starting with / (e.g. /media/..., /uploads/..., /images/...)
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("/media/") || trimmed.startsWith("/files/") || trimmed.startsWith("/uploads/")) {
      return `/api${trimmed}`;
    }
    return trimmed;
  }

  // 6. Bare relative S3 key or media path
  if (trimmed.startsWith("media/") || trimmed.startsWith("files/") || trimmed.startsWith("uploads/")) {
    return `/api/${trimmed}`;
  }

  return trimmed;
}

/**
 * Resolves user/profile avatar picture from any standard user or member object.
 */
export function resolveUserAvatar(user?: any, fallback: string = DEFAULT_USER_FALLBACK): string {
  if (!user) return fallback;
  if (typeof user === "string") return resolveImageUrl(user, fallback);

  const raw =
    user.profilePicUrl ||
    user.profilePic ||
    user.picUrl ||
    user.photoUrl ||
    user.avatarUrl ||
    user.avatar ||
    user.imageUrl ||
    user.image ||
    user.profile_pic_url ||
    user.picture;

  return resolveImageUrl(raw, fallback);
}

/**
 * Resolves event/activity cover image from any standard event or activity item.
 */
export function resolveEventImage(event?: any, fallback: string = DEFAULT_EVENT_FALLBACK): string {
  if (!event) return fallback;
  if (typeof event === "string") return resolveImageUrl(event, fallback);

  const raw =
    event.coverImage ||
    event.coverImageUrl ||
    event.imageUrl ||
    event.bannerUrl ||
    event.posterUrl ||
    event.picUrl ||
    event.image ||
    event.photoUrl ||
    event.rawAuctionItem?.imageUrl ||
    (event as any)?.cover_image_url;

  return resolveImageUrl(raw, fallback);
}
