---
name: Security Review 2026-03 Findings
description: First comprehensive security audit results -- 2 CRITICAL, 4 HIGH, 5 MEDIUM, 4 LOW issues found across Spring Boot backend and React frontend
type: project
---

Full security audit completed 2026-03-23. Report at docs/02-design/security-spec.md.

Key CRITICAL findings:
1. Hardcoded admin credentials in DataInitializer (admin@example.com / admin1234!, logged to INFO)
2. OAuth2 access token exposed in URL query parameter, OAuthCallbackPage is a non-functional stub

Key HIGH findings:
1. CSRF disabled but refresh token is cookie-based; inconsistent SameSite (Strict vs Lax)
2. LIKE query wildcard injection in RoomService.buildRoomSpec
3. No rate limiting on auth endpoints
4. Swagger UI publicly accessible in all profiles

**Why:** First formal security assessment of the codebase ahead of potential deployment.
**How to apply:** Use this as baseline for tracking remediation progress. C-1 and C-2 must be fixed before any non-local deployment.
