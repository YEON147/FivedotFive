package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class CommentListResponse {

    private final List<CommentResponse> comments;
    private final int currentPage;
    private final int totalPages;
    private final long totalCount;
    private final boolean hasNext;

    private CommentListResponse(List<CommentResponse> comments, int currentPage,
                                 int totalPages, long totalCount, boolean hasNext) {
        this.comments = comments;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalCount = totalCount;
        this.hasNext = hasNext;
    }

    public static CommentListResponse of(Page<?> page, List<CommentResponse> comments) {
        return new CommentListResponse(
                comments,
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.hasNext()
        );
    }
}
