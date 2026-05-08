package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RollingPaperCommentDeleteRequest {

    private String guestPassword; // 비회원 댓글 삭제 시 필수
}
