package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sports_auction_bids")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsAuctionBid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", nullable = false)
    private SportsAuctionConfig config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private SportsAuctionPlayer player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private SportsAuctionTeam team;

    @Column(name = "bid_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal bidAmount;

    @Column(name = "increment_used", precision = 12, scale = 2, nullable = false)
    private BigDecimal incrementUsed;

    @Column(name = "is_rtm")
    @Builder.Default
    private Boolean isRtm = false;

    @Column(name = "bid_by_user_id")
    private Long bidByUserId;

    @CreationTimestamp
    @Column(name = "bid_at", nullable = false, updatable = false)
    private Instant bidAt;
}
