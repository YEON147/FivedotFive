package com.ssafy.oh_jjeom_oh.domain.asset.constant;

import java.util.Map;

public final class WallpaperDisplayNames {

    private WallpaperDisplayNames() {}

    // 파일명 → 화면 표시명 고정 매핑 (디자이너 확정본)
    public static final Map<String, String> MAP = Map.ofEntries(
            Map.entry("wallpaper-01.png", "별은하"),
            Map.entry("wallpaper-02.png", "보라우주"),
            Map.entry("wallpaper-03.png", "파란별"),
            Map.entry("wallpaper-04.png", "오로라"),
            Map.entry("wallpaper-05.png", "모눈종이"),
            Map.entry("wallpaper-06.png", "잔디꽃밭"),
            Map.entry("wallpaper-07.png", "공룡친구들"),
            Map.entry("wallpaper-08.png", "알록달록친구들"),
            Map.entry("wallpaper-09.png", "과일동산"),
            Map.entry("wallpaper-10.png", "마스킹테이프"),
            Map.entry("wallpaper-11.png", "달콤한하루"),
            Map.entry("wallpaper-12.png", "놀이공원"),
            Map.entry("wallpaper-13.png", "동화속숲"),
            Map.entry("wallpaper-14.png", "풍선파티"),
            Map.entry("wallpaper-15.png", "냥냥"),
            Map.entry("wallpaper-16.png", "토끼토끼")
    );

    // assetKey에서 파일명 추출 후 표시명 반환 (없으면 파일명 그대로)
    public static String resolve(String assetKey) {
        if (assetKey == null) return null;
        String fileName = assetKey.substring(assetKey.lastIndexOf('/') + 1);
        return MAP.getOrDefault(fileName, fileName);
    }
}
