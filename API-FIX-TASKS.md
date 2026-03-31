# Frontend API Alignment Tasks

백엔드 REST Controller 전수 조사 결과, 프론트엔드 API 클라이언트에 누락되거나 보강이 필요한 항목들입니다.

## 1. 🔴 신규 생성 및 필수 수정 (High Priority)

### A. `src/api/market.ts` 신규 생성
백엔드 `MarketController`에 대응하는 API 클라이언트가 누락되었습니다.
- [ ] `getMarketIndexes()`: `GET /api/v1/market/indexes` 호출 구현.
- [ ] 시장 지수(KOSPI, KOSDAQ, S&P500) 정보를 반환하도록 구현.

### B. `src/api/stock.ts` 상세 조회 추가
종목 상세 페이지 진입을 위한 핵심 API가 누락되었습니다.
- [ ] `getStockDetail(ticker: string)`: `GET /api/v1/stocks/{ticker}` 호출 구현.
- [ ] `StockDetailResult` 타입 정의 및 연동.

### C. `src/types/api.ts` 타입 보강
Swagger/Schema에서 누락되거나 수동 보강이 필요한 타입들을 정의하세요.
- [ ] `MarketIndexResult`: `ticker`, `name`, `currentPrice`, `fluctuationRate`, `fluctuationAmount` 등.
- [ ] `StockDetailResult`: 종목 기본 정보, 섹터명, 시장 구분, 현재가 등.
- [ ] `DiagnosisResponse`: 건강 점수, 카테고리별 점수, 종목별 기여도 등.

---

## 2. 🟡 기능 보강 (Medium Priority)

### A. `src/api/portfolio.ts` 분석 API 추가
포트폴리오 상세 및 분석 탭을 위한 엔드포인트를 추가하세요.
- [ ] `getHealth(portfolioId: string)`: `GET /api/v1/portfolios/{portfolioId}/health` 추가.
- [ ] `getAnalysisSummary(portfolioId: string)`: `GET /api/v1/portfolios/{portfolioId}/analysis/summary` 추가.

### B. `src/api/sector.ts` 비교 API 추가
- [ ] `compareWithMarket(sectorCode: string, date?: string)`: `GET /api/v1/sectors/{sectorCode}/comparison` 추가.

---

## 3. 🟢 기타 및 테스트
- [ ] `src/api/__tests__/` 하위에 신규 추가된 API들에 대한 단위 테스트 작성.
- [ ] `use-market`, `use-stock-detail` 등 필요한 커스텀 훅 생성 시 해당 API들 연동.
