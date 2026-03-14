package com.ryu.room_reservation.user.dto;

import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.entity.UserRole;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String name,
        UserRole role,
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
