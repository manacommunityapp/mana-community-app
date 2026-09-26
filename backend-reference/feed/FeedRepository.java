package com.manacommunity.repository;

import com.manacommunity.model.FeedItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeedRepository extends JpaRepository<FeedItem, UUID> {

    /**
     * Initial page fetch: latest N items ordered by created_at DESC, id DESC
     */
    @Query("SELECT f FROM FeedItem f WHERE f.communityId = :communityId " +
           "ORDER BY f.createdAt DESC, f.id DESC")
    List<FeedItem> findLatestByCommunity(
        @Param("communityId") Long communityId,
        Pageable pageable
    );

    /**
     * Keyset / cursor-based fetch using composite index (created_at DESC, id DESC)
     */
    @Query("SELECT f FROM FeedItem f WHERE f.communityId = :communityId " +
           "AND (f.createdAt < :cursorTime OR (f.createdAt = :cursorTime AND f.id < :cursorId)) " +
           "ORDER BY f.createdAt DESC, f.id DESC")
    List<FeedItem> findByCommunityAndCursor(
        @Param("communityId") Long communityId,
        @Param("cursorTime") Instant cursorTime,
        @Param("cursorId") UUID cursorId,
        Pageable pageable
    );
}
