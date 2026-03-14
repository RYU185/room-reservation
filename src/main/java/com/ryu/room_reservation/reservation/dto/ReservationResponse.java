package com.ryu.room_reservation.reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;

import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        RoomSummary room,

        @JsonInclude(JsonInclude.Include.NON_NULL)
        UserSummary user,

        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ReservationStatus status,
        LocalDateTime createdAt
) {
    public record RoomSummary(Long id, String name, String location) {
    }

    public record UserSummary(Long id, String name) {
    }

    public static ReservationResponse from(Reservation reservation, boolean includeUser) {
        UserSummary userSummary = includeUser
                ? new UserSummary(reservation.getUser().getId(), reservation.getUser().getName())
                : null;

        return new ReservationResponse(
                reservation.getId(),
                new RoomSummary(
                        reservation.getRoom().getId(),
                        reservation.getRoom().getName(),
                        reservation.getRoom().getLocation()
                ),
                userSummary,
                reservation.getTitle(),
                reservation.getDescription(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus(),
                reservation.getCreatedAt()
        );
    }
}
