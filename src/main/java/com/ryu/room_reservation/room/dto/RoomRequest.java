package com.ryu.room_reservation.room.dto;

import com.ryu.room_reservation.global.validation.NoSqlInjection;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RoomRequest(

        @NotBlank(message = "회의실 이름은 필수입니다.")
        @Size(max = 100, message = "회의실 이름은 100자 이하이어야 합니다.")
        @NoSqlInjection
        String name,

        @NotBlank(message = "위치는 필수입니다.")
        @Size(max = 255, message = "위치는 255자 이하이어야 합니다.")
        @NoSqlInjection
        String location,

        @NotNull(message = "수용 인원은 필수입니다.")
        @Min(value = 1, message = "수용 인원은 1명 이상이어야 합니다.")
        Integer capacity,

        @Size(max = 1000, message = "설명은 1000자 이하이어야 합니다.")
        String description,

        List<@Size(max = 50, message = "시설 항목은 50자 이하이어야 합니다.") String> amenities
) {
}
