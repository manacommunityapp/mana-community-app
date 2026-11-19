/**
 * Utilities for Team Image / Logo processing, compression, validation, and caching.
 */

export const MAX_TEAM_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export interface TeamImageMetadata {
  imageUrl?: string;
  emoji?: string;
  colorHex?: string;
}

/**
 * Validates an image file before upload.
 */
export function validateTeamImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  if (file.size > MAX_TEAM_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit.`,
    };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|svg)$/i)) {
    return {
      valid: false,
      error: "Please select a valid image file (PNG, JPG, WEBP, or SVG).",
    };
  }

  return { valid: true };
}

/**
 * Compresses and center-crops an image file to a 512x512 square data URL.
 * SVG files are returned as raw Data URLs without rasterization to preserve crisp vector rendering.
 */
export async function compressAndCropTeamImage(
  file: File,
  targetSize: number = 512,
  quality: number = 0.85
): Promise<string> {
  // SVG doesn't need raster canvas compression
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read SVG file"));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          // Center crop calculation (cover fit)
          const sw = img.naturalWidth || img.width;
          const sh = img.naturalHeight || img.height;
          const minDim = Math.min(sw, sh);
          const sx = (sw - minDim) / 2;
          const sy = (sh - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL("image/webp", quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to original data URL if canvas fails
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieves a cached team logo URL from localStorage by team name or id.
 */
export function getCachedTeamLogo(teamKey?: string | number | null): string | null {
  if (!teamKey || typeof localStorage === "undefined") return null;
  try {
    const cleanKey = String(teamKey).trim().toLowerCase();
    return (
      localStorage.getItem(`mc-team-logo-${cleanKey}`) ||
      localStorage.getItem(`mc-team-${cleanKey}-logo`) ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Caches a team logo URL to localStorage.
 */
export function setCachedTeamLogo(teamKey?: string | number | null, logoUrl?: string | null): void {
  if (!teamKey || !logoUrl || typeof localStorage === "undefined") return;
  try {
    const cleanKey = String(teamKey).trim().toLowerCase();
    localStorage.setItem(`mc-team-logo-${cleanKey}`, logoUrl);
  } catch {
    // Ignore storage quota errors
  }
}
