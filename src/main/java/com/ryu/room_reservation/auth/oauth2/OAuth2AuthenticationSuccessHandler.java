package com.ryu.room_reservation.auth.oauth2;

import com.ryu.room_reservation.auth.dto.AuthTokens;
import com.ryu.room_reservation.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;

/**
 * OAuth2 로그인 성공 시:
 *  1. JWT Access Token + Refresh Token 발급
 *  2. Refresh Token → HttpOnly Cookie (SameSite=Lax, cross-origin redirect 허용)
 *  3. Access Token을 쿼리 파라미터로 담아 프론트엔드로 리다이렉트
 */
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${oauth2.redirect-uri}")
    private String redirectUri;

    @Value("${cookie.secure}")
    private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        AuthTokens tokens = authService.issueTokensForOAuth2(oAuth2User.getUserId());

        response.addHeader(HttpHeaders.SET_COOKIE,
                buildRefreshCookie(tokens).toString());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", tokens.tokenResponse().accessToken())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private ResponseCookie buildRefreshCookie(AuthTokens tokens) {
        return ResponseCookie.from("refreshToken", tokens.refreshToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/v1/auth")
                .maxAge(Duration.ofSeconds(tokens.refreshTokenExpiry()))
                .sameSite("Strict")
                .build();
    }
}
