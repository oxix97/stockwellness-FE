# Code Review Issues Fix Plan

## Objective
Address and resolve all **BLOCKER** and **MAJOR** issues identified in the integrated code review (`code-review.md`) across the Home, Search, Watchlist, Portfolio/Backtest, and My Page/Auth tabs.

## Key Files & Context

### Home Tab
- `src/hooks/use-sector.ts`
- `src/hooks/__tests__/use-sector.test.tsx`

### Search Tab
- `src/app/components/screens/Search.tsx`
- `src/hooks/use-search.ts`
- `src/hooks/use-stock.ts`

### Watchlist Tab
- `src/app/components/watchlist/WatchlistItemCard.tsx`
- `src/app/components/screens/Watchlist.tsx`
- `src/hooks/use-watchlist.ts`

### Portfolio & Backtest
- `src/app/components/screens/BacktestResult.tsx`
- `src/app/components/screens/BacktestSetup.tsx`
- `src/hooks/use-backtest.ts`
- `src/app/components/screens/Portfolio.tsx`

### My Page & Auth
- `src/store/auth.ts`
- `src/app/components/screens/AuthCallbackHandler.tsx`
- `src/hooks/use-member.ts`
- `src/app/components/screens/More.tsx`

## Implementation Steps

### Phase 1: Home Tab Fixes
1. **Fix Sector Limit (MAJOR)**: In `use-sector.ts`, change the API call parameter `limit: 5` to `limit: 10`.
2. **Update Tests**: Update `src/hooks/__tests__/use-sector.test.tsx` which currently expects `limit: 3` to expect `limit: 10`.

### Phase 2: Search Tab Fixes
1. **Infinite Scroll (BLOCKER)**: In `Search.tsx`, implement `react-intersection-observer` at the bottom of the list to trigger `hasNextPage && fetchNextPage()`.
2. **API Call Debounce (BLOCKER)**: In `Search.tsx`, utilize the existing `debouncedKeyword` logic from `use-search.ts` (or implement a 300ms debounce) to prevent excessive API requests per keystroke.
3. **Hook Consolidation (MAJOR)**: Move search-related logic (`useSearch`, `history`, `popular`) from `use-stock.ts` into `use-search.ts` to prevent fragmentation.
4. **Recent Searches (MAJOR)**: Standardize recent search storage. If using `localStorage`, encapsulate it within a hook and ensure `Search.tsx` uses it consistently rather than mixing API and local storage directly in the component.

### Phase 3: Watchlist Tab Fixes
1. **Memo Auto-save Cleanup (BLOCKER)**: In `WatchlistItemCard.tsx`, add a `clearTimeout(saveTimer)` inside the `useEffect` cleanup function to prevent memory leaks and runtime errors on unmount.
2. **Group Edit/Delete UI (BLOCKER)**: In `Watchlist.tsx`, add a UI entry point (e.g., an 'Edit' button or a long-press interaction on the group chip) to allow users to rename or delete groups.
3. **Swipe Snap-back (MAJOR)**: In `WatchlistItemCard.tsx`, add logic to reset the swipe state (`dragX` to 0) when the accordion is expanded or when an outside touch occurs.
4. **Optimize Stock Existence Check (MAJOR)**: In `use-watchlist.ts`, refactor `useIsTickerInWatchlist` to avoid fetching all groups individually. Leverage cached group data or an optimized API.

### Phase 4: Portfolio & Backtest Fixes
1. **Backtest Result Reload Stability (BLOCKER)**: Refactor `BacktestResult.tsx` to read its configuration from URL parameters (e.g., `?strategy=...&amount=...`) or a Zustand store instead of relying solely on `location.state`, preventing data loss on browser refresh.
2. **Remove Hardcoded Stocks (MAJOR)**: In `BacktestSetup.tsx`, remove the hardcoded `STOCK_NAMES` dictionary. Fetch stock names dynamically from the API or use a dedicated utility.
3. **Client-side Calculation Optimization (MAJOR)**: In `use-backtest.ts`, offload heavy metric calculations (MDD, CAGR) to rely primarily on `serverMetrics` to prevent UI jank.
4. **Decouple Health Check Logic (MAJOR)**: Extract the health badge logic (e.g., `score >= 70`) from `Portfolio.tsx` into `usePortfolio` or a dedicated utility function.

### Phase 5: My Page & Auth Fixes
1. **Refresh Token Management (BLOCKER)**: Update `UserState` in `src/store/auth.ts` to include `refreshToken: string | null`. Update `setAuth` and `logout` actions to handle it. Ensure `AuthCallbackHandler.tsx` sets it in the store.
2. **Remove Side-Effects in QueryFn (MAJOR)**: In `use-member.ts`, remove the `setNickname` call from the `useMe` `queryFn`. Handle store synchronization at the component level or via `useEffect`.
3. **Decouple Investor Type Logic (MAJOR)**: Extract the investor type calculation logic from `More.tsx` into a utility. Add a loading state placeholder to prevent defaulting to "Aggressive Investor" while loading.

## Verification & Testing
- Ensure the app builds without errors (`npm run build`).
- Run unit tests (`npm test`) and ensure all, particularly `use-sector.test.tsx`, pass.
- Manually test:
  - Search input debouncing and infinite scroll trigger.
  - Watchlist swipe resets and group edit UI flow.
  - Backtest result page reloading without data loss.
  - Login callback properly saving the refresh token.