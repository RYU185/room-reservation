# [Design] Frontend - Room Reservation System

> 작성일: 2026-03-19
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/frontend.plan.md
> 참조: docs/frontend-integration.md

---

## 1. 디렉토리 구조

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios 인스턴스 + 인터셉터
│   │   ├── auth.api.ts        # 인증 API 함수
│   │   ├── rooms.api.ts       # 회의실 API 함수
│   │   ├── reservations.api.ts # 예약 API 함수
│   │   └── admin.api.ts       # 관리자 API 함수
│   ├── components/
│   │   ├── common/            # Button, Input, Modal, Pagination, Spinner
│   │   ├── auth/              # LoginForm, OAuthButton
│   │   ├── rooms/             # RoomCard, RoomFilter, AvailabilityBadge
│   │   ├── reservations/      # ReservationForm, ReservationCard, TimeRangePicker
│   │   ├── calendar/          # CalendarView, CalendarCell
│   │   └── admin/             # RoomFormModal, ReservationTable, StatsCard
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── OAuthCallbackPage.tsx
│   │   ├── RoomListPage.tsx
│   │   ├── RoomDetailPage.tsx
│   │   ├── ReservationNewPage.tsx
│   │   ├── MyReservationsPage.tsx
│   │   ├── ReservationDetailPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── admin/
│   │   │   ├── AdminRoomsPage.tsx
│   │   │   ├── AdminReservationsPage.tsx
│   │   │   ├── AdminUsersPage.tsx
│   │   │   └── AdminStatsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts         # AuthContext 소비 훅
│   │   ├── useRooms.ts        # 회의실 쿼리 훅
│   │   ├── useReservations.ts # 예약 쿼리/뮤테이션 훅
│   │   └── useAdmin.ts        # 관리자 쿼리 훅
│   ├── context/
│   │   └── AuthContext.tsx    # Access Token + 사용자 정보 메모리 상태
│   ├── router/
│   │   ├── index.tsx          # createBrowserRouter 라우트 정의
│   │   ├── PrivateRoute.tsx   # 인증 필요 라우트 가드
│   │   └── AdminRoute.tsx     # ADMIN 역할 라우트 가드
│   ├── types/
│   │   ├── api.types.ts       # ApiResponse, ErrorResponse, PageMeta
│   │   ├── auth.types.ts      # User, LoginRequest, TokenResponse
│   │   ├── room.types.ts      # Room, RoomAvailability
│   │   └── reservation.types.ts # Reservation, ReservationStatus
│   └── utils/
│       ├── date.ts            # ISO 8601 UTC ↔ 로컬 변환 헬퍼
│       └── errorMessage.ts    # 에러 코드 → 사용자 메시지 매핑
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 인증 설계

### 2.1 AuthContext 상태 구조

```
AuthContext
├── accessToken: string | null    # 메모리에만 저장 (localStorage 금지)
├── user: User | null             # GET /auth/me 응답 캐시
├── isAuthenticated: boolean
├── isAdmin: boolean              # role === 'ROLE_ADMIN'
├── login(email, password) → void
├── loginWithOAuth(token) → void  # OAuth2 콜백에서 호출
├── logout() → void
└── refreshToken() → Promise<string>
```

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

### 7.1 공통 API 타입 (`types/api.types.ts`)

```
ApiResponse<T>
  success: true
  data: T
  meta?: PageMeta

PageMeta
  total, page, size, totalPages

ErrorResponse
  success: false
  code: string
  message: string
  timestamp: string
  errors?: FieldError[]

FieldError
  field: string
  message: string
```

### 7.2 도메인 타입

```
User
  id, email, name, role: 'ROLE_USER' | 'ROLE_ADMIN', createdAt

Room
  id, name, location, capacity, description, amenities: string[], isActive, createdAt

RoomAvailability
  roomId, available: boolean
  conflictingReservations?: { id, title, startTime, endTime }[]

Reservation
  id, room: { id, name, location }, title, description
  startTime, endTime: string (ISO 8601)
  status: 'CONFIRMED' | 'CANCELLED'
  createdAt
  user?: { id, name, email }  # ADMIN 응답에만 포함
```

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
