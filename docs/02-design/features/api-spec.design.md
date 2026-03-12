# [Design] API Specification - Room Reservation System

> 작성일: 2026-03-12
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/requirements.plan.md
> 참조: docs/02-design/features/system-architecture.design.md
> 참조: docs/02-design/features/domain-model.design.md

---

## 1. API 설계 원칙

### 1.1 REST 설계 규칙

| 원칙 | 적용 방식 |
|------|-----------|
| 리소스 중심 URI | 동사 금지, 명사 복수형 사용 (`/rooms`, `/reservations`) |
| HTTP 메서드 의미 준수 | GET(조회), POST(생성), PUT(전체 수정), PATCH(부분 수정), DELETE(삭제) |
| 계층 관계 표현 | `/users/{id}/reservations` 형태로 소유 관계 표현 |
| 버전 관리 | URI 경로에 버전 포함 (`/api/v1/`) |
| Stateless | 서버는 세션 상태를 저장하지 않으며, 모든 인증 정보는 요청 헤더에 포함 |

### 1.2 Base URL

```
개발: http://localhost:8080/api/v1
운영: https://{domain}/api/v1
```

### 1.3 공통 요청 헤더

| 헤더 | 필수 여부 | 값 예시 | 설명 |
|------|-----------|---------|------|
| `Content-Type` | 본문 있는 요청 시 필수 | `application/json` | 요청 본문 형식 |
| `Authorization` | 인증 필요 엔드포인트 | `Bearer {accessToken}` | JWT Access Token |
| `Accept` | 선택 | `application/json` | 응답 형식 협상 |

---

## 2. 공통 응답 규격

### 2.1 성공 응답 구조

모든 성공 응답은 다음 공통 래퍼 구조를 따른다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | Boolean | 처리 성공 여부 (항상 true) |
| `data` | Object \| Array \| null | 실제 응답 데이터 |
| `meta` | Object \| null | 페이지네이션 정보 (목록 응답 시) |

**단건 응답 구조:**
```
success: true
data: { 단일 리소스 객체 }
meta: null
```

**목록 응답 구조:**
```
success: true
data: [ 리소스 배열 ]
meta:
  total: 전체 건수
  page: 현재 페이지 (1-based)
  size: 페이지당 건수
  totalPages: 전체 페이지 수
```

### 2.2 에러 응답 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | Boolean | 항상 false |
| `code` | String | 사전 정의 에러 코드 (예: `RESERVATION_CONFLICT`) |
| `message` | String | 사용자 친화적 설명 |
| `timestamp` | String | ISO 8601 형식 발생 시각 |

### 2.3 HTTP 상태 코드 사용 기준

| 상태 코드 | 사용 상황 |
|-----------|-----------|
| 200 OK | 조회·수정 성공 |
| 201 Created | 생성 성공 (응답 본문에 생성된 리소스 포함) |
| 204 No Content | 삭제·취소 성공 (응답 본문 없음) |
| 400 Bad Request | 입력값 형식 오류·필수 필드 누락·허용 문자 위반 |
| 401 Unauthorized | 인증 토큰 없음·만료·유효하지 않음 |
| 403 Forbidden | 인증은 됐으나 권한 없음 |
| 404 Not Found | 요청한 리소스 없음 |
| 409 Conflict | 예약 시간 충돌·이메일 중복 등 비즈니스 충돌 |
| 500 Internal Server Error | 서버 내부 오류 (상세 내용 미노출) |

---

## 3. 접근 권한 매트릭스

| 도메인 | 엔드포인트 | 비로그인 | ROLE_USER | ROLE_ADMIN |
|--------|------------|:--------:|:---------:|:----------:|
| 인증 | 로그인, 토큰 갱신 | O | O | O |
| 인증 | 로그아웃 | - | O | O |
| 회의실 | 목록 조회, 상세 조회 | - | O | O |
| 회의실 | 가용 여부 조회 | - | O | O |
| 회의실 | 생성·수정·비활성화 | - | - | O |
| 예약 | 내 예약 목록·상세 조회 | - | O(본인) | O(전체) |
| 예약 | 예약 생성 | - | O | O |
| 예약 | 예약 수정·취소 | - | O(본인) | O(전체) |
| 관리자 | 전체 예약 관리 | - | - | O |
| 관리자 | 사용자 목록·이력 조회 | - | - | O |
| 관리자 | 통계 조회 | - | - | O |

