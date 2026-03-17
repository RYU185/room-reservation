package com.ryu.room_reservation.room.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "회의실 가용 여부 응답")
public record RoomAvailabilityResponse(
        @Schema(description = "회의실 ID", example = "1")
        Long roomId,

        @Schema(description = "예약 가능 여부", example = "true")
        boolean available,

        @Schema(description = "충돌 예약 목록 (available=false 시 포함)")
        List<ConflictSummary> conflictingReservations
) {
    @Schema(description = "충돌 예약 요약")
    public record ConflictSummary(
            @Schema(description = "예약 ID", example = "42")
            Long id,

            @Schema(description = "충돌 시작 시각")
            LocalDateTime startTime,

            @Schema(description = "충돌 종료 시각")
            LocalDateTime endTime
    ) {
    }
}
