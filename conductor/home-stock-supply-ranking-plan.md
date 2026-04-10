# Home Stock Supply Ranking Implementation

## Objective
홈 탭의 기존 섹터 수급 영역을 종목 수급 랭킹 기반 UI로 교체해, 사용자가 홈에서 기관/외국인 순매수 상위 종목을 빠르게 확인할 수 있도록 정리한다.

## Scope
- `GET /v1/stocks/ranking/supply` 연동
- 홈 탭 `기관·외국인 수급 상위` 섹션을 종목 수급 랭킹 UI로 교체
- `effectiveDate` 및 fallback 안내 노출
- 기관/외국인 채널별 독립 empty state 처리

## Key Decisions
- 홈 탭은 빠른 스캔 목적이므로 `direction=BUY`, `limit=10`을 기본값으로 고정한다.
- `SELL`은 이번 범위에서 UI 노출 없이 타입/훅 단계까지만 대응 가능하게 둔다.
- 기존 섹터 수급 설계와 구분하기 위해 홈 문맥에서는 해당 섹션을 종목 수급 랭킹 기준으로 해석한다.

## Verification
- API 함수가 `/v1/stocks/ranking/supply`에 `params` 객체로 요청하는지 확인
- 훅 Query Key가 `date/direction/limit` 조합별로 분리되는지 확인
- 홈 섹션에서 `effectiveDate === null`이면 전체 empty state가 노출되는지 확인
- 한 채널만 비어도 다른 채널은 정상 렌더링되는지 확인
- `requestedDate !== effectiveDate`면 fallback 안내가 보이는지 확인
