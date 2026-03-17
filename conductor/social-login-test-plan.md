# 소셜 로그인 연동 추가 테스트 구현 계획

## Objective (목표)
기존에 작성된 `Kakao` 소셜 로그인 테스트 외에, 누락된 `Google` 및 `Naver` 소셜 로그인 연동에 대한 **단위 테스트(Unit Test)** 및 **E2E 테스트(E2E Test)** 시나리오를 추가하여 코드 커버리지와 안정성을 확보합니다.

## Key Files & Context (관련 파일 및 컨텍스트)
*   **단위 테스트:** `src/app/components/screens/__tests__/AuthCallback.test.tsx`
*   **E2E 테스트:** `tests/auth.e2e.spec.ts`

## Implementation Steps (구현 단계)

### 1. E2E 테스트 추가 (`tests/auth.e2e.spec.ts`)
*   **Google 로그인 흐름 테스트 추가**
*   **Naver 로그인 흐름 테스트 추가**

### 2. 단위 테스트 보강 (`AuthCallback.test.tsx`)
*   **Provider 파라미터화 (Parameterization)**
*   **예외 케이스 검증**

## Verification & Testing (검증)
1.  `npm run test` 통과 확인
2.  `npx playwright test tests/auth.e2e.spec.ts` 통과 확인