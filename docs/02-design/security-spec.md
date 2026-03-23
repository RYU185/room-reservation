# Room Reservation - Security Vulnerability Analysis Report

> Analyzed: 2026-03-23
> Analyst: Security Architect Agent
> Scope: Full-stack (Spring Boot 4.0.3 backend + React/Vite frontend)

---

## Executive Summary

Overall the project demonstrates **solid security fundamentals** -- JWT in-memory
storage, HttpOnly cookie for refresh tokens, BCrypt password hashing, JPA
parameterized queries, CORS scoping, and defense-in-depth SQL injection
validators. However, several issues ranging from CRITICAL to LOW were identified.

| Severity | Count | Immediate Action Required |
|----------|-------|---------------------------|
| CRITICAL | 2     | Yes -- block deployment    |
| HIGH     | 4     | Fix before release         |
| MEDIUM   | 5     | Fix in next sprint         |
| LOW      | 4     | Track in backlog           |

---

## CRITICAL Findings

### C-1. Hardcoded Admin Credentials in DataInitializer

**OWASP**: A07 (Identification and Authentication Failures)
**File**: `src/main/java/com/ryu/room_reservation/global/config/DataInitializer.java:41-46`
**Description**: The admin password `admin1234!` is hardcoded in source code and
logged in plain text to the application log. This code runs on every startup and
creates a well-known admin account (`admin@example.com`) with a predictable
password.

**Impact**: Any person with access to the repository or log output knows the admin
credentials. If this DataInitializer runs in production, the system is immediately
compromised.

**Evidence**:
```java
userRepository.save(User.builder()
    .email("admin@example.com")
    .password(passwordEncoder.encode("admin1234!"))
    // ...
log.info("[DataInitializer] admin account created: admin@example.com / admin1234!");
```

**Remediation**:
- Read admin credentials from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Never log credentials, even at INFO level
- Gate this initializer behind a `@Profile("dev")` or `@ConditionalOnProperty` so it never runs in production
- Consider a separate bootstrap CLI command instead of an ApplicationRunner

---

### C-2. OAuth2 Access Token Exposed in URL Query Parameter

**OWASP**: A02 (Cryptographic Failures), A07 (Identification and Authentication Failures)
**File**: `src/main/java/.../auth/oauth2/OAuth2AuthenticationSuccessHandler.java:49-51`
**Description**: After successful OAuth2 login, the JWT access token is passed to
the frontend via a URL query parameter:
```java
String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
        .queryParam("token", tokens.tokenResponse().accessToken())
        .build().toUriString();
```

**Impact**:
- The token appears in browser history, server access logs, Referer headers, and
  proxy/CDN logs
- Any intermediary can capture the token and impersonate the user
- The frontend `OAuthCallbackPage.tsx` is currently a stub (`<div>OAuthCallbackPage</div>`)
  and does not consume or clear the token from the URL

**Remediation**:
- Use a short-lived authorization code pattern: redirect with a one-time
  opaque code, then the frontend exchanges it for tokens via a back-channel POST
- If the query parameter approach must stay temporarily, the OAuthCallbackPage
  must immediately extract the token from the URL, store it in memory, and
  `window.history.replaceState` to strip the parameter
- Set short expiry (30 seconds) on the token used in this redirect flow

---

## HIGH Findings

### H-1. CSRF Disabled Without Adequate Compensating Controls

**OWASP**: A01 (Broken Access Control)
**File**: `SecurityConfig.java:43`
**Description**: CSRF protection is fully disabled (`.csrf(AbstractHttpConfigurer::disable)`).
While this is standard for stateless JWT APIs, the application also uses
HttpOnly cookies for refresh tokens. The `/api/v1/auth/refresh` endpoint is
effectively cookie-authenticated -- an attacker can forge a cross-site POST
to this endpoint.

**Impact**: An attacker-controlled page can make a POST to `/api/v1/auth/refresh`
with the victim's cookie, obtaining a new access token. The SameSite=Strict
on the refresh cookie mitigates this for the `/auth/login` and `/auth/logout`
flows, but the OAuth2 refresh cookie uses `SameSite=Lax` (see
`OAuth2AuthenticationSuccessHandler.java:62`), which allows GET-initiated
cross-site requests.

**Remediation**:
- Ensure ALL refresh token cookies use `SameSite=Strict` consistently
  (OAuth2 handler currently uses `Lax`)
- Consider adding a custom CSRF header check (e.g., `X-Requested-With`)
  for cookie-authenticated endpoints
- Or move refresh tokens out of cookies entirely (use rotating refresh
  in request body with a binding mechanism)

---

### H-2. JPA Criteria LIKE Query with Unsanitized User Input

**OWASP**: A03 (Injection)
**File**: `src/main/java/.../room/service/RoomService.java:91`
**Description**: The `location` query parameter is concatenated directly into
a LIKE pattern without escaping JPA/SQL LIKE wildcards:
```java
predicates.add(cb.like(root.get("location"), "%" + location + "%"));
```
While JPA parameterized queries prevent SQL injection, the LIKE-specific
wildcards `%` and `_` are NOT escaped. An attacker can pass `%` as the
location parameter to match all rooms, or use `_` to probe single characters.

