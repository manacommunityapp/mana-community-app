package com.manacommunity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedItemDto {
    private UUID id;
    private String title;
    private String summary;
    private String image;
    private Instant createdAt;
    private String authorName;
    private String authorAvatar;
    private String authorRole;
    private int likesCount;
    private int commentsCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedResponse {
        private List<FeedItemDto> items;
        private String nextCursor;
    }
}
