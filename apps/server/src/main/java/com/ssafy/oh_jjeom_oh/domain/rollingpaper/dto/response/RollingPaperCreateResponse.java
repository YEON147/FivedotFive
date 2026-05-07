package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import lombok.Getter;

@Getter
public class RollingPaperCreateResponse {

    private final String slug;
    private final String commentToken;
    private final String viewToken;

    private RollingPaperCreateResponse(String slug, String commentToken, String viewToken) {
        this.slug = slug;
        this.commentToken = commentToken;
        this.viewToken = viewToken;
    }

    public static RollingPaperCreateResponse from(RollingPaper paper) {
        return new RollingPaperCreateResponse(
                paper.getSlug(),
                paper.getCommentToken(),
                paper.getViewToken()
        );
    }
}
