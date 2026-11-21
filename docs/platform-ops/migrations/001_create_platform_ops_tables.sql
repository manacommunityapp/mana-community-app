--liquibase formatted sql
--changeset mana-platform-team:001-platform-ops-background-jobs-log splitStatements:true endDelimiter:;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: background_job_execution_log
-- Stores every execution attempt for each registered cron / scheduled job.
-- The PlatformOpsService reads this table to surface FAILING / STALLED jobs
-- in the Platform Operations Console under "Background Job Health".
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS background_job_execution_log (
    id                  BIGSERIAL PRIMARY KEY,
    job_name            VARCHAR(120)  NOT NULL,
    cron_expression     VARCHAR(80)   NOT NULL,
    status              VARCHAR(20)   NOT NULL
        CHECK (status IN ('STARTED','SUCCESS','FAILED','STALLED','SKIPPED')),
    started_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    duration_ms         INTEGER,
    error_message       TEXT,
    stack_trace         TEXT,
    host_name           VARCHAR(120),
    community_id        BIGINT        REFERENCES community(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bjel_job_name       ON background_job_execution_log (job_name);
CREATE INDEX IF NOT EXISTS idx_bjel_started_at     ON background_job_execution_log (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bjel_status         ON background_job_execution_log (status);
-- Composite index used by the PlatformOpsService "failure count last 24h" query
CREATE INDEX IF NOT EXISTS idx_bjel_job_status_ts  ON background_job_execution_log (job_name, status, started_at DESC);

COMMENT ON TABLE  background_job_execution_log IS 'Audit log of every scheduled / cron job execution on the Mana platform';
COMMENT ON COLUMN background_job_execution_log.job_name        IS 'Bean name of the Spring @Scheduled job, e.g. MaintenanceInvoiceGenerator';
COMMENT ON COLUMN background_job_execution_log.cron_expression IS 'Cron expression from the @Scheduled annotation at log time';
COMMENT ON COLUMN background_job_execution_log.status          IS 'Terminal status of this execution run';
COMMENT ON COLUMN background_job_execution_log.duration_ms     IS 'Wall-clock execution time in milliseconds; NULL if still running or stalled';
COMMENT ON COLUMN background_job_execution_log.host_name       IS 'JVM host that ran this job, useful in multi-node deployments';

;

--changeset mana-platform-team:002-platform-ops-notification-delivery-log splitStatements:true endDelimiter:;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: notification_delivery_log
-- Tracks every push / email / SMS / WhatsApp notification dispatched by the
-- platform.  The PlatformOpsService aggregates this table to populate the
-- "Failed Notification Deliveries" section in the Platform Operations Console.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_delivery_log (
    id                  BIGSERIAL PRIMARY KEY,
    community_id        BIGINT        REFERENCES community(id) ON DELETE SET NULL,
    user_id             BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    channel             VARCHAR(20)   NOT NULL
        CHECK (channel IN ('PUSH','EMAIL','SMS','WHATSAPP')),
    status              VARCHAR(20)   NOT NULL
        CHECK (status IN ('SENT','DELIVERED','FAILED','BOUNCED','REJECTED','PENDING')),
    provider            VARCHAR(60),                      -- e.g. FCM, SendGrid, Exotel, Interakt
    provider_message_id VARCHAR(255),                     -- external delivery receipt ID
    template_key        VARCHAR(120),
    subject             VARCHAR(255),
    error_code          VARCHAR(60),
    error_message       TEXT,
    retry_count         SMALLINT      NOT NULL DEFAULT 0,
    sent_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ndl_channel_status   ON notification_delivery_log (channel, status);
CREATE INDEX IF NOT EXISTS idx_ndl_sent_at          ON notification_delivery_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ndl_user_id          ON notification_delivery_log (user_id);
CREATE INDEX IF NOT EXISTS idx_ndl_community_id     ON notification_delivery_log (community_id);
-- Partial index for fast failure-count queries
CREATE INDEX IF NOT EXISTS idx_ndl_failures         ON notification_delivery_log (channel, sent_at DESC)
    WHERE status IN ('FAILED','BOUNCED','REJECTED');

COMMENT ON TABLE  notification_delivery_log IS 'Audit log of every notification dispatched by the Mana platform across all channels';
COMMENT ON COLUMN notification_delivery_log.channel         IS 'Delivery channel: PUSH (FCM/APNs), EMAIL, SMS, or WHATSAPP';
COMMENT ON COLUMN notification_delivery_log.status          IS 'Delivery terminal state; PENDING means still in-flight';
COMMENT ON COLUMN notification_delivery_log.provider        IS 'Third-party messaging provider that handled the dispatch';
COMMENT ON COLUMN notification_delivery_log.provider_message_id IS 'External ID returned by the provider for receipt tracking';
COMMENT ON COLUMN notification_delivery_log.retry_count     IS 'Number of retry attempts before reaching terminal status';

;

--changeset mana-platform-team:003-platform-ops-incidents splitStatements:true endDelimiter:;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: platform_ops_incident
-- Stores active and resolved platform incidents surfaced in the
-- "Active Incidents Banner" of the Platform Operations Console.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_ops_incident (
    id                  BIGSERIAL PRIMARY KEY,
    severity            VARCHAR(20)   NOT NULL
        CHECK (severity IN ('CRITICAL','WARNING','INFO')),
    title               VARCHAR(255)  NOT NULL,
    message             TEXT          NOT NULL,
    source_service      VARCHAR(120)  NOT NULL,
    triggered_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    acknowledged        BOOLEAN       NOT NULL DEFAULT FALSE,
    acknowledged_by     VARCHAR(120),
    acknowledged_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_severity_active  ON platform_ops_incident (severity, triggered_at DESC)
    WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_poi_acknowledged     ON platform_ops_incident (acknowledged)
    WHERE acknowledged = FALSE;

COMMENT ON TABLE  platform_ops_incident IS 'Active platform incidents surfaced in the Platform Operations Console';
COMMENT ON COLUMN platform_ops_incident.severity       IS 'CRITICAL blocks operations, WARNING is degraded, INFO is informational';
COMMENT ON COLUMN platform_ops_incident.source_service IS 'The microservice or subsystem that raised the incident';
COMMENT ON COLUMN platform_ops_incident.acknowledged   IS 'True once a platform team member clicks Acknowledge in the console';

;
