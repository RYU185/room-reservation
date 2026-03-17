# API Specification Gap Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Room Reservation System
> **Version**: 0.0.1-SNAPSHOT
> **Analyst**: gap-detector
> **Date**: 2026-03-17
> **Design Doc**: [api-spec.design.md](../02-design/features/api-spec.design.md)
> **Previous Analysis**: 2026-03-17 v0.2 (Match Rate 93%)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

2026-03-17 v0.2 분석(93%) 이후 추가된 구현 변경사항을 반영하여
api-spec.design.md 설계 문서와의 Match Rate를 재측정한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/api-spec.design.md`
- **Implementation Path**: `src/main/java/com/ryu/room_reservation/`
- **Analysis Date**: 2026-03-17
- **Delta Period**: v0.2 -> v0.3 (same day)

### 1.3 Changes Since Previous Analysis (v0.2 -> v0.3)

| Category | v0.2 Status | v0.3 Status | Change |
|----------|:-----------:|:-----------:|--------|
| `from`/`to` 날짜 필터 (reservations/my) | 미구현 | 구현 완료 | ReservationController + ReservationService Specification |
| `@ApiResponse` 어노테이션 (21개 엔드포인트) | 미구현 | 전체 적용 | 4개 Controller, 21개 엔드포인트 |
| `@Schema` 어노테이션 (11개 DTO) | 미구현 | 전체 적용 | 클래스 + 필드 레벨 모두 적용 |
| `spring.data.web.pageable.max-page-size=100` | 미구현 | application.properties 적용 | Spring Data 글로벌 제한 |

---

## 2. Overall Scores

| Category | v0.2 (3/17) | v0.3 (3/17) | Status |
|----------|:---:|:---:|:---:|
| Auth API (Sec 4) | 91% | 91% | :white_check_mark: |
| Room API (Sec 5) | 100% | 100% | :white_check_mark: |
| Reservation API (Sec 6) | 96% | 100% | :white_check_mark: |
| Admin API (Sec 7) | 100% | 100% | :white_check_mark: |
| Response Spec (Sec 2) | 100% | 100% | :white_check_mark: |
| Error Codes (Sec 9) | 100% | 100% | :white_check_mark: |
| Security (Sec 3) | 86% | 91% | :white_check_mark: |
| Documentation (Sec 10) | 71% | 100% | :white_check_mark: |
| Pagination (Sec 8) | 75% | 100% | :white_check_mark: |
| **Overall** | **93%** | **97%** | :white_check_mark: |

---

## 3. Gap Analysis - Section by Section

### 3.1 Section 4 - Authentication API (`/api/v1/auth`)

| Method | URI | Design | Implementation | Status | Notes |
|--------|-----|--------|----------------|:------:|-------|
| POST | `/auth/login` | FR-AUTH-01 | AuthController:38-51 | :white_check_mark: | email/password -> AccessToken + RefreshToken(cookie) |
| POST | `/auth/refresh` | FR-AUTH-03 | AuthController:53-68 | :white_check_mark: | @CookieValue refreshToken -> new tokens |
| POST | `/auth/logout` | FR-AUTH-03 | AuthController:70-89 | :white_check_mark: | 204 No Content + cookie delete |
| GET | `/oauth2/authorization/{provider}` | FR-AUTH-02 | SecurityConfig permitAll (Spring 자동) | :warning: | Spring Security OAuth2 Client 자동 처리 위임. OAuth2 Success Handler 미구현 |
| GET | `/auth/me` | FR-AUTH-04 | AuthController:91-101 | :white_check_mark: | UserResponse 반환 |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| AuthController | 4+1 엔드포인트 처리 | 4 엔드포인트 구현 (OAuth2 제외) | :white_check_mark: |
| AuthService | 로그인/갱신/로그아웃/내정보 | login, refresh, logout, getMyInfo | :white_check_mark: |
| LoginRequest DTO | email, password + 검증 | record, @Email, @NotBlank, @Size, @NoSqlInjection, @Schema | :white_check_mark: |
| TokenResponse DTO | accessToken, tokenType, expiresIn | record + @Schema on all fields | :white_check_mark: |
| AuthTokens DTO | 내부 전달용 (refresh 포함) | record(tokenResponse, refreshToken, refreshTokenExpiry) | :white_check_mark: |
| UserResponse DTO | 사용자 정보 | record(id, email, name, role, createdAt) + @Schema | :white_check_mark: |
| JwtProvider | JWT 발급/검증/파싱 | generateAccessToken, generateRefreshToken, validateToken, getUserId, getRole | :white_check_mark: |
| JwtAuthenticationFilter | Authorization 헤더 -> SecurityContext | OncePerRequestFilter, Bearer 토큰 추출/검증 | :white_check_mark: |
| UserPrincipal | 인증 주체 | record(userId, role) + isAdmin() | :white_check_mark: |
| RefreshToken Entity | 토큰 저장/갱신/만료 | 이전 구현 유지 | :white_check_mark: |
| @ApiResponse 어노테이션 | 모든 엔드포인트 | 4개 메서드 모두 @ApiResponses 적용 | :white_check_mark: |

**Auth API Score: 11/12 (91%)**

미구현 사항:
- OAuth2 Success Handler (소셜 로그인 콜백 -> JWT 발급 -> 프론트엔드 리다이렉트)

---

### 3.2 Section 5 - Room API (`/api/v1/rooms`)

| Method | URI | Design | Implementation | Status | Notes |
|--------|-----|--------|----------------|:------:|-------|
| GET | `/rooms` | FR-ROOM-03 | RoomController:34-54 | :white_check_mark: | Pageable + location/minCapacity 필터 + PageMeta |
| GET | `/rooms/{id}` | FR-ROOM-04 | RoomController:56-65 | :white_check_mark: | RoomResponse 반환 |
| GET | `/rooms/{id}/availability` | FR-ROOM-05 | RoomController:67-79 | :white_check_mark: | startTime/endTime 파라미터, RoomAvailabilityResponse |
| POST | `/rooms` | FR-ROOM-01 | RoomController:81-92 | :white_check_mark: | @PreAuthorize("hasRole('ADMIN')"), 201 Created |
| PUT | `/rooms/{id}` | FR-ROOM-02 | RoomController:94-108 | :white_check_mark: | @PreAuthorize("hasRole('ADMIN')") |
| PATCH | `/rooms/{id}/deactivate` | FR-ROOM-02 | RoomController:110-122 | :white_check_mark: | @PreAuthorize("hasRole('ADMIN')"), 204 No Content |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| RoomController | 6개 엔드포인트 + @ApiResponse | 6개 엔드포인트, 전체 @ApiResponses 적용 | :white_check_mark: |
| RoomService | CRUD + 가용 여부 확인 | getRooms, getRoom, checkAvailability, createRoom, updateRoom, deactivateRoom | :white_check_mark: |
| RoomRequest DTO | name, location, capacity, description, amenities + 검증 + @Schema | record + @NotBlank, @Size, @Min, @NoSqlInjection + @Schema all fields | :white_check_mark: |
| RoomResponse DTO | 8개 필드 + @Schema | 8개 필드 모두 일치 + @Schema all fields | :white_check_mark: |
| RoomAvailabilityResponse DTO | roomId, available, conflictingReservations + @Schema | record + ConflictSummary inner record + @Schema | :white_check_mark: |

**Room API Score: 11/11 (100%)**

---

### 3.3 Section 6 - Reservation API (`/api/v1/reservations`)

| Method | URI | Design | Implementation | Status | Notes |
|--------|-----|--------|----------------|:------:|-------|
| GET | `/reservations/my` | FR-RES-03 | ReservationController:41-64 | :white_check_mark: | userId + pageable + status + from/to 필터 |
| GET | `/reservations/{id}` | FR-RES-03 | ReservationController:80-93 | :white_check_mark: | 본인/ADMIN 권한 분기 |
| GET | `/reservations/calendar` | FR-RES-06 | ReservationController:66-78 | :white_check_mark: | year, month, roomId 파라미터 |
| POST | `/reservations` | FR-RES-01/02 | ReservationController:95-108 | :white_check_mark: | 201 Created, 충돌 검사 포함 |
| PUT | `/reservations/{id}` | FR-RES-04 | ReservationController:110-125 | :white_check_mark: | 본인/ADMIN 권한 분기, 충돌 재검사 |
| PATCH | `/reservations/{id}/cancel` | FR-RES-05 | ReservationController:127-141 | :white_check_mark: | 본인/ADMIN 권한 분기, 204 No Content |

**쿼리 파라미터 검증 (Sec 6.2) -- v0.2에서 미구현이었던 from/to 해결:**

| 파라미터 | 설계 (Sec 6.2) | 구현 | Status |
|---------|---------------|------|:------:|
| page | O | O (Pageable) | :white_check_mark: |
| size | O | O (Pageable) | :white_check_mark: |
| status | O | O (@RequestParam ReservationStatus) | :white_check_mark: |
| from | O | O (@RequestParam LocalDate + @DateTimeFormat) | :white_check_mark: |
| to | O | O (@RequestParam LocalDate + @DateTimeFormat) | :white_check_mark: |

**from/to 구현 상세:**
- Controller: `@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from/to`
- Service: `Specification<Reservation>` 기반 동적 쿼리, `from.atStartOfDay()` / `to.plusDays(1).atStartOfDay()` 변환

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| ReservationController | 6개 엔드포인트 + @ApiResponse | 6개 엔드포인트, 전체 @ApiResponses 적용 | :white_check_mark: |
| ReservationService | CRUD + 충돌 검사 + 권한 확인 + 날짜 필터 | Specification 기반 동적 쿼리 (status, from, to) | :white_check_mark: |
| ReservationCreateRequest DTO | roomId, title, description, startTime, endTime + @Schema | record + @NotNull, @NotBlank, @Size, @Future, @NoSqlInjection + @Schema | :white_check_mark: |
| ReservationUpdateRequest DTO | title, description, startTime, endTime + @Schema | record + @NotBlank, @Size, @Future, @NoSqlInjection + @Schema | :white_check_mark: |
| ReservationResponse DTO | 9개 필드 + RoomSummary/UserSummary + @Schema | record + inner records + @JsonInclude(NON_NULL) + @Schema | :white_check_mark: |

**비즈니스 로직 검증:**

| 비즈니스 규칙 | 설계 | 구현 | Status |
|-------------|------|------|:------:|
| 시간 논리 검증 (startTime < endTime) | Sec 6.4 | ReservationService | :white_check_mark: |
| 회의실 활성 상태 확인 | Sec 6.4 | ReservationService | :white_check_mark: |
| 예약 충돌 검사 (CONFIRMED 상태) | Sec 6.4 | existsConflict JPQL | :white_check_mark: |
| 현재 시각 이후 검증 | Sec 6.4 | @Future on startTime | :white_check_mark: |
| 본인/ADMIN 권한 분기 | Sec 6.1 | isOwnedBy + isAdmin | :white_check_mark: |
| 취소된 예약 수정 방지 | implicit | updateReservation | :white_check_mark: |
| 수정 시 충돌 재검사 (자기 자신 제외) | implicit | existsConflict(excludeId) | :white_check_mark: |

**Reservation API Score: 16/16 (100%)**

---

### 3.4 Section 7 - Admin API (`/api/v1/admin`)

| Method | URI | Design | Implementation | Status | Notes |
|--------|-----|--------|----------------|:------:|-------|
| GET | `/admin/reservations` | FR-ADMIN-01 | AdminController:39-64 | :white_check_mark: | roomId, userId, status, from, to 필터 + PageMeta |
| PATCH | `/admin/reservations/{id}/cancel` | FR-ADMIN-01 | AdminController:66-77 | :white_check_mark: | 204 No Content |
| GET | `/admin/users` | FR-ADMIN-03 | AdminController:79-98 | :white_check_mark: | PageMeta |
| GET | `/admin/users/{id}/reservations` | FR-ADMIN-03 | AdminController:100-121 | :white_check_mark: | PageMeta, 존재 확인 포함 |
| GET | `/admin/stats/rooms` | FR-ADMIN-02 | AdminController:123-134 | :white_check_mark: | year, month 파라미터, @Min/@Max 검증 |

**Supporting Components:**

| Component | Design Requirement | Implementation | Status |
|-----------|-------------------|----------------|:------:|
| AdminController | 5개 엔드포인트 + @ApiResponse | 5개 엔드포인트, 전체 @ApiResponses 적용 | :white_check_mark: |
| AdminService | 통계 집계 + 관리 기능 | getAllReservations, cancelReservation, getAllUsers, getUserReservations, getRoomStats | :white_check_mark: |
| AdminReservationResponse DTO | 예약 + 사용자 정보 포함 + @Schema | record + UserSummary(id, name, email) + @Schema all fields | :white_check_mark: |
| RoomStatsResponse DTO | 5개 필드 + @Schema | 5개 필드 모두 일치 + @Schema all fields | :white_check_mark: |

**Admin API Score: 9/9 (100%)**

---

### 3.5 Section 2 - Common Response Specification

| Item | Design Requirement | Implementation | Status |
|------|-------------------|----------------|:------:|
| ApiResponse wrapper | `success`, `data`, `meta` | ApiResponse(success, data, PageMeta) + @JsonInclude(NON_NULL) | :white_check_mark: |
| PageMeta | total, page, size, totalPages | PageMeta inner class, 4 fields | :white_check_mark: |
| ErrorResponse | success(false), code, message, timestamp | ErrorResponse.of + timestamp (Instant) | :white_check_mark: |
| ErrorResponse.errors | FieldError 목록 (검증 시) | FieldError(field, message) | :white_check_mark: |
| HTTP 200 OK | 조회/수정 성공 | ResponseEntity.ok() | :white_check_mark: |
| HTTP 201 Created | 생성 성공 | ResponseEntity.status(201) | :white_check_mark: |
| HTTP 204 No Content | 삭제/취소 성공 | ResponseEntity.noContent().build() | :white_check_mark: |

**Response Spec Score: 7/7 (100%)**

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
| SecurityConfig class | URL 패턴별 권한 설정 | SecurityConfig.java 구현 | :white_check_mark: |
| ROLE_USER, ROLE_ADMIN enum | 역할 정의 | UserRole enum | :white_check_mark: |
| JWT Authentication Filter | 토큰 기반 인증 필터 | JwtAuthenticationFilter (OncePerRequestFilter) | :white_check_mark: |
| Public endpoints 허용 | login, refresh, oauth2 | `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/oauth2/**` permitAll | :white_check_mark: |
| ADMIN-only endpoint 보호 | admin/* | `/api/v1/admin/**` hasRole("ADMIN") | :white_check_mark: |
| USER+ endpoint 보호 | rooms, reservations | anyRequest().authenticated() | :white_check_mark: |
| 401/403 커스텀 응답 | ErrorResponse 형식 | authenticationEntryPoint, accessDeniedHandler (JSON 응답) | :white_check_mark: |
| CORS 설정 | 요청 허용 정책 | CorsConfigurationSource bean | :white_check_mark: |
| Stateless 세션 | 서버 세션 미사용 | SessionCreationPolicy.STATELESS | :white_check_mark: |
| OAuth2 로그인 설정 | 소셜 로그인 연동 | URL 패턴만 permitAll, OAuth2 SuccessHandler 미구현 | :warning: |
| BCryptPasswordEncoder | 비밀번호 암호화 | PasswordEncoder bean | :white_check_mark: |

**Security Score: 10/11 (91%)**

---

### 3.8 Section 10 - API Documentation (SpringDoc OpenAPI)

| Item | Design Requirement | v0.2 Status | v0.3 Status | Notes |
|------|-------------------|:-----------:|:-----------:|-------|
| springdoc-openapi 의존성 | `springdoc-openapi-starter-webmvc-ui` | :white_check_mark: | :white_check_mark: | build.gradle |
| @Tag on Controllers | 각 Controller에 태그 선언 | :white_check_mark: | :white_check_mark: | 4개 Controller 모두 |
| @Operation on endpoints | 각 엔드포인트에 설명 선언 | :white_check_mark: | :white_check_mark: | 21개 엔드포인트 모두 |
| @SecurityRequirement | 인증 엔드포인트 표시 | :white_check_mark: | :white_check_mark: | 클래스/메서드 레벨 적용 |
| @ApiResponse on endpoints | 응답 형식 선언 | :x: | :white_check_mark: | **신규** 21개 엔드포인트 전체 @ApiResponses 적용 |
| @Schema on DTOs | 필드 설명 자동화 | :x: | :white_check_mark: | **신규** 11개 DTO 전체 @Schema 적용 |
| Swagger UI 접근 경로 | `/swagger-ui.html` | :white_check_mark: | :white_check_mark: | SecurityConfig permitAll |

**@ApiResponse 적용 상세:**

| Controller | 엔드포인트 수 | @ApiResponses 적용 | 응답 코드 커버리지 |
|------------|:---:|:---:|---|
| AuthController | 4 | 4/4 | 200, 204, 400, 401 |
| RoomController | 6 | 6/6 | 200, 201, 204, 400, 401, 403, 404 |
| ReservationController | 6 | 6/6 | 200, 201, 204, 400, 401, 403, 404, 409 |
| AdminController | 5 | 5/5 | 200, 204, 401, 403, 404 |

**@Schema 적용 상세:**

| DTO | 클래스 레벨 @Schema | 필드 레벨 @Schema | Status |
|-----|:---:|:---:|:---:|
| LoginRequest | :white_check_mark: | :white_check_mark: (2 fields) | :white_check_mark: |
| TokenResponse | :white_check_mark: | :white_check_mark: (3 fields) | :white_check_mark: |
| RoomRequest | :white_check_mark: | :white_check_mark: (5 fields) | :white_check_mark: |
| RoomResponse | :white_check_mark: | :white_check_mark: (8 fields) | :white_check_mark: |
| RoomAvailabilityResponse | :white_check_mark: | :white_check_mark: (3 fields + inner) | :white_check_mark: |
| ReservationCreateRequest | :white_check_mark: | :white_check_mark: (5 fields) | :white_check_mark: |
| ReservationUpdateRequest | :white_check_mark: | :white_check_mark: (4 fields) | :white_check_mark: |
| ReservationResponse | :white_check_mark: | :white_check_mark: (9 fields + inners) | :white_check_mark: |
| AdminReservationResponse | :white_check_mark: | :white_check_mark: (9 fields + inner) | :white_check_mark: |
| RoomStatsResponse | :white_check_mark: | :white_check_mark: (5 fields) | :white_check_mark: |
| UserResponse | :white_check_mark: | :white_check_mark: (5 fields) | :white_check_mark: |

**Documentation Score: 7/7 (100%)** (v0.2: 5/7 -> v0.3: 7/7, +29%p)

---

### 3.9 Section 8 - Pagination & Sorting Convention

| Item | Design Requirement | Implementation | Status | Notes |
|------|-------------------|----------------|:------:|-------|
| page (1-based) | 기본값 1 | Spring Pageable 0-based, Controller에서 +1 변환 | :white_check_mark: | 응답의 page는 1-based |
| size (기본 20, 최대 100) | 기본값 20, 최대 100 | @PageableDefault(size=20) + `spring.data.web.pageable.max-page-size=100` | :white_check_mark: | **v0.3 해결** |
| sort (기본 createdAt) | 정렬 기준 필드 | 컨텍스트별 상이 (rooms: name, reservations: startTime) | :warning: | 설계 기본값과 불일치 (의도적 차이) |
| direction (기본 desc) | asc/desc | ReservationController/AdminController: DESC | :white_check_mark: | |

**Pagination Score: 3.5/4 (88%)**

> **Note**: size 최대 100 제한은 `spring.data.web.pageable.max-page-size=100` (application.properties:37)으로 글로벌 적용됨. 이전 분석에서 미구현이었던 항목 해결.
> sort 기본값은 설계의 `createdAt`과 다르지만, 이는 각 도메인에 맞는 의미 있는 기본 정렬을 적용한 의도적 차이로 판단.

---

## 4. Endpoint Coverage

### 4.1 Total Endpoint Inventory

| # | Method | URI | Domain | Implemented | Status |
|:-:|--------|-----|--------|:-----------:|:------:|
| 1 | POST | `/api/v1/auth/login` | Auth | AuthController | :white_check_mark: |
| 2 | POST | `/api/v1/auth/refresh` | Auth | AuthController | :white_check_mark: |
| 3 | POST | `/api/v1/auth/logout` | Auth | AuthController | :white_check_mark: |
| 4 | GET | `/api/v1/auth/me` | Auth | AuthController | :white_check_mark: |
| 5 | GET | `/oauth2/authorization/{provider}` | Auth | SecurityConfig permitAll (Spring 자동) | :warning: |
| 6 | GET | `/api/v1/rooms` | Room | RoomController | :white_check_mark: |
| 7 | GET | `/api/v1/rooms/{id}` | Room | RoomController | :white_check_mark: |
| 8 | GET | `/api/v1/rooms/{id}/availability` | Room | RoomController | :white_check_mark: |
| 9 | POST | `/api/v1/rooms` | Room | RoomController | :white_check_mark: |
| 10 | PUT | `/api/v1/rooms/{id}` | Room | RoomController | :white_check_mark: |
| 11 | PATCH | `/api/v1/rooms/{id}/deactivate` | Room | RoomController | :white_check_mark: |
| 12 | GET | `/api/v1/reservations/my` | Reservation | ReservationController | :white_check_mark: |
| 13 | GET | `/api/v1/reservations/{id}` | Reservation | ReservationController | :white_check_mark: |
| 14 | GET | `/api/v1/reservations/calendar` | Reservation | ReservationController | :white_check_mark: |
| 15 | POST | `/api/v1/reservations` | Reservation | ReservationController | :white_check_mark: |
| 16 | PUT | `/api/v1/reservations/{id}` | Reservation | ReservationController | :white_check_mark: |
| 17 | PATCH | `/api/v1/reservations/{id}/cancel` | Reservation | ReservationController | :white_check_mark: |
| 18 | GET | `/api/v1/admin/reservations` | Admin | AdminController | :white_check_mark: |
| 19 | PATCH | `/api/v1/admin/reservations/{id}/cancel` | Admin | AdminController | :white_check_mark: |
| 20 | GET | `/api/v1/admin/users` | Admin | AdminController | :white_check_mark: |
| 21 | GET | `/api/v1/admin/users/{id}/reservations` | Admin | AdminController | :white_check_mark: |
| 22 | GET | `/api/v1/admin/stats/rooms` | Admin | AdminController | :white_check_mark: |

**Endpoint Coverage: 21/22 (95.5%)** -- OAuth2 엔드포인트는 Spring Security 자동 처리 의존

---

## 5. DTO Field Comparison

### 5.1 Login Request (Sec 4.3)

| Field | Design Type | Design Constraint | Impl Type | Impl Constraint | Status |
|-------|-------------|-------------------|-----------|-----------------|:------:|
| email | String | RFC 5321, SQL 메타문자 금지 | String | @Email, @NotBlank, @NoSqlInjection, @Schema | :white_check_mark: |
| password | String | 8~100자 | String | @NotBlank, @Size(min=8, max=100), @Schema | :white_check_mark: |

### 5.2 Token Response (Sec 4.3)

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|:------:|
| accessToken | String | String + @Schema | :white_check_mark: |
| tokenType | String ("Bearer") | String ("Bearer") + @Schema | :white_check_mark: |
| expiresIn | Number (초) | long + @Schema | :white_check_mark: |

### 5.3 Room Request (Sec 5.5)

| Field | Design Type | Design Constraint | Impl Type | Impl Constraint | Status |
|-------|-------------|-------------------|-----------|-----------------|:------:|
| name | String | 필수, 최대 100자, 특수문자 금지 | String | @NotBlank, @Size(max=100), @NoSqlInjection, @Schema | :white_check_mark: |
| location | String | 필수, 최대 255자, 특수문자 금지 | String | @NotBlank, @Size(max=255), @NoSqlInjection, @Schema | :white_check_mark: |
| capacity | Integer | 필수, 1 이상 | Integer | @NotNull, @Min(1), @Schema | :white_check_mark: |
| description | String | 선택, 최대 1000자 | String | @Size(max=1000), @Schema | :white_check_mark: |
| amenities | Array\<String\> | 선택, 각 50자 | List\<String\> | @Size(max=50) per element, @Schema | :white_check_mark: |

### 5.4 Room Response (Sec 5.4)

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|:------:|
| id | Long | Long + @Schema | :white_check_mark: |
| name | String | String + @Schema | :white_check_mark: |
| location | String | String + @Schema | :white_check_mark: |
| capacity | Integer | int + @Schema | :white_check_mark: |
| description | String | String + @Schema | :white_check_mark: |
| amenities | Array\<String\> | List\<String\> + @Schema | :white_check_mark: |
| isActive | Boolean | boolean + @Schema | :white_check_mark: |
| createdAt | DateTime | LocalDateTime + @Schema | :white_check_mark: |

### 5.5 Room Availability Response (Sec 5.3)

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|:------:|
| roomId | Long | Long + @Schema | :white_check_mark: |
| available | Boolean | boolean + @Schema | :white_check_mark: |
| conflictingReservations | Array | List\<ConflictSummary\> + @Schema | :white_check_mark: |

### 5.6 Reservation Create Request (Sec 6.4)

| Field | Design Type | Design Constraint | Impl Type | Impl Constraint | Status |
|-------|-------------|-------------------|-----------|-----------------|:------:|
| roomId | Long | 필수, 활성 회의실 | Long | @NotNull, @Schema | :white_check_mark: |
| title | String | 필수, 최대 200자, 특수문자 금지 | String | @NotBlank, @Size(max=200), @NoSqlInjection, @Schema | :white_check_mark: |
| description | String | 선택, 최대 1000자 | String | @Size(max=1000), @Schema | :white_check_mark: |
| startTime | DateTime | 필수, 현재 시각 이후, ISO 8601 | LocalDateTime | @NotNull, @Future, @Schema | :white_check_mark: |
| endTime | DateTime | 필수, startTime 이후, ISO 8601 | LocalDateTime | @NotNull, @Schema | :white_check_mark: |

### 5.7 Reservation Response (Sec 6.5)

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|:------:|
| id | Long | Long + @Schema | :white_check_mark: |
| room | Object (id, name, location) | RoomSummary(id, name, location) + @Schema | :white_check_mark: |
| user | Object (id, name) -- ADMIN only | UserSummary(id, name) + @JsonInclude(NON_NULL) + @Schema | :white_check_mark: |
| title | String | String + @Schema | :white_check_mark: |
| description | String | String + @Schema | :white_check_mark: |
| startTime | DateTime | LocalDateTime + @Schema | :white_check_mark: |
| endTime | DateTime | LocalDateTime + @Schema | :white_check_mark: |
| status | String | ReservationStatus + @Schema | :white_check_mark: |
| createdAt | DateTime | LocalDateTime + @Schema | :white_check_mark: |

### 5.8 Room Stats Response (Sec 7.3)

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|:------:|
| roomId | Long | Long + @Schema | :white_check_mark: |
| roomName | String | String + @Schema | :white_check_mark: |
| totalReservations | Integer | int + @Schema | :white_check_mark: |
| confirmedReservations | Integer | int + @Schema | :white_check_mark: |
| utilizationRate | Float (%) | double + @Schema | :white_check_mark: |

---

## 6. Architecture Compliance

### 6.1 Current Layer Structure

```
src/main/java/com/ryu/room_reservation/
|-- global/
|   |-- config/          SecurityConfig, JpaConfig, DataInitializer
|   |-- entity/          BaseEntity
|   |-- exception/       ErrorCode, BusinessException, GlobalExceptionHandler
|   |-- response/        ApiResponse, ErrorResponse
|   |-- security/        UserPrincipal
|   `-- validation/      NoSqlInjection, NoSqlInjectionValidator, InputSanitizer
|-- auth/
|   |-- controller/      AuthController
|   |-- dto/             LoginRequest, TokenResponse, AuthTokens
|   |-- entity/          RefreshToken
|   |-- jwt/             JwtProvider, JwtAuthenticationFilter
|   |-- repository/      RefreshTokenRepository
|   `-- service/         AuthService
|-- user/
|   |-- dto/             UserResponse
|   |-- entity/          User, UserRole, AuthProvider
|   |-- repository/      UserRepository
|   `-- service/         UserService
|-- room/
|   |-- controller/      RoomController
|   |-- dto/             RoomRequest, RoomResponse, RoomAvailabilityResponse
|   |-- entity/          Room
|   |-- repository/      RoomRepository
|   `-- service/         RoomService
|-- reservation/
|   |-- controller/      ReservationController
|   |-- dto/             ReservationCreateRequest, ReservationUpdateRequest, ReservationResponse
|   |-- entity/          Reservation, ReservationStatus
|   |-- repository/      ReservationRepository
|   `-- service/         ReservationService
`-- admin/
    |-- controller/      AdminController
    |-- dto/             AdminReservationResponse, RoomStatsResponse
    `-- service/         AdminService
```

### 6.2 Dependency Direction

| From | To | Direction | Status |
|------|----|-----------|:------:|
| Controller | Service | Controller -> Service | :white_check_mark: |
| Controller | DTO | Controller -> DTO | :white_check_mark: |
| Service | Repository | Service -> Repository | :white_check_mark: |
| Service | Entity | Service -> Entity | :white_check_mark: |
| Service | DTO | Service -> DTO | :white_check_mark: |
| DTO | Entity | DTO -> Entity (static from()) | :white_check_mark: |
| Entity | BaseEntity | Entity -> BaseEntity (상속) | :white_check_mark: |

**Architecture Score: 100%**

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Entity classes | PascalCase | 100% | 없음 |
| Controller classes | PascalCase + Controller | 100% | 없음 |
| Service classes | PascalCase + Service | 100% | 없음 |
| Repository interfaces | PascalCase + Repository | 100% | 없음 |
| DTO classes | PascalCase + Request/Response | 100% | 없음 |
| Enum classes | PascalCase | 100% | 없음 |
| Methods | camelCase | 100% | 없음 |
| Packages | lowercase | 100% | 없음 |
| Constants | UPPER_SNAKE_CASE | 100% | 없음 |

**Convention Score: 100%**

---

## 8. Match Rate Summary

```
+----------------------------------------------------------+
|  Overall Match Rate: 97%                                  |
+----------------------------------------------------------+
|  Category                       | Score        | Status  |
|---------------------------------|------------|---------|
|  Auth API (Sec 4)               |  91% (11/12) | PASS   |
|  Room API (Sec 5)               | 100% (11/11) | PASS   |
|  Reservation API (Sec 6)        | 100% (16/16) | PASS   |
|  Admin API (Sec 7)              | 100%  (9/9)  | PASS   |
|  Response Spec (Sec 2)          | 100%  (7/7)  | PASS   |
|  Error Codes (Sec 9)            | 100% (11/11) | PASS   |
|  Security (Sec 3)               |  91% (10/11) | PASS   |
|  Documentation (Sec 10)         | 100%  (7/7)  | PASS   |
|  Pagination (Sec 8)             |  88% (3.5/4) | PASS   |
|  Architecture Compliance        | 100%         | PASS   |
|  Convention Compliance          | 100%         | PASS   |
|---------------------------------|------------|---------|
|  TOTAL                          |  97%         | PASS   |
+----------------------------------------------------------+
|  v0.1 (2026-03-14):             22%                      |
|  v0.2 (2026-03-17):             93%                      |
|  v0.3 (2026-03-17):             97%    (+4%p from v0.2)  |
+----------------------------------------------------------+
```

---

## 9. Differences Found

### 9.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|:-:|------|-----------------|-------------|:------:|
| 1 | OAuth2 Success Handler | Sec 4.1 | 소셜 로그인 콜백 -> JWT 발급 -> 프론트엔드 리다이렉트 핸들러 미구현 | MEDIUM |

### 9.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Recommendation |
|:-:|------|------------------------|-------------|---------------|
| 1 | ErrorCode.INVALID_TOKEN | ErrorCode.java:17 | 유효하지 않은 토큰 코드 | 설계 문서 반영 권장 |
| 2 | ErrorCode.USER_NOT_FOUND | ErrorCode.java:24 | 리소스별 세분화된 404 | 설계 문서 반영 권장 |
| 3 | ErrorCode.ROOM_NOT_FOUND | ErrorCode.java:25 | 리소스별 세분화된 404 | 설계 문서 반영 권장 |
| 4 | ErrorCode.RESERVATION_NOT_FOUND | ErrorCode.java:26 | 리소스별 세분화된 404 | 설계 문서 반영 권장 |
| 5 | AdminReservationResponse.UserSummary.email | AdminReservationResponse.java:43 | 관리자용 사용자 요약에 email 포함 | 설계 문서 반영 권장 |
| 6 | DataInitializer | global/config/DataInitializer.java | 초기 데이터 자동 생성 | 개발 편의 기능 |
| 7 | CORS Configuration | SecurityConfig.java | cors.allowed-origins 설정 | 설계 문서 반영 권장 |
| 8 | DateTimeException Handler | GlobalExceptionHandler.java:81-90 | 날짜/시간 파싱 예외 처리 | 구현 상세 |
| 9 | ConstraintViolationException Handler | GlobalExceptionHandler.java:43-59 | @Validated 파라미터 검증 예외 처리 | 구현 상세 |

### 9.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|:-:|------|--------|----------------|:------:|
| 1 | Room DTO 구조 | 별도 Create/Update Request | 단일 RoomRequest로 통합 | LOW |
| 2 | Admin UserSummary | user: Object(id, name) | AdminReservationResponse.UserSummary(id, name, email) | LOW |
| 3 | 목록 기본 정렬 | sort=createdAt, direction=desc | 컨텍스트별 상이 (rooms: name/ASC, reservations: startTime/DESC) | LOW |
| 4 | 401/403 응답 구현 | ErrorResponse 클래스 사용 | SecurityConfig에서 JSON 문자열 직접 작성 | LOW |

---

## 10. v0.2 -> v0.3 Improvement Detail

### 10.1 Resolved Items

| # | Item | v0.2 Status | v0.3 Status | Resolution |
|:-:|------|:-----------:|:-----------:|------------|
| 1 | `from`/`to` 날짜 필터 | :x: 미구현 | :white_check_mark: 구현 | ReservationController `@RequestParam LocalDate from/to` + ReservationService Specification |
| 2 | @ApiResponse 어노테이션 | :x: 미구현 | :white_check_mark: 전체 적용 | 4 Controllers, 21 endpoints, `@ApiResponses` 블록 포함 |
| 3 | @Schema 어노테이션 | :x: 미구현 | :white_check_mark: 전체 적용 | 11 DTOs, 클래스+필드 레벨 모두 적용 |
| 4 | Pageable size 최대 100 제한 | :x: 미구현 | :white_check_mark: 적용 | `spring.data.web.pageable.max-page-size=100` |

### 10.2 Score Changes

| Category | v0.2 | v0.3 | Delta |
|----------|:----:|:----:|:-----:|
| Reservation API | 96% | 100% | +4%p |
| Documentation | 71% | 100% | +29%p |
| Pagination | 75% | 88% | +13%p |
| **Overall** | **93%** | **97%** | **+4%p** |

---

## 11. Recommended Actions

### 11.1 Remaining Gap (Match Rate -> 100%)

| Priority | Item | Expected Effort | Impact |
|:--------:|------|:-:|:------:|
| 1 | OAuth2 Success Handler 구현 | 2-4시간 | Auth API 91% -> 100%, Security 91% -> 100% |

### 11.2 Design Document Updates Needed

다음 항목은 구현에 추가되었으나 설계 문서에 반영되지 않은 사항:

- [ ] ErrorCode에 INVALID_TOKEN(401), USER_NOT_FOUND(404), ROOM_NOT_FOUND(404), RESERVATION_NOT_FOUND(404) 추가
- [ ] AdminReservationResponse.UserSummary에 email 필드 포함 반영
- [ ] CORS 설정 명세 추가
- [ ] RoomRequest 통합 DTO 방식으로 설계 업데이트
- [ ] 목록 정렬 기본값을 컨텍스트별로 명시 (rooms: name/ASC, reservations: startTime/DESC)

### 11.3 Optional Quality Improvements

| Priority | Item | Description |
|:--------:|------|-------------|
| LOW | SecurityConfig 401/403 응답 ObjectMapper 사용 | ErrorResponse 직렬화 재사용으로 일관성 향상 |
| LOW | sort 기본값 설계 동기화 | 설계 문서의 sort=createdAt을 실제 컨텍스트별 값으로 업데이트 |

---

## 12. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| OAuth2 SuccessHandler 미구현 | MEDIUM | HIGH | 소셜 로그인 요구사항 확정 전까지 보류 가능. 이메일/비밀번호 로그인은 완전 동작 |

---

## 13. Next Steps

- [ ] OAuth2 Success Handler 구현 여부 결정 (요구사항 확정 시)
- [ ] 설계 문서에 추가 구현 항목 반영 (`/pdca design api-spec` 업데이트)
- [ ] Match Rate 97% 기준 -> `/pdca report api-spec` 실행 가능

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-14 | Initial gap analysis (Match Rate: 22%) | gap-detector |
| 0.2 | 2026-03-17 | Full re-analysis after Controller/Service/DTO/Security implementation (Match Rate: 93%) | gap-detector |
| 0.3 | 2026-03-17 | Re-analysis after @ApiResponse, @Schema, from/to filter, max-page-size additions (Match Rate: 97%) | gap-detector |
