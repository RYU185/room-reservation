# [Design] Domain Model - Room Reservation System

> 작성일: 2026-03-12
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/requirements.plan.md
> 참조: docs/02-design/features/system-architecture.design.md

---

## 1. 도메인 모델 아키텍처

### 1.1 도메인 구성 원칙

본 시스템은 **레이어드 아키텍처** 내에서 도메인 계층을 명확히 분리한다.
도메인 객체는 순수한 비즈니스 규칙만 포함하며, 인프라(DB, 외부 서비스)에 의존하지 않는다.

```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                   │
│         (요청 수신 · 응답 반환 · 입력 검증)           │
├─────────────────────────────────────────────────────┤
│                 Application Layer                    │
│        (유스케이스 조율 · 트랜잭션 경계 관리)          │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                       │
│      (엔티티 · 도메인 규칙 · 상태 전이 정의)          │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                   │
│       (JPA Repository · DB · 외부 API 연동)          │
└─────────────────────────────────────────────────────┘
```

**계층 간 의존 방향:** Presentation → Application → Domain ← Infrastructure
- Domain 계층은 외부에 의존하지 않는다 (의존성 역전)
- Infrastructure가 Domain의 Repository 인터페이스를 구현한다

---

### 1.2 핵심 도메인 경계

시스템의 핵심 도메인은 세 개의 **Bounded Context**로 구성된다.

```
┌────────────────────────────────────────────────────────────┐
│                    Room Reservation System                  │
│                                                            │
│  ┌─────────────────┐   ┌──────────────────────────────┐   │
│  │  Identity &     │   │     Reservation Context      │   │
│  │  Access Context │   │                              │   │
│  │                 │   │  ┌──────────┐ ┌──────────┐  │   │
│  │  • User         │   │  │Reservation│ │  Room    │  │   │
│  │  • 인증/인가    │   │  │(Aggregate)│ │(Aggregate│  │   │
│  │  • 세션 관리    │   │  └──────────┘ └──────────┘  │   │
│  │                 │   │                              │   │
│  └─────────────────┘   └──────────────────────────────┘   │
│           │                        │                       │
│           └────────────────────────┘                       │
│                    User (공유 참조)                         │
└────────────────────────────────────────────────────────────┘
```

---

## 2. 엔티티 관계 모델

### 2.1 전체 ERD

```
┌─────────────────────┐           ┌─────────────────────────┐
│        User         │           │          Room           │
├─────────────────────┤           ├─────────────────────────┤
│ id (PK)             │           │ id (PK)                 │
│ email (UNIQUE)      │           │ name                    │
│ password (nullable) │           │ location                │
│ name                │           │ capacity                │
│ role                │           │ description             │
│ provider            │           │ amenities (JSON)        │
│ provider_id         │           │ is_active               │
│ is_active           │           │ created_at              │
│ created_at          │           │ updated_at              │
│ updated_at          │           └──────────┬──────────────┘
└──────────┬──────────┘                      │
           │                                 │
           │ 1 : N                      1 : N│
           │                                 │
           └─────────────┬───────────────────┘
                         │
               ┌─────────▼──────────┐
               │     Reservation    │
               ├────────────────────┤
               │ id (PK)            │
               │ user_id (FK)       │
               │ room_id (FK)       │
               │ title              │
               │ description        │
               │ start_time         │
               │ end_time           │
               │ status             │
               │ created_at         │
               │ updated_at         │
               └────────────────────┘

┌─────────────────────┐
│    RefreshToken     │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK, 1:1)   │
│ token               │
│ expires_at          │
│ created_at          │
└─────────────────────┘
```

---

## 3. 엔티티 상세 설계

