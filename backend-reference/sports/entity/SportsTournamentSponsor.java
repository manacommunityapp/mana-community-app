package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sports_tournament_sponsors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsTournamentSponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private SportsTournament tournament;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category; // TITLE | POWERED_BY | CO_SPONSOR | KIT_SPONSOR

    @Column(name = "logo_url", nullable = false, length = 500)
    private String logoUrl;

    @Column(length = 300)
    private String tagline;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
