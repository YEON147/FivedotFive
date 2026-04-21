package com.ssafy.oh_jjeom_oh.common.security;

import com.ssafy.oh_jjeom_oh.domain.user.entity.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security 인증 주체 (김이님이 JwtFilter에서 생성하여 SecurityContext에 등록)
 * 최연제 파트에서는 @CurrentUser 어노테이션으로 주입받아 사용
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final UserRole role;

    public UserPrincipal(Long id, String username, UserRole role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
