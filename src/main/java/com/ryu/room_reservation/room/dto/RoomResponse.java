package com.ryu.room_reservation.room.dto;

import com.ryu.room_reservation.room.entity.Room;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "회의실 응답")
public record RoomResponse(
        @Schema(description = "회의실 ID", example = "1")
        Long id,

        @Schema(description = "회의실 이름", example = "세미나실 A")
        String name,

        @Schema(description = "위치", example = "3층 301호")
        String location,

        @Schema(description = "최대 수용 인원", example = "10")
        int capacity,

        @Schema(description = "부가 설명")
        String description,

        @Schema(description = "시설 목록")
        List<String> amenities,

        @Schema(description = "활성 상태", example = "true")
        boolean isActive,

        @Schema(description = "생성 시각")
        LocalDateTime createdAt
) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getLocation(),
                room.getCapacity(),
                room.getDescription(),
                room.getAmenities(),
                room.isActive(),
                room.getCreatedAt()
        );
    }
}
