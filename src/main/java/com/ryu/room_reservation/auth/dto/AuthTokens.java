package com.ryu.room_reservation.auth.dto;

/**
 * AuthService → AuthController 간 내부 전달용 (refresh token 포함).
 * 컨트롤러에서 refresh token을 HttpOnly 쿠키로 설정하기 위해 사용.
 */
public record AuthTokens(
        TokenResponse tokenResponse,
        String refreshToken,
        long refreshTokenExpiry
) {
}
