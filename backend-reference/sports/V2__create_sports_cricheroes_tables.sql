-- V2__create_sports_cricheroes_tables.sql
-- Migration for Sports Module CricHeroes Integration

-- 1. Alter sports_auction_players table
ALTER TABLE sports_auction_players
    ADD COLUMN IF NOT EXISTS cricheroes_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS cricheroes_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS best_bowling VARCHAR(20),
    ADD COLUMN IF NOT EXISTS innings INT DEFAULT 0;

-- 2. Alter sports_event_registrations table
ALTER TABLE sports_event_registrations
    ADD COLUMN IF NOT EXISTS cricheroes_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS cricheroes_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Create sports_cricheroes_profiles table
CREATE TABLE IF NOT EXISTS sports_cricheroes_profiles (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT UNIQUE NOT NULL,
    cricheroes_id VARCHAR(100) NOT NULL,
    share_url VARCHAR(500) NOT NULL,
    format_scope VARCHAR(50) DEFAULT 'OVERALL',
    bio_json JSONB NOT NULL,
    batting_json JSONB NOT NULL,
    bowling_json JSONB NOT NULL,
    fielding_json JSONB,
    recent_form_json JSONB,
    rating_json JSONB,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sports_cricheroes_player FOREIGN KEY (player_id) REFERENCES sports_auction_players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sports_cricheroes_player_id ON sports_cricheroes_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_sports_cricheroes_ch_id ON sports_cricheroes_profiles(cricheroes_id);
