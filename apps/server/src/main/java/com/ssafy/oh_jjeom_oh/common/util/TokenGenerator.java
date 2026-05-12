package com.ssafy.oh_jjeom_oh.common.util;

import java.util.UUID;

public class TokenGenerator {

    private TokenGenerator() {}

    /** UUID 기반 32자 hex 토큰 (comment_token / view_token 용) */
    public static String generate() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
