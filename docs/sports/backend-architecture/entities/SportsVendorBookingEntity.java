package com.manacommunity.api.sports.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * JPA Entity for Resident Court Bookings, Payment Record & QR Verification.
 */
@Entity
@Table(name = "sports_vendor_booking", indexes = {
    @Index(name = "idx_vendor_booking_resident", columnList = "resident_id"),
    @Index(name = "idx_vendor_booking_facility", columnList = "facility_id, booking_date"),
    @Index(name = "idx_vendor_booking_qr", columnList = "qr_code_token")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsVendorBookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_number", nullable = false, unique = true, length = 50)
    private String bookingNumber;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "court_id", nullable = false)
    private Long courtId;

    @Column(name = "slot_id", nullable = false)
    private Long slotId;

    @Column(name = "resident_id", nullable = false)
    private Long residentId;

    @Column(name = "resident_name", nullable = false, length = 150)
    private String residentName;

    @Column(name = "resident_phone", nullable = false, length = 30)
    private String residentPhone;

    @Column(name = "resident_flat", length = 50)
    private String residentFlat;

    @Column(name = "community_name", length = 150)
    private String communityName;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PAID";

    /**
     * CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
     */
    @Column(name = "booking_status", nullable = false, length = 30)
    @Builder.Default
    private String bookingStatus = "CONFIRMED";

    @Column(name = "qr_code_token", nullable = false, unique = true, length = 255)
    private String qrCodeToken;

    @Column(name = "checked_in_at")
    private OffsetDateTime checkedInAt;

    @Column(name = "checked_in_by_user_id")
    private Long checkedInByUserId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
