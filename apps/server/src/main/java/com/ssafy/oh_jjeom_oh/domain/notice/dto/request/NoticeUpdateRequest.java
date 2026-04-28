package com.ssafy.oh_jjeom_oh.domain.notice.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class NoticeUpdateRequest {

    private String title;
    private String bannerText;
    private Boolean isPinned;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
}
