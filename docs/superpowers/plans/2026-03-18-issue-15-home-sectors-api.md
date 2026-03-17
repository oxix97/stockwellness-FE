# [FE] Home 화면 추천 섹터 API 연동 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Home.tsx`의 하드코딩된 `SECTORS` 데이터를 제거하고, 실제 백엔드 API(`/api/v1/sectors/ranking/fluctuation`)와 연동하여 실시간 데이터를 렌더링합니다.

**Architecture:** 
- `TanStack Query`를 사용하여 서버 상태를 관리합니다.
- `apiClient`를 통해 백엔드와 통신하며, `/api/v1` 프리픽스를 적용합니다.
- 데이터 로딩 시 `Skeleton` UI를 노출하여 UX를 개선합니다.

**Tech Stack:** React 19, TanStack Query v5, Axios, Tailwind CSS 4.0

---

### Task 1: API 타입 정의 추가

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: RecommendedSector 인터페이스 추가**

```typescript
export interface RecommendedSector {
  /** 섹터 코드 */
  sectorCode: string;
  /** 섹터 이름 */
  sectorName: string;
  /** 현재 지수/가격 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 과열 여부 */
  isOverheated: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add RecommendedSector type definition"
```

---

### Task 2: API 호출 함수 수정

**Files:**
- Modify: `src/api/stock.ts`

- [ ] **Step 1: getRecommendedSectors 엔드포인트 수정 및 타입 적용**

```typescript
  /**
   * 섹터 등락률 랭킹 리스트를 조회합니다. (홈 화면 추천 섹터로 사용)
   */
  getRecommendedSectors: async (): Promise<RecommendedSector[]> => {
    const { data } = await apiClient.get("/v1/sectors/ranking/fluctuation");
    return data.data; // ApiResponse 구조일 경우 .data.data 확인 필요
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/api/stock.ts
git commit -m "feat: update getRecommendedSectors API endpoint and type"
```

---

### Task 3: 커스텀 훅 보완

**Files:**
- Modify: `src/hooks/use-stock.ts`

- [ ] **Step 1: useStock 훅 내 recommendedSectors 쿼리 확인** (이미 존재하는지 확인 및 타입 명시)

```typescript
  /** 
   * 추천 섹터
   */
  const recommendedSectors = useQuery({
    queryKey: ["stocks", "sectors", "recommended"],
    queryFn: () => stockApi.getRecommendedSectors(),
  });
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-stock.ts
git commit -m "refactor: ensure useStock includes recommendedSectors query"
```

---

### Task 4: Home 화면 UI 연동 및 모킹 제거

**Files:**
- Modify: `src/app/components/screens/Home.tsx`

- [ ] **Step 1: SECTORS 상수 제거 및 useStock 훅 활용**
- [ ] **Step 2: Skeleton 로딩 UI 구현**
- [ ] **Step 3: SectorCard 컴포넌트 실제 데이터 프로퍼티 대응**

- [ ] **Step 4: Commit**

```bash
git add src/app/components/screens/Home.tsx
git commit -m "feat: integrate real API for recommended sectors on Home screen"
```

---

### Task 5: 최종 검증

- [ ] **Step 1: 타입 체크 실행**
Run: `npx tsc --noEmit`
- [ ] **Step 2: 린트 체크 실행**
Run: `npm run lint` (또는 프로젝트에 맞는 린트 명령어)
- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "chore: final verification for issue #15"
```
