package com.ssafy.oh_jjeom_oh.domain.notice.dto.response;

import com.ssafy.oh_jjeom_oh.domain.notice.entity.Notice;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BannerListResponse {

    private List<BannerItem> banners;

    public static BannerListResponse of(List<Notice> notices) {
        return new BannerListResponse(
                notices.stream().map(BannerItem::of).toList()
        );
    }

    @Getter
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class BannerItem {
        private Long id;
        private String bannerText;

        public static BannerItem of(Notice notice) {
            return new BannerItem(notice.getId(), notice.getBannerText());
        }
    }
}
