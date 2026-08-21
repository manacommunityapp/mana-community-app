import { mediaService } from "../services/files/mediaService";

export interface VideoThumbnailCandidate {
  timeSeconds: number;
  label: string;
  blob: Blob;
  dataUrl: string;
}

/**
 * Captures a single frame from a video File or URL at a given seek timestamp.
 */
export async function captureVideoFrame(
  source: File | string,
  seekTimeSeconds = 1
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const objectUrl = typeof source === "string" ? source : URL.createObjectURL(source);
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (typeof source !== "string") {
        URL.revokeObjectURL(objectUrl);
      }
      video.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Video frame capture timed out after 10 seconds."));
    }, 10000);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      let target = seekTimeSeconds;
      if (duration > 0) {
        target = Math.min(Math.max(0.1, target), Math.max(0.1, duration - 0.1));
      }
      video.currentTime = target;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Unable to create canvas 2D rendering context."));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve({ blob, dataUrl, width, height });
            } else {
              reject(new Error("Failed to create blob from video frame canvas."));
            }
          },
          "image/jpeg",
          0.85
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Failed to load video element for frame extraction."));
    };

    video.src = objectUrl;
  });
}

/**
 * Generates multiple snapshot frame candidates across the video duration for user selection.
 */
export async function generateVideoThumbnailCandidates(
  source: File | string,
  count = 4
): Promise<VideoThumbnailCandidate[]> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  const objectUrl = typeof source === "string" ? source : URL.createObjectURL(source);

  return new Promise((resolve) => {
    const cleanup = () => {
      if (typeof source !== "string") URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    const fallbackCandidate = async (): Promise<VideoThumbnailCandidate[]> => {
      try {
        const frame = await captureVideoFrame(source, 0.5);
        return [{ timeSeconds: 0.5, label: "00:00", blob: frame.blob, dataUrl: frame.dataUrl }];
      } catch {
        return [];
      }
    };

    video.onloadedmetadata = async () => {
      const duration = video.duration || 10;
      cleanup();

      const timestamps: number[] = [];
      const step = duration / (count + 1);
      for (let i = 1; i <= count; i++) {
        timestamps.push(Math.round(step * i * 10) / 10);
      }

      const results: VideoThumbnailCandidate[] = [];
      for (const t of timestamps) {
        try {
          const frame = await captureVideoFrame(source, t);
          const mins = Math.floor(t / 60);
          const secs = Math.floor(t % 60);
          const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
          results.push({
            timeSeconds: t,
            label,
            blob: frame.blob,
            dataUrl: frame.dataUrl,
          });
        } catch {
          // ignore single frame failure
        }
      }

      if (results.length === 0) {
        resolve(await fallbackCandidate());
      } else {
        resolve(results);
      }
    };

    video.onerror = async () => {
      cleanup();
      resolve(await fallbackCandidate());
    };

    video.src = objectUrl;
  });
}

/**
 * Uploads a video cover frame blob to S3 via mediaService and returns the public thumbnail URL.
 */
export async function uploadVideoCoverBlob(
  blob: Blob,
  fileName: string,
  communityId: number,
  draftId: string
): Promise<string> {
  const safeName = fileName.replace(/\.[^/.]+$/, "") + "-cover.jpg";
  const file = new File([blob], safeName, { type: "image/jpeg" });
  const media = await mediaService.upload(file, {
    module: "COMMUNITY",
    moduleId: draftId,
    communityId,
    subContext: "video_cover",
    caption: `Cover for ${fileName}`,
    altText: `Video cover photo: ${fileName}`,
  });

  const url = media.url || media.mediumUrl || media.compressedUrl || media.thumbnailUrl;
  if (!url) throw new Error("Server returned no URL for uploaded cover image.");
  return url;
}
