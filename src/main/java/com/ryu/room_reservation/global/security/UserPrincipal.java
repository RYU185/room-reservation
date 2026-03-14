package com.ryu.room_reservation.global.security;

import com.ryu.room_reservation.user.entity.UserRole;

public record UserPrincipal(Long userId, UserRole role) {

    public boolean isAdmin() {
        return role == UserRole.ROLE_ADMIN;
    }
}
