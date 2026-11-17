# Responsive UI Guide

Stockwellness는 모바일 우선 레이아웃을 기본으로 하며, 태블릿과 데스크탑에서는 같은 정보 구조를 더 넓게 확장한다.

## Breakpoints

- `mobile`: `0-767px`
- `tablet`: `768-1023px`
- `desktop`: `1024px+`

## Shared Layout Rules

- 공통 컨테이너는 `page-shell`, `page-content`, `page-content-narrow` 유틸리티를 사용한다.
- 모바일은 좌우 `16px`, 태블릿은 `24px`, 데스크탑은 `32px` 패딩을 기본으로 한다.
- 모바일에서는 하단 탭 내비를 유지한다.
- 태블릿에서는 상단 탐색 바를 사용한다.
- 데스크탑에서는 좌측 고정 보조 내비를 사용한다.

## Shared Component Contracts

- `ContextHeader`
  - `layout="adaptive" | "split"`
  - 모바일에서는 수직 흐름, 큰 화면에서는 헤더와 액션을 분리한다.
- `Section`
  - `layout="default" | "wide"`
  - 섹션 헤더와 본문은 공통 컨테이너 폭을 따른다.
- 가로 카드 리스트
  - 모바일에서는 `responsive-scroll-row`로 스크롤한다.
  - 데스크탑에서는 자동 그리드로 승격한다.

## Screen Rules

- `Home`
  - 카드 캐러셀은 데스크탑에서 그리드로 전환한다.
- `Search`
  - 큰 화면에서는 좌측 탐색 패널, 우측 결과 리스트의 2열 구조를 사용한다.
- `Watchlist`
  - 모바일 FAB는 유지하되 데스크탑에서는 상단 액션 버튼과 좌측 그룹 패널을 우선 사용한다.
- `Portfolio`
  - hero 이후 콘텐츠는 데스크탑에서 2열 대시보드로 재배치한다.
- `More`
  - 프로필/페르소나와 설정 허브를 2열로 나눈다.

## Overlay Rules

- 모바일: `sheet`, `drawer`
- 데스크탑: `dialog`, `right-side panel`, `inline panel`

현재 구현:

- `WatchlistBottomSheet`는 데스크탑에서 centered modal로 동작한다.
- `PortfolioBottomSheet`는 데스크탑에서 right drawer로 동작한다.

## QA Checklist

- `390x844`, `768x1024`, `1280x800`, `1440x900`에서 레이아웃 붕괴가 없는지 확인한다.
- 모바일에서 하단 내비가 CTA와 입력창을 가리지 않는지 확인한다.
- 태블릿/데스크탑에서 상단 또는 좌측 내비가 정상 전환되는지 확인한다.
- `Home`, `Search`, `Watchlist`, `Portfolio`, `More`의 주요 카드가 데스크탑에서 과도하게 늘어나지 않는지 확인한다.
- 시트/다이얼로그가 키보드 탐색과 `Escape` 닫기를 유지하는지 확인한다.
