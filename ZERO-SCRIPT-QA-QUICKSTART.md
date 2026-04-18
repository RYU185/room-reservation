# Zero Script QA - Quick Start Guide

Get started with automated API validation in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Port 8080 available
- Gradle (optional, Docker handles build)

## Quick Start (5 minutes)

### Step 1: Start the Environment (1 minute)

```bash
docker compose up -d
```

This starts:
- PostgreSQL database
- Redis cache  
- Spring Boot API with JSON logging

Wait for health checks:
```bash
docker compose ps
# All services should show: healthy
```

### Step 2: Monitor Logs (Immediately)

Open a new terminal and watch logs in real-time:

```bash
docker compose logs -f api
```

You should see JSON logs like:
```json
{"timestamp":"2026-04-18T12:30:45.000Z","level":"INFO","service":"room-reservation","request_id":"req_abc123","message":"→ POST /api/v1/auth/register"}
```

### Step 3: Test Your API (Any time)

In a third terminal, test an endpoint:

```bash
# Register a new user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Step 4: Watch Claude Analyze (Terminal 2)

In the log monitoring terminal (Step 2), you'll see logs appear in real-time. Claude Code can:

- Detect errors immediately (ERROR level logs)
- Flag slow responses (> 1000ms)
- Trace complete request flow with Request ID
- Suggest fixes

## Key Patterns

### Monitor Errors Only

```bash
docker compose logs -f api | grep '"level":"ERROR"'
```

### Track Specific Request

When you see a request ID like `req_abc123`:

```bash
docker compose logs api | grep 'req_abc123' | jq '.'
```

### Show Statistics

```bash
./scripts/qa-monitor.sh stats
```

## Example Flow

**What you do:**
```
1. Run: docker compose up -d
2. Run: docker compose logs -f api
3. Run: curl http://localhost:8080/api/v1/auth/register
4. Watch logs in terminal from step 2
```

**What Claude sees:**
```json
→ POST /api/v1/auth/register
  status: 201
  duration_ms: 45
  request_id: req_abc123
← POST /api/v1/auth/register 201 (45ms)
```

**What Claude reports:**
```
✅ Registration endpoint working
✅ Response time acceptable (45ms < 1000ms)
✅ Correct status code (201 Created)
```

## Monitoring Commands

| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Start environment |
| `docker compose logs -f api` | Watch logs live |
| `docker compose ps` | Check service health |
| `./scripts/qa-monitor.sh stats` | Show session stats |
| `docker compose down` | Stop services |

## Common Tests

### Authentication Flow
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'
```

### Check Your Token
```bash
# Get token from login response, then:
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What the Logs Tell You

### Successful Request
```json
{
  "level": "INFO",
  "message": "← POST /api/v1/auth/login 200",
  "request_id": "req_abc123",
  "data": {
    "status": 200,
    "duration_ms": 45
  }
}
```

Status codes:
- **2xx**: Success
- **4xx**: Client error (bad request, auth fail)
- **5xx**: Server error (bug in API)

### Error Request
```json
{
  "level": "ERROR",
  "message": "Registration failed",
  "request_id": "req_abc123",
  "error": "java.lang.NullPointerException"
}
```

### Slow Request
```json
{
  "data": {
    "duration_ms": 2500
  }
}
```

Duration > 1000ms should be investigated.

## Next Steps

1. **Test all major endpoints** - See which ones work/fail
2. **Document failures** - Use the issue template
3. **Fix and re-test** - Iterate until 85%+ pass rate
4. **Full guide** - Read `docs/03-analysis/ZERO-SCRIPT-QA-GUIDE.md`

## Cleanup

Stop services when done:

```bash
docker compose down

# Reset database (start fresh next time)
docker compose down -v
```

## Troubleshooting

**Q: Logs not appearing**
```bash
# Verify API container is running
docker compose ps api

# Check if it's healthy
docker compose logs api | tail -20
```

**Q: API won't start**
```bash
# Check logs
docker compose logs api

# Common issue: Port 8080 in use
lsof -i :8080
```

**Q: Database connection error**
```bash
# Verify postgres health
docker compose ps postgres

# Check connection
docker compose exec postgres psql -U postgres -d room_reservation -c "SELECT 1"
```

## Files You'll Need

- **Guide**: `docs/03-analysis/ZERO-SCRIPT-QA-GUIDE.md` (detailed)
- **Template**: `docs/03-analysis/QA-TEST-TEMPLATE.md` (for documenting findings)
- **Script**: `scripts/qa-monitor.sh` (helper commands)

---

**Ready to start?** Run `docker compose up -d` and begin testing!
