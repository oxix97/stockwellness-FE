# 종목 수급 랭킹 API 연동 가이드

> 대상 API: `GET /api/v1/stocks/ranking/supply`
> 목적: 종목 화면 또는 홈/탐색 섹션에서 기관/외국인 수급 랭킹을 함께 노출하기 위한 프론트 구현 가이드

---

## 언제 쓰는가

- 기관과 외국인의 종목 수급 랭킹을 한 화면에서 동시에 보여줄 때 사용합니다.
- `BUY`는 순매수 상위, `SELL`은 순매도 상위 랭킹입니다.
- 서버는 기관/외국인 랭킹을 각각 별도 배열로 내려주므로, 프론트도 2개 리스트를 기준으로 UI를 설계해야 합니다.

---

## 요청 규격

### 엔드포인트

```http
GET /api/v1/stocks/ranking/supply
```

### Query 파라미터

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `date` | `string` | 선택 | 조회 날짜 (`yyyy-MM-dd`) |
| `direction` | `"BUY" \| "SELL"` | 선택 | 기본값 `BUY` |
| `limit` | `number` | 선택 | 기본값 `10`, 최소값 `1` |

### 예시

```ts
{
  date: "2026-04-08",
  direction: "SELL",
  limit: 10,
}
```

---

## 응답 규격

```ts
interface StockSupplyRankingItem {
  ticker: string;
  stockName: string;
  netBuyingAmount: number;
  transactionAmount: number;
}

interface StockSupplyRankingResponse {
  requestedDate: string | null;
  effectiveDate: string | null;
  institutionItems: StockSupplyRankingItem[];
  foreignItems: StockSupplyRankingItem[];
}
```

### 응답 의미

- `requestedDate`
  - 사용자가 요청한 날짜입니다.
  - 날짜 없이 호출하면 `null`일 수 있습니다.
- `effectiveDate`
  - 실제 랭킹 산정 기준 날짜입니다.
  - 프론트에서 반드시 노출해야 합니다.
  - `requestedDate !== effectiveDate`면 서버 fallback이 발생한 것입니다.
- `institutionItems`
  - 기관 기준 랭킹 목록입니다.
- `foreignItems`
  - 외국인 기준 랭킹 목록입니다.

### 예시

```json
{
  "requestedDate": "2026-04-08",
  "effectiveDate": "2026-04-07",
  "institutionItems": [
    {
      "ticker": "005930",
      "stockName": "삼성전자",
      "netBuyingAmount": 5000000000,
      "transactionAmount": 120000000000
    }
  ],
  "foreignItems": [
    {
      "ticker": "000660",
      "stockName": "SK하이닉스",
      "netBuyingAmount": 3000000000,
      "transactionAmount": 80000000000
    }
  ]
}
```

---

## 구현 순서

### 1. OpenAPI 타입 갱신

```bash
npm run sync-api
```

- 생성 파일: `src/types/schema.d.ts`
- 신규 엔드포인트 타입이 반영되었는지 먼저 확인합니다.

### 2. 타입 래퍼 정리

현재 프론트는 `src/types/api` 또는 API 모듈 내부 타입을 함께 사용합니다.

권장 타입 예시:

```ts
export type TradeDirection = "BUY" | "SELL";

export interface StockSupplyRankingItem {
  ticker: string;
  stockName: string;
  netBuyingAmount: number;
  transactionAmount: number;
}

export interface StockSupplyRankingResponse {
  requestedDate: string | null;
  effectiveDate: string | null;
  institutionItems: StockSupplyRankingItem[];
  foreignItems: StockSupplyRankingItem[];
}

export interface StockSupplyRankingParams {
  date?: string;
  direction?: TradeDirection;
  limit?: number;
}
```

### 3. `src/api/stock.ts`에 API 함수 추가

현재 코드베이스는 `stockApi` 객체 패턴을 사용합니다.

```ts
import { apiClient } from "./client";

export interface StockSupplyRankingParams {
  date?: string;
  direction?: "BUY" | "SELL";
  limit?: number;
}

export interface StockSupplyRankingItem {
  ticker: string;
  stockName: string;
  netBuyingAmount: number;
  transactionAmount: number;
}

export interface StockSupplyRankingResponse {
  requestedDate: string | null;
  effectiveDate: string | null;
  institutionItems: StockSupplyRankingItem[];
  foreignItems: StockSupplyRankingItem[];
}

export const stockApi = {
  // 기존 메서드들...

  getSupplyRanking: async (
    params?: StockSupplyRankingParams
  ): Promise<StockSupplyRankingResponse> => {
    const data = await apiClient.get("/v1/stocks/ranking/supply", { params });
    return data as unknown as StockSupplyRankingResponse;
  },
};
```

### 4. Query Key와 훅 추가

파일 위치는 둘 중 하나를 권장합니다.

- `src/hooks/use-stock.ts` 내부에 메서드 추가
- 또는 `src/hooks/use-stock-supply.ts`로 분리

