package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItemStatus;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WishItemResponse {

    private final Integer slotIndex;
    private final String itemName;   // null이면 빈 슬롯
    private final String iconKey;    // board_assets GIFT_STICKER에서 매핑
    private final Integer likeCount;
    private final WishItemStatus status;

    private WishItemResponse(Integer slotIndex, String itemName, String iconKey,
                              Integer likeCount, WishItemStatus status) {
        this.slotIndex = slotIndex;
        this.itemName = itemName;
        this.iconKey = iconKey;
        this.likeCount = likeCount;
        this.status = status;
    }

    public static WishItemResponse from(WishItem item, String iconKey) {
        return new WishItemResponse(
                item.getSlotIndex(),
                item.getItemName(),
                iconKey,
                item.getLikeCount(),
                item.getStatus()
        );
    }

    // 빈 슬롯
    public static WishItemResponse empty(int slotIndex) {
        return new WishItemResponse(slotIndex, null, null, 0, null);
    }
}
