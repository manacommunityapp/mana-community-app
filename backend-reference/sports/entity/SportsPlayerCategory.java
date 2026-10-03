package com.manacommunity.sports.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sports_player_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportsPlayerCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private SportsEvent event;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 20)
    @Builder.Default
    private String gender = "ALL";

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "base_price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal basePrice = BigDecimal.valueOf(1000.00);

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
