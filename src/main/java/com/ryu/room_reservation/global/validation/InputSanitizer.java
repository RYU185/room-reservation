package com.ryu.room_reservation.global.validation;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * 입력값 허용 문자 정책 검증 유틸리티.
 * 서비스 계층에서 도메인별 허용 문자 규칙을 적용할 때 사용.
 */
@Component
public class InputSanitizer {

    // 이름 (사용자/회의실): 한글·영문·숫자·공백·하이픈 허용
    private static final Pattern SAFE_NAME = Pattern.compile(
            "^[가-힣a-zA-Z0-9 \\-]+$"
    );

    // 예약 제목: 한글·영문·숫자·공백·하이픈·괄호 허용
    private static final Pattern SAFE_TITLE = Pattern.compile(
            "^[가-힣a-zA-Z0-9 \\-()\\[\\]]+$"
    );

    // 위치: 한글·영문·숫자·공백·하이픈·슬래시 허용 (예: 4층 A구역)
    private static final Pattern SAFE_LOCATION = Pattern.compile(
            "^[가-힣a-zA-Z0-9 \\-/층구역]+$"
    );

    public boolean isSafeName(String value) {
        return value != null && SAFE_NAME.matcher(value).matches();
    }

    public boolean isSafeTitle(String value) {
        return value != null && SAFE_TITLE.matcher(value).matches();
    }

    public boolean isSafeLocation(String value) {
        return value != null && SAFE_LOCATION.matcher(value).matches();
    }
}
