# 관심 목록 탭 (Watchlist) 에러 원인 및 수정 계획

## 1. 이슈 개요 및 원인
사용자가 관심 목록 탭 진입 시 `ReferenceError: useEffect is not defined` 에러가 발생하며 화면이 렌더링되지 않는 문제가 보고되었습니다. 조사 결과, `src/app/components/watchlist/WatchlistItemCard.tsx` 파일 내에서 리액트 훅인 `useEffect`를 호출하여 사용하고 있으나, 파일 상단에서 `useEffect`를 `react` 모듈로부터 import 하지 않아서 발생한 참조 에러임이 확인되었습니다.

## 2. 해결 방안 (수정 범위)
- **대상 파일:** `src/app/components/watchlist/WatchlistItemCard.tsx`
- **수정 내용:** 누락된 `useEffect` import 추가

## 3. 구현 단계
1. `src/app/components/watchlist/WatchlistItemCard.tsx` 파일을 엽니다.
2. 1번째 줄의 기존 구문: `import { useState } from "react";`
3. 변경할 구문: `import { useState, useEffect } from "react";`

## 4. 검증 계획
- 로컬 개발 서버를 띄워 관심 목록 탭 진입 시 더 이상 해당 에러로 크래시되지 않는지 확인합니다.
- 관심 목록 카드 내의 스와이프(삭제) 및 메모 아코디언 동작 시 useEffect 의존성 로직이 올바르게 실행되는지 테스트합니다.