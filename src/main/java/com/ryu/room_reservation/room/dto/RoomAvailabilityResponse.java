package com.ryu.room_reservation.room.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RoomAvailabilityResponse(
        Long roomId,
        boolean available,
        List<ConflictSummary> conflictingReservations
) {
    public record ConflictSummary(
            Long id,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
    }
}
