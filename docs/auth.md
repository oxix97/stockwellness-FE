# 인증 가이드

현재 구현의 기준은 [인증 스토어](../src/store/auth.ts), [API 클라이언트](../src/api/client.ts), [인증 API](../src/api/auth.ts)다. 인증 동작을 변경할 때 코드와 테스트를 함께 확인한다.

## 토큰 저장과 재발급

- Zustand `persist`는 인증 상태를 `auth-storage`에 저장한다. `setAuth`와 `updateTokens`는 access token과 refresh token을 각각 `localStorage`에도 기록한다. `logout`은 두 개별 키를 제거하고 상태를 초기화한다.
- API 클라이언트는 `/api`를 기본 경로로 사용하고 `Content-Type: application/json`을 설정한다. 인증 요청에는 access token을 Bearer 헤더로 전달한다.
- 401 응답에서는 현재 세션을 확인하고 `/api/v1/auth/reissue`로 refresh token을 전달한다. 동시 재발급 요청은 대기열로 조정한다. 이전 사용자·세션의 응답이 현재 세션을 갱신하거나 종료하지 않도록 확인한다.
- 토큰과 개인 정보는 문서·로그·테스트 결과에 출력하지 않는다. 저장 방식은 현재 구현의 설명이며 보안상 적합성 검증이나 변경 승인을 뜻하지 않는다.

오류 처리는 [오류 처리 가이드](error-handling.md)를 참조한다.
