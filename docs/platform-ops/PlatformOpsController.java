package com.manacommunity.api.admin.ops.controller;

import com.manacommunity.api.admin.ops.dto.PlatformOpsOverviewResponse;
import com.manacommunity.api.admin.ops.dto.PlatformOpsOverviewResponse.ServiceHealth;
import com.manacommunity.api.admin.ops.service.PlatformOpsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for the Mana Platform Operations Console.
 *
 * <p>All endpoints require {@code SUPER_ADMIN} or {@code ADMIN} role.
 * The overview endpoint is designed to be polled every 5-30 seconds by the
 * frontend auto-refresh mechanism; a 10-second {@code @Cacheable} in
 * {@link PlatformOpsService} prevents thundering-herd load on upstream systems.</p>
 *
 * <p>Base path: {@code /admin/ops}</p>
 */
@RestController
@RequestMapping("/admin/ops")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
@Tag(name = "Platform Operations", description = "Live platform observability — services, jobs, notifications, CI/CD, gateways, tenants")
public class PlatformOpsController {

    private final PlatformOpsService platformOpsService;

    // ── 1. Overview ───────────────────────────────────────────────────────────

    /**
     * Returns the full platform operations snapshot.
     *
     * <p>Response is assembled from Micrometer, HikariCP, JPA aggregation queries,
     * the GitHub/Jenkins CI/CD API, payment gateway health endpoints, and the
     * STOMP WebSocket session registry.  Each section is independently wrapped
     * in try-catch — a failure in one source (e.g. GitHub API rate-limited) returns
     * {@code null} for that section only; the rest of the response is unaffected.</p>
     *
     * <p>Cached for 10 seconds via {@code @Cacheable("platformOpsOverview")} to
     * prevent hammering all upstream systems on rapid client refreshes.</p>
     *
     * @return {@link PlatformOpsOverviewResponse} containing all 13 monitoring sections
     */
    @GetMapping("/overview")
    @Operation(summary = "Get live platform operations snapshot (all 13 monitoring sections)")
    public ResponseEntity<PlatformOpsOverviewResponse> getOverview() {
        return ResponseEntity.ok(platformOpsService.getOverview());
    }

    // ── 2. Live Probe ─────────────────────────────────────────────────────────

    /**
     * Triggers an immediate live health probe against every registered microservice's
     * {@code /actuator/health} endpoint, bypassing the response cache.
     *
     * <p>Use this when the auto-refresh snapshot appears stale or after a deployment
     * to get instant, non-cached service status.</p>
     *
     * @return list of {@link ServiceHealth} reflecting the live probe results
     */
    @PostMapping("/probe")
    @Operation(summary = "Trigger a live health probe on all registered microservices (cache-bypass)")
    public ResponseEntity<List<ServiceHealth>> probeServices() {
        return ResponseEntity.ok(platformOpsService.probeServices());
    }

    // ── 3. Incident Acknowledge ───────────────────────────────────────────────

    /**
     * Marks a platform incident as acknowledged by the currently authenticated user.
     *
     * <p>Acknowledged incidents are still returned in {@code activeIncidents} but
     * the frontend filters them out of the alert banner. The incident remains open
     * until manually resolved or auto-resolved by the monitoring system.</p>
     *
     * @param id the {@code platform_ops_incident.id}
     * @return {@code {"acknowledged": true}} on success
     */
    @PostMapping("/incidents/{id}/acknowledge")
    @Operation(summary = "Acknowledge an active platform incident")
    public ResponseEntity<Map<String, Boolean>> acknowledgeIncident(@PathVariable Long id) {
        platformOpsService.acknowledgeIncident(id);
        return ResponseEntity.ok(Map.of("acknowledged", true));
    }
}
