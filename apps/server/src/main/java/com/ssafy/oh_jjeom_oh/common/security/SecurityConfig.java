package com.ssafy.oh_jjeom_oh.common.security;

import com.ssafy.oh_jjeom_oh.domain.auth.jwt.JwtAuthenticationEntryPoint;
import com.ssafy.oh_jjeom_oh.domain.auth.jwt.JwtAuthenticationFilter;
import com.ssafy.oh_jjeom_oh.domain.auth.oauth.CustomOAuth2UserService;
import com.ssafy.oh_jjeom_oh.domain.auth.oauth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/check/**")
                .requestMatchers("/favicon.ico", "/error");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**", "/login/oauth2/**", "/oauth2/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/assets/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards/*/comments").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards/*/comments/*/sticker").permitAll()
                        // /api/boards/me 는 인증 필요 → 먼저 선언해서 아래 wildcard보다 우선 적용
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards/me").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards/me/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards/*").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(user -> user.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            log.error("OAuth2 Login Failure: {}", exception.getMessage());
                            response.sendRedirect("/api/auth/fail"); // 에러 확인용 임시 주소
                        })
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 모든 도메인 요청 허용 -> 추후 변경
        configuration.setAllowedOriginPatterns(List.of("*"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));

        // 자격 증명 여부
        configuration.setAllowCredentials(true);

        // 응답 헤더에 담을 정보
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization", "X-Total-Count", "Link"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 모든 경로에 위 설정 적용
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

}
