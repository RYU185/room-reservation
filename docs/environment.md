# 개발환경 버전정보

> 최종 업데이트: 2026-03-12

## 런타임 환경

| 항목 | 버전 | 비고 |
|------|------|------|
| Java (설치된 JDK) | 25.0.2 LTS | Java HotSpot 64-Bit Server VM |
| Java (빌드 타겟) | 21 | `build.gradle` toolchain 설정 |
| Node.js | v24.14.0 | React 프론트엔드 개발 환경 |
| npm | 11.7.0 | React 패키지 관리 |

## 빌드 도구

| 항목 | 버전 |
|------|------|
| Gradle Wrapper | 9.3.1 |

## 프레임워크 / 플랫폼

| 항목 | 버전 |
|------|------|
| Spring Boot | 4.0.3 |
| Spring Dependency Management | 1.1.7 |

## 주요 의존성 라이브러리

### Spring Boot Starters

| 라이브러리 | 버전 |
|-----------|------|
| spring-boot-starter-actuator | BOM (Spring Boot 4.0.3) |
| spring-boot-starter-data-jpa | BOM |
| spring-boot-starter-security | BOM |
| spring-boot-starter-security-oauth2-client | BOM |
| spring-boot-starter-validation | BOM |
| spring-boot-starter-webmvc | BOM |
| spring-boot-devtools | BOM |

### 서드파티 라이브러리

| 라이브러리 | 버전 |
|-----------|------|
| springdoc-openapi-starter-webmvc-ui | 3.0.2 |
| flyway-core | BOM |
| flyway-database-postgresql | BOM |
| jjwt-api | 0.12.6 |
| jjwt-impl | 0.12.6 |
| jjwt-jackson | 0.12.6 |
| lombok | BOM |

### 데이터베이스 드라이버

| 라이브러리 | 버전 |
|-----------|------|
| postgresql | BOM |

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| Group | com.ryu |
| Artifact | room-reservation |
| Version | 0.0.1-SNAPSHOT |
| Description | Room Reservation System |
| Gradle Root Project | room-reservation |