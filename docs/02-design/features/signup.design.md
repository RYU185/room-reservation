# [Design] signup — 이메일/비밀번호 회원가입

> 작성일: 2026-03-25
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/signup.plan.md
> 참조: docs/02-design/features/domain-model.design.md
> 참조: docs/02-design/features/api-spec.design.md

---

## 1. 도메인 모델 분석

### 1.1 관련 엔티티

회원가입은 새로운 엔티티 없이 기존 `User` 엔티티를 생성하는 것으로 구현한다.

| 필드 | 타입 | 가입 시 값 |
|------|------|-----------|
| email | String (unique) | 사용자 입력 |
| password | String (nullable) | bcrypt 인코딩된 값 |
| name | String | 사용자 입력 |
| role | UserRole | ROLE_USER (기본값) |
| provider | AuthProvider | LOCAL (기본값) |
| providerId | String | null |
| active | boolean | true (기본값) |

### 1.2 도메인 규칙

| 규칙 | 내용 |
|------|------|
| 이메일 유일성 | 동일 이메일로 중복 가입 불가 (DB unique 제약 + 서비스 레이어 선행 검사) |
| 비밀번호 인코딩 | 평문 저장 금지. 반드시 BCryptPasswordEncoder로 인코딩 후 저장 |
| 기본 권한 | 신규 가입 사용자는 ROLE_USER로 시작 |
| 가입 즉시 활성 | 별도 이메일 인증 없이 가입 즉시 active=true |
| 토큰 즉시 발급 | 가입 성공 시 AccessToken + RefreshToken 즉시 발급 (로그인 불필요) |

---

## 2. API 설계

### 2.1 엔드포인트

| 항목 | 값 |
|------|----|
| Method | POST |
| Path | `/api/v1/auth/register` |
| 인증 | 불필요 (permitAll) |
| Content-Type | application/json |

### 2.2 요청 필드

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| email | String | Y | 이메일 형식, SQL injection 검사 |
| password | String | Y | 8자 이상 100자 이하 |
| name | String | Y | 1자 이상 100자 이하 |

### 2.3 성공 응답 (201 Created)

응답 바디는 기존 `TokenResponse` 구조를 그대로 사용한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| success | boolean | true |
| data.accessToken | String | JWT Access Token |
| data.tokenType | String | "Bearer" |
| data.expiresIn | long | Access Token 유효 시간(초) |

Set-Cookie 헤더에 `refreshToken` (httpOnly, Strict, 기존 로그인과 동일 정책) 포함.

### 2.4 오류 응답

| HTTP | ErrorCode | 발생 조건 |
|------|-----------|-----------|
| 400 | VALIDATION_FAILED | 필드 형식/길이 위반 |
| 400 | INVALID_INPUT | SQL injection 패턴 감지 |
| 409 | EMAIL_DUPLICATE | 이미 사용 중인 이메일 |

---

## 3. 처리 흐름

### 3.1 회원가입 요청 흐름

```
클라이언트
  → POST /api/v1/auth/register { email, password, name }
  → SecurityConfig: permitAll 통과
  → JwtAuthenticationFilter: 인증 없이 통과
  → AuthController.register()
      → @Valid 검증 실패 시 → 400 반환
  → AuthService.register()
      → UserRepository.existsByEmail(email)
          → true 이면 → BusinessException(EMAIL_DUPLICATE) → 409 반환
      → User 엔티티 생성 (password=encode(raw), provider=LOCAL, role=ROLE_USER)
      → UserRepository.save(user)
      → issueTokens(user)  ← 기존 private 메서드 재사용
          → AccessToken 생성
          → RefreshToken 생성 + 저장
  → AuthController: 201 + Set-Cookie(refreshToken) + TokenResponse 반환
클라이언트: AccessToken 저장, 인증 상태로 전환
```

### 3.2 이메일 중복 방어 전략

| 레이어 | 방어 방법 |
|--------|-----------|
| 서비스 레이어 | `existsByEmail()` 선행 검사 → EMAIL_DUPLICATE 예외 |
| DB 레이어 | `users.email` unique 제약 → DataIntegrityViolationException |
| 최종 처리 | GlobalExceptionHandler가 DataIntegrityViolationException → 409 변환 |

---

## 4. 보안 설계

### 4.1 SecurityConfig 변경

현재 permitAll 목록에 `/api/v1/auth/register` 추가 필요.

