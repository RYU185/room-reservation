# [Analysis] reservation-ui — Gap Analysis

> 분석일: 2026-04-08
> Phase: Check
> 참조 설계: docs/02-design/features/reservation-ui.design.md
> Match Rate: **90%** (36/40)

---

## 1. 분석 요약

| 항목 | 결과 |
|------|------|
| 총 설계 항목 | 40개 |
| 일치 항목 | 36개 |
| 불일치 항목 | 4개 |
| Match Rate | **90%** |
| 판정 | ✅ PASS |

---

## 2. Acceptance Criteria 달성률 — 9/9 (100%)

| AC | 설계 조건 | 달성 여부 |
|----|-----------|-----------|
| AC-1 | `?roomId={id}` 진입 시 회의실 선택된 폼 | ✅ |
| AC-2 | 예약 생성 → 상세 페이지 이동 | ✅ |
| AC-3 | 409 충돌 → 에러 메시지 표시 | ✅ |
| AC-4 | 내 예약 목록 + 상태 배지 | ✅ |
| AC-5 | 상태 필터 + 날짜 범위 필터 | ✅ |
| AC-6 | 예약 상세 정보 표시 | ✅ |
| AC-7 | CONFIRMED만 수정/취소 버튼 노출 | ✅ |
| AC-8 | 캘린더 월별 그리드 + 예약 강조 | ✅ |
| AC-9 | 이전/다음 달 이동 | ✅ |

---

## 3. 파일 구조 달성률

| 레이어 | 설계 | 구현 | 상태 |
|--------|------|------|------|
| hooks/useMyReservations | ✅ | ✅ | 일치 |
| hooks/useReservation | ✅ | ✅ | 일치 |
| hooks/useCalendar | ✅ | ✅ | 일치 |
| hooks/useCreateReservation | ✅ | ❌ | **Gap (G1)** |
| hooks/useUpdateReservation | ✅ | ❌ | **Gap (G1)** |
| hooks/useCancelReservation | ✅ | ❌ | **Gap (G1)** |
| components/ReservationForm | ✅ | ✅ | 일치 |
| components/ReservationCard | ✅ | ✅ | 일치 |
| components/TimeRangePicker | ✅ | ✅ (향상) | 일치 (설계 초과) |
| components/CalendarView | ✅ | ✅ | 일치 |
| pages/ReservationNewPage | ✅ | ✅ | 일치 |
| pages/MyReservationsPage | ✅ | ✅ | 일치 |
| pages/ReservationDetailPage | ✅ | ✅ | 일치 |
| pages/CalendarPage | ✅ | ✅ | 일치 |

---

## 4. Gap 목록

### G1 — Mutation Hooks 파일 미분리 (LOW)

**설계**: `useCreateReservation`, `useUpdateReservation`, `useCancelReservation` 파일 별도 생성
**구현**: 파일 없음. 각 페이지에서 API 함수를 직접 호출.

```
ReservationNewPage → createReservation() 직접 import
ReservationDetailPage → updateReservation(), cancelReservation() 직접 import
```

**평가**: 설계 §4.1에서 "단순 async 함수 래퍼, loading/error는 페이지에서 직접 관리"로 명시했으므로 **기능적으로 동일**. 파일 구조만 설계와 다름.
**권장**: 파일 분리 없이 유지 가능. 페이지 코드가 길어지지 않는 한 현행 유지 OK.

---

### G2 — startTime/endTime UTC 변환 미적용 (MEDIUM)

**설계** §5:
```
API 전송: new Date(datetimeLocalValue).toISOString() (UTC 변환)
```

**구현**:
```typescript
startTime: values.startTime + ':00',  // "2026-04-08T09:00:00" (로컬 시간 그대로)
endTime: values.endTime + ':00',
```

**평가**: 백엔드 `ReservationCreateRequest`가 `LocalDateTime`으로 파싱하면 현재 동작에 문제없음. 그러나 UTC/KST 차이(+9h)가 존재하므로 운영 환경에서 시간대 이슈 발생 가능성 있음.
**권장**: 백엔드 필드 타입 확인 후 UTC 변환 적용 고려.

---

### G3 — CalendarPage 회의실 필터 드롭다운 미구현 (LOW)

**설계** §3.4.1:
```
roomFilter: number | undefined  // 회의실 필터 (optional)
```
레이아웃에도 `(선택) 회의실 필터 드롭다운` 명시.

**구현**: 회의실 필터 없음, 전체 예약만 표시.

**평가**: 설계에서 명시적으로 `optional`로 분류. 기능 영향도 낮음.
**권장**: 필요 시 추후 추가. 현 단계 미구현 허용.

---

### G4 — RESERVATION_CONFLICT 메시지 미세 차이 (LOW)

**설계** §6: `"해당 시간에 이미 예약이 있습니다."`
**구현** `errorMessage.ts`: `"해당 시간대에 이미 예약이 있습니다."`

**평가**: 의미 동일, 사용자 경험에 미미한 영향. 일관성 차원에서 수정 가능.

---

## 5. 설계 초과 구현 (긍정적 변경)

| 항목 | 설계 | 구현 |
|------|------|------|
| TimeRangePicker | `<input type="datetime-local">` | 커스텀 달력 + 시간 슬롯 피커 (오전/오후 구분) |
| useReservation | `{ reservation, loading, error, reload }` | `setReservation` 추가로 낙관적 업데이트 지원 |
| 상태 탭 텍스트 | "예약됨" | "예약 확정" (더 명확한 표현) |

---

## 6. 패턴 준수 검사

| 패턴 | 설계 방향 | 준수 |
|------|-----------|------|
| useState + useEffect | TanStack Query 없이 | ✅ |
| cancelled flag (메모리 누수 방지) | 필수 | ✅ |
| 색상 토큰 (#2563eb, #e2e8f0 등) | 공통 토큰 사용 | ✅ |
| styled-components | 스타일링 방식 | ✅ |
| getErrorMessage(code) | 오류 메시지 표준화 | ✅ |

---

## 7. 결론

```
Match Rate: 90% (36/40)
AC 달성: 9/9 (100%)
판정: ✅ PASS — Report 단계 진행 가능
```

### 수정 권장 우선순위

| 순위 | Gap | 심각도 | 권장 액션 |
|------|-----|--------|-----------|
| 1 | G2 — UTC 변환 | MEDIUM | 백엔드 타입 확인 후 결정 |
| 2 | G4 — 문구 차이 | LOW | 선택적 수정 |
| 3 | G1 — Hook 파일 분리 | LOW | 유지 가능 |
| 4 | G3 — 회의실 필터 | LOW | 추후 구현 |

---

## 8. Status

- [x] Plan 확인
- [x] Design 작성
- [x] Implementation
- [x] Gap Analysis (Match Rate: 90%)
- [ ] Report
