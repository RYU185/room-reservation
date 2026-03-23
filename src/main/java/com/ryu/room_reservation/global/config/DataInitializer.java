package com.ryu.room_reservation.global.config;

import com.ryu.room_reservation.room.entity.Room;
import com.ryu.room_reservation.room.repository.RoomRepository;
import com.ryu.room_reservation.user.entity.AuthProvider;
import com.ryu.room_reservation.user.entity.User;
import com.ryu.room_reservation.user.entity.UserRole;
import com.ryu.room_reservation.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.init.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.init.admin.email}")
    private String adminEmail;

    @Value("${app.init.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initAdmin();
        initRooms();
    }

    private void initAdmin() {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }
        userRepository.save(User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .name("관리자")
                .role(UserRole.ROLE_ADMIN)
                .provider(AuthProvider.LOCAL)
                .build());
        log.info("[DataInitializer] 관리자 계정 생성 완료");
    }

    private void initRooms() {
        if (roomRepository.count() > 0) {
            return;
        }
        List<Room> rooms = List.of(
                Room.builder().name("A-101").location("1층 A구역").capacity(6)
                        .description("소규모 회의실").amenities(List.of("화이트보드", "TV")).build(),
                Room.builder().name("B-201").location("2층 B구역").capacity(12)
                        .description("중규모 회의실").amenities(List.of("빔프로젝터", "화이트보드", "화상회의 장비")).build(),
                Room.builder().name("C-301").location("3층 C구역").capacity(30)
                        .description("대형 회의실").amenities(List.of("빔프로젝터", "마이크", "화이트보드")).build()
        );
        roomRepository.saveAll(rooms);
        log.info("[DataInitializer] 샘플 회의실 3개 생성 완료");
    }
}
