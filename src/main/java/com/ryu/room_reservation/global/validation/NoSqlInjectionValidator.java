package com.ryu.room_reservation.global.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * SQL Injection 복합 패턴 검증기.
 * 단순 영단어가 아닌, 실제 공격에 쓰이는 복합 SQL 구문만 차단한다.
 * 1차 방어: JPA 파라미터 바인딩 (PreparedStatement)
 * 2차 방어: 이 Validator (defense-in-depth)
 *
 * 우회 방지: 매칭 전 SQL 주석(-- 및 블록 주석) 및 널 바이트 제거 후 정규화.
 * UNION[주석]SELECT → 정규화 후 UNION SELECT → 패턴 탐지.
 */
public class NoSqlInjectionValidator implements ConstraintValidator<NoSqlInjection, String> {

    // 블록 주석 /* ... */ (DOTALL: 개행 포함)
    private static final Pattern BLOCK_COMMENT = Pattern.compile("/\\*.*?\\*/", Pattern.DOTALL);
    // 라인 주석 -- ...
    private static final Pattern LINE_COMMENT  = Pattern.compile("--[^\\n]*");

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(['\"])|(;)" +                               // 인용 부호, 세미콜론
            "|(\\bUNION\\s+(?:ALL\\s+)?SELECT\\b)" +      // UNION SELECT
            "|(\\bDROP\\s+(?:TABLE|DATABASE|SCHEMA)\\b)" + // DROP TABLE/DATABASE
            "|(\\bINSERT\\s+INTO\\b)" +                   // INSERT INTO
            "|(\\bDELETE\\s+FROM\\b)" +                   // DELETE FROM
            "|(\\bUPDATE\\s+\\w+\\s+SET\\b)" +            // UPDATE table SET
            "|(\\bCREATE\\s+(?:TABLE|DATABASE)\\b)" +     // CREATE TABLE/DATABASE
            "|(\\bEXEC(?:UTE)?\\s*[\\(\\s])" +            // EXEC(UTE)(
            "|(\\bALTER\\s+TABLE\\b)",                    // ALTER TABLE
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return !SQL_INJECTION_PATTERN.matcher(normalize(value)).find();
    }

    /**
     * SQL 주석과 널 바이트를 제거한 뒤 공백을 단일 스페이스로 축약.
     * UNION[주석]SELECT → UNION SELECT 로 변환되어 패턴 탐지 가능.
     */
    
    private static String normalize(String value) {
        String result = BLOCK_COMMENT.matcher(value).replaceAll(" ");
        result = LINE_COMMENT.matcher(result).replaceAll(" ");
        result = result.replace("\u0000", "");     // 널 바이트 제거
        result = result.replaceAll("\\s+", " ");   // 연속 공백 축약
        return result;
    }

}
