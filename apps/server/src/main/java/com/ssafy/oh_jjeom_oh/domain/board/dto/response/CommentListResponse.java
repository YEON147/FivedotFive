package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class CommentListResponse {

    private static final int PAGE_SIZE = 6;

    private final List<CommentResponse> comments;
    private final int currentPage;
    private final int totalPages;
    private final long totalCount;
    private final boolean hasNext;
    /** 마지막 페이지의 슬롯 6개가 모두 찬 경우 true — 프론트에서 빈 새 페이지 렌더링 여부 판단에 사용 */
    private final boolean isLastPageFull;

    private CommentListResponse(List<CommentResponse> comments, int currentPage,
                                 int totalPages, long totalCount, boolean hasNext,
                                 boolean isLastPageFull) {
        this.comments = comments;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalCount = totalCount;
        this.hasNext = hasNext;
        this.isLastPageFull = isLastPageFull;
    }

    public static CommentListResponse of(Page<?> page, List<CommentResponse> comments) {
        long totalCount = page.getTotalElements();
        boolean isLastPageFull = totalCount > 0 && totalCount % PAGE_SIZE == 0;
        return new CommentListResponse(
                comments,
                page.getNumber(),
                page.getTotalPages(),
                totalCount,
                page.hasNext(),
                isLastPageFull
        );
    }
}
