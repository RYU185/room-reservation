# Handoff: Book & Meet Design System

## Overview
Book & Meet(북앤밋)는 사내 회의실 예약 웹 애플리케이션입니다.
이 핸드오프 패키지는 디자인 시스템의 토큰, 컴포넌트, 인터랙션 스펙을 포함합니다.
개발자는 이 문서와 동봉된 HTML 파일들을 참고하여 **기존 React 코드베이스에 동일한 디자인을 재현**하세요.

> ⚠️ 동봉된 HTML/JSX 파일은 **디자인 레퍼런스(프로토타입)**입니다.
> 프로덕션 코드로 직접 사용하지 말고, React 프로젝트의 기존 패턴과 라이브러리로 재구현하세요.

## Fidelity
**High-fidelity** — 색상, 타이포그래피, 간격, 인터랙션 모두 최종 확정 수준입니다.
픽셀 단위로 재현하되, React 프로젝트의 기존 컴포넌트 패턴(styled-components, Tailwind, CSS Modules 등)을 우선 따르세요.

---

## Design Tokens

### 색상 (Colors)

#### Primary Blue Scale
| Token | Value | 용도 |
|---|---|---|
| `--color-blue-950` | `#0D1B3E` | 최심 네이비 |
| `--color-blue-900` | `#1B2E5E` | 네비게이션 배경, 로고 |
| `--color-blue-800` | `#23407A` | 네이비 hover |
| `--color-blue-700` | `#2C5282` | Primary 버튼, 주요 액션 |
| `--color-blue-600` | `#2B6CB0` | Secondary 강조 |
| `--color-blue-500` | `#3182CE` | 링크 색상 |
| `--color-blue-400` | `#4299E1` | 포커스 링, 액센트 |
| `--color-blue-300` | `#63B3ED` | 밝은 강조 |
| `--color-blue-200` | `#90CDF4` | 아이콘, 부드러운 강조 |
| `--color-blue-100` | `#BEE3F8` | 태그 테두리 |
| `--color-blue-50`  | `#EBF8FF` | hover 배경, 태그 배경 |

#### Neutral Scale
| Token | Value | 용도 |
|---|---|---|
| `--color-gray-900` | `#1A202C` | 최진 텍스트 |
| `--color-gray-800` | `#2D3748` | 본문 텍스트, 카드 제목 |
| `--color-gray-700` | `#4A5568` | 강조 보조 텍스트 |
| `--color-gray-600` | `#718096` | 보조 텍스트, 아이콘 |
| `--color-gray-500` | `#A0AEC0` | 플레이스홀더, 뮤트 |
| `--color-gray-400` | `#CBD5E0` | 테두리 강조 |
| `--color-gray-300` | `#E2E8F0` | 기본 테두리, 구분선 |
| `--color-gray-200` | `#EDF2F7` | 배경 강조 |
| `--color-gray-100` | `#F7FAFC` | 페이지 배경 |
| `--color-white`    | `#FFFFFF` | 카드, 모달 배경 |

#### Semantic / Status
| Token | Value | 용도 |
|---|---|---|
| `--color-success` | `#38A169` | 예약 완료, 확인 |
| `--color-success-light` | `#C6F6D5` | 성공 배경 |
| `--color-error` | `#E53E3E` | 충돌, 오류, 취소 버튼 |
| `--color-error-light` | `#FED7D7` | 오류 배경 |
| `--color-warning` | `#D69E2E` | 임박, 주의 |
| `--color-warning-light` | `#FEFCBF` | 경고 배경 |

---

### 타이포그래피 (Typography)

| 항목 | 값 |
|---|---|
| **Primary Font** | `WantedSans` (업로드된 TTF 파일 사용) |
| **Fallback** | `Noto Sans KR`, `-apple-system`, `sans-serif` |
| **Mono Font** | `Fira Code` (시간 슬롯, 코드) |

