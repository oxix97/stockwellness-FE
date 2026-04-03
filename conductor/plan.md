# 프론트엔드 긴급 수정 계획 (FRONTEND_FIX_REQUEST.md 대응)

## 1. 개요
운영 환경에서 발생한 `ReferenceError: Search is not defined` 크래시 및 PWA 아이콘 누락 문제를 해결하고, 관련하여 빌드 최적화 및 PWA 설정 점검을 진행합니다.

## 2. 문제 원인 및 해결 방안

### A. `ReferenceError: Search is not defined` 수정
- **원인**: `src/app/routes.tsx`에서 화면 컴포넌트들을 `screens/index.ts` 배럴 파일(Barrel file)을 통해 일괄 임포트하면서, 모듈 초기화 순서 문제(Circular Dependency) 또는 트리 쉐이킹 과정에서의 충돌로 인해 `Search` 컴포넌트가 `undefined`로 평가되는 문제로 보입니다.
- **해결 방안**: 
  - 빌드 청크 크기 최적화(500kB 경고 해결) 및 평가 순서 문제의 근본적 방지를 위해 `React.lazy`와 동적 `import()`를 사용하여 라우트 컴포넌트들을 지연 로딩하도록 변경합니다. (또는 직접 임포트)
  - **작업 파일**: `src/app/routes.tsx`

### B. PWA 매니페스트 아이콘 누락 (`404 Not Found`) 수정
- **원인**: `vite-plugin-pwa` 설정의 `includeAssets` 배열에 `manifest.webmanifest`에서 참조하는 `pwa-192x192.png` 및 `pwa-512x512.png` 파일이 누락되어, 빌드 시 `dist/` 폴더의 캐시에 포함되지 않았습니다.
- **해결 방안**: `vite.config.ts` 파일의 `includeAssets` 옵션에 해당 아이콘 파일명들을 추가합니다.
  - **작업 파일**: `vite.config.ts`

## 3. 구현 단계
1. **`vite.config.ts` 수정**: `includeAssets` 배열에 `'pwa-192x192.png', 'pwa-512x512.png'` 추가.
2. **`src/app/routes.tsx` 수정**: 라우터의 `Component` 컴포넌트 임포트 방식을 `React.lazy` 또는 개별 경로 직접 임포트로 변경하여 초기화 순서 충돌 및 `ReferenceError` 제거.
3. **빌드 검증**: 정상 빌드 및 에셋 복사, PWA 업데이트 캐시 전략 확인.