**Impact**: Information disclosure through wildcard abuse. Not a full SQL
injection, but allows data extraction beyond intended filter behavior.

**Remediation**:
- Escape LIKE wildcards in user input: replace `%` with `\%`, `_` with `\_`
- Use `cb.like(root.get("location"), pattern, '\\')` to set escape character
- Or switch to `cb.equal()` / full-text search

---

### H-3. No Rate Limiting on Authentication Endpoints

**OWASP**: A07 (Identification and Authentication Failures)
**Files**: `AuthController.java` (login, refresh endpoints)
**Description**: There is no rate limiting on `/api/v1/auth/login`,
`/api/v1/auth/refresh`, or OAuth2 endpoints. An attacker can perform
unlimited brute-force password guessing.

**Impact**: Credential brute-force attacks against known email addresses.
The login error message correctly does not distinguish between "email not
found" and "wrong password" (both return UNAUTHORIZED), which is good, but
without rate limiting the defense is insufficient.

**Remediation**:
- Add rate limiting (e.g., Bucket4j, Spring Cloud Gateway, or Resilience4j)
  at minimum on `/api/v1/auth/login`
- Consider account lockout after N failed attempts
- Add CAPTCHA after repeated failures

---

### H-4. Swagger UI Exposed Without Authentication

**OWASP**: A05 (Security Misconfiguration)
**File**: `SecurityConfig.java:54-59`
**Description**: The Swagger UI and OpenAPI spec endpoints are publicly accessible:
```java
.requestMatchers(
    "/swagger-ui/**",
    "/swagger-ui.html",
    "/v3/api-docs/**",
    "/actuator/health",
    "/actuator/info"
).permitAll()
```

**Impact**: In production, this exposes the full API specification, including
endpoint paths, parameter schemas, and error codes, giving attackers a
detailed map of the attack surface.

**Remediation**:
- Gate Swagger endpoints behind authentication or `@Profile("dev")`
- Use `springdoc.swagger-ui.enabled=false` in production profile
- Actuator health/info are generally acceptable to expose

---

## MEDIUM Findings

### M-1. Inconsistent SameSite Cookie Policy (Strict vs Lax)

**Files**: `AuthController.java:109` (Strict), `OAuth2AuthenticationSuccessHandler.java:62` (Lax)
**Description**: The refresh token cookie is set with `SameSite=Strict` for
normal login but `SameSite=Lax` for OAuth2 login. This inconsistency means
OAuth2-authenticated users have weaker CSRF protection.

**Remediation**: Use `SameSite=Strict` for both, or if Lax is required for
OAuth2 redirect flow, switch to Strict immediately after the callback exchange.

---

### M-2. Frontend .env File Committed to Git

**File**: `room-reservation(frontend)/.env`
**Description**: The `.env` file containing `VITE_API_BASE_URL` is tracked in
git. While it currently contains only localhost URLs (no secrets), the frontend
`.gitignore` does not exclude `.env` (only `*.local`). This creates a risk
that someone will add secrets to this file in the future.

**Remediation**: Add `.env` to `room-reservation(frontend)/.gitignore` and
use `.env.example` with placeholder values instead.

---

### M-3. OAuthCallbackPage is a Non-Functional Stub

**File**: `room-reservation(frontend)/src/pages/auth/OAuthCallbackPage.tsx`
**Description**: This page renders only `<div>OAuthCallbackPage</div>` and
does not extract the `token` query parameter from the OAuth2 redirect.
This means:
- The token remains visible in the URL bar indefinitely
- The `loginWithOAuth()` function in AuthContext is never called
- OAuth2 login flow is broken

**Remediation**: Implement the callback page to:
1. Extract `token` from `URLSearchParams`
2. Call `loginWithOAuth(token)`
3. Strip the token from the URL via `history.replaceState`
4. Redirect to home page
5. Handle `error` query parameter for failure cases

---

### M-4. Missing `@NoSqlInjection` on `description` Fields

**Files**: `ReservationCreateRequest.java:26`, `ReservationUpdateRequest.java:22`,
`RoomRequest.java:33`
**Description**: The `title`, `name`, `location`, and `email` fields have
`@NoSqlInjection` validation, but `description` fields (up to 1000 characters)
do not. While JPA parameterized queries provide primary protection, this is
inconsistent with the defense-in-depth strategy applied to other fields.

**Remediation**: Add `@NoSqlInjection` to description fields, or if
descriptions need special characters (apostrophes, etc.), use the
`InputSanitizer` approach with a more permissive pattern.

---

### M-5. No Security Response Headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)

