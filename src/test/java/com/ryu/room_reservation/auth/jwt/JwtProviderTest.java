package com.ryu.room_reservation.auth.jwt;

import com.ryu.room_reservation.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtProvider - JWT 발급/검증 단위 테스트")
class JwtProviderTest {

    private static final String SECRET = "test-secret-key-must-be-at-least-32bytes!!";
    private static final long ACCESS_EXPIRY  = 3_600_000L;  // 1h
    private static final long REFRESH_EXPIRY = 604_800_000L; // 7d

    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(SECRET, ACCESS_EXPIRY, REFRESH_EXPIRY);
    }

    // ── Access Token ─────────────────────────────────────────

    @Test
    @DisplayName("Access Token 발급 - userId와 role이 페이로드에 포함된다")
    void generateAccessToken_containsUserIdAndRole() {
        String token = jwtProvider.generateAccessToken(1L, UserRole.ROLE_USER);

        assertThat(token).isNotBlank();
        assertThat(jwtProvider.getUserId(token)).isEqualTo(1L);
        assertThat(jwtProvider.getRole(token)).isEqualTo(UserRole.ROLE_USER);
    }

    @Test
    @DisplayName("Access Token 발급 - ADMIN 역할도 올바르게 인코딩된다")
    void generateAccessToken_adminRole() {
        String token = jwtProvider.generateAccessToken(99L, UserRole.ROLE_ADMIN);

        assertThat(jwtProvider.getRole(token)).isEqualTo(UserRole.ROLE_ADMIN);
        assertThat(jwtProvider.getUserId(token)).isEqualTo(99L);
    }

    @Test
    @DisplayName("Access Token 유효성 - 정상 토큰은 true를 반환한다")
    void validateToken_validToken_returnsTrue() {
        String token = jwtProvider.generateAccessToken(1L, UserRole.ROLE_USER);

        assertThat(jwtProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Access Token 유효성 - 위변조 토큰은 false를 반환한다")
    void validateToken_tamperedToken_returnsFalse() {
        String token = jwtProvider.generateAccessToken(1L, UserRole.ROLE_USER) + "tampered";

        assertThat(jwtProvider.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("Access Token 유효성 - 빈 문자열은 false를 반환한다")
    void validateToken_emptyString_returnsFalse() {
        assertThat(jwtProvider.validateToken("")).isFalse();
    }

    // ── Refresh Token ─────────────────────────────────────────

    @Test
    @DisplayName("Refresh Token 발급 - 유효하고 userId를 포함한다")
    void generateRefreshToken_validAndContainsUserId() {
        String token = jwtProvider.generateRefreshToken(42L);

        assertThat(jwtProvider.validateToken(token)).isTrue();
        assertThat(jwtProvider.getUserId(token)).isEqualTo(42L);
    }

    @Test
    @DisplayName("Refresh Token 발급 - Access Token과 다른 값이 생성된다")
    void generateRefreshToken_differentFromAccessToken() {
        String access  = jwtProvider.generateAccessToken(1L, UserRole.ROLE_USER);
        String refresh = jwtProvider.generateRefreshToken(1L);

        assertThat(access).isNotEqualTo(refresh);
    }

    // ── Expiry Getters ────────────────────────────────────────

    @Test
    @DisplayName("만료 시간 - getAccessTokenExpiry가 설정값을 반환한다")
    void getAccessTokenExpiry_returnsConfiguredValue() {
        assertThat(jwtProvider.getAccessTokenExpiry()).isEqualTo(ACCESS_EXPIRY);
    }

    @Test
    @DisplayName("만료 시간 - getRefreshTokenExpiry가 설정값을 반환한다")
    void getRefreshTokenExpiry_returnsConfiguredValue() {
        assertThat(jwtProvider.getRefreshTokenExpiry()).isEqualTo(REFRESH_EXPIRY);
    }
}
