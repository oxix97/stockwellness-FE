# Implementation Plan: GitHub Actions 배포 자동화 및 n8n 연동 설정

## Phase 1: 기반 설정 및 시크릿 구성
- [x] Task: GitHub Actions Secrets 설정 안내 및 확인
    - [x] `N8N_WEBHOOK_URL` 시크릿 등록 필요성 확인
- [x] Task: 워크플로우 파일 생성 (.github/workflows/cd.yml) [6a57b76]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 기반 설정 및 시크릿 구성' (Protocol in workflow.md)

## Phase 2: 배포 워크플로우 구현 (n8n 연동)
- [ ] Task: n8n 서버 웹훅 전송 로직 구현 (Curl 기반)
    - [ ] `main` 브랜치 푸시 트리거 정의
    - [ ] 태그 생성(`v*`) 트리거 정의
- [ ] Task: 배포 페이로드 데이터 스키마 정의
    - [ ] `repository`, `branch`, `sha`, `tag`, `timestamp` 포함
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 배포 워크플로우 구현 (n8n 연동)' (Protocol in workflow.md)

## Phase 3: 최종 검증 및 테스트
- [ ] Task: 워크플로우 실행 테스트 및 n8n 수신 확인
- [ ] Task: 최종 문서화 및 트랙 완료 처리
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 최종 검증 및 테스트' (Protocol in workflow.md)
