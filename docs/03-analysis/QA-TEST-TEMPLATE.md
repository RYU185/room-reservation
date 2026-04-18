# QA Test Results - [Feature Name] - Cycle [N]

## Summary

- **Date**: YYYY-MM-DD HH:MM UTC
- **Tester**: [Name]
- **Feature**: [Feature Name]
- **Total Tests**: [X]
- **Pass Rate**: [X]%

## Test Execution

| # | Test Case | Endpoint | Status | Duration | Request ID | Notes |
|---|-----------|----------|--------|----------|------------|-------|
| 1 | Register new user | POST /api/v1/auth/register | ✅/❌ | XXms | req_xxx | |
| 2 | Login user | POST /api/v1/auth/login | ✅/❌ | XXms | req_xxx | |
| 3 | ... | ... | ✅/❌ | XXms | req_xxx | |

## Passing Tests (✅)

```
Total: X
Average response time: XXXms
Status codes: 200 (X), 201 (X)
```

## Failing Tests (❌)

### FAIL-001: [Test Name]

- **Endpoint**: POST /api/v1/auth/register
- **Status Code**: 400/500
- **Duration**: XXms
- **Request ID**: req_abc123

#### Error Signature

```json
{
  "timestamp": "2026-04-18T12:30:45.000Z",
  "level": "ERROR",
  "service": "room-reservation",
  "request_id": "req_abc123",
  "message": "Registration failed",
  "error": "java.lang.NullPointerException"
}
```

#### Full Log Trace

```
→ POST /api/v1/auth/register
  [intermediate logs...]
← POST /api/v1/auth/register 500 (45ms)
```

#### Expected vs Actual

**Expected**:
```json
{
  "success": true,
  "code": "CREATED",
  "data": { "user_id": "123", "email": "user@example.com" }
}
```

**Actual**:
```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

## Issues Found

### ISSUE-001: Email validation missing on registration

**Severity**: 🟡 Warning  
**Category**: Validation  
**Request ID**: req_abc123  
**Endpoint**: POST /api/v1/auth/register  

#### Problem Description

When registering with an invalid email format, the API returns 200 OK instead of 400 Bad Request. The email field should be validated against a valid email pattern.

#### Reproduction Steps

1. Send POST request to `/api/v1/auth/register`
2. Include invalid email: `"email": "not-an-email"`
3. Send request
4. **Expected**: 400 Bad Request
5. **Actual**: 200 OK with user created

#### Root Cause Analysis

The User entity's email field is missing the `@Email` annotation validation constraint:

```java
// Current (WRONG)
@Column(unique = true)
private String email;

// Should be
@Column(unique = true)
@Email(message = "Invalid email format")
private String email;
```

#### Recommended Fix

Add email validation annotation:

```diff
@Entity
@Table(name = "users")
public class User {
    
    @Column(unique = true)
+   @Email(message = "Invalid email format")
    private String email;
    
    // ... rest of fields
}
```

**File**: `src/main/java/com/ryu/room_reservation/user/entity/User.java`  
**Line**: XX  

#### Testing the Fix

After applying fix:
1. Rebuild: `./gradlew clean build`
2. Restart: `docker compose restart api`
3. Re-run failing test
4. Verify: 400 Bad Request with error message

### ISSUE-002: [Title]

**Severity**: 🔴 Critical / 🟡 Warning / 🟢 Info  
**Category**: [Category]  
**Request ID**: req_xxx  
**Endpoint**: [HTTP METHOD] [Path]  

#### Problem Description

[Describe what's wrong]

#### Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

#### Root Cause Analysis

[Why is this happening?]

#### Recommended Fix

[How to fix it?]

#### Testing the Fix

[How to verify the fix works]

## Performance Analysis

| Metric | Value | Status |
|--------|-------|--------|
| Average Response Time | XXXms | 🟢/🟡/🔴 |
| P95 Response Time | XXXms | 🟢/🟡/🔴 |
| P99 Response Time | XXXms | 🟢/🟡/🔴 |
| Error Rate | X% | 🟢/🟡/🔴 |

### Slow Request Analysis

Requests taking > 1000ms:

| Endpoint | Duration | Count | Issue |
|----------|----------|-------|-------|
| GET /api/v1/rooms | 1250ms | 3 | N+1 query issue |
| POST /api/v1/bookings | 1100ms | 2 | Cache miss |

## Action Items

- [ ] **ISSUE-001**: Add @Email validation
  - Assignee: [Name]
  - Priority: Medium
  - Est. Time: 30 minutes

- [ ] **ISSUE-002**: [Description]
  - Assignee: [Name]
  - Priority: [High/Medium/Low]
  - Est. Time: [Time]

## Recommendations for Next Cycle

- [ ] Test error handling with invalid inputs
- [ ] Test concurrent requests
- [ ] Test with large data sets
- [ ] Test OAuth2 login flow
- [ ] Performance testing under load

## Notes

- [Any additional observations]
- [Environment notes]
- [Test environment setup issues]

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA | [Name] | YYYY-MM-DD | |
| Developer | [Name] | YYYY-MM-DD | |

---

## Log Analysis Tools

### View All Errors in Session

```bash
docker compose logs api | grep '"level":"ERROR"' | jq '.'
```

### Find Request by ID

```bash
REQ_ID="req_abc123"
docker compose logs api | grep "$REQ_ID" | jq '.'
```

### Count Requests by Endpoint

```bash
docker compose logs api | jq -r '.data.path' | sort | uniq -c | sort -rn
```

### Show Slow Requests

```bash
docker compose logs api | jq 'select(.data.duration_ms > 1000)' | \
    jq -r '[.data.path, .data.duration_ms] | @csv'
```

### Export logs to file

```bash
docker compose logs api > qa-logs-$(date +%Y%m%d-%H%M%S).json
```
