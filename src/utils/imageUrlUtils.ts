/**
 * Centralized utility to resolve, sanitize, and normalize image & S3 URLs across the entire application.
 */

const DEFAULT_EVENT_FALLBACK = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80";
const DEFAULT_USER_FALLBACK = "";

/**
 * Checks if a pre-signed AWS S3 URL has expired.
 * If expired (or if the expiration timestamp has passed), returns the clean base URL without signature query parameters.
 */
export function sanitizePresignedUrl(url: string): string {
  if (!url || !url.includes("X-Amz-Date")) return url;

  try {
    const urlObj = new URL(url);
    const amzDate = urlObj.searchParams.get("X-Amz-Date");
    const amzExpires = urlObj.searchParams.get("X-Amz-Expires");

    if (amzDate) {
      // Format: YYYYMMDDTHHMMSSZ (e.g. 20260920T142401Z)
      const match = amzDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const min = parseInt(match[5], 10);
        const sec = parseInt(match[6], 10);

        const signedAtMs = Date.UTC(year, month, day, hour, min, sec);
        const expiresSec = amzExpires ? parseInt(amzExpires, 10) : 3600;
        const expiresAtMs = signedAtMs + expiresSec * 1000;

        // If URL is expired, strip query parameters so browser requests the base S3/CDN object directly
        if (Date.now() > expiresAtMs) {
          return `${urlObj.origin}${urlObj.pathname}`;
        }
      }
    }
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }

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
    const withoutPrefix = trimmed.slice(5); // "my-bucket/path/to/image.jpg"
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
    // If it points to localhost with backend port (e.g. http://localhost:8080/api/ or http://localhost:8081/api/),
    // rewrite to relative /api/ to work across mobile testing, LAN IP, and dev proxies.
    if (trimmed.includes("localhost:") && trimmed.includes("/api/")) {
      const apiIndex = trimmed.indexOf("/api/");
      return trimmed.slice(apiIndex);
    }
    // Clean expired AWS S3 pre-signed signatures so public/CDN assets load without 403 Forbidden
    return sanitizePresignedUrl(trimmed);
  }

  // 4. Relative paths starting with /api/
  if (trimmed.startsWith("/api/")) {
    return trimmed;
  }

  // 5. Relative paths starting with / (e.g. /media/..., /uploads/..., /images/...)
  if (trimmed.startsWith("/")) {
    // If it's a media or uploads endpoint without /api prefix
    if (trimmed.startsWith("/media/") || trimmed.startsWith("/files/") || trimmed.startsWith("/uploads/")) {
      return `/api${trimmed}`;
    }
    return trimmed;
  }

  // 6. Bare relative S3 key or media path (e.g. "media/123.jpg" or "uploads/events/banner.png")
  if (trimmed.startsWith("media/") || trimmed.startsWith("files/") || trimmed.startsWith("uploads/")) {
    return `/api/${trimmed}`;
  }

  // Default clean return
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
