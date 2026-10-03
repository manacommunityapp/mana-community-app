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
@Table(name = "sports_tournaments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsTournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(length = 50)
    private String season;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "UPCOMING"; // UPCOMING | ONGOING | COMPLETED

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsEvent> events = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SportsTournamentSponsor> sponsors = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
