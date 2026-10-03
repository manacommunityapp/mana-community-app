package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "sports_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private SportsEvent event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private SportsVenue venue;

    @Column(name = "match_number")
    private Integer matchNumber;

    @Column(name = "round_name", length = 100)
    private String roundName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_a_id")
    private SportsAuctionTeam teamA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_b_id")
    private SportsAuctionTeam teamB;

    @Column(name = "scheduled_start_time")
    private Instant scheduledStartTime;

    @Column(name = "scheduled_end_time")
    private Instant scheduledEndTime;

    @Column(length = 50)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED | LIVE | COMPLETED | CANCELLED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_team_id")
    private SportsAuctionTeam winnerTeam;

    @Column(name = "score_summary", length = 300)
    private String scoreSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "score_details_json", columnDefinition = "jsonb")
    private Object scoreDetailsJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
