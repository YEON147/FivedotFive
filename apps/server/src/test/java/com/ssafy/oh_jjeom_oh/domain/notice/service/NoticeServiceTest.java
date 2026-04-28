package com.ssafy.oh_jjeom_oh.domain.notice.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.BannerListResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeListResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.entity.Notice;
import com.ssafy.oh_jjeom_oh.domain.notice.entity.NoticeImage;
import com.ssafy.oh_jjeom_oh.domain.notice.repository.NoticeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoticeServiceTest {

    @InjectMocks
    private NoticeService noticeService;

    @Mock
    private NoticeRepository noticeRepository;

    @Mock
    private S3Client s3Client;

    private MockedStatic<TransactionSynchronizationManager> txSyncManager;

    private static final LocalDateTime PAST = LocalDateTime.of(2020, 1, 1, 0, 0);
    private static final LocalDateTime FUTURE = LocalDateTime.of(2099, 12, 31, 23, 59);
    private static final LocalDateTime NOW_PLUS_1 = LocalDateTime.now().plusDays(1);
    private static final LocalDateTime NOW_MINUS_1 = LocalDateTime.now().minusDays(1);

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(noticeService, "bucket", "test-bucket");
        ReflectionTestUtils.setField(noticeService, "region", "ap-northeast-2");

        // TransactionSynchronizationManager 정적 메서드 모킹 (S3 afterCommit 삭제용)
        txSyncManager = mockStatic(TransactionSynchronizationManager.class);

        // 기본적으로 비인증 상태
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        txSyncManager.close();
        SecurityContextHolder.clearContext();
    }

    // ─── 헬퍼 ───────────────────────────────────────────────────────────────────

    private void setAdminContext() {
        var auth = new UsernamePasswordAuthenticationToken(
                "ohjeomoh", null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private Notice buildNotice(Long id, String title, LocalDateTime start, LocalDateTime end, boolean pinned) {
        Notice notice = Notice.builder()
                .title(title)
                .bannerText("배너")
                .isPinned(pinned)
                .startAt(start)
                .endAt(end)
                .build();
        ReflectionTestUtils.setField(notice, "id", id);
        return notice;
    }

    private NoticeCreateRequest buildCreateRequest(String title, LocalDateTime start, LocalDateTime end) {
        NoticeCreateRequest req = new NoticeCreateRequest();
        ReflectionTestUtils.setField(req, "title", title);
        ReflectionTestUtils.setField(req, "bannerText", "배너");
        ReflectionTestUtils.setField(req, "isPinned", true);
        ReflectionTestUtils.setField(req, "startAt", start);
        ReflectionTestUtils.setField(req, "endAt", end);
        return req;
    }

    private MultipartFile buildMockFile(String filename) throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        given(file.getOriginalFilename()).willReturn(filename);
        given(file.getContentType()).willReturn("image/png");
        given(file.getSize()).willReturn(100L);
        given(file.getBytes()).willReturn(new byte[100]);
        return file;
    }

    // ─── getNotices ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("공지 목록 조회 - 비로그인은 기간 내 공지만 반환")
    void getNotices_anonymous_returnsActiveOnly() {
        Notice active = buildNotice(1L, "기간 내 공지", NOW_MINUS_1, FUTURE, true);
        given(noticeRepository.findActiveNotices(any())).willReturn(List.of(active));

        NoticeListResponse response = noticeService.getNotices();

        assertThat(response.getNotices()).hasSize(1);
        assertThat(response.getNotices().get(0).getTitle()).isEqualTo("기간 내 공지");
        verify(noticeRepository).findActiveNotices(any());
        verify(noticeRepository, never()).findAllByOrderByIsPinnedDescStartAtDesc();
    }

    @Test
    @DisplayName("공지 목록 조회 - ADMIN은 전체 공지 반환")
    void getNotices_admin_returnsAll() {
        setAdminContext();
        Notice active = buildNotice(1L, "기간 내", NOW_MINUS_1, FUTURE, true);
        Notice past = buildNotice(2L, "기간 외", PAST, PAST.plusDays(1), false);
        given(noticeRepository.findAllByOrderByIsPinnedDescStartAtDesc()).willReturn(List.of(active, past));

        NoticeListResponse response = noticeService.getNotices();

        assertThat(response.getNotices()).hasSize(2);
        verify(noticeRepository, never()).findActiveNotices(any());
        verify(noticeRepository).findAllByOrderByIsPinnedDescStartAtDesc();
    }

    @Test
    @DisplayName("공지 목록 조회 - 공지 없으면 빈 배열 반환")
    void getNotices_empty() {
        given(noticeRepository.findActiveNotices(any())).willReturn(List.of());

        NoticeListResponse response = noticeService.getNotices();

        assertThat(response.getNotices()).isEmpty();
    }

    // ─── getNotice ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("공지 상세 조회 - 기간 내 공지는 비로그인도 조회 가능")
    void getNotice_activeNotice_anonymous_success() {
        Notice notice = buildNotice(1L, "점검 안내", NOW_MINUS_1, FUTURE, false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        NoticeDetailResponse response = noticeService.getNotice(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("점검 안내");
    }

    @Test
    @DisplayName("공지 상세 조회 - 기간 외 공지는 비로그인이면 404")
    void getNotice_expiredNotice_anonymous_throws404() {
        Notice expired = buildNotice(1L, "지난 공지", PAST, PAST.plusDays(1), false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(expired));

        assertThatThrownBy(() -> noticeService.getNotice(1L))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.NOTICE_NOT_FOUND));
    }

    @Test
    @DisplayName("공지 상세 조회 - 기간 외 공지도 ADMIN은 조회 가능")
    void getNotice_expiredNotice_admin_success() {
        setAdminContext();
        Notice expired = buildNotice(1L, "지난 공지", PAST, PAST.plusDays(1), false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(expired));

        NoticeDetailResponse response = noticeService.getNotice(1L);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("공지 상세 조회 - 존재하지 않으면 404")
    void getNotice_notFound_throws404() {
        given(noticeRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> noticeService.getNotice(999L))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.NOTICE_NOT_FOUND));
    }

    // ─── getBanners ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("배너 목록 조회 - bannerText 있는 기간 내 공지만 반환")
    void getBanners_returnsActiveBanners() {
        Notice banner = buildNotice(1L, "이벤트", NOW_MINUS_1, FUTURE, true);
        given(noticeRepository.findActiveBanners(any())).willReturn(List.of(banner));

        BannerListResponse response = noticeService.getBanners();

        assertThat(response.getBanners()).hasSize(1);
        assertThat(response.getBanners().get(0).getId()).isEqualTo(1L);
        assertThat(response.getBanners().get(0).getBannerText()).isEqualTo("배너");
    }

    @Test
    @DisplayName("배너 목록 조회 - 배너 없으면 빈 배열 반환")
    void getBanners_empty() {
        given(noticeRepository.findActiveBanners(any())).willReturn(List.of());

        BannerListResponse response = noticeService.getBanners();

        assertThat(response.getBanners()).isEmpty();
    }

    // ─── createNotice ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("공지 작성 성공 - 이미지 없이 작성")
    void createNotice_withoutImages_success() {
        NoticeCreateRequest req = buildCreateRequest("점검 안내", NOW_MINUS_1, FUTURE);
        // save() 호출 시 ID를 엔티티에 직접 세팅 (실제 JPA save 동작 시뮬레이션)
        given(noticeRepository.save(any())).willAnswer(invocation -> {
            Notice n = invocation.getArgument(0);
            ReflectionTestUtils.setField(n, "id", 1L);
            return n;
        });

        NoticeCreateResponse response = noticeService.createNotice(req, null);

        assertThat(response.getId()).isEqualTo(1L);
        verify(noticeRepository).save(any());
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("공지 작성 성공 - 이미지 파일명 오름차순으로 displayOrder 부여")
    void createNotice_withImages_sortedByFilename() throws IOException {
        NoticeCreateRequest req = buildCreateRequest("점검 안내", NOW_MINUS_1, FUTURE);
        // save() 시 ID 세팅 (uploadImages는 save 이후 같은 notice 객체에 이미지 추가)
        given(noticeRepository.save(any())).willAnswer(invocation -> {
            Notice n = invocation.getArgument(0);
            ReflectionTestUtils.setField(n, "id", 1L);
            return n;
        });
        given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .willReturn(PutObjectResponse.builder().build());

        // 파일명 순서가 뒤집혀 있어도 오름차순 정렬되어야 함
        MultipartFile file2 = buildMockFile("02_banner.png");
        MultipartFile file1 = buildMockFile("01_banner.png");
        List<MultipartFile> images = List.of(file2, file1);

        noticeService.createNotice(req, images);

        // S3 putObject 2회 호출 확인
        verify(s3Client, times(2)).putObject(any(PutObjectRequest.class), any(RequestBody.class));

        // 서비스에서 save()에 전달된 notice 객체를 캡처하여 이미지 확인
        ArgumentCaptor<Notice> noticeCaptor = ArgumentCaptor.forClass(Notice.class);
        verify(noticeRepository).save(noticeCaptor.capture());
        Notice capturedNotice = noticeCaptor.getValue();

        assertThat(capturedNotice.getImages()).hasSize(2);
        assertThat(capturedNotice.getImages().get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(capturedNotice.getImages().get(1).getDisplayOrder()).isEqualTo(2);
        // 파일명 정렬 확인 (01이 먼저)
        assertThat(capturedNotice.getImages().get(0).getImageUrl()).contains("01_banner.png");
        assertThat(capturedNotice.getImages().get(1).getImageUrl()).contains("02_banner.png");
    }

    @Test
    @DisplayName("공지 작성 실패 - endAt이 startAt보다 이전이면 예외")
    void createNotice_invalidPeriod_throwsException() {
        NoticeCreateRequest req = buildCreateRequest("잘못된 공지", FUTURE, NOW_MINUS_1);

        assertThatThrownBy(() -> noticeService.createNotice(req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("종료일시는 시작일시보다 이후여야 합니다.");
    }

    @Test
    @DisplayName("공지 작성 실패 - startAt과 endAt이 같으면 예외")
    void createNotice_samePeriod_throwsException() {
        LocalDateTime same = LocalDateTime.now();
        NoticeCreateRequest req = buildCreateRequest("동일 시각", same, same);

        assertThatThrownBy(() -> noticeService.createNotice(req, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ─── updateNotice ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("공지 수정 성공 - 제목 변경")
    void updateNotice_titleChange_success() {
        Notice notice = buildNotice(1L, "원래 제목", NOW_MINUS_1, FUTURE, false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        NoticeUpdateRequest req = new NoticeUpdateRequest();
        ReflectionTestUtils.setField(req, "title", "바뀐 제목");

        noticeService.updateNotice(1L, req, null);

        assertThat(notice.getTitle()).isEqualTo("바뀐 제목");
    }

    @Test
    @DisplayName("공지 수정 성공 - 이미지 교체 시 기존 S3 파일 삭제 예약")
    void updateNotice_withImages_schedulesS3Delete() throws IOException {
        // 기존 이미지 1장 있는 공지
        Notice notice = buildNotice(1L, "제목", NOW_MINUS_1, FUTURE, false);
        NoticeImage oldImage = NoticeImage.builder()
                .notice(notice)
                .imageUrl("https://test-bucket.s3.ap-northeast-2.amazonaws.com/notices/1/old_img.png")
                .displayOrder(1)
                .build();
        ReflectionTestUtils.setField(notice, "images", new java.util.ArrayList<>(List.of(oldImage)));
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));
        given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .willReturn(PutObjectResponse.builder().build());

        NoticeUpdateRequest req = new NoticeUpdateRequest();
        MultipartFile newFile = buildMockFile("01_new.png");

        noticeService.updateNotice(1L, req, List.of(newFile));

        // 새 이미지 S3 업로드 호출 확인
        verify(s3Client, times(1)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
        // TransactionSynchronizationManager에 afterCommit 콜백 등록 확인
        txSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(any()));
    }

    @Test
    @DisplayName("공지 수정 실패 - 존재하지 않는 공지")
    void updateNotice_notFound_throws404() {
        given(noticeRepository.findById(999L)).willReturn(Optional.empty());
        NoticeUpdateRequest req = new NoticeUpdateRequest();

        assertThatThrownBy(() -> noticeService.updateNotice(999L, req, null))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.NOTICE_NOT_FOUND));
    }

    @Test
    @DisplayName("공지 수정 실패 - endAt이 startAt보다 이전이면 예외")
    void updateNotice_invalidPeriod_throwsException() {
        Notice notice = buildNotice(1L, "제목", NOW_MINUS_1, FUTURE, false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        NoticeUpdateRequest req = new NoticeUpdateRequest();
        ReflectionTestUtils.setField(req, "startAt", FUTURE);
        ReflectionTestUtils.setField(req, "endAt", NOW_MINUS_1);

        assertThatThrownBy(() -> noticeService.updateNotice(1L, req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("종료일시는 시작일시보다 이후여야 합니다.");
    }

    // ─── deleteNotice ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("공지 삭제 성공 - S3 파일 삭제 afterCommit 예약")
    void deleteNotice_success_schedulesS3Delete() {
        Notice notice = buildNotice(1L, "삭제 대상", NOW_MINUS_1, FUTURE, false);
        NoticeImage img = NoticeImage.builder()
                .notice(notice)
                .imageUrl("https://test-bucket.s3.ap-northeast-2.amazonaws.com/notices/1/img.png")
                .displayOrder(1)
                .build();
        ReflectionTestUtils.setField(notice, "images", new java.util.ArrayList<>(List.of(img)));
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        noticeService.deleteNotice(1L);

        verify(noticeRepository).delete(notice);
        txSyncManager.verify(() -> TransactionSynchronizationManager.registerSynchronization(any()));
    }

    @Test
    @DisplayName("공지 삭제 성공 - 이미지 없는 공지 삭제")
    void deleteNotice_withoutImages_success() {
        Notice notice = buildNotice(1L, "이미지 없는 공지", NOW_MINUS_1, FUTURE, false);
        given(noticeRepository.findById(1L)).willReturn(Optional.of(notice));

        noticeService.deleteNotice(1L);

        verify(noticeRepository).delete(notice);
        // 이미지 없으므로 S3 삭제는 afterCommit에서 빈 목록으로 호출됨
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    @DisplayName("공지 삭제 실패 - 존재하지 않는 공지")
    void deleteNotice_notFound_throws404() {
        given(noticeRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> noticeService.deleteNotice(999L))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.NOTICE_NOT_FOUND));
    }
}
