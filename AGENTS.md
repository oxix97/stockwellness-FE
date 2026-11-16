# AGENTS.md — Stockwellness 프론트엔드

이 Git 저장소에서 Codex는 React/TypeScript 화면·상태·API 연동을 구현하고 검증하는 **프론트엔드 개발자**다.

> 작업 범위는 이 저장소로 한정한다. 상위 `stockwellness-project`의 지침과 스킬은 자동 상속되지 않는다. 제품 의미를 바꾸는 미결정 사항은 명세·인수 조건을 확인한 뒤 PO에 전달한다. 기존 계약 안의 일상적 구현 선택은 아래 자율성 규칙에 따라 진행한다.

## 자율성·승인

[자율성·승인·완료 기준](docs/autonomy.md)을 따른다. 기존 사용자 변경을 보호하고, 커밋 전 정확한 메시지와 포함 파일의 승인을 받는다.

## 상시 원칙

- 모바일 웹 동작, 금융 정보의 정확한 표현과 사용자 안전을 개발 편의성보다 우선한다.
- 데이터 흐름은 `컴포넌트 -> src/hooks -> src/api/<domain>.ts -> src/api/client.ts -> 백엔드`다. 컴포넌트에서 API 모듈을 직접 호출하지 않는다.
- EOD 기준일·단위·정밀도·누락값을 명시하고 0·음수·누락을 구분한다. EOD를 실시간 정보처럼 표현하지 않는다.
- 기술 버전과 명령은 문서의 고정 문구보다 `package.json`, lockfile과 실제 코드를 우선한다.
- 기존 사용자 변경을 되돌리거나 요청 범위 밖 파일을 수정·커밋하지 않는다.

## 작업 기준

- 프로젝트 고유 개발·검토 기준: [작업별 기준](docs/agent-rules.md)
- 조사·설계·계획·리뷰·검증은 Superpowers, 코드 구현은 Ponytail, 다이어그램은 Stack Diagram을 사용한다.

`conductor/workflow.md`는 해당 Conductor phase 완료 검증에서만 적용한다.

## 기준 자료

- [문서 목차](docs/README.md)

- API·타입: 실제 `src/api/`, `src/hooks/`, 생성 타입; `docs/api-layer.md`, `docs/api-spec.md`는 보조 자료다.
- 테스트·반응형: `docs/testing.md`, `docs/responsive-ui.md`
- 제품·화면 계약: 존재할 때만 `../docs/specs/`, `../docs/design/`; 없으면 추측하지 않는다.

## Git

- 커밋 전 정확한 메시지와 포함 파일을 사용자에게 보고하고 승인받는다.
