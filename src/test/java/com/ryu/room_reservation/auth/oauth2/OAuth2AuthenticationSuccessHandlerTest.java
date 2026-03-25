package com.ryu.room_reservation.auth.oauth2;

import com.ryu.room_reservation.auth.dto.AuthTokens;
import com.ryu.room_reservation.auth.dto.TokenResponse;
import com.ryu.room_reservation.auth.service.AuthService;
import com.ryu.room_reservation.user.entity.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("OAuth2AuthenticationSuccessHandler - JWT 발급 및 리다이렉트 테스트")
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock private AuthService authService;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private Authentication authentication;

    private OAuth2AuthenticationSuccessHandler handler;

    private static final String REDIRECT_URI = "http://localhost:3000/oauth2/callback";
    private static final Long   USER_ID      = 1L;
    private static final String ACCESS_TOKEN = "test.access.token";
    private static final String REFRESH_TOKEN = "test.refresh.token";

    @BeforeEach
    void setUp() {
        handler = new OAuth2AuthenticationSuccessHandler(authService);
        ReflectionTestUtils.setField(handler, "redirectUri", REDIRECT_URI);
        ReflectionTestUtils.setField(handler, "cookieSecure", false);
    }

    @Test
    @DisplayName("소셜 로그인 성공 - Refresh Token이 HttpOnly 쿠키로 설정된다")
    void onAuthenticationSuccess_setsRefreshTokenCookie() throws Exception {
        // given
        givenOAuth2UserAndTokens();

        // when
        handler.onAuthenticationSuccess(request, response, authentication);

        // then
        ArgumentCaptor<String> cookieCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(org.mockito.ArgumentMatchers.eq(HttpHeaders.SET_COOKIE), cookieCaptor.capture());

        String cookie = cookieCaptor.getValue();
        assertThat(cookie).contains("refreshToken=" + REFRESH_TOKEN);
        assertThat(cookie).containsIgnoringCase("HttpOnly");
        assertThat(cookie).contains("Path=/api/v1/auth");
        assertThat(cookie).contains("SameSite=Lax");
    }

    @Test
    @DisplayName("소셜 로그인 성공 - Access Token을 쿼리 파라미터로 담아 리다이렉트한다")
    void onAuthenticationSuccess_redirectsWithAccessToken() throws Exception {
        // given
        givenOAuth2UserAndTokens();

        // when
        handler.onAuthenticationSuccess(request, response, authentication);

        // then
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(urlCaptor.capture());

        String redirectUrl = urlCaptor.getValue();
        assertThat(redirectUrl).startsWith(REDIRECT_URI);
        assertThat(redirectUrl).contains("token=" + ACCESS_TOKEN);
    }

    @Test
    @DisplayName("소셜 로그인 성공 - AuthService.issueTokensForOAuth2가 userId로 호출된다")
    void onAuthenticationSuccess_callsIssueTokensWithUserId() throws Exception {
        // given
        givenOAuth2UserAndTokens();

        // when
        handler.onAuthenticationSuccess(request, response, authentication);

        // then
        verify(authService).issueTokensForOAuth2(USER_ID);
    }

    // ── helper ───────────────────────────────────────────────

    private void givenOAuth2UserAndTokens() throws Exception {
        CustomOAuth2User oAuth2User = new CustomOAuth2User(
                USER_ID, UserRole.ROLE_USER, Map.of("sub", "google-id-123"), "sub");
        given(authentication.getPrincipal()).willReturn(oAuth2User);

        TokenResponse tokenResponse = new TokenResponse(ACCESS_TOKEN, "Bearer", 3600L);
        AuthTokens tokens = new AuthTokens(tokenResponse, REFRESH_TOKEN, 604800L);
        given(authService.issueTokensForOAuth2(USER_ID)).willReturn(tokens);

        given(response.encodeRedirectURL(anyString())).willAnswer(i -> i.getArgument(0));
    }
}
