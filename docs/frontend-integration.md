# Frontend Integration Guide — Room Reservation API

> 백엔드 서버: Spring Boot 4 / Java 21
> 작성 기준: 구현 완료 상태 (Match Rate 97%)
> Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 1. 환경 설정

### Base URL

| 환경 | URL |
|------|-----|
| 로컬 개발 | `http://localhost:8080/api/v1` |
| 운영 | `https://{domain}/api/v1` |

### 공통 요청 헤더

```
Content-Type: application/json
Authorization: Bearer {accessToken}   ← 인증 필요 엔드포인트
X-Request-ID: req_xxxxxxxx            ← 선택 (없으면 서버가 자동 생성)
```

### CORS

허용 Origin: `http://localhost:3000` (기본값, 서버 환경변수 `CORS_ALLOWED_ORIGINS`로 변경 가능)
`credentials: true` 필수 — Refresh Token 쿠키 전송에 필요.

---

## 2. 인증 전략

### 토큰 구조

| 토큰 | 유효기간 | 저장 위치 | 전달 방식 |
|------|---------|-----------|-----------|
| Access Token | 1시간 | **메모리** (변수) | `Authorization: Bearer` 헤더 |
| Refresh Token | 7일 | **HttpOnly Cookie** (서버 설정) | 자동 전송 (fetch credentials) |

> Access Token을 localStorage에 저장하지 말 것 (XSS 취약).
> Refresh Token은 서버가 자동으로 쿠키에 넣으므로 프론트에서 직접 다루지 않음.

---

## 3. 인증 API

### 3-1. 이메일 로그인

```
POST /auth/login
```

**요청**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

**응답 Set-Cookie (자동)**
```
Set-Cookie: refreshToken=xxx; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=604800
```

**처리 방법**
```typescript
const res = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',          // 쿠키 수신을 위해 필수
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const { data } = await res.json()
accessToken = data.accessToken      // 메모리에 보관
```

---

### 3-2. OAuth2 소셜 로그인

**흐름**

```
1. 브라우저를 /oauth2/authorization/google 로 리다이렉트
2. Google 동의 화면
3. 서버 콜백 처리 → JWT 발급
4. 프론트로 리다이렉트: {OAUTH2_REDIRECT_URI}?token={accessToken}
   실패 시: {OAUTH2_REDIRECT_URI}?error={errorCode}
```

**로그인 시작**
```typescript
// 현재 창을 리다이렉트 (팝업 방식도 가능)
window.location.href = 'http://localhost:8080/oauth2/authorization/google'
```

**콜백 페이지 처리** (`/oauth2/callback`)
```typescript
const params = new URLSearchParams(window.location.search)

if (params.has('error')) {
  const error = params.get('error')
  // 'email_already_exists' → "이미 다른 방법으로 가입된 이메일입니다"
  // 'unsupported_provider' → "지원하지 않는 소셜 로그인입니다"
  // 'oauth2_error'         → "소셜 로그인 중 오류가 발생했습니다"
  showError(error)
  return
}

const token = params.get('token')
accessToken = token   // 메모리에 보관
// URL에서 token 파라미터 제거
window.history.replaceState({}, '', '/oauth2/callback')
// 로그인 성공 처리
router.push('/dashboard')
```

> URL에서 token을 읽은 직후 `history.replaceState`로 제거 권장 (브라우저 히스토리 노출 방지).

---

### 3-3. Access Token 갱신

Access Token 만료 시 자동 갱신 인터셉터:

```typescript
POST /auth/refresh
// 요청 본문 없음. Refresh Token은 쿠키로 자동 전송.
credentials: 'include' 필수
```

**응답 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

**에러 응답 (쿠키 만료/무효)**
```json
{
  "success": false,
  "code": "TOKEN_EXPIRED",
  "message": "액세스 토큰이 만료되었습니다. 갱신이 필요합니다.",
  "timestamp": "2026-03-18T10:00:00Z"
}
```
→ 재로그인 유도.

---

### 3-4. 로그아웃

```
POST /auth/logout
Authorization: Bearer {accessToken}
credentials: 'include'
```

**응답 204 No Content** (본문 없음)
서버에서 Refresh Token DB 삭제 + 쿠키 만료 처리.

---

### 3-5. 내 정보 조회

```
GET /auth/me
Authorization: Bearer {accessToken}
```

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "ROLE_USER",
    "createdAt": "2026-03-01T09:00:00Z"
  }
}
```

---

## 4. API 클라이언트 구현 예시 (axios)

```typescript
import axios from 'axios'

