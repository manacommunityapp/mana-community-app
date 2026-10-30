-- liquibase formatted sql
-- changeset manacommunity:001-create-sports-vendor-tables splitStatements:true endDelimiter:;

-- 1. SPORTS FACILITY (Venues / Arenas / Clubhouses)
CREATE TABLE IF NOT EXISTS sports_facility (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(30),
    email VARCHAR(100),
    sports JSONB NOT NULL DEFAULT '[]'::jsonb,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    opening_time VARCHAR(20) NOT NULL DEFAULT '06:00',
    closing_time VARCHAR(20) NOT NULL DEFAULT '23:00',
    is_federated BOOLEAN NOT NULL DEFAULT FALSE,
    partner_communities JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_facility_vendor ON sports_facility(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sports_facility_city_area ON sports_facility(city, area);
CREATE INDEX IF NOT EXISTS idx_sports_facility_active ON sports_facility(is_active);

-- 2. SPORTS COURT CONFIGURATION (Individual courts inside a venue)
CREATE TABLE IF NOT EXISTS sports_court (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT NOT NULL REFERENCES sports_facility(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    sport_type VARCHAR(50) NOT NULL,
    surface_type VARCHAR(50) NOT NULL,
    is_indoor BOOLEAN NOT NULL DEFAULT FALSE,
    has_lighting BOOLEAN NOT NULL DEFAULT TRUE,
    base_hourly_price NUMERIC(10, 2) NOT NULL,
    resident_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    pricing_rules JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_court_facility ON sports_court(facility_id);
CREATE INDEX IF NOT EXISTS idx_sports_court_sport ON sports_court(sport_type);

-- 3. SPORTS COURT SLOTS (Slot scheduling inventory with Hold states)
CREATE TABLE IF NOT EXISTS sports_court_slot (
    id BIGSERIAL PRIMARY KEY,
    court_id BIGINT NOT NULL REFERENCES sports_court(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    held_until TIMESTAMP WITH TIME ZONE,
    held_by_user_id BIGINT,
    price NUMERIC(10, 2) NOT NULL,
    resident_price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_court_slot UNIQUE (court_id, slot_date, start_time),
    CONSTRAINT chk_slot_status CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED', 'MAINTENANCE'))
);

CREATE INDEX IF NOT EXISTS idx_court_slot_lookup ON sports_court_slot(court_id, slot_date, status);
CREATE INDEX IF NOT EXISTS idx_court_slot_held_expiry ON sports_court_slot(status, held_until) WHERE status = 'HELD';

-- 4. SPORTS VENDOR BOOKINGS (Resident reservations with QR Verification)
CREATE TABLE IF NOT EXISTS sports_vendor_booking (
    id BIGSERIAL PRIMARY KEY,
    booking_number VARCHAR(50) NOT NULL UNIQUE,
    facility_id BIGINT NOT NULL REFERENCES sports_facility(id),
    court_id BIGINT NOT NULL REFERENCES sports_court(id),
    slot_id BIGINT NOT NULL REFERENCES sports_court_slot(id),
    resident_id BIGINT NOT NULL,
    resident_name VARCHAR(150) NOT NULL,
    resident_phone VARCHAR(30) NOT NULL,
    resident_flat VARCHAR(50),
    community_name VARCHAR(150),
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    qr_code_token VARCHAR(255) NOT NULL UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by_user_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_booking_status CHECK (booking_status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))
);

CREATE INDEX IF NOT EXISTS idx_vendor_booking_resident ON sports_vendor_booking(resident_id);
CREATE INDEX IF NOT EXISTS idx_vendor_booking_facility ON sports_vendor_booking(facility_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_vendor_booking_qr ON sports_vendor_booking(qr_code_token);

-- 5. SPORTS COACHES (Academy Coaches & Trainers)
CREATE TABLE IF NOT EXISTS sports_coach (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    bio TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    avatar_url VARCHAR(500),
    experience_years INT NOT NULL DEFAULT 1,
    sports JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_coach_vendor ON sports_coach(vendor_id);

-- 6. SPORTS ACADEMY BATCHES (Student groups)
CREATE TABLE IF NOT EXISTS sports_batch (
    id BIGSERIAL PRIMARY KEY,
    coach_id BIGINT NOT NULL REFERENCES sports_coach(id) ON DELETE CASCADE,
    facility_id BIGINT NOT NULL REFERENCES sports_facility(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    skill_level VARCHAR(50) NOT NULL,
    age_group VARCHAR(50) NOT NULL,
    schedule_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    max_capacity INT NOT NULL DEFAULT 15,
    current_enrolled INT NOT NULL DEFAULT 0,
    monthly_fee NUMERIC(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_batch_facility ON sports_batch(facility_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sports_batch_coach ON sports_batch(coach_id);

-- 7. BATCH ENROLLMENTS & STUDENT ROSTER
CREATE TABLE IF NOT EXISTS sports_batch_enrollment (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES sports_batch(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    parent_name VARCHAR(150),
    parent_phone VARCHAR(30) NOT NULL,
    flat_no VARCHAR(50),
    community_name VARCHAR(150),
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    fee_paid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batch_student UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_enrollment_student ON sports_batch_enrollment(student_id);

-- 8. CERTIFIED MATCH OFFICIALS (Umpires, Referees, Scorers)
CREATE TABLE IF NOT EXISTS sports_official (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    official_role VARCHAR(50) NOT NULL,
    badge_level VARCHAR(50) NOT NULL,
    daily_rate NUMERIC(10, 2) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    matches_officiated INT NOT NULL DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    phone VARCHAR(30),
    email VARCHAR(100),
    avatar_url VARCHAR(500),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_official_sport_role ON sports_official(sport, official_role, is_available);
