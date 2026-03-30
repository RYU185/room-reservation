# [Design] reservation-ui — 예약 UI 구현

> 작성일: 2026-03-30
> 상태: Draft
> Phase: Design
> 참조: docs/01-plan/features/reservation-ui.plan.md
> 참조: docs/02-design/features/frontend.design.md

---

## 1. 코드 패턴 컨벤션

### 1.1 기존 패턴 분석 (RoomListPage, RoomDetailPage 기준)

기존 페이지는 TanStack Query 없이 `useState + useEffect` 패턴으로 직접 API 호출.
reservation-ui도 동일 패턴을 따른다.

```
상태 관리: useState (data, loading, error)
데이터 페칭: useEffect + cancelled flag (메모리 누수 방지)
API 호출: features/[domain]/api/*.api.ts 직접 import
스타일링: styled-components (기존 색상 토큰 공유)
```

### 1.2 공통 색상 토큰 (기존 페이지에서 추출)

| 토큰 | 값 | 용도 |
|------|-----|------|
| primary | `#2563eb` | 주 버튼, 포커스 border |
| primary-hover | `#1d4ed8` | 버튼 hover |
| text-dark | `#1e293b` | 제목 |
| text-secondary | `#64748b` | 부제, 메타 |
| border | `#e2e8f0` | 카드, 인풋 테두리 |
| bg-light | `#f1f5f9` | 배경, 보조 버튼 |
| success-bg | `#f0fdf4` | 성공 배지 배경 |
| success-text | `#166534` | 성공 배지 텍스트 |
| error-bg | `#fef2f2` | 오류 배경 |
| error-text | `#dc2626` | 오류 텍스트 |

---

## 2. 상태 배지 설계 (ReservationStatus)

| Status | 배경 | 텍스트 색 | 표시 문자 |
|--------|------|-----------|-----------|
| CONFIRMED | `#dcfce7` | `#166534` | 예약 확정 |
| CANCELLED | `#f1f5f9` | `#64748b` | 취소됨 |

---

## 3. 페이지별 상세 설계

### 3.1 ReservationNewPage (`/reservations/new`)

#### 3.1.1 진입 방식

`RoomDetailPage`에서 예약하기 버튼 클릭 시 다음 URL로 이동:
```
/reservations/new?roomId={id}&startTime={ISO}&endTime={ISO}
```
`useSearchParams`로 쿼리 파라미터 읽어 폼 초기값 설정.

#### 3.1.2 폼 구성

| 필드 | 입력 타입 | 초기값 | Zod 검증 |
|------|-----------|--------|----------|
| 회의실 | 읽기 전용 표시 (roomId로 조회) | URL 파라미터 | — |
| 제목 | text | '' | min(1), max(100) |
| 설명 | textarea | '' | optional, max(500) |
| 시작 시간 | datetime-local | URL 파라미터 | required, 과거 불가 |
| 종료 시간 | datetime-local | URL 파라미터 | required, > startTime |

#### 3.1.3 처리 흐름

```
폼 제출
  → React Hook Form handleSubmit
  → Zod 검증 실패 → 인라인 필드 오류 표시
  → createReservation({ roomId, title, description, startTime(ISO), endTime(ISO) })
    → 성공(201) → navigate('/reservations/:id', { replace: true })
    → 실패(409 RESERVATION_CONFLICT) → serverError = "해당 시간에 이미 예약이 있습니다."
    → 실패(기타) → serverError = getErrorMessage(code)
```

#### 3.1.4 회의실 정보 표시

roomId로 `getRoom(roomId)` 호출 → 회의실명, 위치, 수용인원 표시 (읽기 전용 섹션).
로딩 중: Skeleton.

#### 3.1.5 레이아웃

