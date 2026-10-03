package com.manacommunity.sports.repository;

import com.manacommunity.sports.entity.SportsAuctionPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportsAuctionPlayerRepository extends JpaRepository<SportsAuctionPlayer, Long> {

    List<SportsAuctionPlayer> findByConfig_IdOrderByQueueOrderAsc(Long configId);

    List<SportsAuctionPlayer> findByConfig_IdAndStatus(Long configId, String status);

    List<SportsAuctionPlayer> findByAssignedTeam_Id(Long teamId);

    @Query("SELECT p FROM SportsAuctionPlayer p WHERE p.config.id = :configId AND p.status = 'QUEUED' ORDER BY p.queueOrder ASC")
    List<SportsAuctionPlayer> findQueuedPlayers(@Param("configId") Long configId);

    @Query("SELECT p FROM SportsAuctionPlayer p WHERE p.config.id = :configId AND p.status = 'ACTIVE'")
    Optional<SportsAuctionPlayer> findActivePlayer(@Param("configId") Long configId);

    Optional<SportsAuctionPlayer> findByRegistration_Id(Long registrationId);
}
