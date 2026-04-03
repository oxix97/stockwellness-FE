# PR 작성 계획 (PR Draft Plan)

## 개요
이 문서는 최근 진행된 주식 차트 및 관심 종목 기능 오류 수정(`stock_chart_watchlist_fixes_20260401` 트랙) 작업 내역을 `main` 브랜치에 병합하기 위한 PR(Pull Request) 초안입니다. 프로젝트의 `.github/PULL_REQUEST_TEMPLATE.md` 양식에 맞추어 작성되었습니다.

---

## PR 내용 초안

```markdown
## 📝 개요
주식 상세 화면의 주봉(1W) 차트 데이터 정합성 오류를 수정하고, 관심 종목(Watchlist) 기능의 상태 동기화 및 UI 피드백을 개선했습니다.

## 🔗 관련 이슈
- Resolves: #[관련 이슈 번호 작성 - 예: #42]

## 🛠️ 변경 사항

- **🚨 긴급 수정 (FRONTEND_FIX_REQUEST.md 대응)**
  - **라우터 지연 로딩 도입 (`ReferenceError: Search is not defined` 해결)**: 
    - `src/app/routes.tsx`에서 모든 화면 컴포넌트에 `React.lazy()` 및 동적 `import()`를 적용하여 모듈 초기화 순서로 인한 런타임 크래시를 방지했습니다.
    - `src/app/App.tsx`, `src/app/components/Layout.tsx`에 `Suspense` 및 `Skeleton` 로딩 UI를 추가하여 지연 로딩을 지원합니다.
  - **PWA 에셋 누락 수정**: `vite.config.ts`의 `includeAssets` 배열에 `pwa-192x192.png`, `pwa-512x512.png`를 추가하여 빌드 시 `dist/` 폴더에 포함되도록 했습니다.

- **📈 주식 차트 및 관심 종목 기능 고도화 (stock_chart_watchlist_fixes_20260401 트랙)**
  - **주봉(1W) 차트 데이터 정합성 수정**: `src/api/stock.ts` 파싱 로직 및 `src/hooks/use-stock.ts` 변환 로직을 개선하고, 조회 기간(3M, 1Y, 5Y)을 최적화했습니다.
  - **관심 종목(Watchlist) 실시간 동기화**: TanStack Query 캐시 무효화(`invalidateQueries`)를 통해 하트 아이콘 상태를 즉각 반영하고 `sonner` 토스트 알림을 추가했습니다.

- **🎨 UI/UX 리팩터링 및 최적화**
  - **홈 화면 섹션 개선**: '신규 상장', '수급 상위' 섹션을 가로 스크롤 카드 형태(`HomeCard`)로 리팩터링하여 모바일 가독성을 높였습니다.
  - **디자인 토큰 적용**: 하드코딩된 색상을 테마 변수(`text-up`, `text-down`)로 교체하고 등락 색상 가독성을 개선했습니다.
  - **API 타입 동기화**: 백엔드 최신 스펙에 맞춰 `src/types/schema.d.ts`를 갱신하고 관련 데이터 바인딩을 보완했습니다.

## ✅ 셀프 체크리스트 (Self-Check)
- [x] 빌드 성공 여부 확인 (`npm run build`)
- [x] 린트 체크 통과 여부 확인
- [x] 브라우저에서 직접 기능 동작 확인 (모바일 웹 우선 확인)
- [x] 기존 기능에 영향이 없는지 확인 (1D, 1M 등 다른 기간 차트 영향도 점검)

## 📸 스크린샷 (선택 사항)
<!-- 주봉 차트 정상 렌더링 화면 및 관심 종목 하트 활성화/토스트 알림 스크린샷을 첨부해주세요. -->
```

---

## 리뷰 및 실행 방법
1. PR 초안의 내용이 실제 구현 및 변경 사항과 일치하는지 확인합니다.
2. (선택) 이슈 번호 및 스크린샷을 추가로 준비합니다.
3. 승인(Approve)해 주시면 플랜 모드를 종료하고, 깃허브 CLI(`gh pr create ...`) 명령어나 안내를 통해 PR을 업로드할 수 있습니다.
