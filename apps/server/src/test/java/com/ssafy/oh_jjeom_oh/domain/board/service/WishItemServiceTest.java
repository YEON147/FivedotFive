package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishItemUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemLikeResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItemStatus;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WishItemServiceTest {

    @InjectMocks
    private WishItemService wishItemService;

    @Mock private WishBoardRepository wishBoardRepository;
    @Mock private WishItemRepository wishItemRepository;
    @Mock private BoardAssetRepository boardAssetRepository;

    private User owner;
    private User other;
    private WishBoard board;
    private WishItem item;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner").nickname("주인").passwordHash("hashed")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        other = User.builder()
                .username("other").nickname("친구").passwordHash("hashed")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 2L);

        board = WishBoard.builder()
                .user(owner).boardSlug("abc123def4").isPublic(true).build();

        item = WishItem.builder()
                .board(board).slotIndex(1).itemName("레고")
                .likeCount(5).status(WishItemStatus.WANTED).build();
    }

    // ===================== getItems =====================

    @Test
    @DisplayName("위시 아이템 슬롯 전체 조회 성공")
    void getItems_success() {
        given(wishBoardRepository.findByUser_Id(1L)).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardOrderBySlotIndex(board)).willReturn(List.of(item));
        given(boardAssetRepository.findByBoardAndAssetType(board, AssetType.GIFT_STICKER))
                .willReturn(List.of(
                        BoardAsset.builder().board(board).assetType(AssetType.GIFT_STICKER)
                                .assetKey("icon/toy.png").slotIndex(1).build()
                ));

        WishItemListResponse response = wishItemService.getItems(1L);

        assertThat(response.getItems()).hasSize(3);
        assertThat(response.getItems().get(0).getItemName()).isEqualTo("레고");
        assertThat(response.getItems().get(0).getIconKey()).isEqualTo("icon/toy.png");
        assertThat(response.getItems().get(1).getItemName()).isNull(); // 빈 슬롯
    }

    // ===================== updateItem =====================

    @Test
    @DisplayName("위시 아이템 수정 성공 - 기존 아이템 업데이트")
    void updateItem_update_success() {
        WishItemUpdateRequest request = new WishItemUpdateRequest();
        ReflectionTestUtils.setField(request, "itemName", "닌텐도");
        ReflectionTestUtils.setField(request, "iconKey", "icon/game.png");

        given(wishBoardRepository.findByUser_Id(1L)).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 1)).willReturn(Optional.of(item));
        given(boardAssetRepository.findByBoardAndAssetTypeAndSlotIndex(board, AssetType.GIFT_STICKER, 1))
                .willReturn(Optional.of(BoardAsset.builder().board(board).assetType(AssetType.GIFT_STICKER)
                        .assetKey("old_key").slotIndex(1).build()));

        wishItemService.updateItem(1L, 1, request);

        assertThat(item.getItemName()).isEqualTo("닌텐도");
        assertThat(item.getLikeCount()).isEqualTo(0); // likeCount 초기화 확인
    }

    @Test
    @DisplayName("위시 아이템 수정 성공 - 새 아이템 생성")
    void updateItem_create_success() {
        WishItemUpdateRequest request = new WishItemUpdateRequest();
        ReflectionTestUtils.setField(request, "itemName", "레고");

        given(wishBoardRepository.findByUser_Id(1L)).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 2)).willReturn(Optional.empty());

        wishItemService.updateItem(1L, 2, request);

        verify(wishItemRepository).save(any(WishItem.class));
    }

    @Test
    @DisplayName("위시 아이템 수정 실패 - 잘못된 슬롯 번호")
    void updateItem_invalidSlot() {
        WishItemUpdateRequest request = new WishItemUpdateRequest();
        ReflectionTestUtils.setField(request, "itemName", "레고");

        assertThatThrownBy(() -> wishItemService.updateItem(1L, 4, request))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_SLOT_INDEX));
    }

    // ===================== clearItem =====================

    @Test
    @DisplayName("위시 아이템 슬롯 비우기 성공")
    void clearItem_success() {
        BoardAsset giftIcon = BoardAsset.builder()
                .board(board).assetType(AssetType.GIFT_STICKER)
                .assetKey("icon/toy.png").slotIndex(1).build();

        given(wishBoardRepository.findByUser_Id(1L)).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 1)).willReturn(Optional.of(item));
        given(boardAssetRepository.findByBoardAndAssetTypeAndSlotIndex(board, AssetType.GIFT_STICKER, 1))
                .willReturn(Optional.of(giftIcon));

        wishItemService.clearItem(1L, 1);

        verify(wishItemRepository).delete(item);
        assertThat(giftIcon.getAssetKey()).isEqualTo("default/gift_icon.png"); // 기본값으로 초기화
    }

    @Test
    @DisplayName("위시 아이템 슬롯 비우기 실패 - 이미 빈 슬롯")
    void clearItem_slotNotFound() {
        given(wishBoardRepository.findByUser_Id(1L)).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 2)).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishItemService.clearItem(1L, 2))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.SLOT_NOT_FOUND));
    }

    // ===================== likeItem =====================

    @Test
    @DisplayName("위시 아이템 공감 성공")
    void likeItem_success() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 1)).willReturn(Optional.of(item));

        WishItemLikeResponse response = wishItemService.likeItem(2L, "abc123def4", 1);

        assertThat(response.getLikeCount()).isEqualTo(6); // 5 + 1
    }

    @Test
    @DisplayName("위시 아이템 공감 성공 - 본인 보드도 공감 가능")
    void likeItem_ownBoard_allowed() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 1)).willReturn(Optional.of(item));

        WishItemLikeResponse response = wishItemService.likeItem(1L, "abc123def4", 1);

        assertThat(response.getLikeCount()).isEqualTo(6); // 5 + 1
    }

    @Test
    @DisplayName("위시 아이템 공감 실패 - 빈 슬롯")
    void likeItem_slotEmpty() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardAndSlotIndex(board, 2)).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishItemService.likeItem(2L, "abc123def4", 2))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.SLOT_EMPTY));
    }
}