**OWASP**: A05 (Security Misconfiguration)
**Description**: The application does not configure any security response
headers. Spring Security defaults provide some (X-Content-Type-Options,
X-Frame-Options) but CSRF disable may affect defaults, and there is no
explicit configuration for:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Frame-Options` (explicit)
- `Referrer-Policy`
- `Permissions-Policy`

**Remediation**: Add explicit security header configuration in SecurityConfig
or via a custom filter.

---

## LOW Findings

### L-1. JWT Secret Default Value in application.properties

**File**: `application.properties:19`
**Description**: The JWT secret has a fallback default:
`${JWT_SECRET:local-dev-secret-key-must-be-at-least-32bytes!!}`
While the naming convention makes it clear this is for local development,
if `JWT_SECRET` env var is not set in production, the application will start
with this predictable key.

**Remediation**: Remove the default value entirely so the application fails
fast if `JWT_SECRET` is not configured. The current comment says "fail on
missing" but the `:default` syntax prevents that.

---

### L-2. Hibernate ddl-auto=update in Properties

**File**: `application.properties:10`
**Description**: `spring.jpa.hibernate.ddl-auto=update` will automatically
modify the production database schema. While Flyway is present as a
dependency, it is disabled (`spring.flyway.enabled=false`).

**Remediation**: Use `validate` in production and `update` only in dev
profile. Enable Flyway for controlled schema migrations.

---

### L-3. RequestIdFilter Accepts External X-Request-ID Without Validation

**File**: `RequestIdFilter.java:42-44`
**Description**: The filter trusts the incoming `X-Request-ID` header and
echoes it back. An attacker can inject arbitrary strings (including log
injection patterns like `%n`, CRLF sequences) into application logs.

**Remediation**: Validate the incoming request ID format (alphanumeric +
hyphens only, max length) before using it. Reject or regenerate if invalid.

---

### L-4. Pageable Max Size May Allow Large Data Dumps

**File**: `application.properties:46`
**Description**: `spring.data.web.pageable.max-page-size=100` allows up to
100 records per page. While not excessive, combined with the admin endpoints
that expose user lists and reservation history, this could facilitate bulk
data extraction.

**Remediation**: This is acceptable for now. Consider lower limits for
sensitive endpoints like `/admin/users`.

---

## Positive Security Findings (What's Done Well)

| Area | Implementation | Assessment |
|------|---------------|------------|
| Access Token Storage | In-memory only (`tokenStore.ts`), not localStorage | Excellent |
| Refresh Token | HttpOnly cookie, scoped to `/api/v1/auth` | Good |
| Password Hashing | BCrypt via `BCryptPasswordEncoder` | Industry standard |
| Admin Authorization | URL-level (`hasRole("ADMIN")` in SecurityConfig) + method-level (`@PreAuthorize` in RoomController) | Double-layered, good |
| Session Management | Stateless JWT, no server sessions | Appropriate for SPA |
| SQL Injection | JPA parameterized queries + `@NoSqlInjection` validator | Defense-in-depth |
| Error Handling | Generic error messages, no stack trace exposure | Good |
| Login Error Messages | Same UNAUTHORIZED for wrong email or password | Prevents user enumeration |
| Refresh Token Rotation | Old token replaced on each refresh | Prevents replay |
| Input Validation | Bean Validation on all DTOs with size limits | Comprehensive |
| CORS | Scoped to `/api/**` with configurable origins | Good |
| Actuator | Only health/info exposed, details hidden | Appropriate |

---

## OWASP Top 10 Coverage Matrix

| OWASP ID | Category | Status | Notes |
|----------|----------|--------|-------|
| A01 | Broken Access Control | PARTIAL | Admin guard solid; CSRF gap on cookie endpoints (H-1) |
| A02 | Cryptographic Failures | ISSUE | Token in URL (C-2); JWT secret default (L-1) |
| A03 | Injection | GOOD | JPA params + validators; LIKE wildcard gap (H-2) |
| A04 | Insecure Design | GOOD | Proper separation, layered auth |
| A05 | Security Misconfiguration | ISSUE | Swagger exposed (H-4); no security headers (M-5) |
| A06 | Vulnerable Components | OK | Spring Boot 4.0.3, JJWT 0.12.6 are current |
| A07 | Auth Failures | ISSUE | Hardcoded creds (C-1); no rate limiting (H-3) |
| A08 | Integrity Failures | OK | No deserialization issues found |
| A09 | Logging Failures | PARTIAL | Request ID tracing exists; log injection risk (L-3) |
| A10 | SSRF | OK | No user-controlled URL fetching found |

---

## Recommended Fix Priority

### Phase 1 -- Before Any Deployment (CRITICAL + HIGH)
1. C-1: Move admin credentials to env vars, gate behind dev profile
2. C-2: Implement OAuthCallbackPage properly, or switch to auth code flow
3. H-1: Unify SameSite=Strict, add custom CSRF header for cookie endpoints
4. H-2: Escape LIKE wildcards in location search
5. H-3: Add rate limiting on auth endpoints
6. H-4: Disable Swagger in production profile

### Phase 2 -- Next Sprint (MEDIUM)
7. M-1: Consistent cookie policy (covered by H-1)
8. M-2: Fix frontend .gitignore
9. M-3: Implement OAuthCallbackPage (covered by C-2)
10. M-4: Add @NoSqlInjection to description fields
11. M-5: Configure security response headers

### Phase 3 -- Backlog (LOW)
12. L-1: Remove JWT secret default value
13. L-2: Environment-specific ddl-auto
14. L-3: Validate X-Request-ID format
15. L-4: Monitor pageable size usage
