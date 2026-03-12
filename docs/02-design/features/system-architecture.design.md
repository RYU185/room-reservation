# [Design] System Architecture - Room Reservation System

> 작성일: 2026-03-12
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/requirements.plan.md

---

## 1. 시스템 아키텍처 개요

### 1.1 구성 방식

**Fullstack 분리 구조 (Decoupled Architecture)**

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Frontend (React)  │  REST   │  Backend (Spring Boot)   │
│   Node.js v24.14    │◄───────►│  Java 21 / Port 8080     │
│   Port 3000         │  JSON   │                          │
└─────────────────────┘         └──────────┬───────────────┘
                                           │
                              ┌────────────▼─────────────┐
                              │    PostgreSQL Database   │
                              │    Port 5432             │
                              └──────────────────────────┘
```

### 1.2 레이어드 아키텍처 (Backend)

```
┌────────────────────────────────────┐
│  Presentation Layer (Controller)   │  REST API, 요청/응답 처리
├────────────────────────────────────┤
│  Application Layer (Service)       │  비즈니스 로직
├────────────────────────────────────┤
│  Domain Layer (Entity, Repository) │  도메인 모델, JPA
├────────────────────────────────────┤
│  Infrastructure Layer              │  DB, 외부 서비스 연동
└────────────────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 Backend

| 항목 | 기술 | 버전 |
|------|------|------|
| 언어 | Java | 21 |
| 프레임워크 | Spring Boot | 4.0.3 |
| 보안 | Spring Security + JWT | JJWT 0.12.6 |
| 소셜 로그인 | Spring Security OAuth2 Client | BOM |
| ORM | Spring Data JPA + Hibernate | BOM |
| DB 마이그레이션 | Flyway | BOM |
| API 문서 | SpringDoc OpenAPI | 3.0.2 |
| 빌드 도구 | Gradle Wrapper | 9.3.1 |

### 2.2 Frontend

| 항목 | 기술 | 비고 |
|------|------|------|
| 언어 | JavaScript / TypeScript | TypeScript 권장 |
| 프레임워크 | React | 최신 안정 버전 |
| 런타임 | Node.js | v24.14.0 |
| 패키지 관리 | npm | 11.7.0 |
| HTTP 클라이언트 | Axios 또는 Fetch API | 추후 결정 |
| 상태 관리 | React Query + Context API | 추후 결정 |

### 2.3 Database

| 항목 | 기술 |
|------|------|
| RDBMS | PostgreSQL |
| 마이그레이션 | Flyway |
| 연결 | Spring Data JPA (HikariCP) |

---

## 3. 인증/인가 설계

### 3.1 인증 흐름 (JWT)

```
[Client]
   │ POST /api/auth/login (email + password)
   ▼
[AuthController]
   │ 인증 성공
   ▼
[JWT 발급]
   ├── Access Token  (유효기간: 1시간)
   └── Refresh Token (유효기간: 7일, DB 저장)
   │
   ▼
[Client - 이후 요청]
   Authorization: Bearer {accessToken}
```

### 3.2 OAuth2 소셜 로그인 흐름

```
[Client] → /oauth2/authorization/google
   → Google 동의 화면
   → Callback: /login/oauth2/code/google
   → JWT 발급 후 Frontend로 리다이렉트
```

### 3.3 역할 기반 접근 제어 (RBAC)

| 역할 | 권한 |
|------|------|
| ROLE_USER | 회의실 조회, 본인 예약 CRUD |
| ROLE_ADMIN | 전체 예약 관리, 회의실 CRUD, 사용자 관리 |

---

## 4. API 구조 (REST)

### 기본 URL 구조

```
/api/v1/auth/**          인증 (로그인, 토큰 갱신)
/api/v1/rooms/**         회의실 관리
/api/v1/reservations/**  예약 관리
/api/v1/admin/**         관리자 전용
```

### CORS 설정

- 허용 Origin: `http://localhost:3000` (개발), 운영 도메인 (추후)
- 허용 메서드: GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## 5. 디렉토리 구조

### Backend (Spring Boot)

```

src/main/java/com/ryu/room_reservation/
├── auth/
│   ├── controller/
│   ├── service/
│   ├── dto/
│   └── jwt/
├── room/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   └── dto/
├── reservation/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   └── dto/
├── user/
│   ├── entity/
│   ├── repository/
│   └── service/
├── global/
│   ├── config/     (SecurityConfig, CorsConfig 등)
│   ├── exception/
│   └── response/
└── RoomReservationApplication.java
```

### Frontend (React)

```
frontend/
├── src/
│   ├── api/           (Axios 인스턴스, API 호출)
│   ├── components/    (공통 컴포넌트)
│   ├── pages/         (페이지 컴포넌트)
│   ├── hooks/         (커스텀 훅)
│   ├── store/         (상태 관리)
│   └── utils/
├── public/
└── package.json
```

---

## 6. 환경 구성

| 환경 | Backend | Frontend | DB |
|------|---------|----------|----|
| 로컬 개발 | localhost:8080 | localhost:3000 | localhost:5432 |
| 운영 | 추후 결정 | 추후 결정 | 추후 결정 |

---

## 7. 다음 단계

- [ ] 다음: `/pdca design domain-model` (도메인 모델 및 DB 스키마 설계)
- [ ] 다음: `/pdca design api-spec` (API 상세 명세)
