package com.ryu.room_reservation.reservation.service;

import com.ryu.room_reservation.reservation.dto.CalendarItemDto;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.repository.ReservationRepository;
import com.ryu.room_reservation.room.repository.RoomRepository;
import com.ryu.room_reservation.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.only;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationService - getCalendar 단위 테스트")
class ReservationServiceCalendarTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReservationService reservationService;

    // ── 날짜 범위 계산 검증 ─────────────────────────────────────

    @Nested
    @DisplayName("날짜 범위 계산")
    class DateRangeCalculation {

        @Test
        @DisplayName("year=2026, month=4 이면 start=4/1 00:00, end=5/1 00:00 으로 Repository를 호출한다")
        void calculatesCorrectDateRange() {
            // given
            LocalDateTime expectedStart = LocalDateTime.of(2026, 4, 1, 0, 0);
            LocalDateTime expectedEnd = LocalDateTime.of(2026, 5, 1, 0, 0);

            given(reservationRepository.findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null))
                    .willReturn(Collections.emptyList());

            // when
            reservationService.getCalendar(2026, 4, null);

            // then
            then(reservationRepository).should(only()).findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null);
        }

        @Test
        @DisplayName("12월 조회 시 end는 다음 해 1/1 00:00 이다")
        void decemberRange_endsNextYearJanuary() {
            // given
            LocalDateTime expectedStart = LocalDateTime.of(2026, 12, 1, 0, 0);
            LocalDateTime expectedEnd = LocalDateTime.of(2027, 1, 1, 0, 0);

            given(reservationRepository.findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null))
                    .willReturn(Collections.emptyList());

            // when
            reservationService.getCalendar(2026, 12, null);

            // then
            then(reservationRepository).should(only()).findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null);
        }

        @Test
        @DisplayName("2월 조회 시 윤년이 아니면 end는 3/1 00:00 이다")
        void februaryRange_endsOnMarchFirst() {
            // given
            LocalDateTime expectedStart = LocalDateTime.of(2027, 2, 1, 0, 0);
            LocalDateTime expectedEnd = LocalDateTime.of(2027, 3, 1, 0, 0);

            given(reservationRepository.findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null))
                    .willReturn(Collections.emptyList());

            // when
            reservationService.getCalendar(2027, 2, null);

            // then
            then(reservationRepository).should(only()).findCalendarItems(
                    expectedStart, expectedEnd, ReservationStatus.CONFIRMED, null);
        }
    }

    // ── roomId 전달 검증 ─────────────────────────────────────

    @Nested
    @DisplayName("roomId 전달")
    class RoomIdPassing {

        @Test
        @DisplayName("roomId가 null이면 Repository에 null을 전달한다")
        void whenRoomIdNull_passesNull() {
            // given
            given(reservationRepository.findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, null))
                    .willReturn(Collections.emptyList());

            // when
            reservationService.getCalendar(2026, 4, null);

            // then
            then(reservationRepository).should().findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, null);
        }

        @Test
        @DisplayName("roomId가 지정되면 Repository에 해당 값을 전달한다")
        void whenRoomIdGiven_passesValue() {
            // given
            Long roomId = 42L;
            given(reservationRepository.findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, roomId))
                    .willReturn(Collections.emptyList());

            // when
            reservationService.getCalendar(2026, 4, roomId);

            // then
            then(reservationRepository).should().findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, roomId);
        }
    }

    // ── 결과 변환 검증 ─────────────────────────────────────

    @Nested
    @DisplayName("DTO -> Response 변환")
    class DtoToResponseMapping {

        @Test
        @DisplayName("Repository가 반환한 CalendarItemDto 목록이 ReservationResponse 목록으로 변환된다")
        void mapsCalendarItemDtoToReservationResponse() {
            // given
            CalendarItemDto dto1 = new CalendarItemDto(
                    1L, 10L, "회의실 A", "3층",
                    "팀 미팅", "설명1",
                    LocalDateTime.of(2026, 4, 5, 10, 0),
                    LocalDateTime.of(2026, 4, 5, 11, 0),
                    ReservationStatus.CONFIRMED,
                    LocalDateTime.of(2026, 4, 1, 9, 0));
            CalendarItemDto dto2 = new CalendarItemDto(
                    2L, 20L, "회의실 B", "4층",
                    "프로젝트 리뷰", "설명2",
                    LocalDateTime.of(2026, 4, 6, 14, 0),
                    LocalDateTime.of(2026, 4, 6, 15, 0),
                    ReservationStatus.CONFIRMED,
                    LocalDateTime.of(2026, 4, 2, 9, 0));

            given(reservationRepository.findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, null))
                    .willReturn(List.of(dto1, dto2));

            // when
            List<ReservationResponse> results = reservationService.getCalendar(2026, 4, null);

            // then
            assertThat(results).hasSize(2);

            ReservationResponse first = results.get(0);
            assertThat(first.id()).isEqualTo(1L);
            assertThat(first.room().id()).isEqualTo(10L);
            assertThat(first.room().name()).isEqualTo("회의실 A");
            assertThat(first.title()).isEqualTo("팀 미팅");
            assertThat(first.user()).isNull();

            ReservationResponse second = results.get(1);
            assertThat(second.id()).isEqualTo(2L);
            assertThat(second.room().name()).isEqualTo("회의실 B");
            assertThat(second.title()).isEqualTo("프로젝트 리뷰");
        }

        @Test
        @DisplayName("Repository가 빈 목록을 반환하면 빈 리스트를 반환한다")
        void whenNoResults_returnsEmptyList() {
            // given
            given(reservationRepository.findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, null))
                    .willReturn(Collections.emptyList());

            // when
            List<ReservationResponse> results = reservationService.getCalendar(2026, 4, null);

            // then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("변환된 ReservationResponse의 user는 항상 null이다")
        void responseUserIsAlwaysNull() {
            // given
            CalendarItemDto dto = new CalendarItemDto(
                    1L, 10L, "회의실 A", "3층",
                    "미팅", null,
                    LocalDateTime.of(2026, 4, 5, 10, 0),
                    LocalDateTime.of(2026, 4, 5, 11, 0),
                    ReservationStatus.CONFIRMED,
                    LocalDateTime.of(2026, 4, 1, 9, 0));

            given(reservationRepository.findCalendarItems(
                    LocalDateTime.of(2026, 4, 1, 0, 0),
                    LocalDateTime.of(2026, 5, 1, 0, 0),
                    ReservationStatus.CONFIRMED, null))
                    .willReturn(List.of(dto));

            // when
            List<ReservationResponse> results = reservationService.getCalendar(2026, 4, null);

            // then
            assertThat(results).hasSize(1);
            assertThat(results.getFirst().user()).isNull();
        }
    }

    // ── 상태 파라미터 검증 ─────────────────────────────────────

    @Test
    @DisplayName("항상 CONFIRMED 상태로 Repository를 호출한다")
    void alwaysPassesConfirmedStatus() {
        // given
        given(reservationRepository.findCalendarItems(
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 5, 1, 0, 0),
                ReservationStatus.CONFIRMED, null))
                .willReturn(Collections.emptyList());

        // when
        reservationService.getCalendar(2026, 4, null);

        // then
        then(reservationRepository).should().findCalendarItems(
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 5, 1, 0, 0),
                ReservationStatus.CONFIRMED, null);
    }

    // ── 불변 리스트 검증 ─────────────────────────────────────

    @Test
    @DisplayName("반환된 리스트는 불변이다 (toList 사용)")
    void returnedListIsUnmodifiable() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                1L, 10L, "회의실 A", "3층",
                "미팅", null,
                LocalDateTime.of(2026, 4, 5, 10, 0),
                LocalDateTime.of(2026, 4, 5, 11, 0),
                ReservationStatus.CONFIRMED,
                LocalDateTime.of(2026, 4, 1, 9, 0));

        given(reservationRepository.findCalendarItems(
                LocalDateTime.of(2026, 4, 1, 0, 0),
                LocalDateTime.of(2026, 5, 1, 0, 0),
                ReservationStatus.CONFIRMED, null))
                .willReturn(List.of(dto));

        // when
        List<ReservationResponse> results = reservationService.getCalendar(2026, 4, null);

        // then
        assertThat(results).isUnmodifiable();
    }
}
