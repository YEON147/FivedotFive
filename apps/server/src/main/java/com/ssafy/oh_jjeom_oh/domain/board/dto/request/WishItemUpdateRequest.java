package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WishItemUpdateRequest {

    @NotBlank(message = "선물 이름은 필수입니다.")
    private String itemName;

    private String iconKey; // 선택 - GIFT_ICON assetKey 업데이트용
}
