# Room Reservation System - 프로젝트 로드맵

> 작성일: 2026-03-12
> 프로젝트: room-reservation (com.ryu)

## 개발 진행 순서

```
[1. 요구사항 분석] → [2. 시스템 설계] → [3. 기능정의 및 상세설계] → [4. 프로젝트 계획 수립] → [5. 개발] → [6. 배포]
```

---

## Phase 1. 요구사항 분석

**목표**: 시스템이 해결해야 할 문제와 사용자 요구사항을 명확히 정의

- [ ] 이해관계자 식별 (사용자, 관리자, 운영자)
- [ ] 기능 요구사항 목록 작성
- [ ] 비기능 요구사항 정의 (성능, 보안, 가용성)
- [ ] 제약사항 및 가정 정리
- [ ] 우선순위 결정 (MoSCoW 또는 유사 방법)

**산출물**: `docs/01-plan/features/requirements.plan.md`

---

## Phase 2. 시스템 설계

**목표**: 전체 시스템 아키텍처와 기술 스택 결정

- [ ] 시스템 아키텍처 다이어그램 (레이어드 아키텍처 등)
- [ ] 기술 스택 확정 (Spring Boot 4.0.3, PostgreSQL, JWT 등)
- [ ] 인프라 구성 계획 (로컬/개발/운영 환경)
- [ ] 보안 설계 (OAuth2, JWT, RBAC)
- [ ] 외부 시스템 연동 계획

**산출물**: `docs/02-design/features/system-architecture.design.md`

---

## Phase 3. 기능정의 및 상세설계

**목표**: 각 기능별 상세 명세 및 API 설계

- [ ] 도메인 모델 설계 (엔티티, 관계)
- [ ] DB 스키마 설계
- [ ] API 엔드포인트 정의 (REST)
- [ ] 화면 흐름 및 UI 설계
- [ ] 예외 처리 전략

**산출물**:
- `docs/02-design/features/domain-model.design.md`
- `docs/02-design/features/api-spec.design.md`

---

## Phase 4. 프로젝트 계획 수립

**목표**: 개발 일정 및 마일스톤 수립

- [ ] 기능별 개발 우선순위 및 스프린트 계획
- [ ] 마일스톤 정의
- [ ] 리스크 관리 계획
- [ ] 테스트 전략

**산출물**: `docs/01-plan/features/sprint-plan.plan.md`

---

## Phase 5. 개발

**목표**: 설계 기반 기능 구현

- [ ] 도메인 엔티티 구현
- [ ] 레포지토리 레이어 구현
- [ ] 서비스 레이어 구현
- [ ] API 컨트롤러 구현
- [ ] 인증/인가 구현 (JWT + OAuth2)
- [ ] Flyway 마이그레이션 스크립트 작성
- [ ] 단위/통합 테스트 작성

---

## Phase 6. 배포

**목표**: 운영 환경 배포 및 모니터링 구성

- [ ] CI/CD 파이프라인 구성
- [ ] Docker 이미지 빌드
- [ ] 배포 환경 설정 (application-prod.yml)
- [ ] Actuator 헬스체크 및 모니터링 설정
- [ ] 운영 매뉴얼 작성

---

## PDCA 매핑

| 개발 단계 | PDCA Phase | 명령어 예시 |
|-----------|------------|------------|
| 요구사항 분석 | Plan | `/pdca plan requirements` |
| 시스템 설계 | Plan → Design | `/pdca design system-architecture` |
| 기능정의 및 상세설계 | Design | `/pdca design api-spec` |
| 프로젝트 계획 수립 | Plan | `/pdca plan sprint-plan` |
| 개발 | Do | `/pdca do {feature}` |
| 검증 | Check | `/pdca analyze {feature}` |
| 배포 | Report → Archive | `/pdca report {feature}` |

---

## 현재 상태

> Phase 1 (요구사항 분석) 준비 단계
> 다음 액션: `/pdca plan requirements` 실행
