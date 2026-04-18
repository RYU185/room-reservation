#!/bin/bash

# Zero Script QA Monitoring Script
# Usage: ./scripts/qa-monitor.sh [errors|slow|all|trace <request_id>]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if docker is running
check_docker() {
    if ! docker compose ps > /dev/null 2>&1; then
        print_error "Docker containers not running. Start with: docker compose up -d"
        exit 1
    fi
}

# Start environment
start_environment() {
    print_header "Starting Zero Script QA Environment"
    docker compose up -d

    echo "Waiting for services to be healthy..."
    sleep 5

    docker compose ps
    print_success "Environment started"
}

# Monitor errors
monitor_errors() {
    print_header "Monitoring Errors (Level: ERROR)"
    echo -e "${YELLOW}Ctrl+C to stop monitoring${NC}\n"
    docker compose logs -f api | grep '"level":"ERROR"'
}

# Monitor slow requests
monitor_slow() {
    print_header "Monitoring Slow Requests (> 1000ms)"
    echo -e "${YELLOW}Ctrl+C to stop monitoring${NC}\n"
    docker compose logs -f api | grep -oP '"duration_ms":\K[0-9]+' | \
        awk '{ if ($1 > 1000) print "⏱️  SLOW: " $1 "ms" }'
}

# Monitor all requests
monitor_all() {
    print_header "Monitoring All Requests"
    echo -e "${YELLOW}Ctrl+C to stop monitoring${NC}\n"
    docker compose logs -f api
}

# Trace specific request ID
trace_request() {
    local req_id=$1
    if [ -z "$req_id" ]; then
        print_error "Request ID not provided"
        exit 1
    fi

    print_header "Tracing Request: $req_id"
    docker compose logs api | grep "$req_id" | jq '.' 2>/dev/null || \
        docker compose logs api | grep "$req_id"
}

# Show statistics
show_stats() {
    print_header "QA Session Statistics"

    local total_requests=$(docker compose logs api | grep '→' | wc -l)
    local successful=$(docker compose logs api | grep '← .*\s[2][0-9][0-9]\s' | wc -l)
    local errors=$(docker compose logs api | grep '← .*\s[4-5][0-9][0-9]\s' | wc -l)
    local error_level=$(docker compose logs api | grep '"level":"ERROR"' | wc -l)

    echo -e "Total Requests: ${BLUE}$total_requests${NC}"
    echo -e "Successful (2xx): ${GREEN}$successful${NC}"
    echo -e "Errors (4xx/5xx): ${RED}$errors${NC}"
    echo -e "Error Level Logs: ${RED}$error_level${NC}"

    if [ $total_requests -gt 0 ]; then
        local success_rate=$((successful * 100 / total_requests))
        if [ $success_rate -ge 95 ]; then
            print_success "Success rate: $success_rate%"
        elif [ $success_rate -ge 85 ]; then
            print_warning "Success rate: $success_rate%"
        else
            print_error "Success rate: $success_rate%"
        fi
    fi
}

# Show help
show_help() {
    cat <<EOF
Zero Script QA Monitoring Script

USAGE: ./scripts/qa-monitor.sh [COMMAND] [OPTIONS]

COMMANDS:
  start       Start Docker environment
  errors      Monitor ERROR level logs in real-time
  slow        Monitor slow requests (> 1000ms) in real-time
  all         Monitor all logs in real-time
  stats       Show session statistics
  trace       Trace specific request (requires request_id)
  help        Show this help message

EXAMPLES:
  # Start environment
  ./scripts/qa-monitor.sh start

  # Monitor errors while testing
  ./scripts/qa-monitor.sh errors

  # Trace a specific request
  ./scripts/qa-monitor.sh trace req_a1b2c3d4

  # Show statistics after testing
  ./scripts/qa-monitor.sh stats

EOF
}

# Main script
check_docker

case "${1:-help}" in
    start)
        start_environment
        ;;
    errors)
        monitor_errors
        ;;
    slow)
        monitor_slow
        ;;
    all)
        monitor_all
        ;;
    stats)
        show_stats
        ;;
    trace)
        trace_request "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
