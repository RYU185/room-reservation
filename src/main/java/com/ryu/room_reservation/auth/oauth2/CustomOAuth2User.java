package com.ryu.room_reservation.auth.oauth2;

import com.ryu.room_reservation.user.entity.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Spring OAuth2User 래퍼.
 * 도메인 userId와 role을 담아 SuccessHandler에서 JWT 발급에 사용된다.
 */
public class CustomOAuth2User implements OAuth2User {

    private final Long userId;
    private final UserRole role;
    private final Map<String, Object> attributes;
    private final String nameAttributeKey;

    public CustomOAuth2User(Long userId, UserRole role, Map<String, Object> attributes, String nameAttributeKey) {
        this.userId = userId;
        this.role = role;
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
    }

    public Long getUserId() { return userId; }
    public UserRole getRole() { return role; }

    @Override
    public Map<String, Object> getAttributes() { return attributes; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getName() {
        return String.valueOf(attributes.get(nameAttributeKey));
    }
}
