# Feature Plan: reservation-ui

> 작성일: 2026-03-30
> 상태: Draft
> Phase: Plan
> 참조: docs/01-plan/features/requirements.plan.md
> 참조: docs/01-plan/features/frontend.plan.md
> 참조: docs/02-design/features/frontend.design.md

---

## 1. Overview

백엔드 예약 API(완전 구현됨)와 프론트엔드 API 클라이언트(reservations.api.ts, types.ts 완료)를 기반으로,
예약 관련 UI를 완성한다. 현재 4개 페이지가 스텁 상태이며, hooks/components 레이어가 없는 상태다.

---

## 2. Problem Statement

- `ReservationNewPage`, `MyReservationsPage`, `ReservationDetailPage`, `CalendarPage` 전부 스텁 (3줄)
- `features/reservations/hooks/` 없음
- `features/reservations/components/` 없음
- 핵심 비즈니스 기능(예약 생성/조회/수정/취소)이 UI 없어 동작 불가

---

## 3. Goals

1. 예약 생성 폼 (`/reservations/new`)
2. 내 예약 목록 (`/reservations/my`) — 상태/날짜 필터, 페이지네이션
3. 예약 상세 + 수정/취소 (`/reservations/:id`)
4. 캘린더 뷰 (`/calendar`) — 월별 예약 현황

---

## 4. Scope

### In Scope

| 레이어 | 파일 | 설명 |
|--------|------|------|
| hooks | `useMyReservations` | 내 예약 목록 + 필터/페이지 |
| hooks | `useReservation` | 단건 조회 |
| hooks | `useCreateReservation` | 예약 생성 뮤테이션 |
| hooks | `useUpdateReservation` | 예약 수정 뮤테이션 |
| hooks | `useCancelReservation` | 예약 취소 뮤테이션 |
| hooks | `useCalendar` | 월별 캘린더 데이터 |
| components | `ReservationForm` | 생성/수정 공용 폼 (날짜·시간·제목·설명) |
| components | `ReservationCard` | 목록용 카드 (상태 배지 포함) |
| components | `TimeRangePicker` | 시작/종료 시간 선택 |
| components | `CalendarView` | 월별 그리드 + 예약 표시 |
| pages | `ReservationNewPage` | 회의실 선택 → 예약 폼 |
| pages | `MyReservationsPage` | 목록 + 필터 + 페이지네이션 |
| pages | `ReservationDetailPage` | 상세 + 수정/취소 액션 |
| pages | `CalendarPage` | 캘린더 뷰 |

### Out of Scope

- 예약 승인 워크플로우 (FR-RES-07, Could)
- 반복 예약 (FR-RES-08, Could)
- 이메일 알림 (FR-NOTI-01, Should — 별도 피처)
- 관리자 예약 관리 페이지 (admin-ui 피처로 분리)

---

## 5. User Stories

```
AS 로그인한 사용자
I WANT 날짜/시간/제목을 입력해서 회의실을 예약하고 싶다
SO THAT 회의실 중복 없이 사용할 수 있다

AS 로그인한 사용자
I WANT 내 예약 목록을 조회하고 싶다
SO THAT 예약 현황을 한눈에 파악할 수 있다

AS 로그인한 사용자
I WANT 예약을 수정하거나 취소하고 싶다
SO THAT 일정 변경에 유연하게 대응할 수 있다

AS 로그인한 사용자
I WANT 월별 캘린더로 전체 예약 현황을 보고 싶다
SO THAT 회의실이 언제 비어 있는지 파악할 수 있다
```

---

## 6. Acceptance Criteria

| # | 조건 |
|---|------|
| AC-1 | `/reservations/new?roomId={id}` 진입 시 해당 회의실이 선택된 예약 폼 노출 |
| AC-2 | 제목(필수), 시작시간, 종료시간 입력 후 제출 시 예약 생성 → 상세 페이지로 이동 |
| AC-3 | 예약 시간 충돌 시 409 에러 → "해당 시간에 이미 예약이 있습니다." 메시지 표시 |
| AC-4 | `/reservations/my` 에서 내 예약 목록 표시 (CONFIRMED/CANCELLED 상태 배지) |
| AC-5 | 상태 필터(전체/진행중/취소됨)와 날짜 범위 필터 동작 |
| AC-6 | `/reservations/:id` 에서 예약 상세 정보 표시 |
| AC-7 | CONFIRMED 예약에만 수정/취소 버튼 노출 (CANCELLED는 비활성) |
| AC-8 | `/calendar` 에서 현재 월 그리드 표시, 예약이 있는 날짜 강조 |
| AC-9 | 캘린더에서 이전/다음 달 이동 가능 |

