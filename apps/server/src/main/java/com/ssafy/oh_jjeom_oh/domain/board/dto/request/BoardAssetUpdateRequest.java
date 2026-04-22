package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BoardAssetUpdateRequest {

    @NotBlank(message = "assetKey는 필수입니다.")
    private String assetKey;
}
