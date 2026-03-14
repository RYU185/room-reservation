package com.ryu.room_reservation.room.controller;

import com.ryu.room_reservation.global.response.ApiResponse;
import com.ryu.room_reservation.room.dto.RoomAvailabilityResponse;
import com.ryu.room_reservation.room.dto.RoomRequest;
import com.ryu.room_reservation.room.dto.RoomResponse;
import com.ryu.room_reservation.room.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "회의실 API")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @Operation(summary = "회의실 목록 조회 (활성 회의실만)")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @PageableDefault(size = 20, sort = "name") Pageable pageable,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {
        Page<RoomResponse> page = roomService.getRooms(pageable, location, minCapacity);
        return ResponseEntity.ok(ApiResponse.ok(
                page.getContent(),
                new ApiResponse.PageMeta(
                        page.getTotalElements(),
                        pageable.getPageNumber() + 1,
                        pageable.getPageSize(),
                        page.getTotalPages()
                )
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "회의실 상세 조회")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(roomService.getRoom(id)));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "회의실 가용 여부 조회")
    public ResponseEntity<ApiResponse<RoomAvailabilityResponse>> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(ApiResponse.ok(roomService.checkAvailability(id, startTime, endTime)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "회의실 등록 (관리자 전용)")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@Valid @RequestBody RoomRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.ok(roomService.createRoom(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "회의실 정보 전체 수정 (관리자 전용)")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(roomService.updateRoom(id, request)));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "회의실 비활성화 (관리자 전용)")
    public ResponseEntity<Void> deactivateRoom(@PathVariable Long id) {
        roomService.deactivateRoom(id);
        return ResponseEntity.noContent().build();
    }
}
