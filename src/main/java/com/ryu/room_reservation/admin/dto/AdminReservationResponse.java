package com.ryu.room_reservation.admin.dto;

import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;

import java.time.LocalDateTime;

public record AdminReservationResponse(
        Long id,
        ReservationResponse.RoomSummary room,
        UserSummary user,
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ReservationStatus status,
        LocalDateTime createdAt
) {
    public record UserSummary(Long id, String name, String email) {
    }

    public static AdminReservationResponse from(Reservation reservation) {
        return new AdminReservationResponse(
                reservation.getId(),
                new ReservationResponse.RoomSummary(
                        reservation.getRoom().getId(),
                        reservation.getRoom().getName(),
                        reservation.getRoom().getLocation()
                ),
                new UserSummary(
                        reservation.getUser().getId(),
                        reservation.getUser().getName(),
                        reservation.getUser().getEmail()
                ),
                reservation.getTitle(),
                reservation.getDescription(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus(),
                reservation.getCreatedAt()
        );
    }
}
