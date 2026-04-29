package com.ssafy.oh_jjeom_oh.common.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.*;

/**
 * 컨트롤러 메서드 파라미터에 붙여 현재 로그인 유저(UserPrincipal)를 주입받는 어노테이션
 *
 * 사용 예:
 * public ResponseEntity<?> someApi(@CurrentUser UserPrincipal userPrincipal) { ... }
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {
}
