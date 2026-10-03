package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sports_auction_teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsAuctionTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", nullable = false)
    private SportsAuctionConfig config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private SportsEvent event;

    @Column(name = "team_name", nullable = false, length = 150)
    private String teamName;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "captain_user_id")
    private Long captainUserId;

    @Column(name = "captain_confirmed")
    @Builder.Default
    private Boolean captainConfirmed = false;

    @Column(name = "color_hex", length = 20)
    @Builder.Default
    private String colorHex = "#d4a017";

    @Column(name = "total_budget", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalBudget = BigDecimal.valueOf(50000.00);

    @Column(name = "remaining_budget", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal remainingBudget = BigDecimal.valueOf(50000.00);

    @Column(precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal spent = BigDecimal.ZERO;

    @OneToMany(mappedBy = "assignedTeam")
    @Builder.Default
    private List<SportsAuctionPlayer> players = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
