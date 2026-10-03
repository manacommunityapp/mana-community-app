package com.manacommunity.sports.repository;

import com.manacommunity.sports.entity.SportsCricHeroesProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportsCricHeroesProfileRepository extends JpaRepository<SportsCricHeroesProfile, Long> {

    @Query("SELECT p FROM SportsCricHeroesProfile p WHERE p.player.id = :playerId")
    Optional<SportsCricHeroesProfile> findByPlayerId(@Param("playerId") Long playerId);

    Optional<SportsCricHeroesProfile> findByCricheroesId(String cricheroesId);

    @Modifying
    @Query("DELETE FROM SportsCricHeroesProfile p WHERE p.player.id = :playerId")
    void deleteByPlayerId(@Param("playerId") Long playerId);

    @Query("SELECT p FROM SportsCricHeroesProfile p WHERE p.player.id IN :playerIds")
    List<SportsCricHeroesProfile> findAllByPlayerIds(@Param("playerIds") List<Long> playerIds);
}
