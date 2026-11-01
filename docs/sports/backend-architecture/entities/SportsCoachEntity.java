package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity for Sports Coaches and Academy Trainers.
 */
@Entity
@Table(name = "sports_coach", indexes = {
    @Index(name = "idx_sports_coach_vendor", columnList = "vendor_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsCoachEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "experience_years", nullable = false)
    @Builder.Default
    private Integer experienceYears = 1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sports", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> sports = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "certifications", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal hourlyRate = new BigDecimal("500.00");

    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = new BigDecimal("5.00");

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

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
