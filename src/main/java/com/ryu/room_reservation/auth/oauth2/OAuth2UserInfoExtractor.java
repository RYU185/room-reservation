package com.ryu.room_reservation.auth.oauth2;

import com.ryu.room_reservation.user.entity.AuthProvider;

import java.util.Map;

/**
 * OAuth2 제공자별 사용자 속성 추출 유틸리티.
 * Google: sub / email / name
 * GitHub: id  / email / name
 */
public final class OAuth2UserInfoExtractor {

    private OAuth2UserInfoExtractor() {}

    public static String getProviderId(AuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> (String) attributes.get("sub");
            case GITHUB -> String.valueOf(attributes.get("id"));
            default -> throw new IllegalArgumentException("지원하지 않는 제공자: " + provider);
        };
    }

    public static String getEmail(AuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE, GITHUB -> (String) attributes.get("email");
            default -> throw new IllegalArgumentException("지원하지 않는 제공자: " + provider);
        };
    }

    public static String getName(AuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE, GITHUB -> (String) attributes.get("name");
            default -> throw new IllegalArgumentException("지원하지 않는 제공자: " + provider);
        };
    }
}
