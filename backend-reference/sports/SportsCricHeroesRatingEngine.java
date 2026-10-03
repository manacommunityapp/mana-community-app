package com.manacommunity.sports.service;

import com.manacommunity.sports.dto.SportsCricHeroesDtos.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SportsCricHeroesRatingEngine {

    public SportsPlayerRatingDto computeRating(SportsCricHeroesProfileDto profile) {
        if (profile == null) {
            return SportsPlayerRatingDto.builder()
                    .overall(5.0)
                    .tier("BRONZE")
                    .stars(1)
                    .badges(Collections.emptyList())
                    .suggestedBasePrice(1000)
                    .breakdown(Collections.emptyMap())
                    .build();
        }

        SportsBattingStats bat = profile.getBatting() != null ? profile.getBatting() : new SportsBattingStats();
        SportsBowlingStats bowl = profile.getBowling() != null ? profile.getBowling() : new SportsBowlingStats();
        SportsFieldingStats field = profile.getFielding() != null ? profile.getFielding() : new SportsFieldingStats();

        // 1. Batting Score (0 - 10)
        double batAvgScore = Math.min((bat.getAverage() / 45.0) * 10.0, 10.0);
        double strikeRateScore = Math.min((bat.getStrikeRate() / 160.0) * 10.0, 10.0);
        double battingScore = (batAvgScore * 0.6) + (strikeRateScore * 0.4);

        // 2. Bowling Score (0 - 10)
        double wicketsScore = Math.min((bowl.getWickets() / 40.0) * 10.0, 10.0);
        double economyScore = bowl.getEconomy() > 0 ? Math.max(0, (1.0 - (bowl.getEconomy() - 4.0) / 8.0)) * 10.0 : 5.0;
        double bowlingScore = (wicketsScore * 0.6) + (economyScore * 0.4);

        // 3. Fielding Score (0 - 10)
        double totalDismissals = field.getCatches() + field.getStumpings() + field.getRunOuts();
        double fieldingScore = Math.min((totalDismissals / 20.0) * 10.0, 10.0);

        // 4. Experience Score (0 - 10)
        double experienceScore = Math.min((bat.getMatches() / 60.0) * 10.0, 10.0);

        // 5. Overall Weighted Calculation based on Role
        String role = profile.getBio() != null && profile.getBio().getPrimaryRole() != null
                ? profile.getBio().getPrimaryRole().toLowerCase()
                : "all-rounder";

        double overall;
        if (role.contains("bowler")) {
            overall = (bowlingScore * 0.55) + (battingScore * 0.20) + (fieldingScore * 0.15) + (experienceScore * 0.10);
        } else if (role.contains("bat") || role.contains("keeper")) {
            overall = (battingScore * 0.55) + (bowlingScore * 0.15) + (fieldingScore * 0.20) + (experienceScore * 0.10);
        } else {
            // All-rounder
            overall = (battingScore * 0.40) + (bowlingScore * 0.40) + (fieldingScore * 0.10) + (experienceScore * 0.10);
        }
        overall = Math.round(overall * 10.0) / 10.0;

        // 6. Tier & Stars
        String tier;
        int stars;
        if (overall >= 8.5) {
            tier = "LEGEND";
            stars = 5;
        } else if (overall >= 7.5) {
            tier = "ICON";
            stars = 4;
        } else if (overall >= 6.5) {
            tier = "PLATINUM";
            stars = 3;
        } else if (overall >= 5.0) {
            tier = "GOLD";
            stars = 2;
        } else if (overall >= 3.5) {
            tier = "SILVER";
            stars = 1;
        } else {
            tier = "BRONZE";
            stars = 1;
        }

        // 7. Badges Awarded
        List<String> badges = new ArrayList<>();
        if (bat.getStrikeRate() >= 140.0 && bat.getRuns() >= 100) badges.add("POWER_HITTER");
        if (bowl.getWickets() >= 25 && bowl.getEconomy() <= 7.5) badges.add("STRIKE_BOWLER");
        if (bat.getRuns() >= 200 && bowl.getWickets() >= 15) badges.add("ALL_ROUNDER");
        if (bowl.getEconomy() > 0 && bowl.getEconomy() <= 6.5 && bowl.getMatches() >= 5) badges.add("ECONOMY_SPECIALIST");
        if ((field.getCatches() + field.getStumpings()) >= 15) badges.add("SAFE_HANDS");
        if (bat.getMatches() >= 40) badges.add("VETERAN");

        // 8. Suggested Base Price (in ₹ INR)
        long suggestedBasePrice;
        if (overall >= 8.5) suggestedBasePrice = 10000;
        else if (overall >= 7.5) suggestedBasePrice = 6000;
        else if (overall >= 6.5) suggestedBasePrice = 4000;
        else if (overall >= 5.0) suggestedBasePrice = 2500;
        else if (overall >= 3.5) suggestedBasePrice = 1500;
        else suggestedBasePrice = 1000;

        Map<String, Double> breakdown = new LinkedHashMap<>();
        breakdown.put("batting", Math.round(battingScore * 10.0) / 10.0);
        breakdown.put("bowling", Math.round(bowlingScore * 10.0) / 10.0);
        breakdown.put("fielding", Math.round(fieldingScore * 10.0) / 10.0);
        breakdown.put("experience", Math.round(experienceScore * 10.0) / 10.0);

        return SportsPlayerRatingDto.builder()
                .overall(overall)
                .tier(tier)
                .stars(stars)
                .badges(badges)
                .suggestedBasePrice(suggestedBasePrice)
                .breakdown(breakdown)
                .build();
    }
}
