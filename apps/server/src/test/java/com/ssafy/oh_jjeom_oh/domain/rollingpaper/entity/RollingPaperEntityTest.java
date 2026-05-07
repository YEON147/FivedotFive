package com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity;

import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RollingPaper 엔티티 단위 테스트")
class RollingPaperEntityTest {

    private User owner;
    private RollingPaper paper;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner")
                .nickname("오너")
                .passwordHash("hashed")
                .role(Role.CHILD)
                .status(Status.ACTIVE)
                .build();

        paper = RollingPaper.builder()
                .user(owner)
                .slug("test-slug-01")
                .title("생일 축하해")
                .recipientName("홍길동")
                .targetDate(LocalDate.of(2026, 12, 25))
                .commentToken("comment-token-abc")
                .viewToken("view-token-xyz")
                .build();
    }

    // ===================== 빌더 기본값 =====================

    @Test
    @DisplayName("isSavedCopy 기본값은 false")
    void defaultIsSavedCopy_isFalse() {
        assertThat(paper.getIsSavedCopy()).isFalse();
    }

    @Test
    @DisplayName("deletedAt 기본값은 null")
    void defaultDeletedAt_isNull() {
        assertThat(paper.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("savedByUser 기본값은 null")
    void defaultSavedByUser_isNull() {
        assertThat(paper.getSavedByUser()).isNull();
    }

    @Test
    @DisplayName("imageKey 기본값은 null")
    void defaultImageKey_isNull() {
        assertThat(paper.getImageKey()).isNull();
    }

    // ===================== 필드 조회 =====================

    @Test
    @DisplayName("slug, title, recipientName, targetDate, token 정상 저장")
    void fieldsStoredCorrectly() {
        assertThat(paper.getSlug()).isEqualTo("test-slug-01");
        assertThat(paper.getTitle()).isEqualTo("생일 축하해");
        assertThat(paper.getRecipientName()).isEqualTo("홍길동");
        assertThat(paper.getTargetDate()).isEqualTo(LocalDate.of(2026, 12, 25));
        assertThat(paper.getCommentToken()).isEqualTo("comment-token-abc");
        assertThat(paper.getViewToken()).isEqualTo("view-token-xyz");
        assertThat(paper.getUser()).isEqualTo(owner);
    }

    // ===================== updateTitle =====================

    @Nested
    @DisplayName("updateTitle()")
    class UpdateTitle {

        @Test
        @DisplayName("제목이 변경된다")
        void success() {
            paper.updateTitle("졸업 축하해");
            assertThat(paper.getTitle()).isEqualTo("졸업 축하해");
        }
    }

    // ===================== updateRecipientName =====================

    @Nested
    @DisplayName("updateRecipientName()")
    class UpdateRecipientName {

        @Test
        @DisplayName("받는 사람 이름이 변경된다")
        void success() {
            paper.updateRecipientName("김철수");
            assertThat(paper.getRecipientName()).isEqualTo("김철수");
        }
    }

    // ===================== updateTargetDate =====================

    @Nested
    @DisplayName("updateTargetDate()")
    class UpdateTargetDate {

        @Test
        @DisplayName("공개 기준일이 변경된다")
        void success() {
            paper.updateTargetDate(LocalDate.of(2027, 1, 1));
            assertThat(paper.getTargetDate()).isEqualTo(LocalDate.of(2027, 1, 1));
        }
    }

    // ===================== updateImageKey =====================

    @Nested
    @DisplayName("updateImageKey()")
    class UpdateImageKey {

        @Test
        @DisplayName("이미지 키가 설정된다")
        void success() {
            paper.updateImageKey("images/recipient/photo.jpg");
            assertThat(paper.getImageKey()).isEqualTo("images/recipient/photo.jpg");
        }

        @Test
        @DisplayName("null로 초기화 가능")
        void clearImageKey() {
            paper.updateImageKey("images/recipient/photo.jpg");
            paper.updateImageKey(null);
            assertThat(paper.getImageKey()).isNull();
        }
    }

    // ===================== softDelete / isDeleted =====================

    @Nested
    @DisplayName("softDelete() / isDeleted()")
    class SoftDelete {

        @Test
        @DisplayName("softDelete 호출 전 isDeleted()는 false")
        void notDeletedByDefault() {
            assertThat(paper.isDeleted()).isFalse();
        }

        @Test
        @DisplayName("softDelete 호출 후 deletedAt이 설정된다")
        void deletedAtIsSetAfterSoftDelete() {
            paper.softDelete();
            assertThat(paper.getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("softDelete 호출 후 isDeleted()는 true")
        void isDeletedAfterSoftDelete() {
            paper.softDelete();
            assertThat(paper.isDeleted()).isTrue();
        }
    }

    // ===================== 독립 복사본 빌더 =====================

    @Nested
    @DisplayName("독립 복사본(isSavedCopy=true) 생성")
    class SavedCopy {

        @Test
        @DisplayName("isSavedCopy=true, commentToken/viewToken=null인 복사본 생성 가능")
        void savedCopyHasNullTokens() {
            User saver = User.builder()
                    .username("saver")
                    .nickname("저장자")
                    .passwordHash("hashed")
                    .role(Role.CHILD)
                    .status(Status.ACTIVE)
                    .build();

            RollingPaper copy = RollingPaper.builder()
                    .user(owner)
                    .slug("copy-slug-01")
                    .title(paper.getTitle())
                    .recipientName(paper.getRecipientName())
                    .targetDate(paper.getTargetDate())
                    .isSavedCopy(true)
                    .savedByUser(saver)
                    .saveSource("RECEIVED")
                    .build();

            assertThat(copy.getIsSavedCopy()).isTrue();
            assertThat(copy.getSavedByUser()).isEqualTo(saver);
            assertThat(copy.getSaveSource()).isEqualTo("RECEIVED");
            assertThat(copy.getCommentToken()).isNull();
            assertThat(copy.getViewToken()).isNull();
        }
    }
}