let accessToken: string | null = null

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true,            // Refresh Token 쿠키 자동 전송
})

// 요청 인터셉터 — Access Token 주입
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// 응답 인터셉터 — 401 시 자동 갱신
let isRefreshing = false
let waitQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // 갱신 중이면 대기열에 추가
        return new Promise(resolve => {
          waitQueue.push(token => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          'http://localhost:8080/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        )
        accessToken = data.data.accessToken
        waitQueue.forEach(cb => cb(accessToken!))
        waitQueue = []
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        // Refresh Token도 만료 → 로그아웃
        accessToken = null
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export { api, accessToken }
export const setAccessToken = (token: string) => { accessToken = token }
```

---

## 5. 공통 응답 구조

### 성공 응답

```typescript
interface ApiResponse<T> {
  success: true
  data: T
  meta?: PageMeta | null
}

interface PageMeta {
  total: number
  page: number       // 1-based
  size: number
  totalPages: number
}
```

### 에러 응답

```typescript
interface ErrorResponse {
  success: false
  code: string
  message: string
  timestamp: string  // ISO 8601
  errors?: FieldError[]   // 유효성 검증 실패 시만 포함
}

interface FieldError {
  field: string
  message: string
}
```

### 에러 코드 처리 가이드

| code | HTTP | 처리 방법 |
|------|------|-----------|
| `VALIDATION_FAILED` | 400 | `errors` 배열에서 필드별 메시지 표시 |
| `INVALID_INPUT` | 400 | 특수문자 입력 안내 |
| `UNAUTHORIZED` | 401 | 로그인 페이지로 이동 |
| `TOKEN_EXPIRED` | 401 | `/auth/refresh` 후 재시도 |
| `INVALID_TOKEN` | 401 | 로그인 페이지로 이동 |
| `FORBIDDEN` | 403 | 권한 없음 안내 |
| `NOT_FOUND` | 404 | 리소스 없음 안내 |
| `RESERVATION_CONFLICT` | 409 | "해당 시간대에 이미 예약이 있습니다" |
| `EMAIL_DUPLICATE` | 409 | "이미 사용 중인 이메일입니다" |
| `ROOM_INACTIVE` | 409 | "사용할 수 없는 회의실입니다" |
| `DB_ERROR` / `INTERNAL_ERROR` | 500 | "서버 오류가 발생했습니다. 잠시 후 재시도해 주세요" |

---

## 6. 회의실 API

### 목록 조회

```
GET /rooms?page=1&size=20&location=3층&minCapacity=6
Authorization: Bearer {accessToken}
```

**응답 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "세미나실 A",
      "location": "3층",
      "capacity": 10,
      "description": "프로젝터 구비",
      "amenities": ["프로젝터", "화이트보드"],
      "isActive": true,
      "createdAt": "2026-03-01T09:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "size": 20,
    "totalPages": 1
  }
}
```

### 상세 조회

```
GET /rooms/{id}
```

### 가용 여부 조회

```
GET /rooms/{id}/availability?startTime=2026-03-20T09:00:00Z&endTime=2026-03-20T10:00:00Z
```

**응답 200**
```json
{
  "success": true,
  "data": {
    "roomId": 1,
    "available": false,
    "conflictingReservations": [
      { "id": 5, "title": "팀 회의", "startTime": "...", "endTime": "..." }
    ]
  }
}
```

### 회의실 등록 (ADMIN)

```
POST /rooms
```
```json
{
  "name": "회의실 B",
  "location": "2층",
  "capacity": 8,
  "description": "소규모 회의용",
  "amenities": ["TV", "화이트보드"]
}
```

### 회의실 수정 (ADMIN)

```
PUT /rooms/{id}
```

### 회의실 비활성화 (ADMIN)

```
PATCH /rooms/{id}/deactivate
```
**응답 204 No Content**

---

## 7. 예약 API

### 내 예약 목록

```
GET /reservations/my?page=1&size=20&status=CONFIRMED&from=2026-03-01&to=2026-03-31
```

**status 값:** `CONFIRMED` | `CANCELLED`

**응답 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "room": { "id": 1, "name": "세미나실 A", "location": "3층" },
      "title": "스프린트 계획",
      "description": "2주 스프린트 킥오프",
      "startTime": "2026-03-20T09:00:00Z",
      "endTime": "2026-03-20T10:30:00Z",
      "status": "CONFIRMED",
      "createdAt": "2026-03-18T08:00:00Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "size": 20, "totalPages": 1 }
}
```

> `user` 필드는 ADMIN 응답에서만 포함됨.

### 예약 상세

```
GET /reservations/{id}
```

### 캘린더 조회

```
GET /reservations/calendar?year=2026&month=3&roomId=1
```

### 예약 생성

```
POST /reservations
```
```json
{
  "roomId": 1,
  "title": "주간 회의",
  "description": "팀 주간 싱크",
  "startTime": "2026-03-20T09:00:00Z",
  "endTime": "2026-03-20T10:00:00Z"
}
```

**응답 201**
```json
{
  "success": true,
  "data": { /* ReservationResponse */ }
}
```

**충돌 시 응답 409**
```json
{
  "success": false,
  "code": "RESERVATION_CONFLICT",
  "message": "해당 시간대에 이미 예약이 존재합니다.",
  "timestamp": "2026-03-18T10:00:00Z"
}
```

### 예약 수정

```
PUT /reservations/{id}
```
```json
{
  "roomId": 1,
  "title": "수정된 회의",
  "startTime": "2026-03-20T10:00:00Z",
  "endTime": "2026-03-20T11:00:00Z"
}
```

### 예약 취소

```
PATCH /reservations/{id}/cancel
```
**응답 204 No Content**

---

## 8. 관리자 API (ROLE_ADMIN 전용)

### 전체 예약 목록

```
GET /admin/reservations?page=1&size=20&roomId=1&userId=5&status=CONFIRMED&from=2026-03-01&to=2026-03-31
```

### 예약 강제 취소

```
PATCH /admin/reservations/{id}/cancel
```
**응답 204**

### 사용자 목록

```
GET /admin/users
```

### 특정 사용자 예약 이력

```
GET /admin/users/{id}/reservations
```

### 회의실 통계

```
GET /admin/stats/rooms
```

**응답 200**
```json
{
  "success": true,
  "data": [
    {
      "roomId": 1,
      "roomName": "세미나실 A",
      "totalReservations": 42,
      "confirmedReservations": 38,
      "utilizationRate": 73.5
    }
  ]
}
```

---

## 9. 페이지네이션 공통 규약

| 파라미터 | 기본값 | 최대값 | 설명 |
|----------|--------|--------|------|
| `page` | 1 | — | 1-based 페이지 번호 |
| `size` | 20 | 100 | 페이지당 건수 |
| `sort` | `createdAt` | — | 정렬 필드 |
| `direction` | `desc` | — | `asc` / `desc` |

---

## 10. 로그 추적 (Zero Script QA)

서버 응답 헤더에 `X-Request-ID`가 포함됨.
버그 신고 시 이 값을 포함하면 서버 로그 추적 가능.

```typescript
// 요청에 ID를 직접 지정하는 경우 (선택)
api.defaults.headers['X-Request-ID'] = `req_${crypto.randomUUID().slice(0, 8)}`

// 응답에서 서버가 발급한 ID 확인
api.interceptors.response.use(res => {
  const requestId = res.headers['x-request-id']
  // 에러 발생 시 requestId를 에러 리포트에 포함
  return res
})
```

---

## 11. 체크리스트

- [ ] `credentials: 'include'` (또는 `withCredentials: true`) — Refresh Token 쿠키 전송 필수
- [ ] Access Token → 메모리 저장 (localStorage 금지)
- [ ] 401 응답 시 `/auth/refresh` 자동 재시도 인터셉터 구현
- [ ] OAuth2 콜백 페이지: `?token=` 파싱 후 URL 정리
- [ ] OAuth2 실패: `?error=` 값으로 사용자 안내
- [ ] 예약 생성 전 `/rooms/{id}/availability` 사전 확인 권장
- [ ] 날짜/시간 값은 모두 **ISO 8601 UTC** 형식 (`2026-03-20T09:00:00Z`)

---

## 12. 로컬 개발 서버 실행

```bash
# 백엔드 실행 (PostgreSQL 필요)
./gradlew bootRun

# 환경변수 (최소 필수)
JWT_SECRET=local-dev-secret-key-must-be-at-least-32bytes!!
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

Swagger UI: `http://localhost:8080/swagger-ui.html`
Health Check: `http://localhost:8080/actuator/health`
