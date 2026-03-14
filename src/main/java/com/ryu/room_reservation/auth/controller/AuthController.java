package com.ryu.room_reservation.auth.controller;

import com.ryu.room_reservation.auth.dto.AuthTokens;
import com.ryu.room_reservation.auth.dto.LoginRequest;
import com.ryu.room_reservation.auth.dto.TokenResponse;
import com.ryu.room_reservation.auth.service.AuthService;
import com.ryu.room_reservation.global.exception.BusinessException;
import com.ryu.room_reservation.global.exception.ErrorCode;
import com.ryu.room_reservation.global.response.ApiResponse;
import com.ryu.room_reservation.global.security.UserPrincipal;
import com.ryu.room_reservation.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "인증 API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "이메일/비밀번호 로그인")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthTokens tokens = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokens).toString())
                .body(ApiResponse.ok(tokens.tokenResponse()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Access Token 갱신")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        AuthTokens tokens = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokens).toString())
                .body(ApiResponse.ok(tokens.tokenResponse()));
    }

    @PostMapping("/logout")
    @Operation(summary = "로그아웃")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.userId());
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(Duration.ZERO)
                .sameSite("Strict")
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .build();
    }

    @GetMapping("/me")
    @Operation(summary = "현재 로그인 사용자 정보 조회")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getMyInfo(principal.userId())));
    }

    private ResponseCookie buildRefreshTokenCookie(AuthTokens tokens) {
        return ResponseCookie.from("refreshToken", tokens.refreshToken())
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(Duration.ofSeconds(tokens.refreshTokenExpiry()))
                .sameSite("Strict")
                .build();
    }
}
