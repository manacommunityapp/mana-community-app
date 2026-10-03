package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "sports_cricheroes_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsCricHeroesProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", referencedColumnName = "id", unique = true, nullable = false)
    private SportsAuctionPlayer player;

    @Column(name = "cricheroes_id", nullable = false, length = 100)
    private String cricheroesId;

    @Column(name = "share_url", nullable = false, length = 500)
    private String shareUrl;

    @Column(name = "format_scope", length = 50)
    @Builder.Default
    private String formatScope = "OVERALL";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bio_json", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> bioJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "batting_json", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> battingJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bowling_json", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> bowlingJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fielding_json", columnDefinition = "jsonb")
    private Map<String, Object> fieldingJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recent_form_json", columnDefinition = "jsonb")
    private Object recentFormJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rating_json", columnDefinition = "jsonb")
    private Map<String, Object> ratingJson;

    @Column(name = "verified_at", nullable = false)
    @Builder.Default
    private Instant verifiedAt = Instant.now();

    @Column(name = "last_synced_at", nullable = false)
    @Builder.Default
    private Instant lastSyncedAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
