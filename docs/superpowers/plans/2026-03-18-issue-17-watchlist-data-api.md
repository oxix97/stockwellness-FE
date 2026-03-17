# [FE] Watchlist 화면 관심 종목 그룹 및 리스트 API 연동 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Watchlist.tsx`의 하드코딩된 `groups` 및 `watchlistStocks` 데이터를 제거하고, 실제 백엔드 API와 연동하여 동적인 관심 종목 관리를 구현합니다.

**Architecture:** 
- `watchlistApi` 모듈을 신규 생성하여 그룹 목록 및 그룹 내 종목 조회를 처리합니다.
- `useWatchlist` 커스텀 훅을 통해 그룹 데이터와 선택된 그룹의 아이템 데이터를 관리합니다.
- `TanStack Query`를 사용하여 비동기 데이터 상태를 제어합니다.

**Tech Stack:** React 19, TanStack Query v5, Axios

---

### Task 1: API 타입 정의 추가

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Watchlist 관련 인터페이스 추가**

```typescript
export interface WatchlistGroup {
  /** 그룹 ID */
  id: number;
  /** 그룹 이름 */
  name: string;
  /** 포함된 종목 수 */
  itemCount: number;
}

export interface WatchlistStock {
  /** 종목 티커 */
  ticker: string;
  /** 종목 이름 */
  name: string;
  /** 현재가 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 투자 메모 */
  note: string;
  /** RSI 지표 */
  rsi: number;
  /** RSI 상태 */
  rsiStatus: string;
  /** AI 한줄 분석 */
  aiInsight: string;
}

export interface WatchlistItemListResponse {
  /** 그룹 이름 */
  groupName: string;
  /** 종목 리스트 */
  items: WatchlistStock[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add Watchlist related type definitions"
```

---

### Task 2: Watchlist API 모듈 생성

**Files:**
- Create: `src/api/watchlist.ts`

- [ ] **Step 1: watchlistApi 구현**

```typescript
import { apiClient } from "./client";
import { WatchlistGroup, WatchlistItemListResponse } from "@/types/api";

export const watchlistApi = {
  /**
   * 사용자의 관심 종목 그룹 목록을 가져옵니다.
   */
  getGroups: async (): Promise<WatchlistGroup[]> => {
    const { data } = await apiClient.get("/v1/watchlist/groups");
    return data;
  },

  /**
   * 특정 관심 종목 그룹에 속한 종목 리스트를 가져옵니다.
   * @param groupId 그룹 ID
   */
  getItems: async (groupId: number): Promise<WatchlistItemListResponse> => {
    const { data } = await apiClient.get(`/v1/watchlist/groups/${groupId}/items`);
    return data;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/watchlist.ts
git commit -m "feat: create watchlistApi module"
```

---

### Task 3: useWatchlist 커스텀 훅 생성

**Files:**
- Create: `src/hooks/use-watchlist.ts`

- [ ] **Step 1: useWatchlist 훅 구현**

```typescript
import { useQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/api/watchlist";

export function useWatchlist() {
  const groups = useQuery({
    queryKey: ["watchlist", "groups"],
    queryFn: () => watchlistApi.getGroups(),
  });

  const useGroupItems = (groupId: number | null) => useQuery({
    queryKey: ["watchlist", "groups", groupId, "items"],
    queryFn: () => watchlistApi.getItems(groupId!),
    enabled: groupId !== null,
  });

  return {
    groups,
    useGroupItems,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-watchlist.ts
git commit -m "feat: create useWatchlist hook"
```

---

### Task 4: Watchlist 화면 UI 연동 및 모킹 제거

**Files:**
- Modify: `src/app/components/screens/Watchlist.tsx`

- [ ] **Step 1: groups 및 watchlistStocks 상수 제거**
- [ ] **Step 2: useWatchlist 훅 연동 및 activeGroup 상태 관리 (id 기반)**
- [ ] **Step 3: Skeleton UI 추가 및 데이터 바인딩**

- [ ] **Step 4: Commit**

```bash
git add src/app/components/screens/Watchlist.tsx
git commit -m "feat: integrate real watchlist data on Watchlist screen"
```

---

### Task 5: 최종 검증

- [ ] **Step 1: 타입 체크 및 린트 실행**
Run: `npx tsc --noEmit && npm run lint`
- [ ] **Step 2: Commit**

```bash
git commit --allow-empty -m "chore: final verification for issue #17"
```
