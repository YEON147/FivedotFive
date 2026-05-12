package com.ssafy.oh_jjeom_oh.domain.file.dto.response;

import lombok.Builder;

@Builder
public record ImageUploadResponse(
        String imageKey
) {
    public static ImageUploadResponse of(String imageKey) {
        return ImageUploadResponse.builder()
                .imageKey(imageKey)
                .build();
    }
}
