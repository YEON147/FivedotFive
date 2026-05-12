package com.ssafy.oh_jjeom_oh.domain.asset.repository;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardAssetRepository extends JpaRepository<BoardAsset, Long> {

    List<BoardAsset> findByBoard(WishBoard board);

    List<BoardAsset> findByBoardAndAssetType(WishBoard board, AssetType assetType);

    Optional<BoardAsset> findByBoardAndAssetTypeAndSlotIndex(WishBoard board, AssetType assetType, Integer slotIndex);

    // 위시보드 단건 삭제 시 사용
    @Modifying(clearAutomatically = true)
    @Query("delete from BoardAsset ba where ba.board = :board")
    void deleteByBoard(@Param("board") WishBoard board);

    @Modifying(clearAutomatically = true)
    @Query("delete from BoardAsset ba where ba.board.id = (select b.id from WishBoard b where b.user.id = :userId)")
    void deleteByUserId(@Param("userId") Long userId);
}
