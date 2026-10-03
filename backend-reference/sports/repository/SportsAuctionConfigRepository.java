package com.manacommunity.sports.repository;

import com.manacommunity.sports.entity.SportsAuctionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportsAuctionConfigRepository extends JpaRepository<SportsAuctionConfig, Long> {

    Optional<SportsAuctionConfig> findByEvent_Id(Long eventId);

    List<SportsAuctionConfig> findByCommunityId(Long communityId);

    List<SportsAuctionConfig> findByCommunityIdAndSportNameIgnoreCase(Long communityId, String sportName);

    boolean existsByCommunityId(Long communityId);
}
