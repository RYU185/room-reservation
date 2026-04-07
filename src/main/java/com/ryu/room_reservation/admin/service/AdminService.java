package com.ryu.room_reservation.admin.service;

import com.ryu.room_reservation.admin.dto.AdminReservationResponse;
import com.ryu.room_reservation.admin.dto.RoomStatsResponse;
import com.ryu.room_reservation.global.exception.BusinessException;
import com.ryu.room_reservation.global.exception.ErrorCode;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.repository.ReservationRepository;
import com.ryu.room_reservation.room.entity.Room;
import com.ryu.room_reservation.room.repository.RoomRepository;
import com.ryu.room_reservation.user.dto.UserResponse;
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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public Page<AdminReservationResponse> getAllReservations(
            Pageable pageable, Long roomId, Long userId,
            ReservationStatus status, LocalDate from, LocalDate to) {
        Specification<Reservation> spec = buildSpec(roomId, userId, status, from, to);
        return reservationRepository.findAll(spec, pageable).map(AdminReservationResponse::from);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "calendar", allEntries = true),
            @CacheEvict(value = "roomStats", allEntries = true)
    })
    public void cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESERVATION_NOT_FOUND));
        reservation.cancel();
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::from);
    }

    public Page<ReservationResponse> getUserReservations(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return reservationRepository.findByUserId(userId, pageable)
                .map(r -> ReservationResponse.from(r, true));
    }

    @Cacheable(value = "roomStats", key = "#year + ':' + #month")
    public List<RoomStatsResponse> getRoomStats(Integer year, Integer month) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.plusMonths(1);
        long totalMinutes = Duration.between(start, end).toMinutes();

        List<Room> activeRooms = roomRepository.findByActiveTrue();
        List<Reservation> allReservations = reservationRepository.findAllByRangeWithRoom(start, end);

        Map<Long, List<Reservation>> byRoom = allReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getRoom().getId()));

        return activeRooms.stream()
                .map(room -> {
                    List<Reservation> reservations = byRoom.getOrDefault(room.getId(), List.of());
                    int total = reservations.size();
                    int confirmed = 0;
                    long confirmedMinutes = 0;
                    for (Reservation r : reservations) {
                        if (r.getStatus() == ReservationStatus.CONFIRMED) {
                            confirmed++;
                            confirmedMinutes += Duration.between(r.getStartTime(), r.getEndTime()).toMinutes();
                        }
                    }
                    double utilizationRate = totalMinutes > 0
                            ? (double) confirmedMinutes / totalMinutes * 100
                            : 0.0;
                    return new RoomStatsResponse(room.getId(), room.getName(), total, confirmed, utilizationRate);
                })
                .toList();
    }

    private Specification<Reservation> buildSpec(
            Long roomId, Long userId, ReservationStatus status, LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (roomId != null) predicates.add(cb.equal(root.get("room").get("id"), roomId));
            if (userId != null) predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), from.atStartOfDay()));
            if (to != null) predicates.add(cb.lessThan(root.get("startTime"), to.plusDays(1).atStartOfDay()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
