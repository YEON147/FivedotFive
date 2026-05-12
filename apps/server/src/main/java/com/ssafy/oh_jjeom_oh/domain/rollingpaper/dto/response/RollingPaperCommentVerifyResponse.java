package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RollingPaperCommentVerifyResponse {

    private String verifyToken;
    private String content;
}
