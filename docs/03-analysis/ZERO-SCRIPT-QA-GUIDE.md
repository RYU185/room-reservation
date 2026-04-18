# Zero Script QA Guide - room-reservation

## Overview

Zero Script QA enables real-time API validation through structured JSON logging and Docker-based monitoring without writing test scripts.

**Workflow**: Start containers → Manual UX testing → Monitor logs in real-time → Claude analyzes and reports issues

---

## Architecture

### Components

```
Client (Browser)
    ↓
API (Port 8080)
    ↓
RequestIdFilter (adds X-Request-ID header)
    ↓
JSON Logger (logback + logstash encoder)
    ↓
Docker Console Logs
    ↓
Claude Code (real-time monitoring)
    ↓
Issue Report
```

### Request ID Propagation

```json
{
  "timestamp": "2026-04-18T12:30:45.000Z",
  "level": "INFO",
  "service": "room-reservation",
  "message": "→ POST /api/v1/auth/register",
  "request_id": "req_a1b2c3d4"
}
```

Every log entry includes `request_id` via MDC (Mapped Diagnostic Context), allowing complete flow tracing.

---

## Setup Instructions

### 1. Build the Application

```bash
./gradlew clean build -x test
```

Verifies:
- Zero Script QA infrastructure is compiled correctly
- logstash-logback-encoder dependency is available
- RequestIdFilter is included

### 2. Start Docker Environment

```bash
docker compose up -d
```

Services started:
- **postgres** (Port 5432) - Database
- **redis** (Port 16379) - Cache
- **api** (Port 8080) - Room Reservation API with JSON logging

### 3. Verify Services Health

```bash
docker compose ps
```

Expected output:
```
STATUS: healthy
```

### 4. Start Log Monitoring (In separate terminal)

```bash
# Stream all logs in real-time
docker compose logs -f

# Or filter specific service
docker compose logs -f api

# Or filter errors only
docker compose logs -f | grep '"level":"ERROR"'

# Or track specific request
docker compose logs -f | grep 'req_a1b2c3d4'
```

---

## JSON Log Format

### Standard Format

Every log entry is valid JSON with these fields:

```json
{
  "timestamp": "2026-04-18T12:30:45.000Z",
  "level": "INFO",
  "service": "room-reservation",
  "request_id": "req_a1b2c3d4",
  "message": "API Request completed",
  "logger_name": "com.ryu.room_reservation.global.filter.RequestIdFilter",
  "data": {
    "method": "POST",
    "path": "/api/v1/auth/register",
    "status": 200,
    "duration_ms": 45
  }
}
```

### Log Fields

| Field | Type | Description |
|-------|------|-------------|
| timestamp | ISO 8601 | When the event occurred |
| level | string | DEBUG, INFO, WARNING, ERROR |
| service | string | Application name |
| request_id | string | Unique request identifier |
| message | string | Log message |
| logger_name | string | Which class/component logged this |
| data | object | Additional context (optional) |

---

## Monitoring Patterns

### 1. Error Detection (Immediate Report)

Watch for ERROR level logs:

```bash
docker compose logs -f api | grep '"level":"ERROR"'
```

**When detected:**
1. Extract request_id
2. Collect all logs with that request_id
3. Analyze error cause
4. Document issue
5. Suggest fix

### 2. Slow Response Detection (> 1000ms)

```bash
docker compose logs -f api | jq 'select(.data.duration_ms > 1000)'
```

**When detected:**
- Flag as performance warning
- Analyze bottleneck source
- Suggest optimization

### 3. Status Code Analysis

```bash
# 5xx errors (server errors)
docker compose logs -f api | jq 'select(.data.status >= 500)'

# 4xx errors (client/auth errors)  
docker compose logs -f api | jq 'select(.data.status >= 400 and .data.status < 500)'
```

### 4. Request Flow Tracing

Trace entire flow with one request_id:

```bash
REQ_ID="req_a1b2c3d4"
docker compose logs | grep "$REQ_ID" | jq '.'
```

Expected sequence for login request:
```
1. → POST /api/v1/auth/login (request start)
2. [DB query logs with same request_id]
3. [Cache lookup logs with same request_id]
4. ← POST /api/v1/auth/login 200 (45ms) (request complete)
```

---

## QA Testing Workflow

### Phase 1: Start Environment

```bash
# Terminal 1: Start containers
docker compose up -d

# Wait for health checks to pass
docker compose ps  # Should show "healthy" status
```

### Phase 2: Monitor Logs (Continuous)

```bash
# Terminal 2: Stream logs in real-time
docker compose logs -f api
```

### Phase 3: Manual UX Testing

In your browser or API client, test features:

```bash
# Example: Register new account
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Example: Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Phase 4: Analyze Logs (Real-time)

As you test, Claude Code monitors logs in Terminal 2:

**On Success (200 OK):**
```
✅ Status: 200
✅ Response time: 45ms
✅ Request flow complete
```

**On Error:**
```
🔴 Status: 500
🔴 Error: NullPointerException at UserService.java:123
🔴 Recommendation: Add null check for user email
```

### Phase 5: Document Issues

Issue template:

```markdown
## ISSUE-001: [Brief Title]

**Request ID**: req_a1b2c3d4
**Severity**: Critical | Warning | Info
**Endpoint**: POST /api/v1/auth/login
**Status Code**: 500
**Duration**: 150ms

### Error Log
```json
{
  "level": "ERROR",
  "message": "NullPointerException",
  "error": "Cannot invoke method on null"
}
```

### Root Cause
Password field is not being validated before comparison

### Reproduction Steps
1. Register account
2. Login with missing password
3. Server throws NPE

