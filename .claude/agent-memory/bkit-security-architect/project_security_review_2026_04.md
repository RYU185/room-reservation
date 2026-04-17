---
name: Security Review 2026-04 Findings
description: Follow-up audit 2026-04-18. 2 CRITICAL (default secrets, Redis deserialization), 4 HIGH (rate limit, CSRF, Swagger, missing headers). Prior LIKE-injection and hardcoded-literal creds fixed.
type: project
---

Follow-up audit 2026-04-18.

Fixed since 2026-03 baseline:
- DataInitializer admin creds now env-backed (still risky fallback, see C-1)
- OAuthCallbackPage strips token from URL via replaceState (L-2 remains residual)
- RoomService LIKE wildcard escaping added

Remaining CRITICAL:
- C-1 application.properties ships working defaults (jwt.secret, ADMIN_PASSWORD=admin1234!, DB_PASSWORD=postgres). Any prod deploy that forgets an env var silently boots compromised.
- C-2 CacheConfig.java uses LaissezFaireSubTypeValidator + activateDefaultTyping -- classic Jackson deserialization RCE pattern if attacker writes to Redis.

Remaining HIGH:
- H-1 zero rate limiting on any endpoint, especially /auth/login
- H-2 CSRF disabled but cookie refresh token + withCredentials=true; SameSite inconsistent (Strict on login, Lax on OAuth handler)
- H-3 Swagger UI default-on via SWAGGER_ENABLED (should be default-off)
- H-4 missing HSTS, CSP, Permissions-Policy headers

**Why:** Track remediation between audits. The January-era CRITICALs (hardcoded literal admin creds, OAuth URL token fully unprotected) are remediated -- but default-value CRITICALs replaced them.
**How to apply:** When reviewing deployment readiness, verify C-1 env vars have no fallbacks before green-lighting. If touching CacheConfig, do not re-introduce LaissezFaireSubTypeValidator. When adding new endpoints, inherit the rate-limit gap (H-1) -- auth endpoints must get a limiter before production.
