package com.manacommunity.sports.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class SportsCricHeroesDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SportsCricHeroesLinkRequest {
        private Long playerId;
        private String cricHeroesUrl;
        private String formatScope; // "OVERALL" | "TENNIS" | "LEATHER"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SportsCricHeroesLinkResponse {
        private boolean success;
        private String message;
        private SportsCricHeroesProfileDto profile;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SportsCricHeroesProfileDto {
        private String cricheroesId;
        private String shareUrl;
        private Instant verifiedAt;
        private String formatScope;
        private SportsPlayerBio bio;
        private SportsBattingStats batting;
        private SportsBowlingStats bowling;
        private SportsFieldingStats fielding;
        private List<SportsRecentInning> recentForm;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsPlayerBio {
        private String fullName;
        private String avatarUrl;
        private String battingStyle;
        private String bowlingStyle;
        private String primaryRole;
        private String city;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsBattingStats {
        private int matches;
        private int innings;
        private int runs;
        private String highestScore;
        private double average;
        private double strikeRate;
        private int fifties;
        private int hundreds;
        private int fours;
        private int sixes;
        private Double boundaryPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsBowlingStats {
        private int matches;
        private int innings;
        private double overs;
        private int wickets;
        private double economy;
        private double average;
        private double strikeRate;
        private String bestFigures;
        private int maidens;
        private int threeWickets;
        private int fiveWickets;
        private Double dotBallPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsFieldingStats {
        private int catches;
        private int stumpings;
        private int runOuts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsRecentInning {
        private String matchDate;
        private String opponent;
        private Integer runs;
        private Integer balls;
        private Integer wickets;
        private Integer runsConceded;
        private Double overs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsPlayerRatingDto {
        private double overall;
        private String tier; // "LEGEND" | "ICON" | "PLATINUM" | "GOLD" | "SILVER" | "BRONZE"
        private int stars;
        private List<String> badges;
        private long suggestedBasePrice;
        private Map<String, Double> breakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsPlayerComparisonDto {
        private SportsCricHeroesProfileDto playerA;
        private SportsCricHeroesProfileDto playerB;
        private SportsPlayerRatingDto ratingA;
        private SportsPlayerRatingDto ratingB;
        private Map<String, String> advantages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SportsTeamCompositionDto {
        private Long teamId;
        private String teamName;
        private int totalPlayers;
        private int batsmenCount;
        private int bowlersCount;
        private int allRoundersCount;
        private int wicketKeepersCount;
        private double averageBattingStrikeRate;
        private double averageBowlingEconomy;
        private int totalSquadRuns;
        private int totalSquadWickets;
        private double balanceScore;
    }
}
