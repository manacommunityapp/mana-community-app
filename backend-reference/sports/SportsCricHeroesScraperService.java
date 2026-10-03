package com.manacommunity.sports.service;

import com.manacommunity.sports.dto.SportsCricHeroesDtos.*;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class SportsCricHeroesScraperService {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    private static final Pattern PLAYER_ID_PATTERN = Pattern.compile("/player-profile/(\\d+)|/player/(\\d+)");

    /**
     * Resolves short share URLs like https://chshare.link/player/... to the canonical URL
     */
    public String resolveCanonicalUrl(String inputUrl) throws IOException {
        if (inputUrl == null || inputUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("CricHeroes URL cannot be empty");
        }
        Connection.Response response = Jsoup.connect(inputUrl.trim())
                .userAgent(USER_AGENT)
                .followRedirects(true)
                .timeout(12000)
                .execute();
        return response.url().toExternalForm();
    }

    /**
     * Extracts numeric CricHeroes player ID
     */
    public String extractPlayerId(String url) {
        if (url == null) return null;
        Matcher matcher = PLAYER_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
        }
        return "CH-" + Math.abs(url.hashCode());
    }

    /**
     * Scrapes public player profile from CricHeroes web page
     */
    public SportsCricHeroesProfileDto fetchProfileFromWeb(String rawUrl, String formatScope) throws IOException {
        String canonicalUrl = resolveCanonicalUrl(rawUrl);
        String chId = extractPlayerId(canonicalUrl);

        Document doc = Jsoup.connect(canonicalUrl)
                .userAgent(USER_AGENT)
                .timeout(15000)
                .get();

        String name = doc.select("h1.player-name, .profile-name, .user-name").text();
        if (name.isEmpty()) {
            name = doc.title().replaceAll("(?i)- CricHeroes.*", "").replaceAll("(?i)Player Profile.*", "").trim();
        }
        if (name.isEmpty()) name = "CricHeroes Player";

        String role = doc.select(".player-role, .playing-role").text();
        if (role.isEmpty()) role = "All-Rounder";

        String avatar = doc.select(".player-image img, .profile-avatar img, img[alt*='profile']").attr("src");
        String batStyle = doc.select(":containsOwn(Batting Style) + *").text();
        String bowlStyle = doc.select(":containsOwn(Bowling Style) + *").text();

        SportsBattingStats batting = parseBatting(doc);
        SportsBowlingStats bowling = parseBowling(doc);
        SportsFieldingStats fielding = parseFielding(doc);

        return SportsCricHeroesProfileDto.builder()
                .cricheroesId(chId != null ? chId : "CH-" + Math.abs(canonicalUrl.hashCode()))
                .shareUrl(canonicalUrl)
                .verifiedAt(Instant.now())
                .formatScope(formatScope != null ? formatScope : "OVERALL")
                .bio(SportsPlayerBio.builder()
                        .fullName(name)
                        .avatarUrl(avatar.isEmpty() ? null : avatar)
                        .primaryRole(role)
                        .battingStyle(batStyle.isEmpty() ? "Right Hand Bat" : batStyle)
                        .bowlingStyle(bowlStyle.isEmpty() ? "Right-arm Medium" : bowlStyle)
                        .build())
                .batting(batting)
                .bowling(bowling)
                .fielding(fielding)
                .recentForm(new ArrayList<>())
                .build();
    }

    private SportsBattingStats parseBatting(Document doc) {
        int innings = extractInt(doc, "Innings", 0);
        int runs = extractInt(doc, "Runs", 0);
        int matches = extractInt(doc, "Matches", Math.max(innings, 1));
        double avg = extractDouble(doc, "Average", innings > 0 ? (double) runs / innings : 0.0);
        double sr = extractDouble(doc, "Strike Rate", 100.0);

        String hs = doc.select(":containsOwn(Highest Score) + *, :containsOwn(HS) + *").text();
        if (hs.isEmpty()) hs = "-";

        return SportsBattingStats.builder()
                .matches(matches)
                .innings(innings)
                .runs(runs)
                .highestScore(hs)
                .average(Math.round(avg * 100.0) / 100.0)
                .strikeRate(Math.round(sr * 100.0) / 100.0)
                .fifties(extractInt(doc, "50s", 0))
                .hundreds(extractInt(doc, "100s", 0))
                .fours(extractInt(doc, "4s", 0))
                .sixes(extractInt(doc, "6s", 0))
                .boundaryPercentage(runs > 0 ? 0.0 : null)
                .build();
    }

    private SportsBowlingStats parseBowling(Document doc) {
        int matches = extractInt(doc, "Matches", 0);
        int wickets = extractInt(doc, "Wickets", 0);
        double econ = extractDouble(doc, "Economy", 8.0);
        double avg = extractDouble(doc, "Bowling Avg", 20.0);
        double overs = extractDouble(doc, "Overs", 0.0);

        String best = doc.select(":containsOwn(Best Bowling) + *, :containsOwn(BBI) + *").text();
        if (best.isEmpty()) best = "-";

        return SportsBowlingStats.builder()
                .matches(matches)
                .innings(extractInt(doc, "Innings", matches))
                .overs(overs)
                .wickets(wickets)
                .economy(Math.round(econ * 100.0) / 100.0)
                .average(Math.round(avg * 100.0) / 100.0)
                .strikeRate(wickets > 0 ? Math.round((overs * 6.0 / wickets) * 100.0) / 100.0 : 0.0)
                .bestFigures(best)
                .maidens(extractInt(doc, "Maidens", 0))
                .threeWickets(extractInt(doc, "3W", 0))
                .fiveWickets(extractInt(doc, "5W", 0))
                .build();
    }

    private SportsFieldingStats parseFielding(Document doc) {
        return SportsFieldingStats.builder()
                .catches(extractInt(doc, "Catches", 0))
                .stumpings(extractInt(doc, "Stumpings", 0))
                .runOuts(extractInt(doc, "Run Outs", 0))
                .build();
    }

    private int extractInt(Document doc, String label, int def) {
        try {
            Element el = doc.select(":containsOwn(" + label + ") + *").first();
            if (el != null) return Integer.parseInt(el.text().replaceAll("[^0-9]", ""));
        } catch (Exception ignored) {}
        return def;
    }

    private double extractDouble(Document doc, String label, double def) {
        try {
            Element el = doc.select(":containsOwn(" + label + ") + *").first();
            if (el != null) return Double.parseDouble(el.text().replaceAll("[^0-9.]", ""));
        } catch (Exception ignored) {}
        return def;
    }
}
