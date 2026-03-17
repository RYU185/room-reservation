package com.ryu.room_reservation.user.dto;

import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "사용자 응답")
public record UserResponse(
        @Schema(description = "사용자 ID", example = "1")
        Long id,

        @Schema(description = "이메일", example = "user@example.com")
        String email,

        @Schema(description = "이름", example = "홍길동")
        String name,

        @Schema(description = "역할", example = "ROLE_USER")
        UserRole role,

        @Schema(description = "가입 시각")
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
