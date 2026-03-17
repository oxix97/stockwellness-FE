# [FE] Portfolio 화면 보유 주식 목록 API 연동 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Portfolio.tsx`의 하드코딩된 `HOLDINGS` 데이터를 제거하고, 실제 백엔드 API(`/api/v1/portfolios/{portfolioId}/holdings`)와 연동하여 보유 주식 목록을 렌더링합니다.

**Architecture:** 
- `usePortfolio` 훅을 확장하여 보유 종목 데이터를 가져옵니다.
- `TanStack Query`의 캐싱 기능을 활용합니다.
- 데이터가 없을 경우에 대한 Empty State 처리를 추가합니다.

**Tech Stack:** React 19, TanStack Query v5, Axios

---

### Task 1: API 타입 정의 추가

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: HoldingStock 인터페이스 추가**

```typescript
export interface HoldingStock {
  /** 종목 코드 */
  symbol: string;
  /** 종목 이름 */
  name: string;
  /** 보유 수량 */
  shares: number;
  /** 현재가 */
  currentPrice: number;
  /** 평균 매수가 */
  avgPrice: number;
  /** 수익률 (%) */
  return: number;
  /** 상승 여부 (UI 컬러 결정용) */
  isUp: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add HoldingStock type definition"
```

---

### Task 2: API 호출 함수 추가

**Files:**
- Modify: `src/api/portfolio.ts`

- [ ] **Step 1: getHoldings 함수 추가**

```typescript
  /**
   * 사용자 포트폴리오의 보유 종목 리스트를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 보유 종목 리스트
   */
  getHoldings: async (portfolioId: string): Promise<HoldingStock[]> => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/holdings`);
    return data;
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/api/portfolio.ts
git commit -m "feat: add getHoldings API function"
```

---

### Task 3: usePortfolio 커스텀 훅 수정

**Files:**
- Modify: `src/hooks/use-portfolio.ts`

- [ ] **Step 1: holdings 쿼리 추가 및 반환 객체에 포함**

```typescript
  const holdings = useQuery({
    queryKey: ["portfolio", portfolioId, "holdings"],
    queryFn: () => portfolioApi.getHoldings(portfolioId),
    enabled: !!portfolioId,
  });

  // ... (중략)

  return {
    valuation: valuation.data,
    diversification: diversification.data,
    advice: advice.data,
    holdings: holdings.data, // 추가
    isLoading: valuation.isLoading || diversification.isLoading || advice.isLoading || holdings.isLoading,
    health: getHealthScore(),
  };
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-portfolio.ts
git commit -m "feat: update usePortfolio hook to fetch holdings"
```

---

### Task 4: Portfolio 화면 UI 연동 및 모킹 제거

**Files:**
- Modify: `src/app/components/screens/Portfolio.tsx`

- [ ] **Step 1: HOLDINGS 상수 제거**
- [ ] **Step 2: usePortfolio에서 holdings 데이터를 가져와 HoldingsList에 전달**
- [ ] **Step 3: 데이터가 없을 경우 Empty State 노출 로직 추가**

- [ ] **Step 4: Commit**

```bash
git add src/app/components/screens/Portfolio.tsx
git commit -m "feat: integrate real holdings data on Portfolio screen"
```

---

### Task 5: 최종 검증

- [ ] **Step 1: 타입 체크 및 린트 실행**
Run: `npx tsc --noEmit && npm run lint`
- [ ] **Step 2: Commit**

```bash
git commit --allow-empty -m "chore: final verification for issue #16"
```
