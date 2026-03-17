package com.ryu.room_reservation.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "토큰 응답")
public record TokenResponse(
        @Schema(description = "JWT Access Token")
        String accessToken,

        @Schema(description = "토큰 타입", example = "Bearer")
        String tokenType,

        @Schema(description = "Access Token 유효 시간 (초)", example = "3600")
        long expiresIn
) {
}
