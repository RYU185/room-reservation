package com.ryu.room_reservation.admin.dto;

public record RoomStatsResponse(
        Long roomId,
        String roomName,
        int totalReservations,
        int confirmedReservations,
        double utilizationRate
) {
}