### 3.1 User (사용자)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 사용자 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 이메일 |
| password | VARCHAR(255) | nullable | BCrypt 해시 (OAuth2는 null) |
| name | VARCHAR(100) | NOT NULL | 표시 이름 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'ROLE_USER' | ROLE_USER / ROLE_ADMIN |
| provider | VARCHAR(20) | NOT NULL, DEFAULT 'LOCAL' | LOCAL / GOOGLE / GITHUB |
| provider_id | VARCHAR(255) | nullable | OAuth2 제공자 고유 ID |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 계정 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 시각 (자동) |
| updated_at | TIMESTAMP | NOT NULL | 수정 시각 (자동) |

**도메인 규칙:**
- LOCAL 인증 사용자는 반드시 password 보유
- OAuth2 사용자는 provider_id 필수, password는 저장하지 않음
- 동일 이메일로 LOCAL과 소셜 로그인이 공존할 경우, 계정을 단일 User로 연계

---

### 3.2 Room (회의실)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 회의실 고유 ID |
| name | VARCHAR(100) | NOT NULL | 회의실 이름 (예: A-401) |
| location | VARCHAR(255) | NOT NULL | 위치 설명 (예: 4층 A구역) |
| capacity | INTEGER | NOT NULL, CHECK > 0 | 최대 수용 인원 |
| description | TEXT | nullable | 부가 설명 |
| amenities | JSONB | nullable | 시설 목록 배열 (예: 빔프로젝터, 화이트보드) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 예약 가능 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 시각 (자동) |
| updated_at | TIMESTAMP | NOT NULL | 수정 시각 (자동) |

**도메인 규칙:**
- `is_active = false` 상태의 회의실은 예약 생성 불가
- 물리적 삭제 대신 `is_active = false`로 소프트 삭제 처리
- 관리자만 생성·수정·비활성화 가능

---

### 3.3 Reservation (예약)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 예약 고유 ID |
| user_id | BIGINT | FK → User.id, NOT NULL | 예약자 |
| room_id | BIGINT | FK → Room.id, NOT NULL | 대상 회의실 |
| title | VARCHAR(200) | NOT NULL | 예약 제목·목적 |
| description | TEXT | nullable | 상세 설명 |
| start_time | TIMESTAMP | NOT NULL | 예약 시작 시각 |
| end_time | TIMESTAMP | NOT NULL | 예약 종료 시각 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'CONFIRMED' | 예약 상태 |
| created_at | TIMESTAMP | NOT NULL | 생성 시각 (자동) |
| updated_at | TIMESTAMP | NOT NULL | 수정 시각 (자동) |

**예약 상태(Status) 전이:**

```
                   [생성]
                     │
                     ▼
               CONFIRMED ──────────────────┐
                     │                     │
         수정 요청   │    취소 요청         │
             ┌───────┘      │               │
             │              ▼               │
             │         CANCELLED            │
             │                              │
             ▼                    (Could)   │
          PENDING ───거절──► REJECTED        │
             │                              │
             └────승인────► CONFIRMED ───────┘
```

| 상태 | 설명 | 전이 조건 |
|------|------|-----------|
| CONFIRMED | 확정된 예약 | 생성 시 기본값 또는 승인 시 |
| CANCELLED | 취소 | 예약자 본인 또는 관리자 요청 |
| PENDING | 승인 대기 | 관리자 승인 워크플로우 활성 시 (Could) |
| REJECTED | 거절 | 관리자가 PENDING 예약 거절 시 (Could) |

**도메인 규칙:**
- `start_time < end_time` 반드시 성립 (동일 시각 불가)
- 동일 회의실에 CONFIRMED 상태의 시간대 중복 예약 불가
  - 충돌 판정 조건: 신규 시작 시각 < 기존 종료 시각 AND 신규 종료 시각 > 기존 시작 시각
- 예약 취소는 상태 변경(CANCELLED)으로 처리, 물리 삭제 금지
- ROLE_USER는 본인 예약만 수정·취소 가능
- ROLE_ADMIN은 모든 예약 관리 가능

---

### 3.4 RefreshToken (갱신 토큰)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 레코드 고유 ID |
| user_id | BIGINT | FK → User.id, UNIQUE | 사용자 (1:1 관계) |
| token | VARCHAR(512) | NOT NULL | Refresh Token 문자열 |
| expires_at | TIMESTAMP | NOT NULL | 만료 시각 |
| created_at | TIMESTAMP | NOT NULL | 발급 시각 (자동) |

