package com.ssafy.oh_jjeom_oh.domain.notice.dto.response;

import com.ssafy.oh_jjeom_oh.domain.notice.entity.Notice;
import com.ssafy.oh_jjeom_oh.domain.notice.entity.NoticeImage;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class NoticeDetailResponse {

    private Long id;
    private String title;
    private String bannerText;
    private Boolean isPinned;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private List<ImageItem> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoticeDetailResponse of(Notice notice) {
        return new NoticeDetailResponse(
                notice.getId(),
                notice.getTitle(),
                notice.getBannerText(),
                notice.isPinned(),
                notice.getStartAt(),
                notice.getEndAt(),
                notice.getImages().stream().map(ImageItem::of).toList(),
                notice.getCreatedAt(),
                notice.getUpdatedAt()
        );
    }

    @Getter
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class ImageItem {
        private Integer displayOrder;
        private String imageUrl;

        public static ImageItem of(NoticeImage image) {
            return new ImageItem(image.getDisplayOrder(), image.getImageUrl());
        }
    }
}
