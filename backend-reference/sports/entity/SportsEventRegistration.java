package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sports_event_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsEventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private SportsEvent event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private SportsPlayerCategory category;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "family_member_id")
    private Long familyMemberId;

    @Column(name = "player_name", nullable = false, length = 200)
    private String playerName;

    @Column(length = 200)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 50)
    @Builder.Default
    private String relation = "OTHER";

    @Column(name = "flat_number", length = 50)
    private String flatNumber;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String role;

    @Column(name = "match_type", length = 50)
    @Builder.Default
    private String matchType = "SINGLES";

    @Column(name = "partner_user_id")
    private Long partnerUserId;

    @Column(name = "partner_family_member_id")
    private Long partnerFamilyMemberId;

    @Column(name = "partner_name", length = 200)
    private String partnerName;

    @Column(name = "captain_nomination")
    @Builder.Default
    private Boolean captainNomination = false;

    @Column(name = "proposed_team_name", length = 150)
    private String proposedTeamName;

    @Column(name = "cricheroes_url", length = 500)
    private String cricHeroesUrl;

    @Column(name = "cricheroes_id", length = 100)
    private String cricHeroesId;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING | REGISTERED | CONFIRMED | REJECTED

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
