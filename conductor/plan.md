# Implementation Plan: BE 배포 후 FE 연동 작업 (이슈 #139)

백엔드 배포 후 프론트엔드 연동을 위한 타입 갱신 및 전체 검증 작업을 진행합니다. 특히 이슈 #137 (schema.d.ts 재생성)을 중점적으로 처리합니다.

## Objective
- 로컬 백엔드 서버의 최신 OpenAPI 스펙을 반영하여 `src/types/schema.d.ts` 갱신
- 갱신된 타입에 따른 코드 정합성 검토 및 빌드 통과 확인
- `post-deployment.md` 체크리스트 기반 최종 QA 수행

## Key Files & Context
- `src/types/schema.d.ts`: API 스키마 정의 파일 (재생성 대상)
- `package.json`: `sync-api` 스크립트 정의
- `post-deployment.md`: 상세 작업 명세 및 체크리스트

## Implementation Steps

### Phase 1: API 스키마 동기화 및 타입 검증
1. [ ] `npm run sync-api` 실행하여 `schema.d.ts` 갱신
2. [ ] `src/types/schema.d.ts` 변경 사항 확인
   - `benchmarkReturnRate` 타입이 `number | null`로 변경되었는지 확인
   - `StockSearchResponse.hasNext` 필드가 포함되었는지 확인
3. [ ] `npm run build` 실행하여 TypeScript 컴파일 오류 여부 확인

### Phase 2: 최종 기능 검증 (QA)
1. [ ] 검색 페이지 무한 스크롤 및 `hasNext` 기반 페이징 검증
2. [ ] 백테스트 결과 화면에서 벤치마크 수익률 `null` (데이터 없음)과 `0` (실제 0%) 구분 표시 검증
3. [ ] 종목 상세 화면에서 KOSPI 비교선 및 수익률 카드 표시 검증
4. [ ] 403 응답(타인 포트폴리오 접근) 시 토스트 메시지 출력 및 무한 루프 방지 확인

## Verification & Testing
- `npm run build`: 전체 빌드 성공 여부 확인
- `npm test`: 기존 단위 테스트 통과 여부 확인
- `npm run test:e2e`: 주요 시나리오에 대한 E2E 테스트 수행
