package com.ssafy.oh_jjeom_oh.domain.share.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ShareLinkResponse {

    private String shortUrl;

    public static ShareLinkResponse of(String shortUrl) {
        return new ShareLinkResponse(shortUrl);
    }
}
