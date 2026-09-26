-- Schema & Composite Index Definition for Keyset Pagination
CREATE TABLE IF NOT EXISTS feed_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_name VARCHAR(128) NOT NULL,
    author_avatar VARCHAR(512),
    media_url VARCHAR(512),
    media_aspect_ratio VARCHAR(32) DEFAULT '16:9',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Crucial composite B-tree index for keyset cursor pagination with sub-millisecond seek times
CREATE INDEX IF NOT EXISTS idx_feed_tenant_cursor 
ON feed_items (community_id, created_at DESC, id DESC);
