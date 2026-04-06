package com.ryu.room_reservation.reservation.repository;

import com.ryu.room_reservation.reservation.dto.CalendarItemDto;
import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.room.entity.Room;
import com.ryu.room_reservation.room.repository.RoomRepository;
import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.ryu.room_reservation.global.config.JpaConfig;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(JpaConfig.class)
@ActiveProfiles("test")
@DisplayName("ReservationRepository - findCalendarItems 통합 테스트")
class ReservationRepositoryTest {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    private Room roomA;
    private Room roomB;
    private User user;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .email("tester@example.com")
                .name("테스터")
                .password("password123")
                .build());

        roomA = roomRepository.save(Room.builder()
                .name("회의실 A")
                .location("3층 동관")
                .capacity(10)
                .build());

        roomB = roomRepository.save(Room.builder()
                .name("회의실 B")
                .location("4층 서관")
                .capacity(20)
                .build());
    }

    private Reservation createReservation(Room room, LocalDateTime start, LocalDateTime end,
                                          ReservationStatus status) {
        return reservationRepository.save(Reservation.builder()
                .user(user)
                .room(room)
                .title("예약: " + room.getName())
                .description("테스트 예약")
                .startTime(start)
                .endTime(end)
                .status(status)
                .build());
    }

    @Nested
    @DisplayName("roomId 필터링")
    class RoomIdFiltering {

        @Test
        @DisplayName("roomId가 null이면 전체 회의실 예약을 조회한다")
        void whenRoomIdNull_returnsAllRooms() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);
            createReservation(roomB,
                    LocalDateTime.of(2026, 4, 15, 14, 0),
                    LocalDateTime.of(2026, 4, 15, 15, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).hasSize(2);
            assertThat(results).extracting(CalendarItemDto::roomName)
                    .containsExactlyInAnyOrder("회의실 A", "회의실 B");
        }

        @Test
        @DisplayName("roomId를 지정하면 해당 회의실 예약만 반환한다")
        void whenRoomIdSpecified_returnsOnlyThatRoom() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);
            createReservation(roomB,
                    LocalDateTime.of(2026, 4, 15, 14, 0),
                    LocalDateTime.of(2026, 4, 15, 15, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, roomA.getId());

            // then
            assertThat(results).hasSize(1);
            assertThat(results.getFirst().roomId()).isEqualTo(roomA.getId());
            assertThat(results.getFirst().roomName()).isEqualTo("회의실 A");
        }

        @Test
        @DisplayName("존재하지 않는 roomId를 지정하면 빈 결과를 반환한다")
        void whenNonExistentRoomId_returnsEmpty() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, 99999L);

            // then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("날짜 범위 경계값")
    class DateRangeBoundary {

        @Test
        @DisplayName("startTime이 조회 시작과 정확히 일치하면 포함된다 (start 포함)")
        void whenStartTimeEqualsRangeStart_isIncluded() {
            // given
            LocalDateTime rangeStart = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime rangeEnd = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 1, 0, 0),  // 정확히 경계
                    LocalDateTime.of(2026, 4, 1, 1, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    rangeStart, rangeEnd, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("startTime이 조회 종료와 정확히 일치하면 제외된다 (end 미포함)")
        void whenStartTimeEqualsRangeEnd_isExcluded() {
            // given
            LocalDateTime rangeStart = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime rangeEnd = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 5, 1, 0, 0),  // 정확히 end 경계
                    LocalDateTime.of(2026, 5, 1, 1, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    rangeStart, rangeEnd, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("startTime이 조회 범위 밖이면 제외된다")
        void whenStartTimeOutOfRange_isExcluded() {
            // given
            LocalDateTime rangeStart = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime rangeEnd = LocalDateTime.of(2026, 5, 1, 0, 0);

            // 3월 예약 (범위 이전)
            createReservation(roomA,
                    LocalDateTime.of(2026, 3, 31, 23, 0),
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    ReservationStatus.CONFIRMED);
            // 5월 예약 (범위 이후)
            createReservation(roomA,
                    LocalDateTime.of(2026, 5, 2, 10, 0),
                    LocalDateTime.of(2026, 5, 2, 11, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    rangeStart, rangeEnd, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("월말 마지막 시각(4/30 23:00) 예약이 4월 범위에 포함된다")
        void whenLastDayOfMonth_isIncluded() {
            // given
            LocalDateTime rangeStart = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime rangeEnd = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 30, 23, 0),
                    LocalDateTime.of(2026, 4, 30, 23, 59),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    rangeStart, rangeEnd, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).hasSize(1);
        }
    }

    @Nested
    @DisplayName("상태 필터링")
    class StatusFiltering {

        @Test
        @DisplayName("CONFIRMED 상태만 조회하면 CANCELLED 예약은 제외된다")
        void whenFilterConfirmed_excludesCancelled() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);
            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 11, 10, 0),
                    LocalDateTime.of(2026, 4, 11, 11, 0),
                    ReservationStatus.CANCELLED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).hasSize(1);
            assertThat(results.getFirst().status()).isEqualTo(ReservationStatus.CONFIRMED);
        }

        @Test
        @DisplayName("CANCELLED 상태로 조회하면 CONFIRMED 예약은 제외된다")
        void whenFilterCancelled_excludesConfirmed() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);
            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 11, 10, 0),
                    LocalDateTime.of(2026, 4, 11, 11, 0),
                    ReservationStatus.CANCELLED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CANCELLED, null);

            // then
            assertThat(results).hasSize(1);
            assertThat(results.getFirst().status()).isEqualTo(ReservationStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("DTO Projection 검증")
    class DtoProjection {

        @Test
        @DisplayName("DTO의 모든 필드가 엔티티 값과 일치한다")
        void allFieldsMappedCorrectly() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            Reservation reservation = createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).hasSize(1);
            CalendarItemDto dto = results.getFirst();

            assertThat(dto.id()).isEqualTo(reservation.getId());
            assertThat(dto.roomId()).isEqualTo(roomA.getId());
            assertThat(dto.roomName()).isEqualTo(roomA.getName());
            assertThat(dto.roomLocation()).isEqualTo(roomA.getLocation());
            assertThat(dto.title()).isEqualTo(reservation.getTitle());
            assertThat(dto.description()).isEqualTo(reservation.getDescription());
            assertThat(dto.startTime()).isEqualTo(reservation.getStartTime());
            assertThat(dto.endTime()).isEqualTo(reservation.getEndTime());
            assertThat(dto.status()).isEqualTo(ReservationStatus.CONFIRMED);
        }

        @Test
        @DisplayName("결과가 없으면 빈 리스트를 반환한다")
        void whenNoResults_returnsEmptyList() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            // when (예약 데이터 없음)
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, null);

            // then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("복합 조건 (roomId + status + 날짜 범위)")
    class CombinedFiltering {

        @Test
        @DisplayName("roomId + CONFIRMED + 4월 범위 조건을 모두 만족하는 예약만 반환한다")
        void combinedFilter_returnsOnlyMatchingReservations() {
            // given
            LocalDateTime start = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime end = LocalDateTime.of(2026, 5, 1, 0, 0);

            // roomA, CONFIRMED, 4월 -> 포함
            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 10, 10, 0),
                    LocalDateTime.of(2026, 4, 10, 11, 0),
                    ReservationStatus.CONFIRMED);
            // roomA, CANCELLED, 4월 -> 상태 불일치로 제외
            createReservation(roomA,
                    LocalDateTime.of(2026, 4, 11, 10, 0),
                    LocalDateTime.of(2026, 4, 11, 11, 0),
                    ReservationStatus.CANCELLED);
            // roomB, CONFIRMED, 4월 -> roomId 불일치로 제외
            createReservation(roomB,
                    LocalDateTime.of(2026, 4, 12, 10, 0),
                    LocalDateTime.of(2026, 4, 12, 11, 0),
                    ReservationStatus.CONFIRMED);
            // roomA, CONFIRMED, 5월 -> 날짜 범위 밖으로 제외
            createReservation(roomA,
                    LocalDateTime.of(2026, 5, 1, 10, 0),
                    LocalDateTime.of(2026, 5, 1, 11, 0),
                    ReservationStatus.CONFIRMED);

            // when
            List<CalendarItemDto> results = reservationRepository.findCalendarItems(
                    start, end, ReservationStatus.CONFIRMED, roomA.getId());

            // then
            assertThat(results).hasSize(1);
            assertThat(results.getFirst().roomName()).isEqualTo("회의실 A");
        }
    }
}
