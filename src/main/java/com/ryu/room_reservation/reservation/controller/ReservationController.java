package com.ryu.room_reservation.reservation.controller;

import com.ryu.room_reservation.global.response.ApiResponse;
import com.ryu.room_reservation.global.security.UserPrincipal;
import com.ryu.room_reservation.reservation.dto.ReservationCreateRequest;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.dto.ReservationUpdateRequest;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "예약 API")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping("/my")
    @Operation(summary = "내 예약 목록 조회")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) ReservationStatus status) {
        Page<ReservationResponse> page = reservationService.getMyReservations(
                principal.userId(), pageable, status);
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

    @GetMapping("/calendar")
    @Operation(summary = "전체 예약 캘린더 조회")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getCalendar(
            @RequestParam @Min(2000) @Max(2100) int year,
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam(required = false) Long roomId) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.getCalendar(year, month, roomId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "예약 상세 조회")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.getReservation(id, principal.userId(), principal.isAdmin())));
    }

    @PostMapping
    @Operation(summary = "예약 생성")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReservationCreateRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.ok(
                reservationService.createReservation(principal.userId(), request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "예약 수정")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReservationUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.updateReservation(id, principal.userId(), principal.isAdmin(), request)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "예약 취소")
    public ResponseEntity<Void> cancelReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        reservationService.cancelReservation(id, principal.userId(), principal.isAdmin());
        return ResponseEntity.noContent().build();
    }
}
