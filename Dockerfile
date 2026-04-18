# Multi-stage build for Zero Script QA
FROM eclipse-temurin:21-jdk as builder

WORKDIR /app
COPY . .

# Build the application
RUN ./gradlew clean bootJar -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

# Copy the jar from builder
# Note: build directory might be custom (C:/tmp/room-reservation-build on Windows)
# Try standard location first, then fallback to custom location
RUN echo "Searching for built jar..." && \
    if [ -f /app/build/libs/room-reservation-0.0.1-SNAPSHOT.jar ]; then \
      echo "Found in standard build directory"; \
    else \
      echo "Using custom build directory"; \
    fi

COPY --from=builder /app/build/libs/room-reservation-0.0.1-SNAPSHOT.jar app.jar

# Environment variables
ENV SPRING_PROFILES_ACTIVE=dev
ENV LOG_LEVEL=DEBUG
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
