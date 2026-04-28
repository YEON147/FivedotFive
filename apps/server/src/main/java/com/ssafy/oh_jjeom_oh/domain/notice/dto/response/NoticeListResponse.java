package com.ssafy.oh_jjeom_oh.domain.notice.dto.response;

import com.ssafy.oh_jjeom_oh.domain.notice.entity.Notice;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class NoticeListResponse {

    private List<NoticeItem> notices;

    public static NoticeListResponse of(List<Notice> notices) {
        return new NoticeListResponse(
                notices.stream().map(NoticeItem::of).toList()
        );
    }

    @Getter
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class NoticeItem {
        private Long id;
        private String title;
        private Boolean isPinned;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private LocalDateTime createdAt;

        public static NoticeItem of(Notice notice) {
            return new NoticeItem(
                    notice.getId(),
                    notice.getTitle(),
                    notice.isPinned(),
                    notice.getStartAt(),
                    notice.getEndAt(),
                    notice.getCreatedAt()
            );
        }
    }
}
