package com.ssafy.oh_jjeom_oh.domain.auth.oauth;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
public class CustomOAuth2User extends DefaultOAuth2User {
    private final Long userId;
    private final String email;

    public CustomOAuth2User(OAuth2User oAuth2User, Long userId, String email,
                            Collection<? extends GrantedAuthority> authorities) {
        super(authorities, oAuth2User.getAttributes(), "id");
        this.userId = userId;
        this.email = email;
    }
}