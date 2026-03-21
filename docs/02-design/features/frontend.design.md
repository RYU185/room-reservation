# [Design] Frontend - Room Reservation System

> 작성일: 2026-03-19
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/frontend.plan.md
> 참조: docs/frontend-integration.md

---

## 1. 아키텍처 개요

### 1.1 폴더 구조 전략: Feature-based

각 기능 도메인(auth, rooms, reservations, admin)이 자신의 api / components / hooks를 소유한다.
`pages/`도 도메인별로 분리하며 feature 컴포넌트를 조합만 하는 얇은 레이어로 유지한다.
`shared/`는 도메인 의존 없는 공통 코드만 포함한다.

```
frontend/
├── src/
│   ├── app/                           # 앱 초기화: Provider 조합, QueryClient 설정
│   ├── layouts/                       # 레이아웃 컴포넌트
│   │   ├── MainLayout.tsx             # 헤더 + 콘텐츠 (일반 사용자)
│   │   ├── AdminLayout.tsx            # 헤더 + 사이드바 (관리자)
│   │   └── AuthLayout.tsx             # 중앙 카드 (로그인/콜백)
│   ├── pages/                         # 얇은 페이지 (도메인별 분리, 비즈니스 로직 없음)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── OAuthCallbackPage.tsx
│   │   ├── rooms/
│   │   │   ├── RoomListPage.tsx
│   │   │   └── RoomDetailPage.tsx
│   │   ├── reservations/
│   │   │   ├── ReservationNewPage.tsx
│   │   │   ├── MyReservationsPage.tsx
│   │   │   ├── ReservationDetailPage.tsx
│   │   │   └── CalendarPage.tsx
│   │   ├── admin/
│   │   │   ├── AdminRoomsPage.tsx
│   │   │   ├── AdminReservationsPage.tsx
│   │   │   ├── AdminUsersPage.tsx
│   │   │   └── AdminStatsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── features/                      # 기능 도메인 (자기 완결적)
│   │   ├── auth/
│   │   │   ├── api/                   # login, logout, refresh, getMe
│   │   │   ├── components/            # LoginForm, OAuthButton
│   │   │   ├── hooks/                 # useAuth, useLogin
│   │   │   └── context/               # AuthContext, AuthProvider
│   │   ├── rooms/
│   │   │   ├── api/                   # getRooms, getRoom, getRoomAvailability
│   │   │   ├── components/            # RoomCard, RoomFilter, AvailabilityBadge
│   │   │   └── hooks/                 # useRooms, useRoom, useRoomAvailability
│   │   ├── reservations/
│   │   │   ├── api/                   # getMyReservations, createReservation, etc.
│   │   │   ├── components/            # ReservationForm, ReservationCard, TimeRangePicker, CalendarView
│   │   │   └── hooks/                 # useReservations, useCreateReservation, useCalendar
│   │   └── admin/
│   │       ├── api/                   # getAdminReservations, getAdminUsers, getRoomStats
│   │       ├── components/            # RoomFormModal, ReservationTable, StatsCard, UserSidePanel
│   │       └── hooks/                 # useAdminReservations, useAdminUsers, useRoomStats
│   ├── shared/                        # 기능 간 공유 (도메인 의존 없음)
│   │   ├── api/                       # Axios 인스턴스 + 인터셉터
│   │   ├── components/                # Button, Input, Modal, Pagination, Spinner, Skeleton
│   │   ├── hooks/                     # useDebounce, usePagination
│   │   ├── types/                     # ApiResponse, PageMeta, ErrorResponse, FieldError
│   │   └── utils/                     # date.ts, errorMessage.ts
│   └── router/                        # createBrowserRouter 라우트 정의 + 가드
│       ├── index.tsx
│       ├── PrivateRoute.tsx
│       └── AdminRoute.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 1.2 의존성 방향 규칙

| 레이어 | 참조 가능 | 참조 금지 |
|--------|-----------|-----------|
| `pages/` | `features/`, `layouts/`, `shared/`, `router/` | — |
| `features/[domain]/` | `shared/` | 다른 `features/[domain]/` 직접 참조 |
| `layouts/` | `shared/` | `features/`, `pages/` |
| `shared/` | 외부 라이브러리 | `features/`, `pages/`, `layouts/` |

> feature 간 데이터 공유가 필요한 경우, `shared/` 또는 공통 Context를 통해 간접 참조한다.

### 1.3 레이아웃 설계

| 레이아웃 | 적용 라우트 | 구성 요소 |
|----------|-------------|-----------|
| `MainLayout` | `/rooms/**`, `/reservations/**`, `/calendar` | 상단 헤더(로고 + 네비 + 로그아웃) + 메인 콘텐츠 |
| `AdminLayout` | `/admin/**` | 상단 헤더 + 좌측 관리자 사이드바 + 메인 콘텐츠 |
| `AuthLayout` | `/login`, `/oauth2/callback` | 중앙 정렬 카드, 네비게이션 없음 |

### 1.4 에러 · 로딩 전략

**에러 처리**

| 에러 유형 | 처리 방식 |
|-----------|-----------|
| API 에러 (4xx/5xx) | 인터셉터에서 에러 코드 추출 → `errorMessage.ts` 매핑 → Toast 알림 |
| 401 / 토큰 만료 | 인터셉터에서 자동 갱신 시도 → 실패 시 `/login` 리다이렉트 |
| 폼 유효성 에러 | React Hook Form `formState.errors` 기반 인라인 표시 |
| 충돌(409) | 해당 필드 아래 인라인 에러 메시지 |
| 치명적 에러 | `ErrorBoundary` 컴포넌트로 폴백 UI 표시 |

**로딩 상태**

| 상황 | 처리 방식 |
|------|-----------|
| 목록/상세 데이터 페칭 | `isLoading` 시 Skeleton 컴포넌트 표시 |
| 페이지 전환 | React Router `useNavigation` 상태로 상단 로딩 바 |
| 뮤테이션(예약 생성 등) | 버튼 로딩 스피너 + disabled 처리 |

---

## 2. 인증 설계

### 2.1 AuthContext 상태 구조

**상태 (State)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `accessToken` | `string \| null` | 메모리에만 저장 (localStorage 금지) |
| `user` | `User \| null` | GET /auth/me 응답 캐시 |
| `isAuthenticated` | `boolean` | accessToken 존재 여부 |
| `isAdmin` | `boolean` | role === 'ROLE_ADMIN' 여부 |

**액션 (Actions)**

| 메서드 | 설명 |
|--------|------|
| `login(email, password)` | 이메일 로그인 → accessToken + user 설정 |
| `loginWithOAuth(token)` | OAuth2 콜백에서 token 수신 시 호출 |
| `logout()` | POST /auth/logout → accessToken null + user null |
| `refreshToken()` | POST /auth/refresh → 새 accessToken 반환 |

### 2.2 Access Token 갱신 흐름

```
API 요청
    ↓
401 응답 감지 (인터셉터)
    ↓
isRefreshing? YES → waitQueue에 추가 → 갱신 완료 후 재시도
            NO  → POST /auth/refresh (쿠키 자동 전송)
                    ↓ 성공 → 새 accessToken 갱신 → waitQueue 처리 → 재시도
                    ↓ 실패 → accessToken null → /login 이동
```

### 2.3 라우트 가드

| 라우트 | 가드 | 미인증 시 동작 |
|--------|------|----------------|
| `/` | PrivateRoute | → /login 리다이렉트 |
| `/rooms/**` | PrivateRoute | → /login 리다이렉트 |
| `/reservations/**` | PrivateRoute | → /login 리다이렉트 |
| `/calendar` | PrivateRoute | → /login 리다이렉트 |
| `/admin/**` | AdminRoute | → / 리다이렉트 (권한 없음) |
| `/login` | 공개 | 인증 상태면 → / 리다이렉트 |
| `/oauth2/callback` | 공개 | — |

---

## 3. API 클라이언트 설계

### 3.1 Axios 인스턴스 구성 (`api/client.ts`)

- `baseURL`: `import.meta.env.VITE_API_BASE_URL` (기본: `http://localhost:8080/api/v1`)
- `withCredentials: true` — Refresh Token 쿠키 자동 전송
- 요청 인터셉터: `Authorization: Bearer {accessToken}` 주입
- 응답 인터셉터: 401 → 토큰 갱신 후 재시도 (waitQueue 패턴)

### 3.2 API 함수 패턴

각 API 파일은 순수 함수로 구성 (Axios 인스턴스를 인수로 받지 않고 client.ts 직접 임포트):

```
auth.api.ts    → login(), refreshToken(), logout(), getMe()
rooms.api.ts   → getRooms(), getRoom(), getRoomAvailability(), createRoom(), updateRoom(), deactivateRoom()
reservations.api.ts → getMyReservations(), getReservation(), getCalendar(), createReservation(), updateReservation(), cancelReservation()
admin.api.ts   → getAdminReservations(), cancelAdminReservation(), getAdminUsers(), getUserReservations(), getRoomStats()
```

---

## 4. 서버 상태 관리 (TanStack Query)

### 4.1 Query Key 규칙

```
['rooms']                           # 회의실 목록
['rooms', id]                       # 회의실 상세
['rooms', id, 'availability', params] # 가용 여부
['reservations', 'my', filters]     # 내 예약 목록
['reservations', id]                # 예약 상세
['reservations', 'calendar', year, month, roomId] # 캘린더
['admin', 'reservations', filters]  # 관리자 예약 목록
['admin', 'users']                  # 관리자 사용자 목록
['admin', 'stats', 'rooms']         # 관리자 통계
['auth', 'me']                      # 내 정보
```

### 4.2 Mutation 후 캐시 무효화 패턴

- 예약 생성/수정/취소 → `['reservations']` 전체 무효화
- 회의실 가용 여부에 영향 → `['rooms', roomId, 'availability']` 무효화
- 관리자 강제 취소 → `['admin', 'reservations']` + `['reservations']` 무효화

---

## 5. 페이지별 설계

### 5.1 로그인 (`/login`)

- 이메일/비밀번호 폼 (React Hook Form + Zod 유효성)
- Google 로그인 버튼 → `window.location.href = '/oauth2/authorization/google'`
- 에러 코드: `UNAUTHORIZED` → "이메일 또는 비밀번호가 올바르지 않습니다"

### 5.2 OAuth2 콜백 (`/oauth2/callback`)

- `useEffect` 내에서 URLSearchParams 파싱
- `?token=` → `loginWithOAuth(token)` 호출 → `history.replaceState` → `/`로 이동
- `?error=` → 에러 메시지 표시 후 `/login`으로 이동
  - `email_already_exists` → "이미 다른 방법으로 가입된 이메일입니다"
  - `unsupported_provider` → "지원하지 않는 소셜 로그인입니다"
  - `oauth2_error` → "소셜 로그인 중 오류가 발생했습니다"

### 5.3 회의실 목록 (`/rooms`)

- 필터: 위치(location), 최소 수용인원(minCapacity)
- 목록: RoomCard 그리드 (이름, 위치, 수용인원, 시설 태그, 활성 상태)
- 페이지네이션: `meta.totalPages` 기반
- 카드 클릭 → `/rooms/:id`

### 5.4 회의실 상세 (`/rooms/:id`)

- 상세 정보 (이름, 위치, 수용인원, 설명, 시설)
- 가용 여부 조회 영역: 날짜/시간 범위 입력 → GET /rooms/{id}/availability
- "예약하기" 버튼 → `/reservations/new?roomId={id}`

### 5.5 예약 생성 (`/reservations/new?roomId=`)

- URL 쿼리에서 `roomId` 읽어 초기값 설정
- 폼 필드: 회의실 선택, 제목(title), 설명(description, 선택), 시작·종료 시간
- 시작 전 GET /rooms/{id}/availability 사전 확인 → 충돌 시 경고 표시
- POST /reservations → 201 성공 → `/reservations/my`로 이동
- 충돌 409 → "해당 시간대에 이미 예약이 있습니다" 인라인 에러

### 5.6 내 예약 목록 (`/reservations/my`)

- 필터: 상태(CONFIRMED / CANCELLED), 기간(from / to)
- ReservationCard 목록: 회의실명, 제목, 날짜·시간, 상태 뱃지
- 카드 클릭 → `/reservations/:id`

### 5.7 예약 상세 (`/reservations/:id`)

- 상세 정보 표시
- CONFIRMED 상태일 때만 "수정" / "취소" 버튼 노출
- 수정: 폼 모달로 PUT /reservations/:id
- 취소: 확인 다이얼로그 → PATCH /reservations/:id/cancel → 204 → 목록 갱신

### 5.8 캘린더 뷰 (`/calendar`)

- 월/회의실 선택 탭
- GET /reservations/calendar → 날짜별 예약 블록 렌더링
- 날짜 셀 클릭 → 해당 날짜 예약 목록 사이드패널

### 5.9 관리자 - 회의실 관리 (`/admin/rooms`)

- 회의실 테이블 (이름, 위치, 수용인원, 활성 상태)
- "등록" 버튼 → RoomFormModal (POST /rooms)
- 행 클릭 "수정" → RoomFormModal (PUT /rooms/:id)
- "비활성화" → 확인 다이얼로그 → PATCH /rooms/:id/deactivate

### 5.10 관리자 - 전체 예약 (`/admin/reservations`)

- 필터: roomId, userId, status, from/to
- 테이블: 예약자, 회의실, 제목, 시간, 상태
- "강제 취소" → PATCH /admin/reservations/:id/cancel

### 5.11 관리자 - 사용자 목록 (`/admin/users`)

- 사용자 테이블 (이름, 이메일, 역할)
- 행 클릭 → 해당 사용자 예약 이력 사이드패널 (GET /admin/users/:id/reservations)

### 5.12 관리자 - 통계 (`/admin/stats`)

- 회의실별 카드: 총 예약 수, 확정 예약 수, 사용률(%)
- GET /admin/stats/rooms 응답 렌더링

---

## 6. 공통 컴포넌트 설계

### 6.1 에러 메시지 매핑 (`utils/errorMessage.ts`)

| 에러 코드 | 사용자 메시지 |
|-----------|--------------|
| VALIDATION_FAILED | `errors[].message` 필드별 표시 |
| INVALID_INPUT | 특수문자 입력 안내 |
| UNAUTHORIZED | 로그인 페이지로 이동 |
| TOKEN_EXPIRED | 자동 갱신 시도 (인터셉터) |
| INVALID_TOKEN | 로그인 페이지로 이동 |
| FORBIDDEN | "접근 권한이 없습니다" |
| NOT_FOUND | "요청한 리소스를 찾을 수 없습니다" |
| RESERVATION_CONFLICT | "해당 시간대에 이미 예약이 있습니다" |
| EMAIL_DUPLICATE | "이미 사용 중인 이메일입니다" |
| ROOM_INACTIVE | "사용할 수 없는 회의실입니다" |
| DB_ERROR / INTERNAL_ERROR | "서버 오류가 발생했습니다. 잠시 후 재시도해 주세요" |

### 6.2 날짜 유틸 (`utils/date.ts`)

- `toApiFormat(date: Date): string` → ISO 8601 UTC (`2026-03-20T09:00:00Z`)
- `fromApiFormat(isoStr: string): Date` → Date 객체
- `formatDisplay(isoStr: string): string` → 로컬 표시 형식 (예: `2026년 3월 20일 18:00`)

### 6.3 Pagination 컴포넌트

- `total`, `page`, `size`, `totalPages` props
- 이전/다음/번호 버튼 → `onPageChange(newPage: number)` 콜백

---

## 7. 타입 정의

### 7.1 공통 API 타입 (`shared/types/`)

**ApiResponse\<T\>** — 성공 응답 래퍼

| 필드 | 설명 |
|------|------|
| `success: true` | |
| `data: T` | 실제 응답 데이터 |
| `meta?: PageMeta` | 페이지네이션 정보 (목록 응답 시) |

**PageMeta** — 페이지네이션 메타

| 필드 | 설명 |
|------|------|
| `total` | 전체 항목 수 |
| `page` | 현재 페이지 (1-based) |
| `size` | 페이지당 항목 수 |
| `totalPages` | 전체 페이지 수 |

**ErrorResponse** — 에러 응답

| 필드 | 설명 |
|------|------|
| `success: false` | |
| `code` | 에러 코드 문자열 |
| `message` | 에러 설명 |
| `timestamp` | ISO 8601 UTC |
| `errors?: FieldError[]` | 유효성 검증 실패 시 필드별 에러 목록 |

### 7.2 도메인 타입

**User** (`features/auth/`)

| 필드 | 설명 |
|------|------|
| `id` | 사용자 ID |
| `email` | 이메일 |
| `name` | 이름 |
| `role` | `ROLE_USER` 또는 `ROLE_ADMIN` |
| `createdAt` | ISO 8601 UTC |

**Room** (`features/rooms/`)

| 필드 | 설명 |
|------|------|
| `id` | 회의실 ID |
| `name`, `location`, `capacity` | 기본 정보 |
| `description` | 설명 |
| `amenities` | 시설 목록 |
| `isActive` | 활성 여부 |

**RoomAvailability** (`features/rooms/`)

| 필드 | 설명 |
|------|------|
| `roomId` | 회의실 ID |
| `available` | 가용 여부 |
| `conflictingReservations?` | 충돌 예약 목록 (id, title, startTime, endTime) |

**Reservation** (`features/reservations/`)

| 필드 | 설명 |
|------|------|
| `id` | 예약 ID |
| `room` | 회의실 요약 (id, name, location) |
| `title`, `description` | 예약 정보 |
| `startTime`, `endTime` | ISO 8601 UTC |
| `status` | `CONFIRMED` 또는 `CANCELLED` |
| `user?` | 예약자 정보 (ADMIN 응답에만 포함) |

---

## 8. 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | 백엔드 API 베이스 URL |
| `VITE_OAUTH2_REDIRECT_URI` | `http://localhost:3000/oauth2/callback` | OAuth2 콜백 URI |

---

## 9. 다음 단계

- [x] Plan 작성 완료
- [x] Design 작성 완료
- [ ] 다음: 구현 시작 (`/pdca do frontend`)
  - Step 1: 프로젝트 초기화 (Vite + React + TypeScript + styled-components)
  - Step 2: API 클라이언트 + 인터셉터 구현
  - Step 3: AuthContext + 라우터 구성
  - Step 4: 인증 페이지 (Login, OAuth2 Callback)
  - Step 5: 회의실 페이지 (목록, 상세)
  - Step 6: 예약 페이지 (생성, 내 목록, 상세)
  - Step 7: 캘린더 뷰
  - Step 8: 관리자 페이지 (회의실, 예약, 사용자, 통계)
