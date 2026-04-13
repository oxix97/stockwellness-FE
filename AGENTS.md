# AGENTS.md

Codex가 이 저장소에서 작업할 때 참조하는 가이드입니다.
코드 생성·수정 시 이 파일의 규칙을 반드시 따르세요.

---

## 명령어

```bash
npm run dev          # Vite 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드
npm test             # Vitest 단위/컴포넌트 테스트
npm run test:e2e     # Playwright E2E 테스트 (dev 서버 필요)

# 단일 파일 실행
npx vitest run src/api/__tests__/sector.test.ts
npx playwright test tests/auth.e2e.spec.ts
```

> 패키지 매니저: `npm` 또는 `yarn` 모두 허용 — 한 세션 내에서 하나만 사용

---

## 환경 변수

```env
VITE_API_BASE_URL=<백엔드 URL>
VITE_APP_NAME=Stockwellness
```

- 개발 서버는 `/api`를 `VITE_API_BASE_URL`로 프록시
- `.env` 파일 커밋 **절대 금지**

---

## 아키텍처

**앱 성격:** React 19 + TypeScript SPA/PWA — 포트폴리오 분석 및 주식 백테스팅 서비스

**스택:** React 19 · Vite 6 · TS 5.9 · Tailwind 4 · TanStack Query v5 · Zustand · Axios · React Router 7 · Recharts · Framer Motion · Radix UI · RHF · Zod · Vitest · Playwright

### 레이어 구조

| 레이어 | 위치 | 역할 |
|---|---|---|
| API 클라이언트 | `src/api/` | Axios 인스턴스 + 도메인 모듈 (`authApi`, `portfolioApi`, `stockApi` 등) |
| 비즈니스 로직 | `src/hooks/` | TanStack Query 커스텀 훅 (`use-portfolio.ts`, `use-stock.ts` 등) |
| 화면 | `src/app/components/screens/` | 라우트 레벨 페이지 컴포넌트 |
| 공통 UI | `src/app/components/ui/`, `shared/` | Radix UI + Tailwind 원자 컴포넌트 |
| 전역 상태 | `src/store/auth.ts` | Zustand — 인증 전용 (memberId, email, nickname, portfolioId, accessToken) |
| 타입 | `src/types/` | 공유 TS 인터페이스 및 API 스키마 |

### 데이터 흐름 (엄수)

```
컴포넌트 → src/hooks/use-*.ts → src/api/[domain]Api.ts → src/api/client.ts → 백엔드
```

**컴포넌트에서 `src/api/`를 직접 import하는 것은 금지. 반드시 `src/hooks/`를 경유할 것.**

### 핵심 동작

- **API 클라이언트** (`src/api/client.ts`): Request 인터셉터에서 localStorage의 토큰을 `Authorization: Bearer`로 주입. Response 인터셉터에서 `response.data.data` 언래핑. 401 발생 시 `/api/v1/auth/reissue`로 토큰 재발급 후 재시도, 실패 시 `/login` 리다이렉트.
- **라우팅** (`src/app/routes.tsx`): 메인 라우트 (`/`, `/search`, `/portfolio`, `/watchlist`, `/more`)는 하단 네비 `<Layout>` 공유. 인증·상세 라우트는 Layout 없음.
- **서버 상태**: TanStack Query — `refetchOnWindowFocus: false`, `retry: 1`.
- **전역 상태**: Zustand + localStorage 영속화 (`"auth-storage"`). 서버 데이터는 저장 금지.

---

## 개발 가이드라인

### 네이밍 규칙

| 종류 | 패턴 | 예시 |
|---|---|---|
| 컴포넌트 파일 | `PascalCase.tsx` | `PortfolioCard.tsx` |
| 커스텀 훅 파일 | `use-camelCase.ts` | `use-portfolio.ts` |
| API 모듈 파일 | `camelCaseApi.ts` | `portfolioApi.ts` |
| Query Key 팩토리 | `[domain]Keys` | `portfolioKeys` |

### UI 규칙

- 레이아웃: Flex/Grid 사용 — `absolute` 포지셔닝 지양
- 기본 폰트: `14px` · 주요 액센트 컬러: `#2EBE7A`
- 날짜 형식: `Jun 10`
- 하단 툴바: 최대 4개 · Chips: 3개 이상 · Dropdown: 3개 이상 옵션일 때만

### 에러 처리

- 컴포넌트 에러 → `ErrorBoundary`
- 사용자 알림 → `sonner` 토스트
- API 에러 → `ApiError` 클래스로 통일 (`docs/error-handling.md` 참고)

### 폼

- 상태 관리: `React Hook Form` + `zodResolver`
- 유효성 검사 스키마: `Zod`

### 테스트

- 단위: `vi.mock`으로 API 모듈 및 auth 스토어 모킹
- E2E: Playwright 네트워크 인터셉션으로 OAuth + API 응답 모킹
- 위치: 대상 코드 옆 `__tests__/` · E2E는 `tests/`

---

## API 코드 작성 순서 (신규 엔드포인트 추가 시)

```
1. 타입 정의  →  2. API 함수 + Query Key  →  3. 커스텀 훅
```

→ 상세 패턴 및 예시: **`docs/api-layer.md`**
→ 실제 엔드포인트 목록 및 타입: **`docs/api-spec.md`**

---

## 절대 금지 사항

| ❌ 금지 | 이유 |
|---|---|
| `any` 타입 사용 | 타입 안전성 파괴 |
| 컴포넌트에서 `src/api/` 직접 import | 레이어 분리 위반 |
| Query Key 하드코딩 문자열 | 캐시 무효화 버그 유발 |
| `.env` 파일 커밋 | 보안 사고 |
| 프로덕션 코드에 `console.log` 잔류 | 로그 노출 |
| Zustand에 서버 데이터 저장 | TanStack Query 캐시와 이중화 |

---

## 문서 참조

| 주제 | 파일 |
|---|---|
| API 3계층 패턴 및 코드 예시 | `docs/api-layer.md` |
| 전체 API 엔드포인트 명세 및 타입 | `docs/api-spec.md` |
| 인증 흐름, 인터셉터, 토큰 전략 | `docs/auth.md` |
| TanStack Query 패턴 및 Query Key | `docs/tanstack-query.md` |
| 전체 도메인 Query Key 팩토리 목록 | `docs/query-keys.md` |
| 에러 처리 및 ApiError 클래스 | `docs/error-handling.md` |
| 단위/E2E 테스트 작성 패턴 | `docs/testing.md` |
| 디자인 가이드 인덱스 | `@docs/design/README.md` (**루트** `docs/design/`) |
| 화면별 레이아웃 설계 | `@docs/design/screen-{화면명}.md` (home·watchlist·portfolio·mypage) |
| 디자인 토큰 (색상·타이포·스페이싱) | `@docs/design/tokens.md` |
| 화면별 API 명세 | `@docs/specs/screen-api-mapping/{화면명}.md` (**루트** `docs/specs/`) |
