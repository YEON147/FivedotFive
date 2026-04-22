package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommentCreateRequest {

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(max = 200, message = "댓글은 200자 이내여야 합니다.")
    private String content;

    private String stickerKey; // 선택 (null 허용)
}
