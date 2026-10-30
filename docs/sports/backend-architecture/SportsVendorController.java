package com.manacommunity.api.sports.controller;

import com.manacommunity.api.sports.dto.*;
import com.manacommunity.api.sports.service.SportsVendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Mana Community Sports Vendor Operations & Court Bookings.
 */
@RestController
@RequestMapping("/api/sports/vendor")
@RequiredArgsConstructor
@Tag(name = "Sports Vendor Portal", description = "Endpoints for sports facilities, slot management, and court reservations")
public class SportsVendorController {

    private final SportsVendorService vendorService;

    // ── 1. Facilities ──────────────────────────────────────────────────────────

    @GetMapping("/facilities")
    @Operation(summary = "List sports facilities (filtered by sport, locality or vendor)")
    public ResponseEntity<List<FacilityResponse>> getFacilities(
            @RequestParam(required = false) String sport,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Long vendorId) {
        return ResponseEntity.ok(vendorService.getFacilities(sport, city, vendorId));
    }

    @GetMapping("/facilities/{id}")
    @Operation(summary = "Get facility details including courts and amenities")
    public ResponseEntity<FacilityResponse> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getFacilityById(id));
    }

    @PostMapping("/facilities")
    @PreAuthorize("hasAuthority('Manage Vendors') or hasRole('ADMIN')")
    @Operation(summary = "Register a new sports arena or clubhouse facility")
    public ResponseEntity<FacilityResponse> createFacility(@Valid @RequestBody CreateFacilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.createFacility(request));
    }

    // ── 2. Courts & Slot Inventory ─────────────────────────────────────────────

    @GetMapping("/facilities/{facilityId}/courts")
    @Operation(summary = "List courts configured under a sports facility")
    public ResponseEntity<List<CourtResponse>> getCourts(@PathVariable Long facilityId) {
        return ResponseEntity.ok(vendorService.getCourtsByFacilityId(facilityId));
    }

    @GetMapping("/courts/{courtId}/slots")
    @Operation(summary = "Get real-time slot inventory and hold status for a date")
    public ResponseEntity<List<SlotResponse>> getSlots(
            @PathVariable Long courtId,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(vendorService.getSlots(courtId, date));
    }

    @PostMapping("/courts/{courtId}/slots/toggle-status")
    @PreAuthorize("hasAuthority('Manage Vendors') or hasRole('ADMIN')")
    @Operation(summary = "Vendor toggle slot status (e.g. block for maintenance)")
    public ResponseEntity<SlotResponse> toggleSlotStatus(
            @PathVariable Long courtId,
            @RequestParam LocalDate date,
            @RequestParam String startTime,
            @RequestParam String targetStatus) {
        return ResponseEntity.ok(vendorService.toggleSlotStatus(courtId, date, startTime, targetStatus));
    }

    // ── 3. Court Reservations & QR Check-In ────────────────────────────────────

    @PostMapping("/bookings/reserve")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Resident reserve court slot with 10-minute distributed lock")
    public ResponseEntity<BookingResponse> reserveSlot(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.reserveSlot(request));
    }

    @PostMapping("/bookings/{bookingId}/check-in")
    @PreAuthorize("hasAuthority('Manage Vendors') or hasRole('ADMIN')")
    @Operation(summary = "Vendor scan resident QR code and complete venue check-in")
    public ResponseEntity<BookingResponse> checkInResident(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String qrToken) {
        return ResponseEntity.ok(vendorService.checkInResident(bookingId, qrToken));
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAuthority('View Vendor Management') or hasRole('ADMIN')")
    @Operation(summary = "Get sports vendor operational dashboard KPI stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam(required = false) Long vendorId) {
        return ResponseEntity.ok(vendorService.getDashboardStats(vendorId));
    }
}
