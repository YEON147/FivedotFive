package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommentDeleteRequest {

    private String guestPassword; // 비회원 댓글 삭제 시 필수
}
