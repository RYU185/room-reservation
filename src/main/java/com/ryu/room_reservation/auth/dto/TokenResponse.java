package com.ryu.room_reservation.auth.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}
