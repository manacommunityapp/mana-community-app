/**
 * Centralized utility to resolve, sanitize, and normalize image & S3 URLs across the entire application.
 */

import { getToken } from "../services/common/apiClient";

const DEFAULT_EVENT_FALLBACK = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80";
const DEFAULT_USER_FALLBACK = "";

const refreshCache = new Map<string, { url: string; at: number }>();
const REFRESH_CACHE_TTL = 55 * 60 * 1000;

/**
 * The same Authorization / platform headers the api client sends. GET
 * /api/files/** and /api/media/** are no longer `permitAll` (they were
 * anonymous and enumerable by sequential id, which exposed KYC documents and
 * payment screenshots across tenants), so every read of them needs the token.
 */
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    "X-Platform": "web",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * True when `url` points at a backend file route that now requires the bearer
 * token, i.e. a URL a bare `<img src>` can no longer load.
 */
export function requiresAuthenticatedFetch(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const path = url.startsWith("/")
    ? url
    : (() => {
        try {
          return new URL(url).pathname;
        } catch {
          return "";
        }
      })();
  return path.startsWith("/api/files/") || path.startsWith("/api/media/");
}

/**
 * Derives the authenticated proxy path for an image URL that just failed to
 * load, mirroring the `onError` fallbacks that used to be inlined in each
 * component: an S3 gallery key is re-read through /api/files/<key>.
 * Returns null when there is nothing better to try.
 */
export function deriveFileProxyPath(failedSrc?: string | null): string | null {
  if (!failedSrc || typeof failedSrc !== "string") return null;
  if (requiresAuthenticatedFetch(failedSrc)) return null; // already the proxied URL
  const s3Match = failedSrc.match(/users\/\d+\/gallery\/.+/);
  if (s3Match) return `/api/files/${s3Match[0].split("?")[0]}`;
  return null;
}

/**
 * Reads a protected file through the API with the api client's Authorization
 * header and returns a `blob:` object URL usable as an `<img src>`.
 *
 * The caller owns the returned URL and MUST revoke it (see
 * `useAuthenticatedImage`, which does this on unmount) — a gallery that leaks
 * one object URL per thumbnail pins every decoded image in memory.
 *
 * Longer term, the backend should hand out short-lived presigned S3 URLs
 * instead: those need no Authorization header, so a plain `<img>` works and
 * this blob round-trip (and its memory cost) disappears.
 */
export async function fetchAuthenticatedObjectUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Asks the backend to generate a fresh presigned URL for an expired S3 URL.
 * Cached for 55 minutes to avoid redundant network calls.
 */
export async function refreshPresignedUrl(expiredUrl: string): Promise<string | null> {
  if (!expiredUrl || !expiredUrl.includes("X-Amz-Date")) return null;

  const cached = refreshCache.get(expiredUrl);
  if (cached && Date.now() - cached.at < REFRESH_CACHE_TTL) return cached.url;

  try {
    const res = await fetch("/api/files/refresh-url", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
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
      const key = withoutPrefix.slice(firstSlashIndex + 1);
      return `/api/files/${key}`;
    }
    return fallback;
  }

  // 3. Absolute HTTP/HTTPS URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("localhost:") && trimmed.includes("/api/")) {
      const apiIndex = trimmed.indexOf("/api/");
      return trimmed.slice(apiIndex);
    }
    
    // If it's an AWS S3 URL for our bucket or has expired/missing pre-signed signature (which causes 403 on private buckets),
    // proxy it through the backend files controller: /api/files/<key>
    const isS3Url = trimmed.includes(".s3.") || trimmed.includes(".s3-") || trimmed.includes(".s3.amazonaws.com");
    if (isS3Url) {
      const hasSignature = trimmed.includes("X-Amz-Signature") || trimmed.includes("X-Amz-Date");
      const isExpired = hasSignature && isPresignedUrlExpired(trimmed);
      const isOurBucket = trimmed.includes("manacommunityhub");

      if (!hasSignature || isExpired || isOurBucket) {
        try {
          const parsed = new URL(trimmed);
          let s3Key = parsed.pathname.replace(/^\/+/, "");
          if (s3Key.startsWith("manacommunityhub/")) {
            s3Key = s3Key.substring("manacommunityhub/".length);
          }
          if (s3Key) {
            return `/api/files/${s3Key}`;
          }
        } catch {
          // Keep as-is if URL parsing fails
        }
      }
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
