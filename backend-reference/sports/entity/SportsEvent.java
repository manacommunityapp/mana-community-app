package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sports_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private SportsTournament tournament;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sport_id")
    private SportsMeta sport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private SportsVenue venue;

    @Column(nullable = false, length = 250)
    private String name;

    @Column(length = 20)
    @Builder.Default
    private String gender = "ALL"; // MALE | FEMALE | ALL

    @Column(nullable = false, length = 50)
    private String format; // SINGLES | DOUBLES | MIXED_DOUBLES | TEAM

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "min_players")
    @Builder.Default
    private Integer minPlayers = 1;

    @Column(name = "max_players")
    @Builder.Default
    private Integer maxPlayers = 1;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "tournament_type", length = 50)
    @Builder.Default
    private String tournamentType = "KNOCKOUT"; // KNOCKOUT | ROUND_ROBIN | AUCTION_LEAGUE

    @Column(name = "auction_enabled")
    @Builder.Default
    private Boolean auctionEnabled = false;

    @Column(name = "admin_approval_required")
    @Builder.Default
    private Boolean adminApprovalRequired = false;

    @Column(name = "mandatory_mixed_doubles")
    @Builder.Default
    private Boolean mandatoryMixedDoubles = false;

    @Column(length = 50)
    @Builder.Default
    private String status = "REGISTRATION_OPEN";

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsPlayerCategory> categories = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsEventRegistration> registrations = new ArrayList<>();

    @OneToOne(mappedBy = "event", cascade = CascadeType.ALL)
    private SportsAuctionConfig auctionConfig;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
