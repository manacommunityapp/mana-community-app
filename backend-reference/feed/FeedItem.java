package com.manacommunity.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feed_items", indexes = {
    @Index(name = "idx_feed_community_cursor", columnList = "community_id, created_at DESC, id DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "image_url")
    private String imageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "author_role")
    private String authorRole;

    @Column(name = "likes_count")
    @Builder.Default
    private int likesCount = 0;

    @Column(name = "comments_count")
    @Builder.Default
    private int commentsCount = 0;
}
