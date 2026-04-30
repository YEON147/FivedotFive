package com.ssafy.oh_jjeom_oh.domain.asset.constant;

import java.util.Map;

public final class WallpaperDisplayNames {

    private WallpaperDisplayNames() {}

    // 파일명 → 화면 표시명 고정 매핑 (디자이너 확정본)
    public static final Map<String, String> MAP = Map.ofEntries(
            Map.entry("wallpaper-01.png", "별은하"),
            Map.entry("wallpaper-02.png", "파란별"),
            Map.entry("wallpaper-03.png", "오로라"),
            Map.entry("wallpaper-04.png", "보라우주"),
            Map.entry("wallpaper-05.png", "별빛우주"),
            Map.entry("wallpaper-06.png", "여름물빛"),
            Map.entry("wallpaper-07.png", "해파리바다"),
            Map.entry("wallpaper-08.png", "맑은하늘"),
            Map.entry("wallpaper-09.png", "슈크림"),
            Map.entry("wallpaper-10.png", "라벤더별빛"),
            Map.entry("wallpaper-11.png", "달콤한하루"),
            Map.entry("wallpaper-12.png", "알록달록친구들"),
            Map.entry("wallpaper-13.png", "마스킹테이프"),
            Map.entry("wallpaper-14.png", "모눈종이"),
            Map.entry("wallpaper-15.png", "잔디꽃밭"),
            Map.entry("wallpaper-16.png", "계란꽃밭"),
            Map.entry("wallpaper-17.png", "딸기우유"),
            Map.entry("wallpaper-18.png", "별비"),
            Map.entry("wallpaper-19.png", "과일동산"),
            Map.entry("wallpaper-20.png", "공룡친구들"),
            Map.entry("wallpaper-21.png", "놀이공원"),
            Map.entry("wallpaper-22.png", "풍선파티"),
            Map.entry("wallpaper-23.png", "동화속숲"),
            Map.entry("wallpaper-24.png", "냥냥"),
            Map.entry("wallpaper-25.png", "토끼토끼"),
            Map.entry("wallpaper-26.png", "baseball-라이온즈"),
            Map.entry("wallpaper-27.png", "baseball-베어스"),
            Map.entry("wallpaper-28.png", "baseball-다이노스"),
            Map.entry("wallpaper-29.png", "baseball-이글스"),
            Map.entry("wallpaper-30.png", "baseball-자이언츠"),
            Map.entry("wallpaper-31.png", "baseball-히어로즈"),
            Map.entry("wallpaper-32.png", "baseball-위즈"),
            Map.entry("wallpaper-33.png", "baseball-랜더스"),
            Map.entry("wallpaper-34.png", "baseball-타이거즈")
    );

    // assetKey에서 파일명 추출 후 표시명 반환 (없으면 파일명 그대로)
    public static String resolve(String assetKey) {
        if (assetKey == null) return null;
        String fileName = assetKey.substring(assetKey.lastIndexOf('/') + 1);
        return MAP.getOrDefault(fileName, fileName);
    }
}
