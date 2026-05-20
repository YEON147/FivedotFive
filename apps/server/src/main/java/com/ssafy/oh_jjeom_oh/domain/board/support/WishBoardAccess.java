package com.ssafy.oh_jjeom_oh.domain.board.support;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;

/**
 * 위시보드 조회·편집 권한 (롤링페이퍼 {@code getRollingPaper}와 동일한 개념).
 * - 저장본: {@code savedByUser} 만 조회 가능, 편집 불가
 * - 원본: 공개 또는 소유자 조회, 소유자만 편집
 */
public final class WishBoardAccess {

    private WishBoardAccess() {
    }

    public static boolean isOwner(WishBoard board, Long userId) {
        return userId != null
                && board.getUser() != null
                && board.getUser().getId().equals(userId);
    }

    public static boolean isSaver(WishBoard board, Long userId) {
        return userId != null
                && board.getSavedByUser() != null
                && board.getSavedByUser().getId().equals(userId);
    }

    public static boolean canView(WishBoard board, Long userId) {
        if (Boolean.TRUE.equals(board.getIsSavedCopy())) {
            return isSaver(board, userId);
        }
        if (Boolean.TRUE.equals(board.getIsPublic())) {
            return true;
        }
        return isOwner(board, userId);
    }

    public static void requireView(WishBoard board, Long userId) {
        if (canView(board, userId)) {
            return;
        }
        if (Boolean.TRUE.equals(board.getIsSavedCopy())) {
            throw new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND);
        }
        throw new CustomException(ErrorCode.BOARD_PRIVATE);
    }

    public static void requireEdit(WishBoard board, Long userId) {
        if (Boolean.TRUE.equals(board.getIsSavedCopy())) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }
        if (!isOwner(board, userId)) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }
    }

    /** 단건 조회 응답용 — 저장본은 소유자 UI가 아닌 읽기 전용 */
    public static boolean isOwnerForDetailResponse(WishBoard board, Long userId) {
        if (Boolean.TRUE.equals(board.getIsSavedCopy())) {
            return false;
        }
        return isOwner(board, userId);
    }
}
