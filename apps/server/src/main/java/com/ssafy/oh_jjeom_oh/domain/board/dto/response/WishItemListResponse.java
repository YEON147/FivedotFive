package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class WishItemListResponse {

    private final List<WishItemResponse> items;

    private WishItemListResponse(List<WishItemResponse> items) {
        this.items = items;
    }

    public static WishItemListResponse of(List<WishItemResponse> items) {
        return new WishItemListResponse(items);
    }
}
