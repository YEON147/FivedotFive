package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommentVerifyResponse {

    private String verifyToken;
    private String content;
}
