/**
 * Production Media Validation Utility for UI
 *
 * Performs multi-layer client-side validation prior to uploading to S3:
 *  1. Size limits (Max 20MB for images, Max 500MB for videos, non-zero byte check)
 *  2. Extension & MIME type whitelist verification
 *  3. In-browser deep binary decoding:
 *     - Images: Loads into HTML Image() object; verifies naturalWidth/naturalHeight > 0.
 *     - Videos: Loads into HTML <video> element; verifies metadata and duration > 0.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/svg+xml",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/3gpp",
  "video/ogg",
];

export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export interface ValidationResult {
  valid: boolean;
  mediaType: "photo" | "video" | "document";
  width?: number;
  height?: number;
  duration?: number;
  error?: string;
}

/**
 * Deeply validates an image file in the browser using HTML Image object.
 * Catches fake/corrupted image files (e.g. .exe renamed to .jpg).
 */
export function validateImageInBrowser(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        reject(new Error(`File '${file.name}' has invalid image dimensions (0x0).`));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`File '${file.name}' is corrupted or not a valid image format.`));
    };

    img.src = objectUrl;
  });
}

/**
 * Deeply validates a video file in the browser using HTML Video element.
 * Catches unplayable or corrupted video containers.
 */
export function validateVideoInBrowser(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (video.duration > 0 || video.videoWidth > 0) {
        resolve({
          duration: Math.round(video.duration || 0),
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
        });
      } else {
        reject(new Error(`Video file '${file.name}' has invalid duration or dimensions.`));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`File '${file.name}' is corrupted or not a valid/playable video format.`));
    };

    video.src = objectUrl;
  });
}

/**
 * Validates a user-selected file for S3 upload.
 */
export async function validateMediaFile(file: File): Promise<ValidationResult> {
  if (!file || file.size === 0) {
    return {
      valid: false,
      mediaType: "document",
      error: `File '${file?.name || "unknown"}' is empty (0 bytes).`,
    };
  }

  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();

  const isImage =
    ALLOWED_IMAGE_TYPES.includes(mime) ||
    /\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(name);

  const isVideo =
    ALLOWED_VIDEO_TYPES.includes(mime) ||
    /\.(mp4|webm|mov|avi|3gp|mkv)$/i.test(name);

  if (isImage) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        mediaType: "photo",
        error: `Image '${file.name}' (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds max size limit of 20 MB.`,
      };
    }

    // Skip SVG DOM parsing (SVG isn't bitmap)
    if (mime === "image/svg+xml" || name.endsWith(".svg")) {
      return { valid: true, mediaType: "photo" };
    }

    try {
      const dims = await validateImageInBrowser(file);
      return { valid: true, mediaType: "photo", width: dims.width, height: dims.height };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `File '${file.name}' failed image validation.`;
      return { valid: false, mediaType: "photo", error: msg };
    }
  }

  if (isVideo) {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        mediaType: "video",
        error: `Video '${file.name}' (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds max size limit of 500 MB.`,
      };
    }

    try {
      const meta = await validateVideoInBrowser(file);
      return {
        valid: true,
        mediaType: "video",
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `File '${file.name}' failed video validation.`;
      return { valid: false, mediaType: "video", error: msg };
    }
  }

  return {
    valid: false,
    mediaType: "document",
    error: `Unsupported file type '${file.name}'. Only JPG, PNG, WebP, GIF, MP4, WebM, MOV, and AVI formats are supported.`,
  };
}
