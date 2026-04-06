package com.ryu.room_reservation.reservation.repository;

import com.ryu.room_reservation.reservation.dto.CalendarItemDto;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

    Page<Reservation> findByUserId(Long userId, Pageable pageable);

    Page<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status, Pageable pageable);

    /**
     * 예약 충돌 검사. 동일 회의실·지정 상태에서 시간이 겹치는 예약 존재 여부.
     * 충돌 조건: newStart < existingEnd AND newEnd > existingStart
     * DB 레벨 제약: V5 마이그레이션의 EXCLUDE 제약 조건이 1차 방어선.
     */
    /**
     * 통계용: 지정 기간 내 모든 예약을 회의실 정보와 함께 단일 쿼리로 조회 (N+1 방지)
     */
    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.room
            WHERE r.startTime >= :start AND r.startTime < :end
            """)
    List<Reservation> findAllByRangeWithRoom(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /**
     * 캘린더용: DTO Projection으로 엔티티 로딩 없이 필요한 컬럼만 조회 (N+1 방지)
     * roomId가 null이면 전체 회의실 조회
     */
    @Query("""
            SELECT new com.ryu.room_reservation.reservation.dto.CalendarItemDto(
                r.id, room.id, room.name, room.location,
                r.title, r.description, r.startTime, r.endTime, r.status, r.createdAt
            )
            FROM Reservation r
            JOIN r.room room
            WHERE r.startTime >= :start
            AND r.startTime < :end
            AND r.status = :status
            AND (:roomId IS NULL OR room.id = :roomId)
            """)
    List<CalendarItemDto> findCalendarItems(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") ReservationStatus status,
            @Param("roomId") Long roomId
    );

    @Query("""
            SELECT COUNT(r) > 0
            FROM Reservation r
            WHERE r.room.id = :roomId
              AND r.status = :status
              AND r.startTime < :endTime
              AND r.endTime > :startTime
              AND (:excludeId IS NULL OR r.id <> :excludeId)
            """)
    boolean existsConflict(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId,
            @Param("status") ReservationStatus status
    );
}
