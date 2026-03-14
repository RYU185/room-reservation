package com.ryu.room_reservation.global.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * SQL Injection 복합 패턴 검증기.
 * 단순 영단어가 아닌, 실제 공격에 쓰이는 복합 SQL 구문만 차단한다.
 * 1차 방어: JPA 파라미터 바인딩 (PreparedStatement)
 * 2차 방어: 이 Validator (defense-in-depth)
 */
public class NoSqlInjectionValidator implements ConstraintValidator<NoSqlInjection, String> {

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(['\"])|(;)" +                               // 인용 부호, 세미콜론
            "|(--)|(/\\*|\\*/)" +                         // SQL 주석
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
        return !SQL_INJECTION_PATTERN.matcher(value).find();
    }
}
