package com.ryu.room_reservation.reservation.service;

import com.ryu.room_reservation.global.exception.BusinessException;
import com.ryu.room_reservation.global.exception.ErrorCode;
import com.ryu.room_reservation.reservation.dto.CalendarItemDto;
import com.ryu.room_reservation.reservation.dto.ReservationCreateRequest;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.dto.ReservationUpdateRequest;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.repository.ReservationRepository;
import com.ryu.room_reservation.room.entity.Room;
import com.ryu.room_reservation.room.repository.RoomRepository;
import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public Page<ReservationResponse> getMyReservations(
            Long userId, Pageable pageable, ReservationStatus status, LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : null;

        Specification<Reservation> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDt != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), fromDt));
            }
            if (toDt != null) {
                predicates.add(cb.lessThan(root.get("startTime"), toDt));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return reservationRepository.findAll(spec, pageable)
                .map(r -> ReservationResponse.from(r, false));
    }

    public ReservationResponse getReservation(Long id, Long userId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!isAdmin && !reservation.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return ReservationResponse.from(reservation, true);
    }

    @Cacheable(value = "calendar", key = "#year + ':' + #month + ':' + #roomId")
    public List<ReservationResponse> getCalendar(int year, int month, Long roomId) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.plusMonths(1);

        return reservationRepository
                .findCalendarItems(start, end, ReservationStatus.CONFIRMED, roomId)
                .stream()
                .map(CalendarItemDto::toResponse)
                .toList();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "calendar", allEntries = true),
            @CacheEvict(value = "roomStats", allEntries = true)
    })
    public ReservationResponse createReservation(Long userId, ReservationCreateRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "시작 시각은 종료 시각보다 이전이어야 합니다.");
        }

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (!room.isActive()) {
            throw new BusinessException(ErrorCode.ROOM_INACTIVE);
        }

        if (reservationRepository.existsConflict(
                request.roomId(), request.startTime(), request.endTime(),
                null, ReservationStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.RESERVATION_CONFLICT);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Reservation reservation = Reservation.builder()
                .user(user)
                .room(room)
                .title(request.title())
                .description(request.description())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .build();

        return ReservationResponse.from(reservationRepository.save(reservation), true);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "calendar", allEntries = true),
            @CacheEvict(value = "roomStats", allEntries = true)
    })
    public ReservationResponse updateReservation(
            Long id, Long userId, boolean isAdmin, ReservationUpdateRequest request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!isAdmin && !reservation.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "취소된 예약은 수정할 수 없습니다.");
        }

        if (reservationRepository.existsConflict(
                reservation.getRoom().getId(), request.startTime(), request.endTime(),
                id, ReservationStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.RESERVATION_CONFLICT);
        }

        reservation.update(request.title(), request.description(), request.startTime(), request.endTime());
        return ReservationResponse.from(reservation, true);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "calendar", allEntries = true),
            @CacheEvict(value = "roomStats", allEntries = true)
    })
    public void cancelReservation(Long id, Long userId, boolean isAdmin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!isAdmin && !reservation.isOwnedBy(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        reservation.cancel();
    }
}
