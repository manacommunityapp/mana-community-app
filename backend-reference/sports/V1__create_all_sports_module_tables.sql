-- V1__create_all_sports_module_tables.sql
-- Comprehensive Database Schema for Sports Module with consistent 'sports_' table prefix

-- 1. Sports Meta / Master Config
CREATE TABLE IF NOT EXISTS sports_meta (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Sports Venues
CREATE TABLE IF NOT EXISTS sports_venues (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    sport_name VARCHAR(100),
    location VARCHAR(300),
    capacity INT,
    court_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Sports Tournaments / Seasons
CREATE TABLE IF NOT EXISTS sports_tournaments (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    banner_url VARCHAR(500),
    season VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'UPCOMING', -- 'UPCOMING' | 'ONGOING' | 'COMPLETED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Sports Events (Sub-events under a tournament / stand-alone events)
CREATE TABLE IF NOT EXISTS sports_events (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES sports_tournaments(id) ON DELETE CASCADE,
    community_id BIGINT NOT NULL,
    sport_id BIGINT REFERENCES sports_meta(id),
    venue_id BIGINT REFERENCES sports_venues(id),
    name VARCHAR(250) NOT NULL,
    gender VARCHAR(20) DEFAULT 'ALL', -- 'MALE' | 'FEMALE' | 'ALL'
    format VARCHAR(50) NOT NULL, -- 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'TEAM'
    start_date DATE,
    end_date DATE,
    min_players INT DEFAULT 1,
    max_players INT DEFAULT 1,
    min_age INT,
    max_age INT,
    tournament_type VARCHAR(50) DEFAULT 'KNOCKOUT', -- 'KNOCKOUT' | 'ROUND_ROBIN' | 'AUCTION_LEAGUE'
    auction_enabled BOOLEAN DEFAULT FALSE,
    admin_approval_required BOOLEAN DEFAULT FALSE,
    mandatory_mixed_doubles BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'REGISTRATION_OPEN',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Sports Player Categories (Age / Gender / Skill brackets)
CREATE TABLE IF NOT EXISTS sports_player_categories (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES sports_events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(20) DEFAULT 'ALL',
    min_age INT,
    max_age INT,
    base_price NUMERIC(12, 2) DEFAULT 1000.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Sports Event Registrations
CREATE TABLE IF NOT EXISTS sports_event_registrations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES sports_events(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES sports_player_categories(id),
    user_id BIGINT,
    family_member_id BIGINT,
    player_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(30),
    relation VARCHAR(50) DEFAULT 'OTHER',
    flat_number VARCHAR(50),
    age INT,
    gender VARCHAR(20),
    role VARCHAR(100),
    match_type VARCHAR(50) DEFAULT 'SINGLES',
    partner_user_id BIGINT,
    partner_family_member_id BIGINT,
    partner_name VARCHAR(200),
    captain_nomination BOOLEAN DEFAULT FALSE,
    proposed_team_name VARCHAR(150),
    cricheroes_url VARCHAR(500),
    cricheroes_id VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING' | 'REGISTERED' | 'CONFIRMED' | 'REJECTED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Sports Auction Configurations
CREATE TABLE IF NOT EXISTS sports_auction_configs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES sports_events(id) ON DELETE CASCADE,
    community_id BIGINT NOT NULL,
    sport_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED'
    base_price NUMERIC(12, 2) DEFAULT 1000.00,
    bid_increment_default NUMERIC(12, 2) DEFAULT 100.00,
    bid_increment_threshold NUMERIC(12, 2) DEFAULT 5000.00,
    bid_increment_above NUMERIC(12, 2) DEFAULT 500.00,
    total_teams INT DEFAULT 4,
    total_players INT DEFAULT 40,
    budget_per_team NUMERIC(12, 2) DEFAULT 50000.00,
    unsold_rule VARCHAR(50) DEFAULT 'RE_AUCTION',
    committee_members JSONB,
    categories JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Sports Auction Teams
CREATE TABLE IF NOT EXISTS sports_auction_teams (
    id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES sports_auction_configs(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES sports_events(id),
    team_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150),
    owner_user_id BIGINT,
    captain_user_id BIGINT,
    captain_confirmed BOOLEAN DEFAULT FALSE,
    color_hex VARCHAR(20) DEFAULT '#d4a017',
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    remaining_budget NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Sports Auction Players (Auction Pool)
CREATE TABLE IF NOT EXISTS sports_auction_players (
    id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES sports_auction_configs(id) ON DELETE CASCADE,
    registration_id BIGINT REFERENCES sports_event_registrations(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    initials VARCHAR(10),
    role VARCHAR(100),
    category VARCHAR(100),
    age INT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    sold_price NUMERIC(12, 2),
    assigned_team_id BIGINT REFERENCES sports_auction_teams(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'QUEUED', -- 'QUEUED' | 'ACTIVE' | 'SOLD' | 'UNSOLD' | 'PASSED'
    queue_order INT DEFAULT 0,
    matches INT DEFAULT 0,
    innings INT DEFAULT 0,
    runs INT DEFAULT 0,
    wickets INT DEFAULT 0,
    strike_rate NUMERIC(8, 2) DEFAULT 0.00,
    economy NUMERIC(8, 2) DEFAULT 0.00,
    avg_score NUMERIC(8, 2) DEFAULT 0.00,
    best_bowling VARCHAR(20),
    stats_json TEXT,
    cricheroes_url VARCHAR(500),
    cricheroes_id VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Sports Auction Bids (Audit Log of Live Auction)
CREATE TABLE IF NOT EXISTS sports_auction_bids (
    id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES sports_auction_configs(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES sports_auction_players(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES sports_auction_teams(id) ON DELETE CASCADE,
    bid_amount NUMERIC(12, 2) NOT NULL,
    increment_used NUMERIC(12, 2) NOT NULL,
    is_rtm BOOLEAN DEFAULT FALSE,
    bid_by_user_id BIGINT,
    bid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Sports CricHeroes Verified Profiles (Persistent Cache & Metrics Engine)
CREATE TABLE IF NOT EXISTS sports_cricheroes_profiles (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT UNIQUE NOT NULL REFERENCES sports_auction_players(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Sports Matches & Schedules
CREATE TABLE IF NOT EXISTS sports_matches (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES sports_events(id) ON DELETE CASCADE,
    venue_id BIGINT REFERENCES sports_venues(id),
    match_number INT,
    round_name VARCHAR(100), -- 'Group Stage' | 'Quarter Final' | 'Semi Final' | 'Final'
    team_a_id BIGINT REFERENCES sports_auction_teams(id),
    team_b_id BIGINT REFERENCES sports_auction_teams(id),
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
    winner_team_id BIGINT REFERENCES sports_auction_teams(id),
    score_summary VARCHAR(300),
    score_details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. Sports Tournament Sponsors
CREATE TABLE IF NOT EXISTS sports_tournament_sponsors (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES sports_tournaments(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'TITLE' | 'POWERED_BY' | 'CO_SPONSOR' | 'KIT_SPONSOR'
    logo_url VARCHAR(500) NOT NULL,
    tagline VARCHAR(300),
    website_url VARCHAR(500),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Indexes for High Performance Querying ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sports_events_tournament ON sports_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sports_reg_event ON sports_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_sports_reg_user ON sports_event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_auction_players_config ON sports_auction_players(config_id);
CREATE INDEX IF NOT EXISTS idx_sports_auction_players_team ON sports_auction_players(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_sports_auction_bids_player ON sports_auction_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_sports_cricheroes_player_id ON sports_cricheroes_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_sports_cricheroes_ch_id ON sports_cricheroes_profiles(cricheroes_id);
CREATE INDEX IF NOT EXISTS idx_sports_matches_event ON sports_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_sports_sponsors_tournament ON sports_tournament_sponsors(tournament_id);
