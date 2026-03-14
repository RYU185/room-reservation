package com.ryu.room_reservation.room.dto;

import com.ryu.room_reservation.room.entity.Room;

import java.time.LocalDateTime;
import java.util.List;

public record RoomResponse(
        Long id,
        String name,
        String location,
        int capacity,
        String description,
        List<String> amenities,
        boolean isActive,
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
