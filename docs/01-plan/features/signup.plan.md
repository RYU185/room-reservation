# Feature Plan: signup

## Overview

이메일/비밀번호 기반 회원가입 기능 구현.
현재 로그인(`POST /api/v1/auth/login`)은 존재하지만, 신규 사용자를 생성하는 회원가입 엔드포인트가 없어 Local 인증 플로우가 불완전한 상태.

---

## Problem Statement

- `POST /api/v1/auth/login`은 구현되어 있으나 신규 사용자 생성 수단이 없음
- OAuth2(Google 등)로는 가입 가능하지만 이메일/비밀번호 방식은 불가
- 프론트엔드에 회원가입 페이지 없음

---

## Goals

1. `POST /api/v1/auth/register` 엔드포인트 추가
2. 이메일 중복 검사 (UserRepository.existsByEmail 활용)
3. 비밀번호 bcrypt 인코딩 저장
4. 가입 성공 시 AccessToken + RefreshToken 발급 (로그인과 동일한 플로우)
5. 프론트엔드 회원가입 페이지 추가

---

## Scope

### In Scope

- 백엔드: `SignUpRequest` DTO, `AuthService.register()`, `AuthController.register()`
- 보안 설정: `/api/v1/auth/register` permitAll 추가
- 프론트엔드: `SignUpPage.tsx`, `auth.api.ts` register 함수, 라우터 연결

### Out of Scope

- 이메일 인증 (이메일 발송, 인증 코드 확인)
- 프로필 사진 업로드
- 소셜 연동 계정과의 병합

---

## User Story

```
AS 신규 방문자
I WANT 이메일과 비밀번호로 계정을 만들고 싶다
SO THAT 로그인하여 회의실 예약 기능을 사용할 수 있다
```

---

## Acceptance Criteria

| # | 조건 |
|---|------|
| AC-1 | `POST /api/v1/auth/register`로 email, password, name 전송 시 201 + AccessToken 반환 |
| AC-2 | 이미 존재하는 이메일로 요청 시 409 CONFLICT 반환 |
| AC-3 | 비밀번호는 8자 미만 또는 100자 초과 시 400 반환 |
| AC-4 | 저장된 비밀번호는 bcrypt로 인코딩됨 |
| AC-5 | 가입 후 즉시 로그인 상태 (토큰 발급) |
| AC-6 | 프론트엔드 `/signup` 경로 접근 시 회원가입 폼 노출 |
| AC-7 | 회원가입 성공 시 메인 페이지로 리다이렉트 |

---

## Technical Approach

### Backend

기존 `AuthService.login()`이 토큰 발급을 `issueTokens(user)` private 메서드로 처리하므로,
`register()`도 동일하게 User 저장 후 `issueTokens()` 호출.

```
POST /api/v1/auth/register
Body: { email, password, name }
Response 201: { accessToken, tokenType, expiresIn }
+ Set-Cookie: refreshToken=...
```

**추가/수정 파일:**
- `auth/dto/SignUpRequest.java` — 신규 DTO (email, password, name 검증)
- `auth/service/AuthService.java` — `register()` 메서드 추가
- `auth/controller/AuthController.java` — `@PostMapping("/register")` 추가
- `global/config/SecurityConfig.java` — permitAll에 `/api/v1/auth/register` 추가
- `global/exception/ErrorCode.java` — `DUPLICATE_EMAIL` 에러코드 확인/추가

### Frontend

- `src/pages/auth/SignUpPage.tsx` — 신규 페이지 (email, password, name 폼)
- `src/features/auth/api/auth.api.ts` — `register(data)` 함수 추가
- Router 설정에 `/signup` 경로 추가

---

## Dependencies

| 항목 | 상태 |
|------|------|
| User 엔티티 (email, password, name, role, provider) | ✅ 기존 존재 |
| UserRepository.existsByEmail() | ✅ 기존 존재 |
| PasswordEncoder (BCrypt) | ✅ Spring Security 설정됨 |
| AuthService.issueTokens() | ✅ private 메서드 재사용 |
| JwtProvider | ✅ 기존 존재 |
| LoginRequest 검증 패턴 (@NoSqlInjection 등) | ✅ 참고 가능 |

---

## Risk & Mitigation

| 위험 | 대응 |
|------|------|
| 이메일 중복 레이스 컨디션 | DB unique 제약 + 예외 처리로 최종 방어 |
| 비밀번호 평문 저장 | PasswordEncoder 필수 적용, 테스트로 검증 |
| SecurityConfig 누락 시 401 | AC-1 테스트로 확인 |

---

## Estimated Effort

- 백엔드: 소규모 (기존 패턴 재사용, 신규 코드 최소)
- 프론트엔드: 소규모 (LoginPage 패턴 참고)

---

## Status

- [x] Plan 작성
- [ ] Design
- [ ] Implementation
- [ ] Gap Analysis
- [ ] Report
