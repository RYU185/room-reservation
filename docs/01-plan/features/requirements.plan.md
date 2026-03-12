# [Plan] Requirements - Room Reservation System

> 작성일: 2026-03-12
> 상태: Draft
> Phase: Plan

---

## 1. 개요 (Overview)

### 1.1 프로젝트 목적

회의실 예약 시스템은 조직 내 회의실 자원을 효율적으로 관리하고, 사용자가 편리하게 회의실을 예약·조회·취소할 수 있도록 지원하는 웹 애플리케이션이다.

### 1.2 배경 및 문제 정의

- 회의실 중복 예약으로 인한 혼선 발생
- 예약 현황을 실시간으로 파악하기 어려움
- 예약/취소 프로세스가 수동(이메일, 구두) 방식
- 예약 이력 및 통계 데이터 부재

### 1.3 목표

- 실시간 예약 현황 조회 및 충돌 방지
- 간편한 예약/수정/취소 처리
- 관리자의 자원 관리 및 통계 제공
- 사용자 인증 기반 보안 접근 제어

---

## 2. 이해관계자 (Stakeholders)

| 역할 | 설명 |
|------|------|
| 일반 사용자 (User) | 회의실 조회 및 예약/수정/취소를 수행하는 내부 직원 |
| 관리자 (Admin) | 회의실 자원 등록/수정/삭제 및 전체 예약 관리 |
| 시스템 (System) | 예약 충돌 감지, 알림 발송, 데이터 정합성 유지 |

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 인증/인가 (Authentication & Authorization)

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-AUTH-01 | 이메일/비밀번호 로그인 | Must |
| FR-AUTH-02 | OAuth2 소셜 로그인 (Google 등) | Should |
| FR-AUTH-03 | JWT 기반 세션 관리 (Access/Refresh Token) | Must |
| FR-AUTH-04 | 역할 기반 접근 제어 (RBAC: USER / ADMIN) | Must |
| FR-AUTH-05 | 회원가입 및 이메일 인증 | Should |

### 3.2 회의실 관리 (Room Management)

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-ROOM-01 | 회의실 등록 (관리자) | Must |
| FR-ROOM-02 | 회의실 수정/삭제 (관리자) | Must |
| FR-ROOM-03 | 회의실 목록 조회 (전체 사용자) | Must |
| FR-ROOM-04 | 회의실 상세 정보 조회 (수용 인원, 위치, 시설 등) | Must |
| FR-ROOM-05 | 회의실 가용 여부 실시간 조회 | Must |

### 3.3 예약 관리 (Reservation Management)

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-RES-01 | 회의실 예약 생성 (날짜/시간/목적) | Must |
| FR-RES-02 | 예약 중복 방지 (시간 충돌 검사) | Must |
| FR-RES-03 | 내 예약 목록 조회 | Must |
| FR-RES-04 | 예약 수정 (시간, 목적) | Must |
| FR-RES-05 | 예약 취소 | Must |
| FR-RES-06 | 전체 예약 현황 캘린더 뷰 (조회) | Should |
| FR-RES-07 | 예약 승인 워크플로우 (관리자 승인) | Could |
| FR-RES-08 | 반복 예약 (매주, 격주 등) | Could |

### 3.4 알림 (Notification)

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-NOTI-01 | 예약 확정/취소 시 이메일 알림 | Should |
| FR-NOTI-02 | 예약 시작 전 리마인드 알림 | Could |

### 3.5 통계 및 관리 (Admin Dashboard)

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-ADMIN-01 | 전체 예약 목록 조회 및 관리 | Must |
| FR-ADMIN-02 | 회의실별 예약률 통계 | Should |
| FR-ADMIN-03 | 사용자별 예약 이력 조회 | Should |

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 요구사항 |
|------|----------|
| 성능 | API 응답시간 평균 200ms 이하 |
| 가용성 | 운영 환경 99.5% Uptime |
| 보안 | OWASP Top 10 대응, HTTPS 강제, JWT 만료 관리 |
| 확장성 | 수평 확장 가능한 Stateless 아키텍처 |
| 유지보수성 | 레이어드 아키텍처, 단위 테스트 커버리지 80%+ |
| 문서화 | Swagger/OpenAPI 3.0 API 문서 자동 생성 |

---

## 5. 제약사항 (Constraints)

- 백엔드: Spring Boot 4.0.3, Java 21, PostgreSQL
- 인증: JWT + Spring Security OAuth2
- DB 마이그레이션: Flyway
- API 문서: SpringDoc OpenAPI 3.0.2
- 프론트엔드: React (Node.js v24.14.0, npm 11.7.0), REST API 기반 분리 구조

---

## 6. 가정 및 전제 (Assumptions)

- 사용자는 조직 내 구성원으로 한정 (외부 공개 서비스 아님)
- 초기 버전은 단일 사무실(단일 테넌트) 기준
- 모바일 앱은 1차 범위 외 (반응형 웹으로 대응)

---

## 7. 우선순위 요약 (MoSCoW)

| Priority | 기능 |
|----------|------|
| **Must** | 로그인(JWT), RBAC, 회의실 CRUD(관리자), 회의실 조회, 예약 생성/조회/수정/취소, 중복 방지, 전체 예약 관리 |
| **Should** | OAuth2 소셜 로그인, 캘린더 뷰, 이메일 알림, 통계 |
| **Could** | 예약 승인 워크플로우, 반복 예약, 리마인드 알림 |
| **Won't** | 외부 공개 API, 다중 테넌트, 모바일 앱 (1차) |

---

## 8. 다음 단계

- [ ] 이해관계자 검토 및 요구사항 확정
- [ ] 다음: `/pdca design system-architecture` (시스템 설계)