---

## 4. 인증 API (`/api/v1/auth`)

### 4.1 인증 흐름 개요

```
[로컬 로그인 흐름]
클라이언트 → POST /auth/login (이메일+비밀번호)
    → 인증 성공 → Access Token(1h) + Refresh Token(7d) 발급
    → 클라이언트: Access Token을 메모리에 보관
                  Refresh Token을 HttpOnly Cookie에 보관

[토큰 갱신 흐름]
Access Token 만료 감지(401 수신)
    → POST /auth/refresh (Refresh Token 자동 전송)
    → 유효한 경우 → 새 Access Token 발급
    → 유효하지 않은 경우 → 재로그인 요구

[OAuth2 소셜 로그인 흐름]
클라이언트 → GET /oauth2/authorization/{provider} (브라우저 리다이렉트)
    → 제공자 동의 화면 → 콜백
    → 서버: 사용자 조회·생성 → JWT 발급 → 프론트엔드로 리다이렉트
```

### 4.2 엔드포인트 목록

| 메서드 | URI | 인증 | 설명 | 요구사항 |
|--------|-----|------|------|---------|
| POST | `/auth/login` | 불필요 | 이메일/비밀번호 로그인 | FR-AUTH-01 |
| POST | `/auth/refresh` | Refresh Token | Access Token 갱신 | FR-AUTH-03 |
| POST | `/auth/logout` | 필요 | 로그아웃 (Refresh Token 삭제) | FR-AUTH-03 |
| GET | `/oauth2/authorization/{provider}` | 불필요 | OAuth2 로그인 시작 (리다이렉트) | FR-AUTH-02 |
| GET | `/auth/me` | 필요 | 현재 로그인 사용자 정보 조회 | FR-AUTH-04 |

### 4.3 로그인 요청/응답

**요청 필드:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `email` | String | O | RFC 5321 이메일 형식, SQL 메타문자 금지 |
| `password` | String | O | 최소 8자, 최대 100자 |

**응답 필드 (`data`):**

| 필드 | 타입 | 설명 |
|------|------|------|
| `accessToken` | String | JWT Access Token |
| `tokenType` | String | 항상 `Bearer` |
| `expiresIn` | Number | Access Token 유효 시간(초) |

> Refresh Token은 응답 본문 미포함. HttpOnly Cookie로만 전달.

---

## 5. 회의실 API (`/api/v1/rooms`)

### 5.1 엔드포인트 목록

| 메서드 | URI | 인증 | 권한 | 설명 | 요구사항 |
|--------|-----|------|------|------|---------|
| GET | `/rooms` | 필요 | USER+ | 회의실 목록 조회 (활성만) | FR-ROOM-03 |
| GET | `/rooms/{id}` | 필요 | USER+ | 회의실 상세 조회 | FR-ROOM-04 |
| GET | `/rooms/{id}/availability` | 필요 | USER+ | 특정 날짜·시간대 가용 여부 | FR-ROOM-05 |
| POST | `/rooms` | 필요 | ADMIN | 회의실 등록 | FR-ROOM-01 |
| PUT | `/rooms/{id}` | 필요 | ADMIN | 회의실 정보 전체 수정 | FR-ROOM-02 |
| PATCH | `/rooms/{id}/deactivate` | 필요 | ADMIN | 회의실 비활성화 (소프트 삭제) | FR-ROOM-02 |

### 5.2 회의실 목록 조회 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | Integer | - | 페이지 번호 (기본: 1) |
| `size` | Integer | - | 페이지당 건수 (기본: 20, 최대: 100) |
| `location` | String | - | 위치 필터 (부분 일치) |
| `minCapacity` | Integer | - | 최소 수용 인원 필터 |

