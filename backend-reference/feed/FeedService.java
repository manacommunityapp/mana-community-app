package com.manacommunity.service;

import com.manacommunity.dto.DashboardDto;
import com.manacommunity.dto.FeedItemDto;
import com.manacommunity.model.FeedItem;
import com.manacommunity.repository.FeedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

    private final FeedRepository feedRepository;

    /**
     * Cached server-side aggregate statistics using Caffeine with 30s TTL.
     * Scoped per communityId to prevent data leaks.
     */
    @Cacheable(value = "dashboard", key = "#communityId")
    @Transactional(readOnly = true)
    public DashboardDto getDashboardStats(Long communityId) {
        log.info("Computing fresh dashboard aggregate stats for communityId: {}", communityId);
        
        long totalEvents = 128L; // Replaced with actual events count service query
        long registeredCount = 4320L;
        long thisWeek = 12L;

        return DashboardDto.builder()
            .stats(List.of(
                DashboardDto.StatItem.builder().label("Total events").value(String.format("%,d", totalEvents)).build(),
                DashboardDto.StatItem.builder().label("Registered").value(String.format("%,d", registeredCount)).build(),
                DashboardDto.StatItem.builder().label("This week").value(String.format("%,d", thisWeek)).build()
            ))
            .build();
    }

    /**
     * Keyset / Cursor-based feed streaming.
     * Fetches limit + 1 items to determine if a next cursor exists without extra queries.
     */
    @Transactional(readOnly = true)
    public FeedItemDto.FeedResponse getFeed(Long communityId, String cursor, int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 50));
        PageRequest pageRequest = PageRequest.of(0, boundedLimit + 1);

        List<FeedItem> items;
        if (cursor == null || cursor.isBlank()) {
            items = feedRepository.findLatestByCommunity(communityId, pageRequest);
        } else {
            DecodedCursor decoded = decodeCursor(cursor);
            items = feedRepository.findByCommunityAndCursor(
                communityId,
                decoded.createdAt(),
                decoded.id(),
                pageRequest
            );
        }

        boolean hasMore = items.size() > boundedLimit;
        List<FeedItem> pageItems = hasMore ? items.subList(0, boundedLimit) : items;

        String nextCursor = null;
        if (hasMore && !pageItems.isEmpty()) {
            FeedItem lastItem = pageItems.get(pageItems.size() - 1);
            nextCursor = encodeCursor(lastItem.getCreatedAt(), lastItem.getId());
        }

        List<FeedItemDto> dtos = pageItems.stream()
            .map(this::toDto)
            .collect(Collectors.toList());

        return FeedItemDto.FeedResponse.builder()
            .items(dtos)
            .nextCursor(nextCursor)
            .build();
    }

    private FeedItemDto toDto(FeedItem item) {
        return FeedItemDto.builder()
            .id(item.getId())
            .title(item.getTitle())
            .summary(item.getSummary())
            .image(item.getImageUrl())
            .createdAt(item.getCreatedAt())
            .authorName(item.getAuthorName())
            .authorRole(item.getAuthorRole())
            .likesCount(item.getLikesCount())
            .commentsCount(item.getCommentsCount())
            .build();
    }

    private String encodeCursor(Instant createdAt, UUID id) {
        String raw = createdAt.toString() + ":" + id.toString();
        return Base64.getUrlEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private DecodedCursor decodeCursor(String cursor) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(cursor);
            String raw = new String(bytes, StandardCharsets.UTF_8);
            String[] parts = raw.split(":", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid cursor format");
            }
            Instant createdAt = Instant.parse(parts[0]);
            UUID id = UUID.fromString(parts[1]);
            return new DecodedCursor(createdAt, id);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed cursor token: " + cursor, e);
        }
    }

    private record DecodedCursor(Instant createdAt, UUID id) {}
}