간단한 시작점은 `use-stock.ts`에 추가하는 방식입니다.

```ts
import { useQuery } from "@tanstack/react-query";
import { stockApi, StockSupplyRankingResponse } from "@/api/stock";

export const stockKeys = {
  all: ["stocks"] as const,
  ranking: {
    supply: (params: {
      date?: string;
      direction?: "BUY" | "SELL";
      limit?: number;
    }) => ["stocks", "ranking", "supply", params] as const,
  },
};

export const useStockSupplyRanking = (params?: {
  date?: string;
  direction?: "BUY" | "SELL";
  limit?: number;
}) =>
  useQuery<StockSupplyRankingResponse>({
    queryKey: stockKeys.ranking.supply({
      date: params?.date,
      direction: params?.direction ?? "BUY",
      limit: params?.limit ?? 10,
    }),
    queryFn: () => stockApi.getSupplyRanking(params),
    staleTime: 1000 * 60 * 5,
  });
```

### 5. 화면 컴포넌트에서 소비

기관/외국인 두 채널을 동시에 보여주는 UI를 기본값으로 둡니다.

```tsx
const { data, isLoading, isError, error } = useStockSupplyRanking({
  direction: "BUY",
  limit: 10,
});

if (isLoading) return <Skeleton />;
if (isError) return <ErrorMessage message="수급 랭킹을 불러오지 못했습니다." />;

if (!data?.effectiveDate) {
  return <EmptyState title="수급 데이터가 없습니다." />;
}

return (
  <section>
    <p>기준일: {data.effectiveDate}</p>
    {data.requestedDate && data.requestedDate !== data.effectiveDate && (
      <p>요청일 데이터가 없어 가장 가까운 기준일로 표시 중입니다.</p>
    )}

    <RankingSection title="기관" items={data.institutionItems} />
    <RankingSection title="외국인" items={data.foreignItems} />
  </section>
);
```

---

## 화면 표시 규칙

### 1. 기준일 표시는 필수

- `effectiveDate`는 서버가 실제로 사용한 날짜입니다.
- 헤더 또는 리스트 상단에 반드시 노출합니다.

표시 예시:

- `기준일 2026-04-07`
- `2026-04-08 요청, 2026-04-07 기준 데이터 표시`

### 2. fallback 안내

아래 조건이면 fallback 안내 문구를 보여줍니다.

```ts
data.requestedDate !== null && data.requestedDate !== data.effectiveDate
```

### 3. 채널별 빈 상태 허용

- `institutionItems`만 비어 있고 `foreignItems`는 있을 수 있습니다.
- 반대 경우도 가능합니다.
- 한 채널이 비어도 전체 화면을 empty로 처리하지 말고, 해당 섹션만 empty 처리합니다.

### 4. 전체 empty 상태

아래 조건이면 “수급 데이터 없음” 화면을 보여줍니다.

```ts
data.effectiveDate === null
```

### 5. `SELL` 화면 표시

- 서버는 `SELL`일 때 음수 값을 내려줍니다.
- 화면에서는 다음 둘 중 하나로 통일합니다.
  - 음수 그대로 표기
  - 절대값으로 표기하고 라벨을 `순매도 금액`으로 변경

권장:

- `BUY`일 때 라벨: `순매수 금액`
- `SELL`일 때 라벨: `순매도 금액`
- 숫자 표시는 `Math.abs(netBuyingAmount)` 사용

---

## 프론트 구현 시 주의사항

- `limit <= 0`은 서버에서 400이므로 입력 단계에서 막아야 합니다.
- `direction` 쿼리스트링은 `"BUY"` 또는 `"SELL"`만 사용합니다.
- 숨은 제어문자나 잘못된 문자열이 들어가면 서버 기본값 `BUY`가 적용될 수 있으므로, 문자열 직접 조합보다 `params` 객체를 사용합니다.
- 컴포넌트에서 `src/api/stock.ts`를 직접 import하지 말고 훅을 통해 사용합니다.
- Query Key는 하드코딩하지 말고 팩토리 함수로 관리합니다.

---

## 검증 체크리스트

- `BUY` 호출 시 기관/외국인 리스트가 각각 렌더링된다.
- `SELL` 호출 시 순매도 랭킹이 렌더링된다.
- `requestedDate` 없이 호출했을 때 `effectiveDate`가 화면에 표시된다.
- `requestedDate !== effectiveDate`일 때 fallback 안내가 노출된다.
- 기관만 비었거나 외국인만 비어도 다른 채널은 정상 표시된다.
- `effectiveDate === null`이면 empty state가 노출된다.
- `limit` 입력 UI가 1 미만 값을 허용하지 않는다.

---

## 권장 Query Key 예시

```ts
["stocks", "ranking", "supply", { date, direction, limit }]
```

이 키를 기준으로 `BUY/SELL`, 날짜, limit 별 캐시를 안정적으로 분리합니다.
