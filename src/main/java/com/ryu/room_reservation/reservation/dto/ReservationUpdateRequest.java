package com.ryu.room_reservation.reservation.dto;

import com.ryu.room_reservation.global.validation.NoSqlInjection;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Schema(description = "예약 수정 요청")
public record ReservationUpdateRequest(

        @Schema(description = "예약 제목 (최대 200자)", example = "변경된 팀 미팅")
        @NotBlank(message = "예약 제목은 필수입니다.")
        @Size(max = 200, message = "예약 제목은 200자 이하이어야 합니다.")
        @NoSqlInjection
        String title,

        @Schema(description = "상세 설명 (최대 1000자)")
        @Size(max = 1000, message = "설명은 1000자 이하이어야 합니다.")
        String description,

        @Schema(description = "시작 시각 (현재 이후, ISO 8601)", example = "2026-04-01T14:00:00")
        @NotNull(message = "시작 시각은 필수입니다.")
        @Future(message = "시작 시각은 현재 시각 이후이어야 합니다.")
        LocalDateTime startTime,

        @Schema(description = "종료 시각 (시작 이후, ISO 8601)", example = "2026-04-01T15:00:00")
        @NotNull(message = "종료 시각은 필수입니다.")
        LocalDateTime endTime
) {
}
