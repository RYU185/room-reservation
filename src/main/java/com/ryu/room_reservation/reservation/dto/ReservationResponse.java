package com.ryu.room_reservation.reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "예약 응답")
public record ReservationResponse(
        @Schema(description = "예약 ID", example = "42")
        Long id,

        @Schema(description = "회의실 요약")
        RoomSummary room,

        @Schema(description = "예약자 요약 (단건 조회/생성/수정 시 포함)")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        UserSummary user,

        @Schema(description = "예약 제목", example = "주간 팀 미팅")
        String title,

        @Schema(description = "상세 설명")
        String description,

        @Schema(description = "시작 시각")
        LocalDateTime startTime,

        @Schema(description = "종료 시각")
        LocalDateTime endTime,

        @Schema(description = "예약 상태", example = "CONFIRMED")
        ReservationStatus status,

        @Schema(description = "생성 시각")
        LocalDateTime createdAt
) {
    @Schema(description = "회의실 요약 정보")
    public record RoomSummary(
            @Schema(description = "회의실 ID") Long id,
            @Schema(description = "회의실 이름") String name,
            @Schema(description = "위치") String location
    ) {
    }

    @Schema(description = "예약자 요약 정보")
    public record UserSummary(
            @Schema(description = "사용자 ID") Long id,
            @Schema(description = "이름") String name,
            @Schema(description = "이메일") String email
    ) {
    }

    public static ReservationResponse from(Reservation reservation, boolean includeUser) {
        UserSummary userSummary = includeUser
                ? new UserSummary(
                        reservation.getUser().getId(),
                        reservation.getUser().getName(),
                        reservation.getUser().getEmail())
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