### Recommended Fix
Add null check in AuthService.login():
```java
if (password == null || password.isBlank()) {
    throw new ValidationException("Password is required");
}
```

### Related Code
- File: `src/main/java/com/ryu/room_reservation/auth/service/AuthService.java:45`
```

---

## Environment Configuration

### Development (QA) Environment

Set in docker-compose.yml or shell:

```bash
SPRING_PROFILES_ACTIVE=dev
LOG_LEVEL=DEBUG
```

Effect:
- DEBUG level logging (all events captured)
- Detailed request/response logs
- Slower but comprehensive monitoring

### Production Environment

```bash
SPRING_PROFILES_ACTIVE=production
LOG_LEVEL=INFO
```

Effect:
- INFO level logging (important events only)
- Minimal performance overhead
- Focus on errors and significant events

---

## Troubleshooting

### API won't start

```bash
# Check logs
docker compose logs api

# Check if port 8080 is in use
lsof -i :8080
```

### Database connection failing

```bash
# Verify postgres is healthy
docker compose ps postgres

# Check database is ready
docker exec room-reservation-db psql -U postgres -d room_reservation -c "SELECT 1"
```

### JSON logs not appearing

```bash
# Verify logback configuration
grep -A 5 "JSON_CONSOLE" src/main/resources/logback-spring.xml

# Check if using correct encoder
grep logstash src/build.gradle
```

### Request ID not in logs

```bash
# Verify RequestIdFilter is registered
grep -r "RequestIdFilter" src/

# Check MDC is working
docker compose logs api | grep request_id | head -3
```

---

## Iterative Test Cycle Pattern

### Cycle Template

**Cycle N - [Feature Name]**

| Status | Test | Result |
|--------|------|--------|
| ✅ | User registration flow | PASS |
| ❌ | Email validation on register | FAIL - Missing validation |
| ⏳ | OAuth2 login | SKIP - Not implemented yet |

**Pass Rate**: 66% (2/3)

### Bug Found in Cycle N

```
Title: Email validation missing on registration
Root Cause: No regex pattern in @Email annotation
Fix: Add validation constraint to User.email field
Status: Fixed and retesting in Cycle N+1
```

### Recommended Next Cycle

- [ ] Email validation on registration
- [ ] Password strength validation
- [ ] Duplicate email prevention
- [ ] Account activation flow

---

## Performance Analysis

### Response Time Guidelines

| Duration | Status | Action |
|----------|--------|--------|
| < 100ms | Excellent | No action |
| 100-500ms | Good | Monitor |
| 500-1000ms | Acceptable | Investigate if critical |
| 1000-3000ms | Slow | Optimize |
| > 3000ms | Critical | Urgent optimization |

### Example Performance Analysis

```
Request: POST /api/v1/rooms/search
Duration: 1250ms (SLOW)

Breakdown from logs:
- Start: 12:30:45.000Z
- DB query start: 12:30:45.050Z
- DB query end: 12:30:45.900Z (850ms - N+1 query issue)
- Cache update: 12:30:46.200Z (300ms)
- Response: 12:30:46.250Z

Recommendation: Add JPA batch fetch size, implement caching strategy
```

---

## Advanced Monitoring

### Filter by Status Code

```bash
# All 4xx errors
docker compose logs -f api | jq 'select(.data.status >= 400 and .data.status < 500)'

# All 5xx errors  
docker compose logs -f api | jq 'select(.data.status >= 500)'
```

### Filter by Duration

```bash
# All requests taking > 1000ms
docker compose logs -f api | jq 'select(.data.duration_ms > 1000)'

# All requests taking < 50ms
docker compose logs -f api | jq 'select(.data.duration_ms < 50)'
```

### Count Requests by Endpoint

```bash
# Current cycle's requests by endpoint
docker compose logs api | jq -r '.data.path' | sort | uniq -c | sort -rn
```

### Error Rate Analysis

```bash
# Total requests in session
docker compose logs api | grep "→" | wc -l

# Failed requests (errors)
docker compose logs api | grep '"level":"ERROR"' | wc -l

# Error rate %
docker compose logs api | grep "→" | wc -l > /tmp/total.txt
docker compose logs api | grep '"level":"ERROR"' | wc -l > /tmp/errors.txt
awk 'NR==1{total=$1; getline; print int(($1/total)*100) "%"}' /tmp/errors.txt /tmp/total.txt
```

---

## Success Criteria

QA cycle is complete when:

- [ ] No ERROR level logs
- [ ] No 5xx status codes
- [ ] 95%+ successful requests
- [ ] Average response time < 500ms
- [ ] All critical flows tested:
  - [ ] User registration
  - [ ] User login
  - [ ] Core feature workflows
  - [ ] Error handling

---

## Cleanup

### Stop Services

```bash
docker compose down
```

### Clean Volumes (Reset Database)

```bash
docker compose down -v
```

### View Logs After Shutdown

```bash
# Logs are saved to Docker container history
# View last 1000 lines
docker compose logs --tail=1000
```

---

## Key Files

- **RequestIdFilter**: `src/main/java/com/ryu/room_reservation/global/filter/RequestIdFilter.java`
- **Logging Config**: `src/main/resources/logback-spring.xml`
- **Docker Setup**: `docker-compose.yml`, `Dockerfile`
- **App Config**: `src/main/resources/application.properties`

---

## Next Steps

1. **Start environment**: `docker compose up -d`
2. **Monitor logs**: `docker compose logs -f api` (in another terminal)
3. **Test manually**: Use browser or curl to test features
4. **Analyze**: Watch logs in real-time for issues
5. **Document**: Record any bugs found
6. **Fix**: Apply recommended fixes
7. **Re-test**: Cycle back to step 3

Good luck with Zero Script QA testing!