```
Card (max-width: 560px)
├── 뒤로가기 버튼 (← 회의실 상세로)
├── 제목: "예약 만들기"
├── [읽기 전용] 회의실 정보 박스 (회의실명 + 위치)
├── 제목 입력 (text)
├── 시작 시간 (datetime-local)
├── 종료 시간 (datetime-local)
├── 설명 입력 (textarea, optional)
├── [서버 오류 AlertBox]
└── 예약하기 버튼 (loading spinner)
```

---

### 3.2 MyReservationsPage (`/reservations/my`)

#### 3.2.1 상태 구조

```typescript
data: { reservations: Reservation[]; meta: PageMeta } | null
loading: boolean
error: string | null
statusFilter: 'ALL' | 'CONFIRMED' | 'CANCELLED'
from: string   // 날짜 string (YYYY-MM-DD)
to: string
page: number
```

#### 3.2.2 필터 설계

| 필터 | UI | 값 |
|------|----|----|
| 상태 | 탭 버튼 3개 (전체/예약됨/취소됨) | ALL → undefined, CONFIRMED, CANCELLED |
| 날짜 범위 | date 인풋 2개 (from, to) | YYYY-MM-DD |
| 페이지 | Pagination 컴포넌트 | page, size=10 |

필터 변경 시 page=1 리셋.

#### 3.2.3 ReservationCard 구성

```
ReservationCard
├── 상태 배지 (CONFIRMED/CANCELLED)
├── 제목 (font-weight: 600)
├── 회의실명 + 위치
├── 날짜/시간 범위 (포맷: MM월 DD일 HH:mm ~ HH:mm)
└── 클릭 → navigate('/reservations/:id')
```

#### 3.2.4 레이아웃

```
Wrapper
├── 헤더: "내 예약"
├── 필터 영역
│   ├── 상태 탭 버튼 그룹
│   └── 날짜 범위 인풋 (from ~ to)
├── [로딩] Skeleton × 3
├── [빈 결과] "예약 내역이 없습니다."
├── 예약 카드 목록 (vertical list)
└── Pagination
```

---

### 3.3 ReservationDetailPage (`/reservations/:id`)

#### 3.3.1 상태 구조

```typescript
reservation: Reservation | null
loading: boolean
error: string | null
isEditing: boolean          // 수정 모드 토글
cancelConfirm: boolean      // 취소 확인 UI 표시
actionLoading: boolean      // 수정/취소 요청 중
actionError: string | null
```

#### 3.3.2 뷰 모드 (isEditing = false)

```
Card
├── 뒤로가기 버튼 (← 내 예약)
├── 상태 배지
├── 제목
├── 회의실: [회의실명] (위치)
├── 시간: MM월 DD일 (요일) HH:mm ~ HH:mm
├── 설명 (있을 경우)
└── 액션 영역 (CONFIRMED일 때만)
    ├── [수정] 버튼 → isEditing = true
    └── [취소] 버튼 → cancelConfirm = true
        └── 취소 확인 영역
            ├── "예약을 취소하시겠습니까?"
            ├── [확인] → cancelReservation
            └── [닫기] → cancelConfirm = false
```

#### 3.3.3 수정 모드 (isEditing = true)

React Hook Form으로 기존 값 pre-fill. 수정 가능 필드: 제목, 설명, 시작/종료 시간.

```
수정 폼 제출
  → updateReservation(id, { title, description, startTime, endTime })
    → 성공 → reservation 상태 갱신, isEditing = false
    → 실패(409) → "해당 시간에 이미 예약이 있습니다."
    → 실패(기타) → actionError = getErrorMessage(code)
```

취소 버튼 → isEditing = false (변경사항 폐기).

#### 3.3.4 취소 처리 흐름

```
[취소] 버튼 클릭 → cancelConfirm = true
  → [확인] 클릭 → cancelReservation(id)
    → 성공 → reservation.status = 'CANCELLED' 갱신, cancelConfirm = false
    → 실패 → actionError 표시
```

---

### 3.4 CalendarPage (`/calendar`)

#### 3.4.1 상태 구조

