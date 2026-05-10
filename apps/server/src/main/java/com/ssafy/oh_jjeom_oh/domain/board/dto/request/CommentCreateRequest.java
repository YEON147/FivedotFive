package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "슬롯 번호는 필수입니다.")
    @Min(value = 0, message = "댓글 슬롯 번호는 0 이상이어야 합니다.")
    private Integer slotIndex; // 보드 댓글 슬롯 위치 (페이지 * 6 + 페이지 내 위치)

    @Size(max = 8, message = "닉네임은 8자 이내여야 합니다.")
    private String guestNickname; // 비로그인 댓글 작성 시 필수

    private String guestPassword; // 비로그인 댓글 수정/삭제용 비밀번호
}
