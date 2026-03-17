package com.ryu.room_reservation.auth.oauth2;

import com.ryu.room_reservation.user.entity.AuthProvider;
import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * OAuth2 로그인 시 사용자 조회/생성 담당.
 * 기존 providerId 일치 → 기존 User 반환
 * 신규 → 이메일 중복 검사 후 User 생성
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        AuthProvider provider = parseProvider(registrationId);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String providerId = OAuth2UserInfoExtractor.getProviderId(provider, attributes);
        String email     = OAuth2UserInfoExtractor.getEmail(provider, attributes);
        String name      = OAuth2UserInfoExtractor.getName(provider, attributes);

        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> register(email, name, provider, providerId));

        String nameAttr = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        return new CustomOAuth2User(user.getId(), user.getRole(), attributes, nameAttr);
    }

    private AuthProvider parseProvider(String registrationId) {
        try {
            return AuthProvider.valueOf(registrationId);
        } catch (IllegalArgumentException e) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unsupported_provider"),
                    "지원하지 않는 OAuth2 제공자: " + registrationId);
        }
    }

    private User register(String email, String name, AuthProvider provider, String providerId) {
        if (userRepository.existsByEmail(email)) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("email_already_exists"),
                    "이미 다른 방법으로 가입된 이메일입니다: " + email);
        }
        log.info("OAuth2 신규 사용자 등록: provider={}, email={}", provider, email);
        return userRepository.save(User.builder()
                .email(email)
                .name(name)
                .provider(provider)
                .providerId(providerId)
                .build());
    }
}
