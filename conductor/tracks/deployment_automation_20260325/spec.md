# Specification: GitHub Actions 배포 자동화 및 n8n 연동 설정

## 1. 개요 (Overview)
`develop -> main` 브랜치 병합(Pull Request Merge) 및 특정 버전 태그(GitHub Tag) 생성 시, GitHub Actions를 통해 n8n 서버에 배포 페이로드를 전송하여 자동 배포 프로세스를 트리거합니다.

## 2. 사용자 스토리 (User Stories)
- 개발자로서, `main` 브랜치에 코드를 병합할 때 수동 작업 없이 서버에 최신 코드가 반영되길 원합니다.
- 관리자로서, 특정 릴리스 태그를 생성했을 때 안정적인 버전이 n8n 배포 파이프라인을 통해 즉시 배포되길 원합니다.

## 3. 기능 요구사항 (Functional Requirements)
- **CI/CD 워크플로우 구성:** `.github/workflows/cd.yml` 파일을 작성하여 배포 자동화를 정의합니다.
- **n8n 웹훅 연동:** 배포 성공 또는 트리거 시 n8n 서버의 웹훅 URL로 배포 관련 정보(브랜치명, 커밋 SHA, 태그명 등)를 JSON 형태로 전송합니다.
- **트리거 조건:**
  - `main` 브랜치로의 `push` (PR merge 포함).
  - `v*` 형태의 태그 생성 시.
- **보안:** n8n 웹훅 URL 및 관련 시크릿 정보는 GitHub Actions Secrets를 통해 안전하게 관리합니다.

## 4. 비기능 요구사항 (Non-Functional Requirements)
- **성능:** 배포 트리거 알림 전송은 10초 이내에 완료되어야 합니다.
- **안정성:** 네트워크 오류 등으로 인한 전송 실패 시 재시도 로직을 고려합니다.

## 5. 수락 기준 (Acceptance Criteria)
- `main` 브랜치에 코드를 푸시하면 GitHub Action이 정상적으로 실행되고 n8n으로 웹훅이 전송됨을 확인합니다.
- 신규 태그(`v1.0.0` 등)를 생성하면 태그 배포 워크플로우가 실행됨을 확인합니다.
- n8n 서버에서 수신한 페이로드에 올바른 메타데이터가 포함되어 있는지 확인합니다.
