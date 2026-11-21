package com.manacommunity.api.admin.ops.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Root DTO returned by {@code GET /admin/ops/overview}.
 *
 * <p>All optional sections ({@code notifications}, {@code webSocketHealth}, etc.) are
 * annotated with {@code @JsonInclude(NON_NULL)} so the JSON omits them when the underlying
 * telemetry source is unreachable — keeping the response valid even during partial failures.</p>
 *
 * <p>Field names and types are intentionally kept in sync with the TypeScript
 * {@code PlatformOpsOverview} interface in
 * {@code src/services/admin/platformOpsService.ts}.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class PlatformOpsOverviewResponse {

    /** ISO-8601 timestamp when this snapshot was generated. */
    private Instant generatedAt;

    /** Aggregate status across all monitored services: UP | DEGRADED | DOWN | UNKNOWN. */
    private String overallStatus;

    /** Cluster uptime in seconds (mirrors {@code clusterMetrics.uptimeSeconds}). */
    private long uptimeSeconds;

    /** Current active WebSocket connections (mirrors {@code webSocketHealth.activeConnections}). */
    private int activeWebsockets;

    /** Total failed HTTP requests in the tracked window (mirrors {@code clusterMetrics.totalFailedRequests}). */
    private long failedRequestsTotal;

    /** CPU, memory, disk, JVM, and thread metrics for the cluster. */
    private SystemClusterMetrics clusterMetrics;

    /** Health status of each registered microservice. */
    private List<ServiceHealth> services;

    /** Recent HTTP 5xx failures captured by OpsMetricsCollector. */
    private List<FailedRequest> recentFailures;

    /** Kafka consumer group queue lag per topic. */
    private List<QueueLag> queueLags;

    /** Liquibase migration status per schema. */
    private List<MigrationStatus> migrations;

    /** Active (unresolved) platform incidents. */
    private List<IncidentAlert> activeIncidents;

    // ── New optional sections — null when telemetry unavailable ─────────────

    /** Notification delivery failure summary across all channels. */
    private FailedNotificationSummary notifications;

    /** Live WebSocket push-gateway health. */
    private WebSocketHealth webSocketHealth;

    /** All registered background / cron jobs and their recent execution state. */
    private List<BackgroundJobStatus> backgroundJobs;

    /** Recent CI/CD pipeline executions per environment. */
    private List<CicdPipelineStatus> cicdPipelines;

    /** Payment gateway health, verification latency and success rates. */
    private List<PaymentGatewayHealth> paymentGateways;

    /** Community tenant health and onboarding pipeline. */
    private TenantHealthSummary tenantHealth;

    /** HikariCP connection pool stats per data source. */
    private List<DatabaseConnectionPool> databasePools;

    // ═════════════════════════════════════════════════════════════════════════
    // Nested DTOs
    // ═════════════════════════════════════════════════════════════════════════

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SystemClusterMetrics {
        private double cpuLoadPercent;
        private long   totalMemoryMb;
        private long   usedMemoryMb;
        private double memoryPercent;
        private long   totalDiskGb;
        private long   usedDiskGb;
        private double diskPercent;
        private long   jvmUsedMemoryMb;
        private long   jvmMaxMemoryMb;
        private double jvmPercent;
        private int    activeThreads;
        private long   uptimeSeconds;
        private long   totalRequestsTracked;
        private long   totalFailedRequests;
        private double overallErrorRate;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ServiceHealth {
        private String  id;
        private String  name;
        /** CORE | INFRASTRUCTURE | DOMAIN | AI_VISION */
        private String  category;
        /** UP | DEGRADED | DOWN | UNKNOWN */
        private String  status;
        private int     port;
        private String  endpoint;
        private long    latencyMs;
        private String  version;
        private String  gitCommit;
        private double  errorRatePercent;
        private long    uptimeSeconds;
        private String  details;
        private Instant lastChecked;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FailedRequest {
        private String  id;
        private Instant timestamp;
        private String  method;
        private String  path;
        private int     statusCode;
        private long    latencyMs;
        private String  correlationId;
        private String  errorType;
        private String  errorMessage;
        private String  clientIp;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QueueLag {
        private String topic;
        private String consumerGroup;
        private int    partitions;
        private long   totalLag;
        private double consumptionRatePerSec;
        /** HEALTHY | WARNING | CRITICAL */
        private String status;
        private String targetService;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MigrationStatus {
        private String  schemaName;
        private int     totalChangeSets;
        private int     executedChangeSets;
        private int     pendingChangeSets;
        private String  latestChangeSetId;
        private String  latestAuthor;
        private Instant lastExecutedAt;
        /** UP_TO_DATE | PENDING | FAILED */
        private String  status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class IncidentAlert {
        private Long    id;
        /** CRITICAL | WARNING | INFO */
        private String  severity;
        private String  title;
        private String  message;
        private String  sourceService;
        private Instant triggeredAt;
        private boolean acknowledged;
        private String  acknowledgedBy;
    }

    // ── New section DTOs ─────────────────────────────────────────────────────

    /** Notification delivery failure summary across all channels. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FailedNotificationSummary {
        private long           totalFailed;
        private long           failedLast1h;
        private List<ChannelFailure> byChannel;
        private Instant        lastFailureAt;

        @Data @Builder @NoArgsConstructor @AllArgsConstructor
        public static class ChannelFailure {
            /** PUSH | EMAIL | SMS | WHATSAPP */
            private String channel;
            private long   failed;
            private long   total;
            private double failureRate;
        }
    }

    /** Live WebSocket connection health from the STOMP push gateway. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WebSocketHealth {
        private int    activeConnections;
        private int    peakConnectionsLast1h;
        private int    disconnectsLast1h;
        private double messageErrorRate;
        private long   avgSessionDurationSeconds;
        /** UP | DEGRADED | DOWN | UNKNOWN */
        private String status;
    }

    /** Health state of a single scheduled background / cron job. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BackgroundJobStatus {
        private String  jobName;
        private String  cronExpression;
        /** HEALTHY | FAILING | STALLED | DISABLED */
        private String  status;
        private Instant lastRunAt;
        private Instant lastSuccessAt;
        private Instant lastFailureAt;
        private int     failureCountLast24h;
        private long    avgDurationMs;
        private Instant nextScheduledAt;
        private String  lastErrorMessage;
    }

    /** CI/CD pipeline execution status for a single environment. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CicdPipelineStatus {
        private String  pipeline;
        /** SUCCESS | RUNNING | FAILED | PENDING | CANCELLED */
        private String  status;
        private String  branch;
        private String  commitSha;
        private String  triggeredBy;
        private Instant startedAt;
        private Instant finishedAt;
        private Long    durationSeconds;
        private String  deployedEnvironment;
    }

    /** Payment gateway health and verification latency. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PaymentGatewayHealth {
        private String gateway;
        /** UP | DEGRADED | DOWN | UNKNOWN */
        private String status;
        private long   verificationDelayP95Ms;
        private double successRate;
        private long   failureCount;
        private long   avgResponseMs;
    }

    /** Aggregate community tenant health and onboarding pipeline. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TenantHealthSummary {
        private int totalTenants;
        private int healthyTenants;
        private int degradedTenants;
        private int offlineTenants;
        private int pendingOnboarding;
        private int onboardingCompletedLast7Days;
    }

    /** HikariCP / JDBC connection pool stats for one data source. */
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DatabaseConnectionPool {
        private String poolName;
        private int    activeConnections;
        private int    idleConnections;
        private int    maxPoolSize;
        private int    pendingAcquire;
        private long   avgAcquireTimeMs;
        /** HEALTHY | WARNING | CRITICAL */
        private String status;
    }
}