#### Type Scale
| 이름 | Size | Weight | Line Height | 용도 |
|---|---|---|---|---|
| `text-4xl` | 48px | 700 | 1.2 | 페이지 히어로 |
| `text-3xl` | 40px | 700 | 1.2 | — |
| `text-2xl` | 32px | 700 | 1.2 | 페이지 제목 (h1) |
| `text-xl` | 24px | 600 | 1.375 | 섹션 제목 (h2) |
| `text-lg` | 20px | 600 | 1.375 | 카드 제목 (h3) |
| `text-md` | 18px | 400 | 1.5 | — |
| `text-base` | 16px | 400 | 1.625 | 본문 |
| `text-sm` | 14px | 400 | 1.5 | 보조 텍스트 |
| `text-xs` | 12px | 400/500 | 1.5 | 레이블, 힌트 |

Letter spacing: 제목류 `-0.025em`, 레이블(uppercase) `+0.05~0.1em`

---

### 간격 (Spacing)

Base unit: **4px**

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

컴포넌트 내부 패딩: `12–16px` 표준, `8px` 컴팩트

---

### 테두리 반경 (Border Radius)

| Token | Value | 용도 |
|---|---|---|
| `radius-sm` | 4px | 작은 태그, 코드 |
| `radius-md` | 6px | 버튼, 인풋 |
| `radius-lg` | 8px | 카드, 모달 |
| `radius-xl` | 12px | 큰 카드, 패널 |
| `radius-pill` | 9999px | 배지, 태그 |

---

### 그림자 (Shadows)

| Token | Value | 용도 |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | 미묘한 상승 |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | 카드 기본 |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)` | 호버 카드 |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)` | 드롭다운 |
| `shadow-modal` | `0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)` | 모달 |

---

### 전환 (Transitions)

| Token | Value |
|---|---|
| `transition-fast` | `150ms ease` |
| `transition-normal` | `200ms ease` |
| `transition-slow` | `0.5s ease` |

버튼 전환: `all 0.5s ease`  
Ghost 버튼: `background 0.5s ease` (테두리 전환 제외)

---

## 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  TopBar (height: 56px, sticky)          │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Main Content               │
│ (224px   │  (flex: 1, padding: 28px)   │
│  fixed)  │                             │
│          │                             │
└──────────┴──────────────────────────────┘
```

- **Sidebar width**: 224px, fixed, `background: #1B2E5E`
- **TopBar height**: 56px, sticky top, `background: white`, `border-bottom: 1px solid #E2E8F0`
- **Page background**: `#F7FAFC`
- **Content max-width**: 1200px (centered)

---

## 컴포넌트 스펙

### Sidebar
- 배경: `#1B2E5E`
- 로고 영역: padding `20px 20px 16px`, border-bottom `1px solid #23407A`
- 아이콘 마크: 32×32px, `border-radius: 8px`, `background: #2C5282`
- Nav 항목: padding `9px 12px`, `border-radius: 6px`, font-size 13px
  - 기본: `color: #63B3ED`, background transparent
  - Active: `background: #2C5282`, `color: white`, font-weight 600
  - Hover: `background: #23407A`
- 유저 아바타: 28×28px, circle, `background: #2C5282`, font 11px bold

### TopBar
- height: 56px, `background: white`
- 페이지 제목: font-size 16px, weight 700, `color: #2D3748`
- 부제목: font-size 12px, `color: #A0AEC0`
- 알림 버튼: padding `6px 12px`, `border-radius: 6px`, border `1px solid #E2E8F0`

### StatCard
- `background: white`, `border-radius: 8px`, `border: 1px solid #E2E8F0`
- Top accent border: `border-top: 3px solid {accent-color}`
- padding: `16px 20px`
- 레이블: font-size 11px, uppercase, letter-spacing 0.05em, `color: #A0AEC0`
- 값: font-size 28px, weight 700, `color: #1B2E5E`
- 보조: font-size 12px, `color: #A0AEC0`

