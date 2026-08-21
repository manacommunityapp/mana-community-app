import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadVideoCoverBlob, captureVideoFrame, generateVideoThumbnailCandidates } from "./videoThumbnailHelper";
import { mediaService } from "../services/files/mediaService";

describe("videoThumbnailHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadVideoCoverBlob", () => {
    it("should convert a blob to a file and upload it via mediaService", async () => {
      const mockMediaResponse = {
        id: "media-uuid-123",
        url: "https://s3.amazonaws.com/bucket/community/video_cover/sample-cover.jpg",
        thumbnailUrl: "https://s3.amazonaws.com/bucket/community/video_cover/sample-cover-thumb.jpg",
      } as any;

      vi.spyOn(mediaService, "upload").mockResolvedValue(mockMediaResponse);

      const dummyBlob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
      const result = await uploadVideoCoverBlob(dummyBlob, "my_video.mp4", 101, "draft-1");

      expect(mediaService.upload).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({
          module: "COMMUNITY",
          moduleId: "draft-1",
          communityId: 101,
          subContext: "video_cover",
        })
      );

      expect(result).toBe("https://s3.amazonaws.com/bucket/community/video_cover/sample-cover.jpg");
    });

    it("should throw an error if the server returns no URL", async () => {
      vi.spyOn(mediaService, "upload").mockResolvedValue({} as any);

      const dummyBlob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
      await expect(
        uploadVideoCoverBlob(dummyBlob, "video.mp4", 101, "draft-1")
      ).rejects.toThrow("Server returned no URL for uploaded cover image.");
    });
  });

  describe("functions export presence", () => {
    it("should export captureVideoFrame and generateVideoThumbnailCandidates", () => {
      expect(typeof captureVideoFrame).toBe("function");
      expect(typeof generateVideoThumbnailCandidates).toBe("function");
    });
  });
});