**도메인 규칙:**
- 사용자당 활성 Refresh Token 1개 유지 (신규 발급 시 기존 덮어쓰기)
- 로그아웃 시 레코드 삭제
- 만료 토큰은 정기 배치로 정리

---

## 4. 공통 설계 원칙

### 4.1 공통 시간 필드 (Audit)

모든 엔티티는 `created_at`, `updated_at`을 보유한다.
이 필드는 시스템이 자동으로 기록하며, 애플리케이션 코드에서 직접 설정하지 않는다.

### 4.2 소프트 삭제 정책

| 엔티티 | 삭제 방식 | 이유 |
|--------|-----------|------|
| User | `is_active = false` | 예약 이력 보존 |
| Room | `is_active = false` | 예약 이력 보존 |
| Reservation | `status = CANCELLED` | 예약 이력·감사 추적 |
| RefreshToken | 물리 삭제 | 보안상 즉시 무효화 필요 |

### 4.3 DB 인덱스 전략

| 인덱스 대상 | 목적 |
|-------------|------|
| `users.email` | 로그인 시 빠른 사용자 조회 |
| `users(provider, provider_id)` | OAuth2 사용자 조회 |
| `rooms.is_active` | 예약 가능 회의실 필터링 |
| `reservations.user_id` | 내 예약 목록 조회 |
| `reservations.room_id` | 회의실별 예약 조회 |
| `reservations(room_id, start_time, end_time)` | 예약 충돌 검사 |
| `reservations.status` | 상태별 예약 필터링 |
| `refresh_tokens.user_id` | 토큰 조회·갱신 |

---

## 5. 패키지 구조

```
com.ryu.room_reservation/
├── user/
│   ├── entity/        User, UserRole(ENUM), AuthProvider(ENUM)
│   ├── repository/    UserRepository
│   ├── service/       UserService
│   └── dto/           UserResponse, UserUpdateRequest
├── room/
│   ├── entity/        Room
│   ├── repository/    RoomRepository
│   ├── service/       RoomService
│   └── dto/           RoomRequest, RoomResponse
├── reservation/
│   ├── entity/        Reservation, ReservationStatus(ENUM)
│   ├── repository/    ReservationRepository
│   ├── service/       ReservationService
│   └── dto/           ReservationCreateRequest, ReservationResponse
├── auth/
│   ├── entity/        RefreshToken
│   ├── service/       AuthService
│   ├── jwt/           JwtProvider, JwtFilter
│   └── dto/           LoginRequest, TokenResponse
└── global/
    ├── config/        SecurityConfig, CorsConfig, JpaConfig
    ├── exception/     GlobalExceptionHandler, BusinessException, ErrorCode
    ├── response/      ApiResponse, ErrorResponse
    └── validation/    InputSanitizer, NoSqlInjection(Annotation)
```

---

## 6. Flyway 마이그레이션 계획

```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_rooms_table.sql
├── V3__create_reservations_table.sql
└── V4__create_refresh_tokens_table.sql
```

스키마 변경은 반드시 Flyway 마이그레이션 파일로 관리하며, 엔티티 직접 DDL(`ddl-auto: update`) 사용을 금지한다.

---

## 7. 보안 설계 - SQL Injection 방어

### 7.1 입력값 검증 흐름

```
사용자 요청
    │
    ▼
[Presentation Layer] ── 형식 검증 ──► 실패 시 즉시 거부 (400)
    │ (길이·형식·허용 문자 패턴 검사)
    ▼
[Application Layer] ── 비즈니스 검증 ──► 실패 시 거부 (409/422)
    │ (중복 예약·권한·상태 조건 검사)
    ▼
[Infrastructure Layer] ── 파라미터 바인딩 쿼리 실행
    │ (문자열 연결 없이 PreparedStatement 사용)
    ▼
    DB
```

