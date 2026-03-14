# API Specification Gap Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Room Reservation System
> **Version**: 0.0.1-SNAPSHOT
> **Date**: 2026-03-14
> **Design Doc**: [api-spec.design.md](../02-design/features/api-spec.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

api-spec.design.md에 정의된 API 설계와 현재 구현 코드 간의 차이를 식별하고,
미구현 항목을 정량적으로 파악하여 다음 구현 단계(Do Phase)의 작업 범위를 확정한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/api-spec.design.md`
- **Implementation Path**: `src/main/java/com/ryu/room_reservation/`
- **Analysis Date**: 2026-03-14

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (API Endpoints) | 0% | :x: |
| Design Match (Response/Error) | 73% | :warning: |
| Design Match (Security) | 0% | :x: |
| Design Match (Documentation) | 33% | :x: |
| Architecture Compliance (Infra Layer) | 100% | :white_check_mark: |
| **Overall** | **22%** | :x: |

---

## 3. Gap Analysis - Section by Section

### 3.1 Section 4 - Authentication API (`/api/v1/auth`)

| Method | URI | Design | Implementation | Status |
|--------|-----|--------|----------------|:------:|
| POST | `/auth/login` | FR-AUTH-01 | Controller 없음 | :x: |
| POST | `/auth/refresh` | FR-AUTH-03 | Controller 없음 | :x: |
| POST | `/auth/logout` | FR-AUTH-03 | Controller 없음 | :x: |
| GET | `/oauth2/authorization/{provider}` | FR-AUTH-02 | Spring Security OAuth2 미설정 | :x: |
| GET | `/auth/me` | FR-AUTH-04 | Controller 없음 | :x: |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| AuthController | 5개 엔드포인트 처리 | 없음 | :x: |
| AuthService | 로그인/로그아웃/갱신 비즈니스 로직 | 없음 | :x: |
| LoginRequest DTO | email, password 필드 + 검증 | 없음 | :x: |
| LoginResponse DTO | accessToken, tokenType, expiresIn | 없음 | :x: |
| JwtProvider | JWT 발급/검증/파싱 | 없음 (jjwt 의존성만 존재) | :x: |
| JwtAuthenticationFilter | 요청 헤더에서 JWT 추출/검증 | 없음 | :x: |
| SecurityConfig | URL별 접근 권한 설정 | 없음 | :x: |
| RefreshToken Entity | 토큰 저장/갱신/만료 | :white_check_mark: 구현됨 | :white_check_mark: |
| RefreshTokenRepository | CRUD + findByToken | :white_check_mark: 구현됨 | :white_check_mark: |

**Auth API Score: 2/11 (18%)**

---

### 3.2 Section 5 - Room API (`/api/v1/rooms`)

| Method | URI | Design | Implementation | Status |
|--------|-----|--------|----------------|:------:|
| GET | `/rooms` | FR-ROOM-03, 목록 조회 (페이지네이션, 필터) | Controller 없음 | :x: |
| GET | `/rooms/{id}` | FR-ROOM-04, 상세 조회 | Controller 없음 | :x: |
| GET | `/rooms/{id}/availability` | FR-ROOM-05, 가용 여부 조회 | Controller 없음 | :x: |
| POST | `/rooms` | FR-ROOM-01, 회의실 등록 (ADMIN) | Controller 없음 | :x: |
| PUT | `/rooms/{id}` | FR-ROOM-02, 전체 수정 (ADMIN) | Controller 없음 | :x: |
| PATCH | `/rooms/{id}/deactivate` | FR-ROOM-02, 비활성화 (ADMIN) | Controller 없음 | :x: |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| RoomController | 6개 엔드포인트 처리 | 없음 | :x: |
| RoomService | CRUD + 가용 여부 확인 로직 | 없음 | :x: |
| RoomCreateRequest DTO | name, location, capacity, description, amenities | 없음 | :x: |
| RoomUpdateRequest DTO | name, location, capacity, description, amenities | 없음 | :x: |
| RoomResponse DTO | 전체 필드 반환 | 없음 | :x: |
| AvailabilityResponse DTO | roomId, available, conflictingReservations | 없음 | :x: |
| Room Entity | 회의실 엔티티 + deactivate, update 메서드 | :white_check_mark: 구현됨 | :white_check_mark: |
| RoomRepository | findByActiveTrue, existsByName, JpaSpecificationExecutor | :white_check_mark: 구현됨 | :white_check_mark: |

**Room API Score: 2/8 (25%)**

---

### 3.3 Section 6 - Reservation API (`/api/v1/reservations`)

| Method | URI | Design | Implementation | Status |
|--------|-----|--------|----------------|:------:|
| GET | `/reservations/my` | FR-RES-03, 내 예약 목록 (필터) | Controller 없음 | :x: |
| GET | `/reservations/{id}` | FR-RES-03, 상세 조회 (본인/ADMIN) | Controller 없음 | :x: |
| GET | `/reservations/calendar` | FR-RES-06, 캘린더 조회 | Controller 없음 | :x: |
| POST | `/reservations` | FR-RES-01/02, 예약 생성 + 충돌 검사 | Controller 없음 | :x: |
| PUT | `/reservations/{id}` | FR-RES-04, 전체 수정 (본인/ADMIN) | Controller 없음 | :x: |
| PATCH | `/reservations/{id}/cancel` | FR-RES-05, 예약 취소 (본인/ADMIN) | Controller 없음 | :x: |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| ReservationController | 6개 엔드포인트 처리 | 없음 | :x: |
| ReservationService | CRUD + 충돌 검사 + 권한 확인 | 없음 | :x: |
| ReservationCreateRequest DTO | roomId, title, description, startTime, endTime | 없음 | :x: |
| ReservationUpdateRequest DTO | title, description, startTime, endTime | 없음 | :x: |
| ReservationResponse DTO | room 요약, user 요약, status 등 | 없음 | :x: |
| CalendarResponse DTO | 캘린더 형식 응답 | 없음 | :x: |
| Reservation Entity | 엔티티 + cancel, update, isOwnedBy | :white_check_mark: 구현됨 | :white_check_mark: |
| ReservationRepository | 충돌 검사 쿼리 + 페이지네이션 | :white_check_mark: 구현됨 | :white_check_mark: |

**Reservation API Score: 2/8 (25%)**

---

### 3.4 Section 7 - Admin API (`/api/v1/admin`)

| Method | URI | Design | Implementation | Status |
|--------|-----|--------|----------------|:------:|
| GET | `/admin/reservations` | FR-ADMIN-01, 전체 예약 목록 (검색/필터) | Controller 없음 | :x: |
| PATCH | `/admin/reservations/{id}/cancel` | FR-ADMIN-01, 관리자 강제 취소 | Controller 없음 | :x: |
| GET | `/admin/users` | FR-ADMIN-03, 사용자 목록 | Controller 없음 | :x: |
| GET | `/admin/users/{id}/reservations` | FR-ADMIN-03, 사용자별 예약 이력 | Controller 없음 | :x: |
| GET | `/admin/stats/rooms` | FR-ADMIN-02, 회의실 예약률 통계 | Controller 없음 | :x: |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| AdminController | 5개 엔드포인트 처리 | 없음 | :x: |
| AdminService / StatsService | 통계 집계 + 관리 기능 | 없음 | :x: |
| RoomStatsResponse DTO | roomId, roomName, totalReservations, utilizationRate | 없음 | :x: |
| User Entity | 사용자 엔티티 | :white_check_mark: 구현됨 | :white_check_mark: |
| UserRepository | findByEmail, existsByEmail | :white_check_mark: 구현됨 | :white_check_mark: |

**Admin API Score: 2/7 (29%)**

---

### 3.5 Section 2 - Common Response Specification

| Item | Design Requirement | Implementation | Status |
|------|-------------------|----------------|:------:|
| ApiResponse wrapper | `success`, `data`, `meta` 필드 | `ApiResponse<T>` with `success`, `data`, `PageMeta` | :white_check_mark: |
| PageMeta | `total`, `page`, `size`, `totalPages` | `PageMeta` inner class with 동일 필드 | :white_check_mark: |
| ErrorResponse | `success`(false), `code`, `message`, `timestamp` | `ErrorResponse` with 동일 필드 + `errors` 추가 | :white_check_mark: |
| BusinessException | ErrorCode 기반 비즈니스 예외 | `BusinessException` 구현됨 | :white_check_mark: |
| GlobalExceptionHandler | BusinessException, Validation, DataIntegrity, Generic | 5개 핸들러 구현됨 | :white_check_mark: |
| HTTP Status 200/201/204 | 상황별 상태 코드 | Controller 없어 검증 불가 | :warning: |
| HTTP Status 400/401/403/404/409/500 | 에러 상태 코드 매핑 | ErrorCode enum에 정의됨, 핸들러에서 매핑 | :white_check_mark: |

**Response Spec Score: 6/7 (86%)**

---

### 3.6 Section 9 - Error Code List

| Error Code | Design HTTP | Implementation | Status |
|------------|:-----------:|----------------|:------:|
| VALIDATION_FAILED | 400 | ErrorCode(400) | :white_check_mark: |
| INVALID_INPUT | 400 | ErrorCode(400) | :white_check_mark: |
| UNAUTHORIZED | 401 | ErrorCode(401) | :white_check_mark: |
| TOKEN_EXPIRED | 401 | ErrorCode(401) | :white_check_mark: |
| FORBIDDEN | 403 | ErrorCode(403) | :white_check_mark: |
| NOT_FOUND | 404 | ErrorCode(404) | :white_check_mark: |
| RESERVATION_CONFLICT | 409 | ErrorCode(409) | :white_check_mark: |
| EMAIL_DUPLICATE | 409 | ErrorCode(409) | :white_check_mark: |
| ROOM_INACTIVE | 409 | ErrorCode(409) | :white_check_mark: |
| DB_ERROR | 500 | ErrorCode(500) | :white_check_mark: |
| INTERNAL_ERROR | 500 | ErrorCode(500) | :white_check_mark: |

**추가 구현 (Design에 없음):**

| Error Code | HTTP | Description |
|------------|:----:|-------------|
| INVALID_TOKEN | 401 | 유효하지 않은 토큰 |
| USER_NOT_FOUND | 404 | 존재하지 않는 사용자 |
| ROOM_NOT_FOUND | 404 | 존재하지 않는 회의실 |
| RESERVATION_NOT_FOUND | 404 | 존재하지 않는 예약 |

**Error Code Score: 11/11 (100%) + 4 extra codes**

---

### 3.7 Section 3 - Access Control Matrix

| Item | Design Requirement | Implementation | Status |
|------|-------------------|----------------|:------:|
| SecurityConfig class | URL 패턴별 권한 설정 | 없음 | :x: |
| ROLE_USER, ROLE_ADMIN enum | 역할 정의 | `UserRole` enum 구현됨 | :white_check_mark: |
| JWT Authentication Filter | 토큰 기반 인증 필터 | 없음 | :x: |
| OAuth2 Login configuration | 소셜 로그인 연동 | 없음 (의존성만 존재) | :x: |
| Public endpoint 허용 | login, refresh, oauth2 | 없음 | :x: |
| USER+ endpoint 보호 | rooms, reservations 조회 | 없음 | :x: |
| ADMIN-only endpoint 보호 | admin/*, rooms CRUD | 없음 | :x: |

**Security Score: 1/7 (14%)**

---

### 3.8 Section 10 - API Documentation (SpringDoc OpenAPI)

| Item | Design Requirement | Implementation | Status |
|------|-------------------|----------------|:------:|
| springdoc-openapi 의존성 | `springdoc-openapi-starter-webmvc-ui:3.0.2` | build.gradle에 포함 | :white_check_mark: |
| @Tag on Controllers | 각 Controller에 태그 선언 | Controller 없음 | :x: |
| @Operation on endpoints | 각 엔드포인트에 설명 선언 | Controller 없음 | :x: |
| @ApiResponse on endpoints | 응답 형식 선언 | Controller 없음 | :x: |
| @Schema on DTOs | 필드 설명 자동화 | DTO 없음 | :x: |
| @SecurityRequirement | 인증 엔드포인트 표시 | Controller 없음 | :x: |
| Swagger UI 접근 경로 | `/swagger-ui.html` | 설정 없음 (기본값 사용 가능) | :warning: |

**Documentation Score: 1/7 (14%)**

---

### 3.9 Section 8 - Pagination & Sorting Convention

| Item | Design Requirement | Implementation | Status |
|------|-------------------|----------------|:------:|
| page (1-based) | 기본값 1 | ApiResponse.PageMeta에 page 필드 존재 | :warning: |
| size (기본 20, 최대 100) | 기본값 20 | Repository에 Pageable 사용 | :warning: |
| sort (기본 createdAt) | 정렬 기준 필드 | Service 없어 구현 확인 불가 | :x: |
| direction (기본 desc) | asc/desc | Service 없어 구현 확인 불가 | :x: |

**Pagination Score: 0/4 (0%) - Service/Controller 부재로 실질적 구현 불가**

---

## 4. Match Rate Summary

```
+-------------------------------------------------+
|  Overall Match Rate: 22%                        |
+-------------------------------------------------+
|  Category                  | Score    | Status  |
|----------------------------|----------|---------|
|  Auth API (Sec 4)          |  18% (2/11) | FAIL  |
|  Room API (Sec 5)          |  25% (2/8)  | FAIL  |
|  Reservation API (Sec 6)   |  25% (2/8)  | FAIL  |
|  Admin API (Sec 7)         |  29% (2/7)  | FAIL  |
|  Response Spec (Sec 2)     |  86% (6/7)  | PASS  |
|  Error Codes (Sec 9)       | 100% (11/11)| PASS  |
|  Security (Sec 3)          |  14% (1/7)  | FAIL  |
|  Documentation (Sec 10)    |  14% (1/7)  | FAIL  |
|  Pagination (Sec 8)        |   0% (0/4)  | FAIL  |
|----------------------------|----------|---------|
|  TOTAL                     |  22% (27/70)| FAIL  |
+-------------------------------------------------+
```

---

## 5. Implemented vs Missing Summary

### 5.1 Implemented (Design O, Implementation O) - 27 items

| Category | Items |
|----------|-------|
| Entity | User, Room, Reservation, RefreshToken, BaseEntity |
| Enum | UserRole, AuthProvider, ReservationStatus |
| Repository | UserRepository, RoomRepository, ReservationRepository, RefreshTokenRepository |
| Response | ApiResponse (success/data/meta), PageMeta, ErrorResponse |
| Error Handling | ErrorCode (11 codes), BusinessException, GlobalExceptionHandler (5 handlers) |
| Validation | NoSqlInjection, NoSqlInjectionValidator, InputSanitizer |
| Config | JpaConfig, application.properties (JWT/DB/Flyway) |
| Dependency | springdoc-openapi, jjwt, spring-security, oauth2-client |

### 5.2 Missing (Design O, Implementation X) - 43 items

| Priority | Category | Missing Item | Design Reference |
|:--------:|----------|-------------|-----------------|
| CRITICAL | Security | SecurityConfig (URL 접근 제어) | Sec 3 |
| CRITICAL | Security | JwtProvider (JWT 발급/검증) | Sec 4.1 |
| CRITICAL | Security | JwtAuthenticationFilter | Sec 4.1 |
| CRITICAL | Controller | AuthController (5 endpoints) | Sec 4.2 |
| CRITICAL | Controller | RoomController (6 endpoints) | Sec 5.1 |
| CRITICAL | Controller | ReservationController (6 endpoints) | Sec 6.1 |
| CRITICAL | Controller | AdminController (5 endpoints) | Sec 7.1 |
| HIGH | Service | AuthService | Sec 4.2-4.3 |
| HIGH | Service | RoomService | Sec 5.1-5.5 |
| HIGH | Service | ReservationService | Sec 6.1-6.5 |
| HIGH | Service | AdminService / StatsService | Sec 7.1-7.3 |
| HIGH | DTO | LoginRequest (email, password) | Sec 4.3 |
| HIGH | DTO | LoginResponse (accessToken, tokenType, expiresIn) | Sec 4.3 |
| HIGH | DTO | UserInfoResponse (me endpoint) | Sec 4.2 |
| HIGH | DTO | RoomCreateRequest | Sec 5.5 |
| HIGH | DTO | RoomUpdateRequest | Sec 5.5 |
| HIGH | DTO | RoomResponse | Sec 5.4 |
| HIGH | DTO | AvailabilityRequest / Response | Sec 5.3 |
| HIGH | DTO | ReservationCreateRequest | Sec 6.4 |
| HIGH | DTO | ReservationUpdateRequest | Sec 6.4 |
| HIGH | DTO | ReservationResponse | Sec 6.5 |
| HIGH | DTO | CalendarRequest / Response | Sec 6.3 |
| HIGH | DTO | RoomStatsResponse | Sec 7.3 |
| MEDIUM | Config | OAuth2 Success Handler | Sec 4.1 |
| MEDIUM | Config | CORS Configuration | Sec 1.3 |
| MEDIUM | Config | SpringDoc OpenAPI Configuration | Sec 10 |
| MEDIUM | Annotation | @Tag on controllers | Sec 10 |
| MEDIUM | Annotation | @Operation on endpoints | Sec 10 |
| MEDIUM | Annotation | @Schema on DTOs | Sec 10 |
| MEDIUM | Annotation | @SecurityRequirement | Sec 10 |

### 5.3 Added (Design X, Implementation O) - 4 items

| Category | Item | Location | Description |
|----------|------|----------|-------------|
| ErrorCode | INVALID_TOKEN | ErrorCode.java:17 | 설계서에 없는 추가 에러 코드 |
| ErrorCode | USER_NOT_FOUND | ErrorCode.java:24 | 리소스별 세분화된 404 코드 |
| ErrorCode | ROOM_NOT_FOUND | ErrorCode.java:25 | 리소스별 세분화된 404 코드 |
| ErrorCode | RESERVATION_NOT_FOUND | ErrorCode.java:26 | 리소스별 세분화된 404 코드 |

> 이 추가 항목들은 범용 NOT_FOUND를 세분화한 것으로, 설계 문서에 반영하는 것을 권장한다.

---

## 6. Architecture Compliance

### 6.1 Current Layer Structure

```
src/main/java/com/ryu/room_reservation/
|-- global/                          # Infrastructure/Cross-cutting
|   |-- config/                      # Configuration
|   |-- entity/                      # BaseEntity
|   |-- exception/                   # Error handling
|   |-- response/                    # API response wrappers
|   `-- validation/                  # Input validation
|-- auth/
|   |-- entity/                      # RefreshToken
|   `-- repository/                  # RefreshTokenRepository
|-- user/
|   |-- entity/                      # User, UserRole, AuthProvider
|   `-- repository/                  # UserRepository
|-- room/
|   |-- entity/                      # Room
|   `-- repository/                  # RoomRepository
`-- reservation/
    |-- entity/                      # Reservation, ReservationStatus
    `-- repository/                  # ReservationRepository
```

### 6.2 Missing Layers (per domain)

| Domain | Entity | Repository | Service | Controller | DTO |
|--------|:------:|:----------:|:-------:|:----------:|:---:|
| auth | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| user | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| room | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| reservation | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| admin | N/A | N/A | :x: | :x: | :x: |

### 6.3 Dependency Direction

현재 구현된 코드의 의존 방향은 올바르다:
- Entity -> BaseEntity (상속, 정상)
- Repository -> Entity (JPA 의존, 정상)
- Reservation Entity -> BusinessException, ErrorCode (도메인 검증, 정상)
- GlobalExceptionHandler -> ErrorResponse, ErrorCode (인프라 -> 도메인, 정상)

**Architecture Score: 100% (현재 구현된 범위 내에서)**

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Entity class | PascalCase | 100% | 없음 |
| Enum class | PascalCase | 100% | 없음 |
| Repository | PascalCase + Repository | 100% | 없음 |
| Methods | camelCase | 100% | 없음 |
| Package | lowercase dot-separated | 100% | 없음 |
| Constants | UPPER_SNAKE_CASE | 100% | 없음 |

### 7.2 Package Structure

| Expected Package | Exists | Correct |
|------------------|:------:|:-------:|
| `global/config` | :white_check_mark: | :white_check_mark: |
| `global/entity` | :white_check_mark: | :white_check_mark: |
| `global/exception` | :white_check_mark: | :white_check_mark: |
| `global/response` | :white_check_mark: | :white_check_mark: |
| `global/validation` | :white_check_mark: | :white_check_mark: |
| `{domain}/entity` | :white_check_mark: | :white_check_mark: |
| `{domain}/repository` | :white_check_mark: | :white_check_mark: |
| `{domain}/service` | :x: | N/A |
| `{domain}/controller` | :x: | N/A |
| `{domain}/dto` | :x: | N/A |

**Convention Score: 100% (현재 구현된 범위 내에서)**

---

## 8. Detailed Gap - Endpoint Coverage

### 8.1 Total Endpoint Inventory

| # | Method | URI | Domain | Implemented |
|:-:|--------|-----|--------|:-----------:|
| 1 | POST | `/api/v1/auth/login` | Auth | :x: |
| 2 | POST | `/api/v1/auth/refresh` | Auth | :x: |
| 3 | POST | `/api/v1/auth/logout` | Auth | :x: |
| 4 | GET | `/api/v1/auth/me` | Auth | :x: |
| 5 | GET | `/oauth2/authorization/{provider}` | Auth | :x: |
| 6 | GET | `/api/v1/rooms` | Room | :x: |
| 7 | GET | `/api/v1/rooms/{id}` | Room | :x: |
| 8 | GET | `/api/v1/rooms/{id}/availability` | Room | :x: |
| 9 | POST | `/api/v1/rooms` | Room | :x: |
| 10 | PUT | `/api/v1/rooms/{id}` | Room | :x: |
| 11 | PATCH | `/api/v1/rooms/{id}/deactivate` | Room | :x: |
| 12 | GET | `/api/v1/reservations/my` | Reservation | :x: |
| 13 | GET | `/api/v1/reservations/{id}` | Reservation | :x: |
| 14 | GET | `/api/v1/reservations/calendar` | Reservation | :x: |
| 15 | POST | `/api/v1/reservations` | Reservation | :x: |
| 16 | PUT | `/api/v1/reservations/{id}` | Reservation | :x: |
| 17 | PATCH | `/api/v1/reservations/{id}/cancel` | Reservation | :x: |
| 18 | GET | `/api/v1/admin/reservations` | Admin | :x: |
| 19 | PATCH | `/api/v1/admin/reservations/{id}/cancel` | Admin | :x: |
| 20 | GET | `/api/v1/admin/users` | Admin | :x: |
| 21 | GET | `/api/v1/admin/users/{id}/reservations` | Admin | :x: |
| 22 | GET | `/api/v1/admin/stats/rooms` | Admin | :x: |

**Endpoint Coverage: 0/22 (0%)**

---

## 9. Recommended Actions

### 9.1 Immediate Actions (Phase 1 - Security & Auth)

| Priority | Item | Expected Artifacts |
|:--------:|------|-------------------|
| 1 | JwtProvider 구현 | `auth/security/JwtProvider.java` |
| 2 | JwtAuthenticationFilter 구현 | `auth/security/JwtAuthenticationFilter.java` |
| 3 | SecurityConfig 구현 | `global/config/SecurityConfig.java` |
| 4 | AuthService 구현 | `auth/service/AuthService.java` |
| 5 | Auth DTO 구현 | `auth/dto/LoginRequest.java`, `LoginResponse.java` |
| 6 | AuthController 구현 | `auth/controller/AuthController.java` |

### 9.2 Short-term Actions (Phase 2 - Core API)

| Priority | Item | Expected Artifacts |
|:--------:|------|-------------------|
| 1 | RoomService 구현 | `room/service/RoomService.java` |
| 2 | Room DTO 구현 | `room/dto/RoomCreateRequest.java`, `RoomResponse.java` 등 |
| 3 | RoomController 구현 | `room/controller/RoomController.java` |
| 4 | ReservationService 구현 | `reservation/service/ReservationService.java` |
| 5 | Reservation DTO 구현 | `reservation/dto/ReservationCreateRequest.java` 등 |
| 6 | ReservationController 구현 | `reservation/controller/ReservationController.java` |

### 9.3 Medium-term Actions (Phase 3 - Admin & Docs)

| Priority | Item | Expected Artifacts |
|:--------:|------|-------------------|
| 1 | AdminService 구현 | `admin/service/AdminService.java` |
| 2 | Admin DTO 구현 | `admin/dto/RoomStatsResponse.java` 등 |
| 3 | AdminController 구현 | `admin/controller/AdminController.java` |
| 4 | SpringDoc OpenAPI 설정 | `global/config/SwaggerConfig.java` |
| 5 | Controller @Tag, @Operation 어노테이션 | 각 Controller |

---

## 10. Design Document Updates Needed

다음 항목은 구현에 추가되었으나 설계 문서에 반영되지 않은 사항이다:

- [ ] ErrorCode에 `INVALID_TOKEN`(401) 추가 반영
- [ ] ErrorCode에 `USER_NOT_FOUND`(404), `ROOM_NOT_FOUND`(404), `RESERVATION_NOT_FOUND`(404) 추가 반영
- [ ] ErrorResponse에 `errors` (FieldError 목록) 필드 반영 - 검증 오류 시 필드별 상세 메시지 제공
- [ ] ReservationStatus에 `PENDING`, `REJECTED` 상태 추가에 대한 설계 문서 정합성 확인

---

## 11. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Security 미구현 상태로 API 노출 | HIGH | HIGH | SecurityConfig 최우선 구현 |
| Controller 없이 API 테스트 불가 | MEDIUM | CERTAIN | Auth -> Room -> Reservation 순서 구현 |
| OAuth2 연동 복잡도 | MEDIUM | MEDIUM | 로컬 로그인 우선 구현 후 OAuth2 추가 |
| 22개 엔드포인트 일괄 구현 부담 | MEDIUM | LOW | 도메인별 순차 구현 (Auth -> Room -> Reservation -> Admin) |

---

## 12. Next Steps

- [ ] `/pdca do api-spec` 실행하여 구현 시작
- [ ] 구현 순서: Security -> Auth -> Room -> Reservation -> Admin -> Swagger
- [ ] 각 도메인 구현 완료 시 단위 테스트 작성
- [ ] 전체 구현 완료 후 재분석 (`/pdca analyze api-spec`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial gap analysis | gap-detector |
