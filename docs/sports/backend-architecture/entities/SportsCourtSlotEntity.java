package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * JPA Entity for scheduled court inventory slots with distributed hold states.
 */
@Entity
@Table(name = "sports_court_slot",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_court_slot", columnNames = {"court_id", "slot_date", "start_time"})
    },
    indexes = {
        @Index(name = "idx_court_slot_lookup", columnList = "court_id, slot_date, status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsCourtSlotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id", nullable = false)
    private SportsCourtEntity court;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime;

    /**
     * State machine: AVAILABLE -> HELD -> BOOKED -> BLOCKED / MAINTENANCE
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column(name = "held_until")
    private OffsetDateTime heldUntil;

    @Column(name = "held_by_user_id")
    private Long heldByUserId;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "resident_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal residentPrice;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public boolean isExpiredHold() {
        return "HELD".equalsIgnoreCase(this.status) &&
               this.heldUntil != null &&
               OffsetDateTime.now().isAfter(this.heldUntil);
    }

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
