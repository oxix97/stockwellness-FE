# Track Specification: 홈 탭 화면 수정

## Overview
이 트랙은 사용자의 홈 탭 사용성을 개선하기 위한 UI/UX 수정 작업을 포함합니다. 불필요한 상단바 제거, 브라우저 탭 타이틀 변경, 그리고 'AI가 주목하는 섹터' 섹션의 데이터 노출 방식을 개선하여 더 나은 사용자 경험을 제공하는 것이 목적입니다.

## Goals
1. 홈 탭 최상단의 불필요한 상단바(App Bar 또는 Header) 제거.
2. 브라우저 탭 제목(Document Title)을 'Untitled'에서 'stockwellness'로 변경.
3. 'AI가 주목하는 섹터' 섹션의 데이터 표시 제한을 3개에서 10개로 늘리고, 레이아웃을 가로 스크롤(Horizontal Scroll) 방식으로 변경.

## Scope
- 홈 화면 컴포넌트 (`src/app/components/screens/Home.tsx` 등 관련 컴포넌트)
- 전역 HTML 파일 또는 라우터 타이틀 설정 (`index.html` 또는 Document Title 훅)
- 'AI가 주목하는 섹터' 컴포넌트 (`src/app/components/home/NewListingsSection.tsx` 또는 관련 UI 컴포넌트)
- 관련된 단위 테스트/E2E 테스트 업데이트.
