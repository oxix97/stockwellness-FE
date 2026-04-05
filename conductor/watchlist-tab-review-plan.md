# 코드 리뷰 계획: 관심 탭 (Watchlist Tab) 고도화 점검

## 개요
관심 탭의 핵심 기능인 그룹 관리, 종목 리스트, 스와이프 삭제, 메모 자동 저장, RSI/AI 진단 뱃지 등의 구현 품질을 점검하고 기술 부채를 식별합니다.

## 리뷰 대상
- **화면**: `src/app/components/screens/Watchlist.tsx`
- **컴포넌트**: `src/app/components/watchlist/WatchlistItemCard.tsx`, `AddItemSheet.tsx`
- **비즈니스 로직**: `src/hooks/use-watchlist.ts`
- **API**: `src/api/watchlist.ts`

---

## 중점 리뷰 항목

### 1. 사용자 경험 및 상호작용 (UX/Interaction)
- [ ] **스와이프 vs 클릭 간섭**: `WatchlistItemCard`에서 좌측 스와이프(삭제)와 클릭(아코디언 토글) 동작이 충돌하지 않는지 확인.
- [ ] **스와이프 상태 관리**: 삭제 버튼이 노출된 상태에서 다른 영역 클릭 시 원래대로 돌아오는지(Snap back) 확인.
- [ ] **애니메이션 성능**: Framer Motion(`motion/react`)의 `layout` 프로퍼티 사용 시 리스트 재정렬 및 아코디언 확장이 부드러운지 점검.

### 2. 데이터 관리 및 안정성 (Data & Stability)
- [ ] **메모 데바운스(Debounce)**: 1초 데바운스 로직이 컴포넌트 언마운트 시 정상적으로 정리(Cleanup)되는지 확인.
- [ ] **그룹 전환 전략**: 그룹 칩 클릭 시 이전 그룹 데이터가 보이다가 바뀌는지, Skeleton UI가 적절히 노출되는지 점검.
- [ ] **실시간성 부족**: 마지막 업데이트 시각 표시 로직이 실제 데이터의 신선도와 일치하는지 확인.

### 3. 구조 및 아키텍처 (Architecture)
- [ ] **훅의 책임 분리**: `useWatchlist` 훅이 그룹 관리와 종목 관리를 모두 담당할 때의 복잡도와 최적화 여부.
- [ ] **타입 안전성**: `WatchlistStock` 인터페이스의 옵셔널 필드(`rsiStatus`, `aiInsight`, `currentPrice`)에 대한 방어 코드 확인.

### 4. 에러 처리 및 예외 상황 (Error Handling)
- [ ] **삭제 실패 대응**: 스와이프 삭제 시 API 에러가 발생하면 UI가 다시 원래 위치로 복구되는지 확인.
- [ ] **빈 데이터(Empty State)**: 그룹은 있으나 종목이 없는 경우와 그룹 자체가 없는 경우의 UI 분기 적절성.

---

## 향후 작업 방향
1. **리뷰 실행**: 위 항목을 바탕으로 상세 코드 분석 수행.
2. **결과 기록**: `code-review.md` 파일에 관심 탭 섹션 추가 및 병합.
3. **수정 제안**: 발견된 결함에 대한 구체적인 코드 수정안 제시.

---
**작성자**: Gemini CLI
**날짜**: 2026-04-05
