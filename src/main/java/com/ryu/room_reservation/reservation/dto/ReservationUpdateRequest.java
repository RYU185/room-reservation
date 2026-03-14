package com.ryu.room_reservation.reservation.dto;

import com.ryu.room_reservation.global.validation.NoSqlInjection;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ReservationUpdateRequest(

        @NotBlank(message = "예약 제목은 필수입니다.")
        @Size(max = 200, message = "예약 제목은 200자 이하이어야 합니다.")
        @NoSqlInjection
        String title,

        @Size(max = 1000, message = "설명은 1000자 이하이어야 합니다.")
        String description,

        @NotNull(message = "시작 시각은 필수입니다.")
        @Future(message = "시작 시각은 현재 시각 이후이어야 합니다.")
        LocalDateTime startTime,

        @NotNull(message = "종료 시각은 필수입니다.")
        LocalDateTime endTime
) {
}
