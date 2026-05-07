package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class RollingPaperCommentListResponse {

    private static final int PAGE_SIZE = 6;

    private final List<RollingPaperCommentResponse> comments;
    private final int currentPage;
    private final int totalPages;
    private final long totalCount;
    private final boolean hasNext;
    private final boolean isLastPageFull;

    private RollingPaperCommentListResponse(List<RollingPaperCommentResponse> comments,
                                             int currentPage, int totalPages,
                                             long totalCount, boolean hasNext,
                                             boolean isLastPageFull) {
        this.comments = comments;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalCount = totalCount;
        this.hasNext = hasNext;
        this.isLastPageFull = isLastPageFull;
    }

    public static RollingPaperCommentListResponse of(Page<?> page,
                                                      List<RollingPaperCommentResponse> comments) {
        long totalCount = page.getTotalElements();
        boolean isLastPageFull = totalCount > 0 && totalCount % PAGE_SIZE == 0;
        return new RollingPaperCommentListResponse(
                comments,
                page.getNumber(),
                page.getTotalPages(),
                totalCount,
                page.hasNext(),
                isLastPageFull
        );
    }
}
