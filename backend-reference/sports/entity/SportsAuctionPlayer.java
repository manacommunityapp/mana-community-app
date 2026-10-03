package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sports_auction_players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsAuctionPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", nullable = false)
    private SportsAuctionConfig config;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private SportsEventRegistration registration;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 10)
    private String initials;

    @Column(length = 100)
    private String role;

    @Column(length = 100)
    private String category;

    private Integer age;

    @Column(name = "base_price", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal basePrice = BigDecimal.valueOf(1000.00);

    @Column(name = "sold_price", precision = 12, scale = 2)
    private BigDecimal soldPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_team_id")
    private SportsAuctionTeam assignedTeam;

    @Column(length = 50)
    @Builder.Default
    private String status = "QUEUED"; // QUEUED | ACTIVE | SOLD | UNSOLD | PASSED

    @Column(name = "queue_order")
    @Builder.Default
    private Integer queueOrder = 0;

    @Builder.Default
    private Integer matches = 0;

    @Builder.Default
    private Integer innings = 0;

    @Builder.Default
    private Integer runs = 0;

    @Builder.Default
    private Integer wickets = 0;

    @Column(name = "strike_rate", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal strikeRate = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal economy = BigDecimal.ZERO;

    @Column(name = "avg_score", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal avgScore = BigDecimal.ZERO;

    @Column(name = "best_bowling", length = 20)
    private String bestBowling;

    @Column(name = "stats_json", columnDefinition = "TEXT")
    private String statsJson;

    @Column(name = "cricheroes_url", length = 500)
    private String cricHeroesUrl;

    @Column(name = "cricheroes_id", length = 100)
    private String cricHeroesId;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @OneToOne(mappedBy = "player", cascade = CascadeType.ALL, orphanRemoval = true)
    private SportsCricHeroesProfile cricHeroesProfile;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
