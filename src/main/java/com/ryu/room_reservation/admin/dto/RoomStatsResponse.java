package com.ryu.room_reservation.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회의실 통계 응답")
public record RoomStatsResponse(
        @Schema(description = "회의실 ID", example = "1")
        Long roomId,

        @Schema(description = "회의실 이름", example = "세미나실 A")
        String roomName,

        @Schema(description = "기간 내 총 예약 수", example = "25")
        int totalReservations,

        @Schema(description = "확정 예약 수", example = "20")
        int confirmedReservations,

        @Schema(description = "가동률 (%)", example = "65.5")
        double utilizationRate
) {
}