### RoomCard
- `background: white`, `border-radius: 8px`
- 기본: `border: 1.5px solid #E2E8F0`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`
- 선택됨: `border: 1.5px solid #4299E1`, `box-shadow: 0 0 0 3px rgba(66,153,225,0.15)`
- padding: `16px`, cursor pointer
- hover: `box-shadow: 0 4px 6px rgba(0,0,0,0.07)`, `border-color: #BEE3F8`
- 층수 레이블: font-size 10px, uppercase, letter-spacing 0.05em, `color: #A0AEC0`
- 이름: font-size 15px, weight 600, `color: #2D3748`

### Buttons

| 종류 | 기본 상태 | Hover 상태 |
|---|---|---|
| **Primary** | bg `white`, color `#2C5282`, border `1.5px solid #2C5282` | bg `#2C5282`, color `white` |
| **Secondary** | bg `white`, color `#2C5282`, border `1.5px solid #2C5282` | bg `#EBF8FF` |
| **Ghost** | bg transparent, color `#E53E3E`, border `1.5px solid #E53E3E` | bg `#FED7D7` (테두리 transition 없음) |
| **Danger** | bg `white`, color `#E53E3E`, border `1.5px solid #E53E3E` | bg `#E53E3E`, color `white` |

- `border-radius: 6px`
- font-size: sm `12px`, default `14px`, lg `16px`
- padding: sm `6px 12px`, default `8px 16px`, lg `10px 20px`
- transition: `all 0.5s ease` (Ghost만 `background 0.5s ease`)
- disabled: `opacity: 0.4`, `cursor: not-allowed`

### Form Inputs
- `border-radius: 6px`, `border: 1px solid #CBD5E0`
- padding: `8px 12px`, font-size 13–14px, `color: #2D3748`
- focus: `border-color: #4299E1`, `box-shadow: 0 0 0 3px rgba(66,153,225,0.15)`
- error: `border-color: #E53E3E`
- placeholder: `color: #A0AEC0`

### Badge (상태 배지)
- `border-radius: 9999px`, padding `3px 9px`, font-size 11px, weight 500
- 앞에 6×6px 컬러 dot 포함

| 상태 | 배경 | 텍스트 | Dot |
|---|---|---|---|
| available | `#C6F6D5` | `#276749` | `#38A169` |
| booked | `#FED7D7` | `#9B2C2C` | `#E53E3E` |
| confirmed | `#C6F6D5` | `#276749` | `#38A169` |
| past | `#EDF2F7` | `#718096` | `#A0AEC0` |
| mine | `#EBF8FF` | `#2C5282` | `#4299E1` |

### Tag (어메니티 태그)
- `border-radius: 9999px`, padding `2px 8px`, font-size 11px
- `background: #EBF8FF`, `color: #2B6CB0`, `border: 1px solid #BEE3F8`

### TimeSlotGrid
- Grid: `repeat(6, 1fr)`, gap `4px`
- 각 슬롯: padding `8px 4px`, `border-radius: 6px`, font-size **16px**, font-family `WantedSans`
- 상태별 스타일:

| 상태 | 배경 | 텍스트 | 테두리 |
|---|---|---|---|
| free | `white` | `#2C5282` | `#E2E8F0` |
| free hover | `#EBF8FF` | `#2C5282` | `#BEE3F8` |
| selected | `#2C5282` | `white` | `#2C5282` |
| booked | `#EDF2F7` | `#A0AEC0` | `#E2E8F0` (cursor: not-allowed) |
| mine | `#EBF8FF` | `#2B6CB0` | `#BEE3F8` (weight 600) |

### BookingModal
- 오버레이: `rgba(0,0,0,0.35)`, fixed inset
- 모달: `background: white`, `border-radius: 12px`, width `440px`, padding `28px`
- `box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)`
- 요약 박스: `background: #F7FAFC`, `border-radius: 8px`, padding `14px 16px`
- 시간 표시: `font-family: 'Fira Code', monospace`

