package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * JPA Entity for Certified Match Officials (Umpires, Referees, Scorers).
 */
@Entity
@Table(name = "sports_official", indexes = {
    @Index(name = "idx_official_sport_role", columnList = "sport, official_role, is_available")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsOfficialEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "sport", nullable = false, length = 50)
    private String sport;

    /**
     * UMPIRE, REFEREE, SCORER, LINESPERSON
     */
    @Column(name = "official_role", nullable = false, length = 50)
    private String officialRole;

    /**
     * NATIONAL, STATE, DISTRICT, COMMUNITY
     */
    @Column(name = "badge_level", nullable = false, length = 50)
    private String badgeLevel;

    @Column(name = "daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "matches_officiated", nullable = false)
    @Builder.Default
    private Integer matchesOfficiated = 0;

    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = new BigDecimal("5.00");

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