### 5.3 가용 여부 조회 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `startTime` | DateTime | O | 조회 시작 시각 (ISO 8601) |
| `endTime` | DateTime | O | 조회 종료 시각 (ISO 8601) |

**응답 필드 (`data`):**

| 필드 | 타입 | 설명 |
|------|------|------|
| `roomId` | Long | 회의실 ID |
| `available` | Boolean | 해당 시간대 예약 가능 여부 |
| `conflictingReservations` | Array | 충돌 예약 요약 목록 (available=false 시) |

### 5.4 회의실 리소스 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 회의실 ID |
| `name` | String | 회의실 이름 |
| `location` | String | 위치 |
| `capacity` | Integer | 최대 수용 인원 |
| `description` | String | 부가 설명 |
| `amenities` | Array\<String\> | 시설 목록 |
| `isActive` | Boolean | 활성 상태 |
| `createdAt` | DateTime | 생성 시각 |

### 5.5 회의실 생성/수정 요청 필드

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `name` | String | O | 최대 100자, 특수문자 금지 |
| `location` | String | O | 최대 255자, 특수문자 금지 |
| `capacity` | Integer | O | 1 이상 |
| `description` | String | - | 최대 1000자 |
| `amenities` | Array\<String\> | - | 각 항목 최대 50자 |

---

## 6. 예약 API (`/api/v1/reservations`)

### 6.1 엔드포인트 목록

| 메서드 | URI | 인증 | 권한 | 설명 | 요구사항 |
|--------|-----|------|------|------|---------|
| GET | `/reservations/my` | 필요 | USER+ | 내 예약 목록 조회 | FR-RES-03 |
| GET | `/reservations/{id}` | 필요 | USER+(본인)/ADMIN | 예약 상세 조회 | FR-RES-03 |
| GET | `/reservations/calendar` | 필요 | USER+ | 전체 예약 캘린더 조회 | FR-RES-06 |
| POST | `/reservations` | 필요 | USER+ | 예약 생성 | FR-RES-01, FR-RES-02 |
| PUT | `/reservations/{id}` | 필요 | USER+(본인)/ADMIN | 예약 전체 수정 | FR-RES-04 |
| PATCH | `/reservations/{id}/cancel` | 필요 | USER+(본인)/ADMIN | 예약 취소 | FR-RES-05 |

### 6.2 내 예약 목록 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | Integer | - | 페이지 번호 (기본: 1) |
| `size` | Integer | - | 페이지당 건수 (기본: 20) |
| `status` | String | - | 상태 필터 (CONFIRMED / CANCELLED) |
| `from` | Date | - | 조회 시작 날짜 (기본: 오늘) |
| `to` | Date | - | 조회 종료 날짜 |

### 6.3 캘린더 조회 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `year` | Integer | O | 조회 연도 |
| `month` | Integer | O | 조회 월 (1~12) |
| `roomId` | Long | - | 특정 회의실 필터 |

### 6.4 예약 생성 요청 필드

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `roomId` | Long | O | 활성 상태 회의실 ID |
| `title` | String | O | 최대 200자, 특수문자 금지 |
| `description` | String | - | 최대 1000자 |
| `startTime` | DateTime | O | 현재 시각 이후, ISO 8601 |
| `endTime` | DateTime | O | startTime 이후, ISO 8601 |

**생성 처리 흐름:**

```
입력 검증 (필드 형식·특수문자 여부)
    │
    ▼
회의실 활성 상태 확인 (is_active = true)
    │
    ▼
시간 논리 검증 (startTime < endTime, 현재 시각 이후)
    │
    ▼
예약 충돌 검사 (동일 회의실·CONFIRMED 상태·시간 겹침)
    │
    ├── 충돌 있음 → 409 Conflict
    │
    └── 충돌 없음 → Reservation 저장 (status=CONFIRMED) → 201 Created
```

