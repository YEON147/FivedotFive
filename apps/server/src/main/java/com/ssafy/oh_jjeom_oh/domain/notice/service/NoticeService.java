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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.region.static}")
    private String region;

    // ─── 조회 ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NoticeListResponse getNotices() {
        List<Notice> notices = isAdmin()
                ? noticeRepository.findAllByOrderByIsPinnedDescStartAtDesc()
                : noticeRepository.findActiveNotices(LocalDateTime.now());
        return NoticeListResponse.of(notices);
    }

    @Transactional(readOnly = true)
    public NoticeDetailResponse getNotice(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTICE_NOT_FOUND));

        if (!isAdmin() && !isActive(notice)) {
            throw new CustomException(ErrorCode.NOTICE_NOT_FOUND);
        }
        return NoticeDetailResponse.of(notice);
    }

    @Transactional(readOnly = true)
    public BannerListResponse getBanners() {
        List<Notice> banners = noticeRepository.findActiveBanners(LocalDateTime.now());
        return BannerListResponse.of(banners);
    }

    // ─── 작성 ───────────────────────────────────────────────────────────────────

    @Transactional
    public NoticeCreateResponse createNotice(NoticeCreateRequest request, List<MultipartFile> images) {
        validatePeriod(request.getStartAt(), request.getEndAt());

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .bannerText(request.getBannerText())
                .isPinned(Boolean.TRUE.equals(request.getIsPinned()))
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .build();
        noticeRepository.save(notice);

        if (images != null && !images.isEmpty()) {
            uploadImages(notice, images);
        }

        return NoticeCreateResponse.of(notice.getId());
    }

    // ─── 수정 ───────────────────────────────────────────────────────────────────

    @Transactional
    public void updateNotice(Long id, NoticeUpdateRequest request, List<MultipartFile> images) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTICE_NOT_FOUND));

        // 값이 있을 때만 빈 문자열 검사
        if (request.getTitle() != null && request.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목은 빈 문자열일 수 없습니다.");
        }
        if (request.getBannerText() != null && request.getBannerText().isBlank()) {
            throw new IllegalArgumentException("배너 문구는 빈 문자열일 수 없습니다.");
        }

        LocalDateTime startAt = request.getStartAt() != null ? request.getStartAt() : notice.getStartAt();
        LocalDateTime endAt = request.getEndAt() != null ? request.getEndAt() : notice.getEndAt();
        validatePeriod(startAt, endAt);

        notice.update(request.getTitle(), request.getBannerText(), request.getIsPinned(), request.getStartAt(), request.getEndAt());

        if (images != null && !images.isEmpty()) {
            // 기존 이미지 S3 키 수집 (커밋 후 삭제용)
            List<String> oldS3Keys = notice.getImages().stream()
                    .map(img -> extractS3Key(img.getImageUrl()))
                    .toList();

            notice.clearImages();
            uploadImages(notice, images);

            // DB 커밋 성공 후 기존 S3 파일 삭제
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deleteS3Objects(oldS3Keys);
                }
            });
        }
    }

    // ─── 삭제 ───────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteNotice(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTICE_NOT_FOUND));

        List<String> s3Keys = notice.getImages().stream()
                .map(img -> extractS3Key(img.getImageUrl()))
                .toList();

        noticeRepository.delete(notice);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteS3Objects(s3Keys);
            }
        });
    }

    // ─── 내부 유틸 ──────────────────────────────────────────────────────────────

    private void uploadImages(Notice notice, List<MultipartFile> images) {
        List<MultipartFile> sorted = new ArrayList<>(images);
        // 파일명에서 숫자를 추출해 정수 기준 정렬 (1, 2, 10 순서 보장)
        sorted.sort(Comparator.comparingInt(f -> {
            String name = f.getOriginalFilename() != null ? f.getOriginalFilename() : "";
            String digits = name.replaceAll("\\D", "");
            return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits);
        }));

        for (int i = 0; i < sorted.size(); i++) {
            MultipartFile file = sorted.get(i);
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
            String s3Key = "notices/" + notice.getId() + "/" + UUID.randomUUID() + "_" + originalFilename;
            String imageUrl = uploadToS3(file, s3Key);

            NoticeImage noticeImage = NoticeImage.builder()
                    .notice(notice)
                    .imageUrl(imageUrl)
                    .displayOrder(i + 1)
                    .build();
            notice.addImage(noticeImage);
        }
    }

    private String uploadToS3(MultipartFile file, String s3Key) {
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));
            return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;
        } catch (IOException e) {
            throw new RuntimeException("S3 이미지 업로드에 실패했습니다.", e);
        }
    }

    private void deleteS3Objects(List<String> s3Keys) {
        for (String key : s3Keys) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build());
            } catch (Exception e) {
                log.warn("S3 파일 삭제 실패: {}", key, e);
            }
        }
    }

    private String extractS3Key(String imageUrl) {
        // "https://{bucket}.s3.{region}.amazonaws.com/{key}" 에서 key 추출
        int idx = imageUrl.indexOf(".amazonaws.com/");
        if (idx == -1) return imageUrl;
        return imageUrl.substring(idx + ".amazonaws.com/".length());
    }

    private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        if (endAt.isBefore(startAt)) {
            throw new IllegalArgumentException("종료일시는 시작일시보다 이후여야 합니다.");
        }
    }

    private boolean isActive(Notice notice) {
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(notice.getStartAt()) && !now.isAfter(notice.getEndAt());
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
