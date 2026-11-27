# Mana Community Hub — Platform Operations Dashboard
## Backend Reference Implementation

This directory contains the production-grade Spring Boot controller, service, DTOs and
Liquibase migrations that back the **Platform Operations Console** in the Mana admin UI.

---

### 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│          MANA ADMIN UI  —  Platform Operations Console              │
│  Auto-refresh • Probe Now • AI Analysis • Incident Acknowledge      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  GET /admin/ops/overview
                           │  POST /admin/ops/probe
                           │  POST /admin/ops/incidents/{id}/acknowledge
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│               PlatformOpsController   (Spring MVC)                  │
│            @PreAuthorize("SUPER_ADMIN or ADMIN")                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PlatformOpsService                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  Micrometer  │  │  HikariCP    │  │  Spring Actuator          │ │
│  │  MeterReg.   │  │  DataSource  │  │  HealthIndicators         │ │
│  │  CPU/Mem/Disk│  │  Pool Stats  │  │  Service health probes    │ │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  JPA Repos   │  │  GitHub API  │  │  Payment Gateway APIs     │ │
│  │  Job logs    │  │  / Jenkins   │  │  Cashfree / Razorpay      │ │
│  │  Notif. logs │  │  CI/CD       │  │  /health endpoints        │ │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16                                   │
│  background_job_execution_log  │  notification_delivery_log         │
│  platform_ops_incident         │  community (tenant health query)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2. Response Sections

The `GET /admin/ops/overview` endpoint returns a single `PlatformOpsOverviewResponse` JSON
object combining all monitoring concerns:

| Section | Source | Frontend panel |
|---|---|---|
| `clusterMetrics` | Micrometer `MeterRegistry` | CPU / Memory / Disk / JVM / Uptime cards |
| `services` | Spring Actuator `HealthEndpoint` + probe | Microservices health grid |
| `recentFailures` | In-memory `OpsMetricsCollector` ring buffer | 5xx error traces table |
| `queueLags` | Kafka AdminClient consumer group offsets | Queue lag table |
| `migrations` | Liquibase `Liquibase.getDatabaseChangeLog()` | DB migration status |
| `activeIncidents` | `platform_ops_incident` table | Incident acknowledge banner |
| `notifications` | `notification_delivery_log` aggregation | Failed notifications panel |
| `webSocketHealth` | Micrometer gauge / STOMP session registry | WebSocket health cards |
| `backgroundJobs` | `background_job_execution_log` aggregation | Background job table |
| `cicdPipelines` | GitHub Actions REST API / Jenkins API | CI/CD pipeline cards |
| `paymentGateways` | Cashfree + Razorpay `/health` endpoints | Payment gateway cards |
| `tenantHealth` | `community` table aggregate query | Tenant health grid |
| `databasePools` | HikariCP `HikariPoolMXBean` | DB connection pool table |

---

### 3. New Database Tables

| Table | Purpose |
|---|---|
| `background_job_execution_log` | Every `@Scheduled` job run — name, status, duration, error |
| `notification_delivery_log` | Every PUSH / EMAIL / SMS / WhatsApp dispatch and its delivery status |
| `platform_ops_incident` | Active and resolved platform incidents with acknowledge workflow |

See [`migrations/001_create_platform_ops_tables.sql`](migrations/001_create_platform_ops_tables.sql)

---

### 4. Configuration properties (`application.yml`)

```yaml
mana:
  ops:
    cache-ttl-seconds: 10          # How long to cache the overview response
    cicd:
      provider: github             # github | jenkins | none
      github-token: ${GITHUB_TOKEN}
      github-owner: manacommunityapp
      github-repo: mana-backend
    payment-gateways:
      cashfree-health-url: https://api.cashfree.com/api/v2/health
      razorpay-health-url: https://api.razorpay.com/v1/health
    websocket:
      metric-gauge-name: websocket.sessions.active  # Micrometer gauge name
```

---

### 5. File Manifest

| File | Purpose |
|---|---|
| `PlatformOpsController.java` | REST controller — 3 endpoints |
| `PlatformOpsService.java` | Business logic — assembles all 13 sections |
| `PlatformOpsOverviewResponse.java` | Full DTO matching the TypeScript interface exactly |
| `migrations/001_create_platform_ops_tables.sql` | Liquibase SQL for 3 new tables |
