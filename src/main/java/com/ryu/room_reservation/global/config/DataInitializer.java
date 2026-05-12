package com.ryu.room_reservation.global.config;

import com.ryu.room_reservation.reservation.entity.Reservation;
import com.ryu.room_reservation.reservation.entity.ReservationStatus;
import com.ryu.room_reservation.reservation.repository.ReservationRepository;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.init.enabled", havingValue = "true", matchIfMissing = false)
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.init.admin.email}")
    private String adminEmail;

    @Value("${app.init.admin.password}")
    private String adminPassword;

    @Value("${app.init.seed.months:6}")
    private int seedMonths;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initAdmin();
        initRooms();
        initReservations();
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

    private void initReservations() {
        if (reservationRepository.count() > 0) {
            return;
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException("관리자 계정이 없습니다."));
        List<Room> rooms = roomRepository.findAll();

        // 회의실별 예약 밀도 (A-101: 높음, B-201: 중간, C-301: 낮음)
        int[] bookingRatePercents = {65, 40, 25};

        // 업무 시간 슬롯 (각 1시간, 비겹침 → EXCLUDE 제약 안전)
        int[] slotHours = {9, 10, 11, 13, 14, 15, 16};

        // 상태 가중치: CONFIRMED 70%, CANCELLED 20%, PENDING 7%, REJECTED 3%
        ReservationStatus[] statusPool = {
                ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED,
                ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED, ReservationStatus.CONFIRMED,
                ReservationStatus.CONFIRMED,
                ReservationStatus.CANCELLED, ReservationStatus.CANCELLED,
                ReservationStatus.PENDING,
                ReservationStatus.REJECTED
        };

        Random random = new Random(42);
        LocalDate start = LocalDate.now().minusMonths(seedMonths).withDayOfMonth(1);
        LocalDate end = LocalDate.now();

        List<Reservation> reservations = new ArrayList<>();
        for (int roomIdx = 0; roomIdx < rooms.size(); roomIdx++) {
            Room room = rooms.get(roomIdx);
            int rate = roomIdx < bookingRatePercents.length ? bookingRatePercents[roomIdx] : 40;

            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    continue;
                }
                for (int slotHour : slotHours) {
                    if (random.nextInt(100) >= rate) {
                        continue;
                    }
                    ReservationStatus status = statusPool[random.nextInt(statusPool.length)];
                    LocalDateTime slotStart = date.atTime(slotHour, 0);
                    LocalDateTime slotEnd = slotStart.plusHours(1);
                    reservations.add(Reservation.builder()
                            .user(admin)
                            .room(room)
                            .title(room.getName() + " 회의")
                            .startTime(slotStart)
                            .endTime(slotEnd)
                            .status(status)
                            .build());
                }
            }
        }

        reservationRepository.saveAll(reservations);
        log.info("[DataInitializer] 샘플 예약 {}건 생성 완료 ({}개월치)", reservations.size(), seedMonths);
    }
}
