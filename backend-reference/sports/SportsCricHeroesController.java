package com.manacommunity.sports.controller;

import com.manacommunity.sports.dto.SportsCricHeroesDtos.*;
import com.manacommunity.sports.service.SportsCricHeroesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cricheroes")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}", allowCredentials = "true")
public class SportsCricHeroesController {

    private final SportsCricHeroesService sportsCricHeroesService;

    /**
     * POST /api/cricheroes/link
     * Link a CricHeroes profile URL to an auction player
     */
    @PostMapping("/link")
    public ResponseEntity<SportsCricHeroesLinkResponse> linkProfile(@RequestBody SportsCricHeroesLinkRequest request) {
        return ResponseEntity.ok(sportsCricHeroesService.linkPlayer(request));
    }

    /**
     * DELETE /api/cricheroes/link/{playerId}
     * Unlink CricHeroes profile from player
     */
    @DeleteMapping("/link/{playerId}")
    public ResponseEntity<Void> unlinkProfile(@PathVariable Long playerId) {
        sportsCricHeroesService.unlinkPlayer(playerId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/cricheroes/profile/{playerId}
     * Fetch cached CricHeroes verified profile
     */
    @GetMapping("/profile/{playerId}")
    public ResponseEntity<SportsCricHeroesProfileDto> getProfile(@PathVariable Long playerId) {
        SportsCricHeroesProfileDto profile = sportsCricHeroesService.getProfileByPlayerId(playerId);
        return profile != null ? ResponseEntity.ok(profile) : ResponseEntity.notFound().build();
    }

    /**
     * GET /api/cricheroes/profile/{playerId}/refresh
     * Force fresh re-scrape from CricHeroes
     */
    @GetMapping("/profile/{playerId}/refresh")
    public ResponseEntity<SportsCricHeroesProfileDto> refreshProfile(@PathVariable Long playerId) {
        return ResponseEntity.ok(sportsCricHeroesService.refreshPlayerProfile(playerId));
    }

    /**
     * GET /api/cricheroes/preview?url=...
     * Preview stats before linking
     */
    @GetMapping("/preview")
    public ResponseEntity<SportsCricHeroesProfileDto> previewProfile(@RequestParam String url) {
        return ResponseEntity.ok(sportsCricHeroesService.previewProfileUrl(url));
    }

    /**
     * GET /api/cricheroes/rating/{playerId}
     * Get 6-axis ratings, Tier (Legend/Icon/etc.), and Suggested Base Price
     */
    @GetMapping("/rating/{playerId}")
    public ResponseEntity<SportsPlayerRatingDto> getPlayerRating(@PathVariable Long playerId) {
        return ResponseEntity.ok(sportsCricHeroesService.computePlayerRating(playerId));
    }

    /**
     * GET /api/cricheroes/compare?playerA={id}&playerB={id}
     * Head-to-head comparison
     */
    @GetMapping("/compare")
    public ResponseEntity<SportsPlayerComparisonDto> comparePlayers(
            @RequestParam Long playerA,
            @RequestParam Long playerB
    ) {
        return ResponseEntity.ok(sportsCricHeroesService.comparePlayers(playerA, playerB));
    }

    /**
     * GET /api/cricheroes/profiles/{configId}
     * Bulk-fetch all linked profiles for an auction config
     */
    @GetMapping("/profiles/{configId}")
    public ResponseEntity<Map<Long, SportsCricHeroesProfileDto>> getLinkedProfiles(
            @PathVariable Long configId,
            @RequestParam(required = false) List<Long> playerIds
    ) {
        return ResponseEntity.ok(sportsCricHeroesService.getAllLinkedProfilesForAuction(playerIds));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
