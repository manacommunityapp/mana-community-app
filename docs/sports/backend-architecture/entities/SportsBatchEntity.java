package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity for Coaching Academy Batches and schedules.
 */
@Entity
@Table(name = "sports_batch", indexes = {
    @Index(name = "idx_sports_batch_facility", columnList = "facility_id, is_active"),
    @Index(name = "idx_sports_batch_coach", columnList = "coach_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsBatchEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private SportsCoachEntity coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private SportsFacilityEntity facility;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "sport", nullable = false, length = 50)
    private String sport;

    @Column(name = "skill_level", nullable = false, length = 50)
    private String skillLevel;

    @Column(name = "age_group", nullable = false, length = 50)
    private String ageGroup;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "schedule_days", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> scheduleDays = new ArrayList<>();

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime;

    @Column(name = "max_capacity", nullable = false)
    @Builder.Default
    private Integer maxCapacity = 15;

    @Column(name = "current_enrolled", nullable = false)
    @Builder.Default
    private Integer currentEnrolled = 0;

    @Column(name = "monthly_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyFee;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

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
