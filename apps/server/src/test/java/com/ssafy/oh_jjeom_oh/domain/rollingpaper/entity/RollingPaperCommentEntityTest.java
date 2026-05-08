package com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity;

import com.ssafy.oh_jjeom_oh.common.constant.CommentConstants;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RollingPaperComment 엔티티 단위 테스트")
class RollingPaperCommentEntityTest {

    private User commenter;
    private RollingPaper paper;
    private RollingPaperComment comment;

    @BeforeEach
    void setUp() {
        commenter = User.builder()
                .username("commenter")
                .nickname("작성자")
                .passwordHash("hashed")
                .role(Role.CHILD)
                .status(Status.ACTIVE)
                .build();

        User owner = User.builder()
                .username("owner")
                .nickname("오너")
                .passwordHash("hashed")
                .role(Role.CHILD)
                .status(Status.ACTIVE)
                .build();

        paper = RollingPaper.builder()
                .user(owner)
                .slug("paper-slug-01")
                .title("생일 축하해")
                .recipientName("홍길동")
                .targetDate(LocalDate.of(2026, 12, 25))
                .commentToken("comment-token-abc")
                .viewToken("view-token-xyz")
                .build();

        comment = RollingPaperComment.builder()
                .rollingPaper(paper)
                .user(commenter)
                .isUser(true)
                .senderName("작성자")
                .content("생일 축하해!")
                .slotIndex(3)
                .build();
    }

    // ===================== 빌더 기본값 =====================

    @Test
    @DisplayName("isUser 기본값은 true")
    void defaultIsUser_isTrue() {
        RollingPaperComment c = RollingPaperComment.builder()
                .rollingPaper(paper)
                .senderName("테스터")
                .content("내용")
                .build();
        assertThat(c.getIsUser()).isTrue();
    }

    @Test
    @DisplayName("guestPassword 기본값은 null")
    void defaultGuestPassword_isNull() {
        assertThat(comment.getGuestPassword()).isNull();
    }

    @Test
    @DisplayName("stickerKey 기본값은 null")
    void defaultStickerKey_isNull() {
        assertThat(comment.getStickerKey()).isNull();
    }

    // ===================== 필드 조회 =====================

    @Test
    @DisplayName("rollingPaper, user, senderName, content, slotIndex 정상 저장")
    void fieldsStoredCorrectly() {
        assertThat(comment.getRollingPaper()).isEqualTo(paper);
        assertThat(comment.getUser()).isEqualTo(commenter);
        assertThat(comment.getSenderName()).isEqualTo("작성자");
        assertThat(comment.getContent()).isEqualTo("생일 축하해!");
        assertThat(comment.getSlotIndex()).isEqualTo(3);
    }

    // ===================== 비회원 댓글 =====================

    @Nested
    @DisplayName("비회원 댓글")
    class GuestComment {

        @Test
        @DisplayName("user=null, isUser=false, guestPassword 설정 가능")
        void guestCommentHasNoUser() {
            RollingPaperComment guest = RollingPaperComment.builder()
                    .rollingPaper(paper)
                    .isUser(false)
                    .senderName("익명")
                    .content("축하합니다!")
                    .guestPassword("$2a$10$hashed_password")
                    .slotIndex(1)
                    .build();

            assertThat(guest.getUser()).isNull();
            assertThat(guest.getIsUser()).isFalse();
            assertThat(guest.getGuestPassword()).isEqualTo("$2a$10$hashed_password");
        }
    }

    // ===================== updateContent =====================

    @Nested
    @DisplayName("updateContent()")
    class UpdateContent {

        @Test
        @DisplayName("댓글 내용이 변경된다")
        void success() {
            comment.updateContent("수정된 내용입니다.");
            assertThat(comment.getContent()).isEqualTo("수정된 내용입니다.");
        }
    }

    // ===================== softDelete =====================

    @Nested
    @DisplayName("softDelete()")
    class SoftDelete {

        @Test
        @DisplayName("senderName이 삭제 표시 상수로 변경된다")
        void senderNameBecomesDeletedConstant() {
            comment.softDelete();
            assertThat(comment.getSenderName()).isEqualTo(CommentConstants.DELETED_SENDER_NAME);
        }

        @Test
        @DisplayName("content가 삭제 표시 상수로 변경된다")
        void contentBecomesDeletedConstant() {
            comment.softDelete();
            assertThat(comment.getContent()).isEqualTo(CommentConstants.DELETED_CONTENT);
        }

        @Test
        @DisplayName("user가 null로 초기화된다")
        void userBecomesNull() {
            comment.softDelete();
            assertThat(comment.getUser()).isNull();
        }

        @Test
        @DisplayName("isUser가 false로 변경된다")
        void isUserBecomesFalse() {
            comment.softDelete();
            assertThat(comment.getIsUser()).isFalse();
        }

        @Test
        @DisplayName("softDelete 후에도 slotIndex는 유지된다")
        void slotIndexPreservedAfterSoftDelete() {
            comment.softDelete();
            assertThat(comment.getSlotIndex()).isEqualTo(3);
        }
    }
}
