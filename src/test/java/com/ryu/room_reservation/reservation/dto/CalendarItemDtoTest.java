package com.ryu.room_reservation.reservation.dto;

import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CalendarItemDto - toResponse 변환 단위 테스트")
class CalendarItemDtoTest {

    private static final Long ID = 1L;
    private static final Long ROOM_ID = 10L;
    private static final String ROOM_NAME = "회의실 A";
    private static final String ROOM_LOCATION = "3층 동관";
    private static final String TITLE = "주간 팀 미팅";
    private static final String DESCRIPTION = "이번 주 스프린트 리뷰";
    private static final LocalDateTime START_TIME = LocalDateTime.of(2026, 4, 6, 10, 0);
    private static final LocalDateTime END_TIME = LocalDateTime.of(2026, 4, 6, 11, 0);
    private static final ReservationStatus STATUS = ReservationStatus.CONFIRMED;
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 4, 1, 9, 0);

    @Test
    @DisplayName("toResponse - 모든 필드가 ReservationResponse에 올바르게 매핑된다")
    void toResponse_mapsAllFieldsCorrectly() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, DESCRIPTION, START_TIME, END_TIME, STATUS, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.id()).isEqualTo(ID);
        assertThat(response.title()).isEqualTo(TITLE);
        assertThat(response.description()).isEqualTo(DESCRIPTION);
        assertThat(response.startTime()).isEqualTo(START_TIME);
        assertThat(response.endTime()).isEqualTo(END_TIME);
        assertThat(response.status()).isEqualTo(STATUS);
        assertThat(response.createdAt()).isEqualTo(CREATED_AT);
    }

    @Test
    @DisplayName("toResponse - RoomSummary가 roomId, roomName, roomLocation으로 생성된다")
    void toResponse_createsRoomSummaryCorrectly() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, DESCRIPTION, START_TIME, END_TIME, STATUS, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.room()).isNotNull();
        assertThat(response.room().id()).isEqualTo(ROOM_ID);
        assertThat(response.room().name()).isEqualTo(ROOM_NAME);
        assertThat(response.room().location()).isEqualTo(ROOM_LOCATION);
    }

    @Test
    @DisplayName("toResponse - user는 항상 null이다 (캘린더 조회 시 사용자 정보 불필요)")
    void toResponse_userIsAlwaysNull() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, DESCRIPTION, START_TIME, END_TIME, STATUS, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.user()).isNull();
    }

    @Test
    @DisplayName("toResponse - description이 null이어도 변환에 성공한다")
    void toResponse_handlesNullDescription() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, null, START_TIME, END_TIME, STATUS, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.description()).isNull();
        assertThat(response.id()).isEqualTo(ID);
    }

    @Test
    @DisplayName("toResponse - CANCELLED 상태도 올바르게 변환된다")
    void toResponse_preservesCancelledStatus() {
        // given
        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, DESCRIPTION, START_TIME, END_TIME,
                ReservationStatus.CANCELLED, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.status()).isEqualTo(ReservationStatus.CANCELLED);
    }

    @Test
    @DisplayName("toResponse - 자정 경계 시간 (00:00~01:00)이 올바르게 변환된다")
    void toResponse_handlesMidnightBoundary() {
        // given
        LocalDateTime midnightStart = LocalDateTime.of(2026, 4, 7, 0, 0);
        LocalDateTime midnightEnd = LocalDateTime.of(2026, 4, 7, 1, 0);

        CalendarItemDto dto = new CalendarItemDto(
                ID, ROOM_ID, ROOM_NAME, ROOM_LOCATION,
                TITLE, DESCRIPTION, midnightStart, midnightEnd, STATUS, CREATED_AT
        );

        // when
        ReservationResponse response = dto.toResponse();

        // then
        assertThat(response.startTime()).isEqualTo(midnightStart);
        assertThat(response.endTime()).isEqualTo(midnightEnd);
    }
}
