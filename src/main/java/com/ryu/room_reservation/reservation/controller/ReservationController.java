package com.ryu.room_reservation.reservation.controller;

import com.ryu.room_reservation.global.response.ApiResponse;
import com.ryu.room_reservation.global.security.UserPrincipal;
import com.ryu.room_reservation.reservation.dto.ReservationCreateRequest;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.dto.ReservationUpdateRequest;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Page<ReservationResponse> page = reservationService.getMyReservations(
                principal.userId(), pageable, status, from, to);
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
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getCalendar(
            @RequestParam @Min(2000) @Max(2100) int year,
            @RequestParam @Min(1) @Max(12) int month,
            @RequestParam(required = false) Long roomId) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.getCalendar(year, month, roomId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "예약 상세 조회")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "예약 없음")
    })
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.getReservation(id, principal.userId(), principal.isAdmin())));
    }

    @PostMapping
    @Operation(summary = "예약 생성")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "생성 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "입력값 오류"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "예약 충돌")
    })
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReservationCreateRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.ok(
                reservationService.createReservation(principal.userId(), request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "예약 수정")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "입력값 오류"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "예약 충돌")
    })
    public ResponseEntity<ApiResponse<ReservationResponse>> updateReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReservationUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.updateReservation(id, principal.userId(), principal.isAdmin(), request)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "예약 취소")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "취소 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "예약 없음")
    })
    public ResponseEntity<Void> cancelReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        reservationService.cancelReservation(id, principal.userId(), principal.isAdmin());
        return ResponseEntity.noContent().build();
    }
}
