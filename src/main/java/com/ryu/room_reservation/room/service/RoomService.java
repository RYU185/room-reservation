package com.ryu.room_reservation.room.service;

import com.ryu.room_reservation.global.exception.BusinessException;
import com.ryu.room_reservation.global.exception.ErrorCode;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.repository.ReservationRepository;
import com.ryu.room_reservation.room.dto.RoomAvailabilityResponse;
import com.ryu.room_reservation.room.dto.RoomRequest;
import com.ryu.room_reservation.room.dto.RoomResponse;
import com.ryu.room_reservation.room.entity.Room;
import com.ryu.room_reservation.room.repository.RoomRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    public Page<RoomResponse> getRooms(Pageable pageable, String location, Integer minCapacity) {
        Specification<Room> spec = buildRoomSpec(location, minCapacity);
        return roomRepository.findAll(spec, pageable).map(RoomResponse::from);
    }

    public RoomResponse getRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        return RoomResponse.from(room);
    }

    public RoomAvailabilityResponse checkAvailability(Long id, LocalDateTime startTime, LocalDateTime endTime) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        boolean hasConflict = reservationRepository.existsConflict(
                id, startTime, endTime, null, ReservationStatus.CONFIRMED);

        List<RoomAvailabilityResponse.ConflictSummary> conflicts = hasConflict
                ? findConflicts(id, startTime, endTime)
                : List.of();

        return new RoomAvailabilityResponse(room.getId(), !hasConflict, conflicts);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        Room room = Room.builder()
                .name(request.name())
                .location(request.location())
                .capacity(request.capacity())
                .description(request.description())
                .amenities(request.amenities())
                .build();
        return RoomResponse.from(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        room.update(request.name(), request.location(), request.capacity(),
                request.description(), request.amenities());
        return RoomResponse.from(room);
    }

    @Transactional
    public void deactivateRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        room.deactivate();
    }

    private Specification<Room> buildRoomSpec(String location, Integer minCapacity) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));
            if (location != null && !location.isBlank()) {
                String escaped = location.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
                predicates.add(cb.like(root.get("location"), "%" + escaped + "%", '\\'));
            }
            if (minCapacity != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<RoomAvailabilityResponse.ConflictSummary> findConflicts(
            Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        Specification<Reservation> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("room").get("id"), roomId),
                cb.equal(root.get("status"), ReservationStatus.CONFIRMED),
                cb.lessThan(root.get("startTime"), endTime),
                cb.greaterThan(root.get("endTime"), startTime)
        );
        return reservationRepository.findAll(spec).stream()
                .map(r -> new RoomAvailabilityResponse.ConflictSummary(
                        r.getId(), r.getStartTime(), r.getEndTime()))
                .toList();
    }
}