```typescript
year: number         // 현재 표시 년
month: number        // 현재 표시 월 (1-12)
reservations: Reservation[]
loading: boolean
error: string | null
roomFilter: number | undefined   // 회의실 필터 (optional)
```

초기값: 현재 년/월.

#### 3.4.2 캘린더 그리드 계산

`date-fns` 활용:
- `startOfMonth(date)` ~ `endOfMonth(date)` → 해당 월 날짜 배열
- `getDay(date)` → 첫째 날 요일 오프셋 (일요일=0)
- 6행 × 7열 그리드 (빈 셀은 null)

#### 3.4.3 날짜 셀 구성

```
DateCell
├── 날짜 숫자 (오늘이면 primary 색 원형 배경)
└── 예약 배지 (최대 3개, 초과시 +N 표시)
    └── 예약 제목 truncate
```

날짜 클릭 시 → 해당 날의 예약을 선택된 날짜 패널에 표시 (페이지 이동 없이 사이드 패널 또는 하단 목록).

#### 3.4.4 월 이동

```
[◀ 이전 달] 버튼 → month-- (1월이면 year--, month=12)
[다음 달 ▶] 버튼 → month++ (12월이면 year++, month=1)
월 변경 시 API 재호출
```

#### 3.4.5 레이아웃

```
Wrapper
├── 헤더 영역
│   ├── ◀ [YYYY년 MM월] ▶ 이동 컨트롤
│   └── (선택) 회의실 필터 드롭다운
├── 요일 헤더 행 (일~토)
├── 날짜 그리드 (6행 × 7열)
└── 선택된 날짜 예약 목록 (클릭 시 하단 표시)
```

---

## 4. 파일별 구현 명세

### 4.1 hooks

| 파일 | 함수 시그니처 | 반환 타입 | 구현 방식 |
|------|-------------|-----------|-----------|
| `useMyReservations.ts` | `(filters: ReservationFilters)` | `{ reservations, meta, loading, error, reload }` | useEffect + cancelled flag |
| `useReservation.ts` | `(id: number)` | `{ reservation, loading, error, reload }` | useEffect |
| `useCreateReservation.ts` | `()` | `{ create, loading, error }` | 단순 async 함수 래퍼 |
| `useUpdateReservation.ts` | `(id: number)` | `{ update, loading, error }` | 단순 async 함수 래퍼 |
| `useCancelReservation.ts` | `(id: number)` | `{ cancel, loading, error }` | 단순 async 함수 래퍼 |
| `useCalendar.ts` | `(year: number, month: number)` | `{ reservations, loading, error }` | useEffect |

뮤테이션 hooks (create/update/cancel)는 TanStack Query 없이 단순 async 함수 래퍼로 구현.
loading/error 상태는 호출하는 페이지에서 직접 관리 (기존 RoomDetailPage 패턴과 동일).

### 4.2 components

#### ReservationForm

| Props | 타입 | 설명 |
|-------|------|------|
| `defaultValues` | `Partial<FormValues>` | 수정 시 기존 값 pre-fill |
| `onSubmit` | `(values: FormValues) => Promise<void>` | 제출 핸들러 |
| `loading` | `boolean` | 제출 중 버튼 disabled |
| `serverError` | `string \| null` | 서버 오류 메시지 |
| `submitLabel` | `string` | 버튼 텍스트 (기본: "저장") |

FormValues: `{ title, description, startTime, endTime }`

#### ReservationCard

| Props | 타입 | 설명 |
|-------|------|------|
| `reservation` | `Reservation` | 예약 데이터 |
| `onClick` | `() => void` | 카드 클릭 핸들러 |

#### TimeRangePicker

| Props | 타입 | 설명 |
|-------|------|------|
| `startTime` | `string` | datetime-local 값 |
| `endTime` | `string` | datetime-local 값 |
| `onStartChange` | `(v: string) => void` | — |
| `onEndChange` | `(v: string) => void` | — |
| `errors` | `{ start?: string; end?: string }` | 검증 오류 |

