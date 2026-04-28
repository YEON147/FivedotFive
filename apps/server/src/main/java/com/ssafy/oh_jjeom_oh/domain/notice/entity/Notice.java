package com.ssafy.oh_jjeom_oh.domain.notice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "banner_text", length = 255)
    private String bannerText;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<NoticeImage> images = new ArrayList<>();

    public void update(String title, String bannerText, Boolean isPinned, LocalDateTime startAt, LocalDateTime endAt) {
        if (title != null) this.title = title;
        if (bannerText != null) this.bannerText = bannerText;
        if (isPinned != null) this.isPinned = isPinned;
        if (startAt != null) this.startAt = startAt;
        if (endAt != null) this.endAt = endAt;
        this.updatedAt = LocalDateTime.now();
    }

    public void clearImages() {
        this.images.clear();
    }

    public void addImage(NoticeImage image) {
        this.images.add(image);
    }
}
