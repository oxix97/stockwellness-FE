# 소셜 로그인 콜백 처리 구현 계획

백엔드 소셜 로그인 성공 후 프론트엔드 리다이렉트 시 발생하는 "Not Found" 문제와 토큰 처리 로직을 개선하기 위한 계획입니다.

## 1. 목적
*   `/auth/callback` 경로에 대한 정확한 라우팅 보장
*   백엔드에서 전달되는 다양한 토큰 파라미터(`token`, `accessToken`) 대응
*   사용자 요청 사항(`AuthCallbackHandler` 명칭 및 처리 로직) 반영

## 2. 주요 수정 파일
*   `src/app/components/screens/AuthCallback.tsx` -> `AuthCallbackHandler.tsx` (컴포넌트 명칭 변경 및 로직 보강)
*   `src/app/components/screens/index.ts` (내보내기 명칭 업데이트)
*   `src/app/routes.tsx` (라우트 컴포넌트 명칭 업데이트)
*   `src/app/routes.ts` (중복/미사용 파일 제거 또는 업데이트 - 혼란 방지)

## 3. 세부 구현 단계

### 단계 1: AuthCallbackHandler 구현
*   `src/app/components/screens/AuthCallback.tsx` 파일을 `AuthCallbackHandler.tsx`로 변경하거나 내용을 업데이트합니다.
*   URL 파라미터에서 `accessToken`, `refreshToken`뿐만 아니라 `token` 파라미터도 체크하도록 수정합니다.
    *   `token`이 있으면 이를 `accessToken`으로 간주합니다.
*   Zustand 스토어(`setAuth`)를 통해 `localStorage`에 토큰을 안전하게 저장합니다.
*   성공 시 메인 화면(`/`) 또는 이전 저장된 경로로 리다이렉트합니다.

### 단계 2: 라우팅 설정 업데이트
*   `src/app/routes.tsx`에서 `AuthCallback`을 `AuthCallbackHandler`로 변경합니다.
*   사용자의 요청에 맞춰 `/auth/callback` 경로가 확실히 최상위 라우터에 등록되어 있는지 재확인합니다.

### 단계 3: 중복 파일 정리
*   현재 프로젝트에 `routes.ts`와 `routes.tsx`가 공존하여 혼란을 줄 수 있습니다.
*   `src/app/routes.ts` 내용을 `routes.tsx`와 동기화하거나, 사용되지 않는다면 제거를 제안합니다. (현재 `App.tsx`는 `routes.tsx`를 사용 중)

## 4. 검증 계획
*   **단위 테스트**: `src/app/components/screens/__tests__/AuthCallbackHandler.test.tsx`를 업데이트하여 `accessToken`, `refreshToken`, `errorCode` 계약 기준으로 정상 동작하는지 검증합니다.
*   **수동 테스트**: 로컬 환경에서 `http://localhost:5173/auth/callback?accessToken=...&refreshToken=...` 또는 `?errorCode=A007` URL로 직접 접속하여 정상적으로 처리되는지 확인합니다.

## 5. 기타 사항
*   쿠키 저장 로직의 경우, 현재 `localStorage`를 사용하고 있으므로 사용자 요구사항("localStorage나 Cookie")을 충족합니다. 향후 보안 강화를 위해 쿠키 라이브러리(`js-cookie` 등) 도입이 필요하다면 추가 작업을 진행할 수 있습니다.