### 7.2 입력 허용 문자 정책

| 필드 | 허용 범위 | 특수문자 처리 |
|------|-----------|--------------|
| email | RFC 5321 이메일 형식 | SQL 메타문자 포함 시 거부 |
| name (사용자) | 한글·영문·숫자·공백 | 허용 범위 외 문자 포함 시 거부 |
| title (예약) | 한글·영문·숫자·공백·하이픈 | 허용 범위 외 문자 포함 시 거부 |
| description | 일반 텍스트(멀티라인) | SQL 메타문자 포함 시 거부 |
| name (회의실) | 한글·영문·숫자·공백·하이픈 | 허용 범위 외 문자 포함 시 거부 |

**공통 차단 대상:** `'` `"` `;` `--` `/*` `*/` 및 SQL 예약 키워드(`UNION`, `SELECT`, `DROP`, `EXEC` 등)

검증은 `global/validation/` 패키지의 **공통 Validator 컴포넌트** 하나에 집중한다.
모든 DTO 필드는 이 Validator를 선언적으로 참조하여 검증을 위임한다.

### 7.3 쿼리 실행 정책

| 방식 | 허용 여부 | 이유 |
|------|-----------|------|
| JPA 메서드 파생 쿼리 | 허용 (기본) | 자동 파라미터 바인딩 |
| JPQL + 명시적 파라미터 바인딩 | 허용 | PreparedStatement와 동일 |
| Native Query + 파라미터 바인딩 | 제한적 허용 | 코드 리뷰 필수 |
| 문자열 연결 동적 SQL | **전면 금지** | SQL Injection 직접 노출 |
| 동적 조건 쿼리 | Specification(Criteria API) 사용 | 파라미터 바인딩 자동 보장 |

### 7.4 에러 응답 정책

**원칙: 내부 구현 세부사항을 클라이언트에 절대 노출하지 않는다.**

```
예외 발생
    │
    ▼
GlobalExceptionHandler (전역 처리)
    │
    ├── 입력 검증 실패 ──────► 400 Bad Request
    │   (필드명 + 사용자 친화 메시지만 반환)
    │
    ├── 비즈니스 예외 ──────► 409 / 403 / 404 등
    │   (사전 정의된 ErrorCode 메시지만 반환)
    │
    ├── DB / JPA 예외 ──────► 500 Internal Server Error
    │   (서버 로그에 상세 기록 / 클라이언트에 "서버 오류" 메시지만 반환)
    │
    └── 미처리 예외 ─────────► 500 Internal Server Error
        (서버 로그에 상세 기록 / 클라이언트에 제네릭 메시지만 반환)
```

**클라이언트 응답 형식 (표준화):**

```
{
  "code": "사전 정의 에러 코드",
  "message": "사용자 친화적 설명",
  "timestamp": "ISO 8601 시각"
}
```

**클라이언트 응답에서 반드시 제거할 항목:**

| 제거 대상 | 이유 |
|-----------|------|
| DB 에러 메시지 | 테이블명·컬럼명 노출 위험 |
| SQL 상태 코드 (SQLState) | DBMS 종류 식별 가능 |
| 스택 트레이스 | 내부 코드 경로 노출 |
| 예외 클래스명 | 기술 스택 식별 가능 |
| Hibernate 상세 메시지 | ORM 구현체 노출 |

**서버 설정:** 프레임워크 수준에서 에러 상세 노출을 비활성화하며, 상세 로그는 서버 내부(파일·로그 수집 시스템)에만 기록한다.

---

## 8. 다음 단계

- [ ] Flyway V1~V4 SQL 마이그레이션 파일 작성
- [ ] `/pdca design api-spec` — API 상세 명세 설계
- [ ] JPA 엔티티 및 Repository 인터페이스 구현 (Do Phase)
- [ ] `global/validation/` 공통 Validator 구현 (Do Phase)
- [ ] `global/exception/` GlobalExceptionHandler 구현 (Do Phase)
