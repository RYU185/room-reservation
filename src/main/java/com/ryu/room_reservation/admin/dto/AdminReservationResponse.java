package com.ryu.room_reservation.admin.dto;

import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "관리자용 예약 응답")
public record AdminReservationResponse(
        @Schema(description = "예약 ID", example = "42")
        Long id,

        @Schema(description = "회의실 요약")
        ReservationResponse.RoomSummary room,

        @Schema(description = "예약자 요약")
        ReservationResponse.UserSummary user,

        @Schema(description = "예약 제목")
        String title,

        @Schema(description = "상세 설명")
        String description,

        @Schema(description = "시작 시각")
        LocalDateTime startTime,

        @Schema(description = "종료 시각")
        LocalDateTime endTime,

        @Schema(description = "예약 상태")
        ReservationStatus status,

        @Schema(description = "생성 시각")
        LocalDateTime createdAt
) {
    public static AdminReservationResponse from(Reservation reservation) {
        return new AdminReservationResponse(
                reservation.getId(),
                new ReservationResponse.RoomSummary(
                        reservation.getRoom().getId(),
                        reservation.getRoom().getName(),
                        reservation.getRoom().getLocation()
                ),
                new ReservationResponse.UserSummary(
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
