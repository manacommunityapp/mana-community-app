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
 * JPA Entity for Sports Venues, Arenas, and Community Sports Complexes.
 */
@Entity
@Table(name = "sports_facility", indexes = {
    @Index(name = "idx_sports_facility_vendor", columnList = "vendor_id"),
    @Index(name = "idx_sports_facility_city_area", columnList = "city, area"),
    @Index(name = "idx_sports_facility_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsFacilityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "area", nullable = false, length = 100)
    private String area;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "pincode", nullable = false, length = 20)
    private String pincode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sports", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> sports = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "amenities", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "images", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(name = "opening_time", nullable = false, length = 20)
    @Builder.Default
    private String openingTime = "06:00";

    @Column(name = "closing_time", nullable = false, length = 20)
    @Builder.Default
    private String closingTime = "23:00";

    @Column(name = "is_federated", nullable = false)
    @Builder.Default
    private Boolean isFederated = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "partner_communities", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> partnerCommunities = new ArrayList<>();

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

    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SportsCourtEntity> courts = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.isActive == null) this.isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
