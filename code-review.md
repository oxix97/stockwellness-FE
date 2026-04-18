# Code Review — Home & Portfolio API Alignment & UX Optimization

## 요약
홈 화면 수급 랭킹 API 연동 고도화, 포트폴리오 위젯 데이터 구조 정합성 확보 및 모바일 UX(테마 전환, 바텀 시트) 개선.

## 심각도 기준
- 🔴 BLOCKER: 머지 전 반드시 수정
- 🟡 MAJOR: 강력 권고 수정
- 🟢 MINOR: 선택적 개선

## 리뷰 항목

### 🔴 BLOCKER
- 없음.

### 🟡 MAJOR
- ~~**E2E 테스트 MIME 타입 오류 (auth.e2e.spec.ts)**~~: (해결됨) `service/json`으로 잘못 기입된 MIME 타입을 표준 `application/json`으로 일괄 복구하였습니다.
- **포트폴리오 위젯 데이터 키 변경**: `RebalancingWidget.tsx`에서 `recommendQuantity`를 `recommendedQuantity`로 변경하였습니다. 백엔드 DTO 변경에 따른 적절한 조치이며, 관련 타입 정의 및 컴포넌트 로직이 일관되게 수정된 것을 확인했습니다.

### 🟢 MINOR
- **금융 데이터 단위 표준화**: `StockSupplyRankingSection.tsx`에서 수량(주) 단위를 금액(원/억원) 단위로 변경하고, 수치에 따른 가독성 있는 포맷팅(`toLocaleString`)을 적용하여 기획 요건을 충실히 반영함.
- **모바일 UX 최적화**: `More.tsx`의 테마 설정을 드롭다운에서 바텀 시트로 변경하고, `WatchlistBottomSheet`의 `z-index` 및 하단 여백을 조정한 것은 모바일 웹 환경에서의 사용성을 크게 높이는 좋은 시도임.
- **불필요한 로그 메시지 수정**: `BacktestResult.tsx` 등에서 "config"를 "job"으로 명칭 변경하여 도메인 용어 일관성을 확보함.

## 결론
**APPROVE**
지적된 주요 이슈가 수정되었으며, 모든 단위 테스트가 통과되었습니다.
