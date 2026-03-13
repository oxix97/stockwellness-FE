# 저장소 관리 전략 설계 사양서 (2026-03-13)

## 1. 개요
본 문서는 `stockwellness-front` 프로젝트의 효율적인 소스 코드 관리와 작업 이력 추적을 위한 저장소 관리 전략을 정의합니다. 개인 프로젝트임에도 불구하고 "체계적이고 균형 잡힌" 워크플로우를 유지하여 향후 확장성과 유지보수성을 확보하는 것을 목표로 합니다.

## 2. 브랜치 전략 (Branching Strategy)
운영 환경과 개발 환경을 명확히 분리하기 위해 **GitFlow-lite** 방식을 채택합니다.

### 2.1 주요 브랜치 (Long-lived Branches)
- `main`: 실제 서비스에 배포되는 가장 안정적인 코드. `CD` 워크플로우를 통해 운영 환경으로 자동 배포됩니다.
- `develop`: 다음 배포를 위한 통합 개발 브랜치. 모든 새로운 기능과 버그 수정이 통합되며, `CI` 워크플로우를 통해 빌드 성공 여부를 검증합니다.

### 2.2 보조 브랜치 (Supporting Branches / Feature Branches)
모든 작업은 `develop` 브랜치에서 분기한 보조 브랜치에서 진행합니다.

#### 2.2.1 네이밍 규칙
브랜치 이름은 `{Type}/{#이슈번호}-{간략한설명}` 형식을 따릅니다.
- `feat/`: 새로운 기능 개발 (예: `feat/#1-login-ui`)
- `fix/`: 버그 수정 (예: `fix/#2-header-rendering`)
- `refactor/`: 코드 리팩토링 (예: `refactor/#3-api-client`)
- `docs/`: 문서 수정 (예: `docs/#4-update-readme`)
- `perf/`: 성능 개선 (예: `perf/#5-image-lazy-loading`)
- `chore/`: 빌드 설정, 의존성 관리 등 (예: `chore/#6-update-yarn-lock`)

## 3. 이슈 관리 (Issue Management)
명확한 작업 기록과 추적을 위해 이슈를 상세히 관리합니다.

### 3.1 이슈 템플릿 (6종)
다음 6가지 유형의 이슈 템플릿을 구현합니다:
1. **버그 리포트 (Bug Report)**: 발생 현상, 재현 단계, 예상 동작, 환경 정보 및 스크린샷.
2. **기능 제안 (Feature Request)**: 기능 개요, 필요성, 주요 작업 체크리스트.
3. **단순 작업 (Chore)**: 유지보수 작업에 대한 설명.
4. **리팩토링 (Refactor)**: 현재 코드의 문제점, 개선 제안 및 기대 효과.
- **문서화 (Documentation)**: 업데이트가 필요한 파일 및 섹션 목록.
- **성능 개선 (Performance)**: 성능 병목 지점 및 최적화 방안.

### 3.2 레이블 (Labels)
- **우선순위**: `priority:high`, `priority:medium`, `priority:low`
- **진행 상태**: `status:todo`, `status:in-progress`, `status:blocked`
- **작업 영역**: `area:frontend`, `area:api`, `area:ui-ux`
- **작업 유형**: `type:bug`, `type:feat`, `type:chore`, `type:refactor`, `type:docs`, `type:perf`

## 4. PR (Pull Request) 및 머지 전략
모든 변경 사항은 기록 보존을 위해 PR을 통해 `develop`에 반영합니다.

### 4.1 PR 템플릿
다음 내용을 포함합니다:
- **개요 (Overview)**: 변경 사항 요약.
- **관련 이슈 (Related Issue)**: 해결한 이슈 번호 (예: `Closes #123`).
- **자가 체크리스트 (Self Check)**:
  - [ ] 빌드 성공 (`yarn build`).
  - [ ] 린트 체크 통과.
  - [ ] 브라우저에서 직접 기능 확인.
  - [ ] 기존 기능에 영향 없음 확인.

### 4.2 머지 스타일: 머지 커밋 생성 (Create a Merge Commit)
- 모든 작업 커밋 내역을 보존하기 위해 **Merge Commit** 방식을 사용합니다.
- PR 제목은 **Conventional Commits** 스타일을 권장합니다: `feat: #1-login 구현`, `fix: #2-header-bug 수정`.

## 5. CI/CD 통합
- **CI**: `develop`으로 향하는 모든 PR에서 실행 (빌드 및 테스트 검증).
- **CD**: `main` 브랜치에 푸시/머지될 때 실행 (운영 서버 배포).

## 6. 성공 기준
- 모든 작업이 이슈와 연결되어 있음.
- 모든 코드 변경이 PR을 통해 이루어짐.
- `develop`과 `main` 브랜치에 명확한 커밋 히스토리가 유지됨.
- 자동화된 CI/CD 파이프라인이 성공 상태(Green)를 유지함.
