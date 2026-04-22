package com.ssafy.oh_jjeom_oh.domain.asset.repository;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByAssetTypeOrderByDisplayOrderAsc(AssetType assetType);
}