| 현재 permitAll | 추가 |
|----------------|------|
| `/api/v1/auth/login` | `/api/v1/auth/register` |
| `/api/v1/auth/refresh` | |
| `/oauth2/**` | |
| `/login/oauth2/**` | |

### 4.2 입력값 검증 정책

| 필드 | 검증 규칙 |
|------|-----------|
| email | @NotBlank + @Email + @NoSqlInjection (기존 LoginRequest와 동일) |
| password | @NotBlank + @Size(min=8, max=100) (기존 LoginRequest와 동일) |
| name | @NotBlank + @Size(max=100) |

---

## 5. 프론트엔드 설계

### 5.1 화면 구성

`SignUpPage`는 `AuthLayout` 하위에서 렌더링되며, `LoginPage`와 동일한 Card 스타일을 공유한다.

| 컴포넌트 | 역할 |
|----------|------|
| SignUpPage | 회원가입 폼 페이지 |
| AuthLayout | 기존 레이아웃 재사용 |

**폼 필드:**

| 필드 | 입력 타입 | Zod 검증 |
|------|-----------|----------|
| 이름 | text | min(1) |
| 이메일 | email | email() |
| 비밀번호 | password | min(8), max(100) |

**버튼/액션:**

| 요소 | 동작 |
|------|------|
| 회원가입 버튼 | 폼 제출 → API 호출 |
| 로그인 링크 | `/login`으로 이동 |

### 5.2 가입 성공 흐름

```
폼 제출
  → auth.api.register(email, password, name)
  → AuthContext.login 동작과 동일:
      AccessToken을 tokenStore에 저장
      사용자 상태 갱신 (getMe 호출)
  → navigate('/')
```

### 5.3 오류 처리 정책

| 서버 오류 코드 | 화면 표시 |
|---------------|-----------|
| EMAIL_DUPLICATE (409) | "이미 사용 중인 이메일입니다." |
| VALIDATION_FAILED (400) | 기존 getErrorMessage() 활용 |
| 기타 | 기존 getErrorMessage() 활용 |

### 5.4 라우터 변경

`/signup` 경로를 `AuthLayout` 하위에 추가한다.

| 기존 AuthLayout 자식 | 추가 |
|---------------------|------|
| `/login` → LoginPage | `/signup` → SignUpPage |
| `/oauth2/callback` → OAuthCallbackPage | |

### 5.5 auth.api.ts 변경

기존 `login`, `logout`, `refresh`, `getMe` 외에 `register` 함수 추가.

| 함수 | 엔드포인트 | 반환 타입 |
|------|------------|-----------|
| register(email, password, name) | POST /auth/register | LoginTokenResponse |

---

## 6. 패키지 구조

### 6.1 백엔드 추가 파일

```
auth/
├── controller/
│   └── AuthController.java        (register 엔드포인트 추가)
├── dto/
│   ├── LoginRequest.java          (기존 유지)
│   └── SignUpRequest.java         ← 신규
├── service/
│   └── AuthService.java           (register 메서드 추가)
global/
└── config/
    └── SecurityConfig.java        (permitAll에 /register 추가)
```

### 6.2 프론트엔드 추가 파일

```
src/
├── features/auth/
│   └── api/
│       └── auth.api.ts            (register 함수 추가)
├── pages/auth/
│   ├── LoginPage.tsx              (회원가입 링크 추가)
│   └── SignUpPage.tsx             ← 신규
└── router/
    └── index.tsx                  (/signup 라우트 추가)
```

---

## 7. Acceptance Criteria 매핑

| AC | 설계 항목 |
|----|-----------|
| AC-1: 201 + AccessToken 반환 | §2.3 성공 응답 |
| AC-2: 중복 이메일 → 409 | §3.2 이메일 중복 방어, §2.4 오류 응답 |
| AC-3: 비밀번호 길이 위반 → 400 | §4.2 입력값 검증 |
| AC-4: bcrypt 인코딩 | §1.2 도메인 규칙 |
| AC-5: 가입 즉시 토큰 발급 | §3.1 처리 흐름, §1.2 토큰 즉시 발급 |
| AC-6: /signup 접근 시 폼 노출 | §5.4 라우터 변경 |
| AC-7: 가입 성공 후 메인 리다이렉트 | §5.2 가입 성공 흐름 |

---

## 8. Status

- [x] Plan 확인
- [x] Design 작성
- [ ] Implementation
- [ ] Gap Analysis
- [ ] Report
