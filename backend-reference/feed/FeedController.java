package com.manacommunity.controller;

import com.manacommunity.dto.DashboardDto;
import com.manacommunity.dto.FeedItemDto;
import com.manacommunity.service.FeedService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class FeedController {

    private final FeedService feedService;

    /**
     * GET /api/dashboard
     * Returns cached aggregate community statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDto> getDashboard(
        @RequestHeader(value = "X-Community-Id", defaultValue = "1") Long communityId
    ) {
        DashboardDto stats = feedService.getDashboardStats(communityId);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/feed?cursor=...&limit=20
     * Returns keyset cursor-paginated feed stream
     */
    @GetMapping("/feed")
    public ResponseEntity<FeedItemDto.FeedResponse> getFeed(
        @RequestHeader(value = "X-Community-Id", defaultValue = "1") Long communityId,
        @RequestParam(value = "cursor", required = false) String cursor,
        @RequestParam(value = "limit", defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        FeedItemDto.FeedResponse response = feedService.getFeed(communityId, cursor, limit);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", ex.getMessage()));
    }
}
