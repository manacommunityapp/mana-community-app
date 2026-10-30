package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * JPA Entity for Sports Court / Pitch / Turf within a facility.
 */
@Entity
@Table(name = "sports_court", indexes = {
    @Index(name = "idx_sports_court_facility", columnList = "facility_id"),
    @Index(name = "idx_sports_court_sport", columnList = "sport_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsCourtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private SportsFacilityEntity facility;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "sport_type", nullable = false, length = 50)
    private String sportType;

    @Column(name = "surface_type", nullable = false, length = 50)
    private String surfaceType;

    @Column(name = "is_indoor", nullable = false)
    @Builder.Default
    private Boolean isIndoor = false;

    @Column(name = "has_lighting", nullable = false)
    @Builder.Default
    private Boolean hasLighting = true;

    @Column(name = "base_hourly_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseHourlyPrice;

    @Column(name = "resident_discount_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal residentDiscountPercent = new BigDecimal("10.00");

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pricing_rules", columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> pricingRules = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rules", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> rules = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "court", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SportsCourtSlotEntity> slots = new ArrayList<>();

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
