package com.manacommunity.sports.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manacommunity.sports.dto.SportsCricHeroesDtos.*;
import com.manacommunity.sports.entity.SportsCricHeroesProfile;
import com.manacommunity.sports.repository.SportsCricHeroesProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SportsCricHeroesService {

    private final SportsCricHeroesProfileRepository profileRepository;
    private final SportsCricHeroesScraperService scraperService;
    private final SportsCricHeroesRatingEngine ratingEngine;
    private final ObjectMapper objectMapper;

    /**
     * Link a player to their CricHeroes profile
     */
    @Transactional
    public SportsCricHeroesLinkResponse linkPlayer(SportsCricHeroesLinkRequest request) {
        try {
            SportsCricHeroesProfileDto profileDto = scraperService.fetchProfileFromWeb(
                    request.getCricHeroesUrl(),
                    request.getFormatScope()
            );

            SportsPlayerRatingDto ratingDto = ratingEngine.computeRating(profileDto);

            SportsCricHeroesProfile entity = profileRepository.findByPlayerId(request.getPlayerId())
                    .orElseGet(() -> SportsCricHeroesProfile.builder()
                            .playerId(request.getPlayerId())
                            .build());

            entity.setCricheroesId(profileDto.getCricheroesId());
            entity.setShareUrl(profileDto.getShareUrl());
            entity.setFormatScope(profileDto.getFormatScope());
            entity.setBioJson(objectMapper.convertValue(profileDto.getBio(), Map.class));
            entity.setBattingJson(objectMapper.convertValue(profileDto.getBatting(), Map.class));
            entity.setBowlingJson(objectMapper.convertValue(profileDto.getBowling(), Map.class));
            entity.setFieldingJson(objectMapper.convertValue(profileDto.getFielding(), Map.class));
            entity.setRecentFormJson(profileDto.getRecentForm());
            entity.setRatingJson(objectMapper.convertValue(ratingDto, Map.class));
            entity.setVerifiedAt(Instant.now());
            entity.setLastSyncedAt(Instant.now());

            profileRepository.save(entity);

            return SportsCricHeroesLinkResponse.builder()
                    .success(true)
                    .message("CricHeroes profile successfully linked and verified")
                    .profile(profileDto)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to link CricHeroes profile for player {}: {}", request.getPlayerId(), ex.getMessage(), ex);
            throw new RuntimeException("Could not verify CricHeroes profile: " + ex.getMessage());
        }
    }

    /**
     * Unlink a player's CricHeroes profile
     */
    @Transactional
    public void unlinkPlayer(Long playerId) {
        profileRepository.deleteByPlayerId(playerId);
    }

    /**
     * Get cached CricHeroes profile for a player
     */
    @Transactional(readOnly = true)
    public SportsCricHeroesProfileDto getProfileByPlayerId(Long playerId) {
        return profileRepository.findByPlayerId(playerId)
                .map(this::mapToDto)
                .orElse(null);
    }

    /**
     * Refresh CricHeroes profile by re-scraping the web page
     */
    @Transactional
    public SportsCricHeroesProfileDto refreshPlayerProfile(Long playerId) {
        SportsCricHeroesProfile entity = profileRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player has no linked CricHeroes profile"));

        try {
            SportsCricHeroesProfileDto updatedDto = scraperService.fetchProfileFromWeb(entity.getShareUrl(), entity.getFormatScope());
            SportsPlayerRatingDto ratingDto = ratingEngine.computeRating(updatedDto);

            entity.setBioJson(objectMapper.convertValue(updatedDto.getBio(), Map.class));
            entity.setBattingJson(objectMapper.convertValue(updatedDto.getBatting(), Map.class));
            entity.setBowlingJson(objectMapper.convertValue(updatedDto.getBowling(), Map.class));
            entity.setFieldingJson(objectMapper.convertValue(updatedDto.getFielding(), Map.class));
            entity.setRatingJson(objectMapper.convertValue(ratingDto, Map.class));
            entity.setLastSyncedAt(Instant.now());
            entity.setVerifiedAt(Instant.now());

            profileRepository.save(entity);
            return updatedDto;
        } catch (IOException e) {
            throw new RuntimeException("Failed to refresh stats from CricHeroes: " + e.getMessage());
        }
    }

    /**
     * Preview a CricHeroes profile without saving it
     */
    public SportsCricHeroesProfileDto previewProfileUrl(String url) {
        try {
            return scraperService.fetchProfileFromWeb(url, "OVERALL");
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or unreachable CricHeroes URL: " + e.getMessage());
        }
    }

    /**
     * Compute player rating & tier breakdown
     */
    @Transactional(readOnly = true)
    public SportsPlayerRatingDto computePlayerRating(Long playerId) {
        SportsCricHeroesProfileDto profile = getProfileByPlayerId(playerId);
        return ratingEngine.computeRating(profile);
    }

    /**
     * Get all linked profiles for an auction configuration
     */
    @Transactional(readOnly = true)
    public Map<Long, SportsCricHeroesProfileDto> getAllLinkedProfilesForAuction(List<Long> playerIds) {
        if (playerIds == null || playerIds.isEmpty()) return Collections.emptyMap();
        List<SportsCricHeroesProfile> list = profileRepository.findAllByPlayerIds(playerIds);
        return list.stream()
                .collect(Collectors.toMap(
                        SportsCricHeroesProfile::getPlayerId,
                        this::mapToDto
                ));
    }

    /**
     * Compare two players head-to-head
     */
    @Transactional(readOnly = true)
    public SportsPlayerComparisonDto comparePlayers(Long playerAId, Long playerBId) {
        SportsCricHeroesProfileDto profileA = getProfileByPlayerId(playerAId);
        SportsCricHeroesProfileDto profileB = getProfileByPlayerId(playerBId);
        SportsPlayerRatingDto ratingA = ratingEngine.computeRating(profileA);
        SportsPlayerRatingDto ratingB = ratingEngine.computeRating(profileB);

        Map<String, String> advantages = new HashMap<>();
        if (profileA != null && profileB != null) {
            if (profileA.getBatting().getStrikeRate() > profileB.getBatting().getStrikeRate()) advantages.put("strikeRate", "playerA");
            else if (profileB.getBatting().getStrikeRate() > profileA.getBatting().getStrikeRate()) advantages.put("strikeRate", "playerB");

            if (profileA.getBowling().getEconomy() > 0 && (profileB.getBowling().getEconomy() == 0 || profileA.getBowling().getEconomy() < profileB.getBowling().getEconomy())) {
                advantages.put("economy", "playerA");
            } else if (profileB.getBowling().getEconomy() > 0) {
                advantages.put("economy", "playerB");
            }
        }

        return SportsPlayerComparisonDto.builder()
                .playerA(profileA)
                .playerB(profileB)
                .ratingA(ratingA)
                .ratingB(ratingB)
                .advantages(advantages)
                .build();
    }

    /**
     * Helper to map Entity to DTO
     */
    private SportsCricHeroesProfileDto mapToDto(SportsCricHeroesProfile entity) {
        return SportsCricHeroesProfileDto.builder()
                .cricheroesId(entity.getCricheroesId())
                .shareUrl(entity.getShareUrl())
                .verifiedAt(entity.getVerifiedAt())
                .formatScope(entity.getFormatScope())
                .bio(objectMapper.convertValue(entity.getBioJson(), SportsPlayerBio.class))
                .batting(objectMapper.convertValue(entity.getBattingJson(), SportsBattingStats.class))
                .bowling(objectMapper.convertValue(entity.getBowlingJson(), SportsBowlingStats.class))
                .fielding(objectMapper.convertValue(entity.getFieldingJson(), SportsFieldingStats.class))
                .recentForm(Collections.emptyList())
                .build();
    }
}
