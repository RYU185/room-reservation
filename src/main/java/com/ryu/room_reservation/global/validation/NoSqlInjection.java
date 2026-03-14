package com.ryu.room_reservation.global.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * 필드값에 SQL Injection 패턴(특수문자·예약 키워드)이 없음을 검증.
 * null 값은 통과시킨다 (필수 여부는 @NotNull 로 별도 선언).
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = NoSqlInjectionValidator.class)
public @interface NoSqlInjection {

    String message() default "허용되지 않는 문자가 포함되어 있습니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
