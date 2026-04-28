package com.ssafy.oh_jjeom_oh.domain.notice.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class NoticeCreateResponse {

    private Long id;

    public static NoticeCreateResponse of(Long id) {
        return new NoticeCreateResponse(id);
    }
}
