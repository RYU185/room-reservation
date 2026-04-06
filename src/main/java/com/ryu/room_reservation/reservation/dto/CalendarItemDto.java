package com.ryu.room_reservation.reservation.dto;

import com.ryu.room_reservation.reservation.entity.ReservationStatus;

import java.time.LocalDateTime;

public record CalendarItemDto(
        Long id,
        Long roomId,
        String roomName,
        String roomLocation,
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ReservationStatus status,
        LocalDateTime createdAt
) {
    public ReservationResponse toResponse() {
        return new ReservationResponse(
                id,
                new ReservationResponse.RoomSummary(roomId, roomName, roomLocation),
                null,
                title,
                description,
                startTime,
                endTime,
                status,
                createdAt
        );
    }
}