ReservationForm 내부에서 사용. 독립 컴포넌트로 분리해 NewPage/수정 모드 공유.

#### CalendarView

| Props | 타입 | 설명 |
|-------|------|------|
| `year` | `number` | 표시 년 |
| `month` | `number` | 표시 월 (1-12) |
| `reservations` | `Reservation[]` | 해당 월 예약 데이터 |
| `onDateClick` | `(date: Date, items: Reservation[]) => void` | 날짜 클릭 |
| `loading` | `boolean` | 로딩 시 Skeleton 표시 |

---

## 5. 날짜/시간 처리 규칙

| 상황 | 처리 |
|------|------|
| API 전송 | `new Date(datetimeLocalValue).toISOString()` (UTC 변환) |
| 목록/상세 표시 | `format(new Date(isoString), 'MM월 dd일 HH:mm', { locale: ko })` |
| 캘린더 날짜 | `format(date, 'yyyy-MM-dd')` 기준으로 그루핑 |
| datetime-local 입력 | `isoString.slice(0, 16)` (YYYY-MM-DDTHH:mm 형식) |

---

## 6. 오류 코드 처리

| 서버 코드 | 발생 상황 | 화면 표시 |
|-----------|-----------|-----------|
| `RESERVATION_CONFLICT` (409) | 예약 시간 충돌 | "해당 시간에 이미 예약이 있습니다." |
| `RESERVATION_NOT_FOUND` (404) | 존재하지 않는 예약 | "예약을 찾을 수 없습니다." |
| `FORBIDDEN` (403) | 타인의 예약 수정/취소 시도 | getErrorMessage(code) |
| `VALIDATION_FAILED` (400) | 폼 검증 오류 | getErrorMessage(code) |
| 기타 | — | getErrorMessage(code) |

---

## 7. 라우터 연결 (기존 router/index.tsx — 변경 없음)

라우터는 이미 4개 예약 페이지를 모두 등록한 상태. 추가 변경 불필요.

---

## 8. 패키지 구조

```
src/features/reservations/
├── api/
│   └── reservations.api.ts       ✅ 기존 유지
├── types.ts                       ✅ 기존 유지
├── hooks/                         ← 신규
│   ├── useMyReservations.ts
│   ├── useReservation.ts
│   ├── useCreateReservation.ts
│   ├── useUpdateReservation.ts
│   ├── useCancelReservation.ts
│   └── useCalendar.ts
└── components/                    ← 신규
    ├── ReservationForm.tsx
    ├── ReservationCard.tsx
    ├── TimeRangePicker.tsx
    └── CalendarView.tsx

src/pages/reservations/
├── ReservationNewPage.tsx         ← 스텁 교체
├── MyReservationsPage.tsx         ← 스텁 교체
├── ReservationDetailPage.tsx      ← 스텁 교체
└── CalendarPage.tsx               ← 스텁 교체
```

---

## 9. Acceptance Criteria 매핑

| AC | 설계 항목 |
|----|-----------|
| AC-1: roomId 선택된 폼 | §3.1.1 진입 방식, §3.1.2 폼 구성 |
| AC-2: 예약 생성 → 상세 이동 | §3.1.3 처리 흐름 |
| AC-3: 409 충돌 안내 | §3.1.3, §6 오류 코드 처리 |
| AC-4: 내 예약 목록 + 상태 배지 | §3.2, §2 상태 배지 설계 |
| AC-5: 상태/날짜 필터 | §3.2.2 필터 설계 |
| AC-6: 예약 상세 표시 | §3.3.2 뷰 모드 |
| AC-7: CONFIRMED만 수정/취소 버튼 | §3.3.2 액션 영역 |
| AC-8: 캘린더 월별 그리드 | §3.4.2, §3.4.3 |
| AC-9: 이전/다음 달 이동 | §3.4.4 월 이동 |

---

## 10. Status

- [x] Plan 확인
- [x] Design 작성
- [ ] Implementation
- [ ] Gap Analysis
- [ ] Report
