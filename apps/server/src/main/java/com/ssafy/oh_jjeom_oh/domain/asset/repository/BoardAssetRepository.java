package com.ssafy.oh_jjeom_oh.domain.asset.repository;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardAssetRepository extends JpaRepository<BoardAsset, Long> {

    List<BoardAsset> findByBoard(WishBoard board);

    List<BoardAsset> findByBoardAndAssetType(WishBoard board, AssetType assetType);

    Optional<BoardAsset> findByBoardAndAssetTypeAndSlotIndex(WishBoard board, AssetType assetType, Integer slotIndex);
}
