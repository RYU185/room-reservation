package com.ryu.room_reservation.admin.controller;

import com.ryu.room_reservation.admin.dto.AdminReservationResponse;
import com.ryu.room_reservation.admin.dto.RoomStatsResponse;
import com.ryu.room_reservation.admin.service.AdminService;
import com.ryu.room_reservation.global.response.ApiResponse;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API (ROLE_ADMIN 전용)")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/reservations")
    @Operation(summary = "전체 예약 목록 조회 (검색/필터 포함)")
    public ResponseEntity<ApiResponse<List<AdminReservationResponse>>> getAllReservations(
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Page<AdminReservationResponse> page = adminService.getAllReservations(
                pageable, roomId, userId, status, from, to);
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

    @PatchMapping("/reservations/{id}/cancel")
    @Operation(summary = "예약 강제 취소")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long id) {
        adminService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    @Operation(summary = "전체 사용자 목록 조회")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserResponse> page = adminService.getAllUsers(pageable);
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

    @GetMapping("/users/{id}/reservations")
    @Operation(summary = "특정 사용자 예약 이력 조회")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getUserReservations(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReservationResponse> page = adminService.getUserReservations(id, pageable);
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

    @GetMapping("/stats/rooms")
    @Operation(summary = "회의실별 예약률 통계")
    public ResponseEntity<ApiResponse<List<RoomStatsResponse>>> getRoomStats(
            @RequestParam @Min(2000) @Max(2100) Integer year,
            @RequestParam @Min(1) @Max(12) Integer month) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getRoomStats(year, month)));
    }
}
