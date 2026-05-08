package com.ssafy.oh_jjeom_oh.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.region.static}")
    private String region;

    /**
     * S3에 파일을 업로드하고 전체 URL을 반환합니다.
     */
    public String uploadFile(MultipartFile file, String s3Key) {
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
            throw new RuntimeException("S3 파일 업로드에 실패했습니다.", e);
        }
    }

    /**
     * S3에서 파일을 삭제합니다.
     */
    public void deleteFile(String s3Key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build());
        } catch (Exception e) {
            log.warn("S3 파일 삭제 실패: {}", s3Key, e);
        }
    }

    /**
     * S3에서 여러 파일을 삭제합니다.
     */
    public void deleteFiles(List<String> s3Keys) {
        for (String key : s3Keys) {
            deleteFile(key);
        }
    }

    /**
     * 이미지 URL에서 S3 키를 추출합니다.
     */
    public String extractS3Key(String imageUrl) {
        if (imageUrl == null) return null;
        int idx = imageUrl.indexOf(".amazonaws.com/");
        if (idx == -1) return imageUrl;
        return imageUrl.substring(idx + ".amazonaws.com/".length());
    }
}
