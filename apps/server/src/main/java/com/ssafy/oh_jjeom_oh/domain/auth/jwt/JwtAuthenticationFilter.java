package com.ssafy.oh_jjeom_oh.domain.auth.jwt;

import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // getServletPath() 대신 getRequestURI() 사용 (가장 확실함)
        String path = request.getRequestURI();

        // 로그를 찍어서 배포 후 실제로 어떤 경로가 들어오는지 확인
        log.info("[Filter Check] Incoming Request Path: {}", path);

        return path.contains("/auth/check/") ||
                path.contains("/auth/signup") ||
                path.contains("/auth/login") ||
                path.contains("/auth/nickname/random");
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @Nonnull HttpServletResponse response,
                                    @Nonnull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try{
                if (jwtUtil.validateToken(token)) {
                    Long userId = jwtUtil.getUserId(token);
                    String username = jwtUtil.getUsername(token);
                    Role role = Role.valueOf(jwtUtil.getRole(token));
                    UserPrincipal principal = new UserPrincipal(userId, username, role);
                    Authentication auth = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);

    }
}
