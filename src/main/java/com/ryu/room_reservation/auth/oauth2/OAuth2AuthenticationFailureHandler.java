package com.ryu.room_reservation.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * OAuth2 로그인 실패 시:
 *  1. 실패 원인(errorCode) 추출
 *  2. 프론트엔드로 리다이렉트 ({redirectUri}?error={errorCode})
 *
 * 주요 에러 코드:
 *  - email_already_exists : 다른 방법으로 이미 가입된 이메일
 *  - unsupported_provider : 지원하지 않는 OAuth2 제공자
 *  - oauth2_error         : 그 외 OAuth2 인증 오류
 */
@Slf4j
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException {

        String errorCode = extractErrorCode(exception);
        log.warn("OAuth2 인증 실패: errorCode={}, message={}", errorCode, exception.getMessage());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("error", errorCode)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String extractErrorCode(AuthenticationException exception) {
        if (exception instanceof OAuth2AuthenticationException oauthEx) {
            return oauthEx.getError().getErrorCode();
        }
        return "oauth2_error";
    }
}
