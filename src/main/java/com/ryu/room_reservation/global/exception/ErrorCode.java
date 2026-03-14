package com.ryu.room_reservation.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 400 - Validation
    VALIDATION_FAILED(400, "입력값이 올바르지 않습니다."),
    INVALID_INPUT(400, "허용되지 않는 문자가 포함되어 있습니다."),

    // 401 - Authentication
    UNAUTHORIZED(401, "인증이 필요합니다."),
    TOKEN_EXPIRED(401, "액세스 토큰이 만료되었습니다. 갱신이 필요합니다."),
    INVALID_TOKEN(401, "유효하지 않은 토큰입니다."),

    // 403 - Authorization
    FORBIDDEN(403, "접근 권한이 없습니다."),

    // 404 - Not Found
    NOT_FOUND(404, "요청한 리소스를 찾을 수 없습니다."),
    USER_NOT_FOUND(404, "존재하지 않는 사용자입니다."),
    ROOM_NOT_FOUND(404, "존재하지 않는 회의실입니다."),
    RESERVATION_NOT_FOUND(404, "존재하지 않는 예약입니다."),

    // 409 - Business Conflict
    RESERVATION_CONFLICT(409, "해당 시간대에 이미 예약이 존재합니다."),
    EMAIL_DUPLICATE(409, "이미 사용 중인 이메일입니다."),
    ROOM_INACTIVE(409, "비활성화된 회의실에는 예약할 수 없습니다."),

    // 500 - Server Error
    DB_ERROR(500, "데이터베이스 오류가 발생했습니다."),
    INTERNAL_ERROR(500, "서버 내부 오류가 발생했습니다.");

    private final int status;
    private final String message;
}