---

## 7. Technical Approach

### 7.1 의존성 (기존 활용)

| 항목 | 상태 | 활용 방법 |
|------|------|-----------|
| `reservations.api.ts` | ✅ 완료 | hooks에서 직접 호출 |
| `reservations/types.ts` | ✅ 완료 | `Reservation`, `ReservationCreateRequest` 등 |
| TanStack Query v5 | ✅ 설치됨 | `useQuery` / `useMutation` |
| React Hook Form + Zod | ✅ 설치됨 | `ReservationForm` 검증 |
| date-fns | ✅ 설치됨 | 날짜 포맷, ISO 변환, 캘린더 그리드 생성 |
| styled-components v6 | ✅ 설치됨 | 컴포넌트 스타일링 |
| `shared/components` (Button, Pagination, Skeleton) | ✅ 완료 | 재사용 |

### 7.2 hooks 설계 방향

```
useMyReservations(filters)  →  useQuery(['reservations/my', filters])
useReservation(id)          →  useQuery(['reservations', id])
useCalendar(year, month)    →  useQuery(['reservations/calendar', year, month])
useCreateReservation()      →  useMutation + onSuccess: navigate('/reservations/:id')
useUpdateReservation(id)    →  useMutation + onSuccess: invalidate(['reservations', id])
useCancelReservation(id)    →  useMutation + onSuccess: invalidate(['reservations', id])
```

### 7.3 ReservationNewPage 진입 방식

RoomDetailPage에서 "예약하기" 버튼 클릭 시 `?roomId={id}` 쿼리 파라미터로 이동.
페이지 내에서 `useSearchParams`로 roomId 추출 → 선택된 회의실 표시.

### 7.4 TimeRangePicker

`<input type="datetime-local">` 기반으로 구현.
Zod 검증: startTime < endTime, 과거 시간 불가.

### 7.5 CalendarView

date-fns `eachDayOfInterval`로 월별 날짜 그리드 생성.
예약 데이터를 날짜별로 그루핑해 해당 날짜 셀에 배지 표시.

---

## 8. 파일 구조

```
src/
├── features/reservations/
│   ├── api/
│   │   └── reservations.api.ts    ✅ 기존
│   ├── types.ts                   ✅ 기존
│   ├── hooks/                     ← 신규
│   │   ├── useMyReservations.ts
│   │   ├── useReservation.ts
│   │   ├── useCreateReservation.ts
│   │   ├── useUpdateReservation.ts
│   │   ├── useCancelReservation.ts
│   │   └── useCalendar.ts
│   └── components/                ← 신규
│       ├── ReservationForm.tsx
│       ├── ReservationCard.tsx
│       ├── TimeRangePicker.tsx
│       └── CalendarView.tsx
└── pages/reservations/
    ├── ReservationNewPage.tsx     ← 스텁 → 구현
    ├── MyReservationsPage.tsx     ← 스텁 → 구현
    ├── ReservationDetailPage.tsx  ← 스텁 → 구현
    └── CalendarPage.tsx           ← 스텁 → 구현
```

---

## 9. Dependencies

| 항목 | 상태 |
|------|------|
| 백엔드 예약 API | ✅ 완전 구현 |
| reservations.api.ts | ✅ 완료 |
| reservations/types.ts | ✅ 완료 |
| RoomListPage / RoomDetailPage | ✅ 완료 (예약하기 버튼 연결 필요) |
| TanStack Query QueryClient 설정 | ✅ 완료 |

---

## 10. Risk & Mitigation

| 위험 | 대응 |
|------|------|
| 시간대 불일치 (UTC vs 로컬) | date-fns로 ISO 8601 UTC 변환, 표시 시 로컬 변환 |
| 예약 충돌 (409) | `useCreateReservation` onError에서 에러 코드 감지 → 인라인 메시지 |
| 캘린더 성능 (많은 예약) | TanStack Query 캐시 활용, 월 변경 시만 재요청 |

---

## 11. Status

- [x] Plan 작성
- [ ] Design
- [ ] Implementation
- [ ] Gap Analysis
- [ ] Report
