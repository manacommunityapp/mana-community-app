package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sports_venues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsVenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "sport_name", length = 100)
    private String sportName;

    @Column(length = 300)
    private String location;

    private Integer capacity;

    @Column(name = "court_number", length = 50)
    private String courtNumber;

    @Column(length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
