package com.ryu.room_reservation.auth.service;

import com.ryu.room_reservation.auth.dto.AuthTokens;
import com.ryu.room_reservation.auth.dto.LoginRequest;
import com.ryu.room_reservation.auth.dto.SignUpRequest;
import com.ryu.room_reservation.auth.dto.TokenResponse;
import com.ryu.room_reservation.auth.entity.RefreshToken;
import com.ryu.room_reservation.auth.repository.RefreshTokenRepository;
import com.ryu.room_reservation.auth.jwt.JwtProvider;
import com.ryu.room_reservation.global.exception.BusinessException;
import com.ryu.room_reservation.global.exception.ErrorCode;
import com.ryu.room_reservation.user.dto.UserResponse;
import com.ryu.room_reservation.user.entity.AuthProvider;
import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthTokens register(SignUpRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATE);
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .provider(AuthProvider.LOCAL)
                .build();

        userRepository.save(user);
        return issueTokens(user);
    }

    public AuthTokens login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return issueTokens(user);
    }

    public AuthTokens refresh(String refreshTokenStr) {
        RefreshToken stored = refreshTokenRepository.findByToken(hashToken(refreshTokenStr))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        if (stored.isExpired(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        return issueTokens(stored.getUser());
    }

    public AuthTokens issueTokensForOAuth2(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return issueTokens(user);
    }

    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserResponse getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private AuthTokens issueTokens(User user) {
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getRole());
        String newRefreshToken = jwtProvider.generateRefreshToken(user.getId());
        long refreshExpirySeconds = jwtProvider.getRefreshTokenExpiry() / 1000;
        LocalDateTime refreshExpiry = LocalDateTime.now().plusSeconds(refreshExpirySeconds);

        String tokenHash = hashToken(newRefreshToken);
        refreshTokenRepository.findByUserId(user.getId()).ifPresentOrElse(
                rt -> rt.rotate(tokenHash, refreshExpiry),
                () -> refreshTokenRepository.save(
                        RefreshToken.builder()
                                .user(user)
                                .token(tokenHash)
                                .expiresAt(refreshExpiry)
                                .build()
                )
        );

        TokenResponse tokenResponse = new TokenResponse(
                accessToken,
                "Bearer",
                jwtProvider.getAccessTokenExpiry() / 1000
        );

        return new AuthTokens(tokenResponse, newRefreshToken, refreshExpirySeconds);
    }
}
