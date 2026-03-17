package com.ryu.room_reservation.room.dto;

import com.ryu.room_reservation.global.validation.NoSqlInjection;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(description = "회의실 생성/수정 요청")
public record RoomRequest(

        @Schema(description = "회의실 이름 (최대 100자)", example = "세미나실 A")
        @NotBlank(message = "회의실 이름은 필수입니다.")
        @Size(max = 100, message = "회의실 이름은 100자 이하이어야 합니다.")
        @NoSqlInjection
        String name,

        @Schema(description = "위치 (최대 255자)", example = "3층 301호")
        @NotBlank(message = "위치는 필수입니다.")
        @Size(max = 255, message = "위치는 255자 이하이어야 합니다.")
        @NoSqlInjection
        String location,

        @Schema(description = "최대 수용 인원 (1 이상)", example = "10")
        @NotNull(message = "수용 인원은 필수입니다.")
        @Min(value = 1, message = "수용 인원은 1명 이상이어야 합니다.")
        Integer capacity,

        @Schema(description = "부가 설명 (최대 1000자)", example = "빔프로젝터, 화이트보드 구비")
        @Size(max = 1000, message = "설명은 1000자 이하이어야 합니다.")
        String description,

        @Schema(description = "시설 목록 (항목당 최대 50자)", example = "[\"빔프로젝터\", \"화이트보드\"]")
        List<@Size(max = 50, message = "시설 항목은 50자 이하이어야 합니다.") String> amenities
) {
}