### 6.5 예약 리소스 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 예약 ID |
| `room` | Object | 회의실 요약 정보 (id, name, location) |
| `user` | Object | 예약자 요약 정보 (id, name) — ADMIN 응답에만 포함 |
| `title` | String | 예약 제목 |
| `description` | String | 상세 설명 |
| `startTime` | DateTime | 시작 시각 |
| `endTime` | DateTime | 종료 시각 |
| `status` | String | 예약 상태 |
| `createdAt` | DateTime | 생성 시각 |

---

## 7. 관리자 API (`/api/v1/admin`)

모든 엔드포인트는 `ROLE_ADMIN` 전용이며, 미인가 접근 시 403 응답.

### 7.1 엔드포인트 목록

| 메서드 | URI | 설명 | 요구사항 |
|--------|-----|------|---------|
| GET | `/admin/reservations` | 전체 예약 목록 조회 (검색·필터 포함) | FR-ADMIN-01 |
| PATCH | `/admin/reservations/{id}/cancel` | 관리자 강제 취소 | FR-ADMIN-01 |
| GET | `/admin/users` | 전체 사용자 목록 조회 | FR-ADMIN-03 |
| GET | `/admin/users/{id}/reservations` | 특정 사용자 예약 이력 | FR-ADMIN-03 |
| GET | `/admin/stats/rooms` | 회의실별 예약률 통계 | FR-ADMIN-02 |

### 7.2 전체 예약 목록 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `page` / `size` | Integer | 페이지네이션 |
| `roomId` | Long | 회의실 필터 |
| `userId` | Long | 사용자 필터 |
| `status` | String | 상태 필터 |
| `from` / `to` | Date | 날짜 범위 필터 |

### 7.3 통계 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `roomId` | Long | 회의실 ID |
| `roomName` | String | 회의실 이름 |
| `totalReservations` | Integer | 기간 내 총 예약 수 |
| `confirmedReservations` | Integer | 확정 예약 수 |
| `utilizationRate` | Float | 가동률 (%) — 예약 시간 / 운영 가능 시간 |

---

## 8. 페이지네이션 및 정렬 공통 규약

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `page` | 1 | 1-based 페이지 번호 |
| `size` | 20 | 페이지당 건수 (최대 100) |
| `sort` | `createdAt` | 정렬 기준 필드 |
| `direction` | `desc` | `asc` / `desc` |

---

## 9. 에러 코드 목록

| 코드 | HTTP | 설명 |
|------|------|------|
| `VALIDATION_FAILED` | 400 | 입력값 형식·필수 필드 오류 |
| `INVALID_INPUT` | 400 | 허용되지 않는 문자 포함 |
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `TOKEN_EXPIRED` | 401 | Access Token 만료 (갱신 필요) |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `RESERVATION_CONFLICT` | 409 | 예약 시간 충돌 |
| `EMAIL_DUPLICATE` | 409 | 이미 사용 중인 이메일 |
| `ROOM_INACTIVE` | 409 | 비활성 회의실 예약 시도 |
| `DB_ERROR` | 500 | 서버 내부 오류 (상세 미노출) |
| `INTERNAL_ERROR` | 500 | 예상치 못한 서버 오류 |

---

## 10. API 문서화 전략

- **SpringDoc OpenAPI 3.0.2**를 통해 Swagger UI 자동 생성
- 모든 Controller에 `@Tag`, `@Operation`, `@ApiResponse` 선언 필수
- 요청/응답 DTO에 `@Schema` 선언으로 필드 설명 자동화
- 인증이 필요한 엔드포인트에 `@SecurityRequirement(name = "bearerAuth")` 명시
- Swagger UI 접근 경로: `/swagger-ui.html` (개발 환경만 활성화)

---

## 11. 다음 단계

- [ ] Flyway V1~V4 SQL 마이그레이션 작성
- [ ] JPA 엔티티 및 Repository 구현 (`/pdca do domain-model`)
- [ ] Controller · Service · DTO 구현 (`/pdca do api-spec`)
