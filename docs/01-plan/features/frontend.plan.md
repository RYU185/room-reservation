# [Plan] Frontend - Room Reservation System

> 작성일: 2026-03-19
> 상태: Draft
> Phase: Plan
> 참조: docs/01-plan/features/requirements.plan.md
> 참조: docs/frontend-integration.md

---

## 1. 개요

### 1.1 목적

백엔드 REST API(Match Rate 97%, 구현 완료)와 연동하는 React 기반 프론트엔드 애플리케이션을 구현한다.
사용자가 회의실 조회·예약·취소를 수행하고, 관리자가 자원을 관리할 수 있는 웹 UI를 제공한다.

### 1.2 범위

- 일반 사용자 기능: 로그인, 회의실 조회, 예약 생성/수정/취소, 내 예약 조회, 캘린더 뷰
- 관리자 기능: 회의실 CRUD, 전체 예약 관리, 사용자 조회, 통계
- 인증: 이메일 로그인 + Google OAuth2 소셜 로그인
- 반응형 웹(모바일 앱은 1차 범위 외)

---

## 2. 기술 스택

| 항목 | 기술 | 버전/비고 |
|------|------|-----------|
| 언어 | TypeScript | 5.x |
| 프레임워크 | React | 19.x |
| 빌드 도구 | Vite | 6.x |
| 런타임 | Node.js | v24.14.0 |
| 패키지 관리 | npm | 11.7.0 |
| 라우팅 | React Router | v7 |
| 서버 상태 | TanStack Query (React Query) | v5 |
| HTTP 클라이언트 | Axios | v1 |
| 클라이언트 상태 | Context API | 인증 토큰 메모리 보관 |
| 스타일링 | styled-components | v6 |
| 폼 처리 | React Hook Form + Zod | 유효성 검증 포함 |
| 날짜 처리 | date-fns | ISO 8601 UTC 변환 |

---

## 3. 페이지 목록 (MoSCoW)

### Must (필수)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | 이메일 로그인 + Google OAuth2 버튼 |
| OAuth2 콜백 | `/oauth2/callback` | token/error 파라미터 처리 |
| 회의실 목록 | `/rooms` | 필터(위치, 수용인원), 페이지네이션 |
| 회의실 상세 | `/rooms/:id` | 상세 정보 + 가용 여부 조회 |
| 예약 생성 | `/reservations/new` | 날짜·시간 선택, 목적 입력 |
| 내 예약 목록 | `/reservations/my` | 상태 필터, 기간 필터 |
| 예약 상세 | `/reservations/:id` | 수정/취소 액션 포함 |
| 관리자 - 회의실 관리 | `/admin/rooms` | 등록/수정/비활성화 |
| 관리자 - 전체 예약 | `/admin/reservations` | 강제 취소 포함 |

### Should (권장)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 캘린더 뷰 | `/calendar` | 월별 예약 현황 |
| 관리자 - 사용자 목록 | `/admin/users` | 사용자별 예약 이력 |
| 관리자 - 통계 | `/admin/stats` | 회의실별 예약률 |

### Could (선택)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 홈/대시보드 | `/` | 내 예약 요약 + 최근 회의실 |

---

## 4. 기능 요구사항 매핑

| 요구사항 ID | 프론트엔드 구현 |
|-------------|----------------|
| FR-AUTH-01 | 이메일 로그인 폼 → POST /auth/login |
| FR-AUTH-02 | Google 로그인 버튼 → /oauth2/authorization/google 리다이렉트 |
| FR-AUTH-03 | Access Token 메모리 저장, 자동 갱신 인터셉터 |
| FR-AUTH-04 | ROLE_ADMIN 여부로 관리자 메뉴/라우트 분기 |
| FR-ROOM-01~02 | 관리자 회의실 폼 (등록/수정/비활성화) |
| FR-ROOM-03~04 | 회의실 목록/상세 페이지 |
| FR-ROOM-05 | 예약 생성 전 GET /rooms/{id}/availability 조회 |
| FR-RES-01~05 | 예약 생성/조회/수정/취소 페이지 |
| FR-RES-06 | 캘린더 뷰 (GET /reservations/calendar) |
| FR-ADMIN-01 | 관리자 전체 예약 목록 |
| FR-ADMIN-02 | 관리자 회의실 통계 |
| FR-ADMIN-03 | 관리자 사용자 목록 + 예약 이력 |

---

## 5. 비기능 요구사항

| 항목 | 목표 |
|------|------|
| 보안 | Access Token은 반드시 메모리 저장(localStorage 금지), XSS 방지 |
| 인증 갱신 | 401 응답 시 /auth/refresh 자동 재시도, 실패 시 /login 이동 |
| 날짜 | 모든 날짜/시간은 ISO 8601 UTC 형식 사용, 표시 시 로컬 변환 |
| 에러 처리 | 에러 코드별 사용자 안내 메시지 (docs/frontend-integration.md § 5 참조) |
| 반응형 | 모바일·태블릿·데스크톱 Tailwind 반응형 대응 |

---

## 6. 제약사항

- 백엔드: `http://localhost:8080/api/v1` (로컬), CORS `credentials: true` 필수
- Refresh Token은 HttpOnly Cookie로 서버 자동 관리 → 프론트에서 직접 접근 금지
- 운영 배포 도메인 미확정 → 환경변수(`VITE_API_BASE_URL`)로 추상화

---

## 7. 다음 단계

- [ ] 요구사항 확정 (이해관계자 검토 필요)
- [ ] 다음: 프론트엔드 설계 (`frontend.design.md`)
- [ ] 다음: 구현 (`/pdca do frontend`)
