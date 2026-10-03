package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sports_auction_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsAuctionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private SportsEvent event;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @Column(name = "sport_name", nullable = false, length = 100)
    private String sportName;

    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT | READY | LIVE | PAUSED | COMPLETED

    @Column(name = "base_price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal basePrice = BigDecimal.valueOf(1000.00);

    @Column(name = "bid_increment_default", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal bidIncrementDefault = BigDecimal.valueOf(100.00);

    @Column(name = "bid_increment_threshold", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal bidIncrementThreshold = BigDecimal.valueOf(5000.00);

    @Column(name = "bid_increment_above", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal bidIncrementAbove = BigDecimal.valueOf(500.00);

    @Column(name = "total_teams")
    @Builder.Default
    private Integer totalTeams = 4;

    @Column(name = "total_players")
    @Builder.Default
    private Integer totalPlayers = 40;

    @Column(name = "budget_per_team", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal budgetPerTeam = BigDecimal.valueOf(50000.00);

    @Column(name = "unsold_rule", length = 50)
    @Builder.Default
    private String unsoldRule = "RE_AUCTION";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "committee_members", columnDefinition = "jsonb")
    private Object committeeMembers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object categories;

    @OneToMany(mappedBy = "config", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsAuctionTeam> teams = new ArrayList<>();

    @OneToMany(mappedBy = "config", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsAuctionPlayer> players = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