### ConfirmationBanner
- `background: #C6F6D5`, `border: 1px solid rgba(56,161,105,0.2)`, `border-radius: 8px`
- padding `14px 20px`, check-circle 아이콘 `#38A169`

---

## 화면별 스펙

### 1. Dashboard
- StatCard 3개: flex row, gap 16px, 전체 너비
- 섹션 제목: font-size 15px, weight 600
- 오늘의 예약: `background: white`, `border-radius: 8px`, `border: 1px solid #E2E8F0`
- 빠른 예약: `grid-template-columns: repeat(3, 1fr)`, gap 12px

### 2. Room Search (회의실 찾기)
- 2-column grid (1fr 1fr), gap 20px
- 좌측: 검색바 + 회의실 목록 (flex column, gap 8px)
- 우측: TimeSlotGrid + 예약 버튼
- 검색바: 검색 아이콘 좌측 absolute, left `12px`
- 빈 상태(회의실 미선택): height 300px, centered icon + 안내 문구

### 3. My Reservations (내 예약)
- 탭 필터: flex row, gap 10px
  - Active 탭: `background: #2C5282`, `color: white`, border same
  - Inactive: `background: white`, `color: #718096`, `border: 1px solid #E2E8F0`
- 목록: `background: white`, `border-radius: 8px`, overflow hidden
- 각 행: padding `14px 20px`, `border-bottom: 1px solid #EDF2F7`
  - 아이콘 영역: 40×40px, `border-radius: 8px`, `background: #EBF8FF`
  - 시간: `font-family: 'Fira Code', monospace`, font-size 13px

---

## 인터랙션 & 동작

- **버튼 hover**: `all 0.5s ease` (Ghost는 background만)
- **카드 hover**: `box-shadow`, `border-color` 변화, `200ms ease`
- **슬롯 토글**: 클릭 시 selected 배열에 추가/제거, 인접 슬롯 자동 연속 선택 없음
- **모달 열기**: 슬롯 1개 이상 선택 후 예약 버튼 활성화
- **예약 완료**: 모달 닫힘 → Dashboard로 이동 → ConfirmationBanner 노출
- **예약 취소**: 목록에서 해당 행 제거 (낙관적 업데이트)
- **localStorage**: 현재 화면(screen) 저장, 새로고침 시 복원

---

## 아이콘

**Lucide Icons** 사용 권장 (`lucide-react` npm 패키지)
- stroke-width: `1.8`
- 기본 size: `16px` (inline), `20px` (default), `24px` (section)
- 색상: 텍스트 컬러 상속 또는 명시적 지정

주요 아이콘:
`calendar`, `clock`, `users`, `map-pin`, `check-circle`, `search`, `settings`, `bell`, `log-out`, `home`, `book-open`, `filter`, `plus`, `x`

---

## 폰트 파일

- `WantedSans-Regular.ttf` — 동봉된 `fonts/` 폴더 참고
- React 프로젝트에서는 `public/fonts/` 또는 `src/assets/fonts/`에 배치 후 CSS `@font-face`로 로드

```css
@font-face {
  font-family: 'WantedSans';
  src: url('/fonts/WantedSans-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## 참고 파일 목록

| 파일 | 내용 |
|---|---|
| `colors_and_type.css` | 전체 CSS 변수 (토큰) |
| `ui_kits/web_app/index.html` | 인터랙티브 프로토타입 전체 |
| `preview/buttons.html` | 버튼 컴포넌트 레퍼런스 |
| `preview/badges-tags.html` | 배지 & 태그 레퍼런스 |
| `preview/room-card.html` | 회의실 카드 레퍼런스 |
| `preview/timeslot-picker.html` | 타임슬롯 피커 레퍼런스 |
| `preview/cards.html` | StatCard & InfoCard 레퍼런스 |
| `preview/inputs.html` | 폼 인풋 레퍼런스 |
| `preview/type-scale.html` | 타이포그래피 스케일 |
| `preview/colors-*.html` | 색상 팔레트 |
| `assets/logo.svg` | 로고 SVG |